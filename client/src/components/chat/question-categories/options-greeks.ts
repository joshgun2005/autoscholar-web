import { Sigma } from "lucide-react";
import type { QuestionCategory } from "./types";

export const OPTIONS_GREEKS: QuestionCategory = {
  category: "Options Greeks & Hedging",
  icon: Sigma,
  questions: [
    "Research paper on empirical delta-hedging performance across moneyness and maturity using daily US equity options data",
    "Academic study on gamma exposure (GEX) and its role in amplifying or dampening intraday equity market moves",
    "Paper on the effectiveness of vega-neutral and delta-vega-neutral hedging strategies for equity option portfolios",
    "Empirical analysis of theta decay patterns: how time decay deviates from Black-Scholes predictions across the option surface",
    "Research on charm (delta decay) and vanna (delta sensitivity to volatility) as second-order hedging tools for large option books",
    "Paper on the impact of discrete hedging on P&L volatility: rebalancing frequency vs transaction costs using 1-minute stock data",
    "Study on the Greeks under stochastic volatility: comparing model-implied Greeks to Black-Scholes Greeks for hedging effectiveness",
    "Academic paper on the pin risk phenomenon: gamma-induced hedging flows near expiry and their impact on underlying stock prices",
    "Research on rho sensitivity and interest rate risk in long-dated equity options: empirical evidence from LEAPS",
    "Paper on dealer delta-hedging flows and their feedback effects on intraday realized volatility using high-frequency data",
    "Empirical study on cross-gamma effects in multi-asset option portfolios and correlation hedging challenges",
    "Research on volga (vomma) hedging and the cost of convexity in implied volatility: evidence from SPX options",
  ]
};
