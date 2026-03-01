import type { Express, Request, Response } from "express";
import { randomBytes } from "crypto";
import { storage } from "../storage";
import { logger } from "../utils/logger";
import { registerBodySchema, loginBodySchema } from "./validation";

const GATE_USERS: Record<string, string> = {
  "spboucher123": "Simon-Pierre",
  "rboucher123": "Richard",
};

export function registerGateRoutes(app: Express) {
  // Gate login — verify password and set session flag
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
      res.status(401).json({ error: "Mot de passe incorrect" });
    }
  });

  // Gate status — check if user has passed the gate
  app.get("/api/gate/status", (req: Request, res: Response) => {
    const authenticated = (req.session as any).gateAuthenticated === true;
    const userName = (req.session as any).gateUserName || null;
    res.json({ authenticated, userName });
  });
}

export function registerAuthRoutes(app: Express) {
  // Register
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const parsed = registerBodySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0].message });
      }

      const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
      const bytes = randomBytes(7);
      let tokenSuffix = '';
      for (let i = 0; i < 7; i++) {
        tokenSuffix += chars[bytes[i] % chars.length];
      }
      const token = `vquant-${tokenSuffix}`;

      const user = await storage.createUser({
        displayName: parsed.data.name.trim(),
        token,
      });

      (req.session as any).userId = user.id;

      res.json({
        user: { id: user.id, displayName: user.displayName },
        token,
      });
    } catch (error) {
      logger.error(`Register error: ${(error as Error).message}`);
      res.status(500).json({ error: "Failed to create account" });
    }
  });

  // Login
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const parsed = loginBodySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0].message });
      }

      const user = await storage.getUserByToken(parsed.data.token.trim());
      if (!user) {
        return res.status(401).json({ error: "Token invalide" });
      }

      (req.session as any).userId = user.id;

      res.json({
        user: { id: user.id, displayName: user.displayName },
      });
    } catch (error) {
      logger.error(`Login error: ${(error as Error).message}`);
      res.status(500).json({ error: "Failed to login" });
    }
  });

  // Logout
  app.post("/api/auth/logout", async (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        logger.error(`Logout error: ${err.message}`);
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.json({ success: true });
    });
  });

  // Get current user
  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      const userId = (req.session as any).userId;
      if (!userId) return res.json({ user: null });

      const user = await storage.getUser(userId);
      if (!user) return res.json({ user: null });

      res.json({
        user: { id: user.id, displayName: user.displayName },
      });
    } catch (error) {
      logger.error(`Get user error: ${(error as Error).message}`);
      res.status(500).json({ error: "Failed to get user" });
    }
  });
}
