/**
 * Governor Agent — Public API
 *
 * Runtime governance layer for the AutoScholar research pipeline.
 * Observes tool results, detects problems, injects directives,
 * and controls publication policy.
 */

export { GovernorEngine } from './governorEngine';
export { createInitialState } from './types';
export { getProfile, getAllProfiles, getProfileDirective } from './promptProfiles';
export { DecisionLog } from './decisionLog';

export type {
  AppState,
  GovernorDecision,
  GovernorAction,
  GovernorEvaluation,
  ToolResultBatch,
  ToolResultEntry,
  PipelineStage,
  PublicationVerdict,
  PopperReviewInput,
} from './types';
export type { PromptProfile } from './promptProfiles';
