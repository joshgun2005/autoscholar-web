/**
 * ASID Service — AutoScholar ID generation for published papers.
 *
 * Format: ASID-YYYY-NNNN  (e.g. ASID-2026-0001)
 *
 * Sequence counters are per-year, stored in the `asid_counters` table,
 * and incremented atomically to prevent collisions under concurrent
 * paper generation.
 */

import { db, schema, rawDb, isSqlite } from '../db';
import { eq, sql } from 'drizzle-orm';
import { logger } from '../utils/logger';

const ASID_PREFIX = 'ASID';

const { asidCounters, publishedPapers } = schema;

// ── Core ASID generator ───────────────────────────────────────────

/**
 * Generate the next ASID for the current year.
 * Uses an atomic increment to guarantee uniqueness even under
 * concurrent calls (autoPaperScheduler + manual generation).
 *
 * @returns An ASID string like "ASID-2026-0001"
 */
export async function generateAsid(): Promise<string> {
  const year = new Date().getFullYear();
  let sequence: number;

  if (isSqlite) {
    const sqliteDb = rawDb as import('better-sqlite3').Database;

    const txn = sqliteDb.transaction(() => {
      sqliteDb
        .prepare('INSERT OR IGNORE INTO asid_counters (year, next_sequence) VALUES (?, 1)')
        .run(year);

      const row = sqliteDb
        .prepare('UPDATE asid_counters SET next_sequence = next_sequence + 1 WHERE year = ? RETURNING next_sequence - 1 AS seq')
        .get(year) as { seq: number } | undefined;

      if (!row) throw new Error(`ASID counter missing for year ${year}`);
      return row.seq;
    });

    sequence = txn();
  } else {
    const result = await (db as any).execute(sql`
      INSERT INTO asid_counters (year, next_sequence)
      VALUES (${year}, 2)
      ON CONFLICT (year) DO UPDATE SET next_sequence = asid_counters.next_sequence + 1
      RETURNING next_sequence - 1 AS seq
    `);
    sequence = result.rows?.[0]?.seq ?? result[0]?.seq;
    if (sequence == null) throw new Error(`ASID counter failed for year ${year}`);
  }

  const asid = formatAsid(year, sequence);
  logger.info(`[ASID] Generated: ${asid}`);
  return asid;
}

/**
 * Format an ASID string from year and sequence.
 */
export function formatAsid(year: number, sequence: number): string {
  const paddedSeq = String(sequence).padStart(4, '0');
  return `${ASID_PREFIX}-${year}-${paddedSeq}`;
}

/**
 * Parse an ASID string into its components.
 * Returns null if the ASID doesn't match the expected format.
 */
export function parseAsid(asid: string): { year: number; sequence: number } | null {
  const match = asid.match(/^ASID-(\d{4})-(\d+)$/);
  if (!match) return null;
  return {
    year: parseInt(match[1], 10),
    sequence: parseInt(match[2], 10),
  };
}

// ── Storage helpers ──────────────────────────────────────────────

/**
 * Retrieve a published paper by its ASID.
 */
export async function getPublishedPaperByAsid(asid: string) {
  const [paper] = await (db as any)
    .select()
    .from(publishedPapers)
    .where(eq(publishedPapers.asid, asid));
  return paper ?? undefined;
}

/**
 * Assign an ASID to an existing paper (by paper ID).
 */
export async function assignAsidToPaper(paperId: string, asid: string): Promise<void> {
  await (db as any)
    .update(publishedPapers)
    .set({ asid })
    .where(eq(publishedPapers.id, paperId));
}

/**
 * Back-fill ASIDs for all papers that don't have one yet.
 * Called once at server startup.
 */
export async function backfillAsids(): Promise<number> {
  const papers = await (db as any)
    .select({ id: publishedPapers.id, publishedAt: publishedPapers.publishedAt })
    .from(publishedPapers)
    .where(sql`${publishedPapers.asid} IS NULL`)
    .orderBy(publishedPapers.publishedAt);

  let count = 0;
  for (const paper of papers) {
    try {
      const asid = await generateAsid();
      await assignAsidToPaper(paper.id, asid);
      count++;
    } catch (err) {
      logger.error(`[ASID] Failed to backfill paper ${paper.id}: ${(err as Error).message}`);
    }
  }

  if (count > 0) {
    logger.info(`[ASID] Back-filled ${count} papers with ASIDs`);
  }
  return count;
}

// ── ASID URL helpers ──────────────────────────────────────────────

/**
 * Convert an ASID to its AutoScholar landing page URL.
 */
export function asidToUrl(asid: string): string {
  return `https://autoscholar.ai/paper/${encodeURIComponent(asid)}`;
}

/**
 * Get the current counter state (for admin/debugging).
 */
export async function getAsidCounterStatus(): Promise<{ year: number; nextSequence: number }[]> {
  return await (db as any).select().from(asidCounters);
}

// ── Ensure table exists (SQLite migration) ───────────────────────

export async function ensureAsidTables(): Promise<void> {
  if (isSqlite) {
    const sqliteDb = rawDb as import('better-sqlite3').Database;

    // Create asid_counters table if not exists
    sqliteDb.exec(`
      CREATE TABLE IF NOT EXISTS asid_counters (
        year INTEGER PRIMARY KEY,
        next_sequence INTEGER NOT NULL DEFAULT 1
      )
    `);

    // Add asid column to published_papers if not exists
    try {
      sqliteDb.exec(`ALTER TABLE published_papers ADD COLUMN asid TEXT UNIQUE`);
      logger.info('[ASID] Added asid column to published_papers');
    } catch {
      // Column already exists — expected
    }
  } else {
    try {
      await (db as any).execute(sql`
        CREATE TABLE IF NOT EXISTS asid_counters (
          year INTEGER PRIMARY KEY,
          next_sequence INTEGER NOT NULL DEFAULT 1
        )
      `);
      await (db as any).execute(sql`
        ALTER TABLE published_papers ADD COLUMN IF NOT EXISTS asid TEXT UNIQUE
      `);
    } catch (err) {
      logger.warn(`[ASID] PG migration note: ${(err as Error).message}`);
    }
  }
}

// ── Legacy aliases (backward compatibility during migration) ──────
export const generateDoi = generateAsid;
export const backfillDois = backfillAsids;
export const ensureDoiTables = ensureAsidTables;
