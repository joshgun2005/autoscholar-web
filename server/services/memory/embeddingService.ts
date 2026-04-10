/**
 * Embedding Service — Generates vector embeddings for GME semantic search.
 *
 * Supports OpenAI (text-embedding-3-small, 1536 dims) and falls back to
 * a simple TF-IDF-style hash when no API key is available.
 */

import axios from 'axios';
import { logger } from '../../utils/logger';

const EMBEDDING_DIM = 1536;

// ── Provider selection ──

type EmbeddingProvider = 'openai' | 'openrouter' | 'local';

function getProvider(): EmbeddingProvider {
  if (process.env.OPENAI_API_KEY) return 'openai';
  if (process.env.OPENROUTER_API_KEY) return 'openrouter';
  return 'local';
}

// ── OpenAI embeddings ──

async function openaiEmbed(texts: string[]): Promise<number[][]> {
  const res = await axios.post(
    'https://api.openai.com/v1/embeddings',
    { model: 'text-embedding-3-small', input: texts },
    { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }, timeout: 30_000 },
  );
  return res.data.data
    .sort((a: any, b: any) => a.index - b.index)
    .map((d: any) => d.embedding as number[]);
}

// ── OpenRouter embeddings ──

async function openrouterEmbed(texts: string[]): Promise<number[][]> {
  const res = await axios.post(
    'https://openrouter.ai/api/v1/embeddings',
    { model: 'openai/text-embedding-3-small', input: texts },
    { headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}` }, timeout: 30_000 },
  );
  return res.data.data
    .sort((a: any, b: any) => a.index - b.index)
    .map((d: any) => d.embedding as number[]);
}

// ── Local fallback: deterministic hash-based pseudo-embedding ──

function localEmbed(texts: string[]): number[][] {
  return texts.map((text) => {
    const vec = new Float64Array(EMBEDDING_DIM).fill(0);
    const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/);
    for (const word of words) {
      let hash = 0;
      for (let i = 0; i < word.length; i++) {
        hash = ((hash << 5) - hash + word.charCodeAt(i)) | 0;
      }
      const idx = Math.abs(hash) % EMBEDDING_DIM;
      vec[idx] += 1;
    }
    // Normalize to unit vector
    const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0)) || 1;
    return Array.from(vec.map((v) => v / norm));
  });
}

// ── Public API ──

export async function generateEmbedding(text: string): Promise<number[]> {
  const results = await generateEmbeddings([text]);
  return results[0];
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  // Truncate each text to ~8000 chars to stay within token limits
  const truncated = texts.map((t) => t.slice(0, 8000));

  const provider = getProvider();
  try {
    switch (provider) {
      case 'openai':
        return await openaiEmbed(truncated);
      case 'openrouter':
        return await openrouterEmbed(truncated);
      default:
        return localEmbed(truncated);
    }
  } catch (err) {
    logger.warn(`[GME:Embedding] ${provider} failed, falling back to local: ${(err as Error).message}`);
    return localEmbed(truncated);
  }
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

export function parseEmbedding(stored: string | null | undefined): number[] | null {
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    return null;
  } catch {
    return null;
  }
}

export { EMBEDDING_DIM };
