/**
 * /api/v1/reports — Shared Research Reports
 *
 * Access crystallized research reports that users have shared publicly.
 * Each report contains the question, AI-generated answer, sources, and visualizations.
 */

import type { Express, Response } from "express";
import { storage } from "../../../storage";
import {
  authenticateApiKey, requireScope, paginate,
  ok, okPaginated, fail,
  type ApiRequest,
} from "../middleware";

export function registerReportRoutes(app: Express) {
  const auth = authenticateApiKey;
  const read = requireScope("read");

  /**
   * GET /api/v1/reports
   * List all shared reports with pagination.
   * Query: ?page, ?limit, ?q (search in question/answer)
   */
  app.get("/api/v1/reports", auth, read, paginate(20, 100), async (req: ApiRequest, res: Response) => {
    try {
      let reports = await storage.getAllSharedReports();

      const { q } = req.query;
      if (q) {
        const search = String(q).toLowerCase();
        reports = reports.filter(r =>
          r.question.toLowerCase().includes(search) ||
          r.answer.toLowerCase().includes(search)
        );
      }

      // Sort newest first
      reports.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const total = reports.length;
      const { offset, limit } = req.pagination!;
      const page = reports.slice(offset, offset + limit);

      const items = page.map(r => ({
        id: r.id,
        shareId: r.shareId,
        question: r.question,
        answerPreview: r.answer.slice(0, 500) + (r.answer.length > 500 ? "..." : ""),
        sourceCount: safeJson(r.sources, []).length,
        hasFigures: !!(r.customPythonFigures && r.customPythonFigures !== "[]"),
        toolResultCount: safeJson(r.toolResults, []).length,
        createdAt: r.createdAt,
      }));

      return okPaginated(res, items, total, req.pagination!);
    } catch (error) {
      return fail(res, "Failed to fetch reports.", 500);
    }
  });

  /**
   * GET /api/v1/reports/:shareId
   * Get full report by share ID (includes full answer, sources, tool results).
   */
  app.get("/api/v1/reports/:shareId", auth, read, async (req: ApiRequest, res: Response) => {
    try {
      const report = await storage.getSharedReportByShareId(req.params.shareId);
      if (!report) return fail(res, "Report not found.", 404);

      const includeFigures = req.query.include_figures !== "false";

      return ok(res, {
        id: report.id,
        shareId: report.shareId,
        question: report.question,
        answer: report.answer,
        sources: safeJson(report.sources, []),
        toolResults: safeJson(report.toolResults, []),
        figures: includeFigures ? safeJson(report.customPythonFigures, []) : undefined,
        createdAt: report.createdAt,
      });
    } catch (error) {
      return fail(res, "Failed to fetch report.", 500);
    }
  });

  /**
   * GET /api/v1/reports/:shareId/sources
   * Get only the sources/references from a report.
   */
  app.get("/api/v1/reports/:shareId/sources", auth, read, async (req: ApiRequest, res: Response) => {
    try {
      const report = await storage.getSharedReportByShareId(req.params.shareId);
      if (!report) return fail(res, "Report not found.", 404);

      return ok(res, {
        shareId: report.shareId,
        question: report.question,
        sources: safeJson(report.sources, []),
      });
    } catch (error) {
      return fail(res, "Failed to fetch sources.", 500);
    }
  });
}

function safeJson(raw: string | null | undefined, fallback: any): any {
  if (!raw) return fallback;
  try { return JSON.parse(raw); } catch { return fallback; }
}
