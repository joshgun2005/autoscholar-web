import { fmpStableRequest } from './client';
import type { StockQuote, HistoricalPrice, IntradayPrice, IntradayPriceResponse, CommodityQuote, CryptoQuote, ForexQuote, ChartDataLight, ChartDataFull, ChartDataIntraday } from './types';

export async function getStockQuote(symbol: string): Promise<StockQuote[]> {
  return fmpStableRequest<StockQuote[]>('/quote', { symbol });
}

export async function getHistoricalPrice(symbol: string, from?: string, to?: string): Promise<{ symbol: string; historical: HistoricalPrice[] }> {
  const params: Record<string, any> = { symbol };
  if (from) params.from = from;
  // If 'to' is not provided, default to today's date to ensure current data
  if (to) {
    params.to = to;
  } else {
    params.to = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  }
  const data = await fmpStableRequest<HistoricalPrice[]>('/historical-price-eod/full', params);

  // Stable endpoint returns array directly — normalize to legacy shape
  const historical = Array.isArray(data) ? data : [];

  // Limit to 504 most recent data points (2 years) for Monte Carlo simulations
  return { symbol, historical: historical.slice(0, 504) };
}

export async function getIntradayPrice(symbol: string, interval: string = '15min'): Promise<IntradayPriceResponse> {
  const result = await fmpStableRequest<IntradayPrice[]>(`/historical-chart/${interval}`, { symbol });
  // Limit to last 15 data points to avoid context overflow
  const limitedData = (Array.isArray(result) ? result : []).slice(0, 15);

  return {
    symbol,
    interval,
    data: limitedData
  };
}

// Stock Price Change API
export async function getStockPriceChange(symbol: string): Promise<Array<{ symbol: string; '1D': number; '5D': number; '1M': number; '3M': number; '6M': number; ytd: number; '1Y': number; '3Y': number; '5Y': number; '10Y': number; max: number }>> {
  return fmpStableRequest('/stock-price-change', { symbol });
}

// Quote Short API
export async function getQuoteShort(symbol: string): Promise<Array<{ symbol: string; price: number; volume: number }>> {
  return fmpStableRequest('/quote-short', { symbol });
}

// Aftermarket Trade API
export async function getAftermarketTrade(symbol: string): Promise<Array<{ symbol: string; price: number; size: number; timestamp: number }>> {
  return fmpStableRequest('/aftermarket-trade', { symbol });
}

// Aftermarket Quote API
export async function getAftermarketQuote(symbol: string): Promise<Array<{ symbol: string; ask: number; bid: number; asize: number; bsize: number; timestamp: number }>> {
  return fmpStableRequest('/aftermarket-quote', { symbol });
}

// Batch Quote API
export async function getBatchQuote(symbols: string): Promise<StockQuote[]> {
  return fmpStableRequest<StockQuote[]>('/batch-quote', { symbols });
}

// Batch Quote Short API
export async function getBatchQuoteShort(symbols: string): Promise<Array<{ symbol: string; price: number; volume: number }>> {
  return fmpStableRequest('/batch-quote-short', { symbols });
}

// Batch Aftermarket Trade API
export async function getBatchAftermarketTrade(symbols: string): Promise<Array<{ symbol: string; price: number; size: number; timestamp: number }>> {
  return fmpStableRequest('/batch-aftermarket-trade', { symbols });
}

// Batch Aftermarket Quote API
export async function getBatchAftermarketQuote(symbols: string): Promise<Array<{ symbol: string; ask: number; bid: number; asize: number; bsize: number; timestamp: number }>> {
  return fmpStableRequest('/batch-aftermarket-quote', { symbols });
}

// Exchange Stock Quotes API
export async function getBatchExchangeQuote(exchange: string): Promise<StockQuote[]> {
  return fmpStableRequest<StockQuote[]>('/batch-exchange-quote', { exchange });
}

// Mutual Fund Quotes API
export async function getBatchMutualfundQuotes(): Promise<StockQuote[]> {
  return fmpStableRequest<StockQuote[]>('/batch-mutualfund-quotes');
}

// ETF Quotes API
export async function getBatchETFQuotes(): Promise<StockQuote[]> {
  return fmpStableRequest<StockQuote[]>('/batch-etf-quotes');
}

// Commodity Quotes API (Batch)
export async function getBatchCommodityQuotes(): Promise<CommodityQuote[]> {
  return fmpStableRequest<CommodityQuote[]>('/batch-commodity-quotes');
}

// Crypto Quotes API (Batch)
export async function getBatchCryptoQuotes(): Promise<CryptoQuote[]> {
  return fmpStableRequest<CryptoQuote[]>('/batch-crypto-quotes');
}

// Forex Quotes API (Batch)
export async function getBatchForexQuotes(): Promise<ForexQuote[]> {
  return fmpStableRequest<ForexQuote[]>('/batch-forex-quotes');
}

// Index Quotes API (Batch)
export async function getBatchIndexQuotes(): Promise<StockQuote[]> {
  return fmpStableRequest<StockQuote[]>('/batch-index-quotes');
}

// Stock Chart Light API
export async function getChartLight(symbol: string, from?: string, to?: string): Promise<ChartDataLight[]> {
  const params: Record<string, any> = { symbol };
  if (from) params.from = from;
  if (to) params.to = to;
  return fmpStableRequest<ChartDataLight[]>('/historical-price-eod/light', params);
}

// Stock Price and Volume Data API (Full)
export async function getChartFull(symbol: string, from?: string, to?: string): Promise<ChartDataFull[]> {
  const params: Record<string, any> = { symbol };
  if (from) params.from = from;
  if (to) params.to = to;
  return fmpStableRequest<ChartDataFull[]>('/historical-price-eod/full', params);
}

// Unadjusted Stock Price API
export async function getChartUnadjusted(symbol: string, from?: string, to?: string): Promise<any[]> {
  const params: Record<string, any> = { symbol };
  if (from) params.from = from;
  if (to) params.to = to;
  return fmpStableRequest<any[]>('/historical-price-eod/non-split-adjusted', params);
}

// Dividend Adjusted Price Chart API
export async function getChartDividendAdjusted(symbol: string, from?: string, to?: string): Promise<any[]> {
  const params: Record<string, any> = { symbol };
  if (from) params.from = from;
  if (to) params.to = to;
  return fmpStableRequest<any[]>('/historical-price-eod/dividend-adjusted', params);
}

// Intraday Chart APIs
export async function getChartIntraday(
  symbol: string,
  interval: '1min' | '5min' | '15min' | '30min' | '1hour' | '4hour',
  from?: string,
  to?: string,
  nonadjusted: boolean = false
): Promise<ChartDataIntraday[]> {
  const params: Record<string, any> = { symbol };
  if (from) params.from = from;
  if (to) params.to = to;
  if (nonadjusted) params.nonadjusted = 'true';
  return fmpStableRequest<ChartDataIntraday[]>(`/historical-chart/${interval}`, params);
}
