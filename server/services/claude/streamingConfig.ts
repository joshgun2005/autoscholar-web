/**
 * Configuration constants for Claude API streaming calls.
 */

export const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
export const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
export const ANTHROPIC_VERSION = '2023-06-01';
export const MODEL = 'claude-opus-4-6';
export const TOKEN_LIMIT = 500000; // 500K safe threshold for 1M context window
