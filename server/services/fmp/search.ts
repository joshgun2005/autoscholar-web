import { fmpStableRequest } from './client';
import type { CompanySearchResult, ScreenerResult, CompanyProfile } from './types';

export async function searchCompanies(query: string, limit: number = 10): Promise<Array<{ symbol: string; name: string; currency: string; stockExchange: string; exchangeShortName: string }>> {
  return fmpStableRequest('/search-name', { query, limit });
}

export async function getStockPeers(symbol: string): Promise<string[]> {
  return fmpStableRequest<string[]>('/stock-peers', { symbol });
}

// Search Symbol API
export async function searchSymbol(query: string): Promise<Array<{ symbol: string; name: string; currency: string; stockExchange: string; exchangeShortName: string }>> {
  return fmpStableRequest('/search-symbol', { query });
}

// Search Name API
export async function searchName(query: string): Promise<Array<{ symbol: string; name: string; currency: string; stockExchange: string; exchangeShortName: string }>> {
  return fmpStableRequest('/search-name', { query });
}

// Search Exchange Variants API
export async function searchExchangeVariants(symbol: string): Promise<Array<{ symbol: string; name: string; exchange: string }>> {
  return fmpStableRequest('/search-exchange-variants', { symbol });
}

// Stock List API
export async function getStockList(): Promise<Array<{ symbol: string; name: string; price: number; exchange: string }>> {
  return fmpStableRequest('/stock-list');
}

// Financial Statement Symbol List API
export async function getFinancialStatementSymbolList(): Promise<Array<{ symbol: string }>> {
  return fmpStableRequest('/financial-statement-symbol-list');
}

// CIK List API
export async function getCIKList(page: number = 0, limit: number = 1000): Promise<Array<{ cik: string; name: string }>> {
  return fmpStableRequest('/cik-list', { page, limit });
}

// Symbol Change API
export async function getSymbolChange(): Promise<Array<{ date: string; name: string; oldSymbol: string; newSymbol: string }>> {
  return fmpStableRequest('/symbol-change');
}

// ETF List API
export async function getETFList(): Promise<Array<{ symbol: string; name: string; price: number; exchange: string }>> {
  return fmpStableRequest('/etf-list');
}

// Actively Trading List API
export async function getActivelyTradingList(): Promise<Array<{ symbol: string; name: string; price: number; exchange: string }>> {
  return fmpStableRequest('/actively-trading-list');
}

// Earnings Transcript List API
export async function getEarningsTranscriptList(): Promise<Array<{ symbol: string; numberOfEarningsTranscript: number }>> {
  return fmpStableRequest('/earnings-transcript-list');
}

// Available Exchanges API
export async function getAvailableExchanges(): Promise<Array<{ name: string; code: string }>> {
  return fmpStableRequest('/available-exchanges');
}

// Available Sectors API
export async function getAvailableSectors(): Promise<Array<{ sector: string }>> {
  return fmpStableRequest('/available-sectors');
}

// Available Industries API
export async function getAvailableIndustries(): Promise<Array<{ industry: string }>> {
  return fmpStableRequest('/available-industries');
}

// Available Countries API
export async function getAvailableCountries(): Promise<Array<{ country: string }>> {
  return fmpStableRequest('/available-countries');
}

// Profile by CIK API
export async function getProfileByCIK(cik: string): Promise<CompanyProfile[]> {
  return fmpStableRequest<CompanyProfile[]>('/profile-cik', { cik });
}

// Delisted Companies API
export async function getDelistedCompanies(page: number = 0, limit: number = 100): Promise<Array<{ symbol: string; companyName: string; exchange: string; ipoDate: string; delistedDate: string }>> {
  return fmpStableRequest('/delisted-companies', { page, limit });
}

// Search by CIK, CUSIP, ISIN (use search-name as fallback — dedicated endpoints not on /stable)
export async function searchByCIK(cik: string): Promise<CompanySearchResult[]> {
  return fmpStableRequest<CompanySearchResult[]>('/search-name', { query: cik });
}

export async function searchByCUSIP(cusip: string): Promise<CompanySearchResult[]> {
  return fmpStableRequest<CompanySearchResult[]>('/search-name', { query: cusip });
}

export async function searchByISIN(isin: string): Promise<CompanySearchResult[]> {
  return fmpStableRequest<CompanySearchResult[]>('/search-name', { query: isin });
}

// Stock Screener
export async function getStockScreener(filters: {
  marketCapMoreThan?: number;
  marketCapLowerThan?: number;
  betaMoreThan?: number;
  betaLowerThan?: number;
  volumeMoreThan?: number;
  sector?: string;
  industry?: string;
  exchange?: string;
  limit?: number;
}): Promise<ScreenerResult[]> {
  return fmpStableRequest<ScreenerResult[]>('/company-screener', filters);
}
