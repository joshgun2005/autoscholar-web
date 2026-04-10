import crypto from 'crypto';
import { db, schema } from "../db";
import { eq, desc, and, lt, gte } from "drizzle-orm";
import type {
  ActiveUser, InsertActiveUser,
  AnalyticsMetric, InsertAnalyticsMetric,
  RequestLog, InsertRequestLog,
} from "./types";

const { activeUsers, analyticsMetrics, requestLogs } = schema;

export const analyticsMethods = {
  // ─── Active Users ───────────────────────────────────────

  async getActiveUserBySessionId(sessionId: string): Promise<ActiveUser | undefined> {
    const [user] = await (db as any)
      .select()
      .from(activeUsers)
      .where(eq(activeUsers.sessionId, sessionId));
    return user ?? undefined;
  },

  async upsertActiveUser(user: InsertActiveUser): Promise<ActiveUser> {
    const existing = await analyticsMethods.getActiveUserBySessionId(user.sessionId);

    if (existing) {
      const [updated] = await (db as any)
        .update(activeUsers)
        .set({ ...user, lastHeartbeat: new Date() })
        .where(eq(activeUsers.sessionId, user.sessionId))
        .returning();
      return updated;
    }

    const [created] = await (db as any)
      .insert(activeUsers)
      .values({ id: crypto.randomUUID(), ...user, lastHeartbeat: new Date(), createdAt: new Date() })
      .returning();
    return created;
  },

  async updateActiveUserHeartbeat(sessionId: string, status: string, currentQuery?: string): Promise<void> {
    await (db as any)
      .update(activeUsers)
      .set({ lastHeartbeat: new Date(), status, currentQuery: currentQuery ?? null })
      .where(eq(activeUsers.sessionId, sessionId));
  },

  async getActiveUsers(): Promise<ActiveUser[]> {
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    return await (db as any)
      .select()
      .from(activeUsers)
      .where(gte(activeUsers.lastHeartbeat, twoMinutesAgo))
      .orderBy(desc(activeUsers.lastHeartbeat));
  },

  async cleanupStaleUsers(timeoutMinutes: number = 5): Promise<void> {
    const cutoffTime = new Date(Date.now() - timeoutMinutes * 60 * 1000);
    await (db as any).delete(activeUsers).where(lt(activeUsers.lastHeartbeat, cutoffTime));
  },

  // ─── Analytics Metrics ──────────────────────────────────

  async createAnalyticsMetric(metric: InsertAnalyticsMetric): Promise<AnalyticsMetric> {
    const [created] = await (db as any)
      .insert(analyticsMetrics)
      .values({ id: crypto.randomUUID(), ...metric, timestamp: new Date() })
      .returning();
    return created;
  },

  async getLatestMetrics(periodType: string, limit: number = 60): Promise<AnalyticsMetric[]> {
    return await (db as any)
      .select()
      .from(analyticsMetrics)
      .where(eq(analyticsMetrics.periodType, periodType))
      .orderBy(desc(analyticsMetrics.timestamp))
      .limit(limit);
  },

  async getMetricsInTimeRange(startTime: Date, endTime: Date): Promise<AnalyticsMetric[]> {
    return await (db as any)
      .select()
      .from(analyticsMetrics)
      .where(and(gte(analyticsMetrics.timestamp, startTime), lt(analyticsMetrics.timestamp, endTime)))
      .orderBy(desc(analyticsMetrics.timestamp));
  },

  // ─── Request Logs ───────────────────────────────────────

  async createRequestLog(log: InsertRequestLog): Promise<RequestLog> {
    const [created] = await (db as any)
      .insert(requestLogs)
      .values({ id: crypto.randomUUID(), ...log, timestamp: new Date() })
      .returning();
    return created;
  },

  async getRecentRequestLogs(limit: number = 100): Promise<RequestLog[]> {
    return await (db as any)
      .select()
      .from(requestLogs)
      .orderBy(desc(requestLogs.timestamp))
      .limit(limit);
  },

  async getRequestLogsByStatus(status: string, limit: number = 100): Promise<RequestLog[]> {
    return await (db as any)
      .select()
      .from(requestLogs)
      .where(eq(requestLogs.status, status))
      .orderBy(desc(requestLogs.timestamp))
      .limit(limit);
  },
};
