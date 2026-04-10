import type { Express, Request, Response } from "express";
import { storage } from "../../storage";
import { logger } from "../../utils/logger";

export function registerPeerReviewRoutes(app: Express) {
  // ─── Peer Review ──────────────────────────────────────────

  // Get peer review for a paper (if it exists)
  app.get("/api/journal/papers/:id/review", async (req: Request, res: Response) => {
    try {
      const review = await storage.getPeerReviewByPaperId(req.params.id);
      if (!review) {
        return res.status(404).json({ error: "No peer review found for this paper" });
      }
      res.json(review);
    } catch (error) {
      logger.error("Failed to fetch peer review:", error);
      res.status(500).json({ error: "Failed to fetch peer review" });
    }
  });

  // Trigger peer review generation for a paper
  app.post("/api/journal/papers/:id/review", async (req: Request, res: Response) => {
    try {
      const paper = await storage.getPublishedPaperById(req.params.id);
      if (!paper) {
        return res.status(404).json({ error: "Paper not found" });
      }

      // Check if already reviewed
      const existing = await storage.getPeerReviewByPaperId(req.params.id);
      if (existing) {
        return res.json(existing);
      }

      // Check paper has content to review
      if (!paper.latexContent && !paper.abstract) {
        return res.status(400).json({ error: "Paper has no content to review (no LaTeX sections or abstract)" });
      }

      const { generatePeerReview } = await import('../../services/peerReviewService');
      const result = await generatePeerReview(paper);

      const review = await storage.createPeerReview({
        paperId: req.params.id,
        overallScore: result.overallScore,
        summary: result.summary,
        strengths: JSON.stringify(result.strengths),
        weaknesses: JSON.stringify(result.weaknesses),
        detailedScores: JSON.stringify(result.detailedScores),
        sectionReviews: JSON.stringify(result.sectionReviews),
        recommendation: result.recommendation,
        fullReport: result.fullReport,
      });

      res.status(201).json(review);
    } catch (error) {
      logger.error("Failed to generate peer review:", error);
      res.status(500).json({ error: `Failed to generate peer review: ${(error as Error).message}` });
    }
  });

  // Get all peer reviews (for journal overview)
  app.get("/api/journal/reviews", async (_req: Request, res: Response) => {
    try {
      const reviews = await storage.getAllPeerReviews();
      res.json(reviews);
    } catch (error) {
      logger.error("Failed to fetch reviews:", error);
      res.status(500).json({ error: "Failed to fetch reviews" });
    }
  });
}
