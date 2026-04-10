import { Bitcoin } from "lucide-react";
import type { QuestionCategory } from "./types";

export const CRYPTO_HF: QuestionCategory = {
  category: "Crypto High-Frequency Analysis",
  icon: Bitcoin,
  questions: [
    "Research paper on Bitcoin 1-minute realized volatility dynamics: 24/7 markets vs traditional equity hours comparison",
    "Academic study on crypto market microstructure using 1-minute BTC and ETH data: bid-ask bounce and noise estimation",
    "Paper on intraday seasonality in cryptocurrency markets at 1-minute resolution: volume, volatility, and spread patterns across 74 tokens",
    "Empirical analysis of 1-minute lead-lag relationships between BTC, ETH, and altcoins: information flow hierarchy",
    "Research on crypto market efficiency at 1-minute frequency: testing the random walk hypothesis for 74 cryptocurrencies",
    "Paper on the weekend effect in crypto 1-minute data: volatility, liquidity, and return patterns on Saturday/Sunday vs weekdays",
    "Study on realized correlation dynamics between crypto and traditional assets using 1-minute data for BTC, SPY, and GLD",
    "Academic paper on crypto flash crashes at 1-minute resolution: frequency, severity, and recovery patterns 2013-2026",
    "Research on arbitrage opportunities across crypto pairs at 1-minute frequency: triangular arbitrage and statistical arbitrage bounds",
    "Paper on the funding rate effect on crypto spot prices: 1-minute event study around extreme funding rate events",
    "Empirical study on NFT announcement effects on token prices at 1-minute resolution: event-study with 1-minute crypto data",
    "Research on stablecoin depegging events analyzed at 1-minute frequency: speed of contagion to BTC and major altcoins",
  ]
};
