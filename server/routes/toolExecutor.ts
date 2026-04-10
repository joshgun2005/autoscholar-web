/**
 * Tool Executor — dispatches tool calls to the appropriate service functions.
 *
 * Types and helpers extracted to ./tool-handlers/types.ts
 * The main executeToolCall function remains here (large but cohesive dispatch).
 */

import path from "path";
import { storage } from "../storage";
import { detectDomain } from "../utils/domainDetector";
import { logger } from "../utils/logger";
import { parseAgentPrefix, buildPipelineScripts, type ToolExecutorContext } from "./tool-handlers/types";
export { buildPipelineScripts, type ToolExecutorContext } from "./tool-handlers/types";

// ── Service imports ──
import { searchExa, getContentsExa } from "../services/exaService";
import { getWBIndicatorData, getWBCountries, searchWBIndicators, getWBTopics, getWBRegions, getWBIncomeLevels, getWBSources } from "../services/worldBankService";
import { getIMFIndicatorData, getIMFIndicators, getIMFCountries, getIMFDataflows, getIMFDataStructure, getIMFCodeList, getIMFSDMXData } from "../services/imfService";
import { getOECDData, getOECDDataflows, getOECDDataflowStructure, searchOECDDataflows } from "../services/oecdService";
import { getPolymarketEvents, getPolymarketMarkets, searchPolymarket, getPolymarketPriceHistory, getPolymarketOrderBook, getPolymarketTags, getPolymarketTrades, getPolymarketLeaderboard } from "../services/polymarketService";
import { searchFirecrawl, scrapeFirecrawl, crawlFirecrawl, extractFirecrawl, mapFirecrawl, agentFirecrawl, batchScrapeFirecrawl } from "../services/firecrawlService";
import { searchTavily, extractTavily, crawlTavily, mapTavily, researchTavily } from "../services/tavilyService";
import { generateResearchPaper, compileResearchPaper, createProjectZip } from "../services/researchPaperService";
import { registerCompilation, readLatexSource, inspectLatexErrors, patchLatex, recompileLatex, getCompilationMeta } from "../services/latex/latexPatchManager";
import { searchGoogleScholar } from "../services/serpapiService";
import { searchOpenAlex, searchArxiv, lookupDoi, searchCrossref, multiSourceAcademicSearch } from "../services/academicSearchService";
import { analyzeFigures } from "../services/figureAnalysisService";
import {
  getCompanyProfile,
  getIncomeStatement,
  getBalanceSheet,
  getCashFlowStatement,
  getKeyMetrics,
  getFinancialRatios,
  getStockQuote,
  getHistoricalPrice,
  searchCompanies,
  getStockPeers,
  getFinancialNews,
  getRSI,
  getMACD,
  getEMA,
  getSMA,
  getADX,
  getWilliamsR,
  getCCI,
  getStochasticOscillator,
  getEconomicCalendar,
  getTreasuryRates,
  getEconomicIndicator,
  getInsiderTrading,
  getInsiderTradeStatistics,
  getEarningsCalendar,
  getEarningsSurprises,
  getAnalystEstimates,
  getForexQuote,
  getForexList,
  getCommodityQuotes,
  getCOTReport,
  getCOTAnalysis,
  getPressReleases,
  getDividendHistory,
  getStockSplitHistory,
  getIPOCalendar,
  getIntradayPrice,
  getPriceTarget,
  getPriceTargetSummary,
  getUpgradesDowngrades,
  getInstitutionalHolders,
  getESGScore,
  getSocialSentiment,
  getCongressionalTrading,
  getSenateTrading,
  searchByCIK,
  searchByCUSIP,
  searchByISIN,
  getStockScreener,
  getMarketHours,
  getETFHoldings,
  getETFSectorWeightings,
  getETFCountryWeightings,
  getFinancialGrowth,
  getCompanyOutlook,
  getStockNewsSentiment,
  getCryptoQuote,
  getCryptoList,
  getForexHistorical,
  getSECFilings,
  getCompanyNotes,
  getEarningsCallTranscript,
  // NEW IMPORTS FOR EXPANDED FMP API
  searchSymbol,
  searchName,
  searchExchangeVariants,
  getStockList,
  getFinancialStatementSymbolList,
  getCIKList,
  getSymbolChange,
  getETFList,
  getActivelyTradingList,
  getEarningsTranscriptList,
  getAvailableExchanges,
  getAvailableSectors,
  getAvailableIndustries,
  getAvailableCountries,
  getProfileByCIK,
  getDelistedCompanies,
  getEmployeeCount,
  getHistoricalEmployeeCount,
  getMarketCapitalization,
  getBatchMarketCapitalization,
  getHistoricalMarketCapitalization,
  getSharesFloat,
  getAllSharesFloat,
  getLatestMergersAcquisitions,
  searchMergersAcquisitions,
  getKeyExecutives,
  getExecutiveCompensation,
  getExecutiveCompensationBenchmark,
  getQuoteShort,
  getAftermarketTrade,
  getAftermarketQuote,
  getStockPriceChange,
  getBatchQuote,
  getBatchQuoteShort,
  getBatchExchangeQuote,
  getBatchMutualfundQuotes,
  getBatchETFQuotes,
  getBatchCommodityQuotes,
  getBatchCryptoQuotes,
  getBatchForexQuotes,
  getBatchIndexQuotes,
  getLatestFinancialStatements,
  getIncomeStatementTTM,
  getBalanceSheetTTM,
  getCashflowStatementTTM,
  getKeyMetricsTTM,
  getRatiosTTM,
  getFinancialScores,
  getOwnerEarnings,
  getEnterpriseValues,
  getRevenueProductSegmentation,
  getRevenueGeographicSegmentation,
  getMarketRiskPremium,
  getDividendsCompany,
  getDividendsCalendar,
  getEarningsReport,
  getIPODisclosures,
  getIPOProspectus,
  getSplits,
  getSplitsCalendar,
  getLatestEarningTranscripts,
  getEarningCallTranscriptDates,
  getFMPArticles,
  getGeneralNews,
  getPressReleasesLatest,
  getStockNewsLatest,
  getCryptoNews,
  getForexNews,
  searchPressReleasesNew,
  searchStockNews,
  searchCryptoNews,
  searchForexNews,
  getInstitutionalOwnershipFilings,
  extractSECFilings,
  getForm13FFilingsDates,
  getFilingsExtractWithAnalytics,
  getHolderPerformanceSummary,
  getHoldersIndustryBreakdown,
  getPositionsSummary,
  getIndustryPerformanceSummary,
  getRatingsSnapshot,
  getHistoricalRatings,
  getPriceTargetConsensus,
  getGrades,
  getHistoricalGrades,
  getGradesSummary,
  getMarketSectorPerformanceSnapshot,
  getIndustryPerformanceSnapshot,
  getHistoricalSectorPerformance,
  getHistoricalIndustryPerformance,
  getSectorPESnapshot,
  getIndustryPESnapshot,
  getHistoricalSectorPE,
  getHistoricalIndustryPE,
  getWMA,
  getDEMA,
  getTEMA,
  getStandardDeviation,
  getETFAssetExposure,
  getMutualFundDisclosureLatest,
  getMutualFundDisclosure,
  getMutualFundDisclosureSearch,
  getMutualFundDisclosureDates,
  getLatest8KSECFilings,
  getLatestSECFilings,
  getSECFilingsByFormType,
  getSECFilingsBySymbol,
  getSECFilingsByCIK,
  getSECFilingsByName,
  getSECFilingsCompanySearchBySymbol,
  getSECFilingsCompanySearchByCIK,
  getSECCompanyFullProfile,
  getIndustryClassificationList,
  searchIndustryClassification,
  getAllIndustryClassification,
  getLatestInsiderTrading,
  searchInsiderTrades,
  searchInsiderTradesByName,
  getAllInsiderTransactionTypes,
  getAcquisitionOfBeneficialOwnership,
  getIndexList,
  getSP500Constituent,
  getNasdaqConstituent,
  getDowJonesConstituent,
  getHistoricalSP500Constituent,
  getHistoricalNasdaqConstituent,
  getHistoricalDowJonesConstituent,
  getExchangeMarketHours,
  getHolidaysByExchange,
  getAllExchangeMarketHours,
  getCommoditiesList,
  getDCFValuation,
  getLeveredDCF,
  getCustomDCF,
  getCustomLeveredDCF,
  getForexCurrencyPairs,
  getLatestSenateDisclosures,
  getLatestHouseDisclosures,
  getSenateTradesSymbol,
  getSenateTradesByName,
  getHouseTradesSymbol,
  getHouseTradesByName,
  getESGDisclosures,
  getESGRatings,
  getESGBenchmark,
  getCOTList,
  getLatestCrowdfundingCampaigns,
  searchCrowdfundingCampaigns,
  getCrowdfundingByCIK,
  getEquityOfferingUpdates,
  searchEquityOfferings,
  getCompanyEquityOfferingsByCIK
} from "../services/fmpService";
import { getOptionChain, getOptionPrices, getOptionGreeks } from "../services/financialDataService";
import { getEODHDIntraday, getEODHDOptions, getEODHDEOD } from "../services/eodhd_service";
import { executeMonteCarloSimulation, executeOptionsPricing, executeGarchModel, executeVarCalculation, executePortfolioOptimization, executeRiskMetricsAnalysis, executePlot, executeDataDownload, executeCustomPython, rerunScript, readScript, patchScript, getLastError, getRepairInfo } from "../services/pythonExecutor";

// Types and helpers (ToolExecutorContext, buildPipelineScripts, parseAgentPrefix)
// are now in ./tool-handlers/types.ts

/**
 * Execute a single tool call and return the result.
 * This is the massive tool dispatch extracted from the /api/chat handler.
 */
// Track rejection attempts per section type per session to avoid infinite loops
const sectionRejectCounts = new Map<string, Map<string, number>>();
const MAX_SECTION_REJECTS = 2; // accept after this many failed attempts (lower = faster pipeline)

export async function executeToolCall(
  toolCall: any,
  ctx: ToolExecutorContext,
): Promise<any> {
  const { safeWrite, sessionId, userId, authorName, customPythonFiguresData, paperSectionsStore, pythonCodeEntries, sessionDataFiles, refs } = ctx;
  let result: any;

  if (toolCall.name === 'get_company_profile') {
                logger.info(`Getting company profile for: ${toolCall.input.symbol}`);
                result = await getCompanyProfile(toolCall.input.symbol);
                logger.success('Company profile retrieved');
              } else if (toolCall.name === 'get_income_statement') {
                logger.debug(`   → Getting income statement: ${toolCall.input.symbol} (${toolCall.input.period || 'annual'})`);
                result = await getIncomeStatement(
                  toolCall.input.symbol,
                  toolCall.input.period || 'annual',
                  toolCall.input.limit || 5
                );
                logger.debug('   ✓ Income statement retrieved');
              } else if (toolCall.name === 'get_balance_sheet') {
                result = await getBalanceSheet(
                  toolCall.input.symbol,
                  toolCall.input.period || 'annual',
                  toolCall.input.limit || 5
                );
              } else if (toolCall.name === 'get_cash_flow') {
                result = await getCashFlowStatement(
                  toolCall.input.symbol,
                  toolCall.input.period || 'annual',
                  toolCall.input.limit || 5
                );
              } else if (toolCall.name === 'get_key_metrics') {
                result = await getKeyMetrics(
                  toolCall.input.symbol,
                  toolCall.input.period || 'annual',
                  toolCall.input.limit || 5
                );
              } else if (toolCall.name === 'get_financial_ratios') {
                result = await getFinancialRatios(
                  toolCall.input.symbol,
                  toolCall.input.period || 'annual',
                  toolCall.input.limit || 5
                );
              } else if (toolCall.name === 'get_stock_quote') {
                result = await getStockQuote(toolCall.input.symbol);
              } else if (toolCall.name === 'get_historical_price') {
                result = await getHistoricalPrice(
                  toolCall.input.symbol,
                  toolCall.input.from,
                  toolCall.input.to
                );
              } else if (toolCall.name === 'search_companies') {
                result = await searchCompanies(
                  toolCall.input.query,
                  toolCall.input.limit || 10
                );
              } else if (toolCall.name === 'get_stock_peers') {
                result = await getStockPeers(toolCall.input.symbol);
              } else if (toolCall.name === 'get_financial_news') {
                result = await getFinancialNews(
                  toolCall.input.symbol,
                  toolCall.input.limit || 5
                );
              } else if (toolCall.name === 'get_rsi') {
                result = await getRSI(
                  toolCall.input.symbol,
                  toolCall.input.period || 14
                );
              } else if (toolCall.name === 'get_macd') {
                result = await getMACD(
                  toolCall.input.symbol
                );
              } else if (toolCall.name === 'get_ema') {
                result = await getEMA(
                  toolCall.input.symbol,
                  toolCall.input.period || 50
                );
              } else if (toolCall.name === 'get_sma') {
                result = await getSMA(
                  toolCall.input.symbol,
                  toolCall.input.period || 50
                );
              } else if (toolCall.name === 'get_adx') {
                result = await getADX(
                  toolCall.input.symbol,
                  toolCall.input.period || 14
                );
              } else if (toolCall.name === 'get_williams_r') {
                result = await getWilliamsR(
                  toolCall.input.symbol,
                  toolCall.input.period || 14
                );
              } else if (toolCall.name === 'get_cci') {
                result = await getCCI(
                  toolCall.input.symbol,
                  toolCall.input.period || 20
                );
              } else if (toolCall.name === 'get_stochastic') {
                result = await getStochasticOscillator(
                  toolCall.input.symbol,
                  toolCall.input.period || 14
                );
              } else if (toolCall.name === 'get_economic_calendar') {
                result = await getEconomicCalendar(
                  toolCall.input.from,
                  toolCall.input.to
                );
              } else if (toolCall.name === 'get_treasury_rates') {
                result = await getTreasuryRates(
                  toolCall.input.from,
                  toolCall.input.to
                );
              } else if (toolCall.name === 'get_economic_indicator') {
                result = await getEconomicIndicator(
                  toolCall.input.indicator,
                  toolCall.input.from,
                  toolCall.input.to
                );
              } else if (toolCall.name === 'get_insider_trading') {
                result = await getInsiderTrading(
                  toolCall.input.symbol,
                  toolCall.input.limit || 20
                );
              } else if (toolCall.name === 'get_insider_trade_statistics') {
                result = await getInsiderTradeStatistics(toolCall.input.symbol);
              } else if (toolCall.name === 'get_earnings_calendar') {
                result = await getEarningsCalendar(
                  toolCall.input.from,
                  toolCall.input.to
                );
              } else if (toolCall.name === 'get_earnings_surprises') {
                result = await getEarningsSurprises(toolCall.input.symbol);
              } else if (toolCall.name === 'get_analyst_estimates') {
                result = await getAnalystEstimates(
                  toolCall.input.symbol,
                  toolCall.input.period || 'annual',
                  toolCall.input.limit || 5
                );
              } else if (toolCall.name === 'get_forex_quote') {
                result = await getForexQuote(toolCall.input.pair);
              } else if (toolCall.name === 'get_forex_list') {
                result = await getForexList();
              } else if (toolCall.name === 'get_commodity_quotes') {
                result = await getCommodityQuotes();
              } else if (toolCall.name === 'get_cot_report') {
                result = await getCOTReport(toolCall.input.symbol);
              } else if (toolCall.name === 'get_cot_analysis') {
                result = await getCOTAnalysis(toolCall.input.symbol);
              } else if (toolCall.name === 'get_press_releases') {
                result = await getPressReleases(
                  toolCall.input.symbol,
                  toolCall.input.limit || 20
                );
              } else if (toolCall.name === 'get_dividend_history') {
                result = await getDividendHistory(toolCall.input.symbol);
              } else if (toolCall.name === 'get_stock_split_history') {
                result = await getStockSplitHistory(toolCall.input.symbol);
              } else if (toolCall.name === 'get_ipo_calendar') {
                result = await getIPOCalendar(
                  toolCall.input.from,
                  toolCall.input.to
                );
              } else if (toolCall.name === 'get_intraday_price') {
                result = await getIntradayPrice(
                  toolCall.input.symbol,
                  toolCall.input.interval || '15min'
                );
              } else if (toolCall.name === 'get_price_target') {
                result = await getPriceTarget(toolCall.input.symbol);
              } else if (toolCall.name === 'get_price_target_summary') {
                result = await getPriceTargetSummary(toolCall.input.symbol);
              } else if (toolCall.name === 'get_upgrades_downgrades') {
                result = await getUpgradesDowngrades(toolCall.input.symbol);
              } else if (toolCall.name === 'get_institutional_holders') {
                result = await getInstitutionalHolders(toolCall.input.symbol);
              } else if (toolCall.name === 'get_esg_score') {
                result = await getESGScore(toolCall.input.symbol);
              } else if (toolCall.name === 'get_social_sentiment') {
                result = await getSocialSentiment(
                  toolCall.input.symbol,
                  toolCall.input.limit || 10
                );
              } else if (toolCall.name === 'get_congressional_trading') {
                result = await getCongressionalTrading(toolCall.input.symbol);
              } else if (toolCall.name === 'get_senate_trading') {
                result = await getSenateTrading(toolCall.input.symbol);
              } else if (toolCall.name === 'search_by_cik') {
                result = await searchByCIK(toolCall.input.cik);
              } else if (toolCall.name === 'search_by_cusip') {
                result = await searchByCUSIP(toolCall.input.cusip);
              } else if (toolCall.name === 'search_by_isin') {
                result = await searchByISIN(toolCall.input.isin);
              } else if (toolCall.name === 'get_stock_screener') {
                result = await getStockScreener(toolCall.input);
              } else if (toolCall.name === 'get_market_hours') {
                result = await getMarketHours();
              } else if (toolCall.name === 'get_etf_holdings') {
                result = await getETFHoldings(toolCall.input.symbol);
              } else if (toolCall.name === 'get_etf_sector_weightings') {
                result = await getETFSectorWeightings(toolCall.input.symbol);
              } else if (toolCall.name === 'get_etf_country_weightings') {
                result = await getETFCountryWeightings(toolCall.input.symbol);
              } else if (toolCall.name === 'get_financial_growth') {
                result = await getFinancialGrowth(
                  toolCall.input.symbol,
                  toolCall.input.period || 'annual',
                  toolCall.input.limit || 5
                );
              } else if (toolCall.name === 'get_company_outlook') {
                result = await getCompanyOutlook(toolCall.input.symbol);
              } else if (toolCall.name === 'get_stock_news_sentiment') {
                result = await getStockNewsSentiment(
                  toolCall.input.symbol,
                  toolCall.input.limit || 5
                );
              } else if (toolCall.name === 'get_crypto_quote') {
                result = await getCryptoQuote(toolCall.input.symbol);
              } else if (toolCall.name === 'get_crypto_list') {
                result = await getCryptoList();
              } else if (toolCall.name === 'get_forex_historical') {
                result = await getForexHistorical(
                  toolCall.input.pair,
                  toolCall.input.from,
                  toolCall.input.to
                );
              } else if (toolCall.name === 'get_sec_filings') {
                result = await getSECFilings(
                  toolCall.input.symbol,
                  toolCall.input.type,
                  toolCall.input.limit || 20
                );
              } else if (toolCall.name === 'get_company_notes') {
                result = await getCompanyNotes(toolCall.input.symbol);
              } else if (toolCall.name === 'get_earnings_call_transcript') {
                result = await getEarningsCallTranscript(
                  toolCall.input.symbol,
                  toolCall.input.year,
                  toolCall.input.quarter
                );
              } else if (toolCall.name === 'run_monte_carlo_simulation') {
                logger.debug('   → Running Monte Carlo simulation...');
                logger.debug('      Simulations:', toolCall.input.num_simulations || 10000);
                logger.debug('      Time horizon:', toolCall.input.time_horizon || 252);
                logger.debug('      Initial investment:', toolCall.input.initial_investment || 10000);

                // NEW: Support symbol-based mode (recommended) or manual historical_prices mode
                let simulationInput: any = {
                  num_simulations: toolCall.input.num_simulations || 10000,
                  time_horizon: toolCall.input.time_horizon || 252,
                  initial_investment: toolCall.input.initial_investment || 10000
                };

                if (toolCall.input.symbol) {
                  logger.debug('      📊 Mode: API-based (fetching data for symbol:', toolCall.input.symbol + ')');
                  simulationInput.symbol = toolCall.input.symbol;
                } else if (toolCall.input.historical_prices && Array.isArray(toolCall.input.historical_prices)) {
                  logger.debug('      📊 Mode: Manual (using provided historical prices)');
                  simulationInput.historical_prices = toolCall.input.historical_prices;
                } else {
                  throw new Error('Either symbol or historical_prices parameter is required');
                }

                const simulationResult = await executeMonteCarloSimulation(simulationInput);

                logger.debug('   ✓ Monte Carlo simulation complete:', {
                  success: simulationResult.success,
                  hasResult: !!simulationResult.result,
                  error: simulationResult.error
                });

                // Check if simulation was successful
                if (!simulationResult.success || !simulationResult.result) {
                  throw new Error(simulationResult.error || 'Monte Carlo simulation failed');
                }

                result = simulationResult.result;

                // Store for session saving
                refs.pythonCodeUsed = simulationResult.code || '';
                refs.monteCarloData = result;

                // Send Python code separately
                logger.debug('   📊 Sending Python code to client (length:', simulationResult.code?.length || 0, 'chars)');
                safeWrite(`data: ${JSON.stringify({
                  type: 'python_code',
                  code: simulationResult.code
                })}\n\n`);
              } else if (toolCall.name === 'calculate_options_price') {
                logger.debug('   → Calculating options prices...');
                logger.debug('      Strike price:', toolCall.input.strike_price);
                logger.debug('      Time to maturity:', toolCall.input.time_to_maturity);

                // NEW: Support symbol-based mode (recommended) or manual mode
                let optionsInput: any = {
                  strike_price: toolCall.input.strike_price,
                  time_to_maturity: toolCall.input.time_to_maturity,
                  risk_free_rate: toolCall.input.risk_free_rate || 0.05,
                  option_type: toolCall.input.option_type || 'call'
                };

                if (toolCall.input.symbol) {
                  logger.debug('      📊 Mode: API-based (fetching data for symbol:', toolCall.input.symbol + ')');
                  optionsInput.symbol = toolCall.input.symbol;
                  if (toolCall.input.volatility) {
                    logger.debug('      Using provided volatility:', toolCall.input.volatility);
                    optionsInput.volatility = toolCall.input.volatility;
                  } else {
                    logger.debug('      Will calculate historical volatility automatically');
                  }
                } else if (toolCall.input.stock_price) {
                  logger.debug('      📊 Mode: Manual');
                  logger.debug('      Stock price:', toolCall.input.stock_price);
                  optionsInput.stock_price = toolCall.input.stock_price;
                  optionsInput.volatility = toolCall.input.volatility;
                } else {
                  throw new Error('Either symbol or stock_price parameter is required');
                }

                const optionsResult = await executeOptionsPricing(optionsInput);

                logger.debug('   ✓ Options pricing complete:', {
                  success: optionsResult.success,
                  hasResult: !!optionsResult.result,
                  error: optionsResult.error
                });

                // Check if pricing was successful
                if (!optionsResult.success || !optionsResult.result) {
                  throw new Error(optionsResult.error || 'Options pricing failed');
                }

                result = optionsResult.result;

                // Send Python code separately
                logger.debug('   📊 Sending Python code to client (length:', optionsResult.code?.length || 0, 'chars)');
                safeWrite(`data: ${JSON.stringify({
                  type: 'python_code',
                  code: optionsResult.code
                })}\n\n`);
              } else if (toolCall.name === 'estimate_garch_volatility') {
                logger.debug('   → Estimating GARCH volatility model...');
                logger.debug('      Symbol:', toolCall.input.symbol);
                logger.debug('      GARCH order: p=' + (toolCall.input.p || 1) + ', q=' + (toolCall.input.q || 1));

                const garchInput: any = {
                  symbol: toolCall.input.symbol,
                  p: toolCall.input.p || 1,
                  q: toolCall.input.q || 1,
                  forecast_horizon: toolCall.input.forecast_horizon || 30,
                  data_period: toolCall.input.data_period || 504
                };

                logger.debug('      Forecast horizon:', garchInput.forecast_horizon, 'days');
                logger.debug('      Data period:', garchInput.data_period, 'days');

                const garchResult = await executeGarchModel(garchInput);

                logger.debug('   ✓ GARCH model estimation complete:', {
                  success: garchResult.success,
                  hasResult: !!garchResult.result,
                  error: garchResult.error
                });

                // Check if estimation was successful
                if (!garchResult.success || !garchResult.result) {
                  throw new Error(garchResult.error || 'GARCH model estimation failed');
                }

                result = garchResult.result;

                // Send Python code separately
                logger.debug('   📊 Sending Python code to client (length:', garchResult.code?.length || 0, 'chars)');
                safeWrite(`data: ${JSON.stringify({
                  type: 'python_code',
                  code: garchResult.code
                })}\n\n`);
              } else if (toolCall.name === 'calculate_var') {
                logger.debug('   → Calculating Value at Risk (VaR)...');
                logger.debug('      Symbol:', toolCall.input.symbol);
                logger.debug('      Portfolio value:', toolCall.input.portfolio_value || 100000);

                const varInput: any = {
                  symbol: toolCall.input.symbol,
                  portfolio_value: toolCall.input.portfolio_value || 100000,
                  confidence_levels: toolCall.input.confidence_levels || [0.90, 0.95, 0.99],
                  time_horizon: toolCall.input.time_horizon || 1,
                  num_simulations: toolCall.input.num_simulations || 10000,
                  data_period: toolCall.input.data_period || 504
                };

                logger.debug('      Confidence levels:', varInput.confidence_levels);
                logger.debug('      Time horizon:', varInput.time_horizon, 'days');
                logger.debug('      Monte Carlo simulations:', varInput.num_simulations);

                const varResult = await executeVarCalculation(varInput);

                logger.debug('   ✓ VaR calculation complete:', {
                  success: varResult.success,
                  hasResult: !!varResult.result,
                  error: varResult.error
                });

                // Check if calculation was successful
                if (!varResult.success || !varResult.result) {
                  throw new Error(varResult.error || 'VaR calculation failed');
                }

                result = varResult.result;

                // Send Python code separately
                logger.debug('   📊 Sending Python code to client (length:', varResult.code?.length || 0, 'chars)');
                safeWrite(`data: ${JSON.stringify({
                  type: 'python_code',
                  code: varResult.code
                })}\n\n`);
              } else if (toolCall.name === 'optimize_portfolio') {
                logger.debug('   → Optimizing portfolio allocation...');
                logger.debug('      Symbols:', toolCall.input.symbols?.join(', '));

                if (!toolCall.input.symbols || !Array.isArray(toolCall.input.symbols) || toolCall.input.symbols.length < 2) {
                  throw new Error('At least 2 symbols are required for portfolio optimization');
                }

                const portfolioInput: any = {
                  symbols: toolCall.input.symbols,
                  risk_free_rate: toolCall.input.risk_free_rate || 0.02,
                  min_weight: toolCall.input.min_weight || 0.0,
                  max_weight: toolCall.input.max_weight || 1.0,
                  data_period: toolCall.input.data_period || 504,
                  generate_frontier: toolCall.input.generate_frontier !== false,
                  frontier_points: toolCall.input.frontier_points || 50
                };

                logger.debug('      Risk-free rate:', portfolioInput.risk_free_rate);
                logger.debug('      Weight constraints: [' + portfolioInput.min_weight + ', ' + portfolioInput.max_weight + ']');
                logger.debug('      Generate efficient frontier:', portfolioInput.generate_frontier);

                const portfolioResult = await executePortfolioOptimization(portfolioInput);

                logger.debug('   ✓ Portfolio optimization complete:', {
                  success: portfolioResult.success,
                  hasResult: !!portfolioResult.result,
                  error: portfolioResult.error
                });

                // Check if optimization was successful
                if (!portfolioResult.success || !portfolioResult.result) {
                  throw new Error(portfolioResult.error || 'Portfolio optimization failed');
                }

                result = portfolioResult.result;

                // Send Python code separately
                logger.debug('   📊 Sending Python code to client (length:', portfolioResult.code?.length || 0, 'chars)');
                safeWrite(`data: ${JSON.stringify({
                  type: 'python_code',
                  code: portfolioResult.code
                })}\n\n`);
              } else if (toolCall.name === 'analyze_risk_metrics') {
                logger.debug('   → Analyzing risk metrics...');
                logger.debug('      Symbol:', toolCall.input.symbol);
                logger.debug('      Benchmark:', toolCall.input.benchmark_symbol || 'SPY');

                const riskMetricsInput: any = {
                  symbol: toolCall.input.symbol,
                  benchmark_symbol: toolCall.input.benchmark_symbol || 'SPY',
                  risk_free_rate: toolCall.input.risk_free_rate || 0.02,
                  data_period: toolCall.input.data_period || 504
                };

                logger.debug('      Risk-free rate:', riskMetricsInput.risk_free_rate);
                logger.debug('      Data period:', riskMetricsInput.data_period, 'days');

                const riskMetricsResult = await executeRiskMetricsAnalysis(riskMetricsInput);

                logger.debug('   ✓ Risk metrics analysis complete:', {
                  success: riskMetricsResult.success,
                  hasResult: !!riskMetricsResult.result,
                  error: riskMetricsResult.error
                });

                // Check if analysis was successful
                if (!riskMetricsResult.success || !riskMetricsResult.result) {
                  throw new Error(riskMetricsResult.error || 'Risk metrics analysis failed');
                }

                result = riskMetricsResult.result;

                // Send Python code separately
                logger.debug('   📊 Sending Python code to client (length:', riskMetricsResult.code?.length || 0, 'chars)');
                safeWrite(`data: ${JSON.stringify({
                  type: 'python_code',
                  code: riskMetricsResult.code
                })}\n\n`);
              } else if (toolCall.name === 'create_plot') {
                logger.debug('   → Creating custom plot...');
                logger.debug('      Plot type:', toolCall.input.plot_type);
                logger.debug('      Title:', toolCall.input.title || 'Financial Chart');

                const plotInput: any = {
                  plot_type: toolCall.input.plot_type || 'line',
                  data: toolCall.input.data,
                  title: toolCall.input.title,
                  xlabel: toolCall.input.xlabel,
                  ylabel: toolCall.input.ylabel,
                  color: toolCall.input.color,
                  figsize: toolCall.input.figsize,
                  grid: toolCall.input.grid,
                  legend: toolCall.input.legend,
                  style: toolCall.input.style,
                  marker: toolCall.input.marker,
                  alpha: toolCall.input.alpha,
                  theme: toolCall.input.theme
                };

                // Log if data is a symbol (string) or custom data
                if (typeof plotInput.data === 'string') {
                  logger.debug('      Data source: Symbol', plotInput.data);
                } else {
                  logger.debug('      Data source: Custom data');
                }

                const plotResult = await executePlot(plotInput);

                logger.debug('   ✓ Plot creation complete:', {
                  success: plotResult.success,
                  hasResult: !!plotResult.result,
                  error: plotResult.error
                });

                // Check if plot was successful
                if (!plotResult.success || !plotResult.result) {
                  throw new Error(plotResult.error || 'Plot creation failed');
                }

                result = plotResult.result;

                // Send Python code separately
                logger.debug('   📊 Sending Python code to client (length:', plotResult.code?.length || 0, 'chars)');
                safeWrite(`data: ${JSON.stringify({
                  type: 'python_code',
                  code: plotResult.code
                })}\n\n`);

                // Send plot URL to client so frontend can correct figure references
                if (result.image_url) {
                  const plotUrl = result.image_url;
                  logger.debug('   🖼️  Sending plot URL to client:', plotUrl);
                  safeWrite(`data: ${JSON.stringify({
                    type: 'custom_python_figures',
                    figureId: `plot-${Date.now()}`,
                    figures: [plotUrl],
                    figureUrls: [plotUrl],
                    output: '',
                    description: toolCall.input.title || 'Financial Chart'
                  })}\n\n`);
                }
              } else if (toolCall.name === 'execute_custom_python_analysis') {
                logger.debug('   → Executing custom Python code...');
                logger.debug('      Description:', toolCall.input.description || 'Custom analysis');
                logger.debug('      Code length:', toolCall.input.code?.length || 0, 'chars');

                // Send Python code to client for Code History panel
                const pyEntryId = toolCall.id || `py-${Date.now()}`;
                const pyEntryDesc = toolCall.input.description || 'Python analysis';
                safeWrite(`data: ${JSON.stringify({
                  type: 'python_code_entry',
                  toolId: pyEntryId,
                  code: toolCall.input.code,
                  description: pyEntryDesc,
                })}\n\n`);

                // Track for session persistence
                const { agent: pyAgent } = parseAgentPrefix(pyEntryDesc);
                pythonCodeEntries.push({
                  id: pyEntryId,
                  code: toolCall.input.code,
                  description: pyEntryDesc,
                  agent: pyAgent,
                  timestamp: Date.now(),
                  status: 'running',
                });

                const customPythonResult = await executeCustomPython({
                  code: toolCall.input.code,
                  context: toolCall.input.context,
                  description: toolCall.input.description,
                  sessionId,
                });

                logger.debug('   ✓ Custom Python execution complete:', {
                  success: customPythonResult.success,
                  hasOutput: !!customPythonResult.result?.output,
                  figuresCount: customPythonResult.result?.figures?.length || 0,
                  error: customPythonResult.error
                });

                // Update code entry status for persistence
                const pyEntry = pythonCodeEntries.find(e => e.id === pyEntryId);
                if (pyEntry) {
                  pyEntry.status = customPythonResult.success ? 'completed' : 'error';
                  pyEntry.duration = Date.now() - pyEntry.timestamp;
                  if (!customPythonResult.success) pyEntry.error = customPythonResult.error;
                }

                // Check if execution was successful
                if (!customPythonResult.success || !customPythonResult.result) {
                  // Return structured error with scriptId so Claude can use repair tools
                  const errorInfo: Record<string, any> = {
                    success: false,
                    error: customPythonResult.error || 'Custom Python execution failed',
                  };
                  if (customPythonResult.scriptId) {
                    errorInfo.script_id = customPythonResult.scriptId;
                    errorInfo.repair_hint = 'Use read_python_script, then apply_patch with <<<< SEARCH / ==== / >>>> REPLACE blocks (most reliable), then run_python_script. This is faster and cheaper than rewriting the entire script.';
                  }
                  if (customPythonResult.structuredErrors) {
                    errorInfo.structured_errors = JSON.parse(customPythonResult.structuredErrors);
                  }
                  result = errorInfo;
                } else {

                result = customPythonResult.result;
                // Attach scriptId to successful results too (for potential later re-use)
                if (customPythonResult.scriptId) {
                  (result as any).__script_id = customPythonResult.scriptId;
                }
                // Surface fabrication warnings so Claude sees them and rewrites the script
                if (customPythonResult.fabricationWarnings && customPythonResult.fabricationWarnings.length > 0) {
                  (result as any).__fabrication_warnings = customPythonResult.fabricationWarnings;
                  logger.warn('🚨 Data fabrication warnings detected in script:', customPythonResult.fabricationWarnings);
                }

                // Don't send Python code to client (too slow to stream)
                logger.debug('   📊 Python code generated (length:', customPythonResult.code?.length || 0, 'chars) - not streaming to client for speed');

                // Send figures if any were generated
                if (result.figures && result.figures.length > 0) {
                  // Generate unique ID for this figure batch
                  const figureId = `fig-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

                  logger.debug('   🖼️  Saving', result.figures.length, 'figure(s) with ID:', figureId);

                  // Store the original figures array
                  const originalFigures = result.figures;
                  const figureUrls: string[] = [];

                  // Save each figure as a PNG file and get URL
                  const fs = await import('fs');
                  const figuresDir = path.join(process.cwd(), 'dist', 'public', 'figures');

                  // Ensure directory exists
                  if (!fs.existsSync(figuresDir)) {
                    fs.mkdirSync(figuresDir, { recursive: true });
                  }

                  for (let idx = 0; idx < originalFigures.length; idx++) {
                    const figureFilename = `${figureId}-${idx}.png`;
                    const figurePath = path.join(figuresDir, figureFilename);

                    // Write base64 image to file
                    const base64Data = originalFigures[idx];
                    fs.writeFileSync(figurePath, Buffer.from(base64Data, 'base64'));

                    // Create URL (works for both local and production)
                    const figureUrl = `/figures/${figureFilename}`;
                    figureUrls.push(figureUrl);

                    logger.debug(`   💾 Saved figure: ${figureFilename}`);
                  }

                  // Send base64 figures + file URLs to client
                  // base64 in `figures` ensures persistence when shared to DB
                  // file URLs in `figureUrls` used for fast display during current session
                  try {
                    safeWrite(`data: ${JSON.stringify({
                      type: 'custom_python_figures',
                      figureId: figureId,
                      figures: originalFigures,   // base64 data — persisted to DB via share
                      figureUrls: figureUrls,     // file URLs — fast display during session
                      output: result.output,
                      description: toolCall.input.description
                    })}\n\n`);
                  } catch (serErr) {
                    logger.warn(`Figure serialization failed, sending URLs only: ${(serErr as Error).message}`);
                    safeWrite(`data: ${JSON.stringify({
                      type: 'custom_python_figures',
                      figureId: figureId,
                      figures: [],
                      figureUrls: figureUrls,
                      output: result.output,
                      description: toolCall.input.description
                    })}\n\n`);
                  }

                  // Analyze figures with vision model (Haiku) if enabled
                  const enableFigureAnalysis = process.env.ENABLE_FIGURE_ANALYSIS !== 'false';
                  let figureDescriptions: { index: number; description: string; success: boolean }[] = [];

                  if (enableFigureAnalysis) {
                    logger.info(`🔍 Analyzing ${originalFigures.length} figure(s) with vision model...`);
                    safeWrite(`data: ${JSON.stringify({ type: 'status', message: 'Analyzing generated figures...' })}\n\n`);
                    try {
                      figureDescriptions = await analyzeFigures(originalFigures, toolCall.input.description);
                      logger.info('✅ Figure analysis complete');
                    } catch (err: any) {
                      logger.warn(`⚠️ Figure analysis failed: ${err?.message || err}`);
                    }
                  }

                  // Format output so Claude has regression results AND figure references.
                  // CRITICAL: Python numerical output goes FIRST (regression tables, coefficients)
                  // because this is what Claude needs to build LaTeX tables. Figure URLs go
                  // second — they're short and always survive.
                  let formattedOutput = '';

                  // 1. Python printed output FIRST (regression results, coefficients, test statistics)
                  if (result.output) {
                    formattedOutput += '📊 **Python output (regression results & statistics):**\n' + result.output + '\n\n';
                  }

                  // 2. Figure URLs (compact — always survive truncation)
                  formattedOutput += '---\n🖼️ **Figures generated:**\n';
                  figureUrls.forEach((url, idx) => {
                    formattedOutput += `![Figure ${idx + 1}](${url})\n`;
                  });

                  // 3. Figure analyses (nice-to-have, can be truncated)
                  figureUrls.forEach((url, idx) => {
                    const analysis = figureDescriptions.find(d => d.index === idx);
                    if (analysis?.success && analysis.description) {
                      formattedOutput += `**Figure ${idx + 1} analysis:** ${analysis.description}\n\n`;
                    }
                  });

                  // Compute the sequential figure indices for LaTeX {{FIG:N}} placeholders
                  // Count figures from all PRIOR entries (excluding any entry this script would replace)
                  const currentScriptId = customPythonResult.scriptId;
                  let priorFigCount = 0;
                  for (const entry of customPythonFiguresData) {
                    if (currentScriptId && entry.scriptId === currentScriptId) continue; // skip entry being replaced
                    priorFigCount += entry.figures.length;
                  }
                  formattedOutput += `\n📎 **LaTeX figure placeholders:** `;
                  for (let fi = 0; fi < originalFigures.length; fi++) {
                    formattedOutput += `Figure ${fi + 1} → \`{{FIG:${priorFigCount + fi}}}\`  `;
                  }
                  formattedOutput += `\nUse these placeholders in write_paper_section LaTeX content.\n`;

                  result.output = formattedOutput;

                  logger.debug('   ✅ Figure URLs:', figureUrls);

                  // Remove base64 data from result sent to Claude
                  delete result.figures;

                  // Store figures for session saving
                  // If this script already has figures stored, REPLACE them (don't duplicate)
                  const existingFigIdx = currentScriptId
                    ? customPythonFiguresData.findIndex(e => e.scriptId === currentScriptId)
                    : -1;
                  const figEntry = {
                    id: figureId,
                    scriptId: currentScriptId,
                    figures: originalFigures,
                    figureUrls: figureUrls,
                    output: result.output,
                    description: toolCall.input.description
                  };
                  if (existingFigIdx >= 0) {
                    logger.info(`🔄 Replacing figures for script ${currentScriptId} (was at index ${existingFigIdx})`);
                    customPythonFiguresData[existingFigIdx] = figEntry;
                  } else {
                    customPythonFiguresData.push(figEntry);
                  }
                }
                // Handle generated files (Excel, etc.)
                if (result.files && result.files.length > 0) {
                  const fsFiles = await import('fs');
                  const downloadsDir = path.resolve('downloads');
                  if (!fsFiles.existsSync(downloadsDir)) {
                    fsFiles.mkdirSync(downloadsDir, { recursive: true });
                  }

                  const fileLinks: Array<{ url: string; name: string }> = [];
                  for (const file of result.files) {
                    const uniqueName = `${Date.now()}_${file.filename}`;
                    const destPath = path.join(downloadsDir, uniqueName);
                    fsFiles.copyFileSync(file.filepath, destPath);

                    // Track data files (CSV, Parquet, Excel, Feather, PKL, JSON) for ZIP inclusion
                    const ext = file.filename.toLowerCase();
                    if (ext.endsWith('.csv') || ext.endsWith('.parquet') || ext.endsWith('.feather') || ext.endsWith('.pkl') || ext.endsWith('.xlsx') || ext.endsWith('.json') || ext.endsWith('.tsv')) {
                      sessionDataFiles.push({ filename: file.filename, filepath: destPath, data_type: file.data_type });
                      logger.info(`📦 Tracked data file for ZIP: ${file.filename} (${file.data_type || 'data'})`);
                    }

                    // Cleanup temp file
                    try { fsFiles.unlinkSync(file.filepath); } catch {}

                    const downloadUrl = `/api/download/${uniqueName}`;
                    fileLinks.push({ url: downloadUrl, name: file.filename });
                  }

                  // Add download links to output for Claude to include
                  let fileOutput = '\n\n📥 **FICHIERS GÉNÉRÉS:**\n';
                  fileLinks.forEach(f => {
                    fileOutput += `\n- [Télécharger ${f.name}](${f.url})\n`;
                  });
                  fileOutput += '\n⚠️ IMPORTANT: Tu DOIS inclure chaque lien de téléchargement dans ta réponse.';
                  result.output = (result.output || '') + fileOutput;

                  logger.debug('   📥 Files processed:', fileLinks.map(f => f.name));

                  delete result.files;
                }
                // Track provenance metadata from Python executor
                if (result.metadata && Array.isArray(result.metadata)) {
                  for (const meta of result.metadata) {
                    ctx.sessionMetadata.push({ filename: meta.filename || 'unknown', metadata: meta });
                  }
                  delete result.metadata;
                }
                } // end else (successful execution)

              // ── Incremental Repair Tools ──────────────────────────────
              } else if (toolCall.name === 'read_python_script') {
                logger.debug('   → Reading Python script:', toolCall.input.script_id);
                const readResult = readScript(toolCall.input.script_id);
                if (!readResult.success) {
                  result = { success: false, error: readResult.error };
                } else {
                  result = { success: true, content: readResult.content };
                }

              } else if (toolCall.name === 'apply_patch') {
                logger.debug('   → Applying patch to script:', toolCall.input.script_id);
                const patchResult = patchScript(toolCall.input.script_id, toolCall.input.diff);
                if (!patchResult.success) {
                  result = {
                    success: false,
                    error: patchResult.error,
                    hunksApplied: patchResult.hunksApplied,
                    hunksTotal: patchResult.hunksTotal,
                    repairAttempt: patchResult.repairAttempt,
                    maxReached: patchResult.maxReached,
                  };
                } else {
                  result = {
                    success: true,
                    hunksApplied: patchResult.hunksApplied,
                    hunksTotal: patchResult.hunksTotal,
                    repairAttempt: patchResult.repairAttempt,
                    maxReached: patchResult.maxReached,
                    message: `Patch applied successfully (${patchResult.hunksApplied}/${patchResult.hunksTotal} hunks). Use run_python_script to verify.`,
                  };
                }

              } else if (toolCall.name === 'run_python_script') {
                logger.debug('   → Re-running Python script:', toolCall.input.script_id);
                const rerunResult = await rerunScript(toolCall.input.script_id);

                // Send re-run code to client for Code History panel & persist
                if (rerunResult.code) {
                  const rerunEntryId = toolCall.id || `py-rerun-${Date.now()}`;
                  safeWrite(`data: ${JSON.stringify({
                    type: 'python_code_entry',
                    toolId: rerunEntryId,
                    code: rerunResult.code,
                    description: 'Re-run after patch',
                  })}\n\n`);

                  pythonCodeEntries.push({
                    id: rerunEntryId,
                    code: rerunResult.code,
                    description: 'Re-run after patch',
                    agent: 'unknown',
                    timestamp: Date.now(),
                    status: rerunResult.success ? 'completed' : 'error',
                    error: rerunResult.error,
                  });
                }

                if (!rerunResult.success || !rerunResult.result) {
                  const errorInfo: Record<string, any> = {
                    success: false,
                    error: rerunResult.error || 'Script execution failed',
                    script_id: rerunResult.scriptId,
                  };
                  if (rerunResult.structuredErrors) {
                    errorInfo.structured_errors = JSON.parse(rerunResult.structuredErrors);
                  }
                  const repairInfo = getRepairInfo(rerunResult.scriptId);
                  if (repairInfo) {
                    errorInfo.repair_attempts = repairInfo.repairAttempts;
                    errorInfo.max_repairs = repairInfo.maxRepairs;
                  }
                  result = errorInfo;
                } else {
                  result = rerunResult.result;

                  // Process figures for re-run results (same logic as initial run)
                  if (result.figures && result.figures.length > 0) {
                    const figureId = `fig-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                    const originalFigures = result.figures;
                    const figureUrls: string[] = [];
                    const fs = await import('fs');
                    const figuresDir = path.join(process.cwd(), 'dist', 'public', 'figures');
                    if (!fs.existsSync(figuresDir)) {
                      fs.mkdirSync(figuresDir, { recursive: true });
                    }
                    for (let idx = 0; idx < originalFigures.length; idx++) {
                      const figureFilename = `${figureId}-${idx}.png`;
                      const figurePath = path.join(figuresDir, figureFilename);
                      fs.writeFileSync(figurePath, Buffer.from(originalFigures[idx], 'base64'));
                      figureUrls.push(`/figures/${figureFilename}`);
                    }

                    safeWrite(`data: ${JSON.stringify({
                      type: 'custom_python_figures',
                      figureId,
                      figures: originalFigures,
                      figureUrls,
                      output: result.output,
                      description: 'Re-run after patch'
                    })}\n\n`);

                    // Replace existing figures for this script instead of appending duplicates
                    const rerunScriptId = toolCall.input.script_id;

                    let formattedOutput = '📊 **FIGURES GÉNÉRÉES (re-run) — À INCLURE DANS TA RÉPONSE:**\n';
                    figureUrls.forEach((url, idx) => {
                      formattedOutput += `![Figure ${idx + 1}](${url})\n`;
                    });
                    formattedOutput += '\n';

                    // Compute the sequential figure indices for LaTeX {{FIG:N}} placeholders
                    let rerunPriorFigCount = 0;
                    for (const entry of customPythonFiguresData) {
                      if (rerunScriptId && entry.scriptId === rerunScriptId) continue; // skip entry being replaced
                      rerunPriorFigCount += entry.figures.length;
                    }
                    formattedOutput += `📎 **LaTeX figure placeholders (unchanged after re-run):** `;
                    for (let fi = 0; fi < originalFigures.length; fi++) {
                      formattedOutput += `Figure ${fi + 1} → \`{{FIG:${rerunPriorFigCount + fi}}}\`  `;
                    }
                    formattedOutput += `\nThese replace the previous (broken) figures at the same indices. No need to update your LaTeX.\n`;

                    if (result.output) {
                      formattedOutput += '---\n**Python output:**\n' + result.output;
                    }
                    result.output = formattedOutput;
                    delete result.figures;
                    const existingRerunIdx = rerunScriptId
                      ? customPythonFiguresData.findIndex(e => e.scriptId === rerunScriptId)
                      : -1;
                    const rerunFigEntry = {
                      id: figureId,
                      scriptId: rerunScriptId,
                      figures: originalFigures,
                      figureUrls,
                      output: result.output,
                      description: 'Re-run after patch'
                    };
                    if (existingRerunIdx >= 0) {
                      logger.info(`🔄 Replacing figures for re-run script ${rerunScriptId} (was at index ${existingRerunIdx})`);
                      customPythonFiguresData[existingRerunIdx] = rerunFigEntry;
                    } else {
                      customPythonFiguresData.push(rerunFigEntry);
                    }
                  }

                  if (result.files && result.files.length > 0) {
                    const fsFiles = await import('fs');
                    const downloadsDir = path.resolve('downloads');
                    if (!fsFiles.existsSync(downloadsDir)) {
                      fsFiles.mkdirSync(downloadsDir, { recursive: true });
                    }
                    const fileLinks: Array<{ url: string; name: string }> = [];
                    for (const file of result.files) {
                      const uniqueName = `${Date.now()}_${file.filename}`;
                      const destPath = path.join(downloadsDir, uniqueName);
                      fsFiles.copyFileSync(file.filepath, destPath);
                      try { fsFiles.unlinkSync(file.filepath); } catch {}
                      fileLinks.push({ url: `/api/download/${uniqueName}`, name: file.filename });
                    }
                    let fileOutput = '\n\n📥 **FICHIERS GÉNÉRÉS:**\n';
                    fileLinks.forEach(f => {
                      fileOutput += `\n- [Télécharger ${f.name}](${f.url})\n`;
                    });
                    result.output = (result.output || '') + fileOutput;
                    delete result.files;
                  }
                }

              } else if (toolCall.name === 'inspect_python_logs') {
                logger.debug('   → Inspecting logs for script:', toolCall.input.script_id);
                const logs = getLastError(toolCall.input.script_id);
                const repairInfo = getRepairInfo(toolCall.input.script_id);
                if (logs) {
                  result = {
                    ...JSON.parse(logs),
                    repair_info: repairInfo,
                  };
                } else {
                  result = {
                    message: 'No error logs found for this script. The last execution may have succeeded.',
                    repair_info: repairInfo,
                  };
                }

              } else if (toolCall.name === 'web_search_exa') {
                logger.debug('   → Web search (Exa):', toolCall.input.query);
                const searchResponse = await searchExa(
                  toolCall.input.query,
                  {
                    numResults: toolCall.input.numResults,
                    type: toolCall.input.type,
                    category: toolCall.input.category,
                    includeDomains: toolCall.input.includeDomains,
                    excludeDomains: toolCall.input.excludeDomains,
                    startPublishedDate: toolCall.input.startPublishedDate,
                    endPublishedDate: toolCall.input.endPublishedDate,
                    includeText: toolCall.input.includeText !== false,
                    maxCharacters: 2000,
                  }
                );
                result = searchResponse.results;
                logger.debug('   ✓ Search completed:', result.length, 'results');
              } else if (toolCall.name === 'get_contents_exa') {
                result = await getContentsExa(
                  toolCall.input.urls,
                  {
                    includeText: toolCall.input.includeText !== false,
                    maxCharacters: toolCall.input.maxCharacters || 3000,
                    includeHighlights: toolCall.input.includeHighlights,
                    highlightsQuery: toolCall.input.highlightsQuery,
                    numSentences: toolCall.input.numSentences,
                    includeSummary: toolCall.input.includeSummary,
                    summaryQuery: toolCall.input.summaryQuery,
                  }
                );
              } else if (toolCall.name === 'get_option_chain') {
                logger.info(`Getting option chain for: ${toolCall.input.symbol}`);
                result = await getOptionChain(toolCall.input.symbol);
                logger.success(`Option chain retrieved: ${result.options?.length || 0} contracts`);
              } else if (toolCall.name === 'get_option_prices') {
                logger.info(`Getting option prices for: ${toolCall.input.identifier}`);
                result = await getOptionPrices(toolCall.input.identifier);
                logger.success('Option prices retrieved');
              } else if (toolCall.name === 'get_option_greeks') {
                logger.info(`Getting option Greeks for: ${toolCall.input.identifier}`);
                result = await getOptionGreeks(toolCall.input.identifier);
                logger.success('Option Greeks retrieved');
              } else if (toolCall.name === 'get_eodhd_eod') {
                const { ticker, from_date, to_date, period } = toolCall.input;
                logger.info(`EODHD EOD: ${ticker} period=${period || 'd'} from=${from_date || 'all'} to=${to_date || 'today'}`);
                const bars = await getEODHDEOD(ticker, from_date, to_date, period || 'd');
                result = { ticker, period: period || 'd', count: bars.length, data: bars };
                logger.success(`EODHD EOD: ${bars.length} bars returned`);
              } else if (toolCall.name === 'get_eodhd_intraday') {
                const { ticker, interval, from_date, to_date } = toolCall.input;
                logger.info(`EODHD intraday: ${ticker} interval=${interval || '5m'}`);
                const bars = await getEODHDIntraday(ticker, interval || '5m', from_date, to_date);
                result = { ticker, interval: interval || '5m', count: bars.length, data: bars };
                logger.success(`EODHD intraday: ${bars.length} bars returned`);
              } else if (toolCall.name === 'get_eodhd_options') {
                const { ticker, from_date, to_date, expiration_date_from, expiration_date_to, contract_name } = toolCall.input;
                logger.info(`EODHD options chain: ${ticker}`);
                const chain = await getEODHDOptions(ticker, from_date, to_date, expiration_date_from, expiration_date_to, contract_name);
                result = chain;
                const totalContracts = (chain.data || []).reduce(
                  (acc: number, b: any) => acc + (b.options?.CALL?.length || 0) + (b.options?.PUT?.length || 0), 0
                );
                logger.success(`EODHD options: ${chain.data?.length || 0} expiry buckets, ${totalContracts} contracts`);
              } else if (toolCall.name === 'download_fmp_data') {
                logger.info(`Downloading FMP data: ${toolCall.input.data_type} (format: ${toolCall.input.format})`);
                const downloadResult = await executeDataDownload({
                  data_type: toolCall.input.data_type,
                  symbol: toolCall.input.symbol,
                  format: toolCall.input.format,
                  period: toolCall.input.period,
                  limit: toolCall.input.limit,
                  from_date: toolCall.input.from_date,
                  to_date: toolCall.input.to_date,
                  indicator_period: toolCall.input.indicator_period,
                  time_period: toolCall.input.time_period,
                  interval: toolCall.input.interval,
                  news_limit: toolCall.input.news_limit,
                  pair: toolCall.input.pair
                });

                if (downloadResult.success && downloadResult.result) {
                  // Generate download URL
                  const downloadUrl = `/api/download/${downloadResult.result.filename}`;
                  result = {
                    success: true,
                    filename: downloadResult.result.filename,
                    download_url: downloadUrl,
                    format: downloadResult.result.format,
                    file_size: downloadResult.result.file_size,
                    file_size_formatted: `${(downloadResult.result.file_size / 1024).toFixed(2)} KB`,
                    metadata: downloadResult.result.metadata
                  };
                  logger.success(`Data download ready: ${downloadResult.result.filename}`);
                } else {
                  throw new Error(downloadResult.error || 'Data download failed');
                }
              } else if (toolCall.name === 'firecrawl_scrape') {
                logger.info(`Firecrawl scrape: ${toolCall.input.url}`);
                result = await scrapeFirecrawl({
                  url: toolCall.input.url,
                  formats: toolCall.input.formats,
                  onlyMainContent: toolCall.input.onlyMainContent,
                  includeTags: toolCall.input.includeTags,
                  excludeTags: toolCall.input.excludeTags,
                  maxAge: toolCall.input.maxAge,
                  waitFor: toolCall.input.waitFor,
                  mobile: toolCall.input.mobile,
                  blockAds: toolCall.input.blockAds,
                  timeout: toolCall.input.timeout,
                  parsers: toolCall.input.parsers,
                });
              } else if (toolCall.name === 'firecrawl_search') {
                logger.info(`Firecrawl search: "${toolCall.input.query}"`);
                result = await searchFirecrawl({
                  query: toolCall.input.query,
                  limit: toolCall.input.limit,
                  sources: toolCall.input.sources,
                  categories: toolCall.input.categories,
                  country: toolCall.input.country,
                  tbs: toolCall.input.tbs,
                  onlyMainContent: toolCall.input.onlyMainContent,
                });
              } else if (toolCall.name === 'firecrawl_crawl') {
                logger.info(`Firecrawl crawl: ${toolCall.input.url} (limit: ${toolCall.input.limit || 10})`);
                result = await crawlFirecrawl({
                  url: toolCall.input.url,
                  prompt: toolCall.input.prompt,
                  limit: toolCall.input.limit,
                  includePaths: toolCall.input.includePaths,
                  excludePaths: toolCall.input.excludePaths,
                  maxDiscoveryDepth: toolCall.input.maxDiscoveryDepth,
                  sitemap: toolCall.input.sitemap,
                  crawlEntireDomain: toolCall.input.crawlEntireDomain,
                  allowSubdomains: toolCall.input.allowSubdomains,
                  ignoreQueryParameters: toolCall.input.ignoreQueryParameters,
                  onlyMainContent: toolCall.input.onlyMainContent,
                });
              } else if (toolCall.name === 'firecrawl_extract') {
                logger.info(`Firecrawl extract: ${toolCall.input.urls.length} URL(s)`);
                result = await extractFirecrawl({
                  urls: toolCall.input.urls,
                  prompt: toolCall.input.prompt,
                  schema: toolCall.input.schema,
                  enableWebSearch: toolCall.input.enableWebSearch,
                  includeSubdomains: toolCall.input.includeSubdomains,
                  showSources: toolCall.input.showSources,
                });
              } else if (toolCall.name === 'firecrawl_map') {
                logger.info(`Firecrawl map: ${toolCall.input.url}`);
                result = await mapFirecrawl({
                  url: toolCall.input.url,
                  search: toolCall.input.search,
                  sitemap: toolCall.input.sitemap,
                  includeSubdomains: toolCall.input.includeSubdomains,
                  ignoreQueryParameters: toolCall.input.ignoreQueryParameters,
                  limit: toolCall.input.limit,
                });
              } else if (toolCall.name === 'firecrawl_agent') {
                logger.info(`Firecrawl agent: "${toolCall.input.prompt.substring(0, 50)}..."`);
                result = await agentFirecrawl({
                  prompt: toolCall.input.prompt,
                  urls: toolCall.input.urls,
                  schema: toolCall.input.schema,
                  maxCredits: toolCall.input.maxCredits,
                  strictConstrainToURLs: toolCall.input.strictConstrainToURLs,
                  model: toolCall.input.model,
                });
              } else if (toolCall.name === 'firecrawl_batch_scrape') {
                logger.info(`Firecrawl batch scrape: ${toolCall.input.urls.length} URL(s)`);
                result = await batchScrapeFirecrawl({
                  urls: toolCall.input.urls,
                  maxConcurrency: toolCall.input.maxConcurrency,
                  onlyMainContent: toolCall.input.onlyMainContent,
                  parsers: toolCall.input.parsers,
                  formats: toolCall.input.formats,
                  timeout: toolCall.input.timeout,
                  blockAds: toolCall.input.blockAds,
                });
              }
              // ==================== WEB DATASET COLLECTOR ====================
              else if (toolCall.name === 'web_dataset_collector') {
                logger.info(`🌐 Web dataset collector V2: "${(toolCall.input.description || '').substring(0, 80)}..." | engines: ${(toolCall.input.search_engines || ['auto']).join(',')}`);
                const { collectWebDataset } = await import('../services/webDatasetService');
                result = await collectWebDataset({
                  description: toolCall.input.description,
                  expectedColumns: toolCall.input.expected_columns,
                  maxSources: toolCall.input.max_sources,
                  maxRows: toolCall.input.max_rows,
                  preferredSources: toolCall.input.preferred_sources,
                  searchEngines: toolCall.input.search_engines,
                  outputFormat: toolCall.input.output_format,
                });
                // Track the generated dataset file for ZIP inclusion
                if (result.success && result.file_path) {
                  const fname = path.basename(result.file_path);
                  sessionDataFiles.push({ filename: fname, filepath: result.file_path });
                  logger.info(`📦 Tracked web dataset for ZIP: ${fname}`);
                }
              }
              // ==================== TAVILY HANDLERS ====================
              else if (toolCall.name === 'tavily_search') {
                logger.info(`Tavily search: "${toolCall.input.query}" (depth: ${toolCall.input.search_depth || 'basic'})`);
                result = await searchTavily({
                  query: toolCall.input.query,
                  search_depth: toolCall.input.search_depth,
                  max_results: toolCall.input.max_results,
                  topic: toolCall.input.topic,
                  time_range: toolCall.input.time_range,
                  start_date: toolCall.input.start_date,
                  end_date: toolCall.input.end_date,
                  include_answer: toolCall.input.include_answer,
                  include_raw_content: toolCall.input.include_raw_content,
                  include_images: toolCall.input.include_images,
                  include_domains: toolCall.input.include_domains,
                  exclude_domains: toolCall.input.exclude_domains,
                  country: toolCall.input.country,
                });
              } else if (toolCall.name === 'tavily_extract') {
                const urlCount = Array.isArray(toolCall.input.urls) ? toolCall.input.urls.length : 1;
                logger.info(`Tavily extract: ${urlCount} URL(s)`);
                result = await extractTavily({
                  urls: toolCall.input.urls,
                  query: toolCall.input.query,
                  chunks_per_source: toolCall.input.chunks_per_source,
                  extract_depth: toolCall.input.extract_depth,
                  include_images: toolCall.input.include_images,
                  format: toolCall.input.format,
                  timeout: toolCall.input.timeout,
                });
              } else if (toolCall.name === 'tavily_crawl') {
                logger.info(`Tavily crawl: ${toolCall.input.url} (limit: ${toolCall.input.limit || 50})`);
                result = await crawlTavily({
                  url: toolCall.input.url,
                  instructions: toolCall.input.instructions,
                  max_depth: toolCall.input.max_depth,
                  max_breadth: toolCall.input.max_breadth,
                  limit: toolCall.input.limit,
                  select_paths: toolCall.input.select_paths,
                  exclude_paths: toolCall.input.exclude_paths,
                  select_domains: toolCall.input.select_domains,
                  exclude_domains: toolCall.input.exclude_domains,
                  allow_external: toolCall.input.allow_external,
                  extract_depth: toolCall.input.extract_depth,
                  format: toolCall.input.format,
                  timeout: toolCall.input.timeout,
                });
              } else if (toolCall.name === 'tavily_map') {
                logger.info(`Tavily map: ${toolCall.input.url}`);
                result = await mapTavily({
                  url: toolCall.input.url,
                  instructions: toolCall.input.instructions,
                  max_depth: toolCall.input.max_depth,
                  max_breadth: toolCall.input.max_breadth,
                  limit: toolCall.input.limit,
                  select_paths: toolCall.input.select_paths,
                  exclude_paths: toolCall.input.exclude_paths,
                  allow_external: toolCall.input.allow_external,
                  timeout: toolCall.input.timeout,
                });
              } else if (toolCall.name === 'tavily_research') {
                logger.info(`Tavily research: "${toolCall.input.input.substring(0, 50)}..." (model: ${toolCall.input.model || 'auto'})`);
                result = await researchTavily({
                  input: toolCall.input.input,
                  model: toolCall.input.model,
                  output_schema: toolCall.input.output_schema,
                  citation_format: toolCall.input.citation_format,
                });
              }
              // ==================== SEARCH & DISCOVERY HANDLERS ====================
              else if (toolCall.name === 'search_symbol') {
                result = await searchSymbol(toolCall.input.query);
              } else if (toolCall.name === 'search_name') {
                result = await searchName(toolCall.input.query);
              } else if (toolCall.name === 'search_exchange_variants') {
                result = await searchExchangeVariants(toolCall.input.symbol);
              } else if (toolCall.name === 'get_stock_list') {
                result = await getStockList();
              } else if (toolCall.name === 'get_financial_statement_symbol_list') {
                result = await getFinancialStatementSymbolList();
              } else if (toolCall.name === 'get_cik_list') {
                result = await getCIKList(toolCall.input.page, toolCall.input.limit);
              } else if (toolCall.name === 'get_symbol_change') {
                result = await getSymbolChange();
              } else if (toolCall.name === 'get_etf_list') {
                result = await getETFList();
              } else if (toolCall.name === 'get_actively_trading_list') {
                result = await getActivelyTradingList();
              } else if (toolCall.name === 'get_earnings_transcript_list') {
                result = await getEarningsTranscriptList();
              } else if (toolCall.name === 'get_available_exchanges') {
                result = await getAvailableExchanges();
              } else if (toolCall.name === 'get_available_sectors') {
                result = await getAvailableSectors();
              } else if (toolCall.name === 'get_available_industries') {
                result = await getAvailableIndustries();
              } else if (toolCall.name === 'get_available_countries') {
                result = await getAvailableCountries();
              }
              // ==================== ADVANCED COMPANY DATA HANDLERS ====================
              else if (toolCall.name === 'get_profile_by_cik') {
                result = await getProfileByCIK(toolCall.input.cik);
              } else if (toolCall.name === 'get_delisted_companies') {
                result = await getDelistedCompanies(toolCall.input.page, toolCall.input.limit);
              } else if (toolCall.name === 'get_employee_count') {
                result = await getEmployeeCount(toolCall.input.symbol);
              } else if (toolCall.name === 'get_historical_employee_count') {
                result = await getHistoricalEmployeeCount(toolCall.input.symbol);
              } else if (toolCall.name === 'get_market_capitalization') {
                result = await getMarketCapitalization(toolCall.input.symbol);
              } else if (toolCall.name === 'get_batch_market_capitalization') {
                result = await getBatchMarketCapitalization(toolCall.input.symbols);
              } else if (toolCall.name === 'get_historical_market_capitalization') {
                result = await getHistoricalMarketCapitalization(toolCall.input.symbol, toolCall.input.limit);
              } else if (toolCall.name === 'get_shares_float') {
                result = await getSharesFloat(toolCall.input.symbol);
              } else if (toolCall.name === 'get_all_shares_float') {
                result = await getAllSharesFloat(toolCall.input.page, toolCall.input.limit);
              } else if (toolCall.name === 'get_latest_mergers_acquisitions') {
                result = await getLatestMergersAcquisitions(toolCall.input.page, toolCall.input.limit);
              } else if (toolCall.name === 'search_mergers_acquisitions') {
                result = await searchMergersAcquisitions(toolCall.input.name);
              } else if (toolCall.name === 'get_key_executives') {
                result = await getKeyExecutives(toolCall.input.symbol);
              } else if (toolCall.name === 'get_executive_compensation') {
                result = await getExecutiveCompensation(toolCall.input.symbol);
              } else if (toolCall.name === 'get_executive_compensation_benchmark') {
                result = await getExecutiveCompensationBenchmark(toolCall.input.year);
              }
              // ==================== QUOTES & MARKET DATA HANDLERS ====================
              else if (toolCall.name === 'get_quote_short') {
                result = await getQuoteShort(toolCall.input.symbol);
              } else if (toolCall.name === 'get_aftermarket_trade') {
                result = await getAftermarketTrade(toolCall.input.symbol);
              } else if (toolCall.name === 'get_aftermarket_quote') {
                result = await getAftermarketQuote(toolCall.input.symbol);
              } else if (toolCall.name === 'get_stock_price_change') {
                result = await getStockPriceChange(toolCall.input.symbol);
              } else if (toolCall.name === 'get_batch_quote') {
                result = await getBatchQuote(toolCall.input.symbols);
              } else if (toolCall.name === 'get_batch_quote_short') {
                result = await getBatchQuoteShort(toolCall.input.symbols);
              } else if (toolCall.name === 'get_batch_exchange_quote') {
                result = await getBatchExchangeQuote(toolCall.input.exchange);
              } else if (toolCall.name === 'get_batch_mutualfund_quotes') {
                result = await getBatchMutualfundQuotes();
              } else if (toolCall.name === 'get_batch_etf_quotes') {
                result = await getBatchETFQuotes();
              } else if (toolCall.name === 'get_batch_commodity_quotes') {
                result = await getBatchCommodityQuotes();
              } else if (toolCall.name === 'get_batch_crypto_quotes') {
                result = await getBatchCryptoQuotes();
              } else if (toolCall.name === 'get_batch_forex_quotes') {
                result = await getBatchForexQuotes();
              } else if (toolCall.name === 'get_batch_index_quotes') {
                result = await getBatchIndexQuotes();
              }
              // ==================== FINANCIAL STATEMENTS TTM HANDLERS ====================
              else if (toolCall.name === 'get_latest_financial_statements') {
                result = await getLatestFinancialStatements(toolCall.input.page, toolCall.input.limit);
              } else if (toolCall.name === 'get_income_statement_ttm') {
                result = await getIncomeStatementTTM(toolCall.input.symbol);
              } else if (toolCall.name === 'get_balance_sheet_ttm') {
                result = await getBalanceSheetTTM(toolCall.input.symbol);
              } else if (toolCall.name === 'get_cashflow_statement_ttm') {
                result = await getCashflowStatementTTM(toolCall.input.symbol);
              } else if (toolCall.name === 'get_key_metrics_ttm') {
                result = await getKeyMetricsTTM(toolCall.input.symbol);
              } else if (toolCall.name === 'get_ratios_ttm') {
                result = await getRatiosTTM(toolCall.input.symbol);
              } else if (toolCall.name === 'get_financial_scores') {
                result = await getFinancialScores(toolCall.input.symbol);
              } else if (toolCall.name === 'get_owner_earnings') {
                result = await getOwnerEarnings(toolCall.input.symbol);
              } else if (toolCall.name === 'get_enterprise_values') {
                result = await getEnterpriseValues(toolCall.input.symbol, toolCall.input.period, toolCall.input.limit);
              } else if (toolCall.name === 'get_revenue_product_segmentation') {
                result = await getRevenueProductSegmentation(toolCall.input.symbol, toolCall.input.period);
              } else if (toolCall.name === 'get_revenue_geographic_segmentation') {
                result = await getRevenueGeographicSegmentation(toolCall.input.symbol, toolCall.input.period);
              }
              // ==================== ECONOMIC & DIVIDEND HANDLERS ====================
              else if (toolCall.name === 'get_market_risk_premium') {
                result = await getMarketRiskPremium(toolCall.input.country);
              } else if (toolCall.name === 'get_dividends_company') {
                result = await getDividendsCompany(toolCall.input.symbol);
              } else if (toolCall.name === 'get_dividends_calendar') {
                result = await getDividendsCalendar(toolCall.input.from, toolCall.input.to);
              } else if (toolCall.name === 'get_earnings_report') {
                result = await getEarningsReport(toolCall.input.symbol);
              } else if (toolCall.name === 'get_ipo_disclosures') {
                result = await getIPODisclosures(toolCall.input.from, toolCall.input.to);
              } else if (toolCall.name === 'get_ipo_prospectus') {
                result = await getIPOProspectus(toolCall.input.from, toolCall.input.to);
              } else if (toolCall.name === 'get_splits') {
                result = await getSplits(toolCall.input.symbol);
              } else if (toolCall.name === 'get_splits_calendar') {
                result = await getSplitsCalendar(toolCall.input.from, toolCall.input.to);
              }
              // ==================== NEWS & TRANSCRIPTS HANDLERS ====================
              else if (toolCall.name === 'get_latest_earning_transcripts') {
                result = await getLatestEarningTranscripts();
              } else if (toolCall.name === 'get_earning_call_transcript_dates') {
                result = await getEarningCallTranscriptDates(toolCall.input.symbol);
              } else if (toolCall.name === 'get_fmp_articles') {
                result = await getFMPArticles(toolCall.input.page, toolCall.input.limit);
              } else if (toolCall.name === 'get_general_news') {
                result = await getGeneralNews(toolCall.input.page, toolCall.input.limit);
              } else if (toolCall.name === 'get_press_releases_latest') {
                result = await getPressReleasesLatest(toolCall.input.page, toolCall.input.limit);
              } else if (toolCall.name === 'get_stock_news_latest') {
                result = await getStockNewsLatest(toolCall.input.page, toolCall.input.limit);
              } else if (toolCall.name === 'get_crypto_news') {
                result = await getCryptoNews(toolCall.input.page, toolCall.input.limit);
              } else if (toolCall.name === 'get_forex_news') {
                result = await getForexNews(toolCall.input.page, toolCall.input.limit);
              } else if (toolCall.name === 'search_press_releases_new') {
                result = await searchPressReleasesNew(toolCall.input.symbols);
              } else if (toolCall.name === 'search_stock_news') {
                result = await searchStockNews(toolCall.input.symbols);
              } else if (toolCall.name === 'search_crypto_news') {
                result = await searchCryptoNews(toolCall.input.symbols);
              } else if (toolCall.name === 'search_forex_news') {
                result = await searchForexNews(toolCall.input.symbols);
              }
              // ==================== FORM 13F & INSTITUTIONAL OWNERSHIP HANDLERS ====================
              else if (toolCall.name === 'get_institutional_ownership_filings') {
                result = await getInstitutionalOwnershipFilings(toolCall.input.page, toolCall.input.limit);
              } else if (toolCall.name === 'extract_sec_filings') {
                result = await extractSECFilings(toolCall.input.cik, toolCall.input.year, toolCall.input.quarter);
              } else if (toolCall.name === 'get_form_13f_filings_dates') {
                result = await getForm13FFilingsDates(toolCall.input.cik);
              } else if (toolCall.name === 'get_filings_extract_with_analytics') {
                result = await getFilingsExtractWithAnalytics(toolCall.input.symbol, toolCall.input.year, toolCall.input.quarter, toolCall.input.page, toolCall.input.limit);
              } else if (toolCall.name === 'get_holder_performance_summary') {
                result = await getHolderPerformanceSummary(toolCall.input.cik, toolCall.input.page);
              } else if (toolCall.name === 'get_holders_industry_breakdown') {
                result = await getHoldersIndustryBreakdown(toolCall.input.cik, toolCall.input.year, toolCall.input.quarter);
              } else if (toolCall.name === 'get_positions_summary') {
                result = await getPositionsSummary(toolCall.input.symbol, toolCall.input.year, toolCall.input.quarter);
              } else if (toolCall.name === 'get_industry_performance_summary') {
                result = await getIndustryPerformanceSummary(toolCall.input.year, toolCall.input.quarter);
              }
              // ==================== ANALYST RATINGS & ESTIMATES HANDLERS ====================
              else if (toolCall.name === 'get_ratings_snapshot') {
                result = await getRatingsSnapshot(toolCall.input.symbol);
              } else if (toolCall.name === 'get_historical_ratings') {
                result = await getHistoricalRatings(toolCall.input.symbol, toolCall.input.limit);
              } else if (toolCall.name === 'get_price_target_consensus') {
                result = await getPriceTargetConsensus(toolCall.input.symbol);
              } else if (toolCall.name === 'get_grades') {
                result = await getGrades(toolCall.input.symbol, toolCall.input.limit);
              } else if (toolCall.name === 'get_historical_grades') {
                result = await getHistoricalGrades(toolCall.input.symbol, toolCall.input.limit);
              } else if (toolCall.name === 'get_grades_summary') {
                result = await getGradesSummary(toolCall.input.symbol);
              }
              // ==================== MARKET PERFORMANCE & SECTORS HANDLERS ====================
              else if (toolCall.name === 'get_market_sector_performance_snapshot') {
                result = await getMarketSectorPerformanceSnapshot(toolCall.input.date);
              } else if (toolCall.name === 'get_industry_performance_snapshot') {
                result = await getIndustryPerformanceSnapshot(toolCall.input.date);
              } else if (toolCall.name === 'get_historical_sector_performance') {
                result = await getHistoricalSectorPerformance(toolCall.input.sector, toolCall.input.limit);
              } else if (toolCall.name === 'get_historical_industry_performance') {
                result = await getHistoricalIndustryPerformance(toolCall.input.industry, toolCall.input.limit);
              } else if (toolCall.name === 'get_sector_pe_snapshot') {
                result = await getSectorPESnapshot(toolCall.input.date);
              } else if (toolCall.name === 'get_industry_pe_snapshot') {
                result = await getIndustryPESnapshot(toolCall.input.date);
              } else if (toolCall.name === 'get_historical_sector_pe') {
                result = await getHistoricalSectorPE(toolCall.input.sector, toolCall.input.limit);
              } else if (toolCall.name === 'get_historical_industry_pe') {
                result = await getHistoricalIndustryPE(toolCall.input.industry, toolCall.input.limit);
              }
              // ==================== ADDITIONAL TECHNICAL INDICATORS HANDLERS ====================
              else if (toolCall.name === 'get_wma') {
                result = await getWMA(toolCall.input.symbol, toolCall.input.periodLength, toolCall.input.timeframe);
              } else if (toolCall.name === 'get_dema') {
                result = await getDEMA(toolCall.input.symbol, toolCall.input.periodLength, toolCall.input.timeframe);
              } else if (toolCall.name === 'get_tema') {
                result = await getTEMA(toolCall.input.symbol, toolCall.input.periodLength, toolCall.input.timeframe);
              } else if (toolCall.name === 'get_standard_deviation') {
                result = await getStandardDeviation(toolCall.input.symbol, toolCall.input.periodLength, toolCall.input.timeframe);
              }
              // ==================== ETF & MUTUAL FUNDS HANDLERS ====================
              else if (toolCall.name === 'get_etf_asset_exposure') {
                result = await getETFAssetExposure(toolCall.input.symbol);
              } else if (toolCall.name === 'get_mutual_fund_disclosure_latest') {
                result = await getMutualFundDisclosureLatest(toolCall.input.symbol);
              } else if (toolCall.name === 'get_mutual_fund_disclosure') {
                result = await getMutualFundDisclosure(toolCall.input.symbol, toolCall.input.year, toolCall.input.quarter);
              } else if (toolCall.name === 'get_mutual_fund_disclosure_search') {
                result = await getMutualFundDisclosureSearch(toolCall.input.name);
              } else if (toolCall.name === 'get_mutual_fund_disclosure_dates') {
                result = await getMutualFundDisclosureDates(toolCall.input.symbol);
              }
              // ==================== SEC FILINGS ADVANCED HANDLERS ====================
              else if (toolCall.name === 'get_latest_8k_sec_filings') {
                result = await getLatest8KSECFilings(toolCall.input.from, toolCall.input.to, toolCall.input.page, toolCall.input.limit);
              } else if (toolCall.name === 'get_latest_sec_filings') {
                result = await getLatestSECFilings(toolCall.input.from, toolCall.input.to, toolCall.input.page, toolCall.input.limit);
              } else if (toolCall.name === 'get_sec_filings_by_form_type') {
                result = await getSECFilingsByFormType(toolCall.input.formType, toolCall.input.from, toolCall.input.to, toolCall.input.page, toolCall.input.limit);
              } else if (toolCall.name === 'get_sec_filings_by_symbol') {
                result = await getSECFilingsBySymbol(toolCall.input.symbol, toolCall.input.from, toolCall.input.to, toolCall.input.page, toolCall.input.limit);
              } else if (toolCall.name === 'get_sec_filings_by_cik') {
                result = await getSECFilingsByCIK(toolCall.input.cik, toolCall.input.from, toolCall.input.to, toolCall.input.page, toolCall.input.limit);
              } else if (toolCall.name === 'get_sec_filings_by_name') {
                result = await getSECFilingsByName(toolCall.input.company);
              } else if (toolCall.name === 'get_sec_filings_company_search_by_symbol') {
                result = await getSECFilingsCompanySearchBySymbol(toolCall.input.symbol);
              } else if (toolCall.name === 'get_sec_filings_company_search_by_cik') {
                result = await getSECFilingsCompanySearchByCIK(toolCall.input.cik);
              } else if (toolCall.name === 'get_sec_company_full_profile') {
                result = await getSECCompanyFullProfile(toolCall.input.symbol);
              } else if (toolCall.name === 'get_industry_classification_list') {
                result = await getIndustryClassificationList();
              } else if (toolCall.name === 'search_industry_classification') {
                result = await searchIndustryClassification(toolCall.input.industryTitle, toolCall.input.sicCode);
              } else if (toolCall.name === 'get_all_industry_classification') {
                result = await getAllIndustryClassification();
              }
              // ==================== INSIDER TRADES ADVANCED HANDLERS ====================
              else if (toolCall.name === 'get_latest_insider_trading') {
                result = await getLatestInsiderTrading(toolCall.input.page, toolCall.input.limit);
              } else if (toolCall.name === 'search_insider_trades') {
                result = await searchInsiderTrades(toolCall.input.symbol, toolCall.input.companyName, toolCall.input.reportingName, toolCall.input.page, toolCall.input.limit);
              } else if (toolCall.name === 'search_insider_trades_by_name') {
                result = await searchInsiderTradesByName(toolCall.input.name);
              } else if (toolCall.name === 'get_all_insider_transaction_types') {
                result = await getAllInsiderTransactionTypes();
              } else if (toolCall.name === 'get_acquisition_of_beneficial_ownership') {
                result = await getAcquisitionOfBeneficialOwnership(toolCall.input.symbol);
              }
              // ==================== INDEXES HANDLERS ====================
              else if (toolCall.name === 'get_index_list') {
                result = await getIndexList();
              } else if (toolCall.name === 'get_sp500_constituent') {
                result = await getSP500Constituent();
              } else if (toolCall.name === 'get_nasdaq_constituent') {
                result = await getNasdaqConstituent();
              } else if (toolCall.name === 'get_dow_jones_constituent') {
                result = await getDowJonesConstituent();
              } else if (toolCall.name === 'get_historical_sp500_constituent') {
                result = await getHistoricalSP500Constituent();
              } else if (toolCall.name === 'get_historical_nasdaq_constituent') {
                result = await getHistoricalNasdaqConstituent();
              } else if (toolCall.name === 'get_historical_dow_jones_constituent') {
                result = await getHistoricalDowJonesConstituent();
              } else if (toolCall.name === 'get_exchange_market_hours') {
                result = await getExchangeMarketHours(toolCall.input.exchange);
              } else if (toolCall.name === 'get_holidays_by_exchange') {
                result = await getHolidaysByExchange(toolCall.input.exchange);
              } else if (toolCall.name === 'get_all_exchange_market_hours') {
                result = await getAllExchangeMarketHours();
              }
              // ==================== COMMODITIES, DCF, FOREX HANDLERS ====================
              else if (toolCall.name === 'get_commodities_list') {
                result = await getCommoditiesList();
              } else if (toolCall.name === 'get_dcf_valuation') {
                result = await getDCFValuation(toolCall.input.symbol);
              } else if (toolCall.name === 'get_levered_dcf') {
                result = await getLeveredDCF(toolCall.input.symbol);
              } else if (toolCall.name === 'get_custom_dcf') {
                result = await getCustomDCF(toolCall.input.symbol, toolCall.input.years, toolCall.input.growthRate, toolCall.input.discountRate);
              } else if (toolCall.name === 'get_custom_levered_dcf') {
                result = await getCustomLeveredDCF(toolCall.input.symbol, toolCall.input.years, toolCall.input.growthRate, toolCall.input.discountRate);
              } else if (toolCall.name === 'get_forex_currency_pairs') {
                result = await getForexCurrencyPairs();
              }
              // ==================== SENATE/HOUSE, ESG, COT, CROWDFUNDING HANDLERS ====================
              else if (toolCall.name === 'get_latest_senate_disclosures') {
                result = await getLatestSenateDisclosures(toolCall.input.page, toolCall.input.limit);
              } else if (toolCall.name === 'get_latest_house_disclosures') {
                result = await getLatestHouseDisclosures(toolCall.input.page, toolCall.input.limit);
              } else if (toolCall.name === 'get_senate_trades_symbol') {
                result = await getSenateTradesSymbol(toolCall.input.symbol);
              } else if (toolCall.name === 'get_senate_trades_by_name') {
                result = await getSenateTradesByName(toolCall.input.name);
              } else if (toolCall.name === 'get_house_trades_symbol') {
                result = await getHouseTradesSymbol(toolCall.input.symbol);
              } else if (toolCall.name === 'get_house_trades_by_name') {
                result = await getHouseTradesByName(toolCall.input.name);
              } else if (toolCall.name === 'get_esg_disclosures') {
                result = await getESGDisclosures(toolCall.input.symbol);
              } else if (toolCall.name === 'get_esg_ratings') {
                result = await getESGRatings(toolCall.input.symbol);
              } else if (toolCall.name === 'get_esg_benchmark') {
                result = await getESGBenchmark(toolCall.input.year);
              } else if (toolCall.name === 'get_cot_list') {
                result = await getCOTList();
              } else if (toolCall.name === 'get_latest_crowdfunding_campaigns') {
                result = await getLatestCrowdfundingCampaigns(toolCall.input.page, toolCall.input.limit);
              } else if (toolCall.name === 'search_crowdfunding_campaigns') {
                result = await searchCrowdfundingCampaigns(toolCall.input.name);
              } else if (toolCall.name === 'get_crowdfunding_by_cik') {
                result = await getCrowdfundingByCIK(toolCall.input.cik);
              } else if (toolCall.name === 'get_equity_offering_updates') {
                result = await getEquityOfferingUpdates(toolCall.input.page, toolCall.input.limit);
              } else if (toolCall.name === 'search_equity_offerings') {
                result = await searchEquityOfferings(toolCall.input.name);
              } else if (toolCall.name === 'get_company_equity_offerings_by_cik') {
                result = await getCompanyEquityOfferingsByCIK(toolCall.input.cik);

              // ── World Bank API ──
              } else if (toolCall.name === 'get_wb_indicator_data') {
                logger.info(`World Bank data: ${toolCall.input.indicator_code} for ${toolCall.input.country_code}`);
                result = await getWBIndicatorData(
                  toolCall.input.country_code,
                  toolCall.input.indicator_code,
                  toolCall.input.date_range,
                  toolCall.input.mrv,
                  toolCall.input.mrnev,
                  toolCall.input.frequency,
                  toolCall.input.source
                );
              } else if (toolCall.name === 'get_wb_countries') {
                result = await getWBCountries(toolCall.input.country_code, toolCall.input.income_level, toolCall.input.region);
              } else if (toolCall.name === 'search_wb_indicators') {
                result = await searchWBIndicators(toolCall.input.query, toolCall.input.topic_id);
              } else if (toolCall.name === 'get_wb_topics') {
                result = await getWBTopics();
              } else if (toolCall.name === 'get_wb_regions') {
                result = await getWBRegions();
              } else if (toolCall.name === 'get_wb_income_levels') {
                result = await getWBIncomeLevels();
              } else if (toolCall.name === 'get_wb_sources') {
                result = await getWBSources(toolCall.input.source_id);

              // ── IMF API ──
              } else if (toolCall.name === 'get_imf_indicator_data') {
                logger.info(`IMF data: ${toolCall.input.indicator_id} for ${toolCall.input.countries || 'all'}`);
                result = await getIMFIndicatorData(
                  toolCall.input.indicator_id,
                  toolCall.input.countries,
                  toolCall.input.periods
                );
              } else if (toolCall.name === 'get_imf_indicators') {
                result = await getIMFIndicators();
              } else if (toolCall.name === 'get_imf_countries') {
                result = await getIMFCountries();
              } else if (toolCall.name === 'get_imf_dataflows') {
                result = await getIMFDataflows(toolCall.input.dataflow_id);
              } else if (toolCall.name === 'get_imf_sdmx_data') {
                logger.info(`IMF SDMX: ${toolCall.input.dataflow_id} key=${toolCall.input.key}`);
                result = await getIMFSDMXData(
                  toolCall.input.dataflow_id,
                  toolCall.input.key,
                  toolCall.input.time_period_filter
                );
              } else if (toolCall.name === 'get_imf_data_structure') {
                result = await getIMFDataStructure(toolCall.input.datastructure_id);
              } else if (toolCall.name === 'get_imf_codelist') {
                result = await getIMFCodeList(toolCall.input.codelist_id);

              // ── OECD API ──
              } else if (toolCall.name === 'get_oecd_data') {
                logger.info(`OECD data: ${toolCall.input.dataflow_id} filter=${toolCall.input.filter}`);
                result = await getOECDData(
                  toolCall.input.agency_id,
                  toolCall.input.dataflow_id,
                  toolCall.input.filter,
                  toolCall.input.start_period,
                  toolCall.input.end_period,
                  toolCall.input.last_n_observations,
                  toolCall.input.version
                );
              } else if (toolCall.name === 'search_oecd_dataflows') {
                result = await searchOECDDataflows(toolCall.input.query);
              } else if (toolCall.name === 'get_oecd_dataflow_structure') {
                result = await getOECDDataflowStructure(
                  toolCall.input.agency_id,
                  toolCall.input.dataflow_id,
                  toolCall.input.version
                );
              } else if (toolCall.name === 'get_oecd_dataflows') {
                result = await getOECDDataflows();

              // ── Polymarket API ──
              } else if (toolCall.name === 'get_polymarket_events') {
                result = await getPolymarketEvents({
                  active: toolCall.input.active,
                  closed: toolCall.input.closed,
                  tag_slug: toolCall.input.tag_slug,
                  order: toolCall.input.order,
                  ascending: toolCall.input.ascending,
                  limit: toolCall.input.limit,
                  offset: toolCall.input.offset,
                });
              } else if (toolCall.name === 'get_polymarket_markets') {
                result = await getPolymarketMarkets({
                  active: toolCall.input.active,
                  closed: toolCall.input.closed,
                  tag_id: toolCall.input.tag_id,
                  order: toolCall.input.order,
                  limit: toolCall.input.limit,
                  offset: toolCall.input.offset,
                  id: toolCall.input.id,
                  slug: toolCall.input.slug,
                });
              } else if (toolCall.name === 'search_polymarket') {
                result = await searchPolymarket(toolCall.input.query, toolCall.input.limit);
              } else if (toolCall.name === 'get_polymarket_price_history') {
                result = await getPolymarketPriceHistory(
                  toolCall.input.token_id,
                  toolCall.input.interval,
                  toolCall.input.start_ts,
                  toolCall.input.end_ts,
                  toolCall.input.fidelity
                );
              } else if (toolCall.name === 'get_polymarket_order_book') {
                result = await getPolymarketOrderBook(toolCall.input.token_id);
              } else if (toolCall.name === 'get_polymarket_tags') {
                result = await getPolymarketTags();
              } else if (toolCall.name === 'get_polymarket_trades') {
                result = await getPolymarketTrades({
                  market: toolCall.input.market,
                  user: toolCall.input.user,
                  limit: toolCall.input.limit,
                  offset: toolCall.input.offset,
                });
              } else if (toolCall.name === 'get_polymarket_leaderboard') {
                result = await getPolymarketLeaderboard(toolCall.input.limit, toolCall.input.offset);

              // ── Academic Research Tools ──
              } else if (toolCall.name === 'academic_search') {
                logger.info(`Academic search: ${toolCall.input.query}`);
                const limit = Math.min(toolCall.input.limit || 10, 20);
                const articles = await searchGoogleScholar(toolCall.input.query, limit);
                result = {
                  query: toolCall.input.query,
                  total_results: articles.length,
                  articles: articles.map((a: any) => ({
                    title: a.title,
                    authors: a.authors,
                    year: a.year,
                    publication: a.publication,
                    cited_by: a.citedBy,
                    snippet: a.snippet,
                    link: a.link,
                    pdf_link: a.pdfLink,
                  })),
                };
                logger.success(`Academic search returned ${articles.length} results`);

              } else if (toolCall.name === 'academic_literature_review') {
                logger.info(`Literature review: ${toolCall.input.topic}`);
                const numPapers = Math.min(toolCall.input.num_papers || 15, 30);
                const topic = toolCall.input.topic;
                const focusAreas: string[] = toolCall.input.focus_areas || [];
                const dateRange: string = toolCall.input.date_range || '';

                // Step 1: Search Google Scholar for papers
                const searchQuery = focusAreas.length > 0
                  ? `${topic} ${focusAreas.join(' ')}`
                  : topic;
                const scholarResults = await searchGoogleScholar(searchQuery, numPapers);

                // Step 2: For papers with PDF links, try to scrape content (up to 5)
                const papersWithContent: any[] = [];
                const pdfPapers = scholarResults.filter((a: any) => a.pdfLink).slice(0, 5);
                for (const paper of pdfPapers) {
                  try {
                    const scraped = await scrapeFirecrawl({ url: paper.pdfLink });
                    papersWithContent.push({
                      ...paper,
                      fullContent: scraped?.content?.substring(0, 2000) || paper.snippet,
                    });
                  } catch {
                    papersWithContent.push({ ...paper, fullContent: paper.snippet });
                  }
                }

                // Step 3: Use Tavily for additional research synthesis
                let tavilySynthesis = '';
                try {
                  const tavilyResult = await researchTavily({
                    input: `Academic literature review on: ${topic}. ${focusAreas.length > 0 ? `Focus areas: ${focusAreas.join(', ')}.` : ''} ${dateRange ? `Date range: ${dateRange}.` : ''} Provide key findings, methodologies, and debates in the field.`,
                  });
                  tavilySynthesis = tavilyResult.report || '';
                } catch {
                  tavilySynthesis = '';
                }

                // Step 4: Generate BibTeX entries from metadata
                const bibtexEntries = scholarResults.map((article: any, idx: number) => {
                  const authorKey = (article.authors || 'unknown').split(',')[0].trim().split(' ').pop()?.toLowerCase() || 'unknown';
                  const year = article.year || 'n.d.';
                  const citeKey = `${authorKey}${year}_${idx}`;
                  const authors = (article.authors || 'Unknown Author').replace(/,/g, ' and');
                  return `@article{${citeKey},
  author = {${authors}},
  title = {${article.title || 'Untitled'}},
  journal = {${article.publication || 'Unknown Journal'}},
  year = {${year}},
  url = {${article.link || ''}}
}`;
                }).join('\n\n');

                // Step 5: Return structured review
                result = {
                  topic,
                  total_papers_found: scholarResults.length,
                  papers: scholarResults.map((a: any) => ({
                    title: a.title,
                    authors: a.authors,
                    year: a.year,
                    publication: a.publication,
                    cited_by: a.citedBy,
                    snippet: a.snippet,
                    link: a.link,
                    pdf_link: a.pdfLink,
                  })),
                  papers_with_content: papersWithContent.map((p: any) => ({
                    title: p.title,
                    authors: p.authors,
                    content_preview: p.fullContent?.substring(0, 1000),
                  })),
                  bibtex: bibtexEntries,
                  tavily_synthesis: tavilySynthesis,
                  focus_areas: focusAreas,
                  date_range: dateRange,
                };
                logger.success(`Literature review completed: ${scholarResults.length} papers found`);

              } else if (toolCall.name === 'openalex_search') {
                logger.info(`OpenAlex search: ${toolCall.input.query}`);
                const papers = await searchOpenAlex(
                  toolCall.input.query,
                  toolCall.input.limit || 10,
                  toolCall.input.filter,
                ).catch(() => []);
                result = {
                  total: papers.length,
                  papers: papers.map((p: any) => ({
                    cite_key: p.citeKey,
                    title: p.title,
                    authors: p.authors.slice(0, 4),
                    year: p.year,
                    venue: p.venue,
                    citations: p.citationCount,
                    doi: p.doi,
                    pdf_url: p.pdfUrl,
                    abstract: p.abstract?.substring(0, 300),
                  })),
                  bibtex_block: papers.map((p: any) => p.bibtex).join('\n\n'),
                };
                logger.success(`OpenAlex: ${papers.length} papers`);

              } else if (toolCall.name === 'semantic_scholar_search') {
                // Deprecated: redirect to OpenAlex
                logger.info(`Semantic Scholar search redirected to OpenAlex: ${toolCall.input.query}`);
                const papers = await searchOpenAlex(
                  toolCall.input.query,
                  toolCall.input.limit || 15,
                  toolCall.input.year_filter ? `publication_year:${toolCall.input.year_filter}` : undefined,
                ).catch(() => []);
                const bibtex_block = papers.map((p: any) => p.bibtex).join('\n\n');
                result = {
                  total: papers.length,
                  papers: papers.map((p: any) => ({
                    cite_key: p.citeKey,
                    title: p.title,
                    authors: p.authors,
                    year: p.year,
                    venue: p.venue,
                    citations: p.citationCount,
                    doi: p.doi,
                    abstract: p.abstract?.substring(0, 300),
                  })),
                  bibtex_block,
                  usage_hint: `Use \\cite{key} in LaTeX. Pass bibtex_block to compile_research_paper as bibtex_entries.`,
                };
                logger.success(`OpenAlex (via S2 redirect): ${papers.length} papers found`);

              } else if (toolCall.name === 'arxiv_search') {
                logger.info(`arXiv search: ${toolCall.input.query}`);
                const papers = await searchArxiv(
                  toolCall.input.query,
                  toolCall.input.limit || 10,
                  toolCall.input.category,
                ).catch(() => []);
                const bibtex_block = papers.map((p: any) => p.bibtex).join('\n\n');
                result = {
                  total: papers.length,
                  papers: papers.map((p: any) => ({
                    cite_key: p.citeKey,
                    title: p.title,
                    authors: p.authors,
                    year: p.year,
                    arxiv_id: p.arxivId,
                    pdf_url: p.pdfUrl,
                    abstract: p.abstract?.substring(0, 300),
                  })),
                  bibtex_block,
                };
                logger.success(`arXiv: ${papers.length} papers found`);

              } else if (toolCall.name === 'crossref_lookup') {
                logger.info(`CrossRef: ${toolCall.input.doi || toolCall.input.query}`);
                if (toolCall.input.doi) {
                  const paper = await lookupDoi(toolCall.input.doi).catch(() => null);
                  result = paper
                    ? { found: true, paper: { cite_key: paper.citeKey, ...paper }, bibtex: paper.bibtex }
                    : { found: false, error: `DOI not found: ${toolCall.input.doi}` };
                } else {
                  const papers = await searchCrossref(
                    toolCall.input.query,
                    toolCall.input.limit || 10,
                    toolCall.input.filter,
                  ).catch(() => []);
                  result = {
                    total: papers.length,
                    papers: papers.map((p: any) => ({ cite_key: p.citeKey, title: p.title, authors: p.authors, year: p.year, venue: p.venue, doi: p.doi })),
                    bibtex_block: papers.map((p: any) => p.bibtex).join('\n\n'),
                  };
                }
                logger.success(`CrossRef lookup completed`);

              } else if (toolCall.name === 'academic_search_multi') {
                logger.info(`Multi-source academic search: ${toolCall.input.query}`);
                const searchResult = await multiSourceAcademicSearch(
                  toolCall.input.query,
                  toolCall.input.limit || 10,
                  toolCall.input.sources,
                  toolCall.input.arxiv_category,
                ).catch((e: any) => ({ papers: [], bibtex_block: '', summary: `Error: ${e.message}`, sources_used: [], sources_failed: [`all — ${e.message}`] }));
                result = {
                  total_unique_papers: searchResult.papers.length,
                  sources_used: searchResult.sources_used,
                  sources_failed: searchResult.sources_failed,
                  top_papers_summary: searchResult.summary,
                  papers: searchResult.papers.map((p: any) => ({
                    cite_key: p.citeKey,
                    title: p.title,
                    authors: p.authors.slice(0, 3),
                    year: p.year,
                    venue: p.venue,
                    citations: p.citationCount,
                    doi: p.doi,
                    arxiv_id: p.arxivId,
                    source: p.source,
                    abstract: p.abstract?.substring(0, 200),
                  })),
                  bibtex_block: searchResult.bibtex_block,
                  usage_hint: 'Pass bibtex_block directly to compile_research_paper as bibtex_entries. Use \\cite{cite_key} in LaTeX sections.',
                };
                logger.success(`Multi-source search: ${searchResult.papers.length} unique papers from [${searchResult.sources_used.join(', ')}]`);

              } else if (toolCall.name === 'literature_gap_finder') {
                logger.info(`🔬 Literature gap finder: "${(toolCall.input.topic || '').substring(0, 80)}..."`);
                const { findLiteratureGaps } = await import('../services/literatureGapFinderService');
                result = await findLiteratureGaps({
                  topic: toolCall.input.topic,
                  focusAreas: toolCall.input.focus_areas,
                  dateRange: toolCall.input.date_range,
                  paperLimit: toolCall.input.paper_limit,
                  sources: toolCall.input.sources,
                  arxivCategory: toolCall.input.arxiv_category,
                });
                if ((result as any).success) {
                  logger.success(`Gap finder: ${(result as any).gaps?.length || 0} gaps from ${(result as any).totalPapersAnalyzed} papers`);
                } else {
                  logger.error(`Gap finder failed: ${(result as any).error}`);
                }

              } else if (toolCall.name === 'generate_research_paper') {
                logger.info(`Generating research paper: ${toolCall.input.title}`);

                // Collect ALL figures from session — flatten into sequential array
                // matching Claude's {{FIG:0}}, {{FIG:1}}, ... placeholders
                const figures: { id: string; base64: string }[] = [];
                let seqIdx = 0;
                for (const entry of customPythonFiguresData) {
                  for (const base64 of entry.figures) {
                    figures.push({ id: String(seqIdx), base64 });
                    seqIdx++;
                  }
                }
                if (figures.length > 0) {
                  logger.info(`📊 Collected ${figures.length} figures from ${customPythonFiguresData.length} Python execution(s) for paper generation`);
                  figures.forEach((f) => logger.info(`  Figure ${f.id}: ${f.base64.length} chars base64`));
                } else {
                  logger.warn(`⚠️ No figures available in session for paper generation (${customPythonFiguresData.length} Python executions recorded)`);
                }

                // If latex_content looks like a placeholder and we have stored sections, use them
                let latexContent = toolCall.input.latex_content || '';
                const SECTION_ORDER_MAP: Record<string, number> = {
                  introduction: 1, literature_review: 2, methodology: 3,
                  data: 4, results: 5, discussion: 6, conclusion: 7,
                };
                if (paperSectionsStore.length > 0 && (latexContent.length < 500 || /already.?written/i.test(latexContent))) {
                  logger.info(`📝 generate_research_paper: latex_content looks like placeholder, using ${paperSectionsStore.length} stored sections`);
                  const sortedSections = [...paperSectionsStore].sort((a, b) =>
                    (SECTION_ORDER_MAP[a.type] ?? 99) - (SECTION_ORDER_MAP[b.type] ?? 99)
                  );
                  latexContent = sortedSections.map(s => s.latex_content).join('\n\n');
                }

                const paperResult = await generateResearchPaper({
                  latex_content: latexContent,
                  bibtex_entries: toolCall.input.bibtex_entries,
                  title: toolCall.input.title,
                  authors: toolCall.input.authors,
                  abstract: toolCall.input.abstract,
                  keywords: toolCall.input.keywords,
                  template: toolCall.input.template,
                  figures,
                  filename: toolCall.input.filename,
                });

                if (paperResult.success) {
                  // Copy PDF to downloads directory so /api/download/:filename can serve it
                  const fsGen = await import('fs');
                  const downloadsDir = path.resolve('downloads');
                  if (!fsGen.existsSync(downloadsDir)) {
                    fsGen.mkdirSync(downloadsDir, { recursive: true });
                  }
                  const uniqueName = `${Date.now()}_${paperResult.filename}`;
                  const downloadDest = path.join(downloadsDir, uniqueName);
                  try {
                    fsGen.copyFileSync(paperResult.filepath!, downloadDest);
                    // Cleanup temp file
                    try { fsGen.unlinkSync(paperResult.filepath!); } catch {}
                  } catch (copyErr) {
                    logger.error(`Failed to copy research paper to downloads: ${(copyErr as Error).message}`);
                  }

                  // Create project ZIP with LaTeX source, figures, and Python scripts
                  let projectZipUrl: string | undefined;
                  if (paperResult.workDir) {
                    try {
                      const pyScripts = buildPipelineScripts(pythonCodeEntries);
                      const zipName = (paperResult.filename || 'research_paper').replace(/\.pdf$/i, '');
                      const zipPath = await createProjectZip(
                        paperResult.workDir,
                        downloadDest,
                        pyScripts,
                        zipName,
                        sessionDataFiles,
                        ctx.sessionMetadata,
                      );
                      const zipFilename = path.basename(zipPath);
                      projectZipUrl = `/api/download/${encodeURIComponent(zipFilename)}`;
                      logger.success(`Project ZIP created: ${zipFilename}`);
                    } catch (zipErr) {
                      logger.error(`Failed to create project ZIP: ${(zipErr as Error).message}`);
                    }
                    // Cleanup workDir now that ZIP is created
                    try { fsGen.rmSync(paperResult.workDir, { recursive: true, force: true }); } catch {}
                  }

                  result = {
                    success: true,
                    message: `Research paper compiled successfully: ${paperResult.filename}`,
                    filename: paperResult.filename,
                    filepath: downloadDest,
                    download_url: `/api/download/${encodeURIComponent(uniqueName)}`,
                    ...(projectZipUrl ? { project_zip_url: projectZipUrl } : {}),
                  };
                  logger.success(`Research paper generated: ${paperResult.filename}`);
                } else {
                  result = {
                    success: false,
                    error: paperResult.error,
                  };
                  logger.error(`Research paper generation failed: ${paperResult.error}`);
                }

              } else if (toolCall.name === 'write_paper_section') {
                const { section_type, latex_content, bibtex_keys, figure_ids, section_order } = toolCall.input;
                logger.info(`Writing paper section: ${section_type}`);

                // Minimum character thresholds per section type — MUST match prompt requirements
                // Sections below these thresholds are REJECTED and must be rewritten
                const MIN_LENGTH: Record<string, number> = {
                  // Empirical sections — balanced thresholds (quality vs pipeline throughput)
                  introduction: 8000,
                  literature_review: 16000,
                  methodology: 18000,
                  data: 8000,
                  results: 22000,
                  discussion: 12000,
                  conclusion: 4000,
                  // Theoretical sections
                  economic_environment: 12000,   // model setup, agents, preferences, constraints, timing
                  equilibrium: 8000,             // definition, characterization, propositions, proofs
                  computational_method: 6000,    // numerical algorithm, calibration, convergence
                  quantitative_results: 14000,   // simulations, comparative statics, model-implied moments
                  extensions: 6000,              // parameter sensitivity, alternative formulations
                  // Appendix (mandatory for all papers)
                  appendix: 10000,               // proofs, derivations, extra tables, data details, calibration
                };

                const minLen = MIN_LENGTH[section_type] || 800;
                const TOLERANCE = 500; // accept sections within 500 chars of the minimum
                const contentLength = (latex_content || '').length;
                const content = latex_content || '';

                // ── Lightweight quality checks per section type ──
                const qualityWarnings: string[] = [];

                if (contentLength < minLen - TOLERANCE) {
                  const pct = Math.round((contentLength / minLen) * 100);
                  // Advisory warning only — section is accepted regardless of length
                  logger.warn(`⚠️ Section "${section_type}" is under target length: ${contentLength}/${minLen} chars (${pct}%). Accepted anyway.`);
                  qualityWarnings.push(`NOTE: Section "${section_type}" is ${contentLength} chars (${pct}% of the ${minLen} char target). Consider expanding this section for a more comprehensive paper.`);
                }

                if (!result) {

                if (section_type === 'results' || section_type === 'quantitative_results') {
                  // Check that results section has actual LaTeX tables (not just figures)
                  const tableCount = (content.match(/\\begin\{table/g) || []).length;
                  const figCount = (content.match(/\\begin\{figure/g) || []).length;
                  if (tableCount < 2) {
                    qualityWarnings.push(`QUALITY: Results section has only ${tableCount} table(s). A credible results section needs at least 2-4 regression tables built from Python output. Add \\begin{table} with coefficients, SEs, and significance stars.`);
                  }
                  // Check for actual numbers (coefficients should appear)
                  const hasNumbers = /[-]?\d+\.\d{2,}/.test(content);
                  if (!hasNumbers) {
                    qualityWarnings.push(`QUALITY: Results section appears to lack specific numerical values. Extract exact coefficients from Python output.`);
                  }
                  // Check for robustness subsection
                  if (section_type === 'results' && !content.toLowerCase().includes('robustness')) {
                    qualityWarnings.push(`QUALITY: Results section is missing a robustness checks subsection. Add at least 3 alternative specifications.`);
                  }
                  // Check for falsification/placebo tests
                  if (section_type === 'results' && !/placebo|falsif|pre.?trend|parallel.?trend|first.?stage|F.?stat/i.test(content)) {
                    qualityWarnings.push(`QUALITY: Results section has no falsification or identification diagnostics. Add placebo tests, pre-trend validation, or first-stage F-statistics to strengthen causal credibility.`);
                  }
                }

                if (section_type === 'methodology') {
                  // Empirical methodology checks
                  const eqCount = (content.match(/\\begin\{equation/g) || []).length + (content.match(/\\begin\{align/g) || []).length;
                  if (eqCount < 2) {
                    qualityWarnings.push(`QUALITY: Methodology has only ${eqCount} equation(s). Include at least 1 key equation mapping to the regression.`);
                  }
                  // Identification strategy (empirical papers)
                  if (!/identif|exogen|instrument|endogen|causal|associat|DiD|difference.in.difference|event.study|placebo|falsif|regression discontinuity/i.test(content)) {
                    qualityWarnings.push(`QUALITY: Methodology does not discuss identification or endogeneity. Add an "Identification Strategy" subsection or explicitly state results are associational.`);
                  }
                  // Light theoretical framework (empirical papers)
                  if (!/theoretical framework|micro.?found|pricing equation|first.order condition|equilibrium|optimization|utility|SDF|asset pricing|economic mechanism/i.test(content)) {
                    qualityWarnings.push(`QUALITY: Methodology lacks a theoretical framework. Add a light subsection (1-2 pages) deriving the key regression from economic primitives.`);
                  }
                }

                if (section_type === 'economic_environment') {
                  // Theoretical model checks (different from empirical!)
                  const eqCount = (content.match(/\\begin\{equation/g) || []).length + (content.match(/\\begin\{align/g) || []).length;
                  if (eqCount < 3) {
                    qualityWarnings.push(`QUALITY: Economic environment has only ${eqCount} equation(s). A formal model needs 3+ equations (utility, constraints, equilibrium conditions).`);
                  }
                  // Check for formal assumptions
                  const assumptionCount = (content.match(/\\begin\{assumption\}/g) || []).length;
                  if (assumptionCount < 1) {
                    qualityWarnings.push(`QUALITY: Economic environment section has no formal \\begin{assumption} blocks. State model assumptions formally for rigor.`);
                  }
                }

                if (section_type === 'introduction') {
                  if (!/contribut|novel|new measure|new data|first to|we are the first|this paper is the first|new method|new mechanism|stylized fact/i.test(content)) {
                    qualityWarnings.push(`QUALITY: Introduction does not contain a clear contribution statement. Add a "Contribution" subsection listing 2-3 specific, concrete novel contributions.`);
                  }
                }

                if (section_type === 'discussion') {
                  const hasRefs = /Table|Figure|\\ref\{/.test(content);
                  if (!hasRefs) {
                    qualityWarnings.push(`QUALITY: Discussion section does not reference any Tables or Figures. It should interpret specific results from the results section.`);
                  }
                }

                if (section_type === 'equilibrium') {
                  // Check for propositions/theorems with proofs
                  const propCount = (content.match(/\\begin\{(proposition|theorem|lemma)\}/g) || []).length;
                  const proofCount = (content.match(/\\begin\{proof\}/g) || []).length;
                  if (propCount < 1) {
                    qualityWarnings.push(`QUALITY: Equilibrium section has no formal propositions or theorems. Include at least one \\begin{proposition} with a derivation.`);
                  }
                  if (propCount > 0 && proofCount < 1) {
                    qualityWarnings.push(`QUALITY: Equilibrium section has ${propCount} proposition(s) but no \\begin{proof}. Each proposition needs a derivation or proof.`);
                  }
                }

                if (section_type === 'quantitative_results') {
                  const figCount = (content.match(/\\begin\{figure/g) || []).length;
                  if (figCount < 2) {
                    qualityWarnings.push(`QUALITY: Quantitative results section has only ${figCount} figure(s). Show model-implied moments, comparative statics, and policy functions with figures.`);
                  }
                  // Check for parameter sensitivity discussion
                  if (!/sensitiv|robustness|alternative.*param|parameter.*grid/i.test(content)) {
                    qualityWarnings.push(`QUALITY: Quantitative results should include parameter sensitivity analysis. Show how results change across parameter values.`);
                  }
                }

                if (section_type === 'computational_method') {
                  // Check for numerical method discussion
                  if (!/scipy|fsolve|optimize|iteration|convergence|numerical|algorithm|discretiz/i.test(content)) {
                    qualityWarnings.push(`QUALITY: Computational method section does not mention numerical solving tools or convergence. If the model has no closed-form solution, describe the numerical method (scipy, value function iteration, etc.).`);
                  }
                  // Check for calibration
                  if (!/calibrat|parameter|baseline/i.test(content)) {
                    qualityWarnings.push(`QUALITY: Computational method section lacks calibration discussion. Justify each parameter value from data or literature.`);
                  }
                }

                if (section_type === 'extensions') {
                  if (contentLength < 3000) {
                    qualityWarnings.push(`QUALITY: Extensions section is only ${contentLength} chars. Each robustness check needs: what was changed, why it matters, results, and interpretation.`);
                  }
                }

                const warning = qualityWarnings.length > 0 ? qualityWarnings.join('\n') : undefined;

                // Store section server-side for later compilation
                // Reset reject counter on successful store
                const sid2 = sessionId || 'default';
                if (sectionRejectCounts.has(sid2)) {
                  sectionRejectCounts.get(sid2)!.delete(section_type);
                }

                // Replace if section type already exists
                const existingIdx = paperSectionsStore.findIndex(s => s.type === section_type);
                if (existingIdx >= 0) {
                  paperSectionsStore[existingIdx] = { type: section_type, latex_content, bibtex_keys, figure_ids };
                  logger.info(`Replaced existing paper section: ${section_type}`);
                } else {
                  paperSectionsStore.push({ type: section_type, latex_content, bibtex_keys, figure_ids });
                }

                result = {
                  success: true,
                  section_type,
                  content_length: contentLength,
                  stored_sections: paperSectionsStore.map(s => ({ type: s.type, length: s.latex_content.length })),
                  bibtex_keys: bibtex_keys || [],
                  figure_ids: figure_ids || [],
                  section_order: section_order || 0,
                  message: `Section "${section_type}" stored (${contentLength} chars). ${paperSectionsStore.length} section(s) stored so far. When calling compile_research_paper, sections are auto-populated from stored data — you do NOT need to re-send section content.`,
                  ...(warning ? { warning } : {}),
                };

                if (warning) {
                  logger.warn(warning);
                }
                logger.success(`Paper section "${section_type}" stored (${contentLength} chars) — ${paperSectionsStore.length} total sections`);

                } // end if (!result) — section accepted or accepted after max rejects

              } else if (toolCall.name === 'install_python_package') {
                const packageName = toolCall.input.package_name;
                const version = toolCall.input.version || '';
                const packageSpec = version ? `${packageName}${version}` : packageName;

                // Security: allowlist of safe packages
                const ALLOWED_PACKAGES = new Set([
                  'torch', 'torchvision', 'torchaudio',
                  'tensorflow', 'keras',
                  'catboost', 'prophet', 'pmdarima',
                  'darts', 'sktime', 'tslearn', 'tsfresh',
                  'optuna', 'hyperopt',
                  'polars', 'pyarrow',
                  'hmmlearn', 'ruptures',
                  'pywavelets', 'PyWavelets',
                  'empyrical', 'alphalens', 'zipline',
                  'cvxopt', 'qpsolvers',
                  'arch', 'linearmodels',
                  'fredapi', 'quandl', 'pandas-datareader',
                  'copulas', 'sdv',
                  'shap', 'lime', 'eli5',
                  'umap-learn', 'hdbscan',
                  'pymc', 'arviz', 'bambi',
                  'gensim', 'nltk', 'textblob',
                  'beautifulsoup4', 'lxml', 'html5lib',
                  'openpyxl', 'xlsxwriter',
                  'reportlab', 'fpdf2',
                  'pillow', 'Pillow',
                  'tabulate',
                ]);

                if (!ALLOWED_PACKAGES.has(packageName)) {
                  result = {
                    success: false,
                    error: `Package "${packageName}" is not in the allowed list. Allowed packages: ${Array.from(ALLOWED_PACKAGES).slice(0, 20).join(', ')}...`,
                  };
                  logger.warn(`Blocked install of non-allowed package: ${packageName}`);
                } else {
                  logger.info(`📦 Installing Python package: ${packageSpec}`);
                  safeWrite(`data: ${JSON.stringify({
                    type: 'status',
                    message: `📦 Installing Python package: ${packageSpec}...`
                  })}\n\n`);

                  try {
                    const { execSync } = await import('child_process');
                    const pipOutput = execSync(
                      `pip install "${packageSpec}" --quiet --no-warn-script-location 2>&1`,
                      { timeout: 300000, encoding: 'utf-8' }
                    );
                    result = {
                      success: true,
                      message: `Package "${packageSpec}" installed successfully. You can now re-run your Python code.`,
                      output: pipOutput.trim().substring(0, 500),
                    };
                    logger.success(`✅ Package installed: ${packageSpec}`);
                  } catch (installError: any) {
                    result = {
                      success: false,
                      error: `Failed to install "${packageSpec}": ${(installError as Error).message?.substring(0, 500)}`,
                    };
                    logger.error(`❌ Package install failed: ${packageSpec}`);
                  }
                }
              } else {
                // Delegate to LaTeX routes
                result = await executeLatexToolCall(toolCall, ctx);
              }

  return result;
}

/**
 * Execute LaTeX-related tool calls (compile, read, inspect, patch, recompile).
 */
export async function executeLatexToolCall(
  toolCall: any,
  ctx: ToolExecutorContext,
): Promise<any> {
  const { sessionId, userId, authorName, pythonCodeEntries, sessionDataFiles, refs } = ctx;
  let result: any;

  if (toolCall.name === 'compile_research_paper') {
                logger.info(`Compiling research paper: ${toolCall.input.title}`);

                // Build sections: prefer server-side stored sections, fallback to input
                const inputSections = (toolCall.input.sections || []).map((s: any) => ({
                  type: s.type,
                  latex_content: s.content || s.latex_content || '',
                }));

                // Auto-merge: use stored sections as the primary source
                // Only use input sections if they have substantial content (not placeholders like "already_written")
                const PLACEHOLDER_PATTERNS = /^(already.?written|see above|stored|previously written|N\/A|none|TBD)/i;
                const sections: { type: string; latex_content: string }[] = [];

                if (ctx.paperSectionsStore.length > 0) {
                  // Use stored sections as primary source
                  for (const stored of ctx.paperSectionsStore) {
                    sections.push({ type: stored.type, latex_content: stored.latex_content });
                  }
                  // Add any input sections that aren't already stored and have real content
                  for (const input of inputSections) {
                    const alreadyHave = sections.find(s => s.type === input.type);
                    if (!alreadyHave && input.latex_content.length > 100 && !PLACEHOLDER_PATTERNS.test(input.latex_content.trim())) {
                      sections.push(input);
                    }
                  }
                  logger.info(`📝 Using ${ctx.paperSectionsStore.length} stored sections + ${sections.length - ctx.paperSectionsStore.length} extra from input`);
                } else {
                  // No stored sections — use input, but filter out placeholders
                  for (const input of inputSections) {
                    if (input.latex_content.length > 100 && !PLACEHOLDER_PATTERNS.test(input.latex_content.trim())) {
                      sections.push(input);
                    } else {
                      logger.warn(`⚠️ Skipped placeholder section "${input.type}": "${input.latex_content.substring(0, 50)}..."`);
                    }
                  }
                }

                if (sections.length === 0) {
                  result = {
                    success: false,
                    error: 'No valid sections found for compilation. All sections were empty or contained placeholders. Please call write_paper_section first for each section.',
                  };
                  logger.error('compile_research_paper failed: no valid sections');
                } else {
                logger.info(`📄 Compiling paper with ${sections.length} sections: ${sections.map(s => s.type).join(', ')}`);

                // Collect ALL figures from session — flatten into sequential array
                // matching Claude's {{FIG:0}}, {{FIG:1}}, ... placeholders
                const figures: { id: string; base64: string }[] = [];
                let seqIdx = 0;
                for (const entry of ctx.customPythonFiguresData) {
                  for (const base64 of entry.figures) {
                    figures.push({ id: String(seqIdx), base64 });
                    seqIdx++;
                  }
                }
                if (figures.length > 0) {
                  logger.info(`📊 Collected ${figures.length} figures from ${ctx.customPythonFiguresData.length} Python execution(s) for paper compilation`);
                  figures.forEach((f, i) => logger.info(`  Figure ${f.id}: ${f.base64.length} chars base64`));
                } else {
                  logger.warn(`⚠️ No figures available in session for paper compilation (${ctx.customPythonFiguresData.length} Python executions recorded)`);
                }

                // Log section content to verify {{FIG:N}} placeholders are present
                for (const s of sections) {
                  const figPlaceholders = s.latex_content.match(/\{\{FIG:\w+\}\}/g) || [];
                  logger.info(`  Section "${s.type}": ${s.latex_content.length} chars, ${figPlaceholders.length} figure placeholder(s)${figPlaceholders.length > 0 ? ': ' + figPlaceholders.join(', ') : ''}`);
                }

                const paperResult = await compileResearchPaper({
                  sections,
                  bibtex_entries: toolCall.input.bibtex_entries,
                  title: toolCall.input.title,
                  authors: toolCall.input.authors,
                  abstract: toolCall.input.abstract,
                  keywords: toolCall.input.keywords,
                  template: toolCall.input.template,
                  figures,
                  filename: toolCall.input.filename,
                });

                if (paperResult.success) {
                  // Copy PDF to downloads directory so /api/download/:filename can serve it
                  const fsCompile = await import('fs');
                  const downloadsDir = path.resolve('downloads');
                  if (!fsCompile.existsSync(downloadsDir)) {
                    fsCompile.mkdirSync(downloadsDir, { recursive: true });
                  }
                  const uniqueName = `${Date.now()}_${paperResult.filename}`;
                  const downloadDest = path.join(downloadsDir, uniqueName);
                  try {
                    fsCompile.copyFileSync(paperResult.filepath!, downloadDest);
                    // Cleanup temp file
                    try { fsCompile.unlinkSync(paperResult.filepath!); } catch {}
                  } catch (copyErr) {
                    logger.error(`Failed to copy compiled paper to downloads: ${(copyErr as Error).message}`);
                  }

                  // Create project ZIP with LaTeX source, figures, and Python scripts
                  let projectZipUrl: string | undefined;
                  if (paperResult.workDir) {
                    try {
                      const pyScripts = buildPipelineScripts(pythonCodeEntries);
                      const zipName = (paperResult.filename || 'research_paper').replace(/\.pdf$/i, '');
                      const zipPath = await createProjectZip(
                        paperResult.workDir,
                        downloadDest,
                        pyScripts,
                        zipName,
                        sessionDataFiles,
                        ctx.sessionMetadata,
                      );
                      const zipFilename = path.basename(zipPath);
                      projectZipUrl = `/api/download/${encodeURIComponent(zipFilename)}`;
                      logger.success(`Project ZIP created: ${zipFilename}`);
                    } catch (zipErr) {
                      logger.error(`Failed to create project ZIP: ${(zipErr as Error).message}`);
                    }
                    // Cleanup workDir now that ZIP is created
                    try { fsCompile.rmSync(paperResult.workDir, { recursive: true, force: true }); } catch {}
                  }

                  // ─── Auto-publish to AutoScholar Journal ───
                  const downloadUrl = `/api/download/${encodeURIComponent(uniqueName)}`;
                  try {
                    const paperTitle = toolCall.input.title || 'Untitled Research Paper';
                    const paperAbstract = toolCall.input.abstract || '';
                    const paperAuthors = authorName
                      ? `${authorName}, Euler — The AutoScholar Research Agent`
                      : 'Euler — The AutoScholar Research Agent';
                    const paperKeywords = toolCall.input.keywords || [];

                    // Auto-detect research domain via weighted keyword scoring
                    const domain = detectDomain(paperTitle, paperAbstract, paperKeywords);

                    // Estimate word count from sections
                    const totalChars = sections.reduce((sum, s) => sum + s.latex_content.length, 0);
                    const estWordCount = Math.round(totalChars / 6); // rough LaTeX chars-to-words

                    // Generate a unique ASID for this paper
                    let paperAsid: string | null = null;
                    try {
                      const { generateAsid } = await import('../services/doiService');
                      paperAsid = await generateAsid();
                    } catch (asidErr) {
                      logger.warn(`[ASID] Could not generate ASID: ${(asidErr as Error).message}`);
                    }

                    await storage.createPublishedPaper({
                      asid: paperAsid,
                      title: paperTitle,
                      abstract: paperAbstract || null,
                      authors: paperAuthors || null,
                      keywords: JSON.stringify(paperKeywords),
                      template: toolCall.input.template || 'article',
                      domain,
                      filename: paperResult.filename || uniqueName,
                      downloadUrl,
                      projectZipUrl: projectZipUrl || null,
                      latexContent: JSON.stringify(sections),
                      bibtexEntries: toolCall.input.bibtex_entries || null,
                      wordCount: estWordCount,
                      sectionCount: sections.length,
                      figureCount: figures.length,
                      sessionId: sessionId || null,
                      userId: userId || null,
                      authorName: authorName || null,
                      showInJournal: 1,
                      runId: null,
                    });
                    logger.success(`📚 Paper auto-published to AutoScholar Journal: "${paperTitle}"${paperAsid ? ` — ASID: ${paperAsid}` : ''}`);
                  } catch (publishErr) {
                    logger.error(`Failed to auto-publish paper: ${(publishErr as Error).message}`);
                  }

                  result = {
                    success: true,
                    message: `Research paper compiled successfully from ${sections.length} sections: ${paperResult.filename}`,
                    filename: paperResult.filename,
                    filepath: downloadDest,
                    download_url: downloadUrl,
                    ...(projectZipUrl ? { project_zip_url: projectZipUrl } : {}),
                  };
                  logger.success(`Research paper compiled: ${paperResult.filename}`);
                } else {
                  // Register failed compilation for repair loop if workDir was preserved
                  if (paperResult.workDir) {
                    const hasBib = !!(toolCall.input.bibtex_entries);
                    const template = toolCall.input.template || 'article';
                    const meta = registerCompilation(paperResult.workDir, hasBib, template);
                    refs.lastCompilationId = meta.compilationId;
                    result = {
                      success: false,
                      error: paperResult.error,
                      compilation_id: meta.compilationId,
                      repair_hint: 'Compilation failed. Use inspect_latex_errors(compilation_id) to see structured errors, then read_latex_source(compilation_id) to read the source, patch_latex(compilation_id, diff) to fix, and recompile_latex(compilation_id) to retry.',
                    };
                  } else {
                    result = {
                      success: false,
                      error: paperResult.error,
                    };
                  }
                  logger.error(`Research paper compilation failed: ${paperResult.error}`);
                }
                } // end else (valid sections)
              } else if (toolCall.name === 'read_latex_source') {
                const cid = toolCall.input.compilation_id || refs.lastCompilationId;
                if (!cid) {
                  result = { success: false, error: 'No compilation_id provided and no recent failed compilation.' };
                } else {
                  result = readLatexSource(cid);
                }
              } else if (toolCall.name === 'inspect_latex_errors') {
                const cid = toolCall.input.compilation_id || refs.lastCompilationId;
                if (!cid) {
                  result = { success: false, error: 'No compilation_id provided and no recent failed compilation.' };
                } else {
                  result = inspectLatexErrors(cid);
                }
              } else if (toolCall.name === 'patch_latex') {
                const cid = toolCall.input.compilation_id || refs.lastCompilationId;
                if (!cid) {
                  result = { success: false, error: 'No compilation_id provided and no recent failed compilation.' };
                } else {
                  result = patchLatex(cid, toolCall.input.diff);
                }
              } else if (toolCall.name === 'recompile_latex') {
                const cid = toolCall.input.compilation_id || refs.lastCompilationId;
                if (!cid) {
                  result = { success: false, error: 'No compilation_id provided and no recent failed compilation.' };
                } else {
                  const recompileResult = await recompileLatex(cid, toolCall.input.filename);

                  if (recompileResult.success && recompileResult.filepath && recompileResult.workDir) {
                    // Post-processing: copy PDF to downloads, create ZIP, publish to journal
                    const fsRecompile = await import('fs');
                    const downloadsDir = path.resolve('downloads');
                    if (!fsRecompile.existsSync(downloadsDir)) {
                      fsRecompile.mkdirSync(downloadsDir, { recursive: true });
                    }
                    const uniqueName = `${Date.now()}_${recompileResult.filename}`;
                    const downloadDest = path.join(downloadsDir, uniqueName);
                    try {
                      fsRecompile.copyFileSync(recompileResult.filepath, downloadDest);
                      try { fsRecompile.unlinkSync(recompileResult.filepath); } catch {}
                    } catch (copyErr) {
                      logger.error(`Failed to copy recompiled paper to downloads: ${(copyErr as Error).message}`);
                    }

                    // Create project ZIP
                    let projectZipUrl: string | undefined;
                    try {
                      const pyScripts = buildPipelineScripts(pythonCodeEntries);
                      const zipName = (recompileResult.filename || 'research_paper').replace(/\.pdf$/i, '');
                      const zipPath = await createProjectZip(
                        recompileResult.workDir,
                        downloadDest,
                        pyScripts,
                        zipName,
                        sessionDataFiles,
                        ctx.sessionMetadata,
                      );
                      const zipFilename = path.basename(zipPath);
                      projectZipUrl = `/api/download/${encodeURIComponent(zipFilename)}`;
                      logger.success(`Project ZIP created (recompile): ${zipFilename}`);
                    } catch (zipErr) {
                      logger.error(`Failed to create project ZIP: ${(zipErr as Error).message}`);
                    }

                    const downloadUrl = `/api/download/${encodeURIComponent(uniqueName)}`;

                    // Auto-publish to journal
                    try {
                      const meta = getCompilationMeta(cid);

                      // Extract real title from the .tex source instead of using a placeholder
                      let paperTitle: string | null = null;
                      if (meta?.texPath && fsRecompile.existsSync(meta.texPath)) {
                        const texSource = fsRecompile.readFileSync(meta.texPath, 'utf-8');
                        const titleMatch = texSource.match(/\\title\{([^}]+)\}/);
                        if (titleMatch?.[1]) {
                          paperTitle = titleMatch[1].replace(/\\[a-zA-Z]+\{([^}]*)\}/g, '$1').trim() || null;
                        }
                      }
                      const paperAuthors = authorName
                        ? `${authorName}, Euler — The AutoScholar Research Agent`
                        : 'Euler — The AutoScholar Research Agent';
                      if (!paperTitle) {
                        logger.warn('Skipping journal publish: could not extract title from recompiled paper');
                        throw new Error('No title extracted');
                      }
                      const domain = detectDomain(paperTitle, '', []);
                      await storage.createPublishedPaper({
                        asid: null,
                        title: paperTitle,
                        abstract: null,
                        authors: paperAuthors,
                        keywords: '[]',
                        template: meta?.template || 'article',
                        domain,
                        filename: recompileResult.filename || uniqueName,
                        downloadUrl,
                        projectZipUrl: projectZipUrl || null,
                        latexContent: null,
                        bibtexEntries: null,
                        wordCount: 0,
                        sectionCount: 0,
                        figureCount: 0,
                        sessionId: sessionId || null,
                        userId: userId || null,
                        authorName: authorName || null,
                        showInJournal: 1,
                        runId: null,
                      });
                      logger.success(`📚 Recompiled paper published to journal`);
                    } catch (publishErr) {
                      logger.error(`Failed to publish recompiled paper: ${(publishErr as Error).message}`);
                    }

                    // Cleanup workDir after ZIP
                    try { fsRecompile.rmSync(recompileResult.workDir, { recursive: true, force: true }); } catch {}

                    result = {
                      success: true,
                      message: `LaTeX recompilation successful after ${recompileResult.repair_attempts} patch(es): ${recompileResult.filename}`,
                      filename: recompileResult.filename,
                      download_url: downloadUrl,
                      ...(projectZipUrl ? { project_zip_url: projectZipUrl } : {}),
                    };
                    logger.success(`LaTeX recompilation succeeded: ${recompileResult.filename}`);
                  } else {
                    result = {
                      success: false,
                      compilation_id: cid,
                      error: recompileResult.error,
                      repair_attempts: recompileResult.repair_attempts,
                      max_repairs: recompileResult.max_repairs,
                      repair_hint: 'Use inspect_latex_errors(compilation_id) → patch_latex(compilation_id, diff) → recompile_latex(compilation_id)',
                    };
                  }
                }
              }

  return result;
}
