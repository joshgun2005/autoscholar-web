import { Radio } from "lucide-react";
import type { QuestionCategory } from "./types";

export const FUTURES_FX_HF: QuestionCategory = {
  category: "Futures & FX High-Frequency",
  icon: Radio,
  questions: [
    "Research paper on E-Mini S&P 500 (ES) 1-minute price dynamics: microstructure, volume patterns, and realized volatility",
    "Academic study on 1-minute lead-lag between ES and NQ futures: tech vs broad market information flow",
    "Paper on WTI crude oil (CL) futures 1-minute volatility around OPEC announcements and EIA inventory reports",
    "Empirical analysis of 1-minute FX carry trade unwind dynamics: speed and magnitude of JPY and CHF appreciation during risk-off events",
    "Research on gold futures (GC) 1-minute safe-haven response to geopolitical shocks and equity flash crashes",
    "Paper on the 1-minute basis between ETF (SPY) and futures (ES): arbitrage efficiency and convergence speed",
    "Study on 1-minute EUR/USD and GBP/USD co-movement around ECB and BoE meetings: FX triangle dynamics",
    "Academic paper on commodity futures roll dynamics at 1-minute frequency: front-month vs back-month spread behavior",
    "Research on 1-minute Treasury futures (ZN, ZB) response to yield curve inversions and recession signal events",
    "Paper on 1-minute FX volatility smile implied by options vs 1-minute realized volatility: the FX variance risk premium",
    "Empirical study on cross-listing effects: 1-minute price discovery between CME and ICE for overlapping contracts",
    "Research on 1-minute VIX futures and the volatility risk premium: realized vol of VIX vs implied vol of VIX futures",
  ]
};
