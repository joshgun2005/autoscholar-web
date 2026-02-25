import type { Express, Request, Response } from "express";
import { randomBytes } from "crypto";
import { storage } from "../storage";

export function registerAuthRoutes(app: Express) {
  // Register - Create new user account with generated token
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { name } = req.body;

      if (!name || typeof name !== 'string' || name.trim().length < 2) {
        return res.status(400).json({ error: "Le nom doit contenir au moins 2 caractères" });
      }

      const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
      const bytes = randomBytes(7);
      let tokenSuffix = '';
      for (let i = 0; i < 7; i++) {
        tokenSuffix += chars[bytes[i] % chars.length];
      }
      const token = `vquant-${tokenSuffix}`;

      const user = await storage.createUser({
        displayName: name.trim(),
        token,
      });

      (req.session as any).userId = user.id;

      res.json({
        user: { id: user.id, displayName: user.displayName },
        token,
      });
    } catch (error) {
      console.error("Register error:", error);
      res.status(500).json({ error: "Failed to create account" });
    }
  });

  // Login - Authenticate with token
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { token } = req.body;

      if (!token || typeof token !== 'string') {
        return res.status(400).json({ error: "Le token est requis" });
      }

      const user = await storage.getUserByToken(token.trim());
      if (!user) {
        return res.status(401).json({ error: "Token invalide" });
      }

      (req.session as any).userId = user.id;

      res.json({
        user: { id: user.id, displayName: user.displayName },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Failed to login" });
    }
  });

  // Logout
  app.post("/api/auth/logout", async (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
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
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to get user" });
    }
  });
}
