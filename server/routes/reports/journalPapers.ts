import type { Express, Request, Response } from "express";
import path from "path";
import fs from "fs";
import { storage } from "../../storage";
import { logger } from "../../utils/logger";
import { detectDomain } from "../../utils/domainDetector";

export function registerJournalRoutes(app: Express) {
  // ─── Journal: list all published papers (with cost data) ────────────
  app.get("/api/journal/papers", async (_req: Request, res: Response) => {
    try {
      const papers = await storage.getJournalPapers();
      let costs: Awaited<ReturnType<typeof storage.getJournalPaperCosts>> = [];
      try { costs = await storage.getJournalPaperCosts(); } catch { /* best effort */ }
      const costMap = new Map(costs.map(c => [c.paperId, c]));
      const lightweight = papers.map(({ latexContent, bibtexEntries, ...rest }) => ({
        ...rest,
        inputTokens: costMap.get(rest.id)?.inputTokens ?? null,
        outputTokens: costMap.get(rest.id)?.outputTokens ?? null,
        generationCost: costMap.get(rest.id)?.totalCost ?? null,
      }));
      res.json(lightweight);
    } catch (error) {
      console.error("Failed to fetch papers:", error);
      res.status(500).json({ error: "Failed to fetch papers" });
    }
  });

  // ─── Journal: get single paper by ID ──────────────
  app.get("/api/journal/papers/:id", async (req: Request, res: Response) => {
    try {
      const paper = await storage.getPublishedPaperById(req.params.id);
      if (!paper) {
        return res.status(404).json({ error: "Paper not found" });
      }
      res.json(paper);
    } catch (error) {
      console.error("Failed to fetch paper:", error);
      res.status(500).json({ error: "Failed to fetch paper" });
    }
  });

  // ─── Journal: delete a paper by ID ──────────────
  app.delete("/api/journal/papers/:id", async (req: Request, res: Response) => {
    try {
      const deleted = await storage.deletePublishedPaper(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Paper not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to delete paper:", error);
      res.status(500).json({ error: "Failed to delete paper" });
    }
  });

  // ─── Journal: re-classify all paper domains ──────────────
  app.post("/api/journal/reclassify", async (_req: Request, res: Response) => {
    try {
      const papers = await storage.getAllPublishedPapers();
      const updates: { id: string; title: string; oldDomain: string | null; newDomain: string }[] = [];

      for (const paper of papers) {
        const keywords = paper.keywords ? (() => { try { return JSON.parse(paper.keywords); } catch { return []; } })() : [];
        const newDomain = detectDomain(paper.title, paper.abstract || '', keywords);

        if (newDomain !== paper.domain) {
          await storage.updatePaperDomain(paper.id, newDomain);
          updates.push({ id: paper.id, title: paper.title, oldDomain: paper.domain, newDomain });
        }
      }

      logger.success(`Re-classified ${updates.length} / ${papers.length} papers`);
      res.json({ total: papers.length, updated: updates.length, changes: updates });
    } catch (error) {
      logger.error("Re-classify error:", error);
      res.status(500).json({ error: "Failed to re-classify papers" });
    }
  });

  // ─── Journal: backfill LaTeX content from project ZIPs ──────────────
  app.post("/api/journal/backfill-latex", async (_req: Request, res: Response) => {
    try {
      const papers = await storage.getAllPublishedPapers();
      const downloadsDir = path.resolve('downloads');
      const results: { id: string; title: string; status: string }[] = [];

      for (const paper of papers) {
        // Skip papers that already have latex content
        if (paper.latexContent) {
          results.push({ id: paper.id, title: paper.title, status: 'already_has_content' });
          continue;
        }

        // Try to find the project ZIP for this paper
        if (!paper.projectZipUrl) {
          results.push({ id: paper.id, title: paper.title, status: 'no_zip_url' });
          continue;
        }

        const zipFilename = decodeURIComponent(paper.projectZipUrl.replace('/api/download/', ''));
        const zipPath = path.join(downloadsDir, zipFilename);

        if (!fs.existsSync(zipPath)) {
          results.push({ id: paper.id, title: paper.title, status: 'zip_not_found' });
          continue;
        }

        try {
          // Extract paper.tex from the ZIP using unzip command
          const { execSync } = await import('child_process');
          const tmpDir = path.join(downloadsDir, `_backfill_${paper.id}`);
          if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

          try {
            execSync(`unzip -o -q "${zipPath}" -d "${tmpDir}"`, { timeout: 10000 });
          } catch {
            results.push({ id: paper.id, title: paper.title, status: 'unzip_failed' });
            try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
            continue;
          }

          // Find .tex file recursively
          const findTexFile = (dir: string): string | null => {
            const items = fs.readdirSync(dir);
            for (const item of items) {
              const full = path.join(dir, item);
              const stat = fs.statSync(full);
              if (stat.isDirectory()) {
                const found = findTexFile(full);
                if (found) return found;
              } else if (item.endsWith('.tex')) {
                return full;
              }
            }
            return null;
          };

          const texFile = findTexFile(tmpDir);
          if (!texFile) {
            results.push({ id: paper.id, title: paper.title, status: 'no_tex_in_zip' });
            try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
            continue;
          }

          const texContent = fs.readFileSync(texFile, 'utf-8');

          // Parse sections from the full .tex file
          // Sections are between \section{...} commands
          const sectionRegex = /\\section\*?\{([^}]*)\}([\s\S]*?)(?=\\section\*?\{|\\begin\{thebibliography\}|\\bibliography\{|\\end\{document\}|$)/g;
          const sections: { type: string; latex_content: string }[] = [];
          let sectionMatch;
          while ((sectionMatch = sectionRegex.exec(texContent)) !== null) {
            const title = sectionMatch[1].trim();
            const content = sectionMatch[2].trim();
            if (content.length < 50) continue; // skip empty sections

            // Map title to section type
            const titleLower = title.toLowerCase();
            let type = 'unknown';
            if (titleLower.includes('introduction')) type = 'introduction';
            else if (titleLower.includes('literature') || titleLower.includes('review') || titleLower.includes('related')) type = 'literature_review';
            else if (titleLower.includes('method') || titleLower.includes('framework') || titleLower.includes('model')) type = 'methodology';
            else if (titleLower.includes('data') && !titleLower.includes('result')) type = 'data';
            else if (titleLower.includes('result') || titleLower.includes('empirical') || titleLower.includes('finding')) type = 'results';
            else if (titleLower.includes('discussion') || titleLower.includes('implication')) type = 'discussion';
            else if (titleLower.includes('conclusion') || titleLower.includes('summary')) type = 'conclusion';
            else if (titleLower.includes('robust')) type = 'robustness';
            else if (titleLower.includes('appendix')) type = 'appendix';
            else type = title.toLowerCase().replace(/[^a-z0-9]+/g, '_');

            sections.push({ type, latex_content: `\\section{${title}}\n${content}` });
          }

          // Also try to extract bibtex
          const findBibFile = (dir: string): string | null => {
            const items = fs.readdirSync(dir);
            for (const item of items) {
              const full = path.join(dir, item);
              const stat = fs.statSync(full);
              if (stat.isDirectory()) { const f = findBibFile(full); if (f) return f; }
              else if (item.endsWith('.bib')) return full;
            }
            return null;
          };
          const bibFile = findBibFile(tmpDir);
          let bibtexEntries: string | null = null;
          if (bibFile) {
            bibtexEntries = fs.readFileSync(bibFile, 'utf-8');
          } else {
            // Try to extract from thebibliography environment in the tex
            const bibMatch = texContent.match(/\\begin\{thebibliography\}[\s\S]*?\\end\{thebibliography\}/);
            if (bibMatch) {
              bibtexEntries = bibMatch[0];
            }
          }

          // Cleanup tmp dir
          try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}

          if (sections.length > 0) {
            await storage.updatePaperLatexContent(paper.id, JSON.stringify(sections), bibtexEntries);
            results.push({ id: paper.id, title: paper.title, status: `backfilled_${sections.length}_sections` });
            logger.success(`Backfilled LaTeX for "${paper.title}" (${sections.length} sections)`);
          } else {
            results.push({ id: paper.id, title: paper.title, status: 'no_sections_found' });
          }
        } catch (extractErr) {
          results.push({ id: paper.id, title: paper.title, status: `error: ${(extractErr as Error).message}` });
          logger.error(`Backfill error for "${paper.title}": ${(extractErr as Error).message}`);
        }
      }

      const backfilled = results.filter(r => r.status.startsWith('backfilled')).length;
      logger.success(`Backfill complete: ${backfilled}/${papers.length} papers updated`);
      res.json({ total: papers.length, backfilled, results });
    } catch (error) {
      logger.error("Backfill error:", error);
      res.status(500).json({ error: "Failed to backfill latex content" });
    }
  });
}
