// ─── Live Paper Room — Simulation Hook ───────────────────────
// Provides a self-running mock simulation. To connect to real data later,
// replace the internals of this hook with SSE/WebSocket/polling logic
// while keeping the return type identical.

import { useState, useEffect, useRef, useCallback } from "react";
import type { LivePaperState } from "./types";
import { createInitialState, SCHEDULED_EVENTS } from "./mock-data";

export function useLivePaperSimulation() {
  const [state, setState] = useState<LivePaperState>(createInitialState);
  const eventIndexRef = useRef(0);
  const startTimeRef = useRef(Date.now());

  // Elapsed time ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setState(prev => ({
        ...prev,
        elapsedSeconds: Math.floor((Date.now() - startTimeRef.current) / 1000) + 360,
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Scheduled event processor
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    for (let i = 0; i < SCHEDULED_EVENTS.length; i++) {
      const scheduled = SCHEDULED_EVENTS[i];
      const timer = setTimeout(() => {
        setState(prev => {
          const newEvent = {
            ...scheduled.event,
            id: `sim-${Date.now()}-${i}`,
            timestamp: Date.now(),
          };

          let next = {
            ...prev,
            events: [newEvent, ...prev.events],
            totalToolCalls: prev.totalToolCalls + 1,
            totalTokens: prev.totalTokens + Math.floor(Math.random() * 12_000 + 3_000),
          };

          const m = scheduled.mutations;
          if (!m) return next;

          if (m.status) next.status = m.status;
          if (m.progress !== undefined) next.progress = m.progress;

          if (m.sectionUpdates) {
            next.sections = next.sections.map(s => {
              const update = m.sectionUpdates!.find(u => u.id === s.id);
              if (!update) return s;
              return {
                ...s,
                ...update,
                updatedAt: Date.now(),
                recentChanges: update.recentChanges ?? s.recentChanges,
                content: update.content ?? s.content,
                wordCount: update.wordCount ?? s.wordCount,
              };
            });
          }

          if (m.agentUpdates) {
            next.agents = next.agents.map(a => {
              const update = m.agentUpdates!.find(u => u.id === a.id);
              if (!update) return a;
              return {
                ...a,
                ...update,
                lastActionAt: Date.now(),
                toolCalls: update.toolCalls ?? a.toolCalls,
                currentTask: update.currentTask !== undefined ? update.currentTask : a.currentTask,
                lastAction: update.lastAction !== undefined ? update.lastAction : a.lastAction,
              };
            });
            // Update activeAgentId
            const active = next.agents.find(a => a.status === "active");
            if (active) next.activeAgentId = active.id;
          }

          if (m.newFigure) {
            next.figures = [...next.figures, m.newFigure];
          }

          if (m.figureCompleted) {
            next.figures = next.figures.map(f =>
              f.id === m.figureCompleted ? { ...f, status: "completed" as const } : f
            );
          }

          if (m.newReference) {
            next.references = [...next.references, m.newReference];
          }

          return next;
        });
      }, scheduled.delayMs);

      timers.push(timer);
    }

    return () => timers.forEach(clearTimeout);
  }, []);

  return state;
}
