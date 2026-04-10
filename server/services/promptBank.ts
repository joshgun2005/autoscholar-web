/**
 * Prompt Bank — re-exports from modularized ./prompt-bank/ directory.
 *
 * This file exists for backward compatibility with existing imports.
 * The actual implementation is in:
 *   - ./prompt-bank/domains.ts — DOMAINS, METHODS, DOMAIN_METHOD_COMPAT
 *   - ./prompt-bank/topics.ts  — DOMAIN_TOPICS
 *   - ./prompt-bank/index.ts   — buildPromptBank, PROMPT_BANK, getPromptAt
 */

export {
  DOMAINS,
  METHODS,
  DOMAIN_METHOD_COMPAT,
  PROMPT_BANK,
  getPromptAt,
  type PromptEntry,
} from './prompt-bank';
