import crypto from 'crypto';
import { db, schema } from "../db";
import { eq, desc, and } from "drizzle-orm";
import type { ConversationSession, InsertConversationSession } from "./types";

const { conversationSessions } = schema;

export const sessionMethods = {
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
  },

  async getConversationSession(sessionId: string): Promise<ConversationSession | undefined> {
    const [session] = await (db as any)
      .select()
      .from(conversationSessions)
      .where(eq(conversationSessions.sessionId, sessionId));
    return session ?? undefined;
  },

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
  },

  async createConversationSession(session: InsertConversationSession): Promise<ConversationSession> {
    const now = new Date();
    const [created] = await (db as any)
      .insert(conversationSessions)
      .values({ id: crypto.randomUUID(), ...session, createdAt: now, updatedAt: now })
      .returning();
    return created;
  },

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
  },

  async getAllConversationSessions(): Promise<ConversationSession[]> {
    return await (db as any)
      .select()
      .from(conversationSessions)
      .orderBy(desc(conversationSessions.updatedAt));
  },

  async deleteConversationSessionById(id: string): Promise<void> {
    await (db as any).delete(conversationSessions).where(eq(conversationSessions.id, id));
  },
};
