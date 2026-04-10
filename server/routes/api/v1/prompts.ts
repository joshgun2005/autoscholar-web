/**
 * /api/v1/prompts — Public Prompt Library
 *
 * Access the community-contributed research prompt library.
 */

import type { Express, Response } from "express";
import { storage } from "../../../storage";
import {
  authenticateApiKey, requireScope, paginate,
  ok, okPaginated, fail,
  type ApiRequest,
} from "../middleware";

export function registerPromptApiRoutes(app: Express) {
  const auth = authenticateApiKey;
  const read = requireScope("read");
  const write = requireScope("write");

  /**
   * GET /api/v1/prompts
   * List all prompts with optional search.
   * Query: ?page, ?limit, ?q (search), ?author
   */
  app.get("/api/v1/prompts", auth, read, paginate(20, 100), async (req: ApiRequest, res: Response) => {
    try {
      let prompts = await storage.getAllSavedPrompts();

      const { q, author } = req.query;
      if (q) {
        const search = String(q).toLowerCase();
        prompts = prompts.filter(p =>
          p.title.toLowerCase().includes(search) ||
          p.content.toLowerCase().includes(search)
        );
      }
      if (author) {
        prompts = prompts.filter(p => (p.authorName || "").toLowerCase().includes(String(author).toLowerCase()));
      }

      const total = prompts.length;
      const { offset, limit } = req.pagination!;
      const page = prompts.slice(offset, offset + limit);

      const items = page.map(p => ({
        id: p.id,
        title: p.title,
        content: p.content,
        authorName: p.authorName || "Anonymous",
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      }));

      return okPaginated(res, items, total, req.pagination!);
    } catch (error) {
      return fail(res, "Failed to fetch prompts.", 500);
    }
  });

  /**
   * POST /api/v1/prompts
   * Contribute a new prompt to the library.
   * Body: { title: string, content: string, authorName?: string }
   */
  app.post("/api/v1/prompts", auth, write, async (req: ApiRequest, res: Response) => {
    try {
      const { title, content, authorName } = req.body;
      if (!title || !content) {
        return fail(res, "title and content are required.");
      }

      const prompt = await storage.createSavedPrompt({
        userId: req.apiKey?.userId || null,
        authorName: authorName || "API Contributor",
        title,
        content,
      });

      return ok(res, {
        id: prompt.id,
        title: prompt.title,
        content: prompt.content,
        authorName: prompt.authorName,
        createdAt: prompt.createdAt,
      }, 201);
    } catch (error) {
      return fail(res, "Failed to create prompt.", 500);
    }
  });
}
