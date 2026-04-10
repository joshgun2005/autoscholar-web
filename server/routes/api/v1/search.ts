/**
 * /api/v1/search — Cross-Resource Search
 *
 * Unified search across papers, reports, and prompts.
 */

import type { Express, Response } from "express";
import { storage } from "../../../storage";
import {
  authenticateApiKey, requireScope, paginate,
  ok, okPaginated, fail,
  type ApiRequest,
} from "../middleware";

export function registerSearchRoutes(app: Express) {
  const auth = authenticateApiKey;
  const search = requireScope("read", "search");

  /**
   * GET /api/v1/search
   * Full-text search across papers, reports, and prompts.
   * Query: ?q (required), ?type (papers|reports|prompts|all), ?page, ?limit
   */
  app.get("/api/v1/search", auth, search, paginate(20, 100), async (req: ApiRequest, res: Response) => {
    try {
      const q = String(req.query.q || "").trim().toLowerCase();
      if (!q || q.length < 2) {
        return fail(res, "Query parameter 'q' is required (min 2 characters).");
      }

      const type = String(req.query.type || "all");
      const results: Array<{ type: string; id: string; title: string; snippet: string; score: number; createdAt: Date | string }> = [];

      // Search papers
      if (type === "all" || type === "papers") {
        const papers = await storage.getJournalPapers();
        for (const p of papers) {
          const titleMatch = p.title.toLowerCase().includes(q);
          const abstractMatch = (p.abstract || "").toLowerCase().includes(q);
          const keywordMatch = (p.keywords || "").toLowerCase().includes(q);
          const authorMatch = (p.authors || "").toLowerCase().includes(q);

          if (titleMatch || abstractMatch || keywordMatch || authorMatch) {
            let score = 0;
            if (titleMatch) score += 10;
            if (abstractMatch) score += 5;
            if (keywordMatch) score += 3;
            if (authorMatch) score += 2;

            results.push({
              type: "paper",
              id: p.id,
              title: p.title,
              snippet: p.abstract?.slice(0, 300) || p.title,
              score,
              createdAt: p.publishedAt,
            });
          }
        }
      }

      // Search reports
      if (type === "all" || type === "reports") {
        const reports = await storage.getAllSharedReports();
        for (const r of reports) {
          const questionMatch = r.question.toLowerCase().includes(q);
          const answerMatch = r.answer.toLowerCase().includes(q);

          if (questionMatch || answerMatch) {
            let score = 0;
            if (questionMatch) score += 8;
            if (answerMatch) score += 4;

            results.push({
              type: "report",
              id: r.shareId,
              title: r.question.slice(0, 120),
              snippet: r.answer.slice(0, 300),
              score,
              createdAt: r.createdAt,
            });
          }
        }
      }

      // Search prompts
      if (type === "all" || type === "prompts") {
        const prompts = await storage.getAllSavedPrompts();
        for (const p of prompts) {
          const titleMatch = p.title.toLowerCase().includes(q);
          const contentMatch = p.content.toLowerCase().includes(q);

          if (titleMatch || contentMatch) {
            let score = 0;
            if (titleMatch) score += 8;
            if (contentMatch) score += 3;

            results.push({
              type: "prompt",
              id: p.id,
              title: p.title,
              snippet: p.content.slice(0, 300),
              score,
              createdAt: p.createdAt,
            });
          }
        }
      }

      // Sort by relevance score
      results.sort((a, b) => b.score - a.score);

      const total = results.length;
      const { offset, limit } = req.pagination!;
      const page = results.slice(offset, offset + limit);

      return okPaginated(res, page, total, req.pagination!);
    } catch (error) {
      return fail(res, "Search failed.", 500);
    }
  });

  /**
   * GET /api/v1/search/papers
   * Search only papers with advanced filters.
   * Query: ?q, ?domain, ?author, ?year, ?min_words, ?max_words, ?page, ?limit
   */
  app.get("/api/v1/search/papers", auth, search, paginate(20, 100), async (req: ApiRequest, res: Response) => {
    try {
      let papers = await storage.getJournalPapers();

      const { q, domain, author, year, min_words, max_words } = req.query;

      if (q) {
        const search = String(q).toLowerCase();
        papers = papers.filter(p =>
          p.title.toLowerCase().includes(search) ||
          (p.abstract || "").toLowerCase().includes(search) ||
          (p.keywords || "").toLowerCase().includes(search)
        );
      }
      if (domain) papers = papers.filter(p => p.domain?.toLowerCase() === String(domain).toLowerCase());
      if (author) papers = papers.filter(p => (p.authors || "").toLowerCase().includes(String(author).toLowerCase()));
      if (year) papers = papers.filter(p => new Date(p.publishedAt).getFullYear() === Number(year));
      if (min_words) papers = papers.filter(p => (p.wordCount || 0) >= Number(min_words));
      if (max_words) papers = papers.filter(p => (p.wordCount || 0) <= Number(max_words));

      const total = papers.length;
      const { offset, limit } = req.pagination!;
      const page = papers.slice(offset, offset + limit);

      const items = page.map(p => ({
        id: p.id,
        asid: p.asid,
        title: p.title,
        abstract: p.abstract,
        authors: p.authors,
        keywords: safeJson(p.keywords, []),
        domain: p.domain,
        template: p.template,
        wordCount: p.wordCount,
        figureCount: p.figureCount,
        publishedAt: p.publishedAt,
      }));

      return okPaginated(res, items, total, req.pagination!);
    } catch (error) {
      return fail(res, "Paper search failed.", 500);
    }
  });
}

function safeJson(raw: string | null | undefined, fallback: any): any {
  if (!raw) return fallback;
  try { return JSON.parse(raw); } catch { return fallback; }
}
