/**
 * /api/v1/keys — API Key Management
 *
 * Researchers create and manage their API keys here.
 * Key creation does NOT require an existing API key (uses session auth or is open).
 */

import type { Express, Request, Response } from "express";
import { storage } from "../../../storage";
import { generateApiKey, ok, fail, authenticateApiKey, type ApiRequest } from "../middleware";

export function registerKeyRoutes(app: Express) {
  /**
   * POST /api/v1/keys
   * Create a new API key.
   * Body: { name: string, scopes?: string, userId?: string }
   * Returns the raw key ONCE — it cannot be retrieved again.
   */
  app.post("/api/v1/keys", async (req: Request, res: Response) => {
    try {
      const { name, scopes, userId } = req.body;
      if (!name || typeof name !== "string" || name.length < 2) {
        return fail(res, "name is required (min 2 characters).");
      }

      const validScopes = ["read", "search", "download", "write"];
      const requestedScopes = scopes
        ? String(scopes).split(",").map((s: string) => s.trim()).filter((s: string) => validScopes.includes(s))
        : ["read"];
      if (requestedScopes.length === 0) {
        return fail(res, `Invalid scopes. Valid values: ${validScopes.join(", ")}`);
      }

      const { raw, hash, prefix } = generateApiKey();
      const apiKey = await storage.createApiKey({
        userId: userId || null,
        name,
        keyHash: hash,
        keyPrefix: prefix,
        scopes: requestedScopes.join(","),
        rateLimit: 100,
        totalRequests: 0,
        lastUsedAt: null,
        expiresAt: null,
        revoked: false,
      });

      return ok(res, {
        id: apiKey.id,
        key: raw, // Only returned once!
        prefix: prefix,
        name: apiKey.name,
        scopes: requestedScopes,
        rateLimit: apiKey.rateLimit,
        createdAt: apiKey.createdAt,
        warning: "Store this key securely. It will NOT be shown again.",
      }, 201);
    } catch (error) {
      return fail(res, "Failed to create API key.", 500);
    }
  });

  /**
   * GET /api/v1/keys
   * List all keys for the authenticated user (masked).
   * Requires valid API key with "read" scope.
   */
  app.get("/api/v1/keys", authenticateApiKey, async (req: ApiRequest, res: Response) => {
    try {
      const userId = req.apiKey?.userId;
      if (!userId) {
        return fail(res, "This key is not associated with a user account.", 403);
      }

      const keys = await storage.getApiKeysByUserId(userId);
      const masked = keys.map(k => ({
        id: k.id,
        name: k.name,
        prefix: k.keyPrefix,
        scopes: k.scopes?.split(",") || ["read"],
        rateLimit: k.rateLimit,
        totalRequests: k.totalRequests,
        lastUsedAt: k.lastUsedAt,
        revoked: k.revoked,
        createdAt: k.createdAt,
      }));

      return ok(res, masked);
    } catch (error) {
      return fail(res, "Failed to list API keys.", 500);
    }
  });

  /**
   * DELETE /api/v1/keys/:id
   * Revoke an API key.
   */
  app.delete("/api/v1/keys/:id", authenticateApiKey, async (req: ApiRequest, res: Response) => {
    try {
      await storage.revokeApiKey(req.params.id);
      return ok(res, { revoked: true });
    } catch (error) {
      return fail(res, "Failed to revoke API key.", 500);
    }
  });
}
