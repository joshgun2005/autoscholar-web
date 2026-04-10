import { LineChart } from "lucide-react";
import type { QuestionCategory } from "./types";

export const VOLATILITY_MODELING: QuestionCategory = {
  category: "Volatility Modeling",
  icon: LineChart,
  questions: [
    "Research paper on GARCH, EGARCH, and GJR-GARCH models for equity volatility forecasting with empirical comparison on S&P 500 data",
    "Academic study on realized volatility estimation using high-frequency intraday data and the HAR-RV model",
    "Paper on the leverage effect in stock returns: asymmetric volatility response to positive and negative shocks",
    "Empirical analysis of volatility clustering and long memory in financial time series using FIGARCH models",
    "Research on implied vs realized volatility spread as a predictor of future equity returns",
    "Study on multivariate volatility modeling with DCC-GARCH and its application to portfolio risk management",
    "Paper on regime-switching GARCH models for capturing structural breaks in volatility dynamics",
    "Academic paper on rough volatility models and their empirical performance vs classical stochastic volatility",
    "Research on intraday volatility patterns and the U-shape phenomenon across global equity markets",
    "Empirical study comparing parametric and non-parametric volatility forecasting methods",
  ]
};
