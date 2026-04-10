/**
 * /api/v1/reviews — Peer Review Data
 *
 * Access AI-generated peer reviews: scores, recommendations,
 * strengths/weaknesses, detailed scoring breakdown.
 */

import type { Express, Response } from "express";
import { storage } from "../../../storage";
import {
  authenticateApiKey, requireScope, paginate,
  ok, okPaginated, fail,
  type ApiRequest,
} from "../middleware";

export function registerReviewRoutes(app: Express) {
  const auth = authenticateApiKey;
  const read = requireScope("read");

  /**
   * GET /api/v1/reviews
   * List all peer reviews with filtering and pagination.
   * Query: ?page, ?limit, ?recommendation (accept|minor_revision|major_revision|reject),
   *        ?min_score, ?max_score, ?sort (score_asc|score_desc|newest|oldest)
   */
  app.get("/api/v1/reviews", auth, read, paginate(20, 100), async (req: ApiRequest, res: Response) => {
    try {
      let reviews = await storage.getAllPeerReviews();

      const { recommendation, min_score, max_score, sort } = req.query;
      if (recommendation) reviews = reviews.filter(r => r.recommendation === String(recommendation));
      if (min_score) reviews = reviews.filter(r => r.overallScore >= Number(min_score));
      if (max_score) reviews = reviews.filter(r => r.overallScore <= Number(max_score));

      switch (sort) {
        case "score_asc": reviews.sort((a, b) => a.overallScore - b.overallScore); break;
        case "score_desc": reviews.sort((a, b) => b.overallScore - a.overallScore); break;
        case "oldest": reviews.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()); break;
        default: reviews.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }

      const total = reviews.length;
      const { offset, limit } = req.pagination!;
      const page = reviews.slice(offset, offset + limit);

      const items = page.map(r => ({
        id: r.id,
        paperId: r.paperId,
        overallScore: r.overallScore,
        recommendation: r.recommendation,
        summary: r.summary,
        strengths: safeJson(r.strengths, []),
        weaknesses: safeJson(r.weaknesses, []),
        detailedScores: safeJson(r.detailedScores, {}),
        sectionReviews: safeJson(r.sectionReviews, []),
        createdAt: r.createdAt,
      }));

      return okPaginated(res, items, total, req.pagination!);
    } catch (error) {
      return fail(res, "Failed to fetch reviews.", 500);
    }
  });

  /**
   * GET /api/v1/reviews/:paperId
   * Get the peer review for a specific paper.
   */
  app.get("/api/v1/reviews/:paperId", auth, read, async (req: ApiRequest, res: Response) => {
    try {
      const review = await storage.getPeerReviewByPaperId(req.params.paperId);
      if (!review) return fail(res, "Peer review not found for this paper.", 404);

      return ok(res, {
        id: review.id,
        paperId: review.paperId,
        overallScore: review.overallScore,
        recommendation: review.recommendation,
        summary: review.summary,
        strengths: safeJson(review.strengths, []),
        weaknesses: safeJson(review.weaknesses, []),
        detailedScores: safeJson(review.detailedScores, {}),
        sectionReviews: safeJson(review.sectionReviews, []),
        fullReport: review.fullReport,
        createdAt: review.createdAt,
      });
    } catch (error) {
      return fail(res, "Failed to fetch review.", 500);
    }
  });

  /**
   * GET /api/v1/reviews/stats/summary
   * Aggregate review statistics across all papers.
   */
  app.get("/api/v1/reviews/stats/summary", auth, read, async (_req: ApiRequest, res: Response) => {
    try {
      const reviews = await storage.getAllPeerReviews();
      if (reviews.length === 0) return ok(res, { totalReviews: 0 });

      const scores = reviews.map(r => r.overallScore);
      const recommendations = reviews.reduce((acc, r) => {
        acc[r.recommendation] = (acc[r.recommendation] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Aggregate detailed scores
      const detailedAgg: Record<string, number[]> = {};
      for (const r of reviews) {
        const ds = safeJson(r.detailedScores, {});
        for (const [key, val] of Object.entries(ds)) {
          if (typeof val === "number") {
            if (!detailedAgg[key]) detailedAgg[key] = [];
            detailedAgg[key].push(val);
          }
        }
      }
      const detailedAverages: Record<string, number> = {};
      for (const [key, vals] of Object.entries(detailedAgg)) {
        detailedAverages[key] = Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
      }

      return ok(res, {
        totalReviews: reviews.length,
        averageScore: Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10,
        medianScore: scores.sort((a, b) => a - b)[Math.floor(scores.length / 2)],
        minScore: Math.min(...scores),
        maxScore: Math.max(...scores),
        recommendations,
        detailedAverages,
      });
    } catch (error) {
      return fail(res, "Failed to compute review stats.", 500);
    }
  });
}

function safeJson(raw: string | null | undefined, fallback: any): any {
  if (!raw) return fallback;
  try { return JSON.parse(raw); } catch { return fallback; }
}
