/**
 * AutoPaper Scheduler — Autonomous journal pipeline.
 *
 * Generates research papers on a configurable cadence, tracks each run through
 * the full lifecycle (queued → researching → analyzing → drafting → validating
 * → published/rejected), and auto-triggers Popper validation before publishing.
 *
 * Supports parallel generation — multiple papers can be in-flight simultaneously.
 */

import http from 'http';
import { logger } from '../utils/logger';
import { storage } from '../storage';
import { generatePeerReview } from './peerReviewService';
import { DOMAINS, METHODS, PROMPT_BANK, getPromptAt, type PromptEntry } from './promptBank';
import { selectNextResearch, updateMemoryAfterRun, type ResearchDirective, type PipelineError } from './memory';

// ── Configurable scheduler state ──

export interface SchedulerConfig {
  intervalMs: number;
  popperThreshold: number;
  /** When false, Popper peer review is skipped and papers are auto-published. */
  popperEnabled: boolean;
  enabled: boolean;
  maxConcurrent: number;
  domainPool: string[];
  methodPool: string[];
  /** Current cursor into PROMPT_BANK (0–999). Advances after each generation. */
  promptCursor: number;
  /** "sequential" = iterate through prompts; "weighted" = legacy random; "intelligent" = GME-driven ResearchDirector */
  selectionMode: 'sequential' | 'weighted' | 'intelligent';
}

let schedulerConfig: SchedulerConfig = {
  intervalMs: 60 * 60 * 1000,      // 1 hour default
  popperThreshold: 45,              // minimum score to publish
  popperEnabled: true,              // Popper validation on by default
  enabled: false,                   // admin must enable
  maxConcurrent: 3,                 // max parallel paper generations
  domainPool: [...DOMAINS],
  methodPool: [...METHODS],
  promptCursor: 0,
  selectionMode: 'sequential',
};

// ── Pipeline checkpoint for crash recovery ──

export interface PipelineCheckpoint {
  version: 1;
  lastCompletedStage: 'none' | 'researching' | 'analyzing' | 'drafting';
  completedTools: Array<{ tool: string; toolId: string; completedAt: number }>;
  sectionsWritten: string[];
  compilationSeen: boolean;
  resumeCount: number;
  lastResumeAt: number | null;
}

const MAX_RESUME_ATTEMPTS = 3;
const RESUME_BASE_DELAY_MS = 30_000; // 30 seconds

function createInitialCheckpoint(): PipelineCheckpoint {
  return {
    version: 1,
    lastCompletedStage: 'none',
    completedTools: [],
    sectionsWritten: [],
    compilationSeen: false,
    resumeCount: 0,
    lastResumeAt: null,
  };
}

function parseCheckpoint(raw: string | null | undefined): PipelineCheckpoint | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.version === 1 && typeof parsed.lastCompletedStage === 'string') return parsed;
    return null;
  } catch { return null; }
}

// ── Parallel generation tracking ──

let activeGenerations = 0;           // current number of in-flight generations
const activeRunIds = new Set<string>(); // track active run IDs for status reporting

// ── Abort registry: allows stopping in-flight pipelines ──
const abortRegistry = new Map<string, () => void>();

/** Abort an in-flight pipeline run. Returns true if the run was found and aborted. */
export function abortRun(runId: string): boolean {
  const abort = abortRegistry.get(runId);
  if (abort) {
    logger.warn(`[Euler:${runId.slice(0, 8)}] ABORT requested — destroying HTTP connection`);
    abort();
    return true;
  }
  return false;
}
let intervalId: ReturnType<typeof setInterval> | null = null;
let serverPort = 5000;
let paperCount = 0;

// ── History tracking for smart selection ──

interface HistoryEntry { domainIdx: number; methodIdx: number; timestamp: number; }
const history: HistoryEntry[] = [];
const MAX_HISTORY = 24;

function weightedRandomPick(pool: string[], field: 'domainIdx' | 'methodIdx'): number {
  const usageCounts = new Array(pool.length).fill(0);
  const now = Date.now();
  for (const entry of history) {
    const idx = entry[field];
    if (idx >= 0 && idx < pool.length) {
      const ageDays = (now - entry.timestamp) / (1000 * 60 * 60 * 24);
      usageCounts[idx] += Math.max(0, 1 - ageDays / 2);
    }
  }
  const maxUsage = Math.max(...usageCounts, 1);
  const weights = usageCounts.map(count => maxUsage + 1 - count);
  const totalWeight = weights.reduce((a, b) => a + b, 0);

  let roll = Math.random() * totalWeight;
  for (let i = 0; i < weights.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return i;
  }
  return Math.floor(Math.random() * pool.length);
}

function pickPromptEntry(): PromptEntry {
  if (schedulerConfig.selectionMode === 'sequential') {
    const entry = getPromptAt(schedulerConfig.promptCursor);
    schedulerConfig.promptCursor = (schedulerConfig.promptCursor + 1) % PROMPT_BANK.length;
    return entry;
  }
  // Legacy weighted random mode
  const { domainPool, methodPool } = schedulerConfig;
  const domainIdx = weightedRandomPick(domainPool, 'domainIdx');
  const methodIdx = weightedRandomPick(methodPool, 'methodIdx');
  return {
    id: -1,
    domain: domainPool[domainIdx],
    domainIdx,
    method: methodPool[methodIdx],
    methodIdx,
    topic: domainPool[domainIdx], // fallback: domain name as topic
  };
}

function buildEulerPrompt(domain: string, method: string, topic: string, seed: number, year: number, promptId: number, memoryBriefText?: string): string {
  const memorySection = memoryBriefText
    ? `\n${memoryBriefText}\n\nUSE the memory brief above to GUIDE your decisions — avoid known failures, prefer reliable data sources, differentiate from similar papers. Do NOT copy previous papers.\n`
    : '';

  return `You are Euler — The AutoScholar Research Agent. You coordinate 4 sub-agents to generate a COMPLETE and RIGOROUS research paper:
- Gauss (gap analysis) — literature gap discovery
- Turing (data collection) — raw data acquisition
- Newton (dataset preparation) — cleaning and final dataset construction
- Fisher (empirical analysis) — econometric analysis and figures

RESEARCH DIRECTIVE:
  Domain: "${domain}"
  Method: "${method}"
  Specific topic: "${topic}"
${memorySection}
Follow this strict 6-step protocol:

═══ STEP 1 — GAUSS: GAP DISCOVERY (MANDATORY, FIRST ACTION) ═══
Call literature_gap_finder with an original subject in the domain "${domain}",
focused on the specific topic "${topic}".
The gap finder will:
  - Search 250M+ papers (OpenAlex, arXiv, CrossRef)
  - Expand the citation network of the most-cited papers
  - Extract dominant methods, datasets used, shared limitations
  - Identify 4-6 valid gaps with numerical scores (0-1) for novelty/feasibility/citation potential
  - Validate each gap with a targeted search

IMPORTANT: Do NOT choose the subject yourself. Let the gap finder discover a GENUINE gap in the literature.
Use the method "${method}" and the post-${year} period to orient the search, but let the gap finder determine the precise subject.
[Seed: ${seed}] [Prompt #${promptId}]

═══ STEP 2 — TURING: RAW DATA COLLECTION ═══
Call execute_custom_python_analysis with description "TURING: Data collection".
The code must:
  a) Download REAL data (FMP, FRED, EODHD, Yahoo Finance via yfinance)
  b) Save raw data into DataFrames

═══ STEP 3 — NEWTON: DATASET PREPARATION ═══
Call execute_custom_python_analysis with description "NEWTON: Dataset preparation".
The code must:
  a) Clean raw data (missing values, outliers, formats)
  b) Merge multiple sources on a common timeline
  c) Build derived variables (returns, spreads, ratios, dummies)
  d) Complete descriptive analysis: statistics, correlation matrix, stationarity tests (ADF, KPSS)
  e) Export the final dataset ready for analysis

═══ STEP 4 — FISHER: RIGOROUS ECONOMETRIC ANALYSIS ═══
Call execute_custom_python_analysis with description "FISHER: Empirical analysis".
The code must:
  a) Main model: estimate the central econometric model with coefficient interpretation
  b) MANDATORY robustness tests (at least 3):
     - Alternative specification (different model or estimator)
     - Sub-samples (temporal split, by size, by region)
     - Additional control variables
     - Parameter sensitivity tests
  c) Model diagnostics: residuals, heteroscedasticity, autocorrelation, normality
  d) Minimum 10-12 publication-quality figures

═══ STEP 5 — EULER: JOURNAL-QUALITY WRITING ═══
Write each section with write_paper_section. NON-NEGOTIABLE requirements — each section must be at its MAXIMUM LENGTH:
  - Introduction (10-16 paragraphs, min 8000 chars)
  - Literature review (20-30 paragraphs, 5-7 sub-sections, min 16000 chars)
  - Methodology (20-32 paragraphs, min 18000 chars)
  - Data (12-18 paragraphs, min 8000 chars)
  - Results (28-40 paragraphs, min 22000 chars)
  - Discussion (14-20 paragraphs, min 12000 chars)
  - Conclusion (5-8 paragraphs, min 4000 chars)
  - Appendix (min 10000 chars)

═══ STEP 6 — EULER: COMPILATION (MANDATORY, NEVER SKIP) ═══
Compile with compile_research_paper passing the bibtexBlock from the gap finder as bibtex_entries.
The final paper must be 60-90 pages and contain a minimum of 40 references.

⚠️ CRITICAL REMINDER: Steps 5 (writing) and 6 (compilation) are NON-OPTIONAL.
You MUST call write_paper_section for EACH section — 8 separate calls.
You MUST then call compile_research_paper with all sections and bibtex_entries.

NEVER write raw HTML in your text responses. Use only standard Markdown.

Begin IMMEDIATELY with the call to literature_gap_finder.`;
}

function generateSurprisePrompt(): { prompt: string; domainIdx: number; methodIdx: number } {
  const entry = pickPromptEntry();
  const { domain, method, topic, domainIdx, methodIdx } = entry;
  const seed = Math.floor(Math.random() * 100000);
  const year = 2020 + Math.floor(Math.random() * 6);
  const prompt = buildEulerPrompt(domain, method, topic, seed, year, entry.id);
  return { prompt, domainIdx, methodIdx };
}

/**
 * Generate a prompt using the ResearchDirector (intelligent mode).
 * Falls back to sequential prompt bank if ResearchDirector fails.
 */
async function generateIntelligentPrompt(): Promise<{ prompt: string; domainIdx: number; methodIdx: number; directive?: ResearchDirective }> {
  try {
    logger.info('[ResearchDirector] Selecting next research topic...');
    const directive = await selectNextResearch();

    // Check deduplication verdict
    if (directive.memoryBrief.deduplication.verdict === 'block') {
      logger.warn('[ResearchDirector] All candidates blocked by deduplication — falling back to sequential');
      return generateSurprisePrompt();
    }

    const seed = Math.floor(Math.random() * 100000);
    const year = 2020 + Math.floor(Math.random() * 6);
    const prompt = buildEulerPrompt(
      directive.domain,
      directive.method,
      directive.topic,
      seed,
      year,
      -1,
      directive.memoryBrief.text,
    );

    return { prompt, domainIdx: directive.domainIdx, methodIdx: directive.methodIdx, directive };
  } catch (err) {
    logger.error(`[ResearchDirector] Failed: ${(err as Error).message} — falling back to sequential`);
    return generateSurprisePrompt();
  }
}

// ── SSE-based pipeline execution with run status tracking ──

// Ordered pipeline stages — status can only move FORWARD, never regress
const STATUS_ORDER: Record<string, number> = {
  researching: 0,
  analyzing: 1,
  drafting: 2,
  validating: 3,
  published: 4,
  rejected: 4,
  failed: 4,
};

function mapToolToStatus(toolName: string, description?: string): string | null {
  if (toolName === 'literature_gap_finder' || toolName === 'openalex_search') return 'researching';
  if (toolName === 'execute_custom_python_analysis') {
    if (description && description.toLowerCase().includes('fisher')) return 'analyzing';
    return 'analyzing';
  }
  if (toolName === 'write_paper_section') return 'drafting';
  if (toolName === 'compile_research_paper') return 'drafting';
  return null;
}

function isForwardTransition(current: string, next: string): boolean {
  const currentOrder = STATUS_ORDER[current] ?? -1;
  const nextOrder = STATUS_ORDER[next] ?? -1;
  return nextOrder > currentOrder;
}

async function executePipeline(
  runId: string,
  sessionId: string,
  prompt: string,
  initialCheckpoint?: PipelineCheckpoint,
  restoreFromSessionId?: string,
  pipelineUser?: { userId: string; authorName: string },
): Promise<void> {
  const body = JSON.stringify({ query: prompt, history: [], sessionId, ...(restoreFromSessionId ? { restoreFromSessionId } : {}) });
  let currentStatus = 'researching';
  let forceFinalized = false;

  // ── Checkpoint tracking ──
  const checkpoint: PipelineCheckpoint = initialCheckpoint
    ? { ...initialCheckpoint }
    : createInitialCheckpoint();

  // Track tool_start inputs so we can enrich tool_complete events
  const pendingTools = new Map<string, { tool: string; input?: any }>();

  const saveCheckpoint = async () => {
    try {
      await storage.saveGovernorState(runId, checkpoint);
    } catch { /* best effort */ }
  };

  return new Promise<void>((resolve, reject) => {
    // Heartbeat: touch the DB every 60s so the stale-run cleanup knows we're alive
    const heartbeatInterval = setInterval(async () => {
      try { await storage.heartbeatPaperRun(runId); } catch { /* best effort */ }
    }, 60 * 1000);

    let httpReq: ReturnType<typeof http.request> | null = null;
    let aborted = false;

    const cleanup = () => {
      clearInterval(heartbeatInterval);
      abortRegistry.delete(runId);
    };

    // Register abort function so admin can kill this run
    abortRegistry.set(runId, () => {
      aborted = true;
      cleanup();
      if (httpReq) httpReq.destroy();
      reject(new Error('Pipeline aborted by admin'));
    });

    // Build headers — include internal user identity when generating on behalf of a user
    const reqHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Content-Length': String(Buffer.byteLength(body)),
    };
    if (pipelineUser) {
      reqHeaders['X-Internal-User-Id'] = pipelineUser.userId;
      reqHeaders['X-Internal-Author-Name'] = pipelineUser.authorName;
    }

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port: serverPort,
        path: '/api/chat',
        method: 'POST',
        headers: reqHeaders,
        timeout: 63 * 60 * 1000, // 63 min — must exceed chat route's 60-min auto-paper limit
      },
      (res) => {
        let hasError = false;

        res.on('data', async (chunk: Buffer) => {
          const text = chunk.toString();
          const lines = text.split('\n');
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === 'tool_start') {
                logger.info(`[Euler:${runId.slice(0, 8)}] Tool: ${data.tool}`);
                // Track pending tool for checkpoint enrichment
                if (data.toolId) {
                  pendingTools.set(data.toolId, { tool: data.tool, input: data.input });
                }
                const newStatus = mapToolToStatus(data.tool, data.description);
                if (newStatus && isForwardTransition(currentStatus, newStatus)) {
                  currentStatus = newStatus;
                  try { await storage.updatePaperRunStatus(runId, newStatus); } catch { /* best effort */ }
                }

              } else if (data.type === 'tool_complete') {
                // ── CHECKPOINT: record completed tool ──
                const toolId = data.toolId || '';
                const pendingEntry = pendingTools.get(toolId);
                const toolName = data.tool || pendingEntry?.tool || 'unknown';
                pendingTools.delete(toolId);

                checkpoint.completedTools.push({
                  tool: toolName,
                  toolId,
                  completedAt: Date.now(),
                });

                // Update stage based on completed tool
                const toolStage = mapToolToStatus(toolName);
                if (toolStage === 'researching' && checkpoint.lastCompletedStage === 'none') {
                  checkpoint.lastCompletedStage = 'researching';
                } else if (toolStage === 'analyzing' &&
                  (checkpoint.lastCompletedStage === 'none' || checkpoint.lastCompletedStage === 'researching')) {
                  checkpoint.lastCompletedStage = 'analyzing';
                } else if (toolStage === 'drafting' &&
                  checkpoint.lastCompletedStage !== 'drafting') {
                  checkpoint.lastCompletedStage = 'drafting';
                }

                // Track specific tool completions
                if (toolName === 'write_paper_section') {
                  const sectionType = pendingEntry?.input?.section_type || data.input?.section_type || `section_${checkpoint.sectionsWritten.length + 1}`;
                  if (!checkpoint.sectionsWritten.includes(sectionType)) {
                    checkpoint.sectionsWritten.push(sectionType);
                  }
                }
                if (toolName === 'compile_research_paper') {
                  checkpoint.compilationSeen = true;
                }

                logger.info(`[Checkpoint:${runId.slice(0, 8)}] ${toolName} done — stage: ${checkpoint.lastCompletedStage}, tools: ${checkpoint.completedTools.length}`);
                await saveCheckpoint();

              } else if (data.type === 'error') {
                hasError = true;
                logger.error(`[Euler:${runId.slice(0, 8)}] Error: ${data.message}`);

              } else if (data.type === 'status' && typeof data.message === 'string' &&
                         (data.message.includes('Maximum processing time') || data.message.includes('Maximum analysis depth'))) {
                forceFinalized = true;
                logger.warn(`[Euler:${runId.slice(0, 8)}] Pipeline was force-finalized: ${data.message}`);
              }
            } catch { /* not JSON */ }
          }
        });

        res.on('end', () => {
          if (aborted) return; // already handled by abort
          cleanup();
          if (hasError) {
            reject(new Error('Pipeline reported error'));
          } else if (forceFinalized && !checkpoint.compilationSeen) {
            // Don't reject immediately — the paper lookup retry loop will handle it.
            // The "approaching limit" instruction now tells Claude to compile, so give it a chance.
            logger.warn(`[Euler:${runId.slice(0, 8)}] Force-finalized without compilation seen — resolving anyway to allow paper lookup retry`);
            resolve();
          } else {
            resolve();
          }
        });

        res.on('error', (err) => { if (aborted) return; cleanup(); reject(err); });
      }
    );

    httpReq = req;

    req.on('error', (err) => {
      if (aborted) return; // already handled by abort
      cleanup(); reject(err);
    });
    req.on('timeout', () => { cleanup(); req.destroy(); reject(new Error('Pipeline timed out (63 min)')); });

    req.write(body);
    req.end();
  });
}

// ── Main generation + Popper validation (runs independently per paper) ──

async function cleanupStaleRuns(): Promise<void> {
  try {
    const cleaned = await storage.cleanupStalePaperRuns(30);
    if (cleaned > 0) {
      logger.warn(`[Euler] Cleaned up ${cleaned} stale run(s)`);
      // Re-sync activeGenerations counter with actual DB state after cleanup
      await syncActiveGenerations();
    }
  } catch (err) {
    logger.error(`[Euler] Stale run cleanup failed: ${(err as Error).message}`);
  }
}

/** Sync the in-memory activeGenerations counter with actual DB state.
 *  Prevents counter drift after crashes, restarts, or stale run cleanups. */
async function syncActiveGenerations(): Promise<void> {
  try {
    const activeRuns = await storage.getAllActivePaperRuns();
    const dbActive = activeRuns.length;
    if (activeGenerations !== dbActive) {
      logger.warn(`[Euler] Syncing activeGenerations: memory=${activeGenerations} → DB=${dbActive} (${activeRuns.map(r => r.id.slice(0, 8)).join(', ')})`);
      activeGenerations = dbActive;
      activeRunIds.clear();
      for (const run of activeRuns) activeRunIds.add(run.id);
    }
  } catch (err) {
    logger.warn(`[Euler] Failed to sync activeGenerations: ${(err as Error).message}`);
  }
}

async function triggerPaperGeneration(): Promise<void> {
  // Cleanup any runs stuck beyond the timeout before starting new ones
  await cleanupStaleRuns();

  // Check concurrency limit
  if (activeGenerations >= schedulerConfig.maxConcurrent) {
    logger.info(`[Euler] At max concurrency (${activeGenerations}/${schedulerConfig.maxConcurrent}) — skipping this trigger`);
    return;
  }

  // Immediately claim a slot
  activeGenerations++;

  // Select topic: intelligent (ResearchDirector) or classic (sequential/weighted)
  let prompt: string;
  let domainIdx: number;
  let methodIdx: number;
  let directive: ResearchDirective | undefined;

  if (schedulerConfig.selectionMode === 'intelligent') {
    const result = await generateIntelligentPrompt();
    prompt = result.prompt;
    domainIdx = result.domainIdx;
    methodIdx = result.methodIdx;
    directive = result.directive;
  } else {
    const result = generateSurprisePrompt();
    prompt = result.prompt;
    domainIdx = result.domainIdx;
    methodIdx = result.methodIdx;
  }

  const domain = DOMAINS[domainIdx] ?? schedulerConfig.domainPool[domainIdx] ?? 'Unknown';
  const method = METHODS[methodIdx] ?? schedulerConfig.methodPool[methodIdx] ?? 'Unknown';
  const sessionId = `auto-paper-${Date.now()}`;

  logger.banner('EULER', `Generating paper #${paperCount + 1} (${activeGenerations} active) [mode: ${schedulerConfig.selectionMode}${directive ? ' — ResearchDirector' : ''}]`);
  logger.kv('Domain', domain);
  logger.kv('Method', method);
  if (directive) {
    logger.kv('Topic', directive.topic);
    logger.kv('Exploration', directive.explorationMode ? 'YES (30%)' : 'NO (exploitation)');
    logger.kv('Dedup', `${(directive.memoryBrief.deduplication.similarity * 100).toFixed(1)}% [${directive.memoryBrief.deduplication.verdict}]`);
  }

  // Record in history
  history.push({ domainIdx, methodIdx, timestamp: Date.now() });
  if (history.length > MAX_HISTORY) history.splice(0, history.length - MAX_HISTORY);

  // 1. Create run record
  let run;
  try {
    run = await storage.createPaperRun({
      status: 'queued',
      domain,
      method,
      prompt,
      sessionId,
      paperId: null,
      popperScore: null,
      popperRecommendation: null,
      popperReviewId: null,
      errorMessage: null,
      startedAt: null,
      completedAt: null,
      lastHeartbeat: null,
      governorState: null,
    });
  } catch (err) {
    logger.error(`[Euler] Failed to create run: ${(err as Error).message}`);
    activeGenerations--;
    return;
  }

  activeRunIds.add(run.id);

  try {
    // 2. Start pipeline
    await storage.updatePaperRunStatus(run.id, 'researching', { startedAt: new Date() });

    await executePipeline(run.id, sessionId, prompt);

    // 3. Retry finding the paper — DB writes may take a moment to settle
    let paper: any = null;
    for (let attempt = 1; attempt <= 5; attempt++) {
      await new Promise(r => setTimeout(r, attempt * 2000)); // 2s, 4s, 6s, 8s, 10s
      const papers = await storage.getAllPublishedPapers();
      paper = papers.find((p: any) => p.sessionId === sessionId);
      if (paper) break;
      logger.info(`[Euler:${run.id.slice(0, 8)}] Paper not found yet (attempt ${attempt}/5)`);
    }

    if (!paper) {
      await storage.updatePaperRunStatus(run.id, 'failed', {
        errorMessage: 'No paper produced after pipeline completion (5 retries)',
        completedAt: new Date(),
      });
      logger.error(`[Euler:${run.id.slice(0, 8)}] Pipeline completed but no paper found after retries`);
      return;
    }

    // 5. Popper validation (skipped when popperEnabled=false → auto-publish)
    let finalPopperScore: number | null = null;
    let published = false;
    let reviewWeaknesses: string[] = [];
    let reviewStrengths: string[] = [];
    let sectionReviews: Array<{ section: string; score: number; comments: string }> = [];

    if (!schedulerConfig.popperEnabled) {
      logger.info(`[Euler:${run.id.slice(0, 8)}] Popper DISABLED — auto-publishing paper: ${paper.title}`);
      await storage.updatePaperRunStatus(run.id, 'published', {
        paperId: paper.id,
        popperScore: null,
        popperRecommendation: 'auto-published (Popper disabled)',
        completedAt: new Date(),
      });
      paperCount++;
      published = true;
      logger.success(`[Euler:${run.id.slice(0, 8)}] AUTO-PUBLISHED — Paper #${paperCount} (Popper validation skipped)`);
    } else {
      logger.info(`[Popper:${run.id.slice(0, 8)}] Validating paper: ${paper.title}`);
      await storage.updatePaperRunStatus(run.id, 'validating', { paperId: paper.id });

      const reviewResult = await generatePeerReview(paper);

      const review = await storage.createPeerReview({
        paperId: paper.id,
        overallScore: reviewResult.overallScore,
        summary: reviewResult.summary,
        strengths: JSON.stringify(reviewResult.strengths),
        weaknesses: JSON.stringify(reviewResult.weaknesses),
        detailedScores: JSON.stringify(reviewResult.detailedScores),
        sectionReviews: JSON.stringify(reviewResult.sectionReviews),
        recommendation: reviewResult.recommendation,
        fullReport: reviewResult.fullReport,
      });

      finalPopperScore = reviewResult.overallScore;
      reviewWeaknesses = reviewResult.weaknesses;
      reviewStrengths = reviewResult.strengths;
      sectionReviews = reviewResult.sectionReviews;

      // 6. Publish or reject based on Popper score only
      if (reviewResult.overallScore >= schedulerConfig.popperThreshold) {
        await storage.updatePaperRunStatus(run.id, 'published', {
          popperScore: reviewResult.overallScore,
          popperRecommendation: reviewResult.recommendation,
          popperReviewId: review.id,
          completedAt: new Date(),
        });
        paperCount++;
        published = true;
        logger.success(`[Popper:${run.id.slice(0, 8)}] ACCEPTED — Score: ${reviewResult.overallScore}/100 — Paper #${paperCount} published`);
      } else {
        await storage.updatePaperVisibility(paper.id, 0); // hide from public journal
        await storage.updatePaperRunStatus(run.id, 'rejected', {
          popperScore: reviewResult.overallScore,
          popperRecommendation: reviewResult.recommendation,
          popperReviewId: review.id,
          completedAt: new Date(),
        });
        logger.warn(`[Popper:${run.id.slice(0, 8)}] REJECTED — Score: ${reviewResult.overallScore}/100 (threshold: ${schedulerConfig.popperThreshold})`);
      }
    }

    // 7. GME Memory Update — learn from this run
    try {
      await updateMemoryAfterRun({
        runId: run.id,
        asid: paper.asid,
        title: paper.title,
        abstract: paper.abstract,
        domain,
        method,
        popperScore: finalPopperScore,
        published,
        latexContent: paper.latexContent,
        bibtexEntries: paper.bibtexEntries,
        reviewWeaknesses,
        reviewStrengths,
        sectionReviews,
      });
    } catch (memErr) {
      logger.warn(`[GME] Memory update failed (non-fatal): ${(memErr as Error).message}`);
    }
  } catch (err) {
    const msg = (err as Error).message;
    logger.error(`[Euler:${run.id.slice(0, 8)}] Run failed: ${msg}`);
    try {
      await storage.updatePaperRunStatus(run.id, 'failed', {
        errorMessage: msg,
        completedAt: new Date(),
      });
      // Update memory even on failure (to learn from errors)
      await updateMemoryAfterRun({
        runId: run.id,
        title: `Failed: ${domain} / ${method}`,
        domain,
        method,
        published: false,
        pipelineErrors: [{
          stage: 'unknown',
          errorType: 'pipeline_failure',
          errorMessage: msg,
          resolved: false,
        }],
      });
    } catch { /* best effort */ }
  } finally {
    activeGenerations--;
    activeRunIds.delete(run.id);
    logger.info(`[Euler] Generation slot freed (${activeGenerations} still active)`);
  }
}

// ── Public API ──

export function getSchedulerConfig(): SchedulerConfig & { running: boolean; isGenerating: boolean; activeGenerations: number; paperCount: number; promptBankSize: number } {
  return {
    ...schedulerConfig,
    running: intervalId !== null,
    isGenerating: activeGenerations > 0,
    activeGenerations,
    paperCount,
    promptBankSize: PROMPT_BANK.length,
  };
}

export function updateSchedulerConfig(updates: Partial<SchedulerConfig>) {
  const wasEnabled = schedulerConfig.enabled;

  if (updates.intervalMs !== undefined) schedulerConfig.intervalMs = updates.intervalMs;
  if (updates.popperThreshold !== undefined) schedulerConfig.popperThreshold = updates.popperThreshold;
  if (updates.popperEnabled !== undefined) schedulerConfig.popperEnabled = updates.popperEnabled;
  if (updates.maxConcurrent !== undefined) schedulerConfig.maxConcurrent = Math.max(1, Math.min(updates.maxConcurrent, 10));
  if (updates.domainPool !== undefined) schedulerConfig.domainPool = updates.domainPool;
  if (updates.methodPool !== undefined) schedulerConfig.methodPool = updates.methodPool;
  if (updates.enabled !== undefined) schedulerConfig.enabled = updates.enabled;
  if (updates.promptCursor !== undefined) schedulerConfig.promptCursor = Math.max(0, Math.min(updates.promptCursor, PROMPT_BANK.length - 1));
  if (updates.selectionMode !== undefined && ['sequential', 'weighted', 'intelligent'].includes(updates.selectionMode)) schedulerConfig.selectionMode = updates.selectionMode;

  // Handle enable/disable transitions
  if (schedulerConfig.enabled && !wasEnabled) {
    startSchedulerInterval();
  } else if (!schedulerConfig.enabled && wasEnabled) {
    stopSchedulerInterval();
  } else if (schedulerConfig.enabled && updates.intervalMs !== undefined) {
    // Restart with new interval
    stopSchedulerInterval();
    startSchedulerInterval();
  }

  logger.info(`[Euler] Config updated: enabled=${schedulerConfig.enabled}, interval=${schedulerConfig.intervalMs / 60000}min, maxConcurrent=${schedulerConfig.maxConcurrent}, threshold=${schedulerConfig.popperThreshold}`);
}

function startSchedulerInterval() {
  if (intervalId) return;
  logger.info(`[Euler] Scheduler enabled — generating every ${schedulerConfig.intervalMs / 60000} min (max ${schedulerConfig.maxConcurrent} concurrent)`);
  // First run after 2-minute warmup
  setTimeout(() => {
    if (schedulerConfig.enabled) {
      triggerPaperGeneration();
      intervalId = setInterval(() => {
        if (schedulerConfig.enabled) triggerPaperGeneration();
      }, schedulerConfig.intervalMs);
    }
  }, 2 * 60 * 1000);
}

function stopSchedulerInterval() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    logger.info('[Euler] Scheduler disabled (active generations will complete)');
  }
}

export function triggerManualRun() {
  triggerPaperGeneration();
}

/**
 * Trigger a paper generation with a fully custom prompt from the admin panel.
 * Wraps the prompt in the Euler agent scaffold and follows the full pipeline.
 */
export async function triggerCustomPromptRun(opts: {
  prompt: string;
  domain?: string;
  method?: string;
  researchType?: string;
  userId?: string;
  authorName?: string;
}): Promise<{ runId: string; sessionId: string }> {
  // Cleanup stale runs first
  await cleanupStaleRuns();

  if (activeGenerations >= schedulerConfig.maxConcurrent) {
    throw new Error(`At max concurrency (${activeGenerations}/${schedulerConfig.maxConcurrent}). Wait for active runs to complete.`);
  }

  activeGenerations++;

  const domain = opts.domain || 'Custom';
  const method = opts.method || 'Custom';
  const sessionId = opts.userId
    ? `user-paper-${opts.userId}-${Date.now()}`
    : `admin-paper-${Date.now()}`;

  // Wrap the user prompt in the Euler agent scaffold for rigorous execution
  const fullPrompt = `You are Euler — The AutoScholar Research Agent. You coordinate 4 sub-agents to generate a COMPLETE and RIGOROUS research paper:
- Gauss (gap analysis) — literature gap discovery
- Turing (data collection) — raw data acquisition
- Newton (dataset preparation) — cleaning and final dataset construction
- Fisher (empirical analysis) — econometric analysis and figures

ADMIN CUSTOM RESEARCH DIRECTIVE:
${opts.prompt}
${opts.researchType ? `\nMANDATORY PAPER TYPE: TYPE ${opts.researchType}. Do NOT auto-detect — use TYPE ${opts.researchType} (${
  { A: 'EMPIRICAL', B: 'THEORETICAL', C: 'HYBRID', D: 'STATISTICS', E: 'MACHINE LEARNING', F: 'AI / DEEP LEARNING' }[opts.researchType]
}) for the entire pipeline. Follow all TYPE ${opts.researchType} requirements strictly.` : ''}

Follow this strict 6-step protocol:

═══ STEP 1 — GAUSS: GAP DISCOVERY (MANDATORY, FIRST ACTION) ═══
Call literature_gap_finder with the research subject described above.
The gap finder will search 200M+ papers and identify genuine gaps in the literature.
IMPORTANT: Use the gap finder's results to refine the exact research question — don't just use the admin prompt verbatim.

═══ STEP 2 — TURING: RAW DATA COLLECTION ═══
Call execute_custom_python_analysis with description "TURING: Data collection".
The code must:
  a) Download REAL data (FMP, FRED, EODHD, World Bank, IMF, OECD, web_dataset_collector)
  b) Save raw data with save_raw_data() for full provenance
  c) NEVER simulate or hardcode data — use the MANDATORY FALLBACK CHAIN if APIs fail

═══ STEP 3 — NEWTON: DATASET PREPARATION ═══
Call execute_custom_python_analysis with description "NEWTON: Dataset preparation".
The code must:
  a) Clean raw data (missing values, outliers, formats)
  b) Merge multiple sources on a common timeline
  c) Build derived variables (returns, spreads, ratios, dummies)
  d) Complete descriptive analysis: statistics, correlation matrix, stationarity tests (ADF, KPSS)
  e) Save processed data with save_processed_data()

═══ STEP 4 — FISHER: RIGOROUS ECONOMETRIC ANALYSIS ═══
Call execute_custom_python_analysis with description "FISHER: Empirical analysis".
The code must:
  a) Main model: estimate the central econometric model with coefficient interpretation
  b) MANDATORY robustness tests (at least 3):
     - Alternative specification (different model or estimator)
     - Sub-samples (temporal split, by size, by region)
     - Additional control variables
     - Parameter sensitivity tests
  c) Model diagnostics: residuals, heteroscedasticity, autocorrelation, normality
  d) Minimum 10-12 publication-quality figures

═══ STEP 5 — EULER: JOURNAL-QUALITY WRITING ═══
Write each section with write_paper_section. NON-NEGOTIABLE requirements — each section must be at its MAXIMUM LENGTH:
  - Introduction (10-16 paragraphs, min 8000 chars)
  - Literature review (20-30 paragraphs, 5-7 sub-sections, min 16000 chars)
  - Methodology (20-32 paragraphs, min 18000 chars)
  - Data (12-18 paragraphs, min 8000 chars)
  - Results (28-40 paragraphs, min 22000 chars)
  - Discussion (14-20 paragraphs, min 12000 chars)
  - Conclusion (5-8 paragraphs, min 4000 chars)
  - Appendix (min 10000 chars)

═══ STEP 6 — EULER: COMPILATION (MANDATORY, NEVER SKIP) ═══
Compile with compile_research_paper passing the bibtexBlock from the gap finder as bibtex_entries.
The final paper must be 60-90 pages and contain a minimum of 40 references.

⚠️ CRITICAL REMINDER: Steps 5 (writing) and 6 (compilation) are NON-OPTIONAL.
You MUST call write_paper_section for EACH section — 8 separate calls.
You MUST then call compile_research_paper with all sections and bibtex_entries.

NEVER write raw HTML in your text responses. Use only standard Markdown.

Begin IMMEDIATELY with the call to literature_gap_finder.`;

  const pipelineUser = opts.userId && opts.authorName
    ? { userId: opts.userId, authorName: opts.authorName }
    : undefined;

  logger.banner('EULER', `Custom paper generation${opts.userId ? ' (user-triggered)' : ' from admin panel'} (${activeGenerations} active)`);
  logger.kv('Domain', domain);
  logger.kv('Method', method);
  logger.kv('Research Type', opts.researchType || 'Auto-detect');
  logger.kv('Prompt length', `${opts.prompt.length} chars`);

  let run;
  try {
    run = await storage.createPaperRun({
      status: 'queued',
      domain,
      method,
      prompt: opts.prompt,
      sessionId,
      paperId: null,
      popperScore: null,
      popperRecommendation: null,
      popperReviewId: null,
      errorMessage: null,
      startedAt: null,
      completedAt: null,
      lastHeartbeat: null,
      governorState: null,
    });
  } catch (err) {
    activeGenerations--;
    throw new Error(`Failed to create run: ${(err as Error).message}`);
  }

  activeRunIds.add(run.id);

  // Launch pipeline in background (don't await — let it run async)
  (async () => {
    try {
      await storage.updatePaperRunStatus(run.id, 'researching', { startedAt: new Date() });
      await executePipeline(run.id, sessionId, fullPrompt, undefined, undefined, pipelineUser);

      await new Promise(r => setTimeout(r, 3000));

      const papers = await storage.getAllPublishedPapers();
      const paper = papers.find(p => p.sessionId === sessionId);

      if (!paper) {
        await storage.updatePaperRunStatus(run.id, 'failed', {
          errorMessage: 'No paper produced after pipeline completion',
          completedAt: new Date(),
        });
        logger.error(`[Euler:${run.id.slice(0, 8)}] Custom pipeline completed but no paper found`);
        return;
      }

      if (!schedulerConfig.popperEnabled) {
        await storage.updatePaperRunStatus(run.id, 'published', {
          paperId: paper.id,
          popperScore: null,
          popperRecommendation: 'auto-published (Popper disabled)',
          completedAt: new Date(),
        });
        paperCount++;
        logger.success(`[Euler:${run.id.slice(0, 8)}] CUSTOM PAPER PUBLISHED (Popper disabled)`);
      } else {
        await storage.updatePaperRunStatus(run.id, 'validating', { paperId: paper.id });
        const reviewResult = await generatePeerReview(paper);

        await storage.createPeerReview({
          paperId: paper.id,
          overallScore: reviewResult.overallScore,
          summary: reviewResult.summary,
          strengths: JSON.stringify(reviewResult.strengths),
          weaknesses: JSON.stringify(reviewResult.weaknesses),
          detailedScores: JSON.stringify(reviewResult.detailedScores),
          sectionReviews: JSON.stringify(reviewResult.sectionReviews),
          recommendation: reviewResult.recommendation,
          fullReport: reviewResult.fullReport,
        });

        if (reviewResult.overallScore >= schedulerConfig.popperThreshold) {
          await storage.updatePaperRunStatus(run.id, 'published', {
            popperScore: reviewResult.overallScore,
            popperRecommendation: reviewResult.recommendation,
            completedAt: new Date(),
          });
          paperCount++;
          logger.success(`[Euler:${run.id.slice(0, 8)}] CUSTOM PAPER PUBLISHED — Popper: ${reviewResult.overallScore}/100`);
        } else {
          await storage.updatePaperRunStatus(run.id, 'rejected', {
            popperScore: reviewResult.overallScore,
            popperRecommendation: reviewResult.recommendation,
            completedAt: new Date(),
          });
          logger.warn(`[Euler:${run.id.slice(0, 8)}] CUSTOM PAPER REJECTED — Popper: ${reviewResult.overallScore}/100`);
        }
      }
    } catch (err) {
      await storage.updatePaperRunStatus(run.id, 'failed', {
        errorMessage: (err as Error).message,
        completedAt: new Date(),
      });
      logger.error(`[Euler:${run.id.slice(0, 8)}] Custom pipeline failed: ${(err as Error).message}`);
    } finally {
      activeGenerations--;
      activeRunIds.delete(run.id);
    }
  })();

  return { runId: run.id, sessionId };
}

/** Force-cleanup stale runs from outside the scheduler (e.g. admin endpoint). */
export async function forceCleanupStaleRuns(): Promise<number> {
  const cleaned = await storage.cleanupStalePaperRuns(30);
  await syncActiveGenerations();
  return cleaned;
}

/**
 * Resume a failed/timed-out run from its last checkpoint.
 * Loads the intermediate conversation data saved by the chat route,
 * builds a continuation prompt, and re-launches the pipeline for another 30 minutes.
 */
// ── Helpers for extracting checkpoint data from conversation session ──

function extractToolResults(sessionMessages: string, toolName: string): any[] {
  try {
    const messages = JSON.parse(sessionMessages);
    if (!Array.isArray(messages)) return [];
    const last = messages[messages.length - 1];
    if (!last?.toolResults) return [];
    return last.toolResults.filter((t: any) => t.tool === toolName);
  } catch { return []; }
}

function truncateResult(text: string, max: number = 2000): string {
  if (!text || text.length <= max) return text || '';
  return text.slice(0, max) + '...[truncated]';
}

function buildResumePrompt(
  run: { prompt: string | null; id: string },
  checkpoint: PipelineCheckpoint,
  sessionMessages: string,
): string {
  const parts: string[] = [];

  parts.push(`RESUME FROM CHECKPOINT — Run ${run.id.slice(0, 8)} — Attempt ${checkpoint.resumeCount + 1}/${MAX_RESUME_ATTEMPTS}`);
  parts.push('');
  parts.push('ORIGINAL RESEARCH PROMPT:');
  parts.push(run.prompt || '(prompt not available)');
  parts.push('');
  parts.push(`=== COMPLETED WORK (stage: ${checkpoint.lastCompletedStage}, ${checkpoint.completedTools.length} tools) ===`);

  // Extract gap finder results
  const gapResults = extractToolResults(sessionMessages, 'literature_gap_finder');
  if (gapResults.length > 0) {
    parts.push('');
    parts.push('--- LITERATURE GAP FINDER ---');
    for (const g of gapResults) {
      parts.push(truncateResult(typeof g.result === 'string' ? g.result : JSON.stringify(g.result), 3000));
    }
  }

  // Extract OpenAlex search results
  const scholarResults = extractToolResults(sessionMessages, 'openalex_search');
  if (scholarResults.length > 0) {
    parts.push('');
    parts.push(`--- LITERATURE SEARCHES (${scholarResults.length} queries) ---`);
    for (const s of scholarResults) {
      const resultStr = typeof s.result === 'string' ? s.result : JSON.stringify(s.result);
      parts.push(truncateResult(resultStr, 1500));
    }
  }

  // Extract Python analysis summaries
  const pythonResults = extractToolResults(sessionMessages, 'execute_custom_python_analysis');
  if (pythonResults.length > 0) {
    parts.push('');
    parts.push(`--- PYTHON ANALYSES (${pythonResults.length} executions) ---`);
    for (const p of pythonResults) {
      const r = p.result;
      if (typeof r === 'object' && r !== null) {
        const desc = r.description || r.output?.slice(0, 500) || 'analysis completed';
        const figCount = r.figures?.length || 0;
        parts.push(`- ${desc}${figCount > 0 ? ` [${figCount} figure(s)]` : ''}`);
      } else {
        parts.push(`- ${truncateResult(String(r), 500)}`);
      }
    }
  }

  // Written sections tracking
  if (checkpoint.sectionsWritten.length > 0) {
    parts.push('');
    parts.push(`--- SECTIONS WRITTEN (${checkpoint.sectionsWritten.length}) ---`);
    parts.push(checkpoint.sectionsWritten.join(', '));

    const allSections = ['introduction', 'literature_review', 'data_and_methodology', 'results', 'robustness_checks', 'discussion', 'conclusion', 'appendix'];
    const remaining = allSections.filter(s => !checkpoint.sectionsWritten.includes(s));
    if (remaining.length > 0) {
      parts.push(`--- SECTIONS REMAINING: ${remaining.join(', ')} ---`);
    }
  }

  // BibTeX data
  const gapBibtex = gapResults.find((g: any) => g.result?.bibtex_block || g.result?.bibtexBlock);
  if (gapBibtex) {
    const bib = gapBibtex.result?.bibtex_block || gapBibtex.result?.bibtexBlock;
    if (bib) {
      parts.push('');
      parts.push('--- BIBTEX ENTRIES ---');
      parts.push(truncateResult(bib, 3000));
    }
  }

  // Stage-specific continuation instructions
  parts.push('');
  parts.push('=== INSTRUCTIONS ===');

  switch (checkpoint.lastCompletedStage) {
    case 'researching':
      parts.push('Literature review is COMPLETE. Begin with TURING data collection (execute_custom_python_analysis).');
      parts.push('Download datasets from FRED, World Bank, IMF, or OECD as appropriate for the research question.');
      break;
    case 'analyzing':
      parts.push('All data collection and empirical analysis is COMPLETE. Figures have been generated.');
      parts.push('Begin writing the paper sections with write_paper_section. Write ALL required sections, then compile with compile_research_paper.');
      break;
    case 'drafting':
      if (checkpoint.compilationSeen) {
        parts.push('Paper was already compiled. If the compilation failed, try compile_research_paper again.');
      } else if (checkpoint.sectionsWritten.length >= 7) {
        parts.push('Most sections are written. Write any remaining sections and then compile with compile_research_paper.');
      } else {
        parts.push(`Continue writing remaining sections. ${checkpoint.sectionsWritten.length} of ~8 sections completed.`);
        parts.push('After all sections are written, compile with compile_research_paper.');
      }
      break;
    default:
      parts.push('Continue the research paper pipeline from where it stopped.');
      parts.push('Do NOT repeat tools already completed. Focus on the next step.');
  }

  parts.push('');
  parts.push('CRITICAL: Do NOT re-run tools that already completed. The data and figures from previous steps are available. Pick up exactly where the pipeline stopped.');

  return parts.join('\n');
}

export async function resumePaperRun(runId: string): Promise<{ resumed: boolean; reason?: string }> {
  const run = await storage.getPaperRunById(runId);
  if (!run) return { resumed: false, reason: 'Run not found' };
  if (run.status !== 'failed') return { resumed: false, reason: `Run is in "${run.status}" state, not "failed"` };
  if (!run.sessionId) return { resumed: false, reason: 'Run has no sessionId — cannot load checkpoint' };

  // Check concurrency
  if (activeGenerations >= schedulerConfig.maxConcurrent) {
    return { resumed: false, reason: `At max concurrency (${activeGenerations}/${schedulerConfig.maxConcurrent})` };
  }

  // Load structured checkpoint from governorState
  const checkpoint = parseCheckpoint(run.governorState);

  // Fallback: if no structured checkpoint, check if conversation session has data
  if (!checkpoint || checkpoint.lastCompletedStage === 'none') {
    // Try to build a minimal checkpoint from conversation session
    const session = await storage.getConversationSession(run.sessionId);
    if (!session) return { resumed: false, reason: 'No checkpoint and no session data — nothing to resume from' };

    let toolResults: any[] = [];
    try {
      const messages = JSON.parse(session.messages);
      const last = messages?.[messages.length - 1];
      toolResults = last?.toolResults || [];
    } catch { /* ignore */ }

    if (toolResults.length === 0) {
      return { resumed: false, reason: 'No tools completed before crash — nothing to resume from' };
    }
  }

  // Check resume limits
  const ckpt = checkpoint || createInitialCheckpoint();
  if (ckpt.resumeCount >= MAX_RESUME_ATTEMPTS) {
    return { resumed: false, reason: `Max resume attempts reached (${ckpt.resumeCount}/${MAX_RESUME_ATTEMPTS})` };
  }

  // Crash loop detection: 2+ resumes in <10 minutes
  if (ckpt.resumeCount >= 2 && ckpt.lastResumeAt && (Date.now() - ckpt.lastResumeAt < 10 * 60 * 1000)) {
    return { resumed: false, reason: 'Crash loop detected — too many resumes in <10 minutes' };
  }

  // Load session for prompt building
  const session = await storage.getConversationSession(run.sessionId);
  if (!session) return { resumed: false, reason: 'No conversation session found' };

  // Update checkpoint for this resume attempt
  ckpt.resumeCount++;
  ckpt.lastResumeAt = Date.now();

  // Build rich continuation prompt
  const resumePrompt = buildResumePrompt(run, ckpt, session.messages);

  // Re-activate the run
  activeGenerations++;
  activeRunIds.add(run.id);

  const resumeStage = ckpt.lastCompletedStage === 'none' ? 'researching' :
    ckpt.lastCompletedStage === 'drafting' ? 'drafting' :
    ckpt.lastCompletedStage === 'analyzing' ? 'drafting' : 'analyzing';

  logger.banner('EULER RESUME', `Resuming run ${run.id.slice(0, 8)} from "${ckpt.lastCompletedStage}" (attempt ${ckpt.resumeCount}/${MAX_RESUME_ATTEMPTS})`);
  logger.kv('Tools completed', ckpt.completedTools.length);
  logger.kv('Sections written', ckpt.sectionsWritten.length);
  logger.kv('Resume stage', resumeStage);

  try {
    // Save updated checkpoint before resuming
    await storage.saveGovernorState(run.id, ckpt);

    // Reset run to active state
    await storage.updatePaperRunStatus(run.id, resumeStage, {
      errorMessage: null as any,
      completedAt: null as any,
      startedAt: new Date(),
    });

    // Reuse the SAME session ID so figures, tool results, and data from the
    // failed run are available in-context (no duplicate session in the dashboard).
    const resumeSessionId = run.sessionId;

    await executePipeline(run.id, resumeSessionId, resumePrompt, ckpt, run.sessionId);

    // Retry finding the paper — DB writes may take a moment to settle
    let paper: any = null;
    for (let attempt = 1; attempt <= 5; attempt++) {
      await new Promise(r => setTimeout(r, attempt * 2000));
      const papers = await storage.getAllPublishedPapers();
      paper = papers.find((p: any) => p.sessionId === resumeSessionId);
      if (paper) break;
      logger.info(`[Euler:${run.id.slice(0, 8)}] Resume paper not found yet (attempt ${attempt}/5)`);
    }

    if (!paper) {
      await storage.updatePaperRunStatus(run.id, 'failed', {
        errorMessage: 'Resume: no paper produced after pipeline completion (5 retries)',
        completedAt: new Date(),
      });
      return { resumed: true, reason: 'Pipeline completed but no paper was produced' };
    }

    // Popper validation
    if (!schedulerConfig.popperEnabled) {
      logger.info(`[Euler:${run.id.slice(0, 8)}] Popper DISABLED — auto-publishing resumed paper: ${paper.title}`);
      await storage.updatePaperRunStatus(run.id, 'published', {
        paperId: paper.id,
        popperScore: null as any,
        popperRecommendation: 'auto-published (Popper disabled)',
        completedAt: new Date(),
      });
      paperCount++;
      logger.success(`[Euler:${run.id.slice(0, 8)}] RESUMED & AUTO-PUBLISHED — Paper #${paperCount} (Popper skipped)`);
    } else {
      logger.info(`[Popper:${run.id.slice(0, 8)}] Validating resumed paper: ${paper.title}`);
      await storage.updatePaperRunStatus(run.id, 'validating', { paperId: paper.id });

      const reviewResult = await generatePeerReview(paper);
      const review = await storage.createPeerReview({
        paperId: paper.id,
        overallScore: reviewResult.overallScore,
        summary: reviewResult.summary,
        strengths: JSON.stringify(reviewResult.strengths),
        weaknesses: JSON.stringify(reviewResult.weaknesses),
        detailedScores: JSON.stringify(reviewResult.detailedScores),
        sectionReviews: JSON.stringify(reviewResult.sectionReviews),
        recommendation: reviewResult.recommendation,
        fullReport: reviewResult.fullReport,
      });

      if (reviewResult.overallScore >= schedulerConfig.popperThreshold) {
        await storage.updatePaperRunStatus(run.id, 'published', {
          popperScore: reviewResult.overallScore,
          popperRecommendation: reviewResult.recommendation,
          popperReviewId: review.id,
          completedAt: new Date(),
        });
        paperCount++;
        logger.success(`[Popper:${run.id.slice(0, 8)}] RESUMED & ACCEPTED — Score: ${reviewResult.overallScore}/100`);
      } else {
        await storage.updatePaperVisibility(paper.id, 0);
        await storage.updatePaperRunStatus(run.id, 'rejected', {
          popperScore: reviewResult.overallScore,
          popperRecommendation: reviewResult.recommendation,
          popperReviewId: review.id,
          completedAt: new Date(),
        });
        logger.warn(`[Popper:${run.id.slice(0, 8)}] RESUMED & REJECTED — Score: ${reviewResult.overallScore}/100`);
      }
    }

    return { resumed: true };
  } catch (err) {
    const msg = (err as Error).message;
    logger.error(`[Euler:${run.id.slice(0, 8)}] Resume failed: ${msg}`);
    try {
      await storage.updatePaperRunStatus(run.id, 'failed', {
        errorMessage: `Resume failed (attempt ${ckpt.resumeCount}/${MAX_RESUME_ATTEMPTS}): ${msg}`,
        completedAt: new Date(),
      });
    } catch { /* best effort */ }
    return { resumed: true, reason: `Resume failed: ${msg}` };
  } finally {
    activeGenerations--;
    activeRunIds.delete(run.id);
    logger.info(`[Euler] Resume slot freed (${activeGenerations} still active)`);
  }
}

export function startAutoPaperScheduler(port: number) {
  serverPort = port;

  // Seed history from existing papers + restore prompt cursor from total runs
  (async () => {
    try {
      const existingPapers = await storage.getAllPublishedPapers();
      const domainToIdx = new Map(schedulerConfig.domainPool.map((d, i) => [d.toLowerCase(), i]));

      for (const paper of existingPapers.slice(0, MAX_HISTORY)) {
        if (paper.domain) {
          const dLower = paper.domain.toLowerCase();
          for (const [domStr, idx] of Array.from(domainToIdx.entries())) {
            if (dLower.includes(domStr.split('&')[0].trim().split(' ')[0]) || domStr.includes(dLower.split('&')[0].trim().split(' ')[0])) {
              history.push({
                domainIdx: idx,
                methodIdx: Math.floor(Math.random() * schedulerConfig.methodPool.length),
                timestamp: new Date(paper.publishedAt).getTime(),
              });
              break;
            }
          }
        }
      }

      if (history.length > 0) {
        logger.info(`[Euler] Seeded history with ${history.length} existing papers`);
      }

      // Restore prompt cursor: advance past all previously attempted runs
      const allRuns = await storage.getAllPaperRuns(1000);
      if (allRuns.length > 0) {
        schedulerConfig.promptCursor = allRuns.length % PROMPT_BANK.length;
        logger.info(`[Euler] Restored prompt cursor to ${schedulerConfig.promptCursor} (${allRuns.length} previous runs, bank size ${PROMPT_BANK.length})`);
      }
    } catch (err) {
      logger.warn(`[Euler] Could not seed history: ${(err as Error).message}`);
    }

    // On startup, detect interrupted runs and auto-resume or force-fail
    try {
      const activeRuns = await storage.getAllActivePaperRuns();
      if (activeRuns.length > 0) {
        logger.warn(`[Euler] Server restart: found ${activeRuns.length} interrupted run(s)`);
      }
      for (const run of activeRuns) {
        const checkpoint = parseCheckpoint(run.governorState);
        const canResume = checkpoint
          && checkpoint.lastCompletedStage !== 'none'
          && checkpoint.resumeCount < MAX_RESUME_ATTEMPTS
          && run.sessionId
          // Crash loop: 2+ resumes in <10 min → don't resume
          && !(checkpoint.resumeCount >= 2 && checkpoint.lastResumeAt && (Date.now() - checkpoint.lastResumeAt < 10 * 60 * 1000));

        if (canResume) {
          // Mark as failed so resumePaperRun can pick it up
          await storage.updatePaperRunStatus(run.id, 'failed', {
            errorMessage: `Server restart — auto-resume scheduled (attempt ${checkpoint!.resumeCount + 1}/${MAX_RESUME_ATTEMPTS})`,
            completedAt: new Date(),
          });
          const delay = Math.min(RESUME_BASE_DELAY_MS * Math.pow(2, checkpoint!.resumeCount), 5 * 60 * 1000);
          logger.info(`[Euler] Scheduling auto-resume for run ${run.id.slice(0, 8)} from "${checkpoint!.lastCompletedStage}" in ${Math.round(delay / 1000)}s (attempt ${checkpoint!.resumeCount + 1}/${MAX_RESUME_ATTEMPTS})`);
          setTimeout(async () => {
            try {
              const result = await resumePaperRun(run.id);
              if (result.resumed) {
                logger.success(`[Euler] Auto-resume started for run ${run.id.slice(0, 8)}`);
              } else {
                logger.warn(`[Euler] Auto-resume skipped for run ${run.id.slice(0, 8)}: ${result.reason}`);
              }
            } catch (err) {
              logger.error(`[Euler] Auto-resume failed for run ${run.id.slice(0, 8)}: ${(err as Error).message}`);
            }
          }, delay);
        } else {
          // Cannot resume: force-fail
          const reason = !checkpoint ? 'no checkpoint data'
            : checkpoint.lastCompletedStage === 'none' ? 'no tools completed before crash'
            : checkpoint.resumeCount >= MAX_RESUME_ATTEMPTS ? `max resume attempts reached (${checkpoint.resumeCount}/${MAX_RESUME_ATTEMPTS})`
            : 'crash loop detected';
          await storage.updatePaperRunStatus(run.id, 'failed', {
            errorMessage: `Server restart — ${reason}`,
            completedAt: new Date(),
          });
          logger.warn(`[Euler] Force-failed run ${run.id.slice(0, 8)}: ${reason}`);
        }
      }
    } catch (err) {
      logger.error(`[Euler] Startup cleanup failed: ${(err as Error).message}`);
    }
    // Reset in-memory counters (auto-resumes will claim slots when they fire)
    activeGenerations = 0;
    activeRunIds.clear();
  })();

  // Periodic stale-run cleanup every 3 minutes (independent of generation cadence)
  setInterval(() => cleanupStaleRuns(), 3 * 60 * 1000);

  logger.info(`[Euler] Scheduler initialized (enabled=${schedulerConfig.enabled}, maxConcurrent=${schedulerConfig.maxConcurrent}). Use admin to enable/configure.`);

  if (schedulerConfig.enabled) {
    startSchedulerInterval();
  }
}

export function stopAutoPaperScheduler() {
  stopSchedulerInterval();
  schedulerConfig.enabled = false;
}

// Legacy compat
export function getAutoPaperStatus() {
  return getSchedulerConfig();
}
