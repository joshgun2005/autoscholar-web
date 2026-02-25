import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "../storage";

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  (req.session as any).isAdmin = true;
  next();
}

export function registerAdminRoutes(app: Express) {
  // Admin login
  app.post("/api/admin/login", async (req: Request, res: Response) => {
    try {
      (req.session as any).isAdmin = true;
      res.json({ success: true });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ error: "Failed to login" });
    }
  });

  // Get all database tables data
  app.get("/api/admin/database", requireAdmin, async (req: Request, res: Response) => {
    try {
      const users = await storage.getAllUsers();
      const sessions = await storage.getAllConversationSessions();
      const sharedReports = await storage.getAllSharedReports();

      const totalInputTokens = sessions.reduce((sum, s) => sum + (s.inputTokens || 0), 0);
      const totalOutputTokens = sessions.reduce((sum, s) => sum + (s.outputTokens || 0), 0);
      const totalCost = sessions.reduce((sum, s) => sum + (s.totalCost || 0), 0);

      const userMetrics = users.map(u => {
        const userSessions = sessions.filter(s => s.userId === u.id);
        const inputTokens = userSessions.reduce((sum, s) => sum + (s.inputTokens || 0), 0);
        const outputTokens = userSessions.reduce((sum, s) => sum + (s.outputTokens || 0), 0);
        const cost = userSessions.reduce((sum, s) => sum + (s.totalCost || 0), 0);
        return {
          userId: u.id,
          displayName: u.displayName,
          inputTokens,
          outputTokens,
          totalTokens: inputTokens + outputTokens,
          cost,
          sessionCount: userSessions.length,
        };
      });

      res.json({
        users: users.map(u => ({
          id: u.id,
          displayName: u.displayName,
          createdAt: u.createdAt,
        })),
        sessions: sessions.map(s => ({
          id: s.id,
          sessionId: s.sessionId,
          userId: s.userId,
          title: s.title,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
          inputTokens: s.inputTokens || 0,
          outputTokens: s.outputTokens || 0,
          totalCost: s.totalCost || 0,
        })),
        sharedReports: sharedReports.map(r => ({
          id: r.id,
          shareId: r.shareId,
          question: r.question.substring(0, 100),
          createdAt: r.createdAt,
        })),
        metrics: {
          totalInputTokens,
          totalOutputTokens,
          totalTokens: totalInputTokens + totalOutputTokens,
          totalCost,
          totalSessions: sessions.length,
          averageCostPerSession: sessions.length > 0 ? totalCost / sessions.length : 0,
          userMetrics,
        },
      });
    } catch (error) {
      console.error("Get database error:", error);
      res.status(500).json({ error: "Failed to get database data" });
    }
  });

  // Delete user
  app.delete("/api/admin/users/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      await storage.deleteUser(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete user error:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // Delete session
  app.delete("/api/admin/sessions/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      await storage.deleteConversationSessionById(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete session error:", error);
      res.status(500).json({ error: "Failed to delete session" });
    }
  });

  // Delete shared report
  app.delete("/api/admin/reports/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      await storage.deleteSharedReport(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Delete report error:", error);
      res.status(500).json({ error: "Failed to delete report" });
    }
  });
}
