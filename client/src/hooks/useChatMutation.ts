import { useMutation } from '@tanstack/react-query';
import type { SearchResult } from '@shared/types';

interface ConversationMessage {
  question: string;
  answer: string;
}

interface ChatRequest {
  query: string;
  history?: ConversationMessage[];
  sessionId?: string;
  imageData?: string;
  imageMimeType?: string;
}

interface ChatResponse {
  answer: string;
  sources: SearchResult[];
  sessionId: string;
  error?: string;
}

async function streamChat(request: ChatRequest, onChunk: (data: any) => void): Promise<ChatResponse> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error('Failed to connect to chat API');
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) {
    throw new Error('No response body');
  }

  let answer = '';
  let sources: SearchResult[] = [];
  let sessionId = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.substring(6);
        if (!data.trim()) continue;

        try {
          const event = JSON.parse(data);

          if (event.type === 'python_code') {
            console.log('useChatMutation: Received python_code event', event);
          }

          onChunk(event);

          if (event.type === 'text') {
            answer += event.content;
          } else if (event.type === 'sources') {
            sources = event.sources;
          } else if (event.type === 'done') {
            sessionId = event.sessionId;
          } else if (event.type === 'error') {
            throw new Error(event.error);
          }
        } catch (e) {
          if (e instanceof Error && e.message !== 'Unexpected end of JSON input') {
            throw e;
          }
        }
      }
    }
  }

  return { answer, sources, sessionId };
}

export function useChatMutation(onChunk?: (data: any) => void) {
  return useMutation({
    mutationFn: (request: ChatRequest) => streamChat(request, onChunk || (() => {})),
  });
}
