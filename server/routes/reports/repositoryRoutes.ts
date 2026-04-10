/**
 * Repository API — browse project file trees and serve individual files from project ZIPs.
 *
 * GET /api/repository                — list all projects with metadata
 * GET /api/repository/:id/tree       — file tree extracted from ZIP
 * GET /api/repository/:id/file/*     — serve a single file from the ZIP (inline)
 * GET /api/repository/:id/raw/*      — serve a single file raw (for curl)
 * GET /api/repository/:id/download   — download full project ZIP
 */

import type { Express, Request, Response } from "express";
import path from "path";
import fs from "fs";
import { execSync } from "child_process";
import { storage } from "../../storage";
import { logger } from "../../utils/logger";

interface TreeEntry {
  name: string;
  path: string;
  type: "file" | "dir";
  size?: number;
  children?: TreeEntry[];
}

/** Parse `unzip -l` output into a tree structure */
function buildTree(zipListOutput: string): TreeEntry[] {
  const root: TreeEntry = { name: "", path: "", type: "dir", children: [] };
  const lines = zipListOutput.split("\n");

  for (const line of lines) {
    // unzip -l format: "  size  date  time  path"
    const match = line.match(/^\s*(\d+)\s+\S+\s+\S+\s+(.+)/);
    if (!match) continue;
    const size = parseInt(match[1]);
    let filePath = match[2].trim();
    if (!filePath || filePath.endsWith("/") && size === 0) {
      // Skip directory-only entries (we build dirs from file paths)
      if (filePath.endsWith("/")) {
        // Still register dir in tree
        ensureDir(root, filePath.slice(0, -1));
      }
      continue;
    }

    // Strip leading project-name directory if present (e.g., "ProjectName-project/...")
    const parts = filePath.split("/");
    if (parts.length > 1 && parts[0].endsWith("-project")) {
      parts.shift();
      filePath = parts.join("/");
    }
    if (!filePath) continue;

    // Build directory chain
    const dirPath = parts.slice(0, -1).join("/");
    const fileName = parts[parts.length - 1];
    const parent = dirPath ? ensureDir(root, dirPath) : root;

    // Add file
    if (!parent.children!.find(c => c.name === fileName && c.type === "file")) {
      parent.children!.push({
        name: fileName,
        path: filePath,
        type: "file",
        size,
      });
    }
  }

  // Sort: dirs first, then files, alphabetical
  sortTree(root);
  return root.children || [];
}

function ensureDir(root: TreeEntry, dirPath: string): TreeEntry {
  const parts = dirPath.split("/");
  let current = root;
  let currentPath = "";
  for (const part of parts) {
    if (!part) continue;
    currentPath = currentPath ? `${currentPath}/${part}` : part;
    if (!current.children) current.children = [];
    let child = current.children.find(c => c.name === part && c.type === "dir");
    if (!child) {
      child = { name: part, path: currentPath, type: "dir", children: [] };
      current.children.push(child);
    }
    current = child;
  }
  return current;
}

function sortTree(node: TreeEntry) {
  if (!node.children) return;
  node.children.sort((a, b) => {
    if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  for (const child of node.children) {
    if (child.type === "dir") sortTree(child);
  }
}

/** Count total files in a tree */
function countFiles(entries: TreeEntry[]): number {
  let count = 0;
  for (const e of entries) {
    if (e.type === "file") count++;
    if (e.children) count += countFiles(e.children);
  }
  return count;
}

/** Resolve a paper's ZIP path on disk */
function resolveZipPath(paper: { projectZipUrl: string | null }): string | null {
  if (!paper.projectZipUrl) return null;
  const downloadsDir = path.resolve("downloads");
  const zipFilename = decodeURIComponent(paper.projectZipUrl.replace("/api/download/", ""));
  const zipPath = path.join(downloadsDir, zipFilename);
  if (!fs.existsSync(zipPath)) return null;
  return zipPath;
}

/** Detect the project root prefix inside the ZIP (e.g. "ProjectName-project/") */
function detectZipPrefix(zipPath: string): string {
  try {
    const output = execSync(`unzip -l "${zipPath}" 2>/dev/null | head -20`, { timeout: 5000 }).toString();
    const lines = output.split("\n");
    for (const line of lines) {
      const match = line.match(/^\s*\d+\s+\S+\s+\S+\s+(.+-project\/)/);
      if (match) return match[1];
    }
  } catch {}
  return "";
}

export function registerRepositoryRoutes(app: Express) {

  // ─── List all projects ────────────────────────────────────
  app.get("/api/repository", async (_req: Request, res: Response) => {
    try {
      const papers = await storage.getAllPublishedPapers();
      const projects = papers
        .map(({ latexContent, bibtexEntries, ...rest }) => {
          // Try to get ZIP file size
          const zipPath = resolveZipPath(rest as any);
          let zipSize: number | null = null;
          if (zipPath) {
            try { zipSize = fs.statSync(zipPath).size; } catch {}
          }
          return {
            id: rest.id,
            title: rest.title,
            authors: rest.authors,
            domain: rest.domain,
            template: rest.template,
            asid: rest.asid,
            wordCount: rest.wordCount,
            sectionCount: rest.sectionCount,
            figureCount: rest.figureCount,
            publishedAt: rest.publishedAt,
            downloadUrl: rest.downloadUrl,
            projectZipUrl: rest.projectZipUrl,
            sessionId: rest.sessionId,
            zipSize,
          };
        });

      res.json(projects);
    } catch (error) {
      logger.error(`Repository list error: ${(error as Error).message}`);
      res.status(500).json({ error: "Failed to list projects" });
    }
  });

  // ─── File tree for a project ──────────────────────────────
  app.get("/api/repository/:id/tree", async (req: Request, res: Response) => {
    try {
      const paper = await storage.getPublishedPaperById(req.params.id);
      if (!paper) return res.status(404).json({ error: "Project not found" });

      const zipPath = resolveZipPath(paper);
      if (!zipPath) return res.status(404).json({ error: "Project ZIP not found on disk" });

      const output = execSync(`unzip -l "${zipPath}" 2>/dev/null`, { timeout: 10000 }).toString();
      const tree = buildTree(output);

      res.json({
        id: paper.id,
        title: paper.title,
        tree,
        fileCount: countFiles(tree),
      });
    } catch (error) {
      logger.error(`Repository tree error: ${(error as Error).message}`);
      res.status(500).json({ error: "Failed to read project tree" });
    }
  });

  // ─── Serve a single file from the ZIP ─────────────────────
  // Supports both /api/repository/:id/file/path/to/file.py  (inline, for browser)
  //           and /api/repository/:id/raw/path/to/file.py   (raw, for curl)
  const serveFile = (inline: boolean) => async (req: Request, res: Response) => {
    try {
      const paper = await storage.getPublishedPaperById(req.params.id);
      if (!paper) return res.status(404).json({ error: "Project not found" });

      const zipPath = resolveZipPath(paper);
      if (!zipPath) return res.status(404).json({ error: "ZIP not found" });

      // req.params[0] captures the wildcard path
      const requestedPath = (req.params as any)[0];
      if (!requestedPath) return res.status(400).json({ error: "File path required" });

      // Security: no path traversal
      if (requestedPath.includes("..")) return res.status(400).json({ error: "Invalid path" });

      // Detect ZIP prefix
      const prefix = detectZipPrefix(zipPath);
      const zipEntryPath = prefix + requestedPath;

      // Extract single file to stdout
      const downloadsDir = path.resolve("downloads");
      const tmpDir = path.join(downloadsDir, `_repo_${Date.now()}`);
      fs.mkdirSync(tmpDir, { recursive: true });

      try {
        execSync(`unzip -o -q "${zipPath}" "${zipEntryPath}" -d "${tmpDir}"`, { timeout: 10000 });
        const extractedPath = path.join(tmpDir, zipEntryPath);

        if (!fs.existsSync(extractedPath)) {
          fs.rmSync(tmpDir, { recursive: true, force: true });
          return res.status(404).json({ error: "File not found in project" });
        }

        const ext = path.extname(requestedPath).toLowerCase();
        const mimeTypes: Record<string, string> = {
          ".py": "text/x-python", ".tex": "text/x-latex", ".bib": "text/x-bibtex",
          ".csv": "text/csv", ".tsv": "text/tab-separated-values",
          ".json": "application/json", ".txt": "text/plain",
          ".md": "text/markdown", ".pdf": "application/pdf",
          ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
          ".svg": "image/svg+xml",
          ".parquet": "application/octet-stream",
          ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          ".xls": "application/vnd.ms-excel",
          ".zip": "application/zip",
        };

        const contentType = mimeTypes[ext] || "application/octet-stream";
        const fileName = path.basename(requestedPath);
        res.setHeader("Content-Type", contentType);
        res.setHeader("Cache-Control", "public, max-age=3600");

        if (inline && (contentType.startsWith("text/") || contentType === "application/json")) {
          res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
        } else {
          res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
        }

        const data = fs.readFileSync(extractedPath);
        fs.rmSync(tmpDir, { recursive: true, force: true });
        res.send(data);
      } catch (err) {
        try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
        return res.status(404).json({ error: "File not found in project" });
      }
    } catch (error) {
      logger.error(`Repository file serve error: ${(error as Error).message}`);
      res.status(500).json({ error: "Failed to serve file" });
    }
  };

  app.get("/api/repository/:id/file/*", serveFile(true));
  app.get("/api/repository/:id/raw/*", serveFile(false));

  // ─── Download full project ZIP ────────────────────────────
  app.get("/api/repository/:id/download", async (req: Request, res: Response) => {
    try {
      const paper = await storage.getPublishedPaperById(req.params.id);
      if (!paper) return res.status(404).json({ error: "Project not found" });

      const zipPath = resolveZipPath(paper);
      if (!zipPath) return res.status(404).json({ error: "ZIP not found" });

      const safeName = (paper.title || "project").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 60);
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", `attachment; filename="${safeName}_project.zip"`);
      res.setHeader("Cache-Control", "public, max-age=86400");
      fs.createReadStream(zipPath).pipe(res);
    } catch (error) {
      logger.error(`Repository download error: ${(error as Error).message}`);
      res.status(500).json({ error: "Failed to download project" });
    }
  });

  // ─── Latest N projects ────────────────────────────────────
  app.get("/api/repository/latest", async (req: Request, res: Response) => {
    try {
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
      const papers = await storage.getAllPublishedPapers();
      const projects = papers
        .slice(0, limit)
        .map(({ latexContent, bibtexEntries, ...rest }) => ({
          id: rest.id,
          title: rest.title,
          domain: rest.domain,
          asid: rest.asid,
          publishedAt: rest.publishedAt,
          downloadUrl: rest.downloadUrl,
          projectZipUrl: rest.projectZipUrl,
        }));
      res.json(projects);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch latest projects" });
    }
  });

  // ─── Search projects ──────────────────────────────────────
  app.get("/api/repository/search", async (req: Request, res: Response) => {
    try {
      const q = (req.query.q as string || "").toLowerCase().trim();
      if (!q) return res.status(400).json({ error: "Query parameter 'q' is required" });

      const papers = await storage.getAllPublishedPapers();
      const results = papers
        .filter(p =>
          p.title.toLowerCase().includes(q) ||
          (p.domain || "").toLowerCase().includes(q) ||
          (p.asid || "").toLowerCase().includes(q) ||
          (p.authors || "").toLowerCase().includes(q) ||
          (p.abstract || "").toLowerCase().includes(q)
        )
        .map(({ latexContent, bibtexEntries, ...rest }) => ({
          id: rest.id,
          title: rest.title,
          authors: rest.authors,
          domain: rest.domain,
          asid: rest.asid,
          publishedAt: rest.publishedAt,
          downloadUrl: rest.downloadUrl,
          projectZipUrl: rest.projectZipUrl,
        }));
      res.json({ count: results.length, results });
    } catch (error) {
      res.status(500).json({ error: "Search failed" });
    }
  });

  // ─── List scripts for a project ───────────────────────────
  app.get("/api/repository/:id/scripts", async (req: Request, res: Response) => {
    try {
      const paper = await storage.getPublishedPaperById(req.params.id);
      if (!paper) return res.status(404).json({ error: "Project not found" });
      const zipPath = resolveZipPath(paper);
      if (!zipPath) return res.status(404).json({ error: "ZIP not found" });

      const output = execSync(`unzip -l "${zipPath}" 2>/dev/null`, { timeout: 5000 }).toString();
      const scripts = output.split("\n")
        .filter(line => /\.py$/i.test(line.trim()))
        .map(line => {
          const match = line.match(/^\s*(\d+)\s+\S+\s+\S+\s+(.+)/);
          if (!match) return null;
          let filepath = match[2].trim();
          // Strip project prefix
          const parts = filepath.split("/");
          if (parts.length > 1 && parts[0].endsWith("-project")) parts.shift();
          filepath = parts.join("/");
          return { name: parts[parts.length - 1], path: filepath, size: parseInt(match[1]) };
        })
        .filter(Boolean)
        .sort((a: any, b: any) => a.name.localeCompare(b.name));

      res.json({
        count: scripts.length,
        scripts: scripts.map((s: any) => ({
          ...s,
          url: `/api/repository/${req.params.id}/file/${s.path}`,
          rawUrl: `/api/repository/${req.params.id}/raw/${s.path}`,
        })),
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to list scripts" });
    }
  });

  // ─── List figures for a project ───────────────────────────
  app.get("/api/repository/:id/figures", async (req: Request, res: Response) => {
    try {
      const paper = await storage.getPublishedPaperById(req.params.id);
      if (!paper) return res.status(404).json({ error: "Project not found" });
      const zipPath = resolveZipPath(paper);
      if (!zipPath) return res.status(404).json({ error: "ZIP not found" });

      const output = execSync(`unzip -l "${zipPath}" 2>/dev/null`, { timeout: 5000 }).toString();
      const figures = output.split("\n")
        .filter(line => /\.(png|jpg|jpeg|svg|pdf)$/i.test(line.trim()))
        .map(line => {
          const match = line.match(/^\s*(\d+)\s+\S+\s+\S+\s+(.+)/);
          if (!match) return null;
          let filepath = match[2].trim();
          const parts = filepath.split("/");
          if (parts.length > 1 && parts[0].endsWith("-project")) parts.shift();
          filepath = parts.join("/");
          return { name: parts[parts.length - 1], path: filepath, size: parseInt(match[1]) };
        })
        .filter(Boolean)
        .sort((a: any, b: any) => a.name.localeCompare(b.name));

      res.json({
        count: figures.length,
        figures: figures.map((f: any) => ({
          ...f,
          url: `/api/repository/${req.params.id}/file/${f.path}`,
        })),
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to list figures" });
    }
  });

  // ─── List data files for a project ────────────────────────
  app.get("/api/repository/:id/data", async (req: Request, res: Response) => {
    try {
      const paper = await storage.getPublishedPaperById(req.params.id);
      if (!paper) return res.status(404).json({ error: "Project not found" });
      const zipPath = resolveZipPath(paper);
      if (!zipPath) return res.status(404).json({ error: "ZIP not found" });

      const output = execSync(`unzip -l "${zipPath}" 2>/dev/null`, { timeout: 5000 }).toString();
      const dataFiles = output.split("\n")
        .filter(line => /\.(csv|tsv|xlsx|xls|parquet|json|feather|pkl)$/i.test(line.trim()))
        .map(line => {
          const match = line.match(/^\s*(\d+)\s+\S+\s+\S+\s+(.+)/);
          if (!match) return null;
          let filepath = match[2].trim();
          const parts = filepath.split("/");
          if (parts.length > 1 && parts[0].endsWith("-project")) parts.shift();
          filepath = parts.join("/");
          const ext = path.extname(filepath).toLowerCase();
          return { name: parts[parts.length - 1], path: filepath, size: parseInt(match[1]), format: ext.slice(1) };
        })
        .filter(Boolean)
        .sort((a: any, b: any) => a.name.localeCompare(b.name));

      res.json({
        count: dataFiles.length,
        files: dataFiles.map((f: any) => ({
          ...f,
          url: `/api/repository/${req.params.id}/raw/${f.path}`,
        })),
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to list data files" });
    }
  });

  // ─── Auto-generated README / project summary ──────────────
  app.get("/api/repository/:id/readme", async (req: Request, res: Response) => {
    try {
      const paper = await storage.getPublishedPaperById(req.params.id);
      if (!paper) return res.status(404).json({ error: "Project not found" });

      const zipPath = resolveZipPath(paper);
      let fileList = "";
      if (zipPath) {
        try {
          const output = execSync(`unzip -l "${zipPath}" 2>/dev/null`, { timeout: 5000 }).toString();
          const tree = buildTree(output);
          const renderTree = (entries: TreeEntry[], indent = ""): string =>
            entries.map(e =>
              e.type === "dir"
                ? `${indent}${e.name}/\n${e.children ? renderTree(e.children, indent + "  ") : ""}`
                : `${indent}${e.name}${e.size ? ` (${formatBytes(e.size)})` : ""}\n`
            ).join("");
          fileList = renderTree(tree);
        } catch {}
      }

      const keywords = (() => { try { return JSON.parse(paper.keywords || "[]"); } catch { return []; } })();
      const readme = [
        `# ${paper.title}`,
        "",
        paper.asid ? `**ASID:** \`${paper.asid}\`` : "",
        paper.authors ? `**Authors:** ${paper.authors}` : "",
        paper.domain ? `**Domain:** ${paper.domain}` : "",
        paper.template ? `**Template:** ${paper.template}` : "",
        paper.wordCount ? `**Word count:** ~${paper.wordCount.toLocaleString()}` : "",
        paper.sectionCount ? `**Sections:** ${paper.sectionCount}` : "",
        paper.figureCount ? `**Figures:** ${paper.figureCount}` : "",
        `**Published:** ${new Date(paper.publishedAt).toISOString().split("T")[0]}`,
        "",
        keywords.length > 0 ? `**Keywords:** ${keywords.join(", ")}` : "",
        "",
        paper.abstract ? `## Abstract\n\n${paper.abstract}` : "",
        "",
        "## Download",
        "",
        paper.downloadUrl ? `- [Download PDF](${paper.downloadUrl})` : "",
        paper.projectZipUrl ? `- [Download Project ZIP](${paper.projectZipUrl})` : "",
        "",
        "## API Endpoints",
        "",
        `- Project tree: \`GET /api/repository/${paper.id}/tree\``,
        `- Scripts: \`GET /api/repository/${paper.id}/scripts\``,
        `- Figures: \`GET /api/repository/${paper.id}/figures\``,
        `- Data files: \`GET /api/repository/${paper.id}/data\``,
        `- Download ZIP: \`GET /api/repository/${paper.id}/download\``,
        `- View file: \`GET /api/repository/${paper.id}/file/{path}\``,
        `- Raw file: \`GET /api/repository/${paper.id}/raw/{path}\``,
        "",
        "## Quick Start",
        "",
        "```bash",
        `# Download the project`,
        `curl -LO ${req.protocol}://${req.get("host")}/api/repository/${paper.id}/download`,
        "",
        "# Extract",
        `unzip ${(paper.title || "project").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 30)}_project.zip`,
        "",
        "# Run the reproducibility pipeline",
        "pip install -r requirements.txt",
        "python run_pipeline.py",
        "```",
        "",
        fileList ? `## File Structure\n\n\`\`\`\n${fileList}\`\`\`` : "",
        "",
        "---",
        "*Generated by [AutoScholar.ai](https://autoscholar.ai) — Autonomous AI Research Engine*",
      ].filter(Boolean).join("\n");

      res.setHeader("Content-Type", "text/markdown; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=3600");
      res.send(readme);
    } catch (error) {
      logger.error(`README generation error: ${(error as Error).message}`);
      res.status(500).json({ error: "Failed to generate README" });
    }
  });
}

function formatBytes(bytes: number): string {
  if (bytes >= 1e6) return (bytes / 1e6).toFixed(1) + "MB";
  if (bytes >= 1e3) return (bytes / 1e3).toFixed(1) + "KB";
  return bytes + "B";
}
