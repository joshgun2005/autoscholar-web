import { fmpStableRequest } from './client';
import type { FinancialNews, PressRelease, StockNewsSentiment, SocialSentiment } from './types';

export async function getFinancialNews(symbol?: string, limit: number = 5): Promise<FinancialNews[]> {
  // Limit to 5 articles to avoid context overflow
  const actualLimit = Math.min(limit, 5);
  if (symbol) {
    return fmpStableRequest<FinancialNews[]>('/news/stock', { symbol, limit: actualLimit });
  }
  return fmpStableRequest<FinancialNews[]>('/news/stock-latest', { limit: actualLimit });
}

export async function getPressReleases(symbol: string, limit: number = 20): Promise<PressRelease[]> {
  // press-releases not available on /stable — use press-releases-latest as fallback
  return fmpStableRequest<PressRelease[]>('/news/press-releases-latest', { limit });
}

export async function getStockNewsSentiment(symbol: string, limit: number = 5): Promise<StockNewsSentiment[]> {
  // stock-news-sentiment not available on /stable — use stock news as fallback
  const actualLimit = Math.min(limit, 5);
  return fmpStableRequest<StockNewsSentiment[]>('/news/stock', { symbol, limit: actualLimit });
}

export async function getSocialSentiment(symbol: string, limit: number = 10): Promise<SocialSentiment[]> {
  // social-sentiments not available on /stable — use stock news as proxy
  const actualLimit = Math.min(limit, 10);
  const result = await fmpStableRequest<SocialSentiment[]>('/news/stock', { symbol, limit: actualLimit });
  return result.slice(0, actualLimit);
}

// FMP Articles API
export async function getFMPArticles(page: number = 0, limit: number = 20): Promise<Array<{ title: string; date: string; content: string; tickers: string; image: string; link: string; author: string; site: string }>> {
  return fmpStableRequest('/fmp-articles', { page, limit });
}

// General News API
export async function getGeneralNews(page: number = 0, limit: number = 20): Promise<FinancialNews[]> {
  return fmpStableRequest<FinancialNews[]>('/news/general-latest', { page, limit });
}

// Press Releases Latest API
export async function getPressReleasesLatest(page: number = 0, limit: number = 20): Promise<FinancialNews[]> {
  return fmpStableRequest<FinancialNews[]>('/news/press-releases-latest', { page, limit });
}

// Stock News Latest API
export async function getStockNewsLatest(page: number = 0, limit: number = 20): Promise<FinancialNews[]> {
  return fmpStableRequest<FinancialNews[]>('/news/stock-latest', { page, limit });
}

// Crypto News API
export async function getCryptoNews(page: number = 0, limit: number = 20): Promise<FinancialNews[]> {
  return fmpStableRequest<FinancialNews[]>('/news/crypto-latest', { page, limit });
}

// Forex News API
export async function getForexNews(page: number = 0, limit: number = 20): Promise<FinancialNews[]> {
  return fmpStableRequest<FinancialNews[]>('/news/forex-latest', { page, limit });
}

// Search Press Releases API
export async function searchPressReleasesNew(symbols: string): Promise<FinancialNews[]> {
  return fmpStableRequest<FinancialNews[]>('/news/press-releases', { symbols });
}

// Search Stock News API
export async function searchStockNews(symbols: string): Promise<FinancialNews[]> {
  return fmpStableRequest<FinancialNews[]>('/news/stock', { symbols });
}

// Search Crypto News API
export async function searchCryptoNews(symbols: string): Promise<FinancialNews[]> {
  return fmpStableRequest<FinancialNews[]>('/news/crypto', { symbols });
}

// Search Forex News API
export async function searchForexNews(symbols: string): Promise<FinancialNews[]> {
  return fmpStableRequest<FinancialNews[]>('/news/forex', { symbols });
}
