import { Cable } from "lucide-react";
import type { QuestionCategory } from "./types";

export const CROSS_ASSET_HF: QuestionCategory = {
  category: "Cross-Asset HF Correlations",
  icon: Cable,
  questions: [
    "Research paper on dynamic correlation estimation between stocks and bonds at 1-minute frequency using DCC and realized correlation",
    "Academic study on the Epps effect across asset classes: correlation decay from 1-minute to daily for equity, FX, futures, and crypto",
    "Paper on intraday lead-lag between currency pairs and equity indices using 1-minute FX and index data",
    "Empirical analysis of gold (futures) as an intraday safe haven: 1-minute correlation with equities during stress episodes",
    "Research on VIX futures and SPX 1-minute co-movement: asymmetric beta and instantaneous hedging effectiveness",
    "Paper on cross-asset contagion speed at 1-minute frequency: how fast do shocks propagate from FX to equities to commodities?",
    "Study on oil futures-equity sector correlations at 1-minute frequency: energy vs consumer vs transport sector sensitivity",
    "Academic paper on realized beta estimation using 1-minute data: stability and forecasting power vs daily beta for CAPM",
    "Research on intraday correlation breakdowns during flash events: 1-minute multi-asset analysis of correlation spikes",
    "Paper on term-structure futures (ZN, ZB) and equity index (ES, NQ) 1-minute lead-lag during FOMC surprise events",
    "Empirical study on crypto-equity 1-minute correlation regime shifts: when does Bitcoin behave like a risk-on vs risk-off asset?",
    "Research on 1-minute realized correlation matrices for 50 stocks: eigenvalue dynamics and random matrix theory tests",
  ]
};
