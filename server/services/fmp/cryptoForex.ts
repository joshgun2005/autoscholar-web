import { fmpStableRequest } from './client';
import type { ForexQuote, CommodityQuote, CryptoQuote, ForexHistorical } from './types';

export async function getForexQuote(pair: string): Promise<ForexQuote[]> {
  // /stable uses quote with symbol param (works for forex pairs like EURUSD)
  return fmpStableRequest<ForexQuote[]>('/quote', { symbol: pair });
}

export async function getForexList(): Promise<Array<{ symbol: string; name: string; currency: string; stockExchange: string }>> {
  return fmpStableRequest('/forex-list');
}

export async function getCommodityQuotes(): Promise<CommodityQuote[]> {
  return fmpStableRequest<CommodityQuote[]>('/commodities-list');
}

export async function getCryptoQuote(symbol: string): Promise<CryptoQuote[]> {
  return fmpStableRequest<CryptoQuote[]>('/quote', { symbol });
}

export async function getCryptoList(): Promise<Array<{ symbol: string; name: string; currency: string; stockExchange: string }>> {
  return fmpStableRequest('/cryptocurrency-list');
}

export async function getForexHistorical(pair: string, from?: string, to?: string): Promise<{ symbol: string; historical: ForexHistorical[] }> {
  const params: Record<string, any> = { symbol: pair };
  if (from) params.from = from;
  if (to) params.to = to;
  const data = await fmpStableRequest<ForexHistorical[]>('/historical-price-eod/full', params);

  // Stable endpoint returns an array directly — normalize to legacy shape
  const historical = Array.isArray(data) ? data : [];

  // Limit to last 20 days
  return { symbol: pair, historical: historical.slice(0, 20) };
}

// Forex Currency Pairs API
export async function getForexCurrencyPairs(): Promise<Array<{ symbol: string; name: string; currency: string; stockExchange: string }>> {
  return fmpStableRequest('/forex-list');
}

// Commodities List API
export async function getCommoditiesList(): Promise<Array<{ symbol: string; name: string; currency: string; stockExchange: string; exchangeShortName: string }>> {
  return fmpStableRequest('/commodities-list');
}
