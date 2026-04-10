import { Languages } from "lucide-react";
import type { QuestionCategory } from "./types";

export const MULTI_SOURCE_FUSION: QuestionCategory = {
  category: "Multi-Source Data Fusion",
  icon: Languages,
  questions: [
    "Research paper on combining FRED macro data with NLP sentiment from FOMC minutes for enhanced recession probability forecasting",
    "Academic study on fusing high-frequency 1-minute equity data with daily option chain Greeks for improved realized volatility forecasting",
    "Paper on multi-source alpha generation: combining FMP fundamentals, EODHD intraday data, and Claude NLP features for stock selection",
    "Empirical analysis of cross-database validation: comparing IPO data from SDC Platinum (452K records) with FMP and EODHD sources",
    "Research on macro-finance linkages using World Bank, IMF, and OECD data: panel regression with 200+ countries and 16,000+ indicators",
    "Paper on combining academic literature embeddings with financial data: do papers about a sector predict sector returns?",
    "Study on real-time multi-source portfolio signals: integrating Polymarket event probabilities, Exa news search, and FMP fundamentals",
    "Academic paper on data quality assessment across financial APIs: comparing FMP, EODHD, FRED, and HF DuckDB for consistency and coverage",
    "Research on the information hierarchy across data frequencies: do 1-minute signals from hfdb improve daily models built on FMP/FRED data?",
    "Paper on building comprehensive country risk scores by fusing World Bank development indicators, IMF macro data, and NLP sentiment from news",
  ]
};
