/**
 * Method Intelligence Engine — Recommends methods based on historical performance.
 *
 * Before Fisher phase:
 *   - Query methods_memory
 *   - Compute expected_score(domain, method) and failure_risk(domain, method)
 *   - Avoid high-failure, low-score combinations
 *   - Prefer high-performing or underexplored combinations
 */

import { db, isSqlite } from '../../db';
import { eq, and } from 'drizzle-orm';
import { logger } from '../../utils/logger';

import * as schemaSqlite from '@shared/schema-sqlite';
import * as schemaPg from '@shared/schema';

function getMethodsTable() {
  return isSqlite ? schemaSqlite.methodsMemory : schemaPg.methodsMemory;
}

export interface MethodScore {
  method: string;
  domain: string;
  expectedScore: number;
  failureRisk: number;
  usageCount: number;
  composite: number; // higher = better candidate
}

export interface MethodRecommendation {
  suggested: MethodScore[];
  avoid: MethodScore[];
  briefText: string;
}

export async function evaluateMethods(domain: string, candidateMethods: string[]): Promise<MethodRecommendation> {
  try {
    const allMethods = await (db as any).select().from(getMethodsTable());

    const domainMethods = allMethods.filter((m: any) => m.domain === domain);
    const globalMethods = allMethods;

    const scores: MethodScore[] = candidateMethods.map((method) => {
      // Find exact domain+method match
      const exact = domainMethods.find((m: any) => m.method === method);
      // Find global stats for this method across all domains
      const globalForMethod = globalMethods.filter((m: any) => m.method === method);

      let expectedScore: number;
      let failureRisk: number;
      let usageCount: number;

      if (exact && exact.usageCount > 0) {
        expectedScore = exact.avgPopperScore ?? 50;
        failureRisk = exact.failureCount / Math.max(exact.usageCount, 1);
        usageCount = exact.usageCount;
      } else if (globalForMethod.length > 0) {
        // Use global averages as a prior
        const totalUsage = globalForMethod.reduce((s: number, m: any) => s + (m.usageCount || 0), 0);
        const totalFailures = globalForMethod.reduce((s: number, m: any) => s + (m.failureCount || 0), 0);
        const avgScore = globalForMethod.reduce((s: number, m: any) => s + (m.avgPopperScore || 50) * (m.usageCount || 1), 0) / Math.max(totalUsage, 1);
        expectedScore = avgScore;
        failureRisk = totalFailures / Math.max(totalUsage, 1);
        usageCount = totalUsage;
      } else {
        // No data: neutral prior with exploration bonus
        expectedScore = 55; // slight bonus for unexplored
        failureRisk = 0.15; // assume moderate risk
        usageCount = 0;
      }

      // Composite: maximize score, minimize failure risk, bonus for underexplored
      const explorationBonus = usageCount === 0 ? 10 : Math.max(0, 5 - usageCount) * 2;
      const composite = expectedScore * (1 - failureRisk) + explorationBonus;

      return { method, domain, expectedScore, failureRisk, usageCount, composite };
    });

    scores.sort((a, b) => b.composite - a.composite);

    const suggested = scores.filter((s) => s.failureRisk < 0.5 || s.usageCount === 0);
    const avoid = scores.filter((s) => s.failureRisk >= 0.5 && s.usageCount > 2);

    // Build brief text for memory injection
    const lines: string[] = [];
    if (suggested.length > 0) {
      lines.push(`Suggested Methods (${domain}):`);
      suggested.slice(0, 3).forEach((s) => {
        lines.push(`  - ${s.method}: expected ${s.expectedScore.toFixed(0)}/100, failure ${(s.failureRisk * 100).toFixed(0)}%, used ${s.usageCount}x`);
      });
    }
    if (avoid.length > 0) {
      lines.push(`Avoid:`);
      avoid.forEach((s) => {
        lines.push(`  - ${s.method}: failure rate ${(s.failureRisk * 100).toFixed(0)}%`);
      });
    }

    logger.info(`[GME:Methods] Evaluated ${candidateMethods.length} methods for ${domain} — top: ${scores[0]?.method ?? 'none'}`);

    return { suggested, avoid, briefText: lines.join('\n') };
  } catch (err) {
    logger.warn(`[GME:Methods] Evaluation failed: ${(err as Error).message}`);
    return { suggested: [], avoid: [], briefText: '' };
  }
}

export async function getFailurePatterns(domain: string, stage?: string): Promise<string> {
  try {
    const errorsTable = isSqlite ? schemaSqlite.errorsMemory : schemaPg.errorsMemory;
    const allErrors = await (db as any).select().from(errorsTable);

    // Filter relevant errors
    const relevant = allErrors
      .filter((e: any) => {
        if (stage && e.stage !== stage) return false;
        return true;
      })
      .sort((a: any, b: any) => (b.occurrenceCount || 0) - (a.occurrenceCount || 0))
      .slice(0, 8);

    if (relevant.length === 0) return '';

    const lines = ['KNOWN FAILURE PATTERNS:'];
    for (const err of relevant) {
      const fix = err.solution ? ` → ${err.solution}` : '';
      lines.push(`- ${err.errorType} (${err.stage}): ${err.errorMessage.slice(0, 100)}${fix}`);
    }

    return lines.join('\n');
  } catch (err) {
    logger.warn(`[GME:Methods] Failed to get failure patterns: ${(err as Error).message}`);
    return '';
  }
}

export async function getQualityWarnings(domain: string, method: string): Promise<string> {
  try {
    const qualityTable = isSqlite ? schemaSqlite.qualityMemory : schemaPg.qualityMemory;
    const allQuality = await (db as any).select().from(qualityTable);

    const match = allQuality.find((q: any) => q.domain === domain && q.method === method)
      || allQuality.find((q: any) => q.domain === domain);

    if (!match) return '';

    const lines = ['QUALITY WARNINGS:'];
    const weaknesses = safeParseJSON(match.commonWeaknesses, []);
    const writingIssues = safeParseJSON(match.writingIssues, []);

    for (const w of weaknesses.slice(0, 5)) {
      lines.push(`- ${w}`);
    }
    for (const w of writingIssues.slice(0, 3)) {
      lines.push(`- Writing: ${w}`);
    }

    return lines.join('\n');
  } catch (err) {
    return '';
  }
}

export async function getDatasetSuggestions(domain: string): Promise<string> {
  try {
    const dsTable = isSqlite ? schemaSqlite.datasetsMemory : schemaPg.datasetsMemory;
    const allDatasets = await (db as any).select().from(dsTable);

    const reliable = allDatasets
      .filter((d: any) => (d.reliabilityScore ?? 0) >= 0.6)
      .sort((a: any, b: any) => (b.reliabilityScore ?? 0) - (a.reliabilityScore ?? 0))
      .slice(0, 5);

    if (reliable.length === 0) return '';

    const lines = ['RELIABLE DATA SOURCES:'];
    for (const d of reliable) {
      lines.push(`- ${d.source}${d.endpoint ? ` (${d.endpoint})` : ''}: reliability ${((d.reliabilityScore ?? 0) * 100).toFixed(0)}%, used ${d.usageCount}x`);
    }

    return lines.join('\n');
  } catch {
    return '';
  }
}

function safeParseJSON(val: string | null | undefined, fallback: any): any {
  if (!val) return fallback;
  try { return JSON.parse(val); } catch { return fallback; }
}
