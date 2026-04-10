import { Brain } from "lucide-react";
import type { QuestionCategory } from "./types";

export const QUANTITATIVE_FINANCE: QuestionCategory = {
  category: "Quantitative Finance",
  icon: Brain,
  questions: [
    "Research paper on Monte Carlo simulation methods for complex derivative pricing with variance reduction",
    "Academic study on copula models for multivariate financial risk: tail dependence and portfolio VaR",
    "Paper on martingale pricing theory and risk-neutral valuation in incomplete markets",
    "Empirical analysis of Levy process models for asset returns: NIG, VG, and CGMY distributions",
    "Research on optimal stopping problems and their applications in American option pricing",
    "Paper on stochastic control and dynamic programming for optimal investment-consumption problems",
    "Study on numerical methods for solving Black-Scholes PDE: finite differences and spectral methods",
    "Academic paper on calibration of multi-factor interest rate models to market data",
    "Research on fractional Brownian motion models and long-range dependence in financial markets",
    "Paper on model-free implied volatility and the VIX calculation methodology",
  ]
};
