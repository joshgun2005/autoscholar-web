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
  lastTradeDate: string;
  expirationDate?: string;
  type?: 'CALL' | 'PUT';
  strike: number;
  currency: string;
  lastPrice: number;
  bid: number;
  ask: number;
  change: number;
  changePercent: number;
  volume: number;
  openInterest: number;
  impliedVolatility: number;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
  inTheMoney: boolean;
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
 * @param ticker   EODHD ticker format e.g. "AAPL.US", "MSFT.US"
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
  const params: Record<string, string | number> = { interval };
  if (fromDate) params['from'] = toUnixTimestamp(fromDate);
  if (toDate) params['to'] = toUnixTimestamp(toDate);
  return request<IntradayBar[]>(`/intraday/${ticker}`, params);
}

// ── EOD Historical ─────────────────────────────────────────────────────────────

/**
 * Fetch end-of-day historical prices.
 * @param ticker   EODHD ticker format e.g. "AAPL.US"
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
  const params: Record<string, string | number> = { period };
  if (fromDate) params['from'] = fromDate;
  if (toDate) params['to'] = toDate;
  return request<EODBar[]>(`/eod/${ticker}`, params);
}

// ── Options ────────────────────────────────────────────────────────────────────

/**
 * Fetch US options chain with end-of-day Greeks.
 * @param ticker             EODHD ticker e.g. "AAPL.US"
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
  const params: Record<string, string | number> = {};
  if (fromDate) params['from'] = fromDate;
  if (toDate) params['to'] = toDate;
  if (expirationDateFrom) params['expiration_date_from'] = expirationDateFrom;
  if (expirationDateTo) params['expiration_date_to'] = expirationDateTo;
  if (contractName) params['contract_name'] = contractName;
  return request<OptionsChainResponse>(`/options/${ticker}`, params);
}

// ── Live Quote ─────────────────────────────────────────────────────────────────

export async function getEODHDLiveQuote(ticker: string): Promise<LiveQuote> {
  return request<LiveQuote>(`/real-time/${ticker}`);
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function toUnixTimestamp(dateStr: string): number {
  return Math.floor(new Date(dateStr).getTime() / 1000);
}
