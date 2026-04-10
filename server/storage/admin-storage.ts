import crypto from 'crypto';
import { db, schema } from "../db";
import { eq, desc } from "drizzle-orm";
import type {
  GovernorDecisionRow, InsertGovernorDecision,
  SavedPrompt, InsertSavedPrompt,
  PeerReview, InsertPeerReview,
  Donation, InsertDonation,
  ApiKey, InsertApiKey,
} from "./types";
import { paperMethods } from "./paper-storage";

const { governorDecisions, siteConfig, savedPrompts, peerReviews, donations, apiKeys } = schema;

export const adminMethods = {
  // ─── Governor State & Decisions ─────────────────────────

  async getGovernorState(runId: string): Promise<any | null> {
    const run = await paperMethods.getPaperRunById(runId);
    if (!run?.governorState) return null;
    try {
      return JSON.parse(run.governorState);
    } catch {
      return null;
    }
  },

  async saveGovernorState(runId: string, state: any): Promise<void> {
    const { paperRuns } = schema;
    await (db as any)
      .update(paperRuns)
      .set({ governorState: JSON.stringify(state) })
      .where(eq(paperRuns.id, runId));
  },

  async createGovernorDecision(decision: InsertGovernorDecision): Promise<GovernorDecisionRow> {
    const [created] = await (db as any)
      .insert(governorDecisions)
      .values({ id: crypto.randomUUID(), ...decision, createdAt: new Date() })
      .returning();
    return created;
  },

  async getGovernorDecisions(runId: string): Promise<GovernorDecisionRow[]> {
    return await (db as any)
      .select()
      .from(governorDecisions)
      .where(eq(governorDecisions.runId, runId))
      .orderBy(desc(governorDecisions.timestamp));
  },

  // ─── Site Config ───────────────────────────────────────

  async getSiteConfig(key: string): Promise<string | undefined> {
    const [row] = await (db as any).select().from(siteConfig).where(eq(siteConfig.key, key));
    return row?.value;
  },

  async setSiteConfig(key: string, value: string): Promise<void> {
    const existing = await adminMethods.getSiteConfig(key);
    if (existing !== undefined) {
      await (db as any).update(siteConfig).set({ value, updatedAt: new Date() }).where(eq(siteConfig.key, key));
    } else {
      await (db as any).insert(siteConfig).values({ key, value, updatedAt: new Date() });
    }
  },

  // ─── Saved Prompts (public library) ─────────────────────

  async getAllSavedPrompts(): Promise<SavedPrompt[]> {
    return await (db as any)
      .select()
      .from(savedPrompts)
      .orderBy(desc(savedPrompts.createdAt));
  },

  async createSavedPrompt(prompt: InsertSavedPrompt): Promise<SavedPrompt> {
    const now = new Date();
    const [created] = await (db as any)
      .insert(savedPrompts)
      .values({ id: crypto.randomUUID(), ...prompt, createdAt: now, updatedAt: now })
      .returning();
    return created;
  },

  // ─── Peer Reviews ──────────────────────────────────────

  async getPeerReviewByPaperId(paperId: string): Promise<PeerReview | undefined> {
    const [review] = await (db as any)
      .select()
      .from(peerReviews)
      .where(eq(peerReviews.paperId, paperId));
    return review ?? undefined;
  },

  async createPeerReview(review: InsertPeerReview): Promise<PeerReview> {
    const [created] = await (db as any)
      .insert(peerReviews)
      .values({ id: crypto.randomUUID(), ...review, createdAt: new Date() })
      .returning();
    return created;
  },

  async getAllPeerReviews(): Promise<PeerReview[]> {
    return await (db as any)
      .select()
      .from(peerReviews)
      .orderBy(desc(peerReviews.createdAt));
  },

  // ─── Donations ─────────────────────────────────────────

  async createDonation(donation: InsertDonation): Promise<Donation> {
    const [created] = await (db as any)
      .insert(donations)
      .values({ id: crypto.randomUUID(), ...donation, createdAt: new Date() })
      .returning();
    return created;
  },

  async getAllDonations(): Promise<Donation[]> {
    return await (db as any).select().from(donations).orderBy(desc(donations.createdAt));
  },

  async updateDonationStatus(id: string, status: string): Promise<void> {
    await (db as any).update(donations).set({ status }).where(eq(donations.id, id));
  },

  // ─── API Keys ──────────────────────────────────────────────

  async createApiKey(key: InsertApiKey): Promise<ApiKey> {
    const [created] = await (db as any)
      .insert(apiKeys)
      .values({ id: crypto.randomUUID(), ...key, createdAt: new Date() })
      .returning();
    return created;
  },

  async getApiKeyByHash(keyHash: string): Promise<ApiKey | undefined> {
    const [key] = await (db as any).select().from(apiKeys).where(eq(apiKeys.keyHash, keyHash));
    return key ?? undefined;
  },

  async getApiKeysByUserId(userId: string): Promise<ApiKey[]> {
    return await (db as any).select().from(apiKeys)
      .where(eq(apiKeys.userId, userId))
      .orderBy(desc(apiKeys.createdAt));
  },

  async incrementApiKeyUsage(id: string): Promise<void> {
    const [key] = await (db as any).select().from(apiKeys).where(eq(apiKeys.id, id));
    if (key) {
      await (db as any).update(apiKeys).set({
        totalRequests: (key.totalRequests || 0) + 1,
        lastUsedAt: new Date(),
      }).where(eq(apiKeys.id, id));
    }
  },

  async revokeApiKey(id: string): Promise<void> {
    await (db as any).update(apiKeys).set({ revoked: true }).where(eq(apiKeys.id, id));
  },

  async deleteApiKey(id: string): Promise<void> {
    await (db as any).delete(apiKeys).where(eq(apiKeys.id, id));
  },
};
