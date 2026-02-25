import { db, schema } from "./db";
import { eq, desc, and, lt, gte, sql } from "drizzle-orm";

// Types will be inferred from schema
type User = typeof schema.users.$inferSelect;
type InsertUser = any;
type CrawledPage = typeof schema.crawledPages.$inferSelect;
type InsertCrawledPage = any;
type Embedding = typeof schema.embeddings.$inferSelect;
type InsertEmbedding = any;
type Message = typeof schema.messages.$inferSelect;
type InsertMessage = any;
type SharedReport = typeof schema.sharedReports.$inferSelect;
type InsertSharedReport = any;
type ConversationSession = typeof schema.conversationSessions.$inferSelect;
type InsertConversationSession = any;
type ActiveUser = typeof schema.activeUsers.$inferSelect;
type InsertActiveUser = any;
type AnalyticsMetric = typeof schema.analyticsMetrics.$inferSelect;
type InsertAnalyticsMetric = any;
type RequestLog = typeof schema.requestLogs.$inferSelect;
type InsertRequestLog = any;

const { users, crawledPages, embeddings, messages, sharedReports, conversationSessions, activeUsers, analyticsMetrics, requestLogs } = schema;

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByToken(token: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getAllUsers(): Promise<User[]>;
  deleteUser(id: number): Promise<void>;

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
  deleteSharedReport(id: number): Promise<void>;

  // Conversation Sessions
  getConversationSessions(userId?: string): Promise<ConversationSession[]>;
  getConversationSession(sessionId: string): Promise<ConversationSession | undefined>;
  getConversationSessionByUserAndSessionId(sessionId: string, userId: string): Promise<ConversationSession | undefined>;
  createConversationSession(session: InsertConversationSession): Promise<ConversationSession>;
  updateConversationSession(sessionId: string, updates: Partial<InsertConversationSession>): Promise<ConversationSession>;
  getAllConversationSessions(): Promise<ConversationSession[]>;
  deleteConversationSessionById(id: number): Promise<void>;

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
  // Users
  async getUser(id: string): Promise<User | undefined> {
    console.log('🗄️  DB: getUser', id);
    const [user] = await db.select().from(users).where(eq(users.id, id));
    console.log('   Result:', user ? 'Found' : 'Not found');
    return user || undefined;
  }

  async getUserByToken(token: string): Promise<User | undefined> {
    console.log('🗄️  DB: getUserByToken', token.substring(0, 12) + '...');
    const [user] = await db.select().from(users).where(eq(users.token, token));
    console.log('   Result:', user ? 'Found' : 'Not found');
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    console.log('🗄️  DB: createUser', insertUser.displayName);
    const userWithId = {
      id: crypto.randomUUID(),
      ...insertUser,
      createdAt: new Date(),
    };
    const [user] = await db
      .insert(users)
      .values(userWithId as any)
      .returning();
    console.log('   Result: Created user with ID', user.id);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    console.log('🗄️  DB: getAllUsers');
    const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
    console.log('   Result:', allUsers.length, 'users');
    return allUsers;
  }

  async deleteUser(id: number): Promise<void> {
    console.log('🗄️  DB: deleteUser', id);
    // First check if it's a string UUID or numeric ID
    const userIdField = typeof id === 'number' ? 'id' : 'id';

    // Delete user's sessions first
    await db.delete(conversationSessions).where(eq(conversationSessions.userId, id.toString()));

    // Then delete the user
    await db.delete(users).where(eq(users.id, id.toString()));
    console.log('   Result: User deleted');
  }

  // Crawled Pages
  async getCrawledPage(id: string): Promise<CrawledPage | undefined> {
    const [page] = await db.select().from(crawledPages).where(eq(crawledPages.id, id));
    return page || undefined;
  }
  
  async getCrawledPageByUrl(url: string): Promise<CrawledPage | undefined> {
    const [page] = await db.select().from(crawledPages).where(eq(crawledPages.url, url));
    return page || undefined;
  }
  
  async createCrawledPage(page: InsertCrawledPage): Promise<CrawledPage> {
    const pageWithId = {
      id: crypto.randomUUID(),
      ...page,
      crawledAt: new Date(),
    };
    const [crawledPage] = await db
      .insert(crawledPages)
      .values(pageWithId as any)
      .returning();
    return crawledPage;
  }
  
  async updateCrawledPage(id: string, page: Partial<InsertCrawledPage>): Promise<CrawledPage> {
    const [updated] = await db
      .update(crawledPages)
      .set(page)
      .where(eq(crawledPages.id, id))
      .returning();
    return updated;
  }
  
  // Messages
  async getMessagesBySession(sessionId: string): Promise<Message[]> {
    console.log('🗄️  DB: getMessagesBySession', sessionId);
    const msgs = await db
      .select()
      .from(messages)
      .where(eq(messages.sessionId, sessionId))
      .orderBy(desc(messages.createdAt));

    console.log('   Result:', msgs.length, 'messages');
    // Convert sources from JSON string back to array
    return msgs.map(msg => ({
      ...msg,
      sources: msg.sources ? JSON.parse(msg.sources as string) : null,
    })) as Message[];
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    console.log('🗄️  DB: createMessage');
    console.log('   Role:', message.role);
    console.log('   Content length:', message.content.length);
    const messageWithId = {
      id: crypto.randomUUID(),
      ...message,
      // Convert sources array to JSON string for SQLite
      sources: message.sources ? JSON.stringify(message.sources) : null,
      createdAt: new Date(),
    };
    const [msg] = await db
      .insert(messages)
      .values(messageWithId as any)
      .returning();

    console.log('   Result: Message created with ID', msg.id);
    // Convert sources back to array for the return value
    return {
      ...msg,
      sources: msg.sources ? JSON.parse(msg.sources as string) : null,
    } as Message;
  }
  
  // Shared Reports
  async getSharedReportByShareId(shareId: string): Promise<SharedReport | undefined> {
    const [report] = await db
      .select()
      .from(sharedReports)
      .where(eq(sharedReports.shareId, shareId));
    return report || undefined;
  }

  async createSharedReport(report: InsertSharedReport): Promise<SharedReport> {
    const reportWithId = {
      id: crypto.randomUUID(),
      ...report,
      createdAt: new Date(),
    };
    const [sharedReport] = await db
      .insert(sharedReports)
      .values(reportWithId as any)
      .returning();
    return sharedReport;
  }

  async getAllSharedReports(): Promise<SharedReport[]> {
    console.log('🗄️  DB: getAllSharedReports');
    const reports = await db.select().from(sharedReports).orderBy(desc(sharedReports.createdAt));
    console.log('   Result:', reports.length, 'reports');
    return reports;
  }

  async deleteSharedReport(id: number): Promise<void> {
    console.log('🗄️  DB: deleteSharedReport', id);
    await db.delete(sharedReports).where(eq(sharedReports.id, id.toString()));
    console.log('   Result: Report deleted');
  }

  // Conversation Sessions
  async getConversationSessions(userId?: string): Promise<ConversationSession[]> {
    console.log('🗄️  DB: getConversationSessions', userId ? `for user ${userId}` : 'all');
    const result = userId
      ? await db
          .select()
          .from(conversationSessions)
          .where(eq(conversationSessions.userId, userId))
          .orderBy(desc(conversationSessions.updatedAt))
      : await db
          .select()
          .from(conversationSessions)
          .orderBy(desc(conversationSessions.updatedAt));
    console.log('   Result:', result.length, 'sessions');
    return result;
  }

  async getConversationSession(sessionId: string): Promise<ConversationSession | undefined> {
    console.log('🗄️  DB: getConversationSession', sessionId);
    const [session] = await db
      .select()
      .from(conversationSessions)
      .where(eq(conversationSessions.sessionId, sessionId));
    console.log('   Result:', session ? 'Found' : 'Not found');
    return session || undefined;
  }

  async getConversationSessionByUserAndSessionId(sessionId: string, userId: string): Promise<ConversationSession | undefined> {
    console.log('🗄️  DB: getConversationSessionByUserAndSessionId');
    console.log('   Session ID:', sessionId);
    console.log('   User ID:', userId);
    const [session] = await db
      .select()
      .from(conversationSessions)
      .where(
        and(
          eq(conversationSessions.sessionId, sessionId),
          eq(conversationSessions.userId, userId)
        )
      );
    console.log('   Result:', session ? 'Found' : 'Not found');
    return session || undefined;
  }

  async createConversationSession(session: InsertConversationSession): Promise<ConversationSession> {
    console.log('🗄️  DB: createConversationSession');
    console.log('   Session ID:', session.sessionId);
    console.log('   Title:', session.title);
    const now = new Date();
    const sessionWithId = {
      id: crypto.randomUUID(),
      ...session,
      createdAt: now,
      updatedAt: now,
    };
    const [conversationSession] = await db
      .insert(conversationSessions)
      .values(sessionWithId as any)
      .returning();
    console.log('   Result: Session created with ID', conversationSession.id);
    return conversationSession;
  }

  async updateConversationSession(sessionId: string, updates: Partial<InsertConversationSession>): Promise<ConversationSession> {
    console.log('🗄️  DB: updateConversationSession', sessionId);
    const [updated] = await db
      .update(conversationSessions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(conversationSessions.sessionId, sessionId))
      .returning();
    console.log('   Result: Session updated');
    return updated;
  }

  async getAllConversationSessions(): Promise<ConversationSession[]> {
    console.log('🗄️  DB: getAllConversationSessions');
    const sessions = await db.select().from(conversationSessions).orderBy(desc(conversationSessions.updatedAt));
    console.log('   Result:', sessions.length, 'sessions');
    return sessions;
  }

  async deleteConversationSessionById(id: number): Promise<void> {
    console.log('🗄️  DB: deleteConversationSessionById', id);
    await db.delete(conversationSessions).where(eq(conversationSessions.id, id.toString()));
    console.log('   Result: Session deleted');
  }

  // Active Users
  async getActiveUserBySessionId(sessionId: string): Promise<ActiveUser | undefined> {
    const [user] = await db.select().from(activeUsers).where(eq(activeUsers.sessionId, sessionId));
    return user || undefined;
  }

  async upsertActiveUser(user: InsertActiveUser): Promise<ActiveUser> {
    const existing = await this.getActiveUserBySessionId(user.sessionId);

    if (existing) {
      const [updated] = await db
        .update(activeUsers)
        .set({
          ...user,
          lastHeartbeat: new Date(),
        })
        .where(eq(activeUsers.sessionId, user.sessionId))
        .returning();
      return updated;
    } else {
      const userWithId = {
        id: crypto.randomUUID(),
        ...user,
        lastHeartbeat: new Date(),
        createdAt: new Date(),
      };
      const [created] = await db
        .insert(activeUsers)
        .values(userWithId as any)
        .returning();
      return created;
    }
  }

  async updateActiveUserHeartbeat(sessionId: string, status: string, currentQuery?: string): Promise<void> {
    await db
      .update(activeUsers)
      .set({
        lastHeartbeat: new Date(),
        status,
        currentQuery: currentQuery || null,
      })
      .where(eq(activeUsers.sessionId, sessionId));
  }

  async getActiveUsers(): Promise<ActiveUser[]> {
    // Get users with heartbeat in last 2 minutes
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    return await db
      .select()
      .from(activeUsers)
      .where(gte(activeUsers.lastHeartbeat, twoMinutesAgo))
      .orderBy(desc(activeUsers.lastHeartbeat));
  }

  async cleanupStaleUsers(timeoutMinutes: number = 5): Promise<void> {
    const cutoffTime = new Date(Date.now() - timeoutMinutes * 60 * 1000);
    await db.delete(activeUsers).where(lt(activeUsers.lastHeartbeat, cutoffTime));
  }

  // Analytics Metrics
  async createAnalyticsMetric(metric: InsertAnalyticsMetric): Promise<AnalyticsMetric> {
    const metricWithId = {
      id: crypto.randomUUID(),
      ...metric,
      timestamp: new Date(),
    };
    const [created] = await db
      .insert(analyticsMetrics)
      .values(metricWithId as any)
      .returning();
    return created;
  }

  async getLatestMetrics(periodType: string, limit: number = 60): Promise<AnalyticsMetric[]> {
    return await db
      .select()
      .from(analyticsMetrics)
      .where(eq(analyticsMetrics.periodType, periodType))
      .orderBy(desc(analyticsMetrics.timestamp))
      .limit(limit);
  }

  async getMetricsInTimeRange(startTime: Date, endTime: Date): Promise<AnalyticsMetric[]> {
    return await db
      .select()
      .from(analyticsMetrics)
      .where(
        and(
          gte(analyticsMetrics.timestamp, startTime),
          lt(analyticsMetrics.timestamp, endTime)
        )
      )
      .orderBy(desc(analyticsMetrics.timestamp));
  }

  // Request Logs
  async createRequestLog(log: InsertRequestLog): Promise<RequestLog> {
    const logWithId = {
      id: crypto.randomUUID(),
      ...log,
      timestamp: new Date(),
    };
    const [created] = await db
      .insert(requestLogs)
      .values(logWithId as any)
      .returning();
    return created;
  }

  async getRecentRequestLogs(limit: number = 100): Promise<RequestLog[]> {
    return await db
      .select()
      .from(requestLogs)
      .orderBy(desc(requestLogs.timestamp))
      .limit(limit);
  }

  async getRequestLogsByStatus(status: string, limit: number = 100): Promise<RequestLog[]> {
    return await db
      .select()
      .from(requestLogs)
      .where(eq(requestLogs.status, status))
      .orderBy(desc(requestLogs.timestamp))
      .limit(limit);
  }
}

export const storage = new DatabaseStorage();
