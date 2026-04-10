import { Flame } from "lucide-react";
import type { QuestionCategory } from "./types";

export const VOL_TERM_STRUCTURE: QuestionCategory = {
  category: "Volatility Term Structure & VIX",
  icon: Flame,
  questions: [
    "Research paper on the VIX futures term structure: contango, backwardation, and roll yield as a return predictor",
    "Academic study on the variance risk premium estimation using options data and its predictive power for equity returns",
    "Paper on the VIX-of-VIX (VVIX) and its information content for volatility-of-volatility risk pricing",
    "Empirical analysis of the relationship between implied volatility term structure slope and future realized volatility",
    "Research on the volatility term structure inversion as an early warning signal for equity market stress",
    "Paper on the VIX term structure and S&P 500 return predictability at daily, weekly, and monthly horizons",
    "Study on the dynamics of short-term vs long-term implied volatility during FOMC meetings and macro releases",
    "Academic paper on the constant maturity volatility surface construction and its applications in risk management",
    "Research on the correlation between the VIX term structure shape and credit spread dynamics",
    "Paper on the information content of the SPX 0DTE options explosion for realized volatility and term structure",
    "Empirical study on vol-of-vol risk premium: extracting and pricing higher-order volatility risk from option data",
    "Research on the weekday effect in implied volatility term structure: Friday vs Monday option pricing patterns",
  ]
};
