import { Activity } from "lucide-react";
import type { QuestionCategory } from "./types";

export const IMPLIED_VOLATILITY_SURFACES: QuestionCategory = {
  category: "Implied Volatility Surfaces",
  icon: Activity,
  questions: [
    "Research paper on the dynamics of the implied volatility surface: level, skew, and term structure factors using daily option chain data",
    "Empirical study on volatility smile asymmetry across sectors: tech vs financials vs energy using US equity options 2010-2025",
    "Paper on the term structure of implied volatility and its predictive power for realized volatility at different horizons",
    "Academic study on the no-arbitrage constraints for implied volatility surfaces and their empirical violations",
    "Research on sticky-strike vs sticky-delta dynamics: which rule better describes empirical IV surface movements?",
    "Paper on SVI (Stochastic Volatility Inspired) parameterization of the volatility smile: calibration and time-series stability",
    "Empirical analysis of the volatility skew slope as a predictor of future equity tail risk using 15 years of option data",
    "Study on cross-sectional variation in implied volatility surfaces across 5,000+ US equities: common factors and firm-level drivers",
    "Research on intraday implied volatility surface dynamics using 1-minute underlying data and daily option snapshots around FOMC announcements",
    "Paper on the joint dynamics of SPX and VIX option implied volatility surfaces and arbitrage-free consistency",
    "Academic paper on the risk-neutral density extraction from option prices and its evolution over earnings cycles",
    "Research on the volatility surface response to macroeconomic surprises: asymmetric effects on skew and level",
  ]
};
