import type { Express, Request, Response } from "express";
import { storage } from "../../storage";
import { logger } from "../../utils/logger";

export function registerPlatformRoutes(app: Express) {
  // ─── Platform Stats (research ticker) ────────────
  app.get("/api/platform/stats", async (_req: Request, res: Response) => {
    try {
      const papers = await storage.getAllPublishedPapers();
      const sessions = await storage.getAllConversationSessions();

      // Paper-level aggregates
      const totalPapers = papers.length;
      const totalWords = papers.reduce((s, p) => s + (p.wordCount || 0), 0);
      const totalFigures = papers.reduce((s, p) => s + (p.figureCount || 0), 0);
      const totalSections = papers.reduce((s, p) => s + (p.sectionCount || 0), 0);
      const uniqueDomains = new Set(papers.map(p => p.domain).filter(Boolean)).size;

      // Estimate LaTeX lines from latexContent JSON
      let totalLatexLines = 0;
      for (const p of papers) {
        if (p.latexContent) {
          try {
            const sections = JSON.parse(p.latexContent);
            if (Array.isArray(sections)) {
              for (const sec of sections) {
                if (sec.latex_content) {
                  totalLatexLines += sec.latex_content.split('\n').length;
                }
              }
            }
          } catch { /* skip */ }
        }
      }

      // Session-level: count Python code executions & lines + cost
      let totalPythonExecutions = 0;
      let totalPythonLines = 0;
      const totalSessionsCount = sessions.length;
      let totalTokens = 0;
      let totalApiCost = 0;

      for (const session of sessions) {
        totalTokens += (session.inputTokens || 0) + (session.outputTokens || 0);
        totalApiCost += (session.totalCost || 0);
        try {
          const msgs = typeof session.messages === 'string' ? JSON.parse(session.messages) : session.messages;
          if (!Array.isArray(msgs)) continue;
          for (const msg of msgs) {
            if (msg.pythonCodeEntries && Array.isArray(msg.pythonCodeEntries)) {
              for (const entry of msg.pythonCodeEntries) {
                totalPythonExecutions++;
                if (entry.code) {
                  totalPythonLines += entry.code.split('\n').length;
                }
              }
            }
          }
        } catch { /* skip malformed */ }
      }

      // Recent analytics for extra metrics
      const recentMetrics = await storage.getLatestMetrics("hourly", 168); // last 7 days
      const totalSearchQueries = recentMetrics.reduce((s: number, m: any) => s + (m.searchQueries || 0), 0);

      // Use tracked cost from sessions; if too low (tracking started later), fall back to known baseline
      const KNOWN_BASELINE_COST = 679.51; // USD — total API cost as of 2026-03-13
      const effectiveCost = totalApiCost >= KNOWN_BASELINE_COST ? totalApiCost : KNOWN_BASELINE_COST;
      const avgCostPerPaper = totalPapers > 0 ? effectiveCost / totalPapers : 0;

      res.json({
        totalPapers,
        totalWords,
        totalFigures,
        totalSections,
        totalLatexLines,
        uniqueDomains,
        totalPythonExecutions,
        totalPythonLines,
        totalSessions: totalSessionsCount,
        totalTokens,
        totalSearchQueries,
        totalApiCost: effectiveCost,
        avgCostPerPaper,
      });
    } catch (error) {
      logger.error("Platform stats error:", error);
      res.status(500).json({ error: "Failed to compute platform stats" });
    }
  });
}
