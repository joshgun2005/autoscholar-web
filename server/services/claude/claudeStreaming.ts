/**
 * Claude API streaming — orchestrator module.
 *
 * System prompt extracted to ./systemPrompt.ts (~1770 lines)
 * Config constants in ./streamingConfig.ts
 * Types in ./streamingTypes.ts
 */

import axios from 'axios';
import { AVAILABLE_TOOLS } from './toolDefinitions';
import {
  estimateMessagesTokens,
  truncateToolResults,
  summarizeHistory,
} from './tokenManagement';
import {
  ANTHROPIC_API_URL,
  ANTHROPIC_API_KEY,
  ANTHROPIC_VERSION,
  MODEL,
  TOKEN_LIMIT,
} from './streamingConfig';
import type { ClaudeStreamEvent } from './streamingTypes';
import { buildSystemPrompt } from './systemPrompt';

// ── Main streaming call ─────────────────────────────────────────

export async function callClaudeStreaming(
  query: string,
  onChunk: (text: string) => void,
  messages: any[],
  authorProfile?: { name: string; university: string; department: string; email: string },
  userApiKey?: string,
): Promise<{ answer: string; toolCalls: any[]; usage: { inputTokens: number; outputTokens: number; cost: number } }> {

  try {
    // Truncate large tool results first
    let processedMessages = truncateToolResults(messages, 15000);

    // Check if messages exceed token limit
    const estimatedTokens = estimateMessagesTokens(processedMessages);

    if (estimatedTokens > TOKEN_LIMIT) {
      console.log(`Messages exceed token limit (${estimatedTokens} tokens). Summarizing old history...`);

      const recentMessages = processedMessages.slice(-5);
      const oldMessages = processedMessages.slice(0, -5);

      if (oldMessages.length > 0) {
        const summary = await summarizeHistory(oldMessages);
        processedMessages = [
          { role: 'user', content: `[Previous conversation summary]: ${summary}` },
          ...recentMessages
        ];
        console.log(`History summarized. New token count: ${estimateMessagesTokens(processedMessages)}`);
      }
    }

    // Get current date and time
    const now = new Date();
    const currentDateTime = now.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'America/New_York',
      timeZoneName: 'short'
    });
    const isoDate = now.toISOString().split('T')[0];

    const systemPrompt = buildSystemPrompt({ currentDateTime, isoDate, authorProfile });

    const response = await axios.post(
      ANTHROPIC_API_URL,
      {
        model: MODEL,
        max_tokens: 128000,
        temperature: 1,
        stream: true,
        system: systemPrompt,
        messages: processedMessages,
        tools: AVAILABLE_TOOLS,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': userApiKey || ANTHROPIC_API_KEY!,
          'anthropic-version': ANTHROPIC_VERSION,
        },
        responseType: 'stream',
        timeout: 900000,
      }
    );

    let fullAnswer = '';
    let toolCalls: any[] = [];
    let buffer = '';
    let inputTokens = 0;
    let outputTokens = 0;

    const calculateCost = (input: number, output: number): number => {
      return (input * 3 / 1_000_000) + (output * 15 / 1_000_000);
    };

    return new Promise((resolve, reject) => {
      response.data.on('data', (chunk: Buffer) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.substring(6).trim();
            if (data === '[DONE]' || !data) continue;

            try {
              const event: ClaudeStreamEvent = JSON.parse(data);

              if (event.type === 'message_start' || event.type === 'message_delta' || event.type === 'message_stop') {
                console.log(`[TOKEN DEBUG] Event type: ${event.type}`, JSON.stringify(event, null, 2).substring(0, 500));
              }

              if (event.type === 'message_start') {
                if (event.message?.usage) {
                  inputTokens = event.message.usage.input_tokens || 0;
                  outputTokens = event.message.usage.output_tokens || 0;
                  console.log(`[TOKEN DEBUG] message_start: in=${inputTokens}, out=${outputTokens}`);
                }
              }

              if (event.type === 'message_delta') {
                if (event.usage?.output_tokens) {
                  const oldOutputTokens = outputTokens;
                  outputTokens = event.usage.output_tokens;
                  console.log(`[TOKEN DEBUG] message_delta: output ${oldOutputTokens} → ${outputTokens}`);
                } else if ((event as any).delta?.usage?.output_tokens) {
                  outputTokens = (event as any).delta.usage.output_tokens;
                }
              }

              if (event.type === 'message_stop') {
                if (event.usage?.output_tokens && event.usage.output_tokens > outputTokens) {
                  outputTokens = event.usage.output_tokens;
                }
                console.log(`[TOKEN] Final: in=${inputTokens}, out=${outputTokens}, text=${fullAnswer.length} chars`);
              }

              if (event.type === 'content_block_start') {
                if (event.content_block?.type === 'tool_use') {
                  toolCalls.push({
                    id: event.content_block.id,
                    name: event.content_block.name,
                    input: {},
                  });
                }
              }

              if (event.type === 'content_block_delta') {
                if (event.delta?.type === 'text_delta') {
                  const text = event.delta.text;
                  fullAnswer += text;
                  onChunk(text);
                }
                if (event.delta?.type === 'input_json_delta') {
                  const lastTool = toolCalls[toolCalls.length - 1];
                  if (lastTool) {
                    lastTool.partial_json = (lastTool.partial_json || '') + event.delta.partial_json;
                  }
                }
              }

              if (event.type === 'content_block_stop') {
                const lastTool = toolCalls[toolCalls.length - 1];
                if (lastTool && lastTool.partial_json) {
                  lastTool.input = JSON.parse(lastTool.partial_json);
                  delete lastTool.partial_json;
                }
              }

              if (event.type === 'message_stop') {
                const cost = calculateCost(inputTokens, outputTokens);
                resolve({ answer: fullAnswer, toolCalls, usage: { inputTokens, outputTokens, cost } });
              }
            } catch (e) {
              console.error('Error parsing SSE event:', e);
            }
          }
        }
      });

      response.data.on('end', () => {
        const cost = calculateCost(inputTokens, outputTokens);
        resolve({ answer: fullAnswer, toolCalls, usage: { inputTokens, outputTokens, cost } });
      });

      response.data.on('error', (error: Error) => {
        console.error('Stream error:', error);
        reject(error);
      });
    });
  } catch (error: any) {
    console.error('Claude API error:', error);
    throw new Error('Failed to call Claude API: ' + (error as Error).message);
  }
}

// ── Retry wrapper ───────────────────────────────────────────────

const MAX_STREAM_RETRIES = 5;
const RETRY_BASE_DELAY_MS = 2000;

export async function callClaudeStreamingWithRetry(
  query: string,
  onChunk: (text: string) => void,
  messages: any[],
  onRetry?: () => void,
  authorProfile?: { name: string; university: string; department: string; email: string },
  userApiKey?: string,
): Promise<{ answer: string; toolCalls: any[]; usage: { inputTokens: number; outputTokens: number; cost: number } }> {
  let lastError: Error | null = null;
  let effectiveApiKey = userApiKey;

  for (let attempt = 1; attempt <= MAX_STREAM_RETRIES; attempt++) {
    try {
      return await callClaudeStreaming(query, onChunk, messages, authorProfile, effectiveApiKey);
    } catch (error: any) {
      lastError = error;
      const msg = error?.message || '';
      const statusCode = error?.response?.status;

      // If a user-provided key got a 401/403, fall back to the env key and retry immediately
      if (effectiveApiKey && (statusCode === 401 || statusCode === 403)) {
        console.warn(`⚠ User API key rejected (${statusCode}). Falling back to environment key.`);
        effectiveApiKey = undefined; // next attempt uses ANTHROPIC_API_KEY from env
        if (onRetry) onRetry();
        continue;
      }

      const isTransient = msg.includes('aborted')
        || msg.includes('ECONNRESET')
        || msg.includes('socket hang up')
        || msg.includes('network')
        || msg.includes('ETIMEDOUT')
        || msg.includes('ECONNREFUSED')
        || msg.includes('timeout')
        || error?.code === 'ECONNRESET'
        || error?.code === 'ETIMEDOUT'
        || error?.code === 'ECONNREFUSED'
        || error?.code === 'ENOTFOUND'
        || statusCode === 429
        || statusCode === 529
        || statusCode === 500
        || statusCode === 502
        || statusCode === 503;

      if (isTransient && attempt < MAX_STREAM_RETRIES) {
        const baseDelay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1);
        const jitter = Math.random() * baseDelay * 0.3;
        const delay = Math.min(baseDelay + jitter, 30000);
        console.warn(`⚠ Stream attempt ${attempt}/${MAX_STREAM_RETRIES} failed (${msg}${statusCode ? ` [${statusCode}]` : ''}). Retrying in ${Math.round(delay)}ms...`);
        if (onRetry) onRetry();
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      throw error;
    }
  }

  throw lastError || new Error('Claude streaming failed after retries');
}
