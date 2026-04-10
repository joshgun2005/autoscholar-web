/**
 * Governor Agent — Type definitions
 *
 * Central types for the runtime governance layer that observes tool results,
 * detects problems, and steers the pipeline via directive injection.
 */

// ── Pipeline Stages ──

export type PipelineStage =
  | 'gauss'          // Literature gap analysis
  | 'turing'         // Data collection
  | 'newton'         // Dataset preparation
  | 'fisher'         // Econometric analysis
  | 'euler_write'    // Section writing
  | 'euler_compile'  // LaTeX compilation
  | 'popper'         // Peer review
  | 'complete';

export type PublicationVerdict =
  | 'pending'
  | 'allow'
  | 'allow_with_warnings'
  | 'block'
  | 'experimental';

// ── Application State (per-run, stored as JSON in paper_runs.governor_state) ──

export interface RetryBudget {
  used: number;
  max: number;
}

export interface AppState {
  runId: string;

  // Pipeline position
  currentStage: PipelineStage;
  activeProfile: string;

  // Error tracking
  pythonErrors: number;
  latexErrors: number;
  dataIssues: string[];
  consecutiveErrors: number;

  // Retry budgets
  retryBudget: {
    python: RetryBudget;
    latex: RetryBudget;
    data: RetryBudget;
  };

  // Quality signals
  confidence: number;                       // 0.0–1.0, starts at 1.0
  warnings: string[];
  figureCount: number;
  sectionWordCounts: Record<string, number>;

  // Governor activity
  totalDecisions: number;
  totalInterventions: number;               // times governor injected a directive
  lastDecision: GovernorDecision | null;

  // Publication policy
  publicationVerdict: PublicationVerdict;

  // Timestamps
  createdAt: number;
  updatedAt: number;
}

// ── Governor Actions ──

export type GovernorAction =
  | { type: 'continue' }
  | { type: 'inject_directive'; directive: string }
  | { type: 'switch_profile'; profile: string; directive?: string }
  | { type: 'retry_stage'; stage: PipelineStage; directive: string }
  | { type: 'add_warning'; warning: string }
  | { type: 'block_publication'; reason: string }
  | { type: 'force_revision'; severity: 'minor' | 'major'; issues: string[] }
  | { type: 'reduce_complexity'; directive: string }
  | { type: 'force_finalize'; reason: string };

// ── Governor Decision ──

export interface GovernorDecision {
  id: string;
  timestamp: number;
  stage: PipelineStage;
  trigger: string;                          // what caused this decision
  action: GovernorAction;
  reasoning: string;
  profileBefore: string;
  profileAfter: string;
  confidenceBefore: number;
  confidenceAfter: number;
}

// ── Tool Result Batch (input to the engine) ──

export interface ToolResultEntry {
  name: string;
  input: any;
  result: string;
  isError: boolean;
}

export interface ToolResultBatch {
  toolCalls: ToolResultEntry[];
  recursionDepth: number;
  elapsedMs: number;
}

// ── Governor Evaluation (output from the engine) ──

export interface GovernorEvaluation {
  decision: GovernorDecision;
  /** If non-null, injected as a text block alongside tool results before the next Claude call */
  messageInjection: string | null;
  /** If true, the governor wants to force-finalize the pipeline */
  forceFinalize: boolean;
}

// ── Peer Review Input (for Popper evaluation) ──

export interface PopperReviewInput {
  overallScore: number;
  recommendation: string;
  weaknesses: string[];
  strengths: string[];
}

// ── Factory helper ──

export function createInitialState(runId: string): AppState {
  const now = Date.now();
  return {
    runId,
    currentStage: 'gauss',
    activeProfile: 'default',
    pythonErrors: 0,
    latexErrors: 0,
    dataIssues: [],
    consecutiveErrors: 0,
    retryBudget: {
      python: { used: 0, max: 3 },
      latex: { used: 0, max: 3 },
      data: { used: 0, max: 2 },
    },
    confidence: 1.0,
    warnings: [],
    figureCount: 0,
    sectionWordCounts: {},
    totalDecisions: 0,
    totalInterventions: 0,
    lastDecision: null,
    publicationVerdict: 'pending',
    createdAt: now,
    updatedAt: now,
  };
}
