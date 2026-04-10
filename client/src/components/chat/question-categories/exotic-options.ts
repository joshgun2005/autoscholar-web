import { Layers } from "lucide-react";
import type { QuestionCategory } from "./types";

export const EXOTIC_OPTIONS: QuestionCategory = {
  category: "Exotic & Path-Dependent Options",
  icon: Layers,
  questions: [
    "Research paper on barrier option pricing and hedging: comparison of analytical vs Monte Carlo vs PDE methods",
    "Academic study on Asian option pricing and the impact of averaging frequency on valuation and hedge ratios",
    "Paper on lookback options and their relationship to realized volatility: pricing and empirical fit",
    "Empirical analysis of binary (digital) option pricing accuracy: Black-Scholes vs skew-adjusted models",
    "Research on cliquet and forward-start options: pricing under stochastic volatility and jumps",
    "Paper on autocallable structured products: pricing, Greeks, and the role of the volatility surface",
    "Study on variance and volatility swap pricing: model-free vs model-dependent approaches and basis risk",
    "Academic paper on target volatility options and their sensitivity to volatility-of-volatility",
    "Research on rainbow options and multi-asset derivatives: correlation risk and the implied correlation surface",
    "Paper on volatility derivatives and VIX futures options: pricing models and empirical fit analysis",
    "Empirical study on the corridor variance swap and its decomposition of the volatility smile information",
    "Research on power options and their applications in leveraged volatility exposure products",
  ]
};
