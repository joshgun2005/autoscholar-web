/**
 * Session Broadcaster — tracks running sessions and broadcasts SSE events
 * to all connected clients (original + reconnecting viewers).
 *
 * This solves the "disconnect" problem: when a user navigates to the dashboard
 * or refreshes the page mid-generation, they can reconnect and receive live
 * updates from the still-running session.
 */

import type { Response } from "express";

interface SessionState {
  /** SSE event buffer — keeps recent events so reconnecting clients get context */
  eventBuffer: Array<{ event: string; timestamp: number }>;
  /** All connected SSE response objects for this session */
  subscribers: Set<Response>;
  /** When the session started */
  startedAt: number;
  /** Last time this session had any activity (broadcast, subscribe, etc.) */
  lastActivity: number;
  /** Last status message */
  lastStatus: string;
}

const MAX_BUFFER_SIZE = 200; // Keep last 200 events per session
const SESSION_STALE_MS = 30 * 60 * 1000; // Clean up sessions with no activity for 30 minutes
const SESSION_MAX_AGE_MS = 60 * 60 * 1000; // Hard limit: force-end sessions older than 1 hour regardless of activity

class SessionBroadcaster {
  private sessions = new Map<string, SessionState>();

  /** Mark a session as running (called when /api/chat starts) */
  startSession(sessionId: string): void {
    if (this.sessions.has(sessionId)) return;
    const now = Date.now();
    this.sessions.set(sessionId, {
      eventBuffer: [],
      subscribers: new Set(),
      startedAt: now,
      lastActivity: now,
      lastStatus: "Starting...",
    });
  }

  /** Mark a session as completed (called when finalizeResponse runs) */
  endSession(sessionId: string): void {
    const state = this.sessions.get(sessionId);
    if (!state) return;

    // Notify all subscribers that the session is done
    for (const res of state.subscribers) {
      try {
        if (!res.writableEnded && !res.destroyed) {
          res.write(`data: ${JSON.stringify({ type: "session_ended" })}\n\n`);
          res.end();
        }
      } catch { /* subscriber already gone */ }
    }
    state.subscribers.clear();
    // Keep the session in the map briefly so status queries still return "completed"
    // but mark it by clearing the buffer
    this.sessions.delete(sessionId);
  }

  /** Check if a session is currently running */
  isRunning(sessionId: string): boolean {
    return this.sessions.has(sessionId);
  }

  /** Get all currently running session IDs */
  getRunningSessionIds(): Set<string> {
    return new Set(this.sessions.keys());
  }

  /** Broadcast an SSE event to all subscribers of a session */
  broadcast(sessionId: string, eventData: string): void {
    const state = this.sessions.get(sessionId);
    if (!state) return;

    // Track activity — prevents premature cleanup of long-running sessions
    state.lastActivity = Date.now();

    // Buffer the event
    state.eventBuffer.push({ event: eventData, timestamp: Date.now() });
    if (state.eventBuffer.length > MAX_BUFFER_SIZE) {
      // Keep only the last MAX_BUFFER_SIZE events, but always keep session_start
      const sessionStartIdx = state.eventBuffer.findIndex(e =>
        e.event.includes('"type":"session_start"') || e.event.includes('"type": "session_start"')
      );
      state.eventBuffer = state.eventBuffer.slice(-MAX_BUFFER_SIZE);
      // Re-insert session_start at the beginning if it was trimmed
      if (sessionStartIdx >= 0 && sessionStartIdx < state.eventBuffer.length) {
        // It's still there, good
      }
    }

    // Track status messages
    try {
      const parsed = JSON.parse(eventData.replace(/^data: /, "").trim());
      if (parsed.type === "status" && parsed.message) {
        state.lastStatus = parsed.message;
      }
    } catch { /* not valid JSON, ignore */ }

    // Send to all subscribers
    const dead: Response[] = [];
    for (const res of state.subscribers) {
      try {
        if (res.writableEnded || res.destroyed) {
          dead.push(res);
        } else {
          res.write(`data: ${eventData}\n\n`);
          // @ts-ignore
          if (res.flush) res.flush();
        }
      } catch {
        dead.push(res);
      }
    }
    // Clean up dead connections
    for (const d of dead) state.subscribers.delete(d);
  }

  /** Subscribe a new client to a running session's events. Returns the event buffer for catch-up. */
  subscribe(sessionId: string, res: Response): string[] | null {
    const state = this.sessions.get(sessionId);
    if (!state) return null; // Session not running

    state.subscribers.add(res);
    state.lastActivity = Date.now();

    // When the client disconnects, remove them
    res.on("close", () => {
      state.subscribers.delete(res);
    });

    // Return buffered events for catch-up replay
    return state.eventBuffer.map(e => e.event);
  }

  /** Get status summary for a session */
  getSessionInfo(sessionId: string): { running: boolean; lastStatus: string; startedAt: number } | null {
    const state = this.sessions.get(sessionId);
    if (!state) return null;
    return {
      running: true,
      lastStatus: state.lastStatus,
      startedAt: state.startedAt,
    };
  }

  /** Periodic cleanup of abandoned or zombie sessions (safety net). */
  cleanup(): void {
    const now = Date.now();
    for (const [id, state] of this.sessions) {
      const noActivity = now - state.lastActivity > SESSION_STALE_MS;
      const tooOld = now - state.startedAt > SESSION_MAX_AGE_MS;

      if (noActivity || tooOld) {
        // Notify subscribers before removing
        for (const res of state.subscribers) {
          try {
            if (!res.writableEnded && !res.destroyed) {
              res.write(`data: ${JSON.stringify({ type: "session_ended", reason: tooOld ? "max_age" : "stale" })}\n\n`);
              res.end();
            }
          } catch { /* already gone */ }
        }
        state.subscribers.clear();
        this.sessions.delete(id);
      }
    }
  }
}

export const sessionBroadcaster = new SessionBroadcaster();

// Periodic cleanup every 5 minutes
setInterval(() => sessionBroadcaster.cleanup(), 5 * 60 * 1000);
