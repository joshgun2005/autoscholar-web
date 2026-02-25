/**
 * Shared types for API requests/responses.
 * These are decoupled from the ORM schema and used across client + server.
 */

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  favicon?: string;
  rank: number;
}

export interface ClaudeMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ClaudeToolCall {
  name: string;
  input: Record<string, unknown>;
}

export interface ClaudeToolResult {
  tool_use_id: string;
  content: string;
}

export interface ChatRequest {
  query: string;
  sessionId?: string;
}

export interface ChatResponse {
  answer: string;
  sources: SearchResult[];
  sessionId: string;
}

export interface ConversationMessage {
  question: string;
  answer: string;
}
