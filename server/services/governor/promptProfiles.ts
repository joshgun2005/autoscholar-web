/**
 * Governor Agent — Prompt Profiles
 *
 * Predefined strategy profiles that control how the Governor injects directives
 * into Claude's message stream. Profiles are switched dynamically based on
 * pipeline errors and quality signals.
 */

import { JF_WRITING_STYLE_DIRECTIVE } from './jfWritingStyle';
import { ACADEMIC_FIGURE_STYLE_DIRECTIVE } from './academicFigureStyle';

export interface PromptProfile {
  id: string;
  name: string;
  description: string;
  /** Directive text injected before the next Claude call when this profile is active */
  systemDirective: string;
  /** Suggested max figures (Governor mentions this in directives) */
  maxFigures: number;
  /** Suggested max robustness tests */
  maxRobustnessTests: number;
  /** Whether to prefer simpler econometric models */
  preferSimpleModels: boolean;
}

// ── Profile Definitions ──

const DEFAULT_PROFILE: PromptProfile = {
  id: 'default',
  name: 'Default',
  description: 'Full complexity, no restrictions. Standard research pipeline.',
  systemDirective: '',
  maxFigures: 18,
  maxRobustnessTests: 5,
  preferSimpleModels: false,
};

const DEBUG_RECOVERY_PROFILE: PromptProfile = {
  id: 'debug_recovery',
  name: 'Debug Recovery',
  description: 'Activated on Python errors. Simplifies analysis to recover.',
  systemDirective: [
    'GOVERNOR DIRECTIVE — RECOVERY MODE:',
    'The previous Python analysis encountered errors. To recover:',
    '1. Simplify the approach — use basic OLS/pooled regressions before advanced estimators.',
    '2. Wrap ALL operations in try/except blocks with informative error messages.',
    '3. Reduce figure count to essential plots only (max 8 figures).',
    '4. Validate data shapes and types before each computation.',
    '5. Use .dropna() defensively and log how many rows are dropped.',
    '6. If a library import fails, fall back to simpler alternatives (e.g., statsmodels instead of linearmodels).',
    '7. Limit robustness tests to 2 essential checks.',
  ].join('\n'),
  maxFigures: 8,
  maxRobustnessTests: 2,
  preferSimpleModels: true,
};

const CONSERVATIVE_PROFILE: PromptProfile = {
  id: 'conservative',
  name: 'Conservative',
  description: 'Activated on data issues. Extra validation, simpler models.',
  systemDirective: [
    'GOVERNOR DIRECTIVE — DATA QUALITY CONCERN:',
    'Data quality issues were detected in the previous step. Adjust your approach:',
    '1. Add explicit data validation before every analysis step.',
    '2. Print dataset shape, column names, and dtypes before processing.',
    '3. Check for and document missing values, zero-variance columns, and outliers.',
    '4. Use robust estimators (HAC standard errors, trimmed means) where possible.',
    '5. If the dataset is too small (<30 observations), note this limitation explicitly.',
    '6. Consider using alternative data sources if the primary source returned insufficient data.',
    '7. Document all data limitations in the methodology section.',
  ].join('\n'),
  maxFigures: 12,
  maxRobustnessTests: 3,
  preferSimpleModels: true,
};

const LATEX_FALLBACK_PROFILE: PromptProfile = {
  id: 'latex_fallback',
  name: 'LaTeX Fallback',
  description: 'Activated on LaTeX compilation failures. Simplified LaTeX constructs.',
  systemDirective: [
    'GOVERNOR DIRECTIVE — LATEX SIMPLIFICATION:',
    'LaTeX compilation has failed. When writing sections:',
    '1. Avoid complex table environments — use simple tabular with basic formatting.',
    '2. Do NOT use packages that may not be installed (tikz, pgfplots, etc.).',
    '3. Keep equations simple — avoid nested environments like align inside figure.',
    '4. Use \\includegraphics for all figures (no raw tikz drawing).',
    '5. Avoid unicode characters in LaTeX source — use LaTeX commands instead.',
    '6. Keep table column counts consistent (no multirow/multicolumn).',
    '7. Ensure all \\begin{} have matching \\end{} on the same nesting level.',
  ].join('\n'),
  maxFigures: 12,
  maxRobustnessTests: 4,
  preferSimpleModels: false,
};

const REVISION_MODE_PROFILE: PromptProfile = {
  id: 'revision_mode',
  name: 'Revision Mode',
  description: 'Activated after weak Popper review. Focus on addressing weaknesses.',
  systemDirective: [
    'GOVERNOR DIRECTIVE — REVISION REQUIRED:',
    'The peer review identified significant weaknesses. When revising:',
    '1. Focus on a SINGLE main analysis with clear identification strategy.',
    '2. Add a dedicated robustness section with at least 3 alternative specifications.',
    '3. Strengthen the methodology section with explicit assumptions and limitations.',
    '4. Ensure every claim is backed by a specific statistical test result.',
    '5. Add mechanism/channel analysis to explain WHY results hold, not just THAT they hold.',
    '6. Improve literature review coverage — address reviewer-flagged gaps.',
  ].join('\n'),
  maxFigures: 15,
  maxRobustnessTests: 4,
  preferSimpleModels: false,
};

const JF_WRITING_PROFILE: PromptProfile = {
  id: 'jf_rewrite',
  name: 'JF Writing Style',
  description: 'Activated during euler_write phase. Enforces Journal of Finance publication-quality prose, banned AI language, and JF formatting conventions.',
  systemDirective: `GOVERNOR DIRECTIVE — JF WRITING QUALITY ENFORCEMENT:\n${JF_WRITING_STYLE_DIRECTIVE}`,
  maxFigures: 18,
  maxRobustnessTests: 5,
  preferSimpleModels: false,
};

const ACADEMIC_FIGURE_PROFILE: PromptProfile = {
  id: 'academic_figures',
  name: 'Academic Figure Style',
  description: 'Activated during fisher phase. Enforces publication-quality figure standards for JF/JFE/RFS/AER journals.',
  systemDirective: `GOVERNOR DIRECTIVE — ACADEMIC FIGURE QUALITY ENFORCEMENT:\n${ACADEMIC_FIGURE_STYLE_DIRECTIVE}`,
  maxFigures: 18,
  maxRobustnessTests: 5,
  preferSimpleModels: false,
};

// ── Profile Registry ──

const PROFILES = new Map<string, PromptProfile>([
  ['default', DEFAULT_PROFILE],
  ['debug_recovery', DEBUG_RECOVERY_PROFILE],
  ['conservative', CONSERVATIVE_PROFILE],
  ['latex_fallback', LATEX_FALLBACK_PROFILE],
  ['revision_mode', REVISION_MODE_PROFILE],
  ['jf_rewrite', JF_WRITING_PROFILE],
  ['academic_figures', ACADEMIC_FIGURE_PROFILE],
]);

export function getProfile(id: string): PromptProfile {
  return PROFILES.get(id) || DEFAULT_PROFILE;
}

export function getAllProfiles(): PromptProfile[] {
  return Array.from(PROFILES.values());
}

export function getProfileDirective(id: string): string {
  const profile = PROFILES.get(id);
  return profile?.systemDirective || '';
}
