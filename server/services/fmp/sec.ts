import { fmpStableRequest } from './client';
import type { SECFiling, CompanyNote, InstitutionalHolder } from './types';

export async function getSECFilings(symbol: string, type?: string, limit: number = 20): Promise<SECFiling[]> {
  // Limit to 20 filings to avoid context overflow
  const actualLimit = Math.min(limit, 20);
  // sec_filings not available on /stable — use sec-filings-search/symbol
  const params: Record<string, any> = { symbol, limit: actualLimit };
  if (type) params.formType = type;
  return fmpStableRequest<SECFiling[]>('/sec-filings-search/symbol', params);
}

export async function getCompanyNotes(symbol: string): Promise<CompanyNote[]> {
  return fmpStableRequest<CompanyNote[]>('/company-notes', { symbol });
}

// Employee Count API
export async function getEmployeeCount(symbol: string): Promise<Array<{ symbol: string; cik: string; acceptanceTime: string; periodOfReport: string; companyName: string; formType: string; filingDate: string; employeeCount: number; source: string }>> {
  return fmpStableRequest('/employee-count', { symbol });
}

// Historical Employee Count API
export async function getHistoricalEmployeeCount(symbol: string): Promise<Array<{ symbol: string; cik: string; acceptanceTime: string; periodOfReport: string; companyName: string; formType: string; filingDate: string; employeeCount: number; source: string }>> {
  return fmpStableRequest('/historical-employee-count', { symbol });
}

// Market Capitalization API
export async function getMarketCapitalization(symbol: string): Promise<Array<{ symbol: string; date: string; marketCap: number }>> {
  return fmpStableRequest('/market-capitalization', { symbol });
}

// Batch Market Capitalization API
export async function getBatchMarketCapitalization(symbols: string): Promise<Array<{ symbol: string; marketCap: number }>> {
  return fmpStableRequest('/market-capitalization-batch', { symbols });
}

// Historical Market Capitalization API
export async function getHistoricalMarketCapitalization(symbol: string, limit: number = 100): Promise<Array<{ symbol: string; date: string; marketCap: number }>> {
  return fmpStableRequest('/historical-market-capitalization', { symbol, limit });
}

// Shares Float API
export async function getSharesFloat(symbol: string): Promise<Array<{ symbol: string; date: string; freeFloat: number; floatShares: number; outstandingShares: number; source: string }>> {
  return fmpStableRequest('/shares-float', { symbol });
}

// All Shares Float API
export async function getAllSharesFloat(page: number = 0, limit: number = 1000): Promise<Array<{ symbol: string; date: string; freeFloat: number; floatShares: number; outstandingShares: number }>> {
  return fmpStableRequest('/shares-float-all', { page, limit });
}

// Key Executives API
export async function getKeyExecutives(symbol: string): Promise<Array<{ title: string; name: string; pay: number; currencyPay: string; gender: string; yearBorn: number; titleSince: string }>> {
  return fmpStableRequest('/key-executives', { symbol });
}

// Executive Compensation API
export async function getExecutiveCompensation(symbol: string): Promise<Array<{ cik: string; symbol: string; companyName: string; filingDate: string; acceptedDate: string; nameAndPosition: string; year: number; salary: number; bonus: number; stockAward: number; incentivePlanCompensation: number; allOtherCompensation: number; total: number; url: string }>> {
  return fmpStableRequest('/governance-executive-compensation', { symbol });
}

// Executive Compensation Benchmark API
export async function getExecutiveCompensationBenchmark(year?: number): Promise<Array<{ industryTitle: string; year: number; averageSalary: number; averageBonus: number; averageStockAward: number; averageIncentivePlanCompensation: number; averageTotalCompensation: number; averageAllOtherCompensation: number }>> {
  const params: Record<string, any> = {};
  if (year) params.year = year;
  return fmpStableRequest('/executive-compensation-benchmark', params);
}

// Latest Mergers and Acquisitions API
export async function getLatestMergersAcquisitions(page: number = 0, limit: number = 100): Promise<Array<{ targetedCompany: string; acquiringCompany: string; transactionDate: string; acceptanceTime: string }>> {
  return fmpStableRequest('/mergers-acquisitions-latest', { page, limit });
}

// Search Mergers and Acquisitions API
export async function searchMergersAcquisitions(name: string): Promise<Array<{ targetedCompany: string; acquiringCompany: string; transactionDate: string; acceptanceTime: string }>> {
  return fmpStableRequest('/mergers-acquisitions-search', { name });
}

// Institutional Holders
export async function getInstitutionalHolders(symbol: string): Promise<InstitutionalHolder[]> {
  // institutional-holder not available on /stable — use ownership extract as fallback
  const now = new Date();
  const year = now.getFullYear();
  const quarter = Math.ceil((now.getMonth() + 1) / 3);
  return fmpStableRequest<InstitutionalHolder[]>('/institutional-ownership/extract-analytics/holder', { symbol, year: year - 1, quarter, limit: 50 });
}

// Institutional Ownership Filings API
export async function getInstitutionalOwnershipFilings(page: number = 0, limit: number = 100): Promise<Array<any>> {
  return fmpStableRequest('/institutional-ownership/latest', { page, limit });
}

// SEC Filings Extract API
export async function extractSECFilings(cik: string, year: number, quarter: number): Promise<Array<any>> {
  return fmpStableRequest('/institutional-ownership/extract', { cik, year, quarter });
}

// Form 13F Filings Dates API
export async function getForm13FFilingsDates(cik: string): Promise<Array<{ cik: string; date: string; year: number; quarter: number }>> {
  return fmpStableRequest('/institutional-ownership/dates', { cik });
}

// Filings Extract With Analytics By Holder API
export async function getFilingsExtractWithAnalytics(symbol: string, year: number, quarter: number, page: number = 0, limit: number = 10): Promise<Array<any>> {
  return fmpStableRequest('/institutional-ownership/extract-analytics/holder', { symbol, year, quarter, page, limit });
}

// Holder Performance Summary API
export async function getHolderPerformanceSummary(cik: string, page: number = 0): Promise<Array<any>> {
  return fmpStableRequest('/institutional-ownership/holder-performance-summary', { cik, page });
}

// Holders Industry Breakdown API
export async function getHoldersIndustryBreakdown(cik: string, year: number, quarter: number): Promise<Array<any>> {
  return fmpStableRequest('/institutional-ownership/holder-industry-breakdown', { cik, year, quarter });
}

// Positions Summary API
export async function getPositionsSummary(symbol: string, year: number, quarter: number): Promise<Array<any>> {
  return fmpStableRequest('/institutional-ownership/symbol-positions-summary', { symbol, year, quarter });
}

// Industry Performance Summary API
export async function getIndustryPerformanceSummary(year: number, quarter: number): Promise<Array<any>> {
  return fmpStableRequest('/institutional-ownership/industry-summary', { year, quarter });
}

// Latest 8-K SEC Filings API
export async function getLatest8KSECFilings(from?: string, to?: string, page: number = 0, limit: number = 100): Promise<Array<SECFiling>> {
  const params: Record<string, any> = { page, limit };
  if (from) params.from = from;
  if (to) params.to = to;
  return fmpStableRequest<SECFiling[]>('/sec-filings-8k', params);
}

// Latest SEC Filings API
export async function getLatestSECFilings(from?: string, to?: string, page: number = 0, limit: number = 100): Promise<Array<SECFiling>> {
  const params: Record<string, any> = { page, limit };
  if (from) params.from = from;
  if (to) params.to = to;
  return fmpStableRequest<SECFiling[]>('/sec-filings-financials', params);
}

// SEC Filings By Form Type API
export async function getSECFilingsByFormType(formType: string, from?: string, to?: string, page: number = 0, limit: number = 100): Promise<Array<SECFiling>> {
  const params: Record<string, any> = { formType, page, limit };
  if (from) params.from = from;
  if (to) params.to = to;
  return fmpStableRequest<SECFiling[]>('/sec-filings-search/form-type', params);
}

// SEC Filings By Symbol API
export async function getSECFilingsBySymbol(symbol: string, from?: string, to?: string, page: number = 0, limit: number = 100): Promise<Array<SECFiling>> {
  const params: Record<string, any> = { symbol, page, limit };
  if (from) params.from = from;
  if (to) params.to = to;
  return fmpStableRequest<SECFiling[]>('/sec-filings-search/symbol', params);
}

// SEC Filings By CIK API
export async function getSECFilingsByCIK(cik: string, from?: string, to?: string, page: number = 0, limit: number = 100): Promise<Array<SECFiling>> {
  const params: Record<string, any> = { cik, page, limit };
  if (from) params.from = from;
  if (to) params.to = to;
  return fmpStableRequest<SECFiling[]>('/sec-filings-search/cik', params);
}

// SEC Filings By Name API
export async function getSECFilingsByName(company: string): Promise<Array<{ cik: string; name: string }>> {
  return fmpStableRequest('/sec-filings-company-search/name', { company });
}

// SEC Filings Company Search By Symbol API
export async function getSECFilingsCompanySearchBySymbol(symbol: string): Promise<Array<{ cik: string; name: string; symbol: string }>> {
  return fmpStableRequest('/sec-filings-company-search/symbol', { symbol });
}

// SEC Filings Company Search By CIK API
export async function getSECFilingsCompanySearchByCIK(cik: string): Promise<Array<{ cik: string; name: string }>> {
  return fmpStableRequest('/sec-filings-company-search/cik', { cik });
}

// SEC Company Full Profile API
export async function getSECCompanyFullProfile(symbol: string): Promise<any> {
  return fmpStableRequest('/sec-profile', { symbol });
}

// Industry Classification List API
export async function getIndustryClassificationList(): Promise<Array<{ sicCode: string; office: string; industryTitle: string }>> {
  return fmpStableRequest('/standard-industrial-classification-list');
}

// Industry Classification Search API
export async function searchIndustryClassification(industryTitle?: string, sicCode?: string): Promise<Array<any>> {
  const params: Record<string, any> = {};
  if (industryTitle) params.industryTitle = industryTitle;
  if (sicCode) params.sicCode = sicCode;
  return fmpStableRequest('/industry-classification-search', params);
}

// All Industry Classification API
export async function getAllIndustryClassification(): Promise<Array<any>> {
  return fmpStableRequest('/all-industry-classification');
}
