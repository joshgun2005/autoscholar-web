import type { Express, Request, Response } from "express";
import { randomUUID } from "crypto";
import path from "path";
import fs from "fs";
import { storage } from "../../storage";
import { logger } from "../../utils/logger";

export function registerSharedReportRoutes(app: Express) {
  // ─── Shared Reports ─────────────────────────────────────

  // Get all shared reports (explore page)
  app.get("/api/shared-reports", async (req: Request, res: Response) => {
    try {
      const reports = await storage.getAllSharedReports();

      const simplifiedReports = reports
        .map(report => ({
          id: report.id,
          shareId: report.shareId,
          question: report.question,
          answer: report.answer.substring(0, 500),
          toolResults: report.toolResults ? JSON.parse(report.toolResults) : [],
          createdAt: report.createdAt,
        }))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      res.json(simplifiedReports);
    } catch (error) {
      logger.error("Get all shared reports error:", error);
      res.status(500).json({ error: "Failed to get shared reports" });
    }
  });

  // Create a shareable report
  app.post("/api/share", async (req: Request, res: Response) => {
    try {
      const { question, answer, toolResults, sources, customPythonFigures } = req.body;

      if (!question || !answer) {
        return res.status(400).json({ error: "Question and answer are required" });
      }

      // Convert file-based figure URLs to base64 for persistence across deployments.
      // Figure files on disk (dist/public/figures/) are ephemeral and lost on redeploy,
      // so we read them now and store the base64 data directly in the database.
      let persistedFigures = customPythonFigures;
      if (Array.isArray(customPythonFigures)) {
        persistedFigures = customPythonFigures.map((batch: any) => {
          if (!Array.isArray(batch.figures)) return batch;
          const convertedFigures = batch.figures.map((fig: string) => {
            // Already base64 or data URI — keep as-is
            if (!fig.startsWith('/figures/') && !fig.startsWith('/plots/')) return fig;
            try {
              const filePath = path.join(process.cwd(), 'dist', 'public', fig);
              const buffer = fs.readFileSync(filePath);
              return buffer.toString('base64');
            } catch {
              logger.warn(`Could not read figure file for persistence: ${fig}`);
              return fig; // Keep URL as fallback
            }
          });
          return { ...batch, figures: convertedFigures };
        });
      }

      const shareId = randomUUID().replace(/-/g, '').substring(0, 8);

      const report = await storage.createSharedReport({
        shareId,
        question,
        answer,
        toolResults: toolResults ? JSON.stringify(toolResults) : null,
        sources: sources ? JSON.stringify(sources) : null,
        customPythonFigures: persistedFigures ? JSON.stringify(persistedFigures) : null,
      });

      res.json({ shareId: report.shareId });
    } catch (error) {
      logger.error("Share error:", error);
      res.status(500).json({ error: "Failed to create shared report" });
    }
  });

  // Get a shared report by ID
  app.get("/api/share/:shareId", async (req: Request, res: Response) => {
    try {
      const report = await storage.getSharedReportByShareId(req.params.shareId);
      if (!report) {
        return res.status(404).json({ error: "Shared report not found" });
      }

      res.json({
        question: report.question,
        answer: report.answer,
        toolResults: report.toolResults ? JSON.parse(report.toolResults) : [],
        sources: report.sources ? JSON.parse(report.sources) : [],
        customPythonFigures: report.customPythonFigures ? JSON.parse(report.customPythonFigures) : null,
        createdAt: report.createdAt,
      });
    } catch (error) {
      logger.error("Get shared report error:", error);
      res.status(500).json({ error: "Failed to get shared report" });
    }
  });
}
