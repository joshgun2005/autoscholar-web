/**
 * Governor Agent — Decision Log
 *
 * In-memory accumulator for governor decisions during a pipeline run.
 * Serializable for DB persistence and SSE broadcasting.
 */

import crypto from 'crypto';
import type { GovernorDecision, GovernorAction, PipelineStage } from './types';

export class DecisionLog {
  private decisions: GovernorDecision[] = [];

  /** Create and record a new decision */
  record(params: {
    stage: PipelineStage;
    trigger: string;
    action: GovernorAction;
    reasoning: string;
    profileBefore: string;
    profileAfter: string;
    confidenceBefore: number;
    confidenceAfter: number;
  }): GovernorDecision {
    const decision: GovernorDecision = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      ...params,
    };
    this.decisions.push(decision);
    return decision;
  }

  /** Get all recorded decisions */
  getAll(): GovernorDecision[] {
    return this.decisions;
  }

  /** Get the most recent decision */
  getLast(): GovernorDecision | null {
    return this.decisions.length > 0 ? this.decisions[this.decisions.length - 1] : null;
  }

  /** Total number of decisions */
  count(): number {
    return this.decisions.length;
  }

  /** Count decisions where the governor actually intervened (not just 'continue') */
  interventionCount(): number {
    return this.decisions.filter(d => d.action.type !== 'continue').length;
  }

  /** Serialize for DB storage */
  serialize(): string {
    return JSON.stringify(this.decisions);
  }

  /** Restore from DB */
  static deserialize(json: string): DecisionLog {
    const log = new DecisionLog();
    try {
      log.decisions = JSON.parse(json);
    } catch { /* start fresh */ }
    return log;
  }
}
