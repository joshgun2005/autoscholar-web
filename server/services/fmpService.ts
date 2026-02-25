import axios from 'axios';

const FMP_API_KEY = process.env.FMP_API_KEY;
const FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3';
const FMP_V4_URL = 'https://financialmodelingprep.com/api/v4';

interface FMPResponse<T> {
  data: T;
  error?: string;
}

export interface CompanyProfile {
  symbol: string;
  companyName: string;
  currency: string;
  cik: string;
  isin: string;
  cusip: string;
  exchange: string;
  exchangeShortName: string;
  industry: string;
  website: string;
  description: string;
  ceo: string;
  sector: string;
  country: string;
  fullTimeEmployees: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  dcfDiff: number;
  dcf: number;
  image: string;
  ipoDate: string;
  defaultImage: boolean;
  isEtf: boolean;
  isActivelyTrading: boolean;
  isAdr: boolean;
  isFund: boolean;
  price: number;
  beta: number;
  volAvg: number;
  mktCap: number;
  lastDiv: number;
  range: string;
  changes: number;
}

export interface IncomeStatement {
  date: string;
  symbol: string;
  reportedCurrency: string;
  cik: string;
  fillingDate: string;
  acceptedDate: string;
  calendarYear: string;
  period: string;
  revenue: number;
  costOfRevenue: number;
  grossProfit: number;
  grossProfitRatio: number;
  researchAndDevelopmentExpenses: number;
  generalAndAdministrativeExpenses: number;
  sellingAndMarketingExpenses: number;
  sellingGeneralAndAdministrativeExpenses: number;
  otherExpenses: number;
  operatingExpenses: number;
  costAndExpenses: number;
  interestIncome: number;
  interestExpense: number;
  depreciationAndAmortization: number;
  ebitda: number;
  ebitdaratio: number;
  operatingIncome: number;
  operatingIncomeRatio: number;
  totalOtherIncomeExpensesNet: number;
  incomeBeforeTax: number;
  incomeBeforeTaxRatio: number;
  incomeTaxExpense: number;
  netIncome: number;
  netIncomeRatio: number;
  eps: number;
  epsdiluted: number;
  weightedAverageShsOut: number;
  weightedAverageShsOutDil: number;
  link: string;
  finalLink: string;
}

export interface BalanceSheet {
  date: string;
  symbol: string;
  reportedCurrency: string;
  cik: string;
  fillingDate: string;
  acceptedDate: string;
  calendarYear: string;
  period: string;
  cashAndCashEquivalents: number;
  shortTermInvestments: number;
  cashAndShortTermInvestments: number;
  netReceivables: number;
  inventory: number;
  otherCurrentAssets: number;
  totalCurrentAssets: number;
  propertyPlantEquipmentNet: number;
  goodwill: number;
  intangibleAssets: number;
  goodwillAndIntangibleAssets: number;
  longTermInvestments: number;
  taxAssets: number;
  otherNonCurrentAssets: number;
  totalNonCurrentAssets: number;
  otherAssets: number;
  totalAssets: number;
  accountPayables: number;
  shortTermDebt: number;
  taxPayables: number;
  deferredRevenue: number;
  otherCurrentLiabilities: number;
  totalCurrentLiabilities: number;
  longTermDebt: number;
  deferredRevenueNonCurrent: number;
  deferredTaxLiabilitiesNonCurrent: number;
  otherNonCurrentLiabilities: number;
  totalNonCurrentLiabilities: number;
  otherLiabilities: number;
  capitalLeaseObligations: number;
  totalLiabilities: number;
  preferredStock: number;
  commonStock: number;
  retainedEarnings: number;
  accumulatedOtherComprehensiveIncomeLoss: number;
  othertotalStockholdersEquity: number;
  totalStockholdersEquity: number;
  totalEquity: number;
  totalLiabilitiesAndStockholdersEquity: number;
  minorityInterest: number;
  totalLiabilitiesAndTotalEquity: number;
  totalInvestments: number;
  totalDebt: number;
  netDebt: number;
  link: string;
  finalLink: string;
}

export interface CashFlowStatement {
  date: string;
  symbol: string;
  reportedCurrency: string;
  cik: string;
  fillingDate: string;
  acceptedDate: string;
  calendarYear: string;
  period: string;
  netIncome: number;
  depreciationAndAmortization: number;
  deferredIncomeTax: number;
  stockBasedCompensation: number;
  changeInWorkingCapital: number;
  accountsReceivables: number;
  inventory: number;
  accountsPayables: number;
  otherWorkingCapital: number;
  otherNonCashItems: number;
  netCashProvidedByOperatingActivities: number;
  investmentsInPropertyPlantAndEquipment: number;
  acquisitionsNet: number;
  purchasesOfInvestments: number;
  salesMaturitiesOfInvestments: number;
  otherInvestingActivites: number;
  netCashUsedForInvestingActivites: number;
  debtRepayment: number;
  commonStockIssued: number;
  commonStockRepurchased: number;
  dividendsPaid: number;
  otherFinancingActivites: number;
  netCashUsedProvidedByFinancingActivities: number;
  effectOfForexChangesOnCash: number;
  netChangeInCash: number;
  cashAtEndOfPeriod: number;
  cashAtBeginningOfPeriod: number;
  operatingCashFlow: number;
  capitalExpenditure: number;
  freeCashFlow: number;
  link: string;
  finalLink: string;
}

export interface KeyMetrics {
  symbol: string;
  date: string;
  calendarYear: string;
  period: string;
  revenuePerShare: number;
  netIncomePerShare: number;
  operatingCashFlowPerShare: number;
  freeCashFlowPerShare: number;
  cashPerShare: number;
  bookValuePerShare: number;
  tangibleBookValuePerShare: number;
  shareholdersEquityPerShare: number;
  interestDebtPerShare: number;
  marketCap: number;
  enterpriseValue: number;
  peRatio: number;
  priceToSalesRatio: number;
  pocfratio: number;
  pfcfRatio: number;
  pbRatio: number;
  ptbRatio: number;
  evToSales: number;
  enterpriseValueOverEBITDA: number;
  evToOperatingCashFlow: number;
  evToFreeCashFlow: number;
  earningsYield: number;
  freeCashFlowYield: number;
  debtToEquity: number;
  debtToAssets: number;
  netDebtToEBITDA: number;
  currentRatio: number;
  interestCoverage: number;
  incomeQuality: number;
  dividendYield: number;
  payoutRatio: number;
  salesGeneralAndAdministrativeToRevenue: number;
  researchAndDdevelopementToRevenue: number;
  intangiblesToTotalAssets: number;
  capexToOperatingCashFlow: number;
  capexToRevenue: number;
  capexToDepreciation: number;
  stockBasedCompensationToRevenue: number;
  grahamNumber: number;
  roic: number;
  returnOnTangibleAssets: number;
  grahamNetNet: number;
  workingCapital: number;
  tangibleAssetValue: number;
  netCurrentAssetValue: number;
  investedCapital: number;
  averageReceivables: number;
  averagePayables: number;
  averageInventory: number;
  daysSalesOutstanding: number;
  daysPayablesOutstanding: number;
  daysOfInventoryOnHand: number;
  receivablesTurnover: number;
  payablesTurnover: number;
  inventoryTurnover: number;
  roe: number;
  capexPerShare: number;
}

export interface FinancialRatios {
  symbol: string;
  date: string;
  calendarYear: string;
  period: string;
  currentRatio: number;
  quickRatio: number;
  cashRatio: number;
  daysOfSalesOutstanding: number;
  daysOfInventoryOutstanding: number;
  operatingCycle: number;
  daysOfPayablesOutstanding: number;
  cashConversionCycle: number;
  grossProfitMargin: number;
  operatingProfitMargin: number;
  pretaxProfitMargin: number;
  netProfitMargin: number;
  effectiveTaxRate: number;
  returnOnAssets: number;
  returnOnEquity: number;
  returnOnCapitalEmployed: number;
  netIncomePerEBT: number;
  ebtPerEbit: number;
  ebitPerRevenue: number;
  debtRatio: number;
  debtEquityRatio: number;
  longTermDebtToCapitalization: number;
  totalDebtToCapitalization: number;
  interestCoverage: number;
  cashFlowToDebtRatio: number;
  companyEquityMultiplier: number;
  receivablesTurnover: number;
  payablesTurnover: number;
  inventoryTurnover: number;
  fixedAssetTurnover: number;
  assetTurnover: number;
  operatingCashFlowPerShare: number;
  freeCashFlowPerShare: number;
  cashPerShare: number;
  payoutRatio: number;
  operatingCashFlowSalesRatio: number;
  freeCashFlowOperatingCashFlowRatio: number;
  cashFlowCoverageRatios: number;
  shortTermCoverageRatios: number;
  capitalExpenditureCoverageRatio: number;
  dividendPaidAndCapexCoverageRatio: number;
  dividendPayoutRatio: number;
  priceBookValueRatio: number;
  priceToBookRatio: number;
  priceToSalesRatio: number;
  priceEarningsRatio: number;
  priceToFreeCashFlowsRatio: number;
  priceToOperatingCashFlowsRatio: number;
  priceCashFlowRatio: number;
  priceEarningsToGrowthRatio: number;
  priceSalesRatio: number;
  dividendYield: number;
  enterpriseValueMultiple: number;
  priceFairValue: number;
}

export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  changesPercentage: number;
  change: number;
  dayLow: number;
  dayHigh: number;
  yearHigh: number;
  yearLow: number;
  marketCap: number;
  priceAvg50: number;
  priceAvg200: number;
  exchange: string;
  volume: number;
  avgVolume: number;
  open: number;
  previousClose: number;
  eps: number;
  pe: number;
  earningsAnnouncement: string;
  sharesOutstanding: number;
  timestamp: number;
}

export interface HistoricalPrice {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  adjClose: number;
  volume: number;
  unadjustedVolume: number;
  change: number;
  changePercent: number;
  vwap: number;
  label: string;
  changeOverTime: number;
}

export interface FinancialNews {
  symbol: string;
  publishedDate: string;
  title: string;
  image: string;
  site: string;
  text: string;
  url: string;
}

async function fmpRequest<T>(endpoint: string, params: Record<string, any> = {}): Promise<T> {
  if (!FMP_API_KEY) {
    throw new Error('FMP_API_KEY not configured');
  }

  try {
    const response = await axios.get(`${FMP_BASE_URL}${endpoint}`, {
      params: {
        ...params,
        apikey: FMP_API_KEY,
      },
      timeout: 15000,
    });

    return response.data;
  } catch (error) {
    console.error(`FMP API error for ${endpoint}:`, error);
    throw new Error(`Failed to fetch from FMP: ${(error as Error).message}`);
  }
}

async function fmpV4Request<T>(endpoint: string, params: Record<string, any> = {}): Promise<T> {
  if (!FMP_API_KEY) {
    throw new Error('FMP_API_KEY not configured');
  }

  try {
    const response = await axios.get(`${FMP_V4_URL}${endpoint}`, {
      params: {
        ...params,
        apikey: FMP_API_KEY,
      },
      timeout: 15000,
    });

    return response.data;
  } catch (error) {
    console.error(`FMP API error for ${endpoint}:`, error);
    throw new Error(`Failed to fetch from FMP: ${(error as Error).message}`);
  }
}

export async function getCompanyProfile(symbol: string): Promise<CompanyProfile[]> {
  return fmpRequest<CompanyProfile[]>(`/profile/${symbol}`);
}

export async function getIncomeStatement(symbol: string, period: 'annual' | 'quarter' = 'annual', limit: number = 5): Promise<IncomeStatement[]> {
  return fmpRequest<IncomeStatement[]>(`/income-statement/${symbol}`, { period, limit });
}

export async function getBalanceSheet(symbol: string, period: 'annual' | 'quarter' = 'annual', limit: number = 5): Promise<BalanceSheet[]> {
  return fmpRequest<BalanceSheet[]>(`/balance-sheet-statement/${symbol}`, { period, limit });
}

export async function getCashFlowStatement(symbol: string, period: 'annual' | 'quarter' = 'annual', limit: number = 5): Promise<CashFlowStatement[]> {
  return fmpRequest<CashFlowStatement[]>(`/cash-flow-statement/${symbol}`, { period, limit });
}

export async function getKeyMetrics(symbol: string, period: 'annual' | 'quarter' = 'annual', limit: number = 5): Promise<KeyMetrics[]> {
  return fmpRequest<KeyMetrics[]>(`/key-metrics/${symbol}`, { period, limit });
}

export async function getFinancialRatios(symbol: string, period: 'annual' | 'quarter' = 'annual', limit: number = 5): Promise<FinancialRatios[]> {
  return fmpRequest<FinancialRatios[]>(`/ratios/${symbol}`, { period, limit });
}

export async function getStockQuote(symbol: string): Promise<StockQuote[]> {
  return fmpRequest<StockQuote[]>(`/quote/${symbol}`);
}

export async function getHistoricalPrice(symbol: string, from?: string, to?: string): Promise<{ symbol: string; historical: HistoricalPrice[] }> {
  const params: Record<string, any> = {};
  if (from) params.from = from;
  // If 'to' is not provided, default to today's date to ensure current data
  if (to) {
    params.to = to;
  } else {
    params.to = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  }
  const result = await fmpRequest<{ symbol: string; historical: HistoricalPrice[] }>(`/historical-price-full/${symbol}`, params);

  // Limit to 504 most recent data points (2 years) for Monte Carlo simulations
  // This provides enough data for robust statistical analysis while staying within reasonable context limits
  // The tool result truncation in routes.ts will further limit if needed
  if (result.historical && result.historical.length > 504) {
    result.historical = result.historical.slice(0, 504);
  }

  return result;
}

export async function getFinancialNews(symbol?: string, limit: number = 5): Promise<FinancialNews[]> {
  // Limit to 5 articles to avoid context overflow
  const actualLimit = Math.min(limit, 5);
  if (symbol) {
    return fmpRequest<FinancialNews[]>(`/stock_news`, { tickers: symbol, limit: actualLimit });
  }
  return fmpRequest<FinancialNews[]>(`/stock_news`, { limit: actualLimit });
}

export async function searchCompanies(query: string, limit: number = 10): Promise<Array<{ symbol: string; name: string; currency: string; stockExchange: string; exchangeShortName: string }>> {
  return fmpRequest(`/search`, { query, limit });
}

export async function getStockPeers(symbol: string): Promise<string[]> {
  return fmpRequest<string[]>(`/stock_peers`, { symbol });
}

export interface TechnicalIndicator {
  date: string;
  [key: string]: number | string;
}

export interface EconomicCalendar {
  event: string;
  date: string;
  country: string;
  actual: number | null;
  previous: number | null;
  change: number | null;
  changePercentage: number | null;
  estimate: number | null;
  impact: string;
}

export interface TreasuryRate {
  date: string;
  month1: number;
  month2: number;
  month3: number;
  month6: number;
  year1: number;
  year2: number;
  year3: number;
  year5: number;
  year7: number;
  year10: number;
  year20: number;
  year30: number;
}

export interface EconomicIndicator {
  date: string;
  value: number;
}

export interface InsiderTrade {
  symbol: string;
  filingDate: string;
  transactionDate: string;
  reportingName: string;
  typeOfOwner: string;
  acquistionOrDisposition: string;
  formType: string;
  securitiesOwned: number;
  securitiesTransacted: number;
  price: number;
  securityName: string;
  link: string;
}

export interface InsiderTradeStatistics {
  symbol: string;
  cik: string;
  name: string;
  trades: number;
  buyTransactions: number;
  sellTransactions: number;
  totalBought: number;
  totalSold: number;
  avgBuyPrice: number;
  avgSellPrice: number;
}

export interface EarningsCalendar {
  date: string;
  symbol: string;
  eps: number | null;
  epsEstimated: number | null;
  time: string;
  revenue: number | null;
  revenueEstimated: number | null;
  fiscalDateEnding: string;
  updatedFromDate: string;
}

export interface EarningsSurprise {
  date: string;
  symbol: string;
  actualEarningResult: number;
  estimatedEarning: number;
}

export interface AnalystEstimate {
  date: string;
  symbol: string;
  estimatedRevenueLow: number;
  estimatedRevenueHigh: number;
  estimatedRevenueAvg: number;
  estimatedEbitdaLow: number;
  estimatedEbitdaHigh: number;
  estimatedEbitdaAvg: number;
  estimatedEbitLow: number;
  estimatedEbitHigh: number;
  estimatedEbitAvg: number;
  estimatedNetIncomeLow: number;
  estimatedNetIncomeHigh: number;
  estimatedNetIncomeAvg: number;
  estimatedSgaExpenseLow: number;
  estimatedSgaExpenseHigh: number;
  estimatedSgaExpenseAvg: number;
  estimatedEpsAvg: number;
  estimatedEpsHigh: number;
  estimatedEpsLow: number;
  numberAnalystEstimatedRevenue: number;
  numberAnalystsEstimatedEps: number;
}

export interface ForexQuote {
  ticker: string;
  bid: number;
  ask: number;
  open: number;
  low: number;
  high: number;
  changes: number;
  date: string;
}

export interface CommodityQuote {
  symbol: string;
  name: string;
  price: number;
  changesPercentage: number;
  change: number;
  dayLow: number;
  dayHigh: number;
  yearHigh: number;
  yearLow: number;
  marketCap: number | null;
  priceAvg50: number;
  priceAvg200: number;
  volume: number;
  avgVolume: number;
  exchange: string;
  open: number;
  previousClose: number;
  timestamp: number;
}

export interface COTReport {
  date: string;
  symbol: string;
  name: string;
  exchange: string;
  currentLongMarketSituation: number;
  currentShortMarketSituation: number;
  marketSituation: string;
  netPosition: number;
  percentOfOI_Long: number;
  percentOfOI_Short: number;
}

export interface PressRelease {
  symbol: string;
  date: string;
  title: string;
  text: string;
}

export interface Dividend {
  date: string;
  label: string;
  adjDividend: number;
  dividend: number;
  recordDate: string;
  paymentDate: string;
  declarationDate: string;
}

export interface StockSplit {
  date: string;
  label: string;
  symbol: string;
  numerator: number;
  denominator: number;
}

export interface IPOCalendar {
  date: string;
  company: string;
  symbol: string;
  exchange: string;
  actions: string;
  shares: number | null;
  priceRange: string;
  marketCap: number | null;
}

export async function getRSI(symbol: string, period: number = 14, timePeriod: string = 'daily'): Promise<TechnicalIndicator[]> {
  const result = await fmpRequest<TechnicalIndicator[]>(`/technical_indicator/${timePeriod}/${symbol}`, { type: 'rsi', period });
  // Limit to 10 most recent data points to avoid context overflow
  return result.slice(0, 10);
}

export async function getMACD(symbol: string, timePeriod: string = 'daily'): Promise<TechnicalIndicator[]> {
  const result = await fmpRequest<TechnicalIndicator[]>(`/technical_indicator/${timePeriod}/${symbol}`, { type: 'macd' });
  // Limit to 10 most recent data points to avoid context overflow
  return result.slice(0, 10);
}

export async function getEMA(symbol: string, period: number = 50, timePeriod: string = 'daily'): Promise<TechnicalIndicator[]> {
  const result = await fmpRequest<TechnicalIndicator[]>(`/technical_indicator/${timePeriod}/${symbol}`, { type: 'ema', period });
  // Limit to 10 most recent data points to avoid context overflow
  return result.slice(0, 10);
}

export async function getSMA(symbol: string, period: number = 50, timePeriod: string = 'daily'): Promise<TechnicalIndicator[]> {
  const result = await fmpRequest<TechnicalIndicator[]>(`/technical_indicator/${timePeriod}/${symbol}`, { type: 'sma', period });
  // Limit to 10 most recent data points to avoid context overflow
  return result.slice(0, 10);
}

export async function getADX(symbol: string, period: number = 14, timePeriod: string = 'daily'): Promise<TechnicalIndicator[]> {
  const result = await fmpRequest<TechnicalIndicator[]>(`/technical_indicator/${timePeriod}/${symbol}`, { type: 'adx', period });
  // Limit to 10 most recent data points to avoid context overflow
  return result.slice(0, 10);
}

export async function getWilliamsR(symbol: string, period: number = 14, timePeriod: string = 'daily'): Promise<TechnicalIndicator[]> {
  const result = await fmpRequest<TechnicalIndicator[]>(`/technical_indicator/${timePeriod}/${symbol}`, { type: 'williams', period });
  // Limit to 10 most recent data points to avoid context overflow
  return result.slice(0, 10);
}

export async function getCCI(symbol: string, period: number = 20, timePeriod: string = 'daily'): Promise<TechnicalIndicator[]> {
  const result = await fmpRequest<TechnicalIndicator[]>(`/technical_indicator/${timePeriod}/${symbol}`, { type: 'cci', period });
  // Limit to 10 most recent data points to avoid context overflow
  return result.slice(0, 10);
}

export async function getStochasticOscillator(symbol: string, period: number = 14, timePeriod: string = 'daily'): Promise<TechnicalIndicator[]> {
  const result = await fmpRequest<TechnicalIndicator[]>(`/technical_indicator/${timePeriod}/${symbol}`, { type: 'stoch', period });
  // Limit to 10 most recent data points to avoid context overflow
  return result.slice(0, 10);
}

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
  const result = await fmpRequest<EconomicCalendar[]>('/economic_calendar', params);
  
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
  const result = await fmpV4Request<TreasuryRate[]>('/treasury', params);
  // Limit to most recent 15 days to avoid context overflow
  return result.slice(0, 15);
}

export async function getEconomicIndicator(indicator: string, from?: string, to?: string): Promise<EconomicIndicator[]> {
  const params: Record<string, any> = {};
  if (from) params.from = from;
  if (to) params.to = to;
  const result = await fmpV4Request<EconomicIndicator[]>(`/economic?name=${indicator}`, params);
  // Limit to most recent 15 data points to avoid context overflow
  return result.slice(0, 15);
}

export async function getInsiderTrading(symbol?: string, limit: number = 20): Promise<InsiderTrade[]> {
  // Limit to 20 trades to avoid context overflow
  const actualLimit = Math.min(limit, 20);
  const params: Record<string, any> = { limit: actualLimit };
  if (symbol) params.symbol = symbol;
  return fmpV4Request<InsiderTrade[]>('/insider-trading', params);
}

export async function getInsiderTradeStatistics(symbol: string): Promise<InsiderTradeStatistics[]> {
  return fmpV4Request<InsiderTradeStatistics[]>('/insider-trade-statistics', { symbol });
}

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
  const result = await fmpRequest<EarningsCalendar[]>('/earning_calendar', params);
  
  // Sort by date (most recent first) and limit to avoid context overflow
  return result
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 15);
}

export async function getEarningsSurprises(symbol: string): Promise<EarningsSurprise[]> {
  return fmpRequest<EarningsSurprise[]>(`/earnings-surprises/${symbol}`);
}

export async function getAnalystEstimates(symbol: string, period: 'annual' | 'quarter' = 'annual', limit: number = 5): Promise<AnalystEstimate[]> {
  return fmpRequest<AnalystEstimate[]>(`/analyst-estimates/${symbol}`, { period, limit });
}

export async function getForexQuote(pair: string): Promise<ForexQuote[]> {
  return fmpRequest<ForexQuote[]>(`/fx/${pair}`);
}

export async function getForexList(): Promise<Array<{ symbol: string; name: string; currency: string; stockExchange: string }>> {
  return fmpRequest('/symbol/available-forex-currency-pairs');
}

export async function getCommodityQuotes(): Promise<CommodityQuote[]> {
  return fmpRequest<CommodityQuote[]>('/quotes/commodity');
}

export async function getCOTReport(symbol: string): Promise<COTReport[]> {
  return fmpV4Request<COTReport[]>(`/commitment_of_traders_report/${symbol}`);
}

export async function getCOTAnalysis(symbol: string): Promise<COTReport[]> {
  return fmpV4Request<COTReport[]>(`/commitment_of_traders_report_analysis/${symbol}`);
}

export async function getPressReleases(symbol: string, limit: number = 20): Promise<PressRelease[]> {
  return fmpRequest<PressRelease[]>(`/press-releases/${symbol}`, { limit });
}

export async function getDividendHistory(symbol: string): Promise<Dividend[]> {
  const result = await fmpRequest<{ symbol: string; historical: Dividend[] }>(`/historical-price-full/stock_dividend/${symbol}`);
  // Limit to last 10 dividends to avoid context overflow
  if (!result.historical || !Array.isArray(result.historical)) {
    return [];
  }
  return result.historical.slice(0, 10);
}

export async function getStockSplitHistory(symbol: string): Promise<StockSplit[]> {
  const result = await fmpRequest<{ symbol: string; historical: StockSplit[] }>(`/historical-price-full/stock_split/${symbol}`);
  // Return historical array, or empty array if not available
  if (!result.historical || !Array.isArray(result.historical)) {
    return [];
  }
  return result.historical;
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
  const result = await fmpRequest<IPOCalendar[]>('/ipo_calendar', params);

  // Sort by date (most recent first) and limit to avoid context overflow
  return result
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 20);
}

// Intraday Price Data
export interface IntradayPrice {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface IntradayPriceResponse {
  symbol: string;
  interval: string;
  data: IntradayPrice[];
}

export async function getIntradayPrice(symbol: string, interval: string = '15min'): Promise<IntradayPriceResponse> {
  const result = await fmpRequest<IntradayPrice[]>(`/historical-chart/${interval}/${symbol}`);
  // Limit to last 15 data points to avoid context overflow
  const limitedData = result.slice(0, 15);

  return {
    symbol,
    interval,
    data: limitedData
  };
}

// Price Target Data
export interface PriceTarget {
  symbol: string;
  publishedDate: string;
  newsURL: string;
  newsTitle: string;
  analystName: string;
  analystCompany: string;
  priceTarget: number;
  adjPriceTarget: number;
  priceWhenPosted: number;
  newsPublisher: string;
  newsBaseURL: string;
}

export async function getPriceTarget(symbol: string): Promise<PriceTarget[]> {
  return fmpV4Request<PriceTarget[]>('/price-target', { symbol });
}

export interface PriceTargetSummary {
  symbol: string;
  lastMonth: number;
  lastMonthAvgPriceTarget: number;
  lastQuarter: number;
  lastQuarterAvgPriceTarget: number;
  lastYear: number;
  lastYearAvgPriceTarget: number;
  allTime: number;
  allTimeAvgPriceTarget: number;
  publishers: string[];
}

export async function getPriceTargetSummary(symbol: string): Promise<PriceTargetSummary> {
  return fmpV4Request<PriceTargetSummary>(`/price-target-summary/${symbol}`);
}

// Upgrades and Downgrades
export interface UpgradeDowngrade {
  symbol: string;
  publishedDate: string;
  newsURL: string;
  newsTitle: string;
  newsPublisher: string;
  newsBaseURL: string;
  action: string;
  analystName: string;
  analystCompany: string;
  priceWhenPosted: number;
  priceTarget: number;
  newGrade: string;
  previousGrade: string;
  gradingCompany: string;
}

export async function getUpgradesDowngrades(symbol: string): Promise<UpgradeDowngrade[]> {
  return fmpV4Request<UpgradeDowngrade[]>('/upgrades-downgrades', { symbol });
}

// Institutional Holders
export interface InstitutionalHolder {
  holder: string;
  shares: number;
  dateReported: string;
  change: number;
  symbol: string;
}

export async function getInstitutionalHolders(symbol: string): Promise<InstitutionalHolder[]> {
  return fmpRequest<InstitutionalHolder[]>(`/institutional-holder/${symbol}`);
}

// ESG Score
export interface ESGScore {
  symbol: string;
  companyName: string;
  formattedDate: string;
  environmentalScore: number;
  socialScore: number;
  governanceScore: number;
  ESGScore: number;
}

export async function getESGScore(symbol: string): Promise<ESGScore[]> {
  return fmpV4Request<ESGScore[]>('/esg-environmental-social-governance-data', { symbol });
}

// Social Sentiment
export interface SocialSentiment {
  date: string;
  symbol: string;
  stocktwitsPosts: number;
  twitterPosts: number;
  stocktwitsComments: number;
  twitterComments: number;
  stocktwitsLikes: number;
  twitterLikes: number;
  stocktwitsImpressions: number;
  twitterImpressions: number;
  stocktwitsSentiment: number;
  twitterSentiment: number;
}

export async function getSocialSentiment(symbol: string, limit: number = 10): Promise<SocialSentiment[]> {
  // Limit to 10 records to avoid context overflow
  const actualLimit = Math.min(limit, 10);
  const result = await fmpV4Request<SocialSentiment[]>('/social-sentiments/trending', { type: 'bullish', source: 'stocktwits' });
  return result.slice(0, actualLimit);
}

// Congressional Trading
export interface CongressionalTrade {
  transactionDate: string;
  transactionType: string;
  ticker: string;
  assetDescription: string;
  assetType: string;
  type: string;
  amount: string;
  representative: string;
  representativeLink: string;
  transactionLink: string;
  disclosureDate: string;
}

export async function getCongressionalTrading(symbol?: string): Promise<CongressionalTrade[]> {
  const params: Record<string, any> = {};
  if (symbol) params.symbol = symbol;
  return fmpV4Request<CongressionalTrade[]>('/senate-trading', params);
}

export async function getSenateTrading(symbol?: string): Promise<CongressionalTrade[]> {
  const params: Record<string, any> = {};
  if (symbol) params.symbol = symbol;
  return fmpV4Request<CongressionalTrade[]>('/senate-disclosure', params);
}

// Search by CIK, CUSIP, ISIN
export interface CompanySearchResult {
  symbol: string;
  name: string;
  currency: string;
  stockExchange: string;
  exchangeShortName: string;
}

export async function searchByCIK(cik: string): Promise<CompanySearchResult[]> {
  return fmpRequest<CompanySearchResult[]>('/cik-search', { cik });
}

export async function searchByCUSIP(cusip: string): Promise<CompanySearchResult[]> {
  return fmpRequest<CompanySearchResult[]>('/cusip-search', { cusip });
}

export async function searchByISIN(isin: string): Promise<CompanySearchResult[]> {
  return fmpRequest<CompanySearchResult[]>('/isin-search', { isin });
}

// Stock Screener
export interface ScreenerResult {
  symbol: string;
  companyName: string;
  marketCap: number;
  sector: string;
  industry: string;
  beta: number;
  price: number;
  lastAnnualDividend: number;
  volume: number;
  exchange: string;
  exchangeShortName: string;
  country: string;
  isEtf: boolean;
  isActivelyTrading: boolean;
}

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
  return fmpRequest<ScreenerResult[]>('/stock-screener', filters);
}

// Market Hours
export interface MarketHours {
  stockExchangeName: string;
  stockMarketHours: {
    openingHour: string;
    closingHour: string;
  };
  stockMarketHolidays: string[];
  isTheStockMarketOpen: boolean;
  isTheEuronextMarketOpen: boolean;
  isTheForexMarketOpen: boolean;
  isTheCryptoMarketOpen: boolean;
}

export async function getMarketHours(): Promise<MarketHours> {
  return fmpRequest<MarketHours>('/market-hours');
}

// Market Movers
export interface MarketMover {
  symbol: string;
  name: string;
  change: number;
  price: number;
  changesPercentage: number;
}

export async function getGainers(): Promise<MarketMover[]> {
  return fmpRequest<MarketMover[]>('/stock_market/gainers');
}

export async function getLosers(): Promise<MarketMover[]> {
  return fmpRequest<MarketMover[]>('/stock_market/losers');
}

export async function getActives(): Promise<MarketMover[]> {
  return fmpRequest<MarketMover[]>('/stock_market/actives');
}

// ETF Holdings
export interface ETFHolding {
  asset: string;
  name: string;
  sharesNumber: number;
  weightPercentage: number;
  marketValue: number;
}

export async function getETFHoldings(symbol: string): Promise<ETFHolding[]> {
  return fmpRequest<ETFHolding[]>(`/etf-holder/${symbol}`);
}

// ETF Sector Weightings
export interface ETFSectorWeighting {
  sector: string;
  weightPercentage: string;
}

export async function getETFSectorWeightings(symbol: string): Promise<ETFSectorWeighting[]> {
  return fmpRequest<ETFSectorWeighting[]>(`/etf-sector-weightings/${symbol}`);
}

// ETF Country Weightings
export interface ETFCountryWeighting {
  country: string;
  weightPercentage: string;
}

export async function getETFCountryWeightings(symbol: string): Promise<ETFCountryWeighting[]> {
  return fmpRequest<ETFCountryWeighting[]>(`/etf-country-weightings/${symbol}`);
}

// Financial Growth
export interface FinancialGrowth {
  date: string;
  symbol: string;
  period: string;
  calendarYear: string;
  revenueGrowth: number;
  grossProfitGrowth: number;
  ebitgrowth: number;
  operatingIncomeGrowth: number;
  netIncomeGrowth: number;
  epsgrowth: number;
  epsdilutedGrowth: number;
  weightedAverageSharesGrowth: number;
  weightedAverageSharesDilutedGrowth: number;
  dividendsperShareGrowth: number;
  operatingCashFlowGrowth: number;
  freeCashFlowGrowth: number;
  tenYRevenueGrowthPerShare: number;
  fiveYRevenueGrowthPerShare: number;
  threeYRevenueGrowthPerShare: number;
  tenYOperatingCFGrowthPerShare: number;
  fiveYOperatingCFGrowthPerShare: number;
  threeYOperatingCFGrowthPerShare: number;
  tenYNetIncomeGrowthPerShare: number;
  fiveYNetIncomeGrowthPerShare: number;
  threeYNetIncomeGrowthPerShare: number;
  tenYShareholdersEquityGrowthPerShare: number;
  fiveYShareholdersEquityGrowthPerShare: number;
  threeYShareholdersEquityGrowthPerShare: number;
  tenYDividendperShareGrowthPerShare: number;
  fiveYDividendperShareGrowthPerShare: number;
  threeYDividendperShareGrowthPerShare: number;
  receivablesGrowth: number;
  inventoryGrowth: number;
  assetGrowth: number;
  bookValueperShareGrowth: number;
  debtGrowth: number;
  rdexpenseGrowth: number;
  sgaexpensesGrowth: number;
}

export async function getFinancialGrowth(symbol: string, period: 'annual' | 'quarter' = 'annual', limit: number = 5): Promise<FinancialGrowth[]> {
  return fmpRequest<FinancialGrowth[]>(`/financial-growth/${symbol}`, { period, limit });
}

// Company Outlook
export interface CompanyOutlook {
  profile: CompanyProfile;
  metrics: any;
  ratios: any[];
  insiderTrades: any[];
  keyExecutives: any[];
  splitHistory: any[];
  stockDividend: any[];
  stockNews: any[];
  rating: any[];
  financialsAnnual: any;
  financialsQuarter: any;
}

export async function getCompanyOutlook(symbol: string): Promise<CompanyOutlook> {
  return fmpV4Request<CompanyOutlook>(`/company-outlook/${symbol}`);
}

// Stock News Sentiment
export interface StockNewsSentiment {
  symbol: string;
  publishedDate: string;
  title: string;
  image: string;
  site: string;
  text: string;
  url: string;
  sentiment: string;
  sentimentScore: number;
}

export async function getStockNewsSentiment(symbol: string, limit: number = 5): Promise<StockNewsSentiment[]> {
  // Limit to 5 articles to avoid context overflow
  const actualLimit = Math.min(limit, 5);
  return fmpV4Request<StockNewsSentiment[]>('/stock-news-sentiment-rss-feed', { tickers: symbol, limit: actualLimit });
}

// Crypto Quote
export interface CryptoQuote {
  symbol: string;
  name: string;
  price: number;
  changesPercentage: number;
  change: number;
  dayLow: number;
  dayHigh: number;
  yearHigh: number;
  yearLow: number;
  marketCap: number;
  priceAvg50: number;
  priceAvg200: number;
  volume: number;
  avgVolume: number;
  exchange: string;
  open: number;
  previousClose: number;
  timestamp: number;
}

export async function getCryptoQuote(symbol: string): Promise<CryptoQuote[]> {
  return fmpRequest<CryptoQuote[]>(`/quote/${symbol}`);
}

export async function getCryptoList(): Promise<Array<{ symbol: string; name: string; currency: string; stockExchange: string }>> {
  return fmpRequest('/symbol/available-cryptocurrencies');
}

// Forex Historical
export interface ForexHistorical {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  adjClose: number;
  volume: number;
}

export async function getForexHistorical(pair: string, from?: string, to?: string): Promise<{ symbol: string; historical: ForexHistorical[] }> {
  const params: Record<string, any> = {};
  if (from) params.from = from;
  if (to) params.to = to;
  const result = await fmpRequest<{ symbol: string; historical: ForexHistorical[] }>(`/historical-price-full/${pair}`, params);

  // Limit to last 20 days
  if (result.historical && result.historical.length > 20) {
    result.historical = result.historical.slice(0, 20);
  }

  return result;
}

// SEC Filings
export interface SECFiling {
  symbol: string;
  cik: string;
  acceptedDate: string;
  type: string;
  link: string;
  finalLink: string;
}

export async function getSECFilings(symbol: string, type?: string, limit: number = 20): Promise<SECFiling[]> {
  // Limit to 20 filings to avoid context overflow
  const actualLimit = Math.min(limit, 20);
  const params: Record<string, any> = { limit: actualLimit };
  if (type) params.type = type;
  return fmpRequest<SECFiling[]>(`/sec_filings/${symbol}`, params);
}

// Company Notes
export interface CompanyNote {
  symbol: string;
  cik: string;
  acceptedDate: string;
  period: string;
  formType: string;
  notes: string;
}

export async function getCompanyNotes(symbol: string): Promise<CompanyNote[]> {
  return fmpV4Request<CompanyNote[]>(`/company-notes/${symbol}`);
}

// Earnings Call Transcript
export interface EarningsCallTranscript {
  symbol: string;
  quarter: number;
  year: number;
  date: string;
  content: string;
}

export async function getEarningsCallTranscript(symbol: string, year: number, quarter: number): Promise<EarningsCallTranscript[]> {
  return fmpRequest<EarningsCallTranscript[]>(`/earning_call_transcript/${symbol}`, { quarter, year });
}

// Advanced Chart Data APIs
const FMP_STABLE_URL = 'https://financialmodelingprep.com/stable';

async function fmpStableRequest<T>(endpoint: string, params: Record<string, any> = {}): Promise<T> {
  const url = `${FMP_STABLE_URL}${endpoint}`;
  const response = await axios.get(url, {
    params: {
      ...params,
      apikey: FMP_API_KEY,
    },
  });
  return response.data;
}

export interface ChartDataLight {
  symbol: string;
  date: string;
  price: number;
  volume: number;
}

export interface ChartDataFull {
  symbol: string;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  change: number;
  changePercent: number;
  vwap: number;
}

export interface ChartDataIntraday {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Stock Chart Light API
export async function getChartLight(symbol: string, from?: string, to?: string): Promise<ChartDataLight[]> {
  const params: Record<string, any> = { symbol };
  if (from) params.from = from;
  if (to) params.to = to;
  return fmpStableRequest<ChartDataLight[]>('/historical-price-eod/light', params);
}

// Stock Price and Volume Data API (Full)
export async function getChartFull(symbol: string, from?: string, to?: string): Promise<ChartDataFull[]> {
  const params: Record<string, any> = { symbol };
  if (from) params.from = from;
  if (to) params.to = to;
  return fmpStableRequest<ChartDataFull[]>('/historical-price-eod/full', params);
}

// Unadjusted Stock Price API
export async function getChartUnadjusted(symbol: string, from?: string, to?: string): Promise<any[]> {
  const params: Record<string, any> = { symbol };
  if (from) params.from = from;
  if (to) params.to = to;
  return fmpStableRequest<any[]>('/historical-price-eod/non-split-adjusted', params);
}

// Dividend Adjusted Price Chart API
export async function getChartDividendAdjusted(symbol: string, from?: string, to?: string): Promise<any[]> {
  const params: Record<string, any> = { symbol };
  if (from) params.from = from;
  if (to) params.to = to;
  return fmpStableRequest<any[]>('/historical-price-eod/dividend-adjusted', params);
}

// Intraday Chart APIs
export async function getChartIntraday(
  symbol: string,
  interval: '1min' | '5min' | '15min' | '30min' | '1hour' | '4hour',
  from?: string,
  to?: string,
  nonadjusted: boolean = false
): Promise<ChartDataIntraday[]> {
  const params: Record<string, any> = { symbol };
  if (from) params.from = from;
  if (to) params.to = to;
  if (nonadjusted) params.nonadjusted = 'true';
  return fmpStableRequest<ChartDataIntraday[]>(`/historical-chart/${interval}`, params);
}

// ==========================================
// SEARCH & DISCOVERY APIs
// ==========================================

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

// ==========================================
// ADVANCED COMPANY DATA APIs
// ==========================================

// Profile by CIK API
export async function getProfileByCIK(cik: string): Promise<CompanyProfile[]> {
  return fmpStableRequest<CompanyProfile[]>('/profile-cik', { cik });
}

// Delisted Companies API
export async function getDelistedCompanies(page: number = 0, limit: number = 100): Promise<Array<{ symbol: string; companyName: string; exchange: string; ipoDate: string; delistedDate: string }>> {
  return fmpStableRequest('/delisted-companies', { page, limit });
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

// Latest Mergers and Acquisitions API
export async function getLatestMergersAcquisitions(page: number = 0, limit: number = 100): Promise<Array<{ targetedCompany: string; acquiringCompany: string; transactionDate: string; acceptanceTime: string }>> {
  return fmpStableRequest('/mergers-acquisitions-latest', { page, limit });
}

// Search Mergers and Acquisitions API
export async function searchMergersAcquisitions(name: string): Promise<Array<{ targetedCompany: string; acquiringCompany: string; transactionDate: string; acceptanceTime: string }>> {
  return fmpStableRequest('/mergers-acquisitions-search', { name });
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

// ==========================================
// QUOTES & MARKET DATA APIs
// ==========================================

// Quote Short API
export async function getQuoteShort(symbol: string): Promise<Array<{ symbol: string; price: number; volume: number }>> {
  return fmpStableRequest('/quote-short', { symbol });
}

// Aftermarket Trade API
export async function getAftermarketTrade(symbol: string): Promise<Array<{ symbol: string; price: number; size: number; timestamp: number }>> {
  return fmpStableRequest('/aftermarket-trade', { symbol });
}

// Aftermarket Quote API
export async function getAftermarketQuote(symbol: string): Promise<Array<{ symbol: string; ask: number; bid: number; asize: number; bsize: number; timestamp: number }>> {
  return fmpStableRequest('/aftermarket-quote', { symbol });
}

// Stock Price Change API
export async function getStockPriceChange(symbol: string): Promise<Array<{ symbol: string; '1D': number; '5D': number; '1M': number; '3M': number; '6M': number; ytd: number; '1Y': number; '3Y': number; '5Y': number; '10Y': number; max: number }>> {
  return fmpStableRequest('/stock-price-change', { symbol });
}

// Batch Quote API
export async function getBatchQuote(symbols: string): Promise<StockQuote[]> {
  return fmpStableRequest<StockQuote[]>('/batch-quote', { symbols });
}

// Batch Quote Short API
export async function getBatchQuoteShort(symbols: string): Promise<Array<{ symbol: string; price: number; volume: number }>> {
  return fmpStableRequest('/batch-quote-short', { symbols });
}

// Batch Aftermarket Trade API
export async function getBatchAftermarketTrade(symbols: string): Promise<Array<{ symbol: string; price: number; size: number; timestamp: number }>> {
  return fmpStableRequest('/batch-aftermarket-trade', { symbols });
}

// Batch Aftermarket Quote API
export async function getBatchAftermarketQuote(symbols: string): Promise<Array<{ symbol: string; ask: number; bid: number; asize: number; bsize: number; timestamp: number }>> {
  return fmpStableRequest('/batch-aftermarket-quote', { symbols });
}

// Exchange Stock Quotes API
export async function getBatchExchangeQuote(exchange: string): Promise<StockQuote[]> {
  return fmpStableRequest<StockQuote[]>('/batch-exchange-quote', { exchange });
}

// Mutual Fund Quotes API
export async function getBatchMutualfundQuotes(): Promise<StockQuote[]> {
  return fmpStableRequest<StockQuote[]>('/batch-mutualfund-quotes');
}

// ETF Quotes API
export async function getBatchETFQuotes(): Promise<StockQuote[]> {
  return fmpStableRequest<StockQuote[]>('/batch-etf-quotes');
}

// Commodity Quotes API (Batch)
export async function getBatchCommodityQuotes(): Promise<CommodityQuote[]> {
  return fmpStableRequest<CommodityQuote[]>('/batch-commodity-quotes');
}

// Crypto Quotes API (Batch)
export async function getBatchCryptoQuotes(): Promise<CryptoQuote[]> {
  return fmpStableRequest<CryptoQuote[]>('/batch-crypto-quotes');
}

// Forex Quotes API (Batch)
export async function getBatchForexQuotes(): Promise<ForexQuote[]> {
  return fmpStableRequest<ForexQuote[]>('/batch-forex-quotes');
}

// Index Quotes API (Batch)
export async function getBatchIndexQuotes(): Promise<StockQuote[]> {
  return fmpStableRequest<StockQuote[]>('/batch-index-quotes');
}

// ==========================================
// FINANCIAL STATEMENTS - TTM & AS REPORTED
// ==========================================

// Latest Financial Statements API
export async function getLatestFinancialStatements(page: number = 0, limit: number = 250): Promise<Array<{ symbol: string; date: string }>> {
  return fmpStableRequest('/latest-financial-statements', { page, limit });
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
export async function getEnterpriseValues(symbol: string, period: 'annual' | 'quarter' = 'annual', limit: number = 5): Promise<Array<{ symbol: string; date: string; stockPrice: number; numberOfShares: number; marketCapitalization: number; minusCashAndCashEquivalents: number; addTotalDebt: number; enterpriseValue: number }>> {
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
export async function getIncomeStatementAsReported(symbol: string, period: 'annual' | 'quarter' = 'annual', limit: number = 5): Promise<Array<any>> {
  return fmpStableRequest('/income-statement-as-reported', { symbol, period, limit });
}

// Balance Sheet As Reported API
export async function getBalanceSheetAsReported(symbol: string, period: 'annual' | 'quarter' = 'annual', limit: number = 5): Promise<Array<any>> {
  return fmpStableRequest('/balance-sheet-statement-as-reported', { symbol, period, limit });
}

// Cash Flow As Reported API
export async function getCashFlowAsReported(symbol: string, period: 'annual' | 'quarter' = 'annual', limit: number = 5): Promise<Array<any>> {
  return fmpStableRequest('/cash-flow-statement-as-reported', { symbol, period, limit });
}

// Full Financial Statement As Reported API
export async function getFullFinancialStatementAsReported(symbol: string, period: 'annual' | 'quarter' = 'annual'): Promise<any> {
  return fmpStableRequest('/financial-statement-full-as-reported', { symbol, period });
}

// ==========================================
// ECONOMIC DATA & DIVIDENDS
// ==========================================

// Market Risk Premium API
export async function getMarketRiskPremium(country?: string): Promise<Array<{ country: string; continent: string; totalEquityRiskPremium: number; countryRiskPremium: number }>> {
  const params: Record<string, any> = {};
  if (country) params.country = country;
  return fmpStableRequest('/market-risk-premium', params);
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

// Earnings Report API
export async function getEarningsReport(symbol: string): Promise<Array<{ date: string; symbol: string; eps: number; epsEstimated: number; time: string; revenue: number; revenueEstimated: number }>> {
  return fmpStableRequest('/earnings', { symbol });
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

// ==========================================
// NEWS & TRANSCRIPTS APIs
// ==========================================

// Latest Earning Transcripts API
export async function getLatestEarningTranscripts(): Promise<Array<{ symbol: string; quarter: number; year: number; date: string }>> {
  return fmpStableRequest('/earning-call-transcript-latest');
}

// Earning Call Transcript Dates API
export async function getEarningCallTranscriptDates(symbol: string): Promise<Array<{ symbol: string; quarter: number; year: number; date: string }>> {
  return fmpStableRequest('/earning-call-transcript-dates', { symbol });
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

// ==========================================
// FORM 13F & INSTITUTIONAL OWNERSHIP APIs
// ==========================================

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

// ==========================================
// ANALYST RATINGS & ESTIMATES APIs
// ==========================================

// Ratings Snapshot API
export async function getRatingsSnapshot(symbol: string): Promise<Array<{ symbol: string; date: string; rating: string; ratingScore: number; ratingRecommendation: string; ratingDetailsDCFScore: number; ratingDetailsDCFRecommendation: string; ratingDetailsROEScore: number; ratingDetailsROERecommendation: string; ratingDetailsROAScore: number; ratingDetailsROARecommendation: string; ratingDetailsDEScore: number; ratingDetailsDERecommendation: string; ratingDetailsPEScore: number; ratingDetailsPERecommendation: string; ratingDetailsPBScore: number; ratingDetailsPBRecommendation: string }>> {
  return fmpStableRequest('/ratings-snapshot', { symbol });
}

// Historical Ratings API
export async function getHistoricalRatings(symbol: string, limit: number = 100): Promise<Array<any>> {
  return fmpStableRequest('/ratings-historical', { symbol, limit });
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

// ==========================================
// MARKET PERFORMANCE & SECTORS APIs
// ==========================================

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

// ==========================================
// ADDITIONAL TECHNICAL INDICATORS APIs
// ==========================================

// Weighted Moving Average API
export async function getWMA(symbol: string, periodLength: number = 10, timeframe: string = '1day'): Promise<TechnicalIndicator[]> {
  const result = await fmpStableRequest<TechnicalIndicator[]>('/technical-indicators/wma', { symbol, periodLength, timeframe });
  return result.slice(0, 10);
}

// Double Exponential Moving Average API
export async function getDEMA(symbol: string, periodLength: number = 10, timeframe: string = '1day'): Promise<TechnicalIndicator[]> {
  const result = await fmpStableRequest<TechnicalIndicator[]>('/technical-indicators/dema', { symbol, periodLength, timeframe });
  return result.slice(0, 10);
}

// Triple Exponential Moving Average API
export async function getTEMA(symbol: string, periodLength: number = 10, timeframe: string = '1day'): Promise<TechnicalIndicator[]> {
  const result = await fmpStableRequest<TechnicalIndicator[]>('/technical-indicators/tema', { symbol, periodLength, timeframe });
  return result.slice(0, 10);
}

// Standard Deviation API
export async function getStandardDeviation(symbol: string, periodLength: number = 10, timeframe: string = '1day'): Promise<TechnicalIndicator[]> {
  const result = await fmpStableRequest<TechnicalIndicator[]>('/technical-indicators/standarddeviation', { symbol, periodLength, timeframe });
  return result.slice(0, 10);
}

// ==========================================
// ETF & MUTUAL FUNDS APIs
// ==========================================

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

// ==========================================
// SEC FILINGS - ADVANCED APIs
// ==========================================

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

// ==========================================
// INSIDER TRADES - ADVANCED APIs
// ==========================================

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

// ==========================================
// INDEXES APIs
// ==========================================

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

// ==========================================
// COMMODITIES APIs
// ==========================================

// Commodities List API
export async function getCommoditiesList(): Promise<Array<{ symbol: string; name: string; currency: string; stockExchange: string; exchangeShortName: string }>> {
  return fmpStableRequest('/commodities-list');
}

// ==========================================
// DCF VALUATION APIs
// ==========================================

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

// ==========================================
// FOREX APIs
// ==========================================

// Forex Currency Pairs API
export async function getForexCurrencyPairs(): Promise<Array<{ symbol: string; name: string; currency: string; stockExchange: string }>> {
  return fmpStableRequest('/forex-list');
}

// ==========================================
// SENATE & HOUSE TRADING APIs
// ==========================================

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

// ==========================================
// ESG APIs
// ==========================================

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

// ==========================================
// COT (Commitment of Traders) APIs
// ==========================================

// COT List API
export async function getCOTList(): Promise<Array<{ tradingSymbol: string; name: string }>> {
  return fmpStableRequest('/commitment-of-traders-list');
}

// ==========================================
// CROWDFUNDING & EQUITY OFFERINGS APIs
// ==========================================

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

// ==========================================
// BULK APIs
// ==========================================

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
