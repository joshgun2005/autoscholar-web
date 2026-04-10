import type { Express, Request, Response } from "express";
import { storage } from "../../storage";

export function registerDoiRoutes(app: Express) {
  // ─── ASID: resolve ASID to paper ──────────────────────
  app.get("/api/asid/:asid", async (req: Request, res: Response) => {
    try {
      const paper = await storage.getPublishedPaperByAsid(req.params.asid);
      if (!paper) {
        return res.status(404).json({ error: "Paper not found for this ASID" });
      }
      res.json(paper);
    } catch (error) {
      console.error("Failed to resolve ASID:", error);
      res.status(500).json({ error: "Failed to resolve ASID" });
    }
  });

  // ─── ASID: generate ASID for a paper (admin) ─────────
  app.post("/api/asid/generate", async (req: Request, res: Response) => {
    try {
      const { paperId } = req.body;
      if (!paperId) {
        return res.status(400).json({ error: "paperId is required" });
      }

      const paper = await storage.getPublishedPaperById(paperId);
      if (!paper) {
        return res.status(404).json({ error: "Paper not found" });
      }
      if ((paper as any).asid) {
        return res.json({ asid: (paper as any).asid, message: "Paper already has an ASID" });
      }

      const { generateAsid, assignAsidToPaper, asidToUrl } = await import('../../services/doiService');
      const asid = await generateAsid();
      await assignAsidToPaper(paperId, asid);

      res.json({ asid, url: asidToUrl(asid), paperId });
    } catch (error) {
      console.error("Failed to generate ASID:", error);
      res.status(500).json({ error: "Failed to generate ASID" });
    }
  });

  // ─── ASID: batch back-fill ASIDs for all papers ──────
  app.post("/api/asid/backfill", async (_req: Request, res: Response) => {
    try {
      const { backfillAsids } = await import('../../services/doiService');
      const count = await backfillAsids();
      res.json({ backfilled: count });
    } catch (error) {
      console.error("Failed to backfill ASIDs:", error);
      res.status(500).json({ error: "Failed to backfill ASIDs" });
    }
  });

  // ─── ASID: counter status (admin) ───────────────────
  app.get("/api/asid/status", async (_req: Request, res: Response) => {
    try {
      const { getAsidCounterStatus } = await import('../../services/doiService');
      const counters = await getAsidCounterStatus();
      res.json({ counters });
    } catch (error) {
      console.error("Failed to get ASID status:", error);
      res.status(500).json({ error: "Failed to get ASID status" });
    }
  });
}
