import { useMutation } from '@tanstack/react-query';
import { useRef, useCallback } from 'react';
import type { SearchResult } from '@shared/types';

interface ConversationMessage {
  question: string;
  answer: string;
}

interface AuthorProfile {
  name: string;
  university: string;
  department: string;
  email: string;
}

export interface UploadedFile {
  originalName: string;
  storedName: string;
  filepath: string;
  size: number;
  ext: string;
}

interface ChatRequest {
  query: string;
  history?: ConversationMessage[];
  sessionId?: string;
  imageData?: string;
  imageMimeType?: string;
  authorProfile?: AuthorProfile;
  uploadedFiles?: UploadedFile[];
}

interface ChatResponse {
  answer: string;
  sources: SearchResult[];
  sessionId: string;
  error?: string;
}

async function streamChat(
  request: ChatRequest,
  onChunk: (data: any) => void,
  signal?: AbortSignal,
): Promise<ChatResponse> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(request),
    signal,
  });

  if (!response.ok) {
    if (response.status === 401) {
      // Session expired — reload to show the gate login
      window.location.reload();
      throw new Error('Session expirée. Reconnexion...');
    }
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `Chat API error (${response.status})`);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) {
    throw new Error('No response body');
  }

  // Cancel the reader when the signal fires
  if (signal) {
    signal.addEventListener('abort', () => {
      reader.cancel().catch(() => {});
    }, { once: true });
  }

  let answer = '';
  let sources: SearchResult[] = [];
  let sessionId = '';
  let buffer = '';

  while (true) {
    let readResult;
    try {
      readResult = await reader.read();
    } catch (e: any) {
      // reader.read() fails when connection drops, navigation, or abort
      if (signal?.aborted) {
        // Intentional abort — return partial results silently
        break;
      }
      console.warn('Stream read interrupted:', e?.message);
      break;
    }

    const { done, value } = readResult;
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
  const abortRef = useRef<AbortController | null>(null);

  const mutation = useMutation({
    mutationFn: (request: ChatRequest) => {
      // Abort any previous in-flight stream
      if (abortRef.current) {
        abortRef.current.abort();
      }
      const controller = new AbortController();
      abortRef.current = controller;
      return streamChat(request, onChunk || (() => {}), controller.signal);
    },
    retry: false,
  });

  const abort = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
  }, []);

  return { ...mutation, abort };
}
