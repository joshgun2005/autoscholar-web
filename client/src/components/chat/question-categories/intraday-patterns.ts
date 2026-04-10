import { AudioWaveform } from "lucide-react";
import type { QuestionCategory } from "./types";

export const INTRADAY_PATTERNS: QuestionCategory = {
  category: "Intraday Patterns & Seasonality",
  icon: AudioWaveform,
  questions: [
    "Research paper on hour-of-day return patterns in US equities using 1-minute data: the overnight gap, opening rush, and power hour",
    "Academic study on day-of-week effects at intraday frequency: Monday vs Friday 1-minute volume and volatility patterns",
    "Paper on the lunch-hour liquidity drought: 1-minute spread widening and volume collapse analysis for S&P 500 stocks",
    "Empirical analysis of triple witching expiration effects at 1-minute frequency: volume, volatility, and price impact",
    "Research on end-of-month and end-of-quarter rebalancing flows detected in 1-minute equity and futures data",
    "Paper on the January effect at intraday frequency: does the small-cap premium concentrate in specific hours?",
    "Study on 1-minute volume clock vs calendar clock: comparing volatility estimation under business time vs wall clock time",
    "Academic paper on pre-market and after-hours 1-minute trading: price discovery, spreads, and information content vs regular hours",
    "Research on index rebalancing day intraday effects: 1-minute price impact analysis for stocks added/removed from S&P 500",
    "Paper on the turn-of-month effect in 1-minute equity data: institutional flow patterns and return concentration",
    "Empirical study on holiday-adjacent trading days: 1-minute volume and volatility anomalies around US market holidays",
    "Research on the first 15 minutes and last 15 minutes of trading: 1-minute return predictability and volume concentration",
  ]
};
