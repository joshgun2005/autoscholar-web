import crypto from 'crypto';
import { db, schema } from "../db";
import { eq, desc } from "drizzle-orm";
import type { Message, InsertMessage, SharedReport, InsertSharedReport } from "./types";

const { messages, sharedReports } = schema;

export const messageMethods = {
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
  },

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
  },

  // ─── Shared Reports ─────────────────────────────────────

  async getSharedReportByShareId(shareId: string): Promise<SharedReport | undefined> {
    const [report] = await (db as any)
      .select()
      .from(sharedReports)
      .where(eq(sharedReports.shareId, shareId));
    return report ?? undefined;
  },

  async createSharedReport(report: InsertSharedReport): Promise<SharedReport> {
    const [created] = await (db as any)
      .insert(sharedReports)
      .values({ id: crypto.randomUUID(), ...report, createdAt: new Date() })
      .returning();
    return created;
  },

  async getAllSharedReports(): Promise<SharedReport[]> {
    return await (db as any).select().from(sharedReports).orderBy(desc(sharedReports.createdAt));
  },

  async deleteSharedReport(id: string): Promise<void> {
    await (db as any).delete(sharedReports).where(eq(sharedReports.id, id));
  },
};
