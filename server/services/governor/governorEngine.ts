/**
 * Governor Agent — Core Decision Engine
 *
 * Pure rule-based engine. No LLM calls, no DB access.
 * Takes tool results + current state → produces decisions + optional message injection.
 *
 * 7 Decision Rules:
 *   1. Stage detection — map tool names to PipelineStage
 *   2. Python error — detect + switch to debug_recovery
 *   3. Data issue — detect empty/bad data + switch to conservative
 *   4. LaTeX failure — detect + switch to latex_fallback
 *   5. Figure/section tracking — count figures, word counts
 *   6. Confidence calculation — degrade/recover
 *   7. Popper evaluation — publication verdict
 */

import crypto from 'crypto';
import { DecisionLog } from './decisionLog';
import { getProfile, getProfileDirective } from './promptProfiles';
import type {
  AppState,
  GovernorDecision,
  GovernorAction,
  GovernorEvaluation,
  ToolResultBatch,
  ToolResultEntry,
  PipelineStage,
  PopperReviewInput,
} from './types';

// ── Known error patterns for smarter recovery directives ──

const PYTHON_ERROR_PATTERNS: Array<{ pattern: RegExp; advice: string }> = [
  { pattern: /ModuleNotFoundError.*['"](\w+)['"]/i, advice: 'The module "$1" is not available. Use only standard libraries: numpy, pandas, scipy, statsmodels, matplotlib, seaborn, sklearn.' },
  { pattern: /MemoryError/i, advice: 'Memory limit hit. Reduce dataset size: sample rows, drop unused columns, use float32 instead of float64.' },
  { pattern: /KeyError.*['"](\w+)['"]/i, advice: 'Column "$1" not found. Print df.columns before accessing columns and use .get() for safe access.' },
  { pattern: /ValueError.*shapes?/i, advice: 'Shape mismatch in arrays/matrices. Print .shape before operations and align indices with .reindex().' },
  { pattern: /TimeoutError|timed out/i, advice: 'Script timed out. Reduce iterations, sample size, or use faster algorithms.' },
  { pattern: /ConvergenceWarning|did not converge/i, advice: 'Model did not converge. Try simpler specification, increase maxiter, scale features, or use different optimizer.' },
  { pattern: /SingularMatrix|singular matrix/i, advice: 'Singular matrix — likely multicollinearity. Check VIF, drop correlated variables, or use ridge/regularization.' },
  { pattern: /InfeasibleError|infeasible/i, advice: 'Optimization infeasible. Relax constraints or check input data validity.' },
];

const DATA_ISSUE_KEYWORDS = [
  'empty dataframe', '0 rows', 'no data', 'no observations',
  'missing values exceed', 'all nan', 'contains no valid',
  'no records found', 'empty dataset', 'insufficient data',
  'zero variance', 'constant column',
];

// ── Tool → Stage mapping ──

function detectStage(toolName: string, description?: string): PipelineStage | null {
  if (toolName === 'literature_gap_finder' || toolName === 'openalex_search') return 'gauss';
  if (toolName === 'execute_custom_python_analysis' || toolName === 'run_python_script') {
    const desc = (description || '').toLowerCase();
    if (desc.includes('turing')) return 'turing';
    if (desc.includes('newton')) return 'newton';
    if (desc.includes('fisher')) return 'fisher';
    return 'fisher'; // default for unnamed python analysis
  }
  if (toolName === 'write_paper_section') return 'euler_write';
  if (toolName === 'compile_research_paper' || toolName === 'recompile_latex') return 'euler_compile';
  return null;
}

const STAGE_ORDER: Record<PipelineStage, number> = {
  gauss: 0,
  turing: 1,
  newton: 2,
  fisher: 3,
  euler_write: 4,
  euler_compile: 5,
  popper: 6,
  complete: 7,
};

function isForwardStage(current: PipelineStage, next: PipelineStage): boolean {
  return STAGE_ORDER[next] > STAGE_ORDER[current];
}

// ── Engine ──

export class GovernorEngine {
  private state: AppState;
  private log: DecisionLog;

  constructor(state: AppState) {
    this.state = { ...state };
    this.log = new DecisionLog();
  }

  /** Main entry: evaluate a batch of tool results, return decision + optional injection */
  evaluate(batch: ToolResultBatch): GovernorEvaluation {
    const actions: GovernorAction[] = [];
    const directives: string[] = [];

    // Rule 1: Stage detection
    for (const tool of batch.toolCalls) {
      const stage = detectStage(tool.name, tool.input?.description);
      if (stage && isForwardStage(this.state.currentStage, stage)) {
        this.state.currentStage = stage;
      }
    }

    // Rule 1b: Academic figure style injection — auto-activate during fisher
    if (this.state.currentStage === 'fisher' && this.state.activeProfile === 'default') {
      this.state.activeProfile = 'academic_figures';
      directives.push(getProfileDirective('academic_figures'));
      actions.push({ type: 'switch_profile', profile: 'academic_figures' });
    }

    // Rule 1c: JF writing style injection — auto-activate during euler_write
    if (this.state.currentStage === 'euler_write' && this.state.activeProfile !== 'jf_rewrite') {
      this.state.activeProfile = 'jf_rewrite';
      directives.push(getProfileDirective('jf_rewrite'));
      actions.push({ type: 'switch_profile', profile: 'jf_rewrite' });
    }

    // Rule 2: Python error detection
    const pythonErrors = batch.toolCalls.filter(
      t => t.isError && (t.name === 'execute_custom_python_analysis' || t.name === 'run_python_script')
    );
    if (pythonErrors.length > 0) {
      this.state.pythonErrors += pythonErrors.length;
      this.state.consecutiveErrors += pythonErrors.length;
      const errorText = pythonErrors.map(e => e.result).join('\n');
      const result = this.handlePythonError(errorText);
      if (result.action) actions.push(result.action);
      if (result.directive) directives.push(result.directive);
    }

    // Rule 3: Data issue detection (scan successful python results)
    const pythonSuccesses = batch.toolCalls.filter(
      t => !t.isError && (t.name === 'execute_custom_python_analysis' || t.name === 'run_python_script')
    );
    for (const tool of pythonSuccesses) {
      const lower = tool.result.toLowerCase();
      const dataIssue = DATA_ISSUE_KEYWORDS.find(kw => lower.includes(kw));
      if (dataIssue) {
        const result = this.handleDataIssue(dataIssue, tool.result);
        if (result.action) actions.push(result.action);
        if (result.directive) directives.push(result.directive);
      }
    }

    // Rule 4: LaTeX failure detection
    const latexErrors = batch.toolCalls.filter(
      t => t.isError && (t.name === 'compile_research_paper' || t.name === 'recompile_latex')
    );
    if (latexErrors.length > 0) {
      this.state.latexErrors += latexErrors.length;
      const result = this.handleLatexError();
      if (result.action) actions.push(result.action);
      if (result.directive) directives.push(result.directive);
    }

    // Rule 5: Figure/section tracking
    for (const tool of pythonSuccesses) {
      this.trackFigures(tool.result);
    }
    for (const tool of batch.toolCalls.filter(t => t.name === 'write_paper_section' && !t.isError)) {
      this.trackSection(tool.input, tool.result);
    }

    // Rule 6: Confidence calculation
    if (pythonErrors.length === 0 && latexErrors.length === 0) {
      // Successful batch — recover confidence
      this.state.consecutiveErrors = 0;
      this.adjustConfidence(0.02 * batch.toolCalls.filter(t => !t.isError).length);
    }

    // Determine primary action (most severe wins)
    const primaryAction = this.selectPrimaryAction(actions);

    // Build decision
    const confidenceBefore = this.state.confidence;
    const profileBefore = this.state.activeProfile;

    // Apply profile switch if action requires it
    if (primaryAction.type === 'switch_profile') {
      this.state.activeProfile = primaryAction.profile;
    }

    this.state.totalDecisions++;
    if (primaryAction.type !== 'continue') {
      this.state.totalInterventions++;
    }

    // Build combined directive
    let messageInjection: string | null = null;
    if (directives.length > 0) {
      // Always include the active profile's standing directive
      const profileDirective = getProfileDirective(this.state.activeProfile);
      const parts = profileDirective ? [profileDirective, '', ...directives] : directives;
      messageInjection = parts.join('\n');
    }

    this.state.updatedAt = Date.now();

    const decision = this.log.record({
      stage: this.state.currentStage,
      trigger: this.describeTrigger(batch),
      action: primaryAction,
      reasoning: this.describeReasoning(primaryAction, batch),
      profileBefore,
      profileAfter: this.state.activeProfile,
      confidenceBefore,
      confidenceAfter: this.state.confidence,
    });

    this.state.lastDecision = decision;

    return {
      decision,
      messageInjection,
      forceFinalize: primaryAction.type === 'force_finalize',
    };
  }

  /** Evaluate Popper peer review (called outside the Claude loop) */
  evaluatePopper(review: PopperReviewInput): GovernorDecision {
    this.state.currentStage = 'popper';
    const confidenceBefore = this.state.confidence;
    const profileBefore = this.state.activeProfile;

    let action: GovernorAction;
    let reasoning: string;

    if (review.overallScore >= 80) {
      this.state.publicationVerdict = 'allow';
      action = { type: 'continue' };
      reasoning = `Popper score ${review.overallScore}/100 — excellent quality, no intervention needed.`;
    } else if (review.overallScore >= 65) {
      this.state.publicationVerdict = 'allow_with_warnings';
      const weaknessWarnings = review.weaknesses.slice(0, 3).map(w => `Popper: ${w}`);
      this.state.warnings.push(...weaknessWarnings);
      action = { type: 'add_warning', warning: `Published with ${review.weaknesses.length} warnings (score: ${review.overallScore})` };
      reasoning = `Popper score ${review.overallScore}/100 — acceptable with warnings. ${review.weaknesses.length} weaknesses noted.`;
      this.adjustConfidence(-0.05);
    } else if (review.overallScore >= 45) {
      this.state.publicationVerdict = 'block';
      this.state.activeProfile = 'revision_mode';
      action = { type: 'force_revision', severity: 'major', issues: review.weaknesses };
      reasoning = `Popper score ${review.overallScore}/100 — major revision required. Blocking publication.`;
      this.adjustConfidence(-0.15);
    } else {
      this.state.publicationVerdict = 'block';
      action = { type: 'block_publication', reason: `Popper score ${review.overallScore}/100 — below minimum quality threshold.` };
      reasoning = `Popper score ${review.overallScore}/100 — hard reject. Fundamental quality issues.`;
      this.adjustConfidence(-0.25);
    }

    this.state.totalDecisions++;
    if (action.type !== 'continue') this.state.totalInterventions++;
    this.state.updatedAt = Date.now();

    const decision = this.log.record({
      stage: 'popper',
      trigger: `popper_review_score_${review.overallScore}`,
      action,
      reasoning,
      profileBefore,
      profileAfter: this.state.activeProfile,
      confidenceBefore,
      confidenceAfter: this.state.confidence,
    });

    this.state.lastDecision = decision;
    return decision;
  }

  /** Get a read-only snapshot of the current state */
  getState(): Readonly<AppState> {
    return { ...this.state };
  }

  /** Get the decision log */
  getDecisionLog(): DecisionLog {
    return this.log;
  }

  // ── Private Rule Handlers ──

  private handlePythonError(errorText: string): { action: GovernorAction | null; directive: string | null } {
    const budget = this.state.retryBudget.python;

    // Find specific error pattern for targeted advice
    let specificAdvice = '';
    for (const { pattern, advice } of PYTHON_ERROR_PATTERNS) {
      const match = errorText.match(pattern);
      if (match) {
        specificAdvice = advice.replace(/\$1/g, match[1] || '');
        break;
      }
    }

    if (budget.used < budget.max) {
      budget.used++;
      this.adjustConfidence(-0.05);

      const directive = [
        `GOVERNOR DIRECTIVE — PYTHON ERROR RECOVERY (retry ${budget.used}/${budget.max}):`,
        specificAdvice || 'The previous Python script failed. Simplify the approach.',
        'Write a NEW, simpler script rather than patching the failed one.',
        budget.used >= 2 ? 'Use only basic operations: pandas, numpy, statsmodels OLS. No complex packages.' : '',
      ].filter(Boolean).join('\n');

      if (this.state.activeProfile === 'default') {
        return {
          action: { type: 'switch_profile', profile: 'debug_recovery', directive },
          directive,
        };
      }
      return { action: { type: 'inject_directive', directive }, directive };
    }

    // Budget exhausted
    this.adjustConfidence(-0.15);
    this.state.warnings.push(`Python retry budget exhausted (${budget.max} attempts). Analysis may be incomplete.`);
    return {
      action: { type: 'add_warning', warning: 'Python retry budget exhausted' },
      directive: null,
    };
  }

  private handleDataIssue(keyword: string, resultText: string): { action: GovernorAction | null; directive: string | null } {
    // Avoid duplicate data issues
    if (this.state.dataIssues.includes(keyword)) {
      return { action: null, directive: null };
    }

    this.state.dataIssues.push(keyword);
    const budget = this.state.retryBudget.data;

    if (budget.used < budget.max) {
      budget.used++;
      this.adjustConfidence(-0.10);

      const directive = [
        `GOVERNOR DIRECTIVE — DATA QUALITY ISSUE DETECTED:`,
        `Issue: "${keyword}" detected in the output.`,
        'Try alternative data sources or a wider date range.',
        'If the dataset is genuinely small, acknowledge this limitation and adjust the methodology accordingly.',
        'Print the dataset shape and first few rows to verify data integrity before analysis.',
      ].join('\n');

      if (this.state.activeProfile === 'default') {
        return {
          action: { type: 'switch_profile', profile: 'conservative', directive },
          directive,
        };
      }
      return { action: { type: 'inject_directive', directive }, directive };
    }

    this.state.warnings.push(`Data issue "${keyword}" persists after ${budget.max} retries.`);
    return {
      action: { type: 'add_warning', warning: `Persistent data issue: ${keyword}` },
      directive: null,
    };
  }

  private handleLatexError(): { action: GovernorAction | null; directive: string | null } {
    const budget = this.state.retryBudget.latex;

    if (budget.used < budget.max) {
      budget.used++;
      this.adjustConfidence(-0.05);

      const directive = [
        `GOVERNOR DIRECTIVE — LATEX COMPILATION FAILURE (retry ${budget.used}/${budget.max}):`,
        'Simplify LaTeX constructs. Avoid complex table layouts, tikz, and obscure packages.',
        budget.used >= 2 ? 'Use ONLY basic tabular, equation, figure environments. No multirow/multicolumn.' : '',
      ].filter(Boolean).join('\n');

      if (this.state.activeProfile !== 'latex_fallback') {
        return {
          action: { type: 'switch_profile', profile: 'latex_fallback', directive },
          directive,
        };
      }
      return { action: { type: 'inject_directive', directive }, directive };
    }

    this.state.warnings.push(`LaTeX retry budget exhausted (${budget.max} attempts).`);
    return {
      action: { type: 'add_warning', warning: 'LaTeX retry budget exhausted' },
      directive: null,
    };
  }

  private trackFigures(resultText: string): void {
    // Count figure references in python output
    try {
      const parsed = JSON.parse(resultText);
      if (parsed?.figures && Array.isArray(parsed.figures)) {
        this.state.figureCount += parsed.figures.length;
      }
    } catch {
      // Count base64 image markers as a fallback
      const matches = resultText.match(/data:image\//g);
      if (matches) this.state.figureCount += matches.length;
    }
  }

  private trackSection(input: any, resultText: string): void {
    const sectionType = input?.section_type || input?.type || 'unknown';
    const content = input?.content || input?.latex_content || resultText;
    // Rough word count from the LaTeX content
    const wordCount = content.replace(/\\[a-zA-Z]+\{[^}]*\}/g, '').split(/\s+/).length;
    this.state.sectionWordCounts[sectionType] = wordCount;
  }

  private adjustConfidence(delta: number): void {
    this.state.confidence = Math.max(0, Math.min(1, this.state.confidence + delta));
  }

  private selectPrimaryAction(actions: GovernorAction[]): GovernorAction {
    if (actions.length === 0) return { type: 'continue' };

    // Priority: force_finalize > block_publication > force_revision > switch_profile > reduce_complexity > inject_directive > add_warning > continue
    const PRIORITY: Record<string, number> = {
      force_finalize: 100,
      block_publication: 90,
      force_revision: 80,
      switch_profile: 70,
      reduce_complexity: 60,
      retry_stage: 50,
      inject_directive: 40,
      add_warning: 30,
      continue: 0,
    };

    return actions.reduce((best, action) =>
      (PRIORITY[action.type] || 0) > (PRIORITY[best.type] || 0) ? action : best
    );
  }

  private describeTrigger(batch: ToolResultBatch): string {
    const errors = batch.toolCalls.filter(t => t.isError);
    if (errors.length > 0) {
      return `${errors.length}_tool_error(s):${errors.map(e => e.name).join(',')}`;
    }
    return `tool_batch_complete:${batch.toolCalls.map(t => t.name).join(',')}`;
  }

  private describeReasoning(action: GovernorAction, batch: ToolResultBatch): string {
    const errorCount = batch.toolCalls.filter(t => t.isError).length;
    const successCount = batch.toolCalls.length - errorCount;

    switch (action.type) {
      case 'continue':
        return `${successCount} tool(s) succeeded, no intervention needed. Confidence: ${(this.state.confidence * 100).toFixed(0)}%.`;
      case 'switch_profile':
        return `Switching to "${action.profile}" profile. ${errorCount} error(s) detected. Confidence: ${(this.state.confidence * 100).toFixed(0)}%.`;
      case 'inject_directive':
        return `Injecting recovery directive. ${errorCount} error(s) detected. Confidence: ${(this.state.confidence * 100).toFixed(0)}%.`;
      case 'add_warning':
        return `Adding warning: ${action.warning}. Retry budget may be exhausted.`;
      case 'block_publication':
        return `Blocking publication: ${action.reason}`;
      case 'force_revision':
        return `Forcing ${action.severity} revision. ${action.issues.length} issues identified.`;
      case 'force_finalize':
        return `Force-finalizing: ${action.reason}`;
      default:
        return `Action: ${action.type}. ${errorCount} errors, ${successCount} successes.`;
    }
  }
}
