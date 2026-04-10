import crypto from 'crypto';
import { db, schema } from "../db";
import { eq, desc } from "drizzle-orm";
import type { User, InsertUser } from "./types";

const { users, conversationSessions } = schema;

export const userMethods = {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await (db as any).select().from(users).where(eq(users.id, id));
    return user ?? undefined;
  },

  async getUserByToken(token: string): Promise<User | undefined> {
    const [user] = await (db as any).select().from(users).where(eq(users.token, token));
    return user ?? undefined;
  },

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await (db as any).select().from(users).where(eq(users.username, username));
    return user ?? undefined;
  },

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await (db as any)
      .insert(users)
      .values({ id: crypto.randomUUID(), ...insertUser, createdAt: new Date() })
      .returning();
    return user;
  },

  async getAllUsers(): Promise<User[]> {
    return await (db as any).select().from(users).orderBy(desc(users.createdAt));
  },

  async updateUser(id: string, updates: Partial<{ displayName: string; email: string | null; institution: string | null; department: string | null; orcid: string | null; website: string | null; bio: string | null; anthropicApiKey: string | null; passwordHash: string; title: string | null; profilePhoto: string | null; googleScholar: string | null; researchGate: string | null; linkedin: string | null; location: string | null; longBio: string | null; researchInterests: string | null; bannerImage: string | null }>): Promise<User> {
    const [updated] = await (db as any)
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return updated;
  },

  async deleteUser(id: string): Promise<void> {
    await (db as any).delete(conversationSessions).where(eq(conversationSessions.userId, id));
    await (db as any).delete(users).where(eq(users.id, id));
  },
};
