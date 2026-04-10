import { encode } from 'gpt-tokenizer';
import axios from 'axios';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_VERSION = '2023-06-01';
const MODEL = 'claude-opus-4-6';

// Estimate token count (rough approximation: 1 token ≈ 4 characters)
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// Estimate tokens in messages array
export function estimateMessagesTokens(messages: any[]): number {
  let total = 0;
  for (const msg of messages) {
    if (typeof msg.content === 'string') {
      total += estimateTokens(msg.content);
    } else if (Array.isArray(msg.content)) {
      for (const block of msg.content) {
        if (block.type === 'text' && block.text) {
          total += estimateTokens(block.text);
        } else if (block.type === 'tool_result' && block.content) {
          if (typeof block.content === 'string') {
            total += estimateTokens(block.content);
          } else if (Array.isArray(block.content)) {
            for (const item of block.content) {
              if (item.type === 'text' && item.text) {
                total += estimateTokens(item.text);
              }
            }
          }
        }
      }
    }
  }
  return total;
}

// Extract text content from messages, removing large tool results
export function extractTextContent(messages: any[]): string {
  let textContent = '';

  for (const msg of messages) {
    if (msg.role === 'user') {
      if (typeof msg.content === 'string') {
        textContent += `User: ${msg.content}\n\n`;
      }
    } else if (msg.role === 'assistant') {
      if (typeof msg.content === 'string') {
        textContent += `Assistant: ${msg.content}\n\n`;
      } else if (Array.isArray(msg.content)) {
        // Extract only text blocks, skip tool_use blocks
        for (const block of msg.content) {
          if (block.type === 'text' && block.text) {
            textContent += `Assistant: ${block.text}\n\n`;
          }
        }
      }
    }
  }

  // Truncate if still too long (keep last 10000 chars)
  if (textContent.length > 10000) {
    textContent = '...[earlier conversation truncated]...\n\n' + textContent.slice(-10000);
  }

  return textContent;
}

// Summarize old conversation history
export async function summarizeHistory(messages: any[]): Promise<string> {
  try {
    const textContent = extractTextContent(messages);

    const response = await axios.post(
      ANTHROPIC_API_URL,
      {
        model: MODEL,
        max_tokens: 2000,
        temperature: 0.5,
        stream: false,
        system: 'You are a helpful assistant that summarizes conversation history. Create a concise but comprehensive summary of the key points, decisions, and context from the conversation history provided. Focus on financial queries, analysis topics, and important context.',
        messages: [
          {
            role: 'user',
            content: `Please summarize the following conversation history, focusing on key financial queries and analysis topics:\n\n${textContent}`
          }
        ],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY!,
          'anthropic-version': ANTHROPIC_VERSION,
        },
      }
    );

    return response.data.content[0].text;
  } catch (error) {
    console.error('Error summarizing history:', error);
    const textContent = extractTextContent(messages);
    return `Previous conversation summary (${messages.length} messages):\n${textContent.slice(0, 500)}...`;
  }
}

// Truncate tool results to avoid oversized messages
export function truncateToolResults(messages: any[], maxLength: number = 5000): any[] {
  return messages.map(msg => {
    if (!Array.isArray(msg.content)) return msg;

    const truncatedContent = msg.content.map((block: any) => {
      if (block.type === 'tool_result' && block.content) {
        if (typeof block.content === 'string' && block.content.length > maxLength) {
          return {
            ...block,
            content: block.content.slice(0, maxLength) + '\n... [truncated for length]'
          };
        }
        if (Array.isArray(block.content)) {
          const textItems = block.content.filter((item: any) => item.type === 'text');
          if (textItems.length > 0) {
            let totalLength = 0;
            const truncatedItems = [];
            for (const item of textItems) {
              if (totalLength + item.text.length > maxLength) {
                truncatedItems.push({
                  type: 'text',
                  text: item.text.slice(0, maxLength - totalLength) + '\n... [truncated]'
                });
                break;
              }
              truncatedItems.push(item);
              totalLength += item.text.length;
            }
            return { ...block, content: truncatedItems };
          }
        }
      }
      return block;
    });

    return { ...msg, content: truncatedContent };
  });
}

// ── Claude API pricing (per 1M tokens) — updated March 2026 ──
// See https://docs.anthropic.com/en/docs/about-claude/models
const MODEL_PRICING: Record<string, { input: number; output: number }> = {
  'claude-opus-4-6':           { input: 5.00,  output: 25.00 },
  'claude-sonnet-4-6':         { input: 3.00,  output: 15.00 },
  'claude-haiku-4-5-20251001': { input: 1.00,  output: 5.00  },
  'claude-haiku-4-5':          { input: 1.00,  output: 5.00  },
  // Legacy
  'claude-opus-4-20250514':    { input: 15.00, output: 75.00 },
  'claude-sonnet-4-20250514':  { input: 3.00,  output: 15.00 },
  'claude-3-haiku-20240307':   { input: 0.25,  output: 1.25  },
};

// Default pricing = Opus 4.6 (primary model in AutoScholar pipeline)
const DEFAULT_PRICING = MODEL_PRICING['claude-opus-4-6'];

/** Calculate cost in USD based on token usage and model. */
export function calculateCost(inputTokens: number, outputTokens: number, model?: string): number {
  const pricing = (model && MODEL_PRICING[model]) || DEFAULT_PRICING;
  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;
  return inputCost + outputCost;
}

export { MODEL_PRICING };
