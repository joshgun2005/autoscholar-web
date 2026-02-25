import type { Express, Request, Response } from "express";
import {
  getCompanyProfile,
  getIncomeStatement,
  getBalanceSheet,
  getCashFlowStatement,
  getKeyMetrics,
  getFinancialRatios,
  getStockQuote,
  getHistoricalPrice,
  getFinancialNews,
  getAnalystEstimates,
  getPriceTarget,
  getPriceTargetSummary,
  getUpgradesDowngrades,
  getInstitutionalHolders,
  getESGScore,
  getInsiderTrading,
  getEarningsSurprises,
  getDividendHistory,
  getIntradayPrice,
  getMarketHours,
  getGainers,
  getLosers,
  getActives,
} from "../services/fmpService";
import { logger } from "../utils/logger";

export function registerFmpRoutes(app: Express) {
  // ─── Market Overview ────────────────────────────────────

  app.get("/api/fmp/market-hours", async (_req: Request, res: Response) => {
    try {
      res.json(await getMarketHours());
    } catch (error) {
      logger.error("Get market hours error:", error);
      res.status(500).json({ error: "Failed to fetch market hours" });
    }
  });

  app.get("/api/fmp/gainers", async (_req: Request, res: Response) => {
    try {
      res.json(await getGainers());
    } catch (error) {
      logger.error("Get gainers error:", error);
      res.status(500).json({ error: "Failed to fetch gainers" });
    }
  });

  app.get("/api/fmp/losers", async (_req: Request, res: Response) => {
    try {
      res.json(await getLosers());
    } catch (error) {
      logger.error("Get losers error:", error);
      res.status(500).json({ error: "Failed to fetch losers" });
    }
  });

  app.get("/api/fmp/actives", async (_req: Request, res: Response) => {
    try {
      res.json(await getActives());
    } catch (error) {
      logger.error("Get actives error:", error);
      res.status(500).json({ error: "Failed to fetch most active stocks" });
    }
  });

  // ─── Stock Quotes & Prices ──────────────────────────────

  app.get("/api/fmp/quote/:symbol", async (req: Request, res: Response) => {
    try {
      res.json(await getStockQuote(req.params.symbol));
    } catch (error) {
      logger.error("Get quote error:", error);
      res.status(500).json({ error: "Failed to fetch stock quote" });
    }
  });

  app.get("/api/fmp/company-profile/:symbol", async (req: Request, res: Response) => {
    try {
      res.json(await getCompanyProfile(req.params.symbol));
    } catch (error) {
      logger.error("Get company profile error:", error);
      res.status(500).json({ error: "Failed to fetch company profile" });
    }
  });

  app.get("/api/fmp/stock-quote/:symbol", async (req: Request, res: Response) => {
    try {
      res.json(await getStockQuote(req.params.symbol));
    } catch (error) {
      logger.error("Get stock quote error:", error);
      res.status(500).json({ error: "Failed to fetch stock quote" });
    }
  });

  app.get("/api/fmp/historical-price/:symbol", async (req: Request, res: Response) => {
    try {
      res.json(await getHistoricalPrice(req.params.symbol));
    } catch (error) {
      logger.error("Get historical price error:", error);
      res.status(500).json({ error: "Failed to fetch historical price" });
    }
  });

  app.get("/api/fmp/intraday/:symbol", async (req: Request, res: Response) => {
    try {
      const interval = (req.query.interval as string) || '5min';
      logger.info(`Fetching intraday data for ${req.params.symbol} with interval ${interval}`);
      res.json(await getIntradayPrice(req.params.symbol, interval));
    } catch (error) {
      logger.error("Get intraday price error:", error);
      res.status(500).json({ error: "Failed to fetch intraday price data" });
    }
  });

  // ─── Financial Statements ──────────────────────────────

  app.get("/api/fmp/income-statement/:symbol", async (req: Request, res: Response) => {
    try {
      const period = (req.query.period as 'annual' | 'quarter') || 'annual';
      const limit = parseInt(req.query.limit as string) || 5;
      res.json(await getIncomeStatement(req.params.symbol, period, limit));
    } catch (error) {
      logger.error("Get income statement error:", error);
      res.status(500).json({ error: "Failed to fetch income statement" });
    }
  });

  app.get("/api/fmp/balance-sheet/:symbol", async (req: Request, res: Response) => {
    try {
      const period = (req.query.period as 'annual' | 'quarter') || 'annual';
      const limit = parseInt(req.query.limit as string) || 5;
      res.json(await getBalanceSheet(req.params.symbol, period, limit));
    } catch (error) {
      logger.error("Get balance sheet error:", error);
      res.status(500).json({ error: "Failed to fetch balance sheet" });
    }
  });

  app.get("/api/fmp/cash-flow/:symbol", async (req: Request, res: Response) => {
    try {
      const period = (req.query.period as 'annual' | 'quarter') || 'annual';
      const limit = parseInt(req.query.limit as string) || 5;
      res.json(await getCashFlowStatement(req.params.symbol, period, limit));
    } catch (error) {
      logger.error("Get cash flow error:", error);
      res.status(500).json({ error: "Failed to fetch cash flow statement" });
    }
  });

  app.get("/api/fmp/key-metrics/:symbol", async (req: Request, res: Response) => {
    try {
      const period = (req.query.period as 'annual' | 'quarter') || 'annual';
      const limit = parseInt(req.query.limit as string) || 5;
      res.json(await getKeyMetrics(req.params.symbol, period, limit));
    } catch (error) {
      logger.error("Get key metrics error:", error);
      res.status(500).json({ error: "Failed to fetch key metrics" });
    }
  });

  app.get("/api/fmp/financial-ratios/:symbol", async (req: Request, res: Response) => {
    try {
      const period = (req.query.period as 'annual' | 'quarter') || 'annual';
      const limit = parseInt(req.query.limit as string) || 5;
      res.json(await getFinancialRatios(req.params.symbol, period, limit));
    } catch (error) {
      logger.error("Get financial ratios error:", error);
      res.status(500).json({ error: "Failed to fetch financial ratios" });
    }
  });

  // ─── Analysis & Estimates ──────────────────────────────

  app.get("/api/fmp/analyst-estimates/:symbol", async (req: Request, res: Response) => {
    try {
      const period = (req.query.period as 'annual' | 'quarter') || 'annual';
      res.json(await getAnalystEstimates(req.params.symbol, period));
    } catch (error) {
      logger.error("Get analyst estimates error:", error);
      res.status(500).json({ error: "Failed to fetch analyst estimates" });
    }
  });

  app.get("/api/fmp/price-target/:symbol", async (req: Request, res: Response) => {
    try {
      res.json(await getPriceTarget(req.params.symbol));
    } catch (error) {
      logger.error("Get price target error:", error);
      res.status(500).json({ error: "Failed to fetch price targets" });
    }
  });

  app.get("/api/fmp/price-target-summary/:symbol", async (req: Request, res: Response) => {
    try {
      res.json(await getPriceTargetSummary(req.params.symbol));
    } catch (error) {
      logger.error("Get price target summary error:", error);
      res.status(500).json({ error: "Failed to fetch price target summary" });
    }
  });

  app.get("/api/fmp/upgrades-downgrades/:symbol", async (req: Request, res: Response) => {
    try {
      res.json(await getUpgradesDowngrades(req.params.symbol));
    } catch (error) {
      logger.error("Get upgrades downgrades error:", error);
      res.status(500).json({ error: "Failed to fetch upgrades downgrades" });
    }
  });

  app.get("/api/fmp/earnings-surprises/:symbol", async (req: Request, res: Response) => {
    try {
      res.json(await getEarningsSurprises(req.params.symbol));
    } catch (error) {
      logger.error("Get earnings surprises error:", error);
      res.status(500).json({ error: "Failed to fetch earnings surprises" });
    }
  });

  // ─── Other Data ─────────────────────────────────────────

  app.get("/api/fmp/dividend-history/:symbol", async (req: Request, res: Response) => {
    try {
      res.json(await getDividendHistory(req.params.symbol));
    } catch (error) {
      logger.error("Get dividend history error:", error);
      res.status(500).json({ error: "Failed to fetch dividend history" });
    }
  });

  app.get("/api/fmp/institutional-holders/:symbol", async (req: Request, res: Response) => {
    try {
      res.json(await getInstitutionalHolders(req.params.symbol));
    } catch (error) {
      logger.error("Get institutional holders error:", error);
      res.status(500).json({ error: "Failed to fetch institutional holders" });
    }
  });

  app.get("/api/fmp/financial-news/:symbol", async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      res.json(await getFinancialNews(req.params.symbol, limit));
    } catch (error) {
      logger.error("Get financial news error:", error);
      res.status(500).json({ error: "Failed to fetch financial news" });
    }
  });

  app.get("/api/fmp/insider-trading/:symbol", async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      res.json(await getInsiderTrading(req.params.symbol, limit));
    } catch (error) {
      logger.error("Get insider trading error:", error);
      res.status(500).json({ error: "Failed to fetch insider trading" });
    }
  });

  app.get("/api/fmp/esg-score/:symbol", async (req: Request, res: Response) => {
    try {
      res.json(await getESGScore(req.params.symbol));
    } catch (error) {
      logger.error("Get ESG score error:", error);
      res.status(500).json({ error: "Failed to fetch ESG score" });
    }
  });

  // ─── Chart Data ─────────────────────────────────────────

  app.get("/api/fmp/chart/light/:symbol", async (req: Request, res: Response) => {
    try {
      const { from, to } = req.query;
      const result = await import('../services/fmpService').then(m =>
        m.getChartLight(req.params.symbol, from as string, to as string),
      );
      res.json(result);
    } catch (error) {
      logger.error("Get chart light error:", error);
      res.status(500).json({ error: "Failed to fetch chart data" });
    }
  });

  app.get("/api/fmp/chart/full/:symbol", async (req: Request, res: Response) => {
    try {
      const { from, to } = req.query;
      const result = await import('../services/fmpService').then(m =>
        m.getChartFull(req.params.symbol, from as string, to as string),
      );
      res.json(result);
    } catch (error) {
      logger.error("Get chart full error:", error);
      res.status(500).json({ error: "Failed to fetch chart data" });
    }
  });

  app.get("/api/fmp/chart/intraday/:symbol", async (req: Request, res: Response) => {
    try {
      const { interval, from, to, nonadjusted } = req.query;
      const result = await import('../services/fmpService').then(m =>
        m.getChartIntraday(
          req.params.symbol,
          interval as '1min' | '5min' | '15min' | '30min' | '1hour' | '4hour',
          from as string,
          to as string,
          nonadjusted === 'true',
        ),
      );
      res.json(result);
    } catch (error) {
      logger.error("Get chart intraday error:", error);
      res.status(500).json({ error: "Failed to fetch intraday chart data" });
    }
  });
}
