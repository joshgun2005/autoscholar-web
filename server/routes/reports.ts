import type { Express, Request, Response } from "express";
import { randomUUID } from "crypto";
import path from "path";
import fs from "fs";
import { storage } from "../storage";
import { convertToBeamerPDF } from "../services/beamerSlidesService";
import { logger } from "../utils/logger";

export function registerReportRoutes(app: Express) {
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

  // ─── Conversation Sessions ──────────────────────────────

  // Get all sessions for current user
  app.get("/api/sessions", async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any).userId;
      const sessions = await storage.getConversationSessions(userId);

      res.json(sessions.map(session => ({
        sessionId: session.sessionId,
        title: session.title,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      })));
    } catch (error) {
      logger.error("Get sessions error:", error);
      res.status(500).json({ error: "Failed to get sessions" });
    }
  });

  // Get specific session with messages
  app.get("/api/sessions/:sessionId", async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any).userId;
      const { sessionId } = req.params;

      let session;
      if (userId) {
        session = await storage.getConversationSessionByUserAndSessionId(sessionId, userId);
      } else {
        session = await storage.getConversationSession(sessionId);
      }

      if (!session) {
        return res.status(404).json({ error: "Session not found" });
      }

      res.json({
        sessionId: session.sessionId,
        title: session.title,
        messages: session.messages,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
      });
    } catch (error) {
      logger.error("Get session error:", error);
      res.status(500).json({ error: "Failed to get session" });
    }
  });

  // ─── Document Generation ────────────────────────────────

  // PDF
  app.post("/api/generate-pdf", async (req: Request, res: Response) => {
    try {
      const { question, answer } = req.body;
      if (!question || !answer) {
        return res.status(400).json({ error: "Question and answer are required" });
      }

      logger.info("Generating PDF with Puppeteer");
      const { generatePDFFromMarkdown } = await import("../services/pdfService");
      const pdfBuffer = await generatePDFFromMarkdown({ question, answer });
      const buffer = Buffer.isBuffer(pdfBuffer) ? pdfBuffer : Buffer.from(pdfBuffer);

      const filename = `VQuant-${Date.now()}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', buffer.length);
      res.send(buffer);
      logger.success("PDF generated and sent successfully");
    } catch (error) {
      logger.error(`PDF generation error: ${(error as Error).message}`);
      res.status(500).json({ error: "Failed to generate PDF" });
    }
  });

  // DOCX
  app.post("/api/generate-docx", async (req: Request, res: Response) => {
    try {
      const { question, answer } = req.body;
      if (!question || !answer) {
        return res.status(400).json({ error: "Question and answer are required" });
      }

      logger.info("Generating DOCX with Pandoc");
      const { generateDOCXFromMarkdown } = await import("../services/pdfService");
      const docxBuffer = await generateDOCXFromMarkdown({ question, answer });

      const filename = `VQuant-${Date.now()}.docx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', docxBuffer.length);
      res.send(docxBuffer);
      logger.success("DOCX generated and sent successfully");
    } catch (error) {
      logger.error(`DOCX generation error: ${(error as Error).message}`);
      res.status(500).json({ error: "Failed to generate DOCX" });
    }
  });

  // Beamer slides
  app.post("/api/convert-to-slides", async (req: Request, res: Response) => {
    try {
      const { question, answer, author, company, figureUrls } = req.body;
      if (!question || !answer || !author) {
        return res.status(400).json({ error: "Question, answer, and author are required" });
      }

      logger.info(`Generating Beamer PDF slides for: "${question.substring(0, 50)}..."`);

      const pdfBuffer = await convertToBeamerPDF({
        question,
        answer,
        author,
        company: company || 'VQuant',
        figureUrls: figureUrls || [],
      });

      if (!pdfBuffer || pdfBuffer.length === 0) {
        throw new Error('PDF buffer is empty or invalid');
      }

      const filename = `VQuant-Presentation-${Date.now()}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length.toString());
      res.setHeader('Cache-Control', 'no-cache');
      res.send(pdfBuffer);
    } catch (error) {
      logger.error(`Beamer slides error: ${(error as Error).message}`);
      if (!res.headersSent) {
        res.status(500).json({ error: "Failed to generate slides: " + (error as Error).message });
      }
    }
  });

  // ─── File Downloads ─────────────────────────────────────

  app.get("/api/download/:filename", async (req: Request, res: Response) => {
    try {
      const { filename } = req.params;

      if (!/^[a-zA-Z0-9._-]+$/.test(filename)) {
        return res.status(400).json({ error: "Invalid filename" });
      }

      const downloadsDir = path.resolve('downloads');
      const filePath = path.join(downloadsDir, filename);

      const fs = await import('fs/promises');
      try {
        await fs.access(filePath);
      } catch {
        return res.status(404).json({ error: "File not found" });
      }

      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      const ext = path.extname(filename).toLowerCase();
      const contentTypes: Record<string, string> = {
        '.csv': 'text/csv',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.pdf': 'application/pdf',
        '.json': 'application/json',
        '.txt': 'text/plain',
      };
      res.setHeader('Content-Type', contentTypes[ext] || 'application/octet-stream');

      res.sendFile(filePath, (err) => {
        if (err) {
          logger.error(`Error sending file ${filename}: ${err.message}`);
          if (!res.headersSent) {
            res.status(500).json({ error: "Failed to send file" });
          }
        }
      });
    } catch (error) {
      logger.error(`Download error: ${(error as Error).message}`);
      res.status(500).json({ error: "Failed to download file" });
    }
  });
}
