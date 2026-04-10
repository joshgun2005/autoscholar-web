import { Timer } from "lucide-react";
import type { QuestionCategory } from "./types";

export const REALIZED_VOLATILITY_HF: QuestionCategory = {
  category: "Realized Volatility & 1-Min Data",
  icon: Timer,
  questions: [
    "Research paper on realized volatility estimation from 1-minute stock data: comparing RV, bipower variation, and median RV across 7,000+ US equities",
    "Academic study on the HAR-RV model using 1-minute realized measures: forecasting daily, weekly, and monthly volatility for S&P 500 components",
    "Paper on optimal sampling frequency for realized volatility: bias-variance tradeoff between 1-minute and 5-minute data across asset classes",
    "Empirical analysis of the signature plot for 1-minute stock data: microstructure noise characterization across market cap quintiles",
    "Research on realized kernels and pre-averaging estimators applied to 1-minute equity data: noise-robust volatility estimation",
    "Paper on the realized volatility risk premium: comparing 1-minute RV to option-implied volatility across 4,000 US stocks with options data",
    "Study on intraday realized skewness and kurtosis from 1-minute bars: do higher-moment measures predict future returns?",
    "Academic paper on realized covariance estimation using 1-minute data for 50 large-cap stocks: refresh time vs Hayashi-Yoshida estimator",
    "Research on the continuous vs jump component decomposition of realized volatility using 1-minute S&P 500 constituent data",
    "Paper on rough volatility parameter estimation from 1-minute realized measures: testing the Hurst exponent across equity sectors",
    "Empirical study on overnight vs intraday realized volatility using 1-minute data: relative contributions to total risk for US stocks",
    "Research on realized semi-variance from 1-minute data: asymmetric volatility and its predictive content for equity returns",
  ]
};
