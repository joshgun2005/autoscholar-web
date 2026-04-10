import { Factory } from "lucide-react";
import type { QuestionCategory } from "./types";

export const OPTIONS_CORPORATE_EVENTS: QuestionCategory = {
  category: "Options & Corporate Events",
  icon: Factory,
  questions: [
    "Research paper on M&A option pricing: how target company implied volatility and skew behave post-announcement",
    "Academic study on option market anticipation of M&A activity: pre-deal unusual options activity analysis",
    "Paper on the behavior of implied volatility around stock splits and its implications for option holders",
    "Empirical analysis of dividend capture strategies using options: synthetic dividend positions and arbitrage bounds",
    "Research on spin-off and restructuring announcements: option-implied probability of deal completion",
    "Paper on the impact of share buyback announcements on the implied volatility surface and put-call ratios",
    "Study on option-implied takeover probabilities: extraction methods and accuracy using 15 years of M&A data",
    "Academic paper on how CEO turnover events affect the implied volatility term structure and skew",
    "Research on the effect of index additions and deletions on single-stock option implied volatility",
    "Paper on credit event pricing through equity options: Merton model calibration using option-implied parameters",
    "Empirical study on the impact of FDA approval/rejection decisions on biotech stock option surfaces",
    "Research on how activist investor 13D filings affect target stock option implied volatility and skew",
  ]
};
