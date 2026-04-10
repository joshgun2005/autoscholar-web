import type { Express, Request, Response } from "express";
import path from "path";
import fs from "fs";
import { logger } from "../../utils/logger";

export function registerDocumentGenerationRoutes(app: Express) {
  // ─── Document Generation ────────────────────────────────

  // PDF
  app.post("/api/generate-pdf", async (req: Request, res: Response) => {
    try {
      const { question, answer } = req.body;
      if (!question || !answer) {
        return res.status(400).json({ error: "Question and answer are required" });
      }

      logger.info("Generating PDF with Puppeteer");
      const { generatePDFFromMarkdown } = await import("../../services/pdfService");
      const pdfBuffer = await generatePDFFromMarkdown({ question, answer });
      const buffer = Buffer.isBuffer(pdfBuffer) ? pdfBuffer : Buffer.from(pdfBuffer);

      const filename = `AutoScholar-${Date.now()}.pdf`;
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

  // HTML (standalone)
  app.post("/api/generate-html", async (req: Request, res: Response) => {
    try {
      const { question, answer } = req.body;
      if (!question || !answer) {
        return res.status(400).json({ error: "Question and answer are required" });
      }

      logger.info("Generating standalone HTML");
      const { generateHTMLFromMarkdown } = await import("../../services/pdfService");
      const html = generateHTMLFromMarkdown({ question, answer });

      const filename = `AutoScholar-${Date.now()}.html`;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(html);
      logger.success("HTML generated and sent successfully");
    } catch (error) {
      logger.error(`HTML generation error: ${(error as Error).message}`);
      res.status(500).json({ error: "Failed to generate HTML" });
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
      const { generateDOCXFromMarkdown } = await import("../../services/pdfService");
      const docxBuffer = await generateDOCXFromMarkdown({ question, answer });

      const filename = `AutoScholar-${Date.now()}.docx`;
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

  // ─── File Downloads ─────────────────────────────────────

  app.get("/api/download/:filename", async (req: Request, res: Response) => {
    try {
      const { filename } = req.params;

      if (!/^[a-zA-Z0-9._-]+$/.test(filename)) {
        return res.status(400).json({ error: "Invalid filename" });
      }

      const downloadsDir = path.resolve('downloads');

      // Ensure downloads directory exists
      if (!fs.existsSync(downloadsDir)) {
        fs.mkdirSync(downloadsDir, { recursive: true });
      }

      let filePath = path.join(downloadsDir, filename);

      // Primary check: exact filename match
      let found = fs.existsSync(filePath);

      // Fallback: if not found, search for a file ending with this filename
      // (handles cases where timestamp prefix may differ)
      if (!found) {
        try {
          const files = fs.readdirSync(downloadsDir);
          const match = files.find(f => f.endsWith(filename) || f.endsWith(`_${filename}`));
          if (match) {
            filePath = path.join(downloadsDir, match);
            found = true;
            logger.info(`Download fallback match: ${filename} → ${match}`);
          }
        } catch {
          // ignore readdir errors
        }
      }

      if (!found) {
        logger.warn(`Download 404: ${filename} not found in ${downloadsDir}`);
        return res.status(404).json({ error: "File not found" });
      }

      // Strip timestamp prefix for user-friendly download name
      const cleanName = filename.replace(/^\d+_/, '');
      // Support inline viewing via ?inline=1 (used by PDF viewer tab)
      const disposition = req.query.inline === '1' ? 'inline' : 'attachment';
      res.setHeader('Content-Disposition', `${disposition}; filename="${cleanName}"`);

      const ext = path.extname(filename).toLowerCase();
      const contentTypes: Record<string, string> = {
        '.csv': 'text/csv',
        '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        '.pdf': 'application/pdf',
        '.json': 'application/json',
        '.txt': 'text/plain',
        '.html': 'text/html',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.svg': 'image/svg+xml',
        '.zip': 'application/zip',
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
