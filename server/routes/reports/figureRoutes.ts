import type { Express, Request, Response } from "express";
import path from "path";
import fs from "fs";
import { storage } from "../../storage";
import { logger } from "../../utils/logger";

export function registerFigureRoutes(app: Express) {
  // ─── Journal: serve figures from project ZIP ──────────────
  app.get("/api/journal/papers/:id/figures/:figIndex", async (req: Request, res: Response) => {
    try {
      const paper = await storage.getPublishedPaperById(req.params.id);
      if (!paper || !paper.projectZipUrl) {
        return res.status(404).json({ error: "Paper or ZIP not found" });
      }

      const figIndex = parseInt(req.params.figIndex);
      if (isNaN(figIndex) || figIndex < 0) {
        return res.status(400).json({ error: "Invalid figure index" });
      }

      const downloadsDir = path.resolve('downloads');
      const zipFilename = decodeURIComponent(paper.projectZipUrl.replace('/api/download/', ''));
      const zipPath = path.join(downloadsDir, zipFilename);

      if (!fs.existsSync(zipPath)) {
        return res.status(404).json({ error: "ZIP file not found" });
      }

      const { execSync } = await import('child_process');
      const tmpDir = path.join(downloadsDir, `_fig_${paper.id}_${Date.now()}`);
      fs.mkdirSync(tmpDir, { recursive: true });

      try {
        execSync(`unzip -o -q "${zipPath}" -d "${tmpDir}"`, { timeout: 10000 });

        // Collect all PNG/JPG figures sorted by name
        const collectFigures = (dir: string): string[] => {
          const figs: string[] = [];
          for (const item of fs.readdirSync(dir)) {
            const full = path.join(dir, item);
            const stat = fs.statSync(full);
            if (stat.isDirectory()) {
              figs.push(...collectFigures(full));
            } else if (/\.(png|jpg|jpeg|pdf)$/i.test(item)) {
              figs.push(full);
            }
          }
          return figs.sort();
        };

        const figures = collectFigures(tmpDir);

        if (figIndex >= figures.length) {
          fs.rmSync(tmpDir, { recursive: true, force: true });
          return res.status(404).json({ error: "Figure not found", available: figures.length });
        }

        const figPath = figures[figIndex];
        const ext = path.extname(figPath).toLowerCase();
        const mimeTypes: Record<string, string> = {
          '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.pdf': 'application/pdf',
        };

        res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        const data = fs.readFileSync(figPath);
        fs.rmSync(tmpDir, { recursive: true, force: true });
        res.send(data);
      } catch (err) {
        try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
        throw err;
      }
    } catch (error) {
      logger.error(`Figure serve error: ${(error as Error).message}`);
      res.status(500).json({ error: "Failed to serve figure" });
    }
  });

  // ─── Journal: list available figures for a paper ──────────────
  app.get("/api/journal/papers/:id/figures", async (req: Request, res: Response) => {
    try {
      const paper = await storage.getPublishedPaperById(req.params.id);
      if (!paper || !paper.projectZipUrl) {
        return res.json({ figures: [] });
      }

      const downloadsDir = path.resolve('downloads');
      const zipFilename = decodeURIComponent(paper.projectZipUrl.replace('/api/download/', ''));
      const zipPath = path.join(downloadsDir, zipFilename);

      if (!fs.existsSync(zipPath)) {
        return res.json({ figures: [] });
      }

      const { execSync } = await import('child_process');
      // List files in ZIP without extracting
      try {
        const output = execSync(`unzip -l "${zipPath}" 2>/dev/null`, { timeout: 5000 }).toString();
        const figureLines = output.split('\n')
          .filter(line => /\.(png|jpg|jpeg)$/i.test(line.trim()))
          .map(line => {
            // Match: size date time filename (flexible format)
            const match = line.match(/^\s*(\d+)\s+\S+\s+\S+\s+(.+)/);
            return match ? { name: match[2].trim(), size: parseInt(match[1]) } : null;
          })
          .filter(Boolean)
          .sort((a: any, b: any) => a.name.localeCompare(b.name));

        res.json({
          figures: figureLines.map((f: any, i: number) => ({
            index: i,
            name: f.name,
            size: f.size,
            url: `/api/journal/papers/${req.params.id}/figures/${i}`,
          })),
        });
      } catch {
        res.json({ figures: [] });
      }
    } catch (error) {
      logger.error(`List figures error: ${(error as Error).message}`);
      res.json({ figures: [] });
    }
  });
}
