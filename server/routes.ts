import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import path from "path";
import { storage } from "./storage";
import { callClaudeStreaming } from "./services/claudeService";
import { randomBytes } from "crypto";
import { registerAuthRoutes } from "./routes/auth";
import { registerAdminRoutes } from "./routes/admin";
import { registerAnalyticsRoutes } from "./routes/analytics";
import { registerFmpRoutes } from "./routes/fmp";
import { registerReportRoutes } from "./routes/reports";
import { chatBodySchema } from "./routes/validation";
import { searchImages, getMapDirections, searchGoogleShopping, searchFinance, searchJobs, searchFlights, searchHotels, searchVideos, searchGoogleTrends, searchGoogleScholar, searchAppStore } from "./services/serpapiService";
import { searchExa, getContentsExa } from "./services/exaService";
import { searchFirecrawl, scrapeFirecrawl, crawlFirecrawl, extractFirecrawl, mapFirecrawl, agentFirecrawl, batchScrapeFirecrawl } from "./services/firecrawlService";
import { searchTavily, extractTavily, crawlTavily, mapTavily, researchTavily, getUsageTavily } from "./services/tavilyService";
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
  getGainers,
  getLosers,
  getActives,
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
} from "./services/fmpService";
import { getOptionChain, getOptionPrices, getOptionGreeks } from "./services/financialDataService";
import { getEODHDIntraday, getEODHDOptions } from "./services/eodhd_service";
import { executeMonteCarloSimulation, executeOptionsPricing, executeGarchModel, executeVarCalculation, executePortfolioOptimization, executeRiskMetricsAnalysis, executePlot, executeDataDownload, executeCustomPython } from "./services/pythonExecutor";
import { randomUUID } from "crypto";
import type { SearchResult } from "@shared/types";
import { logger } from "./utils/logger";
import multer from "multer";
import FormData from "form-data";
import axios from "axios";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Multer setup for audio file uploads (speech-to-text)
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

  // Speech-to-Text endpoint using ElevenLabs Scribe v2
  app.post("/api/speech-to-text", upload.single("audio"), async (req: Request, res: Response) => {
    try {
      const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
      if (!ELEVENLABS_API_KEY) {
        logger.error('ELEVENLABS_API_KEY not set in environment');
        return res.status(500).json({ error: "ElevenLabs API key not configured" });
      }

      const file = (req as any).file;
      if (!file) {
        logger.error('No audio file in request');
        return res.status(400).json({ error: "Audio file is required" });
      }

      logger.section('SPEECH-TO-TEXT');
      logger.kv('File size', `${(file.size / 1024).toFixed(1)} KB`);
      logger.kv('MIME type', file.mimetype);
      logger.kv('Original name', file.originalname);

      // Determine file extension from mimetype
      let ext = "webm";
      if (file.mimetype.includes("ogg")) ext = "ogg";
      else if (file.mimetype.includes("mp4")) ext = "mp4";
      else if (file.mimetype.includes("mpeg")) ext = "mp3";

      const formData = new FormData();
      formData.append("file", file.buffer, {
        filename: `audio.${ext}`,
        contentType: file.mimetype || "audio/webm",
      });
      formData.append("model_id", "scribe_v2");

      logger.info('Sending audio to ElevenLabs STT API...');

      const response = await axios.post(
        "https://api.elevenlabs.io/v1/speech-to-text",
        formData,
        {
          headers: {
            "xi-api-key": ELEVENLABS_API_KEY,
            ...formData.getHeaders(),
          },
          timeout: 60000,
        }
      );

      const text = response.data?.text || "";
      logger.success(`Transcription (${text.length} chars): "${text.substring(0, 150)}"`);

      return res.json({ text, language_code: response.data?.language_code });
    } catch (error: any) {
      const detail = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      logger.error(`Speech-to-text error: ${detail}`);
      return res.status(error.response?.status || 500).json({
        error: error.response?.data?.detail || error.message || "Speech-to-text failed",
      });
    }
  });

  // Chat endpoint - AI chat with streaming using Claude Opus 4.6 via HTTP
  app.post("/api/chat", async (req: Request, res: Response) => {
    let sseStarted = false;

    try {
      const parsed = chatBodySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0].message });
      }
      const { query, history, sessionId: reqSessionId, imageData, imageMimeType } = parsed.data;
      const sessionId = reqSessionId || randomUUID();

      logger.section('CHAT REQUEST');
      logger.request('POST', '/api/chat');
      logger.kv('Session ID', sessionId);
      logger.kv('Query', query.substring(0, 100) + (query.length > 100 ? '...' : ''));
      logger.kv('History length', history.length);

      // Set up SSE (Server-Sent Events) for streaming
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
      res.setHeader('Content-Encoding', 'none'); // Disable compression
      res.flushHeaders(); // Send headers immediately
      sseStarted = true;
      logger.success('SSE streaming initialized');
      
      let fullAnswer = '';
      let sources: SearchResult[] = [];
      let messages: any[] = [];
      let allToolResults: Array<{ tool: string; result: any }> = [];
      let allSearchQueries: Array<{ query: string; results?: SearchResult[] }> = [];
      let pythonCodeUsed: string = '';
      let monteCarloData: any = null;
      let customPythonFiguresData: Array<{ id: string; figures: string[]; output?: string; description?: string }> = [];
      let totalInputTokens = 0;
      let totalOutputTokens = 0;
      let totalCost = 0;
      
      // Save user message
      logger.database('Saving user message to database...');
      await storage.createMessage({
        sessionId,
        role: 'user',
        content: query,
        sources: null,
      });
      logger.success('User message saved');

      // Send status message
      logger.info('Sending status update to client');
      res.write(`data: ${JSON.stringify({ type: 'status', message: '📊 Financial analysis in progress...' })}\n\n`);
      
      // Build messages array with conversation history
      // Add previous conversation messages (only question and answer text)
      for (const msg of history) {
        messages.push({
          role: 'user',
          content: msg.question,
        });
        messages.push({
          role: 'assistant',
          content: msg.answer,
        });
      }
      
      // Add current user message (multimodal if image attached)
      if (imageData && imageMimeType) {
        logger.kv('Image attached', imageMimeType);
        messages.push({
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: imageMimeType,
                data: imageData,
              },
            },
            {
              type: 'text',
              text: query,
            },
          ],
        });
      } else {
        messages.push({
          role: 'user',
          content: query,
        });
      }
      
      // Function to handle Claude streaming and tool execution
      let isFirstChunkAfterTools = false;
      const processClaudeResponse = async () => {
        logger.section('Claude API Call');
        logger.kv('Messages in context', messages.length);
        const { answer, toolCalls, usage } = await callClaudeStreaming(
          query,
          (chunk) => {
            // Add line break before first chunk if coming after tool execution
            if (isFirstChunkAfterTools) {
              const lineBreak = '\n\n';
              fullAnswer += lineBreak + chunk;
              res.write(`data: ${JSON.stringify({ type: 'text', content: lineBreak + chunk })}\n\n`);
              // @ts-ignore - flush may not be in types but exists at runtime
              if (res.flush) res.flush();
              isFirstChunkAfterTools = false;
            } else {
              fullAnswer += chunk;
              res.write(`data: ${JSON.stringify({ type: 'text', content: chunk })}\n\n`);
              // @ts-ignore - flush may not be in types but exists at runtime
              if (res.flush) res.flush();
            }
          },
          messages
        );
        logger.success('Claude API response received');

        // Accumulate token usage
        totalInputTokens += usage.inputTokens;
        totalOutputTokens += usage.outputTokens;
        totalCost += usage.cost;
        logger.kv('Tokens (input/output)', `${usage.inputTokens}/${usage.outputTokens}`);
        logger.kv('Total accumulated (in/out)', `${totalInputTokens}/${totalOutputTokens}`);
        logger.kv('Cost for this call', `$${usage.cost.toFixed(6)}`);

        // If Claude wants to use tools
        if (toolCalls && toolCalls.length > 0) {
          logger.section('Tools Requested by Claude');
          logger.kv('Number of tools', toolCalls.length);

          // ==================== SEQUENTIAL BATCH EXECUTION ====================
          // Execute ALL tools in batches, accumulate results, then send all to Claude at once
          const MAX_TOOLS_PER_BATCH = 5; // Process 5 tools at a time to avoid overwhelming APIs
          const allToolResultsForClaude: any[] = [];

          // Split tools into batches
          const batches: any[][] = [];
          for (let i = 0; i < toolCalls.length; i += MAX_TOOLS_PER_BATCH) {
            batches.push(toolCalls.slice(i, i + MAX_TOOLS_PER_BATCH));
          }

          if (batches.length > 1) {
            logger.warn(`Large request: executing ${toolCalls.length} tools in ${batches.length} batches`);
          }

          res.write(`data: ${JSON.stringify({ type: 'tools', tools: toolCalls })}\n\n`);

          // Add ALL assistant's tool use to messages at once
          messages.push({
            role: 'assistant',
            content: toolCalls.map((tc: any) => ({
              type: 'tool_use',
              id: tc.id,
              name: tc.name,
              input: tc.input,
            })),
          });

          // Execute batches sequentially
          for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
            const batch = batches[batchIndex];

            if (batches.length > 1) {
              logger.info(`Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} tools)`);
              res.write(`data: ${JSON.stringify({
                type: 'status',
                message: `📊 Batch ${batchIndex + 1}/${batches.length}: ${batch.map((t: any) => t.name).join(', ')}...`
              })}\n\n`);
            }

            // Execute tools in current batch
            for (const toolCall of batch) {
              logger.startTimer(toolCall.id);
              logger.tool(toolCall.name, `Executing... (ID: ${toolCall.id})`);
              const toolStartTime = Date.now();

              // Notify client that tool execution is starting
              res.write(`data: ${JSON.stringify({
                type: 'tool_start',
                tool: toolCall.name,
                toolId: toolCall.id,
                input: toolCall.input
              })}\n\n`);

              try {
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
                  toolCall.input.period || 14,
                  toolCall.input.timePeriod || 'daily'
                );
              } else if (toolCall.name === 'get_macd') {
                result = await getMACD(
                  toolCall.input.symbol,
                  toolCall.input.timePeriod || 'daily'
                );
              } else if (toolCall.name === 'get_ema') {
                result = await getEMA(
                  toolCall.input.symbol,
                  toolCall.input.period || 50,
                  toolCall.input.timePeriod || 'daily'
                );
              } else if (toolCall.name === 'get_sma') {
                result = await getSMA(
                  toolCall.input.symbol,
                  toolCall.input.period || 50,
                  toolCall.input.timePeriod || 'daily'
                );
              } else if (toolCall.name === 'get_adx') {
                result = await getADX(
                  toolCall.input.symbol,
                  toolCall.input.period || 14,
                  toolCall.input.timePeriod || 'daily'
                );
              } else if (toolCall.name === 'get_williams_r') {
                result = await getWilliamsR(
                  toolCall.input.symbol,
                  toolCall.input.period || 14,
                  toolCall.input.timePeriod || 'daily'
                );
              } else if (toolCall.name === 'get_cci') {
                result = await getCCI(
                  toolCall.input.symbol,
                  toolCall.input.period || 20,
                  toolCall.input.timePeriod || 'daily'
                );
              } else if (toolCall.name === 'get_stochastic') {
                result = await getStochasticOscillator(
                  toolCall.input.symbol,
                  toolCall.input.period || 14,
                  toolCall.input.timePeriod || 'daily'
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
                pythonCodeUsed = simulationResult.code || '';
                monteCarloData = result;

                // Send Python code separately
                logger.debug('   📊 Sending Python code to client (length:', simulationResult.code?.length || 0, 'chars)');
                res.write(`data: ${JSON.stringify({
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
                res.write(`data: ${JSON.stringify({
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
                res.write(`data: ${JSON.stringify({
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
                res.write(`data: ${JSON.stringify({
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
                res.write(`data: ${JSON.stringify({
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
                res.write(`data: ${JSON.stringify({
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
                res.write(`data: ${JSON.stringify({
                  type: 'python_code',
                  code: plotResult.code
                })}\n\n`);

                // Send plot URL to client so frontend can correct figure references
                if (result.image_url) {
                  const plotUrl = result.image_url;
                  logger.debug('   🖼️  Sending plot URL to client:', plotUrl);
                  res.write(`data: ${JSON.stringify({
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

                const customPythonResult = await executeCustomPython({
                  code: toolCall.input.code,
                  context: toolCall.input.context,
                  description: toolCall.input.description
                });

                logger.debug('   ✓ Custom Python execution complete:', {
                  success: customPythonResult.success,
                  hasOutput: !!customPythonResult.result?.output,
                  figuresCount: customPythonResult.result?.figures?.length || 0,
                  error: customPythonResult.error
                });

                // Check if execution was successful
                if (!customPythonResult.success || !customPythonResult.result) {
                  throw new Error(customPythonResult.error || 'Custom Python execution failed');
                }

                result = customPythonResult.result;

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
                  res.write(`data: ${JSON.stringify({
                    type: 'custom_python_figures',
                    figureId: figureId,
                    figures: originalFigures,   // base64 data — persisted to DB via share
                    figureUrls: figureUrls,     // file URLs — fast display during session
                    output: result.output,
                    description: toolCall.input.description
                  })}\n\n`);

                  // Create figure references with actual URLs
                  const figureReferences = figureUrls.map((url, idx) =>
                    `![Figure ${idx + 1}](${url})`
                  );

                  // Format output so Claude naturally includes figures in response
                  // Structure: results first, then each figure with a prompt for commentary
                  let formattedOutput = result.output || '';
                  formattedOutput += '\n\n---\n📊 **ANALYSE DES FIGURES GÉNÉRÉES:**\n';
                  figureUrls.forEach((url, idx) => {
                    formattedOutput += `\n**Figure ${idx + 1}:**\n![Figure ${idx + 1}](${url})\n_(Décris cette figure ci-dessus dans ta réponse)_\n`;
                  });
                  formattedOutput += '\n---\n⚠️ IMPORTANT: Tu DOIS inclure chaque image ![Figure X](url) dans ta réponse markdown avec ton analyse de chaque figure.';

                  result.output = formattedOutput;

                  logger.debug('   ✅ Figure URLs:', figureUrls);

                  // Remove base64 data from result sent to Claude
                  delete result.figures;

                  // Store figures for session saving
                  customPythonFiguresData.push({
                    id: figureId,
                    figures: originalFigures,
                    figureUrls: figureUrls,
                    output: result.output,
                    description: toolCall.input.description
                  });
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
              }

              const toolDuration = Date.now() - toolStartTime;
              logger.endTimer(toolCall.id, `Tool ${toolCall.name} completed`);

              // Stringify and truncate result to prevent context overflow
              const resultString = JSON.stringify(result);

              // Higher limit for content extraction tools (Firecrawl, Exa) since they're meant to extract full content
              // ALSO higher limit for custom Python analysis which includes figure references in output
              const isContentExtractionTool = [
                'firecrawl_search',
                'firecrawl_scrape',
                'firecrawl_crawl',
                'firecrawl_extract',
                'firecrawl_map',
                'firecrawl_agent',
                'firecrawl_batch_scrape',
                'tavily_search',
                'tavily_extract',
                'tavily_crawl',
                'tavily_map',
                'tavily_research',
                'get_contents_exa',
                'execute_custom_python_analysis'  // CRITICAL: Must not truncate figure references!
              ].includes(toolCall.name);
              const MAX_TOOL_RESULT_LENGTH = isContentExtractionTool ? 15000 : 3000; // 15k for content extraction & Python analysis, 3k for others

              const truncatedResult = resultString.length > MAX_TOOL_RESULT_LENGTH
                ? resultString.substring(0, MAX_TOOL_RESULT_LENGTH) + `\n\n[... truncated, original length: ${resultString.length} chars]`
                : resultString;

              // Add to results for Claude
              allToolResultsForClaude.push({
                type: 'tool_result',
                tool_use_id: toolCall.id,
                content: truncatedResult,
              });

              // Also store for session saving
              allToolResults.push({ tool: toolCall.name, result });

              const resultPreview = JSON.stringify(result).substring(0, 100);
              logger.debug(`Result preview: ${resultPreview}...`);

              // Notify client that tool completed
              res.write(`data: ${JSON.stringify({
                type: 'tool_complete',
                tool: toolCall.name,
                toolId: toolCall.id,
                duration: toolDuration
              })}\n\n`);

              res.write(`data: ${JSON.stringify({
                type: 'tool_result',
                tool: toolCall.name,
                result: result
              })}\n\n`);
            } catch (toolError) {
              logger.error(`Error executing tool ${toolCall.name}: ${(toolError as Error).message}`);

              // Notify client of tool error
              res.write(`data: ${JSON.stringify({
                type: 'tool_error',
                tool: toolCall.name,
                toolId: toolCall.id,
                error: (toolError as Error).message
              })}\n\n`);

              allToolResultsForClaude.push({
                type: 'tool_result',
                tool_use_id: toolCall.id,
                content: `Error: ${(toolError as Error).message}`,
                is_error: true,
              });
            }
          }

          // Wait a bit between batches to avoid API rate limits
          if (batchIndex < batches.length - 1) {
            logger.info('Waiting 500ms before next batch to avoid rate limits...');
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }

        logger.success(`All ${toolCalls.length} tools executed successfully across ${batches.length} batch(es)`);

        // Now send ALL tool results to Claude at once
        logger.info(`Sending all ${allToolResultsForClaude.length} tool results to Claude for final analysis`);

        if (batches.length > 1) {
          res.write(`data: ${JSON.stringify({
            type: 'status',
            message: `🤖 All ${allToolResultsForClaude.length} tools completed. Generating comprehensive analysis...`
          })}\n\n`);
        }

        messages.push({
          role: 'user',
          content: allToolResultsForClaude,
        });

        // Set flag to add line break before next response
        isFirstChunkAfterTools = true;

        // Recursively process Claude's response with ALL tool results
        logger.info('Recursively processing Claude response with all tool results...');
        await processClaudeResponse();
        } else {
          // No more tools needed, finalize
          logger.section('Finalizing Response');
          logger.kv('Answer length', `${fullAnswer.length} characters`);
          logger.kv('Tools used', allToolResults.length);

          // Save assistant message
          logger.database('Saving assistant message to database...');
          await storage.createMessage({
            sessionId,
            role: 'assistant',
            content: fullAnswer,
            sources: JSON.stringify(sources.map(s => s.url)),
          });
          logger.success('Assistant message saved');

          // Save complete conversation session
          try {
            logger.database('Saving conversation session...');
            logger.kv('FINAL totalInputTokens', totalInputTokens);
            logger.kv('FINAL totalOutputTokens', totalOutputTokens);
            logger.kv('FINAL totalCost', `$${totalCost.toFixed(6)}`);
            const existingSession = await storage.getConversationSession(sessionId);
            const sessionMessages = existingSession ? JSON.parse(existingSession.messages) : [];

            // Add current message to session
            sessionMessages.push({
              question: query,
              answer: fullAnswer,
              toolResults: allToolResults,
              sources: sources,
              searchQueries: allSearchQueries,
              pythonCode: pythonCodeUsed || null,
              monteCarloResults: monteCarloData || null,
              customPythonFigures: customPythonFiguresData.length > 0 ? customPythonFiguresData : null,
            });

            if (existingSession) {
              // Update existing session
              logger.info('Updating existing session');
              await storage.updateConversationSession(sessionId, {
                messages: JSON.stringify(sessionMessages),
                inputTokens: (existingSession.inputTokens || 0) + totalInputTokens,
                outputTokens: (existingSession.outputTokens || 0) + totalOutputTokens,
                totalCost: (existingSession.totalCost || 0) + totalCost,
              });
            } else {
              // Create new session with first question as title
              const userId = (req.session as any).userId;
              logger.info(`Creating new session for user: ${userId || 'anonymous'}`);
              await storage.createConversationSession({
                sessionId,
                userId: userId || null,
                title: query.length > 60 ? query.substring(0, 60) + '...' : query,
                messages: JSON.stringify(sessionMessages),
                inputTokens: totalInputTokens,
                outputTokens: totalOutputTokens,
                totalCost: totalCost,
              });
            }
            logger.success('Conversation session saved');
            logger.kv('Total tokens (session)', `${totalInputTokens + totalOutputTokens}`);
            logger.kv('Total cost (this request)', `$${totalCost.toFixed(6)}`);
          } catch (sessionError) {
            logger.error(`Error saving conversation session: ${(sessionError as Error).message}`);
          }

          // Automatically create a shared report ONLY for anonymous users
          // Logged-in users get private history instead
          const currentUserId = (req.session as any).userId;
          if (!currentUserId) {
            try {
              logger.database('Creating shared report (anonymous user)...');
              const shareId = randomUUID().replace(/-/g, '').substring(0, 8);
              await storage.createSharedReport({
                shareId,
                question: query,
                answer: fullAnswer,
                toolResults: allToolResults.length > 0 ? JSON.stringify(allToolResults) : null,
                sources: sources.length > 0 ? JSON.stringify(sources) : null,
                customPythonFigures: customPythonFiguresData.length > 0 ? JSON.stringify(customPythonFiguresData) : null,
              });
              logger.success(`Shared report created with ID: ${shareId}`);
            } catch (shareError) {
              logger.error(`Error creating shared report: ${(shareError as Error).message}`);
            }
          } else {
            logger.info('Skipping shared report creation (logged-in user - private history)');
          }

          // Send sources and completion
          logger.info('Sending final response to client');
          res.write(`data: ${JSON.stringify({ type: 'sources', sources })}\n\n`);
          res.write(`data: ${JSON.stringify({ type: 'done', sessionId })}\n\n`);
          res.end();
          logger.success('CHAT REQUEST COMPLETED');
        }
      };

      // Start the process
      logger.server('Starting Claude response processing...');
      await processClaudeResponse();

    } catch (error) {
      logger.error(`CHAT ERROR: ${(error as Error).message}`);
      logger.debug(`Stack: ${(error as Error).stack}`);
      if (sseStarted) {
        res.write(`data: ${JSON.stringify({ type: 'error', error: 'Failed to process chat' })}\n\n`);
        res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: 'Failed to process chat' });
      }
    }
  });

  // ─── Register sub-route modules ─────────────────────────
  registerAuthRoutes(app);
  registerAdminRoutes(app);
  registerAnalyticsRoutes(app);
  registerFmpRoutes(app);
  registerReportRoutes(app);

  const httpServer = createServer(app);
  return httpServer;
}

// ── REMOVED: All routes below have been extracted to server/routes/ ──
// auth.ts     → /api/auth/*
// admin.ts    → /api/admin/*
// analytics.ts → /api/analytics/*
// fmp.ts      → /api/fmp/*
// reports.ts  → /api/share/*, /api/sessions/*, /api/generate-*, /api/download/*
