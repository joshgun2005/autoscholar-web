/**
 * /api/v1/sessions — Research Sessions (Anonymized)
 *
 * Access anonymized research session data:
 * topics, token usage, cost, tools used.
 */

import type { Express, Response } from "express";
import { storage } from "../../../storage";
import {
  authenticateApiKey, requireScope, paginate,
  ok, okPaginated, fail,
  type ApiRequest,
} from "../middleware";

export function registerSessionApiRoutes(app: Express) {
  const auth = authenticateApiKey;
  const read = requireScope("read");

  /**
   * GET /api/v1/sessions
   * List anonymized research sessions.
   * Query: ?page, ?limit, ?sort (newest|oldest|cost|tokens)
   */
  app.get("/api/v1/sessions", auth, read, paginate(20, 100), async (req: ApiRequest, res: Response) => {
    try {
      let sessions = await storage.getAllConversationSessions();

      const { sort } = req.query;
      switch (sort) {
        case "oldest": sessions.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()); break;
        case "cost": sessions.sort((a, b) => (b.totalCost || 0) - (a.totalCost || 0)); break;
        case "tokens": sessions.sort((a, b) => ((b.inputTokens || 0) + (b.outputTokens || 0)) - ((a.inputTokens || 0) + (a.outputTokens || 0))); break;
        default: sessions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }

      const total = sessions.length;
      const { offset, limit } = req.pagination!;
      const page = sessions.slice(offset, offset + limit);

      const items = page.map(s => {
        // Parse messages to extract tool/code stats without exposing content
        let messageCount = 0;
        let pythonCodeCount = 0;
        let searchQueryCount = 0;
        let toolNames: string[] = [];
        try {
          const msgs = typeof s.messages === "string" ? JSON.parse(s.messages) : s.messages;
          if (Array.isArray(msgs)) {
            messageCount = msgs.length;
            for (const msg of msgs) {
              if (msg.pythonCodeEntries?.length) pythonCodeCount += msg.pythonCodeEntries.length;
              if (msg.searchQueries?.length) searchQueryCount += msg.searchQueries.length;
              if (msg.toolResults && Array.isArray(msg.toolResults)) {
                for (const tr of msg.toolResults) {
                  if (tr.toolName && !toolNames.includes(tr.toolName)) toolNames.push(tr.toolName);
                }
              }
            }
          }
        } catch {}

        return {
          sessionId: s.sessionId,
          title: s.title,
          messageCount,
          inputTokens: s.inputTokens,
          outputTokens: s.outputTokens,
          totalCost: s.totalCost,
          pythonExecutions: pythonCodeCount,
          searchQueries: searchQueryCount,
          toolsUsed: toolNames,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
        };
      });

      return okPaginated(res, items, total, req.pagination!);
    } catch (error) {
      return fail(res, "Failed to fetch sessions.", 500);
    }
  });

  /**
   * GET /api/v1/sessions/stats
   * Aggregate session statistics.
   */
  app.get("/api/v1/sessions/stats", auth, read, async (_req: ApiRequest, res: Response) => {
    try {
      const sessions = await storage.getAllConversationSessions();

      const totalSessions = sessions.length;
      const totalInputTokens = sessions.reduce((s, se) => s + (se.inputTokens || 0), 0);
      const totalOutputTokens = sessions.reduce((s, se) => s + (se.outputTokens || 0), 0);
      const totalCost = sessions.reduce((s, se) => s + (se.totalCost || 0), 0);

      // Sessions over time (by day)
      const dailyMap = new Map<string, number>();
      for (const s of sessions) {
        const day = new Date(s.createdAt).toISOString().slice(0, 10);
        dailyMap.set(day, (dailyMap.get(day) || 0) + 1);
      }

      const avgTokensPerSession = totalSessions > 0
        ? Math.round((totalInputTokens + totalOutputTokens) / totalSessions)
        : 0;

      return ok(res, {
        totalSessions,
        totalInputTokens,
        totalOutputTokens,
        totalTokens: totalInputTokens + totalOutputTokens,
        totalCost,
        avgTokensPerSession,
        avgCostPerSession: totalSessions > 0 ? Math.round((totalCost / totalSessions) * 100) / 100 : 0,
        dailyActivity: Array.from(dailyMap.entries())
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => a.date.localeCompare(b.date))
          .slice(-30), // last 30 days
      });
    } catch (error) {
      return fail(res, "Failed to compute session stats.", 500);
    }
  });
}
