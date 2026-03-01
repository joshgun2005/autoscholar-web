/**
 * EODHD API Service
 * Intraday historical data + US options chains with Greeks (EOD)
 * Docs: https://eodhd.com/financial-apis/
 */

import axios from 'axios';

const BASE_URL = 'https://eodhd.com/api';

function apiKey(): string {
  const key = process.env.EODHD_API_KEY;
  if (!key) throw new Error('EODHD_API_KEY is not set in environment variables');
  return key;
}

async function request<T>(endpoint: string, params: Record<string, string | number> = {}): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const response = await axios.get<T>(url, {
    params: { api_token: apiKey(), fmt: 'json', ...params },
    timeout: 20000,
  });
  return response.data;
}

// ── Ticker Normalization ──────────────────────────────────────────────────────

/**
 * Normalize ticker to EODHD format.
 * "AAPL" → "AAPL.US", "AAPL.US" → "AAPL.US", "VOD.LSE" → "VOD.LSE"
 */
function normalizeTicker(ticker: string): string {
  if (!ticker) throw new Error('Ticker is required');
  ticker = ticker.trim().toUpperCase();
  // Already has exchange suffix (contains a dot with letters after)
  if (/\.[A-Z]{1,6}$/.test(ticker)) return ticker;
  // Default to US exchange
  return `${ticker}.US`;
}

// ── Types ──────────────────────────────────────────────────────────────────────

export interface IntradayBar {
  datetime: string;
  gmtoffset: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface EODBar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  adjusted_close: number;
  volume: number;
}

export interface OptionsContract {
  contractName: string;
  contractSize: string;
  currency: string;
  type: 'Call' | 'Put';
  expirationDate: string;
  strike: number;
  lastTradeDateTime: string;
  lastTradePrice: number;
  bid: number;
  ask: number;
  change: number;
  changePercent: number;
  volume: number;
  openInterest: number;
  impliedVolatility: number | null;
  delta: number | null;
  gamma: number | null;
  theta: number | null;
  vega: number | null;
}

export interface OptionsBucket {
  expirationDate: string;
  options: {
    CALL: OptionsContract[];
    PUT: OptionsContract[];
  };
}

export interface OptionsChainResponse {
  code: string;
  exchange: string;
  lastTradeDate: string;
  lastTradePrice: number;
  data: OptionsBucket[];
}

export interface LiveQuote {
  code: string;
  timestamp: number;
  gmtoffset: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  previousClose: number;
  change: number;
  change_p: number;
}

// ── Intraday ───────────────────────────────────────────────────────────────────

/**
 * Fetch intraday OHLCV bars.
 * @param ticker   Ticker symbol, auto-normalized (e.g. "AAPL" → "AAPL.US")
 * @param interval "1m" | "5m" | "1h"
 * @param fromDate ISO date string or YYYY-MM-DD (optional)
 * @param toDate   ISO date string or YYYY-MM-DD (optional)
 */
export async function getEODHDIntraday(
  ticker: string,
  interval: '1m' | '5m' | '1h' = '5m',
  fromDate?: string,
  toDate?: string
): Promise<IntradayBar[]> {
  const normalizedTicker = normalizeTicker(ticker);
  const params: Record<string, string | number> = { interval };
  if (fromDate) {
    const ts = toUnixTimestamp(fromDate);
    if (!isNaN(ts)) params['from'] = ts;
  }
  if (toDate) {
    const ts = toUnixTimestamp(toDate);
    if (!isNaN(ts)) params['to'] = ts;
  }

  const data = await request<IntradayBar[] | { error?: string }>(
    `/intraday/${normalizedTicker}`,
    params
  );

  // API may return an error object instead of array
  if (!Array.isArray(data)) {
    const errMsg = (data as any)?.error || (data as any)?.message || 'Unexpected response format';
    throw new Error(`EODHD intraday error for ${normalizedTicker}: ${errMsg}`);
  }

  return data;
}

// ── EOD Historical ─────────────────────────────────────────────────────────────

/**
 * Fetch end-of-day historical prices.
 * @param ticker   Ticker symbol, auto-normalized (e.g. "AAPL" → "AAPL.US")
 * @param fromDate YYYY-MM-DD
 * @param toDate   YYYY-MM-DD
 * @param period   "d" | "w" | "m"
 */
export async function getEODHDEOD(
  ticker: string,
  fromDate?: string,
  toDate?: string,
  period: 'd' | 'w' | 'm' = 'd'
): Promise<EODBar[]> {
  const normalizedTicker = normalizeTicker(ticker);
  const params: Record<string, string | number> = { period };
  if (fromDate) params['from'] = fromDate;
  if (toDate) params['to'] = toDate;

  const data = await request<EODBar[] | { error?: string }>(
    `/eod/${normalizedTicker}`,
    params
  );

  if (!Array.isArray(data)) {
    const errMsg = (data as any)?.error || (data as any)?.message || 'Unexpected response format';
    throw new Error(`EODHD EOD error for ${normalizedTicker}: ${errMsg}`);
  }

  return data;
}

// ── Options ────────────────────────────────────────────────────────────────────

/**
 * Fetch US options chain with end-of-day Greeks.
 * Greeks (delta, gamma, theta, vega) and IV may be null for illiquid contracts.
 * @param ticker             Ticker symbol, auto-normalized (e.g. "AAPL" → "AAPL.US")
 * @param fromDate           Trade date start (YYYY-MM-DD)
 * @param toDate             Trade date end (YYYY-MM-DD)
 * @param expirationDateFrom Filter expiry from (YYYY-MM-DD)
 * @param expirationDateTo   Filter expiry to (YYYY-MM-DD)
 * @param contractName       Specific contract OCC name
 */
export async function getEODHDOptions(
  ticker: string,
  fromDate?: string,
  toDate?: string,
  expirationDateFrom?: string,
  expirationDateTo?: string,
  contractName?: string
): Promise<OptionsChainResponse> {
  const normalizedTicker = normalizeTicker(ticker);
  const params: Record<string, string | number> = {};
  if (fromDate) params['from'] = fromDate;
  if (toDate) params['to'] = toDate;
  if (expirationDateFrom) params['expiration_date_from'] = expirationDateFrom;
  if (expirationDateTo) params['expiration_date_to'] = expirationDateTo;
  if (contractName) params['contract_name'] = contractName;

  const raw = await request<any>(`/options/${normalizedTicker}`, params);

  // API may return error object
  if (raw?.error || raw?.message) {
    throw new Error(`EODHD options error for ${normalizedTicker}: ${raw.error || raw.message}`);
  }

  // Sanitize Greeks/IV: replace undefined/NaN with null for clean downstream handling
  if (raw.data && Array.isArray(raw.data)) {
    for (const bucket of raw.data) {
      if (bucket.options) {
        for (const side of ['CALL', 'PUT'] as const) {
          if (Array.isArray(bucket.options[side])) {
            bucket.options[side] = bucket.options[side].map((c: any) => ({
              ...c,
              impliedVolatility: sanitizeGreek(c.impliedVolatility),
              delta: sanitizeGreek(c.delta),
              gamma: sanitizeGreek(c.gamma),
              theta: sanitizeGreek(c.theta),
              vega: sanitizeGreek(c.vega),
            }));
          }
        }
      }
    }
  }

  return raw as OptionsChainResponse;
}

// ── Live Quote ─────────────────────────────────────────────────────────────────

export async function getEODHDLiveQuote(ticker: string): Promise<LiveQuote> {
  const normalizedTicker = normalizeTicker(ticker);
  return request<LiveQuote>(`/real-time/${normalizedTicker}`);
}

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Convert a date string to Unix timestamp (seconds).
 * Handles: YYYY-MM-DD, ISO 8601, Unix timestamp strings, etc.
 * Returns NaN if parsing fails (caller should check).
 */
function toUnixTimestamp(dateStr: string): number {
  // Already a numeric timestamp
  if (/^\d{10,13}$/.test(dateStr.trim())) {
    const n = parseInt(dateStr.trim(), 10);
    return n > 9999999999 ? Math.floor(n / 1000) : n;
  }

  // YYYY-MM-DD — parse as UTC to avoid timezone offset issues
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr.trim());
  if (dateOnly) {
    const d = new Date(Date.UTC(+dateOnly[1], +dateOnly[2] - 1, +dateOnly[3]));
    return Math.floor(d.getTime() / 1000);
  }

  // General ISO / parseable date string
  const ms = new Date(dateStr).getTime();
  if (isNaN(ms)) return NaN;
  return Math.floor(ms / 1000);
}

/**
 * Sanitize a Greek value: return null for undefined, NaN, or non-finite values.
 */
function sanitizeGreek(value: any): number | null {
  if (value === undefined || value === null || value === '') return null;
  const n = Number(value);
  if (!isFinite(n)) return null;
  return n;
}
