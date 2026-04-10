/**
 * Memory Orchestrator — Pre-run intelligence & context injection.
 *
 * Responsibilities:
 *   A. Pre-Run Intelligence: generate a MEMORY BRIEF before Gauss phase
 *   B. Semantic Retrieval: nearest-neighbor search on paper/error/method embeddings
 *   C. Context Injection: compressed brief (max 3000 tokens ≈ ~12000 chars)
 */

import { db, isSqlite } from '../../db';
import { generateEmbedding, cosineSimilarity, parseEmbedding } from './embeddingService';
import { checkDuplication, type DeduplicationResult } from './deduplicationService';
import { evaluateMethods, getFailurePatterns, getQualityWarnings, getDatasetSuggestions } from './methodIntelligence';
import { logger } from '../../utils/logger';

import * as schemaSqlite from '@shared/schema-sqlite';
import * as schemaPg from '@shared/schema';

// Max characters for the memory brief (~3000 tokens)
const MAX_BRIEF_CHARS = 12_000;

export interface MemoryBrief {
  text: string;
  deduplication: DeduplicationResult;
  charCount: number;
}

/**
 * Generate a comprehensive MEMORY BRIEF for injection before Gauss phase.
 *
 * Input: research thesis (from ResearchDirector or prompt bank)
 * Output: structured brief with similar papers, methods, failures, datasets, quality warnings
 */
export async function generateMemoryBrief(
  thesis: string,
  domain: string,
  candidateMethods: string[],
): Promise<MemoryBrief> {
  const sections: string[] = [];

  // 1. Deduplication check
  const dedup = await checkDuplication(thesis);
  sections.push(`Duplication Risk: ${(dedup.similarity * 100).toFixed(1)}% [${dedup.verdict.toUpperCase()}]`);
  if (dedup.similarPapers.length > 0) {
    sections.push('Similar Papers:');
    dedup.similarPapers.slice(0, 3).forEach((p) => {
      sections.push(`  - "${p.title}" (${(p.similarity * 100).toFixed(1)}%)`);
    });
  }
  if (dedup.suggestion) {
    sections.push(`Novelty Direction: ${dedup.suggestion}`);
  }

  // 2. Method intelligence
  if (candidateMethods.length > 0) {
    const methodRec = await evaluateMethods(domain, candidateMethods);
    if (methodRec.briefText) {
      sections.push('');
      sections.push(methodRec.briefText);
    }
  }

  // 3. Failure patterns (for all stages)
  const failures = await getFailurePatterns(domain);
  if (failures) {
    sections.push('');
    sections.push(failures);
  }

  // 4. Quality warnings
  const primaryMethod = candidateMethods[0] ?? '';
  const qualityWarnings = await getQualityWarnings(domain, primaryMethod);
  if (qualityWarnings) {
    sections.push('');
    sections.push(qualityWarnings);
  }

  // 5. Dataset suggestions
  const datasets = await getDatasetSuggestions(domain);
  if (datasets) {
    sections.push('');
    sections.push(datasets);
  }

  // Build final brief
  let brief = `═══ MEMORY BRIEF (GME) ═══\n${sections.join('\n')}`;

  // Truncate to max chars
  if (brief.length > MAX_BRIEF_CHARS) {
    brief = brief.slice(0, MAX_BRIEF_CHARS - 20) + '\n[...truncated]';
  }

  logger.info(`[GME:Orchestrator] Memory brief generated: ${brief.length} chars, dedup=${dedup.verdict}`);

  return {
    text: brief,
    deduplication: dedup,
    charCount: brief.length,
  };
}

/**
 * Retrieve papers semantically similar to a query.
 * Used by ResearchDirector for gap identification.
 */
export async function findSimilarPapers(
  query: string,
  topK: number = 5,
): Promise<Array<{ title: string; domain: string | null; similarity: number; popperScore: number | null }>> {
  try {
    const queryEmbedding = await generateEmbedding(query);
    const table = isSqlite ? schemaSqlite.papersMemory : schemaPg.papersMemory;
    const allPapers = await (db as any).select().from(table);

    return allPapers
      .map((paper: any) => {
        const emb = parseEmbedding(
          typeof paper.abstractEmbedding === 'string'
            ? paper.abstractEmbedding
            : paper.abstractEmbedding ? JSON.stringify(paper.abstractEmbedding) : null,
        );
        if (!emb) return null;
        return {
          title: paper.title as string,
          domain: paper.domain as string | null,
          similarity: cosineSimilarity(queryEmbedding, emb),
          popperScore: paper.popperScore as number | null,
        };
      })
      .filter((x: any): x is NonNullable<typeof x> => x !== null)
      .sort((a: any, b: any) => b.similarity - a.similarity)
      .slice(0, topK);
  } catch (err) {
    logger.warn(`[GME:Orchestrator] Similar paper search failed: ${(err as Error).message}`);
    return [];
  }
}

/**
 * Get corpus statistics for the ResearchDirector.
 */
export async function getCorpusStats(): Promise<{
  totalPapers: number;
  domainDistribution: Record<string, number>;
  methodDistribution: Record<string, number>;
  avgPopperScore: number;
}> {
  try {
    const table = isSqlite ? schemaSqlite.papersMemory : schemaPg.papersMemory;
    const allPapers = await (db as any).select().from(table);

    const domainDist: Record<string, number> = {};
    const methodDist: Record<string, number> = {};
    let scoreSum = 0;
    let scoreCount = 0;

    for (const paper of allPapers) {
      if (paper.domain) {
        domainDist[paper.domain] = (domainDist[paper.domain] || 0) + 1;
      }
      const methods: string[] = safeParseJSON(paper.methodsUsed, []);
      for (const m of methods) {
        methodDist[m] = (methodDist[m] || 0) + 1;
      }
      if (paper.popperScore != null) {
        scoreSum += paper.popperScore;
        scoreCount++;
      }
    }

    return {
      totalPapers: allPapers.length,
      domainDistribution: domainDist,
      methodDistribution: methodDist,
      avgPopperScore: scoreCount > 0 ? scoreSum / scoreCount : 0,
    };
  } catch {
    return { totalPapers: 0, domainDistribution: {}, methodDistribution: {}, avgPopperScore: 0 };
  }
}

function safeParseJSON(val: string | null | undefined, fallback: any): any {
  if (!val) return fallback;
  try { return JSON.parse(val); } catch { return fallback; }
}
