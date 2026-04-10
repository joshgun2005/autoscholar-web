import { fmpStableRequest } from './client';
import type { ETFHolding, ETFSectorWeighting, ETFCountryWeighting } from './types';

export async function getETFHoldings(symbol: string): Promise<ETFHolding[]> {
  return fmpStableRequest<ETFHolding[]>('/etf/asset-exposure', { symbol });
}

export async function getETFSectorWeightings(symbol: string): Promise<ETFSectorWeighting[]> {
  // etf-sector-weightings not available on /stable — use asset-exposure as fallback
  return fmpStableRequest<ETFSectorWeighting[]>('/etf/asset-exposure', { symbol });
}

export async function getETFCountryWeightings(symbol: string): Promise<ETFCountryWeighting[]> {
  // etf-country-weightings not available on /stable — use asset-exposure as fallback
  return fmpStableRequest<ETFCountryWeighting[]>('/etf/asset-exposure', { symbol });
}

// ETF Asset Exposure API
export async function getETFAssetExposure(symbol: string): Promise<Array<{ etfSymbol: string; assetExposure: string; sharesNumber: number; weightPercentage: string; marketValue: number }>> {
  return fmpStableRequest('/etf/asset-exposure', { symbol });
}

// Mutual Fund Disclosure Latest API
export async function getMutualFundDisclosureLatest(symbol: string): Promise<Array<any>> {
  return fmpStableRequest('/funds/disclosure-holders-latest', { symbol });
}

// Mutual Fund Disclosure API
export async function getMutualFundDisclosure(symbol: string, year: number, quarter: number): Promise<any> {
  return fmpStableRequest('/funds/disclosure', { symbol, year, quarter });
}

// Mutual Fund Disclosure Search API
export async function getMutualFundDisclosureSearch(name: string): Promise<Array<any>> {
  return fmpStableRequest('/funds/disclosure-holders-search', { name });
}

// Fund Disclosure Dates API
export async function getMutualFundDisclosureDates(symbol: string): Promise<Array<{ symbol: string; date: string; year: number; quarter: number }>> {
  return fmpStableRequest('/funds/disclosure-dates', { symbol });
}

// Index List API
export async function getIndexList(): Promise<Array<{ symbol: string; name: string; currency: string; stockExchange: string; exchangeShortName: string }>> {
  return fmpStableRequest('/index-list');
}

// S&P 500 Constituent API
export async function getSP500Constituent(): Promise<Array<{ symbol: string; name: string; sector: string; subSector: string; headQuarter: string; dateFirstAdded: string; cik: string; founded: string }>> {
  return fmpStableRequest('/sp500-constituent');
}

// Nasdaq Constituent API
export async function getNasdaqConstituent(): Promise<Array<{ symbol: string; name: string; sector: string; subSector: string; headQuarter: string; dateFirstAdded: string; cik: string; founded: string }>> {
  return fmpStableRequest('/nasdaq-constituent');
}

// Dow Jones Constituent API
export async function getDowJonesConstituent(): Promise<Array<{ symbol: string; name: string; sector: string; subSector: string; headQuarter: string; dateFirstAdded: string; cik: string; founded: string }>> {
  return fmpStableRequest('/dowjones-constituent');
}

// Historical S&P 500 Constituent API
export async function getHistoricalSP500Constituent(): Promise<Array<{ dateAdded: string; addedSecurity: string; removedTicker: string; removedSecurity: string; date: string; reason: string }>> {
  return fmpStableRequest('/historical-sp500-constituent');
}

// Historical Nasdaq Constituent API
export async function getHistoricalNasdaqConstituent(): Promise<Array<{ dateAdded: string; addedSecurity: string; removedTicker: string; removedSecurity: string; date: string; reason: string }>> {
  return fmpStableRequest('/historical-nasdaq-constituent');
}

// Historical Dow Jones Constituent API
export async function getHistoricalDowJonesConstituent(): Promise<Array<{ dateAdded: string; addedSecurity: string; removedTicker: string; removedSecurity: string; date: string; reason: string }>> {
  return fmpStableRequest('/historical-dowjones-constituent');
}
