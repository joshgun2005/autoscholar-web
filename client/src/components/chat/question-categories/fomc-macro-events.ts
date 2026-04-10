import { Radar } from "lucide-react";
import type { QuestionCategory } from "./types";

export const FOMC_MACRO_EVENTS: QuestionCategory = {
  category: "FOMC & Macro Events (1-Min)",
  icon: Radar,
  questions: [
    "Research paper on FOMC announcement impact at 1-minute resolution: S&P 500, Treasury futures, and FX response dynamics",
    "Academic study on the pre-FOMC drift at 1-minute frequency: testing the announcement premium hypothesis with 15 years of data",
    "Paper on 1-minute volatility signature around FOMC press conferences: equity, bond, and currency joint response analysis",
    "Empirical analysis of CPI and NFP surprise effects on 1-minute equity index and bond futures returns",
    "Research on intraday monetary policy transmission: 1-minute response of the yield curve (ZT, ZN, ZB futures) to Fed announcements",
    "Paper on FOMC dot-plot revision impact: 1-minute response of FX majors and cross-currency interest rate differentials",
    "Study on the information arrival process during Fed Chair press conferences: 1-minute volatility and volume clustering",
    "Academic paper on ECB vs Fed announcement effect comparison using 1-minute EUR/USD, DAX, and Treasury futures data",
    "Research on macro surprise asymmetry at 1-minute frequency: do markets react more to bad news than good news?",
    "Paper on Treasury auction results and 1-minute bond futures price impact: tail, bid-to-cover, and indirect bidder effects",
    "Empirical study on oil inventory announcement impact at 1-minute frequency on CL futures and energy sector ETFs",
    "Research on 1-minute cross-asset momentum after macro surprises: speed of information incorporation across 6 asset classes",
  ]
};
