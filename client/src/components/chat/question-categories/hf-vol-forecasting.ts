import { Waves } from "lucide-react";
import type { QuestionCategory } from "./types";

export const HF_VOL_FORECASTING: QuestionCategory = {
  category: "HF Volatility Forecasting",
  icon: Waves,
  questions: [
    "Research paper on HAR-RV-CJ model with 1-minute realized measures: separating continuous and jump components for volatility forecasting",
    "Academic study on LSTM neural networks vs HAR model for 1-minute realized volatility forecasting: 7,000+ stock comparison",
    "Paper on the Heterogeneous Market Hypothesis applied to 1-minute realized volatility: multi-scale decomposition and forecasting",
    "Empirical analysis of realized GARCH models using 1-minute data: combining returns and realized measures for daily volatility prediction",
    "Research on intraday volatility forecasting using 1-minute data: can the first hour predict the remaining session?",
    "Paper on cross-sectional momentum in realized volatility: building volatility-sorted portfolios using 1-minute RV estimates",
    "Study on the information content of 1-minute vs 5-minute realized measures for option pricing: which sampling frequency improves IV forecasts?",
    "Academic paper on realized volatility spillovers using 1-minute data: Diebold-Yilmaz connectedness across 50 large-cap stocks",
    "Research on random forest and XGBoost for 1-minute realized volatility features: predicting next-day stock returns",
    "Paper on volatility-of-volatility estimation using 1-minute realized quarticity: pricing implications for variance swaps",
    "Empirical study on the forecasting power of 1-minute realized range (high-low) vs realized variance for 5,000 US equities",
    "Research on high-frequency MIDAS regression: using 1-minute realized measures to nowcast quarterly GDP growth",
  ]
};
