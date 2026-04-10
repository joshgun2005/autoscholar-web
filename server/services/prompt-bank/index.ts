/**
 * Prompt Bank — 1500 sequential research prompts for AutoPaper.
 *
 * Each prompt combines a domain, a compatible method, and a specific topic.
 * The scheduler iterates through them in order.
 *
 * Data extracted to:
 *   - ./domains.ts — DOMAINS, METHODS, DOMAIN_METHOD_COMPAT
 *   - ./topics.ts  — DOMAIN_TOPICS (14 topics × 24 domains)
 */

export { DOMAINS, METHODS, DOMAIN_METHOD_COMPAT } from './domains';
import { DOMAINS, METHODS, DOMAIN_METHOD_COMPAT } from './domains';
import { DOMAIN_TOPICS } from './topics';

// ── Prompt Entry ──────────────────────────────────────────────────────

export interface PromptEntry {
  id: number;
  domain: string;
  domainIdx: number;
  method: string;
  methodIdx: number;
  topic: string;
}

// ── Generate the bank (deterministic, runs once at import) ────────────

function buildPromptBank(): PromptEntry[] {
  // Interleave domains so consecutive prompts always switch domain.
  // Iteration order: variation → topic → domain
  const bank: PromptEntry[] = [];
  let id = 0;
  const numVariations = 4;
  const numTopics = 14;

  for (let v = 0; v < numVariations; v++) {
    for (let tIdx = 0; tIdx < numTopics; tIdx++) {
      for (let dIdx = 0; dIdx < DOMAINS.length; dIdx++) {
        const topics = DOMAIN_TOPICS[dIdx];
        if (tIdx >= topics.length) continue;
        const compatMethods = DOMAIN_METHOD_COMPAT[dIdx];
        const mIdx = compatMethods[(tIdx * numVariations + v) % compatMethods.length];
        bank.push({
          id,
          domain: DOMAINS[dIdx],
          domainIdx: dIdx,
          method: METHODS[mIdx],
          methodIdx: mIdx,
          topic: topics[tIdx],
        });
        id++;
        if (id >= 1500) break;
      }
      if (id >= 1000) break;
    }
    if (id >= 1000) break;
  }

  return bank;
}

export const PROMPT_BANK: PromptEntry[] = buildPromptBank();

// ── Utility: get next prompt given a cursor ───────────────────────────

export function getPromptAt(index: number): PromptEntry {
  return PROMPT_BANK[index % PROMPT_BANK.length];
}
