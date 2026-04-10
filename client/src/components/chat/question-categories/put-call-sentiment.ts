import { Scale } from "lucide-react";
import type { QuestionCategory } from "./types";

export const PUT_CALL_SENTIMENT: QuestionCategory = {
  category: "Put-Call Parity & Sentiment",
  icon: Scale,
  questions: [
    "Research paper on put-call ratio dynamics as a contrarian sentiment indicator: evidence from US equity options",
    "Academic study on deviations from put-call parity and their information content for short-sale constraints",
    "Paper on the CBOE equity put-call ratio and its predictive power for S&P 500 returns at various horizons",
    "Empirical analysis of option sentiment indicators (put-call volume, open interest ratios) vs survey-based measures",
    "Research on smart money vs dumb money in options: large vs small trades and their predictive asymmetry",
    "Paper on the put-call open interest ratio across the term structure: short-term vs long-term sentiment signals",
    "Study on options-implied sentiment measures and their correlation with VIX, credit spreads, and equity flows",
    "Academic paper on the synthetic lending rate implied by put-call parity violations and short-selling costs",
    "Research on fear-and-greed decomposition of option demand: institutional hedging vs speculative retail activity",
    "Paper on the informational efficiency of the options market: speed of information incorporation vs equity markets",
    "Empirical study on the relationship between option-implied skewness and future stock-level crash risk",
    "Research on the options volume surge phenomenon: what triggers unusual options activity and does it predict returns?",
  ]
};
