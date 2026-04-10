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

// Institutional Holders
export interface InstitutionalHolder {
  holder: string;
  shares: number;
  dateReported: string;
  change: number;
  symbol: string;
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

// Search by CIK, CUSIP, ISIN
export interface CompanySearchResult {
  symbol: string;
  name: string;
  currency: string;
  stockExchange: string;
  exchangeShortName: string;
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

// Market Movers
export interface MarketMover {
  symbol: string;
  name: string;
  change: number;
  price: number;
  changesPercentage: number;
}

// ETF Holdings
export interface ETFHolding {
  asset: string;
  name: string;
  sharesNumber: number;
  weightPercentage: number;
  marketValue: number;
}

// ETF Sector Weightings
export interface ETFSectorWeighting {
  sector: string;
  weightPercentage: string;
}

// ETF Country Weightings
export interface ETFCountryWeighting {
  country: string;
  weightPercentage: string;
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

// SEC Filings
export interface SECFiling {
  symbol: string;
  cik: string;
  acceptedDate: string;
  type: string;
  link: string;
  finalLink: string;
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

// Earnings Call Transcript
export interface EarningsCallTranscript {
  symbol: string;
  quarter: number;
  year: number;
  date: string;
  content: string;
}

// Advanced Chart Data
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
