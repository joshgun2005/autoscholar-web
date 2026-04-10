import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { logger } from "../utils/logger";
import { getUserId } from "./auth";

export function registerPromptRoutes(app: Express) {
  // GET /api/prompts — list all public prompts
  app.get("/api/prompts", async (_req: Request, res: Response) => {
    try {
      const prompts = await storage.getAllSavedPrompts();
      res.json(prompts);
    } catch (error) {
      logger.error("Failed to fetch prompts:", error);
      res.status(500).json({ error: "Failed to fetch prompts" });
    }
  });

  // POST /api/prompts — add a prompt to the public library (anyone can add)
  app.post("/api/prompts", async (req: Request, res: Response) => {
    const { title, content, authorName } = req.body;
    if (!content || typeof content !== "string" || !content.trim()) {
      return res.status(400).json({ error: "Content is required" });
    }

    // If user is logged in, attach their userId
    const userId = getUserId(req);

    try {
      const prompt = await storage.createSavedPrompt({
        userId,
        authorName: (authorName && typeof authorName === "string" ? authorName.trim() : null) || "Anonymous",
        title: (title && typeof title === "string" ? title.trim() : content.trim().slice(0, 60) + "..."),
        content: content.trim(),
      });
      res.status(201).json(prompt);
    } catch (error) {
      logger.error("Failed to create prompt:", error);
      res.status(500).json({ error: "Failed to create prompt" });
    }
  });
}
