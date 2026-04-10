/**
 * Types for Claude API streaming responses.
 */

export interface ClaudeStreamEvent {
  type: string;
  message?: any;
  delta?: any;
  content_block?: any;
  index?: number;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
  };
}

export interface ClaudeStreamingResult {
  answer: string;
  toolCalls: any[];
  usage: {
    inputTokens: number;
    outputTokens: number;
    cost: number;
  };
}
