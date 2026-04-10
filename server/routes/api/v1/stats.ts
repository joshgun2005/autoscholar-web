/**
 * /api/v1/stats — Platform Statistics & Metrics
 *
 * Aggregate statistics about the AutoScholar platform:
 * paper counts, token usage, cost, domains, research output.
 */

import type { Express, Response } from "express";
import { storage } from "../../../storage";
import {
  authenticateApiKey, requireScope,
  ok, fail,
  type ApiRequest,
} from "../middleware";

export function registerStatsRoutes(app: Express) {
  const auth = authenticateApiKey;
  const read = requireScope("read");

  /**
   * GET /api/v1/stats/platform
   * Comprehensive platform-wide statistics.
   */
  app.get("/api/v1/stats/platform", auth, read, async (_req: ApiRequest, res: Response) => {
    try {
      const papers = await storage.getAllPublishedPapers();
      const sessions = await storage.getAllConversationSessions();

      const totalPapers = papers.length;
      const totalWords = papers.reduce((s, p) => s + (p.wordCount || 0), 0);
      const totalFigures = papers.reduce((s, p) => s + (p.figureCount || 0), 0);
      const totalSections = papers.reduce((s, p) => s + (p.sectionCount || 0), 0);
      const uniqueDomains = new Set(papers.map(p => p.domain).filter(Boolean)).size;

      let totalLatexLines = 0;
      for (const p of papers) {
        if (p.latexContent) {
          try {
            const sections = JSON.parse(p.latexContent);
            if (Array.isArray(sections)) {
              for (const sec of sections) {
                if (sec.latex_content) totalLatexLines += sec.latex_content.split("\n").length;
              }
            }
          } catch {}
        }
      }

      let totalPythonExecutions = 0;
      let totalPythonLines = 0;
      let totalTokens = 0;
      let totalApiCost = 0;

      for (const session of sessions) {
        totalTokens += (session.inputTokens || 0) + (session.outputTokens || 0);
        totalApiCost += (session.totalCost || 0);
        try {
          const msgs = typeof session.messages === "string" ? JSON.parse(session.messages) : session.messages;
          if (!Array.isArray(msgs)) continue;
          for (const msg of msgs) {
            if (msg.pythonCodeEntries && Array.isArray(msg.pythonCodeEntries)) {
              for (const entry of msg.pythonCodeEntries) {
                totalPythonExecutions++;
                if (entry.code) totalPythonLines += entry.code.split("\n").length;
              }
            }
          }
        } catch {}
      }

      const KNOWN_BASELINE_COST = 679.51;
      const effectiveCost = totalApiCost >= KNOWN_BASELINE_COST ? totalApiCost : KNOWN_BASELINE_COST;

      return ok(res, {
        papers: {
          total: totalPapers,
          totalWords,
          totalFigures,
          totalSections,
          totalLatexLines,
          uniqueDomains,
          avgWordsPerPaper: totalPapers > 0 ? Math.round(totalWords / totalPapers) : 0,
          avgFiguresPerPaper: totalPapers > 0 ? Math.round((totalFigures / totalPapers) * 10) / 10 : 0,
        },
        sessions: {
          total: sessions.length,
          totalTokens,
          totalInputTokens: sessions.reduce((s, se) => s + (se.inputTokens || 0), 0),
          totalOutputTokens: sessions.reduce((s, se) => s + (se.outputTokens || 0), 0),
        },
        compute: {
          totalApiCost: effectiveCost,
          avgCostPerPaper: totalPapers > 0 ? Math.round((effectiveCost / totalPapers) * 100) / 100 : 0,
          totalPythonExecutions,
          totalPythonLines,
        },
      });
    } catch (error) {
      return fail(res, "Failed to compute platform stats.", 500);
    }
  });

  /**
   * GET /api/v1/stats/domains
   * Domain distribution with detailed metrics per domain.
   */
  app.get("/api/v1/stats/domains", auth, read, async (_req: ApiRequest, res: Response) => {
    try {
      const papers = await storage.getJournalPapers();
      const domainMap = new Map<string, { count: number; totalWords: number; totalFigures: number; papers: string[] }>();

      for (const p of papers) {
        const d = p.domain || "unclassified";
        if (!domainMap.has(d)) domainMap.set(d, { count: 0, totalWords: 0, totalFigures: 0, papers: [] });
        const entry = domainMap.get(d)!;
        entry.count++;
        entry.totalWords += p.wordCount || 0;
        entry.totalFigures += p.figureCount || 0;
        entry.papers.push(p.id);
      }

      const domains = Array.from(domainMap.entries())
        .map(([domain, stats]) => ({
          domain,
          paperCount: stats.count,
          totalWords: stats.totalWords,
          avgWords: Math.round(stats.totalWords / stats.count),
          totalFigures: stats.totalFigures,
          paperIds: stats.papers,
        }))
        .sort((a, b) => b.paperCount - a.paperCount);

      return ok(res, domains);
    } catch (error) {
      return fail(res, "Failed to compute domain stats.", 500);
    }
  });

  /**
   * GET /api/v1/stats/timeline
   * Paper publication timeline (grouped by month).
   */
  app.get("/api/v1/stats/timeline", auth, read, async (_req: ApiRequest, res: Response) => {
    try {
      const papers = await storage.getJournalPapers();
      const monthMap = new Map<string, { count: number; words: number; figures: number }>();

      for (const p of papers) {
        const date = new Date(p.publishedAt);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        if (!monthMap.has(key)) monthMap.set(key, { count: 0, words: 0, figures: 0 });
        const entry = monthMap.get(key)!;
        entry.count++;
        entry.words += p.wordCount || 0;
        entry.figures += p.figureCount || 0;
      }

      const timeline = Array.from(monthMap.entries())
        .map(([month, stats]) => ({ month, ...stats }))
        .sort((a, b) => a.month.localeCompare(b.month));

      return ok(res, timeline);
    } catch (error) {
      return fail(res, "Failed to compute timeline.", 500);
    }
  });

  /**
   * GET /api/v1/stats/analytics
   * Time-series analytics metrics.
   * Query: ?period (minute|hour|day), ?limit (default 60)
   */
  app.get("/api/v1/stats/analytics", auth, read, async (req: ApiRequest, res: Response) => {
    try {
      const period = String(req.query.period || "hour");
      const limit = Math.min(500, Math.max(1, parseInt(req.query.limit as string) || 60));
      const metrics = await storage.getLatestMetrics(period, limit);

      return ok(res, metrics.map(m => ({
        timestamp: m.timestamp,
        requests: { total: m.totalRequests, successful: m.successfulRequests, failed: m.failedRequests },
        users: { active: m.activeUsers, unique: m.uniqueVisitors },
        performance: { avgResponseTime: m.averageResponseTime, peakResponseTime: m.peakResponseTime },
        tokens: { generated: m.tokensGenerated, estimatedCost: m.estimatedCost },
        tools: { calls: m.toolCallsCount, python: m.pythonExecutions, searches: m.searchQueries },
        errors: { count: m.errorCount, rate: m.errorRate },
        period: m.periodType,
      })));
    } catch (error) {
      return fail(res, "Failed to fetch analytics.", 500);
    }
  });
}
