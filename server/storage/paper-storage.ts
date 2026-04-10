import crypto from 'crypto';
import { db, schema } from "../db";
import { eq, desc } from "drizzle-orm";
import type { PublishedPaper, InsertPublishedPaper, PaperRun, InsertPaperRun } from "./types";
import { sessionMethods } from "./session-storage";

const { publishedPapers, paperRuns } = schema;

const ACTIVE_STATUSES = ['queued', 'researching', 'analyzing', 'drafting', 'validating'];

export const paperMethods = {
  // ─── Published Papers ─────────────────────────────────

  async getAllPublishedPapers(): Promise<PublishedPaper[]> {
    return await (db as any).select().from(publishedPapers).orderBy(desc(publishedPapers.publishedAt));
  },

  async getJournalPapers(): Promise<PublishedPaper[]> {
    return await (db as any).select().from(publishedPapers)
      .where(eq(publishedPapers.showInJournal, 1))
      .orderBy(desc(publishedPapers.publishedAt));
  },

  /** Get cost data for all journal papers by joining with their conversation sessions.
   *  Recalculates cost from token counts using current Opus 4.6 pricing ($5/$25 per MTok). */
  async getJournalPaperCosts(): Promise<Array<{ paperId: string; inputTokens: number; outputTokens: number; totalCost: number }>> {
    const papers: PublishedPaper[] = await (db as any).select().from(publishedPapers)
      .where(eq(publishedPapers.showInJournal, 1));
    const results: Array<{ paperId: string; inputTokens: number; outputTokens: number; totalCost: number }> = [];
    for (const paper of papers) {
      if (!paper.sessionId) continue;
      const session = await sessionMethods.getConversationSession(paper.sessionId);
      if (session) {
        const input = session.inputTokens || 0;
        const output = session.outputTokens || 0;
        const cost = (input / 1_000_000) * 5.00 + (output / 1_000_000) * 25.00;
        results.push({
          paperId: paper.id,
          inputTokens: input,
          outputTokens: output,
          totalCost: Math.round(cost * 1000) / 1000,
        });
      }
    }
    return results;
  },

  async getPublishedPaperById(id: string): Promise<PublishedPaper | undefined> {
    const [paper] = await (db as any).select().from(publishedPapers).where(eq(publishedPapers.id, id));
    return paper ?? undefined;
  },

  async getPublishedPaperByAsid(asid: string): Promise<PublishedPaper | undefined> {
    const [paper] = await (db as any).select().from(publishedPapers).where(eq(publishedPapers.asid, asid));
    return paper ?? undefined;
  },

  async createPublishedPaper(paper: InsertPublishedPaper): Promise<PublishedPaper> {
    const [created] = await (db as any)
      .insert(publishedPapers)
      .values({ id: crypto.randomUUID(), ...paper, publishedAt: new Date() })
      .returning();
    return created;
  },

  async deletePublishedPaper(id: string): Promise<boolean> {
    const [deleted] = await (db as any)
      .delete(publishedPapers)
      .where(eq(publishedPapers.id, id))
      .returning();
    return !!deleted;
  },

  async updatePaperVisibility(id: string, showInJournal: number): Promise<void> {
    await (db as any)
      .update(publishedPapers)
      .set({ showInJournal })
      .where(eq(publishedPapers.id, id));
  },

  async updatePaperDomain(id: string, domain: string): Promise<void> {
    await (db as any)
      .update(publishedPapers)
      .set({ domain })
      .where(eq(publishedPapers.id, id));
  },

  async updatePaperLatexContent(id: string, latexContent: string, bibtexEntries: string | null): Promise<void> {
    await (db as any)
      .update(publishedPapers)
      .set({ latexContent, bibtexEntries })
      .where(eq(publishedPapers.id, id));
  },

  // ─── Paper Runs ──────────────────────────────────────────

  async createPaperRun(run: InsertPaperRun): Promise<PaperRun> {
    const [created] = await (db as any)
      .insert(paperRuns)
      .values({ id: crypto.randomUUID(), ...run, createdAt: new Date() })
      .returning();
    return created;
  },

  async getPaperRunById(id: string): Promise<PaperRun | undefined> {
    const [run] = await (db as any).select().from(paperRuns).where(eq(paperRuns.id, id));
    return run ?? undefined;
  },

  async updatePaperRunStatus(id: string, status: string, extras?: Partial<InsertPaperRun>): Promise<PaperRun> {
    const [updated] = await (db as any)
      .update(paperRuns)
      .set({ status, lastHeartbeat: new Date(), ...(extras || {}) })
      .where(eq(paperRuns.id, id))
      .returning();
    return updated;
  },

  /** Touch the heartbeat timestamp to signal the run is still alive. */
  async heartbeatPaperRun(id: string): Promise<void> {
    await (db as any)
      .update(paperRuns)
      .set({ lastHeartbeat: new Date() })
      .where(eq(paperRuns.id, id));
  },

  async getAllPaperRuns(limit: number = 50): Promise<PaperRun[]> {
    return await (db as any)
      .select()
      .from(paperRuns)
      .orderBy(desc(paperRuns.createdAt))
      .limit(limit);
  },

  async getActivePaperRun(): Promise<PaperRun | undefined> {
    const runs = await (db as any)
      .select()
      .from(paperRuns)
      .orderBy(desc(paperRuns.createdAt))
      .limit(1);
    const latest = runs[0];
    if (latest && ACTIVE_STATUSES.includes(latest.status)) return latest;
    return undefined;
  },

  async getPaperRunStats(): Promise<{ total: number; published: number; rejected: number; failed: number; active: PaperRun | null }> {
    const all = await (db as any).select().from(paperRuns);
    const active = await paperMethods.getActivePaperRun();
    return {
      total: all.length,
      published: all.filter((r: PaperRun) => r.status === 'published').length,
      rejected: all.filter((r: PaperRun) => r.status === 'rejected').length,
      failed: all.filter((r: PaperRun) => r.status === 'failed').length,
      active: active ?? null,
    };
  },

  async deletePaperRun(id: string): Promise<void> {
    await (db as any).delete(paperRuns).where(eq(paperRuns.id, id));
  },

  /** Force-fail ALL runs still in an active status. Used on server startup since
   *  a restart means no pipeline can possibly still be running. */
  async forceFailAllActiveRuns(): Promise<number> {
    const allRuns: PaperRun[] = await (db as any).select().from(paperRuns);
    const active = allRuns.filter((r) => ACTIVE_STATUSES.includes(r.status));
    for (const run of active) {
      await (db as any)
        .update(paperRuns)
        .set({
          status: 'failed',
          errorMessage: `Server restarted while run was in "${run.status}" — pipeline terminated`,
          completedAt: new Date(),
        })
        .where(eq(paperRuns.id, run.id));
    }
    return active.length;
  },

  async getAllActivePaperRuns(): Promise<PaperRun[]> {
    const allRuns: PaperRun[] = await (db as any).select().from(paperRuns);
    return allRuns.filter((r) => ACTIVE_STATUSES.includes(r.status));
  },

  async cleanupStalePaperRuns(timeoutMinutes: number = 30): Promise<number> {
    const now = Date.now();
    const hardCutoff = new Date(now - timeoutMinutes * 60 * 1000);
    // Heartbeat cutoff: 5 minutes without a heartbeat means the run is dead
    const heartbeatCutoff = new Date(now - 5 * 60 * 1000);
    // Orphan cutoff: runs stuck in 'queued' with no startedAt for over 5 minutes
    const orphanCutoff = new Date(now - 5 * 60 * 1000);
    const allRuns: PaperRun[] = await (db as any).select().from(paperRuns);
    const stale = allRuns.filter((r) => {
      if (!ACTIVE_STATUSES.includes(r.status)) return false;

      // 1. Orphan: no startedAt means it never began processing
      if (!r.startedAt) {
        return r.createdAt ? new Date(r.createdAt) < orphanCutoff : true;
      }

      // 2. Heartbeat-based: if heartbeat exists and is recent, run is alive — don't kill it
      if (r.lastHeartbeat && new Date(r.lastHeartbeat) >= heartbeatCutoff) {
        return false; // run is alive, admin can use Stop button if needed
      }

      // 3. No recent heartbeat (or no heartbeat at all): stale if heartbeat or startedAt is old
      const latestSignal = r.lastHeartbeat || r.startedAt;
      return new Date(latestSignal) < heartbeatCutoff;
    });
    for (const run of stale) {
      let reason: string;
      if (!run.startedAt) {
        reason = `Orphan run cleanup: stuck in "${run.status}" without starting (created ${run.createdAt})`;
      } else if (new Date(run.startedAt) < hardCutoff) {
        reason = `Hard timeout: stuck in "${run.status}" for over ${timeoutMinutes} minutes`;
      } else {
        const lastSignal = run.lastHeartbeat || run.startedAt;
        const minsAgo = Math.round((now - new Date(lastSignal).getTime()) / 60000);
        reason = `No heartbeat: stuck in "${run.status}" with no activity for ${minsAgo} minutes`;
      }
      await (db as any)
        .update(paperRuns)
        .set({
          status: 'failed',
          errorMessage: reason,
          completedAt: new Date(),
        })
        .where(eq(paperRuns.id, run.id));
    }
    return stale.length;
  },
};
