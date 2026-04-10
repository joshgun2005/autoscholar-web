import { Database } from "lucide-react";
import type { QuestionCategory } from "./types";

export const ECONOMETRICS: QuestionCategory = {
  category: "Econometrics & Time Series",
  icon: Database,
  questions: [
    "Research paper on cointegration and error correction models for long-run equilibrium in financial series",
    "Academic study on structural break detection in financial time series using Bai-Perron tests",
    "Paper on panel data methods in empirical finance: fixed effects, random effects, and GMM estimation",
    "Empirical analysis of Granger causality networks in international stock markets",
    "Research on quantile regression applications in financial risk analysis and tail dependence",
    "Paper on Bayesian econometrics for asset pricing: prior specification and posterior inference",
    "Study on wavelet decomposition of financial time series and multi-scale correlation analysis",
    "Academic paper on threshold models (SETAR, STAR) for nonlinear dynamics in exchange rates",
    "Research on mixed-frequency data models (MIDAS) for nowcasting GDP using financial indicators",
    "Paper on bootstrap methods for hypothesis testing in financial econometrics with dependent data",
  ]
};
