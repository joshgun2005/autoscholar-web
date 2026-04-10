import { fmpStableRequest } from './client';
import type { CompanyProfile, IncomeStatement, BalanceSheet, CashFlowStatement, KeyMetrics, FinancialRatios, PriceTargetSummary } from './types';

// Profile Bulk API
export async function getProfileBulk(part: number = 0): Promise<CompanyProfile[]> {
  return fmpStableRequest<CompanyProfile[]>('/profile-bulk', { part });
}

// Rating Bulk API
export async function getRatingBulk(): Promise<Array<{ symbol: string; date: string; rating: string; ratingScore: number; ratingRecommendation: string }>> {
  return fmpStableRequest('/rating-bulk');
}

// DCF Bulk API
export async function getDCFBulk(): Promise<Array<{ symbol: string; date: string; dcf: number; stockPrice: number }>> {
  return fmpStableRequest('/dcf-bulk');
}

// Scores Bulk API
export async function getScoresBulk(): Promise<Array<any>> {
  return fmpStableRequest('/scores-bulk');
}

// Price Target Summary Bulk API
export async function getPriceTargetSummaryBulk(): Promise<PriceTargetSummary[]> {
  return fmpStableRequest<PriceTargetSummary[]>('/price-target-summary-bulk');
}

// ETF Holder Bulk API
export async function getETFHolderBulk(part: number = 1): Promise<Array<any>> {
  return fmpStableRequest('/etf-holder-bulk', { part });
}

// Upgrades Downgrades Consensus Bulk API
export async function getUpgradesDowngradesConsensusBulk(): Promise<Array<any>> {
  return fmpStableRequest('/upgrades-downgrades-consensus-bulk');
}

// Key Metrics TTM Bulk API
export async function getKeyMetricsTTMBulk(): Promise<KeyMetrics[]> {
  return fmpStableRequest<KeyMetrics[]>('/key-metrics-ttm-bulk');
}

// Ratios TTM Bulk API
export async function getRatiosTTMBulk(): Promise<FinancialRatios[]> {
  return fmpStableRequest<FinancialRatios[]>('/ratios-ttm-bulk');
}

// Stock Peers Bulk API
export async function getStockPeersBulk(): Promise<Array<{ symbol: string; peersList: string[] }>> {
  return fmpStableRequest('/peers-bulk');
}

// Earnings Surprises Bulk API
export async function getEarningsSurprisesBulk(year: number): Promise<Array<any>> {
  return fmpStableRequest('/earnings-surprises-bulk', { year });
}

// Bulk Income Statement API
export async function getBulkIncomeStatement(year: number, period: 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'FY'): Promise<IncomeStatement[]> {
  return fmpStableRequest<IncomeStatement[]>('/income-statement-bulk', { year, period });
}

// Bulk Income Statement Growth API
export async function getBulkIncomeStatementGrowth(year: number, period: 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'FY'): Promise<Array<any>> {
  return fmpStableRequest('/income-statement-growth-bulk', { year, period });
}

// Bulk Balance Sheet API
export async function getBulkBalanceSheet(year: number, period: 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'FY'): Promise<BalanceSheet[]> {
  return fmpStableRequest<BalanceSheet[]>('/balance-sheet-statement-bulk', { year, period });
}

// Bulk Balance Sheet Growth API
export async function getBulkBalanceSheetGrowth(year: number, period: 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'FY'): Promise<Array<any>> {
  return fmpStableRequest('/balance-sheet-statement-growth-bulk', { year, period });
}

// Bulk Cash Flow Statement API
export async function getBulkCashFlowStatement(year: number, period: 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'FY'): Promise<CashFlowStatement[]> {
  return fmpStableRequest<CashFlowStatement[]>('/cash-flow-statement-bulk', { year, period });
}

// Bulk Cash Flow Statement Growth API
export async function getBulkCashFlowStatementGrowth(year: number, period: 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'FY'): Promise<Array<any>> {
  return fmpStableRequest('/cash-flow-statement-growth-bulk', { year, period });
}

// EOD Bulk API
export async function getEODBulk(date: string): Promise<Array<{ symbol: string; date: string; open: number; high: number; low: number; close: number; adjClose: number; volume: number }>> {
  return fmpStableRequest('/eod-bulk', { date });
}

// Latest Financial Statements API
export async function getLatestFinancialStatements(page: number = 0, limit: number = 250): Promise<Array<{ symbol: string; date: string }>> {
  return fmpStableRequest('/latest-financial-statements', { page, limit });
}
