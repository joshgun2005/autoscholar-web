import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { requireAdmin } from "./admin";
import { logger } from "../utils/logger";
import { heartbeatBodySchema } from "./validation";

export function registerAnalyticsRoutes(app: Express) {
  // Heartbeat - Update user activity
  app.post("/api/analytics/heartbeat", async (req: Request, res: Response) => {
    try {
      const parsed = heartbeatBodySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0].message });
      }
      const { sessionId, status, currentQuery, userId } = parsed.data;

      const userAgent = req.headers['user-agent'] || 'Unknown';
      const ipAddress = req.ip || req.socket.remoteAddress || 'Unknown';

      await storage.upsertActiveUser({
        sessionId,
        userId: userId || null,
        status: status || 'idle',
        currentQuery: currentQuery || null,
        lastHeartbeat: new Date(),
        userAgent,
        ipAddress,
      });

      res.json({ success: true });
    } catch (error) {
      logger.error("Heartbeat error:", error);
      res.status(500).json({ error: "Failed to update heartbeat" });
    }
  });

  // Get active users
  app.get("/api/analytics/active-users", requireAdmin, async (req: Request, res: Response) => {
    try {
      await storage.cleanupStaleUsers(2);
      const activeUsers = await storage.getActiveUsers();

      const statusCounts = activeUsers.reduce((acc, user) => {
        acc[user.status || 'idle'] = (acc[user.status || 'idle'] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      res.json({
        total: activeUsers.length,
        generating: statusCounts.generating || 0,
        idle: statusCounts.idle || 0,
        error: statusCounts.error || 0,
        users: activeUsers.map(u => ({
          sessionId: u.sessionId,
          userId: u.userId,
          status: u.status,
          currentQuery: u.currentQuery,
          lastHeartbeat: u.lastHeartbeat,
          userAgent: u.userAgent,
        })),
      });
    } catch (error) {
      logger.error("Get active users error:", error);
      res.status(500).json({ error: "Failed to get active users" });
    }
  });

  // Real-time stats (public)
  app.get("/api/analytics/real-time-stats", async (req: Request, res: Response) => {
    try {
      await storage.cleanupStaleUsers(2);
      const activeUsers = await storage.getActiveUsers();
      const allSessions = await storage.getAllConversationSessions();

      const totalTokens = allSessions.reduce((sum, s) => sum + (s.inputTokens || 0) + (s.outputTokens || 0), 0);
      const totalCost = allSessions.reduce((sum, s) => sum + (s.totalCost || 0), 0);

      const recentLogs = await storage.getRecentRequestLogs(100);
      const recentErrors = recentLogs.filter(log => log.status === 'error');

      res.json({
        activeUsers: {
          total: activeUsers.length,
          generating: activeUsers.filter(u => u.status === 'generating').length,
        },
        sessions: {
          total: allSessions.length,
          today: allSessions.filter(s => {
            const createdAt = new Date(s.createdAt);
            return createdAt.toDateString() === new Date().toDateString();
          }).length,
        },
        tokens: {
          total: totalTokens,
          input: allSessions.reduce((sum, s) => sum + (s.inputTokens || 0), 0),
          output: allSessions.reduce((sum, s) => sum + (s.outputTokens || 0), 0),
        },
        cost: {
          total: totalCost,
          today: allSessions
            .filter(s => new Date(s.createdAt).toDateString() === new Date().toDateString())
            .reduce((sum, s) => sum + (s.totalCost || 0), 0),
        },
        errors: {
          lastHour: recentErrors.length,
          rate: recentLogs.length > 0 ? (recentErrors.length / recentLogs.length) * 100 : 0,
        },
      });
    } catch (error) {
      logger.error("Get real-time stats error:", error);
      res.status(500).json({ error: "Failed to get stats" });
    }
  });

  // Get analytics metrics
  app.get("/api/analytics/metrics", requireAdmin, async (req: Request, res: Response) => {
    try {
      const { periodType = 'minute', limit = 60 } = req.query;
      const metrics = await storage.getLatestMetrics(
        periodType as string,
        parseInt(limit as string),
      );
      res.json({ metrics });
    } catch (error) {
      logger.error("Get metrics error:", error);
      res.status(500).json({ error: "Failed to get metrics" });
    }
  });
}
