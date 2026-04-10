import { Shield } from "lucide-react";
import type { QuestionCategory } from "./types";

export const TAIL_RISK_OPTIONS: QuestionCategory = {
  category: "Tail Risk & Options",
  icon: Shield,
  questions: [
    "Research paper on tail risk hedging with deep out-of-the-money puts: cost, effectiveness, and optimal strike selection",
    "Academic study on the risk-neutral tail index estimation from option prices and its dynamics around crises",
    "Paper on crash-o-phobia: quantifying the demand for downside protection in index options markets",
    "Empirical analysis of the put protection cost (skew premium) and its variation across market regimes",
    "Research on the effectiveness of VIX call options vs SPX puts as tail risk hedges: cost-benefit analysis",
    "Paper on the correlation skew in index options and its implications for systemic risk measurement",
    "Study on black swan insurance: evaluating the long-term cost-drag of permanent tail hedging programs",
    "Academic paper on the left-tail risk factor extracted from option prices and its cross-sectional pricing power",
    "Research on tail risk contagion across asset classes using option-implied tail dependence measures",
    "Paper on the jump risk premium in equity options: separating diffusive and jump components of volatility",
    "Empirical study on how deep OTM put implied volatility anticipates extreme market events: a 15-year analysis",
    "Research on the term structure of tail risk: short-dated vs long-dated option-implied crash probabilities",
  ]
};
