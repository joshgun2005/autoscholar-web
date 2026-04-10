import { ScanLine } from "lucide-react";
import type { QuestionCategory } from "./types";

export const INTRADAY_MICROSTRUCTURE: QuestionCategory = {
  category: "Intraday Microstructure (1-Min)",
  icon: ScanLine,
  questions: [
    "Research paper on the intraday U-shape pattern in 1-minute volatility across 7,789 US stocks: universality and sector-level deviations",
    "Academic study on 1-minute bid-ask bounce effects and the Amihud illiquidity measure at ultra-high frequency",
    "Paper on price impact estimation using 1-minute stock data: Kyle's lambda across market cap deciles and time periods",
    "Empirical analysis of 1-minute volume-weighted price dynamics around NYSE and NASDAQ open/close auctions",
    "Research on the Epps effect at 1-minute frequency: how sampling interval distorts cross-asset correlations for equity pairs",
    "Paper on 1-minute lead-lag relationships between ETFs and their underlying stocks: price discovery speed analysis",
    "Study on intraday momentum at 1-minute frequency: the first-half-hour return predicting last-half-hour return in US equities",
    "Academic paper on market order flow imbalance at 1-minute resolution and its contemporaneous and predictive price impact",
    "Research on flash crash detection and microstructure fragility using 1-minute stock data: identifying 1,000+ mini flash crashes",
    "Paper on the opening and closing auction microstructure: 1-minute price formation analysis for S&P 500 constituents",
    "Empirical study on 1-minute realized spreads and price efficiency: how quickly do prices incorporate information across market caps?",
    "Research on cross-stock momentum contagion at 1-minute frequency: do sector peers co-move within trading hours?",
  ]
};
