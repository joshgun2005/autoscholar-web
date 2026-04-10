import { fmpStableRequest } from './client';
import type { EarningsCalendar, EarningsSurprise, AnalystEstimate, PriceTarget, PriceTargetSummary, UpgradeDowngrade, EarningsCallTranscript, FinancialNews } from './types';

export async function getEarningsCalendar(from?: string, to?: string): Promise<EarningsCalendar[]> {
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
  const result = await fmpStableRequest<EarningsCalendar[]>('/earnings-calendar', params);

  // Sort by date (most recent first) and limit to avoid context overflow
  return result
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 15);
}

export async function getEarningsSurprises(symbol: string): Promise<EarningsSurprise[]> {
  // earnings-surprises not available on /stable — use earnings report as fallback
  const earnings = await fmpStableRequest<any[]>('/earnings', { symbol });
  return earnings.map((e: any) => ({
    date: e.date,
    symbol: e.symbol,
    actualEarningResult: e.eps,
    estimatedEarning: e.epsEstimated,
    ...e,
  }));
}

export async function getAnalystEstimates(symbol: string, period: 'annual' | 'quarter' = 'annual', limit: number = 20): Promise<AnalystEstimate[]> {
  return fmpStableRequest<AnalystEstimate[]>('/analyst-estimates', { symbol, period, limit });
}

export async function getPriceTarget(symbol: string): Promise<PriceTarget[]> {
  // price-target not available on /stable — use price-target-consensus as fallback
  const consensus = await fmpStableRequest<any[]>('/price-target-consensus', { symbol });
  return consensus as unknown as PriceTarget[];
}

export async function getPriceTargetSummary(symbol: string): Promise<PriceTargetSummary> {
  return fmpStableRequest<PriceTargetSummary>('/price-target-summary', { symbol });
}

export async function getUpgradesDowngrades(symbol: string): Promise<UpgradeDowngrade[]> {
  // upgrades-downgrades not available on /stable — use grades as fallback
  return fmpStableRequest<UpgradeDowngrade[]>('/grades', { symbol, limit: 50 });
}

// Price Target Consensus API
export async function getPriceTargetConsensus(symbol: string): Promise<Array<{ symbol: string; targetHigh: number; targetLow: number; targetConsensus: number; targetMedian: number }>> {
  return fmpStableRequest('/price-target-consensus', { symbol });
}

// Grades API
export async function getGrades(symbol: string, limit: number = 100): Promise<Array<{ symbol: string; date: string; gradingCompany: string; previousGrade: string; newGrade: string; action: string }>> {
  return fmpStableRequest('/grades', { symbol, limit });
}

// Historical Grades API
export async function getHistoricalGrades(symbol: string, limit: number = 100): Promise<Array<any>> {
  return fmpStableRequest('/grades-historical', { symbol, limit });
}

// Grades Summary API
export async function getGradesSummary(symbol: string): Promise<Array<{ symbol: string; strongBuy: number; buy: number; hold: number; sell: number; strongSell: number; consensus: string }>> {
  return fmpStableRequest('/grades-consensus', { symbol });
}

// Earnings Report API
export async function getEarningsReport(symbol: string): Promise<Array<{ date: string; symbol: string; eps: number; epsEstimated: number; time: string; revenue: number; revenueEstimated: number }>> {
  return fmpStableRequest('/earnings', { symbol });
}

// Latest Earning Transcripts API
export async function getLatestEarningTranscripts(): Promise<Array<{ symbol: string; quarter: number; year: number; date: string }>> {
  return fmpStableRequest('/earning-call-transcript-latest');
}

// Earning Call Transcript Dates API
export async function getEarningCallTranscriptDates(symbol: string): Promise<Array<{ symbol: string; quarter: number; year: number; date: string }>> {
  return fmpStableRequest('/earning-call-transcript-dates', { symbol });
}

// Earnings Call Transcript
export async function getEarningsCallTranscript(symbol: string, year: number, quarter: number): Promise<EarningsCallTranscript[]> {
  return fmpStableRequest<EarningsCallTranscript[]>('/earning-call-transcript', { symbol, quarter, year });
}

// Ratings Snapshot API
export async function getRatingsSnapshot(symbol: string): Promise<Array<{ symbol: string; date: string; rating: string; ratingScore: number; ratingRecommendation: string; ratingDetailsDCFScore: number; ratingDetailsDCFRecommendation: string; ratingDetailsROEScore: number; ratingDetailsROERecommendation: string; ratingDetailsROAScore: number; ratingDetailsROARecommendation: string; ratingDetailsDEScore: number; ratingDetailsDERecommendation: string; ratingDetailsPEScore: number; ratingDetailsPERecommendation: string; ratingDetailsPBScore: number; ratingDetailsPBRecommendation: string }>> {
  return fmpStableRequest('/ratings-snapshot', { symbol });
}

// Historical Ratings API
export async function getHistoricalRatings(symbol: string, limit: number = 100): Promise<Array<any>> {
  return fmpStableRequest('/ratings-historical', { symbol, limit });
}
