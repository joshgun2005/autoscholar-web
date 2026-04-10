/**
 * ResearchDirector — Intelligent Topic Selection Agent.
 *
 * Replaces random/sequential prompt selection with a memory-driven,
 * intelligent topic selection system.
 *
 * CRITICAL: ResearchDirector does NOT replace Gauss.
 *   - ResearchDirector decides: "What should we study next?"
 *   - Gauss decides: "What is missing in the literature?"
 *
 * Pipeline: Generate candidates → Score → Select optimal thesis
 *
 * Exploration strategy: 70% exploitation / 30% exploration
 */

import { logger } from '../../utils/logger';
import { getCorpusStats, findSimilarPapers, generateMemoryBrief, type MemoryBrief } from './memoryOrchestrator';
import { evaluateMethods } from './methodIntelligence';
import { checkDuplication } from './deduplicationService';
import { DOMAINS, METHODS, DOMAIN_METHOD_COMPAT } from '../promptBank';

// ── Types ──

export interface ResearchCandidate {
  domain: string;
  domainIdx: number;
  method: string;
  methodIdx: number;
  topic: string;
  // Scores (0–1)
  noveltyScore: number;
  expectedQualityScore: number;
  duplicationRisk: number;
  failureRisk: number;
  methodDiversityScore: number;
  contributionValue: number;
  // Composite
  compositeScore: number;
}

export interface ResearchDirective {
  thesis: string;
  domain: string;
  domainIdx: number;
  method: string;
  methodIdx: number;
  topic: string;
  rationale: string;
  risks: string;
  memoryBrief: MemoryBrief;
  candidate: ResearchCandidate;
  explorationMode: boolean;
}

// ── Import topic bank ──

import { DOMAIN_TOPICS } from '../prompt-bank/topics';

// ── Configuration ──

const EXPLOITATION_RATIO = 0.70;
const NUM_CANDIDATES = 24; // generate many candidates to ensure diversity
const MAX_RETRIES = 5;     // max times to loop through candidates

/**
 * Over-representation threshold: if a domain has more than this fraction
 * of the corpus, it is considered over-represented and heavily penalized.
 */
const OVERREP_THRESHOLD = 0.15; // 15% of corpus = over-represented

/**
 * Select the next optimal research topic using memory-driven intelligence.
 *
 * Loops through ranked candidates, skipping any that are:
 *   - blocked by deduplication (similarity > 0.90)
 *   - in an over-represented domain (> 15% of corpus)
 *
 * Falls back to prompt bank if all candidates exhausted.
 */
export async function selectNextResearch(): Promise<ResearchDirective> {
  const isExploration = Math.random() > EXPLOITATION_RATIO;
  logger.info(`[ResearchDirector] Mode: ${isExploration ? 'EXPLORATION (30%)' : 'EXPLOITATION (70%)'}`);

  // 1. Get corpus stats
  const stats = await getCorpusStats();

  // 2. Generate candidate topics
  const candidates = await generateCandidates(stats, isExploration);

  // 3. Score all candidates
  const scored = await scoreCandidates(candidates, stats);

  // 4. Sort by composite score
  scored.sort((a, b) => b.compositeScore - a.compositeScore);

  // 5. Loop through candidates until we find an acceptable one
  for (let i = 0; i < Math.min(scored.length, MAX_RETRIES); i++) {
    const candidate = scored[i];

    // Check over-representation
    const domainCount = stats.domainDistribution[candidate.domain] || 0;
    const domainFraction = stats.totalPapers > 0 ? domainCount / stats.totalPapers : 0;
    if (domainFraction > OVERREP_THRESHOLD && i < scored.length - 1) {
      logger.warn(`[ResearchDirector] Candidate #${i + 1} "${candidate.domain}" is over-represented (${(domainFraction * 100).toFixed(0)}% of corpus, ${domainCount}/${stats.totalPapers}) — trying next`);
      continue;
    }

    // Generate memory brief & check deduplication
    const compatMethods = DOMAIN_METHOD_COMPAT[candidate.domainIdx] || [];
    const candidateMethodNames = compatMethods.map((j: number) => METHODS[j]);
    const memoryBrief = await generateMemoryBrief(
      `${candidate.topic} using ${candidate.method} in ${candidate.domain}`,
      candidate.domain,
      candidateMethodNames,
    );

    if (memoryBrief.deduplication.verdict === 'block' && i < scored.length - 1) {
      logger.warn(`[ResearchDirector] Candidate #${i + 1} blocked by dedup (${(memoryBrief.deduplication.similarity * 100).toFixed(1)}%) — trying next`);
      continue;
    }

    logger.info(`[ResearchDirector] Accepted candidate #${i + 1}/${scored.length} after ${i} skip(s)`);
    return buildDirective(candidate, memoryBrief, isExploration);
  }

  // All candidates exhausted — use last one anyway
  logger.warn(`[ResearchDirector] All ${MAX_RETRIES} candidates rejected — using best remaining`);
  const last = scored[scored.length - 1];
  const compatMethods = DOMAIN_METHOD_COMPAT[last.domainIdx] || [];
  const candidateMethodNames = compatMethods.map((j: number) => METHODS[j]);
  const memoryBrief = await generateMemoryBrief(
    `${last.topic} using ${last.method} in ${last.domain}`,
    last.domain,
    candidateMethodNames,
  );
  return buildDirective(last, memoryBrief, isExploration);
}

// ── Step 1: Generate Candidate Ideas ──

async function generateCandidates(
  stats: Awaited<ReturnType<typeof getCorpusStats>>,
  isExploration: boolean,
): Promise<ResearchCandidate[]> {
  const candidates: ResearchCandidate[] = [];

  if (isExploration) {
    // Exploration: prefer under-represented domains & methods
    const underRepDomains = findUnderRepresented(stats.domainDistribution, DOMAINS as unknown as string[]);
    const underRepMethods = findUnderRepresented(stats.methodDistribution, METHODS as unknown as string[]);

    for (let i = 0; i < NUM_CANDIDATES; i++) {
      const dIdx = underRepDomains.length > 0
        ? DOMAINS.indexOf(underRepDomains[i % underRepDomains.length] as any)
        : Math.floor(Math.random() * DOMAINS.length);
      const domain = DOMAINS[dIdx >= 0 ? dIdx : Math.floor(Math.random() * DOMAINS.length)];
      const actualDIdx = DOMAINS.indexOf(domain);

      const compatMethods = DOMAIN_METHOD_COMPAT[actualDIdx] || [];
      const mIdx = compatMethods.length > 0
        ? compatMethods[Math.floor(Math.random() * compatMethods.length)]
        : Math.floor(Math.random() * METHODS.length);
      const method = METHODS[mIdx];

      const topics = DOMAIN_TOPICS[actualDIdx] || [];
      const topic = topics[Math.floor(Math.random() * topics.length)] || domain;

      candidates.push({
        domain, domainIdx: actualDIdx, method, methodIdx: mIdx, topic,
        noveltyScore: 0, expectedQualityScore: 0, duplicationRisk: 0,
        failureRisk: 0, methodDiversityScore: 0, contributionValue: 0,
        compositeScore: 0,
      });
    }
  } else {
    // Exploitation: prefer high-performing domain+method combos
    for (let i = 0; i < NUM_CANDIDATES; i++) {
      const dIdx = Math.floor(Math.random() * DOMAINS.length);
      const domain = DOMAINS[dIdx];
      const compatMethods = DOMAIN_METHOD_COMPAT[dIdx] || [];

      // Pick method with best expected performance
      const methodScores = await evaluateMethods(
        domain,
        compatMethods.map((j: number) => METHODS[j]),
      );

      const bestMethod = methodScores.suggested.length > 0
        ? methodScores.suggested[Math.floor(Math.random() * Math.min(3, methodScores.suggested.length))]
        : null;

      const mIdx = bestMethod
        ? METHODS.indexOf(bestMethod.method as any)
        : compatMethods[Math.floor(Math.random() * compatMethods.length)];
      const method = METHODS[mIdx >= 0 ? mIdx : 0];
      const actualMIdx = mIdx >= 0 ? mIdx : 0;

      const topics = DOMAIN_TOPICS[dIdx] || [];
      const topic = topics[Math.floor(Math.random() * topics.length)] || domain;

      candidates.push({
        domain, domainIdx: dIdx, method, methodIdx: actualMIdx, topic,
        noveltyScore: 0, expectedQualityScore: 0, duplicationRisk: 0,
        failureRisk: 0, methodDiversityScore: 0, contributionValue: 0,
        compositeScore: 0,
      });
    }
  }

  return candidates;
}

// ── Step 2: Score Candidates ──

async function scoreCandidates(
  candidates: ResearchCandidate[],
  stats: Awaited<ReturnType<typeof getCorpusStats>>,
): Promise<ResearchCandidate[]> {
  const scored = await Promise.all(
    candidates.map(async (c) => {
      // Novelty score: heavily penalize over-represented domains
      const domainCount = stats.domainDistribution[c.domain] || 0;
      const totalPapers = Math.max(stats.totalPapers, 1);
      const domainFraction = domainCount / totalPapers;
      // 0 papers = 1.0, at threshold = 0.3, 2x threshold = 0.0
      c.noveltyScore = Math.max(0, 1 - (domainFraction / OVERREP_THRESHOLD) * 0.7);

      // Duplication risk (lightweight check via similar papers)
      const thesis = `${c.topic} using ${c.method}`;
      const similar = await findSimilarPapers(thesis, 1);
      c.duplicationRisk = similar.length > 0 ? similar[0].similarity : 0;

      // Method expected quality
      const methodEval = await evaluateMethods(c.domain, [c.method]);
      const methodData = methodEval.suggested[0] || methodEval.avoid[0];
      c.expectedQualityScore = methodData ? methodData.expectedScore / 100 : 0.55;
      c.failureRisk = methodData ? methodData.failureRisk : 0.15;

      // Method diversity: bonus for using methods that are underrepresented
      const methodCount = stats.methodDistribution[c.method] || 0;
      const methodFraction = methodCount / totalPapers;
      c.methodDiversityScore = Math.max(0, 1 - (methodFraction / OVERREP_THRESHOLD) * 0.7);

      // Contribution value (heuristic combining factors)
      c.contributionValue = (c.noveltyScore * 0.3 + c.expectedQualityScore * 0.4 + c.methodDiversityScore * 0.3);

      // Composite score: novelty weighted most heavily to force diversity
      c.compositeScore =
        c.noveltyScore * 0.35 +
        c.expectedQualityScore * 0.20 +
        c.contributionValue * 0.10 +
        c.methodDiversityScore * 0.15 -
        c.duplicationRisk * 0.10 -
        c.failureRisk * 0.10;

      return c;
    }),
  );

  return scored;
}

// ── Build final directive ──

function buildDirective(
  candidate: ResearchCandidate,
  memoryBrief: MemoryBrief,
  explorationMode: boolean,
): ResearchDirective {
  const thesis = `${candidate.topic} using ${candidate.method} in ${candidate.domain}`;

  const rationale = [
    `Novelty: ${(candidate.noveltyScore * 100).toFixed(0)}%`,
    `Expected quality: ${(candidate.expectedQualityScore * 100).toFixed(0)}%`,
    `Method diversity: ${(candidate.methodDiversityScore * 100).toFixed(0)}%`,
    `Contribution value: ${(candidate.contributionValue * 100).toFixed(0)}%`,
  ].join(', ');

  const risks = [
    `Duplication risk: ${(candidate.duplicationRisk * 100).toFixed(1)}%`,
    `Failure risk: ${(candidate.failureRisk * 100).toFixed(1)}%`,
  ].join(', ');

  logger.info(`[ResearchDirector] Selected: "${candidate.topic}" (${candidate.domain} / ${candidate.method})`);
  logger.info(`[ResearchDirector] Rationale: ${rationale}`);
  logger.info(`[ResearchDirector] Risks: ${risks}`);
  logger.info(`[ResearchDirector] Composite: ${candidate.compositeScore.toFixed(3)}`);

  return {
    thesis,
    domain: candidate.domain,
    domainIdx: candidate.domainIdx,
    method: candidate.method,
    methodIdx: candidate.methodIdx,
    topic: candidate.topic,
    rationale,
    risks,
    memoryBrief,
    candidate,
    explorationMode,
  };
}

// ── Helpers ──

function findUnderRepresented(distribution: Record<string, number>, allItems: string[]): string[] {
  const counts = allItems.map((item) => ({ item, count: distribution[item] || 0 }));
  counts.sort((a, b) => a.count - b.count);
  // Return the bottom third (least represented)
  return counts.slice(0, Math.max(Math.ceil(counts.length / 3), 3)).map((c) => c.item);
}
