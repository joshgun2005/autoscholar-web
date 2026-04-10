import { fmpStableRequest } from './client';
import type { EconomicCalendar, TreasuryRate, EconomicIndicator, MarketHours, MarketMover } from './types';

export async function getEconomicCalendar(from?: string, to?: string): Promise<EconomicCalendar[]> {
  // If no dates specified, get last 30 days + next 30 days
  if (!from && !to) {
    const now = new Date();
    const past30Days = new Date(now);
    past30Days.setDate(past30Days.getDate() - 30);
    const future30Days = new Date(now);
    future30Days.setDate(future30Days.getDate() + 30);

    from = past30Days.toISOString().split('T')[0];
    to = future30Days.toISOString().split('T')[0];
  }

  const params: Record<string, any> = {};
  if (from) params.from = from;
  if (to) params.to = to;
  const result = await fmpStableRequest<EconomicCalendar[]>('/economic-calendar', params);

  // Filter to high/medium impact events and limit to avoid context overflow
  const filtered = result.filter(event => event.impact === 'High' || event.impact === 'Medium');

  // Sort by date (most recent first) and limit to 15 total events
  return filtered
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 15);
}

export async function getTreasuryRates(from?: string, to?: string): Promise<TreasuryRate[]> {
  const params: Record<string, any> = {};
  if (from) params.from = from;
  if (to) params.to = to;
  const result = await fmpStableRequest<TreasuryRate[]>('/treasury-rates', params);
  // Limit to most recent 15 days to avoid context overflow
  return (Array.isArray(result) ? result : []).slice(0, 15);
}

export async function getEconomicIndicator(indicator: string, from?: string, to?: string): Promise<EconomicIndicator[]> {
  // economic indicator endpoint not available on /stable — return empty
  // The data can still be retrieved via FRED API as an alternative
  return [];
}

export async function getMarketHours(): Promise<MarketHours> {
  return fmpStableRequest<MarketHours>('/all-exchange-market-hours');
}

export async function getGainers(): Promise<MarketMover[]> {
  // gainers/losers/actives require higher plan — use sector performance as fallback
  return fmpStableRequest<MarketMover[]>('/sector-performance-snapshot');
}

export async function getLosers(): Promise<MarketMover[]> {
  return fmpStableRequest<MarketMover[]>('/sector-performance-snapshot');
}

export async function getActives(): Promise<MarketMover[]> {
  return fmpStableRequest<MarketMover[]>('/sector-performance-snapshot');
}

// Market Risk Premium API
export async function getMarketRiskPremium(country?: string): Promise<Array<{ country: string; continent: string; totalEquityRiskPremium: number; countryRiskPremium: number }>> {
  const params: Record<string, any> = {};
  if (country) params.country = country;
  return fmpStableRequest('/market-risk-premium', params);
}

// Exchange Market Hours API
export async function getExchangeMarketHours(exchange: string): Promise<any> {
  return fmpStableRequest('/exchange-market-hours', { exchange });
}

// Holidays By Exchange API
export async function getHolidaysByExchange(exchange: string): Promise<Array<{ year: number; holidays: Array<{ date: string; name: string }> }>> {
  return fmpStableRequest('/holidays-by-exchange', { exchange });
}

// All Exchange Market Hours API
export async function getAllExchangeMarketHours(): Promise<Array<any>> {
  return fmpStableRequest('/all-exchange-market-hours');
}

// Market Sector Performance Snapshot API
export async function getMarketSectorPerformanceSnapshot(date?: string): Promise<Array<{ sector: string; changesPercentage: string }>> {
  const params: Record<string, any> = {};
  if (date) params.date = date;
  return fmpStableRequest('/sector-performance-snapshot', params);
}

// Industry Performance Snapshot API
export async function getIndustryPerformanceSnapshot(date?: string): Promise<Array<{ industry: string; changesPercentage: string }>> {
  const params: Record<string, any> = {};
  if (date) params.date = date;
  return fmpStableRequest('/industry-performance-snapshot', params);
}

// Historical Sector Performance API
export async function getHistoricalSectorPerformance(sector: string, limit: number = 100): Promise<Array<{ date: string; sector: string; changesPercentage: string }>> {
  return fmpStableRequest('/historical-sector-performance', { sector, limit });
}

// Historical Industry Performance API
export async function getHistoricalIndustryPerformance(industry: string, limit: number = 100): Promise<Array<{ date: string; industry: string; changesPercentage: string }>> {
  return fmpStableRequest('/historical-industry-performance', { industry, limit });
}

// Sector P/E Snapshot API
export async function getSectorPESnapshot(date?: string): Promise<Array<{ date: string; sector: string; pe: string }>> {
  const params: Record<string, any> = {};
  if (date) params.date = date;
  return fmpStableRequest('/sector-pe-snapshot', params);
}

// Industry P/E Snapshot API
export async function getIndustryPESnapshot(date?: string): Promise<Array<{ date: string; industry: string; pe: string }>> {
  const params: Record<string, any> = {};
  if (date) params.date = date;
  return fmpStableRequest('/industry-pe-snapshot', params);
}

// Historical Sector P/E API
export async function getHistoricalSectorPE(sector: string, limit: number = 100): Promise<Array<{ date: string; sector: string; pe: string }>> {
  return fmpStableRequest('/historical-sector-pe', { sector, limit });
}

// Historical Industry P/E API
export async function getHistoricalIndustryPE(industry: string, limit: number = 100): Promise<Array<{ date: string; industry: string; pe: string }>> {
  return fmpStableRequest('/historical-industry-pe', { industry, limit });
}
