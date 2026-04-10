/**
 * AutoScholar Public Research API — Middleware
 *
 * Provides API key authentication, rate limiting, pagination,
 * and standard JSON envelope for all /api/v1/* endpoints.
 */

import type { Request, Response, NextFunction } from "express";
import crypto from "crypto";
import { storage } from "../../storage";

// ─── Types ───────────────────────────────────────────────────

export interface ApiRequest extends Request {
  apiKey?: {
    id: string;
    userId: string | null;
    name: string;
    scopes: string[];
    rateLimit: number;
  };
  pagination?: {
    page: number;
    limit: number;
    offset: number;
  };
}

export interface ApiEnvelope<T = unknown> {
  ok: boolean;
  data?: T;
  error?: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ─── Helpers ─────────────────────────────────────────────────

function hashKey(raw: string): string {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

export function generateApiKey(): { raw: string; hash: string; prefix: string } {
  const raw = `ask_${crypto.randomBytes(32).toString("hex")}`;
  const hash = hashKey(raw);
  const prefix = raw.slice(0, 12);
  return { raw, hash, prefix };
}

// ─── In-memory rate limiter (per key) ────────────────────────

const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(keyId: string, limit: number): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hour
  let bucket = rateBuckets.get(keyId);

  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + windowMs };
    rateBuckets.set(keyId, bucket);
  }

  bucket.count++;
  const remaining = Math.max(0, limit - bucket.count);
  return { allowed: bucket.count <= limit, remaining, resetAt: bucket.resetAt };
}

// Clean up stale buckets every 10 minutes
setInterval(() => {
  const now = Date.now();
  rateBuckets.forEach((bucket, key) => {
    if (now >= bucket.resetAt) rateBuckets.delete(key);
  });
}, 10 * 60 * 1000);

// ─── API Key Authentication Middleware ───────────────────────

export async function authenticateApiKey(req: ApiRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const queryKey = req.query.api_key as string | undefined;
  const rawKey = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : queryKey;

  if (!rawKey) {
    return res.status(401).json({
      ok: false,
      error: "Missing API key. Provide it via Authorization: Bearer <key> header or ?api_key= query parameter.",
    } satisfies ApiEnvelope);
  }

  const keyHash = hashKey(rawKey);
  const apiKey = await storage.getApiKeyByHash(keyHash);

  if (!apiKey) {
    return res.status(401).json({ ok: false, error: "Invalid API key." } satisfies ApiEnvelope);
  }

  if (apiKey.revoked) {
    return res.status(403).json({ ok: false, error: "This API key has been revoked." } satisfies ApiEnvelope);
  }

  if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()) {
    return res.status(403).json({ ok: false, error: "This API key has expired." } satisfies ApiEnvelope);
  }

  // Rate limiting
  const rl = checkRateLimit(apiKey.id, apiKey.rateLimit);
  res.set("X-RateLimit-Limit", String(apiKey.rateLimit));
  res.set("X-RateLimit-Remaining", String(rl.remaining));
  res.set("X-RateLimit-Reset", new Date(rl.resetAt).toISOString());

  if (!rl.allowed) {
    return res.status(429).json({
      ok: false,
      error: `Rate limit exceeded. Limit: ${apiKey.rateLimit} requests/hour. Resets at ${new Date(rl.resetAt).toISOString()}.`,
    } satisfies ApiEnvelope);
  }

  // Track usage (fire-and-forget)
  storage.incrementApiKeyUsage(apiKey.id).catch(() => {});

  req.apiKey = {
    id: apiKey.id,
    userId: apiKey.userId,
    name: apiKey.name,
    scopes: (apiKey.scopes || "read").split(",").map(s => s.trim()),
    rateLimit: apiKey.rateLimit,
  };

  next();
}

// ─── Scope Guard ─────────────────────────────────────────────

export function requireScope(...scopes: string[]) {
  return (req: ApiRequest, res: Response, next: NextFunction) => {
    if (!req.apiKey) {
      return res.status(401).json({ ok: false, error: "Authentication required." } satisfies ApiEnvelope);
    }
    const hasScope = scopes.some(s => req.apiKey!.scopes.includes(s));
    if (!hasScope) {
      return res.status(403).json({
        ok: false,
        error: `Insufficient scope. Required: ${scopes.join(" or ")}. Your key has: ${req.apiKey.scopes.join(", ")}.`,
      } satisfies ApiEnvelope);
    }
    next();
  };
}

// ─── Pagination Middleware ────────────────────────────────────

export function paginate(defaultLimit = 20, maxLimit = 100) {
  return (req: ApiRequest, _res: Response, next: NextFunction) => {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(maxLimit, Math.max(1, parseInt(req.query.limit as string) || defaultLimit));
    req.pagination = { page, limit, offset: (page - 1) * limit };
    next();
  };
}

// ─── JSON envelope helpers ───────────────────────────────────

export function ok<T>(res: Response, data: T, status = 200) {
  return res.status(status).json({ ok: true, data } satisfies ApiEnvelope<T>);
}

export function okPaginated<T>(res: Response, items: T[], total: number, pagination: NonNullable<ApiRequest["pagination"]>) {
  const { page, limit } = pagination;
  return res.status(200).json({
    ok: true,
    data: items,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  } satisfies ApiEnvelope<T[]>);
}

export function fail(res: Response, error: string, status = 400) {
  return res.status(status).json({ ok: false, error } satisfies ApiEnvelope);
}
