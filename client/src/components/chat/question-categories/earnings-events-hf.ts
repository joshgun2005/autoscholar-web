import { Bolt } from "lucide-react";
import type { QuestionCategory } from "./types";

export const EARNINGS_EVENTS_HF: QuestionCategory = {
  category: "Earnings & Events (1-Min)",
  icon: Bolt,
  questions: [
    "Research paper on 1-minute price reaction to earnings announcements: measuring information incorporation speed for 7,000+ US stocks",
    "Academic study on post-earnings announcement drift at 1-minute frequency: how quickly does the drift begin and for how long?",
    "Paper on 1-minute volume and volatility patterns around earnings calls: pre-release positioning vs post-release adjustment",
    "Empirical analysis of sector contagion at 1-minute frequency: does a major earnings miss by a sector leader move all peers?",
    "Research on 1-minute realized skewness around earnings surprises: asymmetric price jump distributions for beats vs misses",
    "Paper on the speed of analyst revision incorporation: 1-minute stock price response to rating changes and price target updates",
    "Study on 1-minute price dynamics around CEO stock sales and insider trading 13F filings",
    "Academic paper on index inclusion/exclusion announcement effects at 1-minute frequency: price and volume event study",
    "Research on 1-minute cross-stock earnings momentum: do same-industry stocks move in the minutes after a peer's earnings release?",
    "Paper on dividend ex-date 1-minute price adjustment: market efficiency test using 1-minute data for dividend-paying stocks",
    "Empirical study on M&A announcement 1-minute dynamics: target and acquirer stock reaction speed and spread convergence",
    "Research on FDA drug approval/rejection 1-minute biotech stock response: jump magnitude and recovery patterns",
  ]
};
