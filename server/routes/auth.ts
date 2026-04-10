import type { Express, Request, Response } from "express";

// Simple XOR obfuscation for storing API keys
const OBFUSCATION_KEY = process.env.SESSION_SECRET || "autoscholar-default-key-2026";

function obfuscateKey(apiKey: string): string {
  const buf = Buffer.from(apiKey, "utf-8");
  const key = Buffer.from(OBFUSCATION_KEY, "utf-8");
  const result = Buffer.alloc(buf.length);
  for (let i = 0; i < buf.length; i++) {
    result[i] = buf[i] ^ key[i % key.length];
  }
  return result.toString("base64");
}

function deobfuscateKey(encoded: string): string {
  const buf = Buffer.from(encoded, "base64");
  const key = Buffer.from(OBFUSCATION_KEY, "utf-8");
  const result = Buffer.alloc(buf.length);
  for (let i = 0; i < buf.length; i++) {
    result[i] = buf[i] ^ key[i % key.length];
  }
  return result.toString("utf-8");
}

export { deobfuscateKey, obfuscateKey };

/**
 * Extract the authenticated user ID from the request (session-based).
 */
export function getUserId(req: Request): string | null {
  return (req.session as any)?.userId || null;
}

// ─── Password Gate ──────────────────────────────────────

const GATE_USERS: Record<string, string> = {
  "spboucher123": "Simon-Pierre",
  "rboucher123": "Richard",
};

export function registerGateRoutes(app: Express) {
  app.post("/api/gate/login", (req: Request, res: Response) => {
    const { password } = req.body;
    const userName = GATE_USERS[password];
    if (userName) {
      (req.session as any).gateAuthenticated = true;
      (req.session as any).gateUserName = userName;
      req.session.save(() => {
        res.json({ authenticated: true, userName });
      });
    } else {
      res.status(401).json({ error: "Incorrect password" });
    }
  });

  app.get("/api/gate/status", (req: Request, res: Response) => {
    const authenticated = (req.session as any).gateAuthenticated === true;
    const userName = (req.session as any).gateUserName || null;
    res.json({ authenticated, userName });
  });

  // ─── Minimal auth endpoints (admin-only, no user accounts) ──

  /** GET /api/auth/me — Returns admin session info or null. */
  app.get("/api/auth/me", (req: Request, res: Response) => {
    const userId = getUserId(req);
    if ((req.session as any).isAdmin && userId === "admin") {
      return res.json({
        user: {
          id: "admin",
          displayName: "Admin",
          email: "admin@autoscholar.ai",
          isAdmin: true,
        },
      });
    }
    res.json({ user: null });
  });

  /** POST /api/auth/logout — Clear session. */
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) return res.status(500).json({ error: "Failed to logout" });
      res.json({ success: true });
    });
  });
}
