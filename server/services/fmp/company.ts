import { fmpStableRequest } from './client';
import type { CompanyProfile, IncomeStatement, BalanceSheet, CashFlowStatement, KeyMetrics, FinancialRatios, FinancialGrowth, CompanyOutlook } from './types';

export async function getCompanyProfile(symbol: string): Promise<CompanyProfile[]> {
  return fmpStableRequest<CompanyProfile[]>('/profile', { symbol });
}

export async function getIncomeStatement(symbol: string, period: 'annual' | 'quarter' = 'annual', limit: number = 20): Promise<IncomeStatement[]> {
  return fmpStableRequest<IncomeStatement[]>('/income-statement', { symbol, period, limit });
}

export async function getBalanceSheet(symbol: string, period: 'annual' | 'quarter' = 'annual', limit: number = 20): Promise<BalanceSheet[]> {
  return fmpStableRequest<BalanceSheet[]>('/balance-sheet-statement', { symbol, period, limit });
}

export async function getCashFlowStatement(symbol: string, period: 'annual' | 'quarter' = 'annual', limit: number = 20): Promise<CashFlowStatement[]> {
  return fmpStableRequest<CashFlowStatement[]>('/cash-flow-statement', { symbol, period, limit });
}

export async function getKeyMetrics(symbol: string, period: 'annual' | 'quarter' = 'annual', limit: number = 20): Promise<KeyMetrics[]> {
  return fmpStableRequest<KeyMetrics[]>('/key-metrics', { symbol, period, limit });
}

export async function getFinancialRatios(symbol: string, period: 'annual' | 'quarter' = 'annual', limit: number = 20): Promise<FinancialRatios[]> {
  return fmpStableRequest<FinancialRatios[]>('/ratios', { symbol, period, limit });
}

export async function getFinancialGrowth(symbol: string, period: 'annual' | 'quarter' = 'annual', limit: number = 20): Promise<FinancialGrowth[]> {
  return fmpStableRequest<FinancialGrowth[]>('/financial-growth', { symbol, period, limit });
}

export async function getCompanyOutlook(symbol: string): Promise<CompanyOutlook> {
  // company-outlook not available on /stable — aggregate from profile + key-metrics
  const [profiles, metrics] = await Promise.all([
    fmpStableRequest<CompanyProfile[]>('/profile', { symbol }),
    fmpStableRequest<KeyMetrics[]>('/key-metrics', { symbol, period: 'annual', limit: 1 }),
  ]);
  return { profile: profiles?.[0], metrics: metrics } as unknown as CompanyOutlook;
}

// Income Statement TTM API
export async function getIncomeStatementTTM(symbol: string): Promise<IncomeStatement[]> {
  return fmpStableRequest<IncomeStatement[]>('/income-statement-ttm', { symbol });
}

// Balance Sheet TTM API
export async function getBalanceSheetTTM(symbol: string): Promise<BalanceSheet[]> {
  return fmpStableRequest<BalanceSheet[]>('/balance-sheet-statement-ttm', { symbol });
}

// Cash Flow Statement TTM API
export async function getCashflowStatementTTM(symbol: string): Promise<CashFlowStatement[]> {
  return fmpStableRequest<CashFlowStatement[]>('/cash-flow-statement-ttm', { symbol });
}

// Key Metrics TTM API
export async function getKeyMetricsTTM(symbol: string): Promise<KeyMetrics[]> {
  return fmpStableRequest<KeyMetrics[]>('/key-metrics-ttm', { symbol });
}

// Ratios TTM API
export async function getRatiosTTM(symbol: string): Promise<FinancialRatios[]> {
  return fmpStableRequest<FinancialRatios[]>('/ratios-ttm', { symbol });
}

// Financial Scores API
export async function getFinancialScores(symbol: string): Promise<Array<{ symbol: string; altmanZScore: number; piotroskiScore: number; workingCapital: number; totalAssets: number; retainedEarnings: number; ebit: number; marketCap: number; totalLiabilities: number; revenue: number }>> {
  return fmpStableRequest('/financial-scores', { symbol });
}

// Owner Earnings API
export async function getOwnerEarnings(symbol: string): Promise<Array<{ symbol: string; date: string; averagePPE: number; maintenanceCapex: number; ownersEarnings: number; growthCapex: number; ownersEarningsPerShare: number }>> {
  return fmpStableRequest('/owner-earnings', { symbol });
}

// Enterprise Values API
export async function getEnterpriseValues(symbol: string, period: 'annual' | 'quarter' = 'annual', limit: number = 20): Promise<Array<{ symbol: string; date: string; stockPrice: number; numberOfShares: number; marketCapitalization: number; minusCashAndCashEquivalents: number; addTotalDebt: number; enterpriseValue: number }>> {
  return fmpStableRequest('/enterprise-values', { symbol, period, limit });
}

// Financial Reports Dates API
export async function getFinancialReportsDates(symbol: string): Promise<Array<{ symbol: string; period: string; linkXlsx: string; linkJson: string }>> {
  return fmpStableRequest('/financial-reports-dates', { symbol });
}

// Annual Reports 10K JSON API
export async function getAnnualReports10K(symbol: string, year: number, period: string): Promise<any> {
  return fmpStableRequest('/financial-reports-json', { symbol, year, period });
}

// Annual Reports 10K XLSX API
export async function getAnnualReports10KXLSX(symbol: string, year: number, period: string): Promise<any> {
  return fmpStableRequest('/financial-reports-xlsx', { symbol, year, period });
}

// Revenue Product Segmentation API
export async function getRevenueProductSegmentation(symbol: string, period: 'annual' | 'quarter' = 'annual'): Promise<Array<any>> {
  return fmpStableRequest('/revenue-product-segmentation', { symbol, period });
}

// Revenue Geographic Segmentation API
export async function getRevenueGeographicSegmentation(symbol: string, period: 'annual' | 'quarter' = 'annual'): Promise<Array<any>> {
  return fmpStableRequest('/revenue-geographic-segmentation', { symbol, period });
}

// Income Statement As Reported API
export async function getIncomeStatementAsReported(symbol: string, period: 'annual' | 'quarter' = 'annual', limit: number = 20): Promise<Array<any>> {
  return fmpStableRequest('/income-statement-as-reported', { symbol, period, limit });
}

// Balance Sheet As Reported API
export async function getBalanceSheetAsReported(symbol: string, period: 'annual' | 'quarter' = 'annual', limit: number = 20): Promise<Array<any>> {
  return fmpStableRequest('/balance-sheet-statement-as-reported', { symbol, period, limit });
}

// Cash Flow As Reported API
export async function getCashFlowAsReported(symbol: string, period: 'annual' | 'quarter' = 'annual', limit: number = 20): Promise<Array<any>> {
  return fmpStableRequest('/cash-flow-statement-as-reported', { symbol, period, limit });
}

// Full Financial Statement As Reported API
export async function getFullFinancialStatementAsReported(symbol: string, period: 'annual' | 'quarter' = 'annual'): Promise<any> {
  return fmpStableRequest('/financial-statement-full-as-reported', { symbol, period });
}
