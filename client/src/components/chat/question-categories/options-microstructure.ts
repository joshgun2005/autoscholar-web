import { Zap } from "lucide-react";
import type { QuestionCategory } from "./types";

export const OPTIONS_MICROSTRUCTURE: QuestionCategory = {
  category: "Options Market Microstructure",
  icon: Zap,
  questions: [
    "Research paper on bid-ask spreads in equity options: determinants across moneyness, maturity, and underlying liquidity",
    "Empirical study on options market maker inventory management and its impact on implied volatility dynamics",
    "Paper on price discovery between options and equity markets: which leads during information events?",
    "Academic study on informed trading in the options market: detecting unusual option activity before earnings announcements",
    "Research on the information content of option order flow imbalances for predicting short-term stock returns",
    "Paper on the impact of options market fragmentation on execution quality and implied volatility convergence",
    "Study on the role of high-frequency traders in equity options market making and their effect on spreads",
    "Academic paper on the put-call parity deviation dynamics and transaction cost bounds in US equity options",
    "Research on option volume-return relationships: do unusual call or put volumes predict next-day stock returns?",
    "Paper on the information content of the options open interest distribution across strikes and maturities",
    "Empirical analysis of options market quality around stock splits, dividends, and corporate actions",
    "Study on cross-listed options and ETF options: price efficiency and arbitrage opportunities across venues",
  ]
};
