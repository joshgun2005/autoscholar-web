import { Orbit } from "lucide-react";
import type { QuestionCategory } from "./types";

export const ETF_HF_ARBITRAGE: QuestionCategory = {
  category: "ETF High-Frequency & Arbitrage",
  icon: Orbit,
  questions: [
    "Research paper on ETF-NAV premium/discount dynamics at 1-minute frequency: price efficiency of 5,000+ US ETFs",
    "Academic study on 1-minute lead-lag between sector ETFs (XLK, XLF, XLE) and their underlying stock baskets",
    "Paper on leveraged ETF tracking error at 1-minute frequency: intraday path-dependence and volatility drag quantification",
    "Empirical analysis of authorized participant arbitrage efficiency using 1-minute ETF and underlying basket data",
    "Research on 1-minute price discovery hierarchy: SPY vs ES futures vs individual S&P 500 stocks",
    "Paper on fixed income ETF (LQD, HYG, TLT) 1-minute microstructure: price discovery when underlying bonds trade infrequently",
    "Study on 1-minute international ETF (EEM, EFA, FXI) premium dynamics during non-overlapping market hours",
    "Academic paper on the creation-redemption mechanism efficiency: 1-minute ETF spreads around end-of-day basket pricing",
    "Research on thematic ETF (ARKK, KWEB) 1-minute volatility clustering and its relationship to narrative-driven flows",
    "Paper on 1-minute ETF volume concentration: how much of daily volume occurs in the first and last 30 minutes?",
    "Empirical study on cross-listed ETF arbitrage: 1-minute price discrepancies between US and non-US listed ETFs",
    "Research on commodity ETF (GLD, USO, SLV) vs futures 1-minute basis dynamics and roll-date effects",
  ]
};
