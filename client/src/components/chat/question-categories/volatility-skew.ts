import { Gauge } from "lucide-react";
import type { QuestionCategory } from "./types";

export const VOLATILITY_SKEW: QuestionCategory = {
  category: "Volatility Skew & Smile Dynamics",
  icon: Gauge,
  questions: [
    "Research paper on the leverage effect and its role in generating the equity volatility skew: theory vs empirical evidence",
    "Academic study on the evolution of the volatility skew slope over market cycles: pre-crisis, crisis, and recovery phases",
    "Paper on put skew as a measure of crash risk: cross-sectional predictability for individual stock returns",
    "Empirical analysis of the risk-reversal (25-delta call IV minus put IV) and its forecasting power for equity returns",
    "Research on the butterfly spread and kurtosis premium embedded in option prices across maturities",
    "Paper on comparing equity vs commodity vs FX volatility smile shapes: structural drivers and stylized facts",
    "Study on the earnings announcement volatility smile: how skew and kurtosis change around scheduled events",
    "Academic paper on the skew stickiness ratio (SSR) and regime-dependent smile dynamics in equity index options",
    "Research on volatility smile arbitrage: detecting and exploiting mispriced wings in the options surface",
    "Paper on the time decay of the volatility skew: does skew flatten as expiry approaches and why?",
    "Empirical study on sector-level volatility skew differences and what they reveal about tail risk perceptions",
    "Research on the correlation between VIX level and SPX skew steepness: a 15-year empirical analysis",
  ]
};
