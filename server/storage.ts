import { db, schema } from "./db";
import { eq, desc, and, lt, gte } from "drizzle-orm";
import { logger } from "./utils/logger";

// Infer types from the active schema
type User = typeof schema.users.$inferSelect;
type InsertUser = Omit<User, "id" | "createdAt">;

type CrawledPage = typeof schema.crawledPages.$inferSelect;
type InsertCrawledPage = Omit<CrawledPage, "id" | "crawledAt">;

type Message = typeof schema.messages.$inferSelect;
type InsertMessage = Omit<Message, "id" | "createdAt">;

type SharedReport = typeof schema.sharedReports.$inferSelect;
type InsertSharedReport = Omit<SharedReport, "id" | "createdAt">;

type ConversationSession = typeof schema.conversationSessions.$inferSelect;
type InsertConversationSession = Omit<ConversationSession, "id" | "createdAt" | "updatedAt">;

type ActiveUser = typeof schema.activeUsers.$inferSelect;
type InsertActiveUser = Omit<ActiveUser, "id" | "createdAt">;

type AnalyticsMetric = typeof schema.analyticsMetrics.$inferSelect;
type InsertAnalyticsMetric = Omit<AnalyticsMetric, "id" | "timestamp">;

type RequestLog = typeof schema.requestLogs.$inferSelect;
type InsertRequestLog = Omit<RequestLog, "id" | "timestamp">;

const {
  users,
  crawledPages,
  messages,
  sharedReports,
  conversationSessions,
  activeUsers,
  analyticsMetrics,
  requestLogs,
} = schema;

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByToken(token: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  deleteUser(id: string): Promise<void>;

  // Crawled Pages
  getCrawledPage(id: string): Promise<CrawledPage | undefined>;
  getCrawledPageByUrl(url: string): Promise<CrawledPage | undefined>;
  createCrawledPage(page: InsertCrawledPage): Promise<CrawledPage>;
  updateCrawledPage(id: string, page: Partial<InsertCrawledPage>): Promise<CrawledPage>;

  // Messages
  getMessagesBySession(sessionId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;

  // Shared Reports
  getSharedReportByShareId(shareId: string): Promise<SharedReport | undefined>;
  createSharedReport(report: InsertSharedReport): Promise<SharedReport>;
  getAllSharedReports(): Promise<SharedReport[]>;
  deleteSharedReport(id: string): Promise<void>;

  // Conversation Sessions
  getConversationSessions(userId?: string): Promise<ConversationSession[]>;
  getConversationSession(sessionId: string): Promise<ConversationSession | undefined>;
  getConversationSessionByUserAndSessionId(sessionId: string, userId: string): Promise<ConversationSession | undefined>;
  createConversationSession(session: InsertConversationSession): Promise<ConversationSession>;
  updateConversationSession(sessionId: string, updates: Partial<InsertConversationSession>): Promise<ConversationSession>;
  getAllConversationSessions(): Promise<ConversationSession[]>;
  deleteConversationSessionById(id: string): Promise<void>;

  // Active Users
  getActiveUserBySessionId(sessionId: string): Promise<ActiveUser | undefined>;
  upsertActiveUser(user: InsertActiveUser): Promise<ActiveUser>;
  updateActiveUserHeartbeat(sessionId: string, status: string, currentQuery?: string): Promise<void>;
  getActiveUsers(): Promise<ActiveUser[]>;
  cleanupStaleUsers(timeoutMinutes?: number): Promise<void>;

  // Analytics Metrics
  createAnalyticsMetric(metric: InsertAnalyticsMetric): Promise<AnalyticsMetric>;
  getLatestMetrics(periodType: string, limit?: number): Promise<AnalyticsMetric[]>;
  getMetricsInTimeRange(startTime: Date, endTime: Date): Promise<AnalyticsMetric[]>;

  // Request Logs
  createRequestLog(log: InsertRequestLog): Promise<RequestLog>;
  getRecentRequestLogs(limit?: number): Promise<RequestLog[]>;
  getRequestLogsByStatus(status: string, limit?: number): Promise<RequestLog[]>;
}

export class DatabaseStorage implements IStorage {
  // ─── Users ──────────────────────────────────────────────

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await (db as any).select().from(users).where(eq(users.id, id));
    return user ?? undefined;
  }

  async getUserByToken(token: string): Promise<User | undefined> {
    const [user] = await (db as any).select().from(users).where(eq(users.token, token));
    return user ?? undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await (db as any)
      .insert(users)
      .values({ id: crypto.randomUUID(), ...insertUser, createdAt: new Date() })
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await (db as any).select().from(users).orderBy(desc(users.createdAt));
  }

  async deleteUser(id: string): Promise<void> {
    await (db as any).delete(conversationSessions).where(eq(conversationSessions.userId, id));
    await (db as any).delete(users).where(eq(users.id, id));
  }

  // ─── Crawled Pages ──────────────────────────────────────

  async getCrawledPage(id: string): Promise<CrawledPage | undefined> {
    const [page] = await (db as any).select().from(crawledPages).where(eq(crawledPages.id, id));
    return page ?? undefined;
  }

  async getCrawledPageByUrl(url: string): Promise<CrawledPage | undefined> {
    const [page] = await (db as any).select().from(crawledPages).where(eq(crawledPages.url, url));
    return page ?? undefined;
  }

  async createCrawledPage(page: InsertCrawledPage): Promise<CrawledPage> {
    const [created] = await (db as any)
      .insert(crawledPages)
      .values({ id: crypto.randomUUID(), ...page, crawledAt: new Date() })
      .returning();
    return created;
  }

  async updateCrawledPage(id: string, page: Partial<InsertCrawledPage>): Promise<CrawledPage> {
    const [updated] = await (db as any)
      .update(crawledPages)
      .set(page)
      .where(eq(crawledPages.id, id))
      .returning();
    return updated;
  }

  // ─── Messages ───────────────────────────────────────────

  async getMessagesBySession(sessionId: string): Promise<Message[]> {
    const msgs = await (db as any)
      .select()
      .from(messages)
      .where(eq(messages.sessionId, sessionId))
      .orderBy(desc(messages.createdAt));

    return msgs.map((msg: Message) => ({
      ...msg,
      sources: typeof msg.sources === "string" ? JSON.parse(msg.sources) : msg.sources,
    }));
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [msg] = await (db as any)
      .insert(messages)
      .values({
        id: crypto.randomUUID(),
        ...message,
        sources: Array.isArray(message.sources) ? JSON.stringify(message.sources) : message.sources,
        createdAt: new Date(),
      })
      .returning();

    return {
      ...msg,
      sources: typeof msg.sources === "string" ? JSON.parse(msg.sources) : msg.sources,
    };
  }

  // ─── Shared Reports ─────────────────────────────────────

  async getSharedReportByShareId(shareId: string): Promise<SharedReport | undefined> {
    const [report] = await (db as any)
      .select()
      .from(sharedReports)
      .where(eq(sharedReports.shareId, shareId));
    return report ?? undefined;
  }

  async createSharedReport(report: InsertSharedReport): Promise<SharedReport> {
    const [created] = await (db as any)
      .insert(sharedReports)
      .values({ id: crypto.randomUUID(), ...report, createdAt: new Date() })
      .returning();
    return created;
  }

  async getAllSharedReports(): Promise<SharedReport[]> {
    return await (db as any).select().from(sharedReports).orderBy(desc(sharedReports.createdAt));
  }

  async deleteSharedReport(id: string): Promise<void> {
    await (db as any).delete(sharedReports).where(eq(sharedReports.id, id));
  }

  // ─── Conversation Sessions ──────────────────────────────

  async getConversationSessions(userId?: string): Promise<ConversationSession[]> {
    if (userId) {
      return await (db as any)
        .select()
        .from(conversationSessions)
        .where(eq(conversationSessions.userId, userId))
        .orderBy(desc(conversationSessions.updatedAt));
    }
    return await (db as any)
      .select()
      .from(conversationSessions)
      .orderBy(desc(conversationSessions.updatedAt));
  }

  async getConversationSession(sessionId: string): Promise<ConversationSession | undefined> {
    const [session] = await (db as any)
      .select()
      .from(conversationSessions)
      .where(eq(conversationSessions.sessionId, sessionId));
    return session ?? undefined;
  }

  async getConversationSessionByUserAndSessionId(
    sessionId: string,
    userId: string,
  ): Promise<ConversationSession | undefined> {
    const [session] = await (db as any)
      .select()
      .from(conversationSessions)
      .where(
        and(
          eq(conversationSessions.sessionId, sessionId),
          eq(conversationSessions.userId, userId),
        ),
      );
    return session ?? undefined;
  }

  async createConversationSession(session: InsertConversationSession): Promise<ConversationSession> {
    const now = new Date();
    const [created] = await (db as any)
      .insert(conversationSessions)
      .values({ id: crypto.randomUUID(), ...session, createdAt: now, updatedAt: now })
      .returning();
    return created;
  }

  async updateConversationSession(
    sessionId: string,
    updates: Partial<InsertConversationSession>,
  ): Promise<ConversationSession> {
    const [updated] = await (db as any)
      .update(conversationSessions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(conversationSessions.sessionId, sessionId))
      .returning();
    return updated;
  }

  async getAllConversationSessions(): Promise<ConversationSession[]> {
    return await (db as any)
      .select()
      .from(conversationSessions)
      .orderBy(desc(conversationSessions.updatedAt));
  }

  async deleteConversationSessionById(id: string): Promise<void> {
    await (db as any).delete(conversationSessions).where(eq(conversationSessions.id, id));
  }

  // ─── Active Users ───────────────────────────────────────

  async getActiveUserBySessionId(sessionId: string): Promise<ActiveUser | undefined> {
    const [user] = await (db as any)
      .select()
      .from(activeUsers)
      .where(eq(activeUsers.sessionId, sessionId));
    return user ?? undefined;
  }

  async upsertActiveUser(user: InsertActiveUser): Promise<ActiveUser> {
    const existing = await this.getActiveUserBySessionId(user.sessionId);

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
  }

  async updateActiveUserHeartbeat(sessionId: string, status: string, currentQuery?: string): Promise<void> {
    await (db as any)
      .update(activeUsers)
      .set({ lastHeartbeat: new Date(), status, currentQuery: currentQuery ?? null })
      .where(eq(activeUsers.sessionId, sessionId));
  }

  async getActiveUsers(): Promise<ActiveUser[]> {
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    return await (db as any)
      .select()
      .from(activeUsers)
      .where(gte(activeUsers.lastHeartbeat, twoMinutesAgo))
      .orderBy(desc(activeUsers.lastHeartbeat));
  }

  async cleanupStaleUsers(timeoutMinutes: number = 5): Promise<void> {
    const cutoffTime = new Date(Date.now() - timeoutMinutes * 60 * 1000);
    await (db as any).delete(activeUsers).where(lt(activeUsers.lastHeartbeat, cutoffTime));
  }

  // ─── Analytics Metrics ──────────────────────────────────

  async createAnalyticsMetric(metric: InsertAnalyticsMetric): Promise<AnalyticsMetric> {
    const [created] = await (db as any)
      .insert(analyticsMetrics)
      .values({ id: crypto.randomUUID(), ...metric, timestamp: new Date() })
      .returning();
    return created;
  }

  async getLatestMetrics(periodType: string, limit: number = 60): Promise<AnalyticsMetric[]> {
    return await (db as any)
      .select()
      .from(analyticsMetrics)
      .where(eq(analyticsMetrics.periodType, periodType))
      .orderBy(desc(analyticsMetrics.timestamp))
      .limit(limit);
  }

  async getMetricsInTimeRange(startTime: Date, endTime: Date): Promise<AnalyticsMetric[]> {
    return await (db as any)
      .select()
      .from(analyticsMetrics)
      .where(and(gte(analyticsMetrics.timestamp, startTime), lt(analyticsMetrics.timestamp, endTime)))
      .orderBy(desc(analyticsMetrics.timestamp));
  }

  // ─── Request Logs ───────────────────────────────────────

  async createRequestLog(log: InsertRequestLog): Promise<RequestLog> {
    const [created] = await (db as any)
      .insert(requestLogs)
      .values({ id: crypto.randomUUID(), ...log, timestamp: new Date() })
      .returning();
    return created;
  }

  async getRecentRequestLogs(limit: number = 100): Promise<RequestLog[]> {
    return await (db as any)
      .select()
      .from(requestLogs)
      .orderBy(desc(requestLogs.timestamp))
      .limit(limit);
  }

  async getRequestLogsByStatus(status: string, limit: number = 100): Promise<RequestLog[]> {
    return await (db as any)
      .select()
      .from(requestLogs)
      .where(eq(requestLogs.status, status))
      .orderBy(desc(requestLogs.timestamp))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();
