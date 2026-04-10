/**
 * Admin Prompt Bank — re-exports from modularized ./prompt-bank/ directory.
 *
 * The actual prompts are split into ~30 category files in ./prompt-bank/
 * for AI-editability. This file exists for backward compatibility.
 */
export {
  ADMIN_PROMPT_BANK,
  TOTAL_PROMPT_COUNT,
  getAllPromptsFlat,
  searchPrompts,
  getRandomPrompt,
  type PromptBankCategory,
} from "./prompt-bank";
