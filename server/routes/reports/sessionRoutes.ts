import type { Express, Request, Response } from "express";
import { storage } from "../../storage";
import { logger } from "../../utils/logger";
import { sessionBroadcaster } from "../../services/sessionBroadcaster";
import { getUserId } from "../auth";

export function registerSessionRoutes(app: Express) {

  // ─── Public: Live sessions for visitors (no auth) ──────
  app.get("/api/live-sessions", async (_req: Request, res: Response) => {
    try {
      const runningIds = sessionBroadcaster.getRunningSessionIds();

      // Build running sessions list from broadcaster + DB metadata
      const runningSessions: Array<{
        sessionId: string;
        title: string;
        status: "running" | "completed";
        startedAt: string;
        domain?: string;
      }> = [];

      const runningArray = Array.from(runningIds);
      for (const sid of runningArray) {
        const info = sessionBroadcaster.getSessionInfo(sid);
        // Try to get session title from DB
        const dbSession = await storage.getConversationSession(sid);
        runningSessions.push({
          sessionId: sid,
          title: dbSession?.title || info?.lastStatus || "Research in Progress",
          status: "running",
          startedAt: info ? new Date(info.startedAt).toISOString() : new Date().toISOString(),
        });
      }

      // Get recent completed paper runs (last 20)
      const paperRunsList = await storage.getAllPaperRuns(20);
      const recentCompleted = paperRunsList
        .filter(r => r.status === "published" || r.status === "completed" || r.status === "rejected")
        .slice(0, 10)
        .map(r => ({
          sessionId: r.sessionId ?? r.id,
          title: r.prompt?.slice(0, 120) || `${r.domain} — ${r.method}`,
          status: "completed" as const,
          startedAt: r.startedAt ? new Date(r.startedAt).toISOString() : String(r.createdAt),
          completedAt: r.completedAt ? new Date(r.completedAt).toISOString() : undefined,
          domain: r.domain || undefined,
          popperScore: r.popperScore ?? undefined,
        }));

      // Also include active paper runs that might not be in broadcaster yet
      const activeRuns = await storage.getAllActivePaperRuns();
      for (const run of activeRuns) {
        const sid = run.sessionId ?? run.id;
        if (!runningIds.has(sid as string)) {
          runningSessions.push({
            sessionId: sid,
            title: run.prompt?.slice(0, 120) || `${run.domain} — ${run.method}`,
            status: "running",
            startedAt: run.startedAt ? new Date(run.startedAt).toISOString() : String(run.createdAt),
            domain: run.domain || undefined,
          });
        }
      }

      res.json({
        running: runningSessions,
        recent: recentCompleted,
      });
    } catch (error) {
      logger.error("Live sessions error:", error);
      res.json({ running: [], recent: [] });
    }
  });

  // ─── Conversation Sessions ──────────────────────────────

  // Get all sessions for current user (with server-side running status)
  app.get("/api/sessions", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const sessions = await storage.getConversationSessions(userId);
      const runningIds = sessionBroadcaster.getRunningSessionIds();

      res.json(sessions.map(session => ({
        sessionId: session.sessionId,
        title: session.title,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        status: runningIds.has(session.sessionId) ? "running" : "completed",
      })));
    } catch (error) {
      logger.error("Get sessions error:", error);
      res.status(500).json({ error: "Failed to get sessions" });
    }
  });

  // Check if a specific session is still running
  app.get("/api/sessions/:sessionId/status", async (req: Request, res: Response) => {
    const { sessionId } = req.params;
    const info = sessionBroadcaster.getSessionInfo(sessionId);
    if (info) {
      res.json({ status: "running", lastStatus: info.lastStatus, startedAt: info.startedAt });
    } else {
      res.json({ status: "completed" });
    }
  });

  // SSE stream — reconnect to a running session's live events
  app.get("/api/sessions/:sessionId/stream", async (req: Request, res: Response) => {
    const { sessionId } = req.params;

    // Check if session is running
    if (!sessionBroadcaster.isRunning(sessionId)) {
      // Not running — return a single "session_ended" event so client knows
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache, no-transform");
      res.setHeader("Connection", "keep-alive");
      res.setHeader("X-Accel-Buffering", "no");
      res.setHeader("Content-Encoding", "none");
      res.flushHeaders();
      res.write(`data: ${JSON.stringify({ type: "session_ended" })}\n\n`);
      res.end();
      return;
    }

    // Set up SSE
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.setHeader("Content-Encoding", "none");
    res.flushHeaders();

    // Subscribe and get buffered events for catch-up
    const bufferedEvents = sessionBroadcaster.subscribe(sessionId, res);
    if (!bufferedEvents) {
      // Race: session ended between check and subscribe
      res.write(`data: ${JSON.stringify({ type: "session_ended" })}\n\n`);
      res.end();
      return;
    }

    // Replay buffered events so the client catches up
    for (const event of bufferedEvents) {
      try {
        if (!res.writableEnded && !res.destroyed) {
          res.write(`data: ${event}\n\n`);
        }
      } catch { break; }
    }
    // @ts-ignore
    if (res.flush) res.flush();

    // The connection stays open. New events will be pushed by the broadcaster.
    // The connection will be closed when:
    // 1. The session ends (broadcaster sends session_ended and closes)
    // 2. The client disconnects (handled by the 'close' event in subscribe())
  });

  // Get all Python code entries across all sessions
  app.get("/api/python-code-history", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const sessions = await storage.getConversationSessions(userId);

      const codeEntries: Array<{
        id: string;
        code: string;
        description: string;
        timestamp: number;
        status: string;
        error?: string;
        duration?: number;
        sessionTitle: string;
        sessionId: string;
        question: string;
      }> = [];

      for (const session of sessions) {
        try {
          const msgs = typeof session.messages === 'string' ? JSON.parse(session.messages) : session.messages;
          if (!Array.isArray(msgs)) continue;

          for (const msg of msgs) {
            if (msg.pythonCodeEntries && Array.isArray(msg.pythonCodeEntries)) {
              for (const entry of msg.pythonCodeEntries) {
                if (!entry.code) continue;
                codeEntries.push({
                  id: entry.id || `py-${codeEntries.length}`,
                  code: entry.code,
                  description: entry.description || 'Python analysis',
                  timestamp: entry.timestamp || new Date(session.createdAt).getTime(),
                  status: entry.status || 'completed',
                  error: entry.error,
                  duration: entry.duration,
                  sessionTitle: session.title,
                  sessionId: session.sessionId,
                  question: msg.question || session.title,
                });
              }
            }
          }
        } catch {
          // skip malformed session
        }
      }

      // Sort newest first
      codeEntries.sort((a, b) => b.timestamp - a.timestamp);

      res.json(codeEntries);
    } catch (error) {
      logger.error("Get python code history error:", error);
      res.status(500).json({ error: "Failed to get python code history" });
    }
  });

  // Get specific session with messages (includes running status)
  app.get("/api/sessions/:sessionId", async (req: Request, res: Response) => {
    try {
      const userId = getUserId(req);
      const { sessionId } = req.params;

      let session;
      if (userId) {
        session = await storage.getConversationSessionByUserAndSessionId(sessionId, userId);
      } else {
        session = await storage.getConversationSession(sessionId);
      }

      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      res.json({
        sessionId: session.sessionId,
        title: session.title,
        messages: session.messages,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        status: sessionBroadcaster.isRunning(session.sessionId) ? "running" : "completed",
      });
    } catch (error) {
      logger.error("Get session error:", error);
      res.status(500).json({ error: "Failed to get session" });
    }
  });
}
