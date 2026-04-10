/**
 * /api/v1/pipeline — Paper Generation Pipeline
 *
 * Monitor autonomous paper generation runs:
 * status, stages, governor decisions, Popper scores.
 */

import type { Express, Response } from "express";
import { storage } from "../../../storage";
import {
  authenticateApiKey, requireScope, paginate,
  ok, okPaginated, fail,
  type ApiRequest,
} from "../middleware";

export function registerPipelineRoutes(app: Express) {
  const auth = authenticateApiKey;
  const read = requireScope("read");

  /**
   * GET /api/v1/pipeline/runs
   * List paper generation runs.
   * Query: ?page, ?limit, ?status (queued|researching|analyzing|drafting|validating|published|rejected|failed)
   */
  app.get("/api/v1/pipeline/runs", auth, read, paginate(20, 100), async (req: ApiRequest, res: Response) => {
    try {
      let runs = await storage.getAllPaperRuns(500);

      const { status } = req.query;
      if (status) runs = runs.filter(r => r.status === String(status));

      const total = runs.length;
      const { offset, limit } = req.pagination!;
      const page = runs.slice(offset, offset + limit);

      const items = page.map(r => ({
        id: r.id,
        status: r.status,
        domain: r.domain,
        method: r.method,
        prompt: r.prompt,
        paperId: r.paperId,
        sessionId: r.sessionId,
        popperScore: r.popperScore,
        popperRecommendation: r.popperRecommendation,
        errorMessage: r.errorMessage,
        startedAt: r.startedAt,
        completedAt: r.completedAt,
        createdAt: r.createdAt,
      }));

      return okPaginated(res, items, total, req.pagination!);
    } catch (error) {
      return fail(res, "Failed to fetch pipeline runs.", 500);
    }
  });

  /**
   * GET /api/v1/pipeline/runs/:id
   * Get detailed info about a specific pipeline run (includes governor state).
   */
  app.get("/api/v1/pipeline/runs/:id", auth, read, async (req: ApiRequest, res: Response) => {
    try {
      const run = await storage.getPaperRunById(req.params.id);
      if (!run) return fail(res, "Pipeline run not found.", 404);

      return ok(res, {
        ...run,
        governorState: safeJson(run.governorState, null),
      });
    } catch (error) {
      return fail(res, "Failed to fetch pipeline run.", 500);
    }
  });

  /**
   * GET /api/v1/pipeline/stats
   * Aggregate pipeline statistics.
   */
  app.get("/api/v1/pipeline/stats", auth, read, async (_req: ApiRequest, res: Response) => {
    try {
      const stats = await storage.getPaperRunStats();
      const allRuns = await storage.getAllPaperRuns(1000);

      // Compute average times for completed runs
      const completedRuns = allRuns.filter(r => r.startedAt && r.completedAt);
      const durations = completedRuns.map(r =>
        new Date(r.completedAt!).getTime() - new Date(r.startedAt!).getTime()
      );
      const avgDurationMs = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;

      // Popper score distribution
      const popperScores = allRuns.filter(r => r.popperScore != null).map(r => r.popperScore!);
      const avgPopperScore = popperScores.length > 0
        ? Math.round((popperScores.reduce((a, b) => a + b, 0) / popperScores.length) * 10) / 10
        : null;

      // Status breakdown
      const statusBreakdown: Record<string, number> = {};
      for (const r of allRuns) {
        statusBreakdown[r.status] = (statusBreakdown[r.status] || 0) + 1;
      }

      return ok(res, {
        total: stats.total,
        published: stats.published,
        rejected: stats.rejected,
        failed: stats.failed,
        hasActiveRun: !!stats.active,
        statusBreakdown,
        avgDurationMinutes: Math.round(avgDurationMs / 60000),
        avgPopperScore,
        popperScoreDistribution: {
          count: popperScores.length,
          min: popperScores.length > 0 ? Math.min(...popperScores) : null,
          max: popperScores.length > 0 ? Math.max(...popperScores) : null,
        },
      });
    } catch (error) {
      return fail(res, "Failed to compute pipeline stats.", 500);
    }
  });

  /**
   * GET /api/v1/pipeline/active
   * Get currently active pipeline runs.
   */
  app.get("/api/v1/pipeline/active", auth, read, async (_req: ApiRequest, res: Response) => {
    try {
      const active = await storage.getAllActivePaperRuns();
      return ok(res, active.map(r => ({
        id: r.id,
        status: r.status,
        domain: r.domain,
        method: r.method,
        prompt: r.prompt,
        startedAt: r.startedAt,
        lastHeartbeat: r.lastHeartbeat,
      })));
    } catch (error) {
      return fail(res, "Failed to fetch active runs.", 500);
    }
  });
}

function safeJson(raw: string | null | undefined, fallback: any): any {
  if (!raw) return fallback;
  try { return JSON.parse(raw); } catch { return fallback; }
}
