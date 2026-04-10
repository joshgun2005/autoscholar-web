import { TrendingUp } from "lucide-react";
import type { QuestionCategory } from "./types";

export const OPTIONS_EARNINGS: QuestionCategory = {
  category: "Options & Earnings Events",
  icon: TrendingUp,
  questions: [
    "Research paper on implied volatility crush around earnings: quantifying the pre-event premium and post-event decay",
    "Academic study on the straddle return around earnings announcements: does the options market overestimate event risk?",
    "Paper on earnings surprise magnitude and post-earnings implied volatility dynamics across the option surface",
    "Empirical analysis of the implied-realized volatility gap around earnings: sector-level heterogeneity",
    "Research on pre-earnings skew steepening and its information content for earnings surprise direction",
    "Paper on the optimal timing for buying/selling volatility around earnings: DTE analysis with 15 years of data",
    "Study on post-earnings announcement drift in options markets: persistence of IV mispricing after surprises",
    "Academic paper on using option-implied distributions to forecast earnings surprise distributions",
    "Research on the correlation between earnings announcement clustering and cross-stock IV contagion effects",
    "Paper on hedging earnings risk with options: comparing straddles, strangles, and condors for cost efficiency",
    "Empirical study on LEAPS implied volatility term structure behavior around quarterly earnings cycles",
    "Research on the information content of pre-earnings unusual options activity for earnings surprise prediction",
  ]
};
