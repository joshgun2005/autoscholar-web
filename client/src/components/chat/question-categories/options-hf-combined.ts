import { ScatterChart } from "lucide-react";
import type { QuestionCategory } from "./types";

export const OPTIONS_HF_COMBINED: QuestionCategory = {
  category: "Options + HF Data Combined",
  icon: ScatterChart,
  questions: [
    "Research paper combining 1-minute realized volatility with daily option-implied volatility: the variance risk premium at high-frequency resolution",
    "Academic study on option delta-hedging using 1-minute underlying data: how hedging frequency affects P&L variance and transaction costs",
    "Paper on realized-implied volatility gap dynamics: do stocks with high 1-minute RV-IV spreads earn abnormal future returns?",
    "Empirical analysis of option-implied vs 1-minute realized skewness: which better predicts future stock crash risk?",
    "Research on the term structure of the variance risk premium using 1-minute realized measures and option-implied volatility across maturities",
    "Paper on calibrating stochastic volatility models (Heston) using both 1-minute realized paths and option surface data simultaneously",
    "Study on the information content of 1-minute realized jumps for option pricing: do jump days coincide with IV surface shifts?",
    "Academic paper on intraday gamma exposure estimation using option chain data and 1-minute stock price movements",
    "Research on realized correlation vs implied correlation using 1-minute equity data and index option prices: the correlation risk premium",
    "Paper on hedging tail risk: combining deep OTM put options with 1-minute realized volatility triggers for dynamic allocation",
    "Empirical study on earnings straddle returns using 1-minute pre-earnings RV to predict post-earnings option payoffs",
    "Research on the cross-section of variance risk premiums: using 1-minute RV and option IV for 3,000+ stocks with active options",
  ]
};
