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

// Calculate cost based on token usage
export function calculateCost(inputTokens: number, outputTokens: number): number {
  const inputCostPer1M = 3.00;
  const outputCostPer1M = 15.00;
  const inputCost = (inputTokens / 1_000_000) * inputCostPer1M;
  const outputCost = (outputTokens / 1_000_000) * outputCostPer1M;
  return inputCost + outputCost;
}
