import { Calculator } from "lucide-react";
import type { QuestionCategory } from "./types";

export const DERIVATIVES_OPTIONS: QuestionCategory = {
  category: "Derivatives & Options Pricing",
  icon: Calculator,
  questions: [
    "Academic paper on the implied volatility surface and volatility smile: models and empirical evidence",
    "Study on exotic option pricing via Monte Carlo simulation with variance reduction techniques",
    "Research on Greeks and dynamic delta-gamma hedging on S&P 500 options market data",
    "Paper on stochastic volatility models (Heston): calibration, performance, and empirical fit",
    "Academic study on counterparty risk and credit derivatives (CDS) valuation frameworks",
    "Research on local volatility models (Dupire) vs stochastic volatility for equity derivatives pricing",
    "Paper on American option pricing using least-squares Monte Carlo (Longstaff-Schwartz) method",
    "Empirical study on the VIX term structure and its information content for future market returns",
    "Research on jump-diffusion models (Merton, Kou) for option pricing with discontinuous price dynamics",
    "Paper on variance swaps and volatility derivatives: pricing, hedging, and market microstructure",
    "Research on SABR model calibration for interest rate swaptions and its stability across market regimes",
    "Empirical comparison of Bates vs Heston vs SVJ models for equity option pricing using daily chain data",
    "Paper on rough volatility models (rBergomi) and their fit to SPX option surfaces vs classical models",
    "Study on the pricing kernel puzzle: non-monotonicity of the empirical pricing kernel from option data",
    "Academic paper on model-free bounds for option prices and their tightness across strike ranges",
  ]
};
