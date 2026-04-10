import { Target } from "lucide-react";
import type { QuestionCategory } from "./types";

export const OPTIONS_STRATEGIES: QuestionCategory = {
  category: "Options Strategies & Backtesting",
  icon: Target,
  questions: [
    "Research paper on systematic covered call writing strategies on S&P 500 stocks: risk-adjusted performance 2010-2025",
    "Empirical study on iron condor strategies on SPY: optimal strike selection, entry timing, and DTE analysis",
    "Paper on the risk-return profile of systematic put selling strategies: evidence from 15 years of US equity options",
    "Academic study on calendar spread strategies: exploiting term structure anomalies in implied volatility",
    "Research on straddle and strangle performance around earnings announcements: buying vs selling volatility",
    "Paper on dispersion trading: going long single-stock volatility vs short index volatility using options",
    "Study on optimal delta-hedged option selling strategies: which moneyness and maturity maximize Sharpe ratios?",
    "Academic paper on protective put strategies and their cost efficiency vs tail-risk ETFs during market drawdowns",
    "Research on ratio spread strategies and their risk-reward characteristics across different volatility regimes",
    "Paper on the collar strategy for equity portfolios: cost analysis, protection level, and upside participation",
    "Empirical study on vertical spread strategies (bull call, bear put) with optimal strike selection rules",
    "Research on the wheel strategy (cash-secured puts + covered calls): empirical performance on mega-cap tech stocks",
  ]
};
