/**
 * Deduplication Engine — Prevents duplicate research topics.
 *
 * Algorithm:
 *   1. Embed incoming thesis
 *   2. Retrieve top-K similar papers from papers_memory
 *   3. Compute similarity score → BLOCK / WARN / ACCEPT
 */

import { db, isSqlite } from '../../db';
import { generateEmbedding, cosineSimilarity, parseEmbedding } from './embeddingService';
import { logger } from '../../utils/logger';

// Import both schemas and select at runtime
import * as schemaSqlite from '@shared/schema-sqlite';
import * as schemaPg from '@shared/schema';

function getPapersMemoryTable() {
  return isSqlite ? schemaSqlite.papersMemory : schemaPg.papersMemory;
}

// ── Thresholds ──

const BLOCK_THRESHOLD = 0.90;
const WARN_THRESHOLD = 0.75;

export type DeduplicationVerdict = 'block' | 'warn' | 'accept';

export interface DeduplicationResult {
  verdict: DeduplicationVerdict;
  similarity: number;
  similarPapers: Array<{ title: string; asid: string | null; similarity: number }>;
  suggestion?: string;
}

export async function checkDuplication(thesis: string): Promise<DeduplicationResult> {
  try {
    const thesisEmbedding = await generateEmbedding(thesis);

    // Retrieve all papers with embeddings
    const allPapers = await (db as any).select().from(getPapersMemoryTable());

    if (!allPapers || allPapers.length === 0) {
      return { verdict: 'accept', similarity: 0, similarPapers: [] };
    }

    // Compute similarities
    const scored = allPapers
      .map((paper: any) => {
        const emb = parseEmbedding(
          typeof paper.abstractEmbedding === 'string'
            ? paper.abstractEmbedding
            : paper.abstractEmbedding ? JSON.stringify(paper.abstractEmbedding) : null,
        );
        if (!emb) return null;
        const sim = cosineSimilarity(thesisEmbedding, emb);
        return { title: paper.title as string, asid: paper.asid as string | null, similarity: sim };
      })
      .filter((x: any): x is NonNullable<typeof x> => x !== null)
      .sort((a: any, b: any) => b.similarity - a.similarity);

    const topK = scored.slice(0, 5);
    const maxSimilarity = topK.length > 0 ? topK[0].similarity : 0;

    let verdict: DeduplicationVerdict;
    let suggestion: string | undefined;

    if (maxSimilarity > BLOCK_THRESHOLD) {
      verdict = 'block';
      suggestion = `Topic too similar to "${topK[0].title}" (${(maxSimilarity * 100).toFixed(1)}%). Must select a different topic or significantly modify the approach.`;
    } else if (maxSimilarity > WARN_THRESHOLD) {
      verdict = 'warn';
      suggestion = `Moderate overlap with "${topK[0].title}" (${(maxSimilarity * 100).toFixed(1)}%). Consider differentiating methodology, time period, or geographic scope.`;
    } else {
      verdict = 'accept';
    }

    logger.info(`[GME:Dedup] Verdict: ${verdict} (max similarity: ${(maxSimilarity * 100).toFixed(1)}%, corpus: ${allPapers.length} papers)`);

    return { verdict, similarity: maxSimilarity, similarPapers: topK, suggestion };
  } catch (err) {
    logger.warn(`[GME:Dedup] Check failed, defaulting to accept: ${(err as Error).message}`);
    return { verdict: 'accept', similarity: 0, similarPapers: [] };
  }
}
