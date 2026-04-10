/**
 * Polymarket API Service (Read-Only)
 * Provides access to Polymarket prediction market data via Gamma API, Data API, and CLOB API.
 * All endpoints used here are public — no API key or authentication required.
 */
import axios from 'axios';

const GAMMA_URL = 'https://gamma-api.polymarket.com';
const DATA_URL = 'https://data-api.polymarket.com';
const CLOB_URL = 'https://clob.polymarket.com';
const TIMEOUT = 15000;

// ── Gamma API — Events & Markets ──────────────────────────────────────────

export async function getPolymarketEvents(params: {
  active?: boolean;
  closed?: boolean;
  tag_slug?: string;
  order?: string;
  ascending?: boolean;
  limit?: number;
  offset?: number;
  id?: string;
  slug?: string;
}) {
  const response = await axios.get(`${GAMMA_URL}/events`, { params, timeout: TIMEOUT });
  return response.data;
}

export async function getPolymarketEventById(id: string) {
  const response = await axios.get(`${GAMMA_URL}/events/${id}`, { timeout: TIMEOUT });
  return response.data;
}

export async function getPolymarketEventBySlug(slug: string) {
  const response = await axios.get(`${GAMMA_URL}/events/slug/${slug}`, { timeout: TIMEOUT });
  return response.data;
}

export async function getPolymarketMarkets(params: {
  active?: boolean;
  closed?: boolean;
  tag_id?: number;
  order?: string;
  ascending?: boolean;
  limit?: number;
  offset?: number;
  id?: string;
  slug?: string;
}) {
  const response = await axios.get(`${GAMMA_URL}/markets`, { params, timeout: TIMEOUT });
  return response.data;
}

export async function getPolymarketMarketById(id: string) {
  const response = await axios.get(`${GAMMA_URL}/markets/${id}`, { timeout: TIMEOUT });
  return response.data;
}

export async function getPolymarketTags() {
  const response = await axios.get(`${GAMMA_URL}/tags`, { timeout: TIMEOUT });
  return response.data;
}

export async function searchPolymarket(query: string, limit?: number) {
  const params: Record<string, string | number> = { q: query };
  if (limit) params.limit = limit;
  const response = await axios.get(`${GAMMA_URL}/search`, { params, timeout: TIMEOUT });
  return response.data;
}

// ── Data API — Positions, Trades, Leaderboard ─────────────────────────────

export async function getPolymarketTrades(params: {
  user?: string;
  market?: string;
  limit?: number;
  offset?: number;
}) {
  const response = await axios.get(`${DATA_URL}/trades`, { params, timeout: TIMEOUT });
  return response.data;
}

export async function getPolymarketLeaderboard(limit?: number, offset?: number) {
  const params: Record<string, number> = {};
  if (limit) params.limit = limit;
  if (offset) params.offset = offset;
  const response = await axios.get(`${DATA_URL}/leaderboard/trader`, { params, timeout: TIMEOUT });
  return response.data;
}

// ── CLOB API — Order Book, Prices, Price History ──────────────────────────

export async function getPolymarketOrderBook(tokenId: string) {
  const response = await axios.get(`${CLOB_URL}/book`, {
    params: { token_id: tokenId },
    timeout: TIMEOUT,
  });
  return response.data;
}

export async function getPolymarketPrice(tokenId: string, side: string) {
  const response = await axios.get(`${CLOB_URL}/price`, {
    params: { token_id: tokenId, side },
    timeout: TIMEOUT,
  });
  return response.data;
}

export async function getPolymarketMidpoint(tokenId: string) {
  const response = await axios.get(`${CLOB_URL}/midpoint`, {
    params: { token_id: tokenId },
    timeout: TIMEOUT,
  });
  return response.data;
}

export async function getPolymarketPriceHistory(
  tokenId: string,
  interval?: string,
  startTs?: number,
  endTs?: number,
  fidelity?: number
) {
  const params: Record<string, string | number> = { market: tokenId };
  if (interval) params.interval = interval;
  if (startTs) params.startTs = startTs;
  if (endTs) params.endTs = endTs;
  if (fidelity) params.fidelity = fidelity;
  const response = await axios.get(`${CLOB_URL}/prices-history`, { params, timeout: TIMEOUT });
  return response.data;
}

export async function getPolymarketSpread(tokenId: string) {
  const response = await axios.get(`${CLOB_URL}/spread`, {
    params: { token_id: tokenId },
    timeout: TIMEOUT,
  });
  return response.data;
}
