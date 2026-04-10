/**
 * Memory Update Pipeline — Post-run updates for all 5 GME memory tables.
 *
 * Called AFTER each paper generation completes (published or rejected).
 * Updates: papers_memory, methods_memory, datasets_memory, errors_memory, quality_memory
 */

import { db, isSqlite } from '../../db';
import { eq, and } from 'drizzle-orm';
import { generateEmbedding } from './embeddingService';
import { logger } from '../../utils/logger';

import * as schemaSqlite from '@shared/schema-sqlite';
import * as schemaPg from '@shared/schema';

// ── Table accessors ──

function tables() {
  if (isSqlite) {
    return {
      papers: schemaSqlite.papersMemory,
      methods: schemaSqlite.methodsMemory,
      datasets: schemaSqlite.datasetsMemory,
      errors: schemaSqlite.errorsMemory,
      quality: schemaSqlite.qualityMemory,
    };
  }
  return {
    papers: schemaPg.papersMemory,
    methods: schemaPg.methodsMemory,
    datasets: schemaPg.datasetsMemory,
    errors: schemaPg.errorsMemory,
    quality: schemaPg.qualityMemory,
  };
}

// ── Input types ──

export interface PaperRunResult {
  runId: string;
  asid?: string | null;
  title: string;
  abstract?: string | null;
  domain: string;
  method: string;
  popperScore?: number | null;
  published: boolean;
  latexContent?: string | null;
  bibtexEntries?: string | null;
  contributions?: string;
  limitations?: string;
  datasetsUsed?: string[];      // e.g. ["FRED:GDP", "FMP:AAPL"]
  pipelineErrors?: PipelineError[];
  reviewWeaknesses?: string[];
  reviewStrengths?: string[];
  sectionReviews?: Array<{ section: string; score: number; comments: string }>;
}

export interface PipelineError {
  stage: string;
  errorType: string;
  errorMessage: string;
  context?: string;
  solution?: string;
  resolved: boolean;
}

/**
 * Run the full memory update pipeline after a paper generation.
 */
export async function updateMemoryAfterRun(result: PaperRunResult): Promise<void> {
  const t = tables();
  logger.info(`[GME:Update] Starting memory update for run ${result.runId.slice(0, 8)} — "${result.title}"`);

  try {
    // Run all updates in parallel where possible
    await Promise.all([
      updatePapersMemory(t, result),
      updateMethodsMemory(t, result),
      updateDatasetsMemory(t, result),
      updateErrorsMemory(t, result),
      updateQualityMemory(t, result),
    ]);

    logger.info(`[GME:Update] Memory update complete for run ${result.runId.slice(0, 8)}`);
  } catch (err) {
    logger.error(`[GME:Update] Memory update failed: ${(err as Error).message}`);
  }
}

// ── 1. Papers Memory ──

async function updatePapersMemory(t: ReturnType<typeof tables>, result: PaperRunResult): Promise<void> {
  try {
    // Generate embeddings for the paper
    const textsToEmbed: string[] = [
      result.abstract || result.title,
      result.contributions || '',
      `${result.method} ${result.domain} methodology`,
    ];

    const embeddings = await Promise.all(textsToEmbed.map((text) => text ? generateEmbedding(text) : Promise.resolve(null)));

    await (db as any).insert(t.papers).values({
      asid: result.asid ?? null,
      title: result.title,
      abstract: result.abstract ?? null,
      domain: result.domain,
      methodsUsed: JSON.stringify([result.method]),
      datasetsUsed: JSON.stringify(result.datasetsUsed ?? []),
      contributions: result.contributions ?? null,
      limitations: result.limitations ?? null,
      popperScore: result.popperScore ?? null,
      abstractEmbedding: embeddings[0] ? JSON.stringify(embeddings[0]) : null,
      contributionEmbedding: embeddings[1] ? JSON.stringify(embeddings[1]) : null,
      methodologyEmbedding: embeddings[2] ? JSON.stringify(embeddings[2]) : null,
      runId: result.runId,
      createdAt: new Date(),
    });

    logger.info(`[GME:Update] Papers memory: stored "${result.title}"`);
  } catch (err) {
    logger.warn(`[GME:Update] Papers memory update failed: ${(err as Error).message}`);
  }
}

// ── 2. Methods Memory ──

async function updateMethodsMemory(t: ReturnType<typeof tables>, result: PaperRunResult): Promise<void> {
  try {
    const existing = await (db as any)
      .select()
      .from(t.methods)
      .where(and(eq(t.methods.domain, result.domain), eq(t.methods.method, result.method)));

    const failed = !result.published;
    const score = result.popperScore ?? 0;

    if (existing.length > 0) {
      const row = existing[0];
      const newUsageCount = (row.usageCount || 0) + 1;
      const newFailureCount = (row.failureCount || 0) + (failed ? 1 : 0);
      const oldTotal = (row.avgPopperScore || 0) * (row.usageCount || 0);
      const newAvgScore = score > 0 ? (oldTotal + score) / newUsageCount : row.avgPopperScore;
      const newSuccessRate = 1 - (newFailureCount / newUsageCount);

      await (db as any)
        .update(t.methods)
        .set({
          usageCount: newUsageCount,
          avgPopperScore: newAvgScore,
          failureCount: newFailureCount,
          successRate: newSuccessRate,
          lastUsed: new Date(),
        })
        .where(eq(t.methods.id, row.id));
    } else {
      await (db as any).insert(t.methods).values({
        domain: result.domain,
        method: result.method,
        usageCount: 1,
        avgPopperScore: score > 0 ? score : null,
        failureCount: failed ? 1 : 0,
        successRate: failed ? 0 : 1,
        lastUsed: new Date(),
      });
    }

    logger.info(`[GME:Update] Methods memory: updated ${result.domain}/${result.method}`);
  } catch (err) {
    logger.warn(`[GME:Update] Methods memory update failed: ${(err as Error).message}`);
  }
}

// ── 3. Datasets Memory ──

async function updateDatasetsMemory(t: ReturnType<typeof tables>, result: PaperRunResult): Promise<void> {
  if (!result.datasetsUsed || result.datasetsUsed.length === 0) return;

  try {
    for (const dsRef of result.datasetsUsed) {
      const [source, endpoint] = dsRef.includes(':') ? dsRef.split(':', 2) : [dsRef, null];

      const existing = await (db as any)
        .select()
        .from(t.datasets)
        .where(eq(t.datasets.source, source));

      const matchRow = existing.find((d: any) => d.endpoint === endpoint);

      if (matchRow) {
        const newUsage = (matchRow.usageCount || 0) + 1;
        // Reliability increases with successful use
        const reliabilityBump = result.published ? 0.05 : -0.02;
        const newReliability = Math.min(1, Math.max(0, (matchRow.reliabilityScore ?? 0.5) + reliabilityBump));

        await (db as any)
          .update(t.datasets)
          .set({
            usageCount: newUsage,
            reliabilityScore: newReliability,
            lastUsed: new Date(),
          })
          .where(eq(t.datasets.id, matchRow.id));
      } else {
        await (db as any).insert(t.datasets).values({
          source,
          endpoint: endpoint ?? null,
          reliabilityScore: result.published ? 0.7 : 0.4,
          usageCount: 1,
          lastUsed: new Date(),
        });
      }
    }

    logger.info(`[GME:Update] Datasets memory: updated ${result.datasetsUsed.length} sources`);
  } catch (err) {
    logger.warn(`[GME:Update] Datasets memory update failed: ${(err as Error).message}`);
  }
}

// ── 4. Errors Memory ──

async function updateErrorsMemory(t: ReturnType<typeof tables>, result: PaperRunResult): Promise<void> {
  if (!result.pipelineErrors || result.pipelineErrors.length === 0) return;

  try {
    for (const error of result.pipelineErrors) {
      // Check if we've seen this error type+stage before
      const existing = await (db as any)
        .select()
        .from(t.errors)
        .where(and(eq(t.errors.stage, error.stage), eq(t.errors.errorType, error.errorType)));

      if (existing.length > 0) {
        const row = existing[0];
        const newCount = (row.occurrenceCount || 1) + 1;
        // Update success rate based on whether the error was resolved
        const oldSuccesses = (row.successRate ?? 0) * (row.occurrenceCount || 1);
        const newSuccessRate = (oldSuccesses + (error.resolved ? 1 : 0)) / newCount;

        await (db as any)
          .update(t.errors)
          .set({
            occurrenceCount: newCount,
            successRate: newSuccessRate,
            solution: error.solution || row.solution,
            lastSeen: new Date(),
          })
          .where(eq(t.errors.id, row.id));
      } else {
        // Generate embeddings for new error patterns
        const [errEmb, solEmb] = await Promise.all([
          generateEmbedding(`${error.stage} ${error.errorType}: ${error.errorMessage}`),
          error.solution ? generateEmbedding(error.solution) : Promise.resolve(null),
        ]);

        await (db as any).insert(t.errors).values({
          stage: error.stage,
          errorType: error.errorType,
          errorMessage: error.errorMessage.slice(0, 2000),
          context: error.context ?? null,
          solution: error.solution ?? null,
          successRate: error.resolved ? 1.0 : 0.0,
          occurrenceCount: 1,
          errorEmbedding: JSON.stringify(errEmb),
          solutionEmbedding: solEmb ? JSON.stringify(solEmb) : null,
          lastSeen: new Date(),
        });
      }
    }

    logger.info(`[GME:Update] Errors memory: stored ${result.pipelineErrors.length} error(s)`);
  } catch (err) {
    logger.warn(`[GME:Update] Errors memory update failed: ${(err as Error).message}`);
  }
}

// ── 5. Quality Memory ──

async function updateQualityMemory(t: ReturnType<typeof tables>, result: PaperRunResult): Promise<void> {
  if (!result.popperScore) return;

  try {
    const existing = await (db as any)
      .select()
      .from(t.quality)
      .where(and(eq(t.quality.domain, result.domain), eq(t.quality.method, result.method)));

    if (existing.length > 0) {
      const row = existing[0];
      const newSampleCount = (row.sampleCount || 0) + 1;
      const oldScoreTotal = (row.avgScore || 0) * (row.sampleCount || 0);
      const newAvgScore = (oldScoreTotal + result.popperScore) / newSampleCount;

      // Merge weaknesses and strengths
      const oldWeaknesses: string[] = safeParseJSON(row.commonWeaknesses, []);
      const oldStrengths: string[] = safeParseJSON(row.commonStrengths, []);
      const newWeaknesses = mergeStringArrays(oldWeaknesses, result.reviewWeaknesses ?? []);
      const newStrengths = mergeStringArrays(oldStrengths, result.reviewStrengths ?? []);

      // Extract writing issues from section reviews
      const writingIssues = extractWritingIssues(result.sectionReviews ?? []);
      const oldWritingIssues: string[] = safeParseJSON(row.writingIssues, []);
      const mergedWritingIssues = mergeStringArrays(oldWritingIssues, writingIssues);

      await (db as any)
        .update(t.quality)
        .set({
          avgScore: newAvgScore,
          sampleCount: newSampleCount,
          commonWeaknesses: JSON.stringify(newWeaknesses.slice(0, 20)),
          commonStrengths: JSON.stringify(newStrengths.slice(0, 20)),
          writingIssues: JSON.stringify(mergedWritingIssues.slice(0, 15)),
          updatedAt: new Date(),
        })
        .where(eq(t.quality.id, row.id));
    } else {
      await (db as any).insert(t.quality).values({
        domain: result.domain,
        method: result.method,
        avgScore: result.popperScore,
        sampleCount: 1,
        commonWeaknesses: JSON.stringify(result.reviewWeaknesses ?? []),
        commonStrengths: JSON.stringify(result.reviewStrengths ?? []),
        writingIssues: JSON.stringify(extractWritingIssues(result.sectionReviews ?? [])),
        reviewPatterns: JSON.stringify([]),
        updatedAt: new Date(),
      });
    }

    logger.info(`[GME:Update] Quality memory: updated ${result.domain}/${result.method} (score: ${result.popperScore})`);
  } catch (err) {
    logger.warn(`[GME:Update] Quality memory update failed: ${(err as Error).message}`);
  }
}

// ── Helpers ──

function safeParseJSON(val: string | null | undefined, fallback: any): any {
  if (!val) return fallback;
  try { return JSON.parse(val); } catch { return fallback; }
}

function mergeStringArrays(existing: string[], incoming: string[]): string[] {
  const set = new Set(existing);
  for (const item of incoming) {
    if (item && item.length > 5) set.add(item);
  }
  return Array.from(set);
}

function extractWritingIssues(sectionReviews: Array<{ section: string; score: number; comments: string }>): string[] {
  const issues: string[] = [];
  for (const review of sectionReviews) {
    if (review.score < 60 && review.comments) {
      issues.push(`${review.section}: ${review.comments.slice(0, 150)}`);
    }
  }
  return issues;
}
