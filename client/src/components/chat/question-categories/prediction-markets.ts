import { Radar } from "lucide-react";
import type { QuestionCategory } from "./types";

export const PREDICTION_MARKETS: QuestionCategory = {
  category: "Prediction Markets & Alternative Data",
  icon: Radar,
  questions: [
    "Research paper on Polymarket prediction accuracy vs traditional forecasting models for macroeconomic events and Fed rate decisions",
    "Academic study on prediction market implied probabilities and their information content for equity option pricing around elections",
    "Paper on combining Polymarket event probabilities with financial data for event-driven trading strategies: calibration and backtesting",
    "Empirical analysis of prediction market efficiency: comparing Polymarket pricing speed to options-implied probabilities for binary events",
    "Research on alternative data from web scraping: using Firecrawl to build custom ESG datasets from corporate sustainability pages",
    "Paper on satellite data proxies from web sources: constructing economic activity indicators using web_dataset_collector for emerging markets",
    "Study on prediction market microstructure: order book dynamics, spread determinants, and informed trading on Polymarket",
    "Academic paper on the calibration of prediction market probabilities: do Polymarket prices represent true probabilities or risk-neutral prices?",
    "Research on cross-market information flow: do Polymarket odds Granger-cause moves in equity options and credit markets?",
    "Paper on building custom alternative datasets using web scraping: job postings, shipping data, and app downloads as economic indicators",
  ]
};
