/**
 * /api/v1/papers — Published Research Papers
 *
 * Full access to AutoScholar's published paper corpus:
 * metadata, LaTeX content, BibTeX, figures, downloads.
 */

import type { Express, Response } from "express";
import { storage } from "../../../storage";
import {
  authenticateApiKey, requireScope, paginate,
  ok, okPaginated, fail,
  type ApiRequest,
} from "../middleware";

export function registerPaperRoutes(app: Express) {
  const auth = authenticateApiKey;
  const read = requireScope("read");
  const download = requireScope("read", "download");

  /**
   * GET /api/v1/papers
   * List published papers with optional filtering.
   * Query: ?page, ?limit, ?domain, ?template, ?author, ?keyword, ?sort (newest|oldest|words|figures), ?q (title search)
   */
  app.get("/api/v1/papers", auth, read, paginate(20, 100), async (req: ApiRequest, res: Response) => {
    try {
      let papers = await storage.getJournalPapers();

      // Filtering
      const { domain, template, author, keyword, q, sort } = req.query;
      if (domain) papers = papers.filter(p => p.domain?.toLowerCase() === String(domain).toLowerCase());
      if (template) papers = papers.filter(p => p.template === String(template));
      if (author) papers = papers.filter(p => p.authors?.toLowerCase().includes(String(author).toLowerCase()));
      if (keyword) {
        const kw = String(keyword).toLowerCase();
        papers = papers.filter(p => {
          try {
            const keywords = JSON.parse(p.keywords || "[]");
            return keywords.some((k: string) => k.toLowerCase().includes(kw));
          } catch { return false; }
        });
      }
      if (q) {
        const search = String(q).toLowerCase();
        papers = papers.filter(p =>
          p.title.toLowerCase().includes(search) ||
          (p.abstract || "").toLowerCase().includes(search)
        );
      }

      // Sorting
      switch (sort) {
        case "oldest": papers.sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()); break;
        case "words": papers.sort((a, b) => (b.wordCount || 0) - (a.wordCount || 0)); break;
        case "figures": papers.sort((a, b) => (b.figureCount || 0) - (a.figureCount || 0)); break;
        default: papers.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
      }

      const total = papers.length;
      const { offset, limit } = req.pagination!;
      const page = papers.slice(offset, offset + limit);

      // Cost data
      let costs: Awaited<ReturnType<typeof storage.getJournalPaperCosts>> = [];
      try { costs = await storage.getJournalPaperCosts(); } catch {}
      const costMap = new Map(costs.map(c => [c.paperId, c]));

      const items = page.map(({ latexContent, bibtexEntries, ...p }) => ({
        id: p.id,
        asid: p.asid,
        title: p.title,
        abstract: p.abstract,
        authors: p.authors,
        keywords: safeJson(p.keywords, []),
        template: p.template,
        domain: p.domain,
        wordCount: p.wordCount,
        sectionCount: p.sectionCount,
        figureCount: p.figureCount,
        authorName: p.authorName,
        downloadUrl: p.downloadUrl,
        projectZipUrl: p.projectZipUrl,
        generationCost: costMap.get(p.id)?.totalCost ?? null,
        inputTokens: costMap.get(p.id)?.inputTokens ?? null,
        outputTokens: costMap.get(p.id)?.outputTokens ?? null,
        publishedAt: p.publishedAt,
      }));

      return okPaginated(res, items, total, req.pagination!);
    } catch (error) {
      return fail(res, "Failed to fetch papers.", 500);
    }
  });

  /**
   * GET /api/v1/papers/:id
   * Get full paper details by ID (includes LaTeX sections & BibTeX).
   */
  app.get("/api/v1/papers/:id", auth, read, async (req: ApiRequest, res: Response) => {
    try {
      let paper = await storage.getPublishedPaperById(req.params.id);
      if (!paper) {
        // Try ASID lookup
        paper = await storage.getPublishedPaperByAsid(req.params.id);
      }
      if (!paper) return fail(res, "Paper not found.", 404);

      return ok(res, {
        id: paper.id,
        asid: paper.asid,
        title: paper.title,
        abstract: paper.abstract,
        authors: paper.authors,
        keywords: safeJson(paper.keywords, []),
        template: paper.template,
        domain: paper.domain,
        wordCount: paper.wordCount,
        sectionCount: paper.sectionCount,
        figureCount: paper.figureCount,
        authorName: paper.authorName,
        downloadUrl: paper.downloadUrl,
        projectZipUrl: paper.projectZipUrl,
        latexSections: safeJson(paper.latexContent, []),
        bibtexEntries: paper.bibtexEntries,
        publishedAt: paper.publishedAt,
      });
    } catch (error) {
      return fail(res, "Failed to fetch paper.", 500);
    }
  });

  /**
   * GET /api/v1/papers/:id/latex
   * Get only the LaTeX content for a paper (sections array).
   */
  app.get("/api/v1/papers/:id/latex", auth, read, async (req: ApiRequest, res: Response) => {
    try {
      let paper = await storage.getPublishedPaperById(req.params.id);
      if (!paper) paper = await storage.getPublishedPaperByAsid(req.params.id);
      if (!paper) return fail(res, "Paper not found.", 404);

      return ok(res, {
        id: paper.id,
        asid: paper.asid,
        title: paper.title,
        sections: safeJson(paper.latexContent, []),
        bibtex: paper.bibtexEntries,
      });
    } catch (error) {
      return fail(res, "Failed to fetch LaTeX content.", 500);
    }
  });

  /**
   * GET /api/v1/papers/:id/bibtex
   * Get BibTeX citation for a paper (text/plain).
   */
  app.get("/api/v1/papers/:id/bibtex", auth, read, async (req: ApiRequest, res: Response) => {
    try {
      let paper = await storage.getPublishedPaperById(req.params.id);
      if (!paper) paper = await storage.getPublishedPaperByAsid(req.params.id);
      if (!paper) return fail(res, "Paper not found.", 404);

      // Generate a proper BibTeX entry for citing this paper
      const keywords = safeJson(paper.keywords, []);
      const bibtexCitation = [
        `@article{autoscholar:${paper.asid || paper.id},`,
        `  title     = {${paper.title}},`,
        `  author    = {${paper.authors || paper.authorName || "AutoScholar"}},`,
        paper.abstract ? `  abstract  = {${paper.abstract.slice(0, 500)}},` : null,
        `  journal   = {AutoScholar Research Journal},`,
        `  year      = {${new Date(paper.publishedAt).getFullYear()}},`,
        paper.asid ? `  note      = {${paper.asid}},` : null,
        keywords.length ? `  keywords  = {${keywords.join(", ")}},` : null,
        paper.domain ? `  category  = {${paper.domain}},` : null,
        `  publisher = {AutoScholar AI Research Platform},`,
        `}`,
      ].filter(Boolean).join("\n");

      if (req.query.format === "json") {
        return ok(res, { citation: bibtexCitation, rawEntries: paper.bibtexEntries });
      }

      res.set("Content-Type", "text/plain; charset=utf-8");
      return res.send(bibtexCitation);
    } catch (error) {
      return fail(res, "Failed to generate BibTeX.", 500);
    }
  });

  /**
   * GET /api/v1/papers/domains
   * List all unique research domains with paper counts.
   */
  app.get("/api/v1/papers/domains", auth, read, async (_req: ApiRequest, res: Response) => {
    try {
      const papers = await storage.getJournalPapers();
      const domainCounts = new Map<string, number>();
      for (const p of papers) {
        const d = p.domain || "unclassified";
        domainCounts.set(d, (domainCounts.get(d) || 0) + 1);
      }
      const domains = Array.from(domainCounts.entries())
        .map(([domain, count]) => ({ domain, count }))
        .sort((a, b) => b.count - a.count);

      return ok(res, domains);
    } catch (error) {
      return fail(res, "Failed to fetch domains.", 500);
    }
  });

  /**
   * GET /api/v1/papers/templates
   * List all unique templates with paper counts.
   */
  app.get("/api/v1/papers/templates", auth, read, async (_req: ApiRequest, res: Response) => {
    try {
      const papers = await storage.getJournalPapers();
      const templateCounts = new Map<string, number>();
      for (const p of papers) {
        const t = p.template || "article";
        templateCounts.set(t, (templateCounts.get(t) || 0) + 1);
      }
      const templates = Array.from(templateCounts.entries())
        .map(([template, count]) => ({ template, count }))
        .sort((a, b) => b.count - a.count);

      return ok(res, templates);
    } catch (error) {
      return fail(res, "Failed to fetch templates.", 500);
    }
  });
}

function safeJson(raw: string | null | undefined, fallback: any): any {
  if (!raw) return fallback;
  try { return JSON.parse(raw); } catch { return fallback; }
}
