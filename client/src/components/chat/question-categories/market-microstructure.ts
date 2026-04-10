import { Zap } from "lucide-react";
import type { QuestionCategory } from "./types";

export const MARKET_MICROSTRUCTURE: QuestionCategory = {
  category: "Market Microstructure",
  icon: Zap,
  questions: [
    "Research paper on high-frequency trading and its impact on market quality and price discovery",
    "Academic study on bid-ask spread determinants and liquidity provision in equity markets",
    "Paper on order flow toxicity (VPIN) and its ability to predict flash crashes",
    "Empirical analysis of market maker behavior and inventory management in limit order books",
    "Research on price impact models: Kyle lambda estimation and optimal execution strategies",
    "Paper on dark pools vs lit exchanges: market fragmentation and its effects on price efficiency",
    "Study on intraday patterns in trading volume, volatility, and spreads across global markets",
    "Academic paper on information asymmetry and adverse selection in corporate bond markets",
    "Research on tick size changes and their effects on liquidity, volatility, and market quality",
    "Paper on algorithmic trading strategies and their impact on short-term price dynamics",
  ]
};
