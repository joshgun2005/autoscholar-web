import { fmpStableRequest } from './client';
import type { InsiderTrade, InsiderTradeStatistics, CongressionalTrade } from './types';

export async function getInsiderTrading(symbol?: string, limit: number = 20): Promise<InsiderTrade[]> {
  // Limit to 20 trades to avoid context overflow
  const actualLimit = Math.min(limit, 20);
  if (symbol) {
    return fmpStableRequest<InsiderTrade[]>('/insider-trading/search', { symbol, limit: actualLimit });
  }
  return fmpStableRequest<InsiderTrade[]>('/insider-trading/latest', { limit: actualLimit });
}

export async function getInsiderTradeStatistics(symbol: string): Promise<InsiderTradeStatistics[]> {
  // insider-trade-statistics not available on /stable — use search as fallback
  return fmpStableRequest<InsiderTradeStatistics[]>('/insider-trading/search', { symbol, limit: 50 });
}

export async function getCongressionalTrading(symbol?: string): Promise<CongressionalTrade[]> {
  if (symbol) {
    return fmpStableRequest<CongressionalTrade[]>('/senate-trades', { symbol });
  }
  return fmpStableRequest<CongressionalTrade[]>('/senate-latest', { limit: 50 });
}

export async function getSenateTrading(symbol?: string): Promise<CongressionalTrade[]> {
  if (symbol) {
    return fmpStableRequest<CongressionalTrade[]>('/senate-trades', { symbol });
  }
  return fmpStableRequest<CongressionalTrade[]>('/senate-latest', { limit: 50 });
}

// Latest Senate Disclosures API
export async function getLatestSenateDisclosures(page: number = 0, limit: number = 100): Promise<CongressionalTrade[]> {
  return fmpStableRequest<CongressionalTrade[]>('/senate-latest', { page, limit });
}

// Latest House Disclosures API
export async function getLatestHouseDisclosures(page: number = 0, limit: number = 100): Promise<CongressionalTrade[]> {
  return fmpStableRequest<CongressionalTrade[]>('/house-latest', { page, limit });
}

// Senate Trades API (by symbol)
export async function getSenateTradesSymbol(symbol: string): Promise<CongressionalTrade[]> {
  return fmpStableRequest<CongressionalTrade[]>('/senate-trades', { symbol });
}

// Senate Trades By Name API
export async function getSenateTradesByName(name: string): Promise<CongressionalTrade[]> {
  return fmpStableRequest<CongressionalTrade[]>('/senate-trades-by-name', { name });
}

// House Trades API (by symbol)
export async function getHouseTradesSymbol(symbol: string): Promise<CongressionalTrade[]> {
  return fmpStableRequest<CongressionalTrade[]>('/house-trades', { symbol });
}

// House Trades By Name API
export async function getHouseTradesByName(name: string): Promise<CongressionalTrade[]> {
  return fmpStableRequest<CongressionalTrade[]>('/house-trades-by-name', { name });
}

// Latest Insider Trading API
export async function getLatestInsiderTrading(page: number = 0, limit: number = 100): Promise<InsiderTrade[]> {
  return fmpStableRequest<InsiderTrade[]>('/insider-trading/latest', { page, limit });
}

// Search Insider Trades API
export async function searchInsiderTrades(symbol?: string, companyName?: string, reportingName?: string, page: number = 0, limit: number = 100): Promise<InsiderTrade[]> {
  const params: Record<string, any> = { page, limit };
  if (symbol) params.symbol = symbol;
  if (companyName) params.companyName = companyName;
  if (reportingName) params.reportingName = reportingName;
  return fmpStableRequest<InsiderTrade[]>('/insider-trading/search', params);
}

// Search Insider Trades By Name API
export async function searchInsiderTradesByName(name: string): Promise<InsiderTrade[]> {
  return fmpStableRequest<InsiderTrade[]>('/insider-trading/reporting-name', { name });
}

// All Insider Transaction Types API
export async function getAllInsiderTransactionTypes(): Promise<Array<{ transactionType: string; description: string }>> {
  return fmpStableRequest('/insider-trading-transaction-type');
}

// Acquisition Of Beneficial Ownership API
export async function getAcquisitionOfBeneficialOwnership(symbol: string): Promise<Array<any>> {
  return fmpStableRequest('/acquisition-of-beneficial-ownership', { symbol });
}
