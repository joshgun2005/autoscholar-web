import { fmpStableRequest } from './client';
import type { ESGScore, COTReport, Dividend, StockSplit, IPOCalendar } from './types';

export async function getESGScore(symbol: string): Promise<ESGScore[]> {
  // esg data not available on /stable — use esg-ratings as fallback
  return fmpStableRequest<ESGScore[]>('/esg-ratings', { symbol });
}

// ESG Disclosures API
export async function getESGDisclosures(symbol: string): Promise<Array<any>> {
  return fmpStableRequest('/esg-disclosures', { symbol });
}

// ESG Ratings API
export async function getESGRatings(symbol: string): Promise<ESGScore[]> {
  return fmpStableRequest<ESGScore[]>('/esg-ratings', { symbol });
}

// ESG Benchmark API
export async function getESGBenchmark(year?: number): Promise<Array<any>> {
  const params: Record<string, any> = {};
  if (year) params.year = year;
  return fmpStableRequest('/esg-benchmark', params);
}

export async function getCOTReport(symbol: string): Promise<COTReport[]> {
  return fmpStableRequest<COTReport[]>('/commitment-of-traders-report', { symbol });
}

export async function getCOTAnalysis(symbol: string): Promise<COTReport[]> {
  // COT analysis not available on /stable — use regular report
  return fmpStableRequest<COTReport[]>('/commitment-of-traders-report', { symbol });
}

// COT List API
export async function getCOTList(): Promise<Array<{ tradingSymbol: string; name: string }>> {
  return fmpStableRequest('/commitment-of-traders-list');
}

export async function getDividendHistory(symbol: string): Promise<Dividend[]> {
  const result = await fmpStableRequest<Dividend[]>('/dividends', { symbol });
  // Limit to last 10 dividends to avoid context overflow
  if (!Array.isArray(result)) return [];
  return result.slice(0, 10);
}

export async function getStockSplitHistory(symbol: string): Promise<StockSplit[]> {
  const result = await fmpStableRequest<StockSplit[]>('/splits', { symbol });
  if (!Array.isArray(result)) return [];
  return result;
}

export async function getIPOCalendar(from?: string, to?: string): Promise<IPOCalendar[]> {
  // If no dates specified, get last 30 days + next 90 days (IPOs are announced in advance)
  if (!from && !to) {
    const now = new Date();
    const past30Days = new Date(now);
    past30Days.setDate(past30Days.getDate() - 30);
    const future90Days = new Date(now);
    future90Days.setDate(future90Days.getDate() + 90);

    from = past30Days.toISOString().split('T')[0];
    to = future90Days.toISOString().split('T')[0];
  }

  const params: Record<string, any> = {};
  if (from) params.from = from;
  if (to) params.to = to;
  // ipo_calendar not available on /stable — use ipos-disclosure as fallback
  const result = await fmpStableRequest<IPOCalendar[]>('/ipos-disclosure', params);

  // Sort by date (most recent first) and limit to avoid context overflow
  return (Array.isArray(result) ? result : [])
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 20);
}

// Splits API
export async function getSplits(symbol: string): Promise<StockSplit[]> {
  return fmpStableRequest<StockSplit[]>('/splits', { symbol });
}

// Splits Calendar API
export async function getSplitsCalendar(from?: string, to?: string): Promise<StockSplit[]> {
  const params: Record<string, any> = {};
  if (from) params.from = from;
  if (to) params.to = to;
  return fmpStableRequest<StockSplit[]>('/splits-calendar', params);
}

// Dividends Company API
export async function getDividendsCompany(symbol: string): Promise<Dividend[]> {
  return fmpStableRequest<Dividend[]>('/dividends', { symbol });
}

// Dividends Calendar API
export async function getDividendsCalendar(from?: string, to?: string): Promise<Array<{ date: string; label: string; adjDividend: number; symbol: string; dividend: number; recordDate: string; paymentDate: string; declarationDate: string }>> {
  const params: Record<string, any> = {};
  if (from) params.from = from;
  if (to) params.to = to;
  return fmpStableRequest('/dividends-calendar', params);
}

// IPO Disclosures API
export async function getIPODisclosures(from?: string, to?: string): Promise<Array<{ symbol: string; cik: string; form: string; filingDate: string; acceptanceTime: string; effectivenessDate: string }>> {
  const params: Record<string, any> = {};
  if (from) params.from = from;
  if (to) params.to = to;
  return fmpStableRequest('/ipos-disclosure', params);
}

// IPO Prospectus API
export async function getIPOProspectus(from?: string, to?: string): Promise<Array<{ symbol: string; cik: string; form: string; filingDate: string; acceptedDate: string; publicOfferingPrice: number; publicOfferingPricePercentageDiscount: number; commissions: number; commissionsPercentage: number; proceedsBeforeExpenses: number }>> {
  const params: Record<string, any> = {};
  if (from) params.from = from;
  if (to) params.to = to;
  return fmpStableRequest('/ipos-prospectus', params);
}

// Latest Crowdfunding Campaigns API
export async function getLatestCrowdfundingCampaigns(page: number = 0, limit: number = 100): Promise<Array<any>> {
  return fmpStableRequest('/crowdfunding-offerings-latest', { page, limit });
}

// Search Crowdfunding Campaigns API
export async function searchCrowdfundingCampaigns(name: string): Promise<Array<any>> {
  return fmpStableRequest('/crowdfunding-offerings-search', { name });
}

// Crowdfunding By CIK API
export async function getCrowdfundingByCIK(cik: string): Promise<Array<any>> {
  return fmpStableRequest('/crowdfunding-offerings', { cik });
}

// Equity Offering Updates API
export async function getEquityOfferingUpdates(page: number = 0, limit: number = 10): Promise<Array<any>> {
  return fmpStableRequest('/fundraising-latest', { page, limit });
}

// Search Equity Offerings API
export async function searchEquityOfferings(name: string): Promise<Array<any>> {
  return fmpStableRequest('/fundraising-search', { name });
}

// Company Equity Offerings By CIK API
export async function getCompanyEquityOfferingsByCIK(cik: string): Promise<Array<any>> {
  return fmpStableRequest('/fundraising', { cik });
}

// DCF Valuation API
export async function getDCFValuation(symbol: string): Promise<Array<{ symbol: string; date: string; dcf: number; stockPrice: number }>> {
  return fmpStableRequest('/discounted-cash-flow', { symbol });
}

// Levered DCF API
export async function getLeveredDCF(symbol: string): Promise<Array<{ symbol: string; date: string; dcf: number; stockPrice: number }>> {
  return fmpStableRequest('/levered-discounted-cash-flow', { symbol });
}

// Custom DCF API
export async function getCustomDCF(symbol: string, years?: number, growthRate?: number, discountRate?: number): Promise<any> {
  const params: Record<string, any> = { symbol };
  if (years) params.years = years;
  if (growthRate) params.growthRate = growthRate;
  if (discountRate) params.discountRate = discountRate;
  return fmpStableRequest('/custom-discounted-cash-flow', params);
}

// Custom Levered DCF API
export async function getCustomLeveredDCF(symbol: string, years?: number, growthRate?: number, discountRate?: number): Promise<any> {
  const params: Record<string, any> = { symbol };
  if (years) params.years = years;
  if (growthRate) params.growthRate = growthRate;
  if (discountRate) params.discountRate = discountRate;
  return fmpStableRequest('/custom-levered-discounted-cash-flow', params);
}
