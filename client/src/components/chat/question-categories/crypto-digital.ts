import { Bitcoin } from "lucide-react";
import type { QuestionCategory } from "./types";

export const CRYPTO_DIGITAL: QuestionCategory = {
  category: "Crypto & Digital Assets",
  icon: Bitcoin,
  questions: [
    "Research paper on Bitcoin price dynamics: volatility clustering, long memory, and regime changes",
    "Academic study on cryptocurrency market microstructure and price discovery across exchanges",
    "Paper on DeFi yield farming strategies: risk-return analysis and impermanent loss quantification",
    "Empirical analysis of cryptocurrency correlations with traditional asset classes over time",
    "Research on stablecoin mechanisms and their effectiveness in maintaining the peg under stress",
    "Paper on NFT market dynamics: price formation, bubbles, and liquidity analysis",
    "Study on central bank digital currencies (CBDCs) and their potential impact on monetary policy",
    "Academic paper on blockchain network analysis and on-chain metrics as predictors of crypto returns",
    "Research on regulatory events and cryptocurrency market reactions: an event study approach",
    "Paper on the Bitcoin halving effect on price and hash rate: empirical evidence across cycles",
  ]
};
