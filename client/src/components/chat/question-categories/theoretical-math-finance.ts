import { Sigma } from "lucide-react";
import type { QuestionCategory } from "./types";

export const THEORETICAL_MATH_FINANCE: QuestionCategory = {
  category: "Theoretical Mathematical Finance",
  icon: Sigma,
  questions: [
    "Theoretical paper on the fundamental theorem of asset pricing: no-arbitrage conditions, equivalent martingale measures, and market completeness",
    "Formal analysis of optimal stopping theory for American options: free boundary problems and variational inequalities",
    "Theoretical framework for stochastic portfolio theory: functionally generated portfolios, relative arbitrage, and diversity-weighted strategies",
    "Paper on the mathematical foundations of risk measures: coherence, convexity, and the axiomatic characterization of Expected Shortfall",
    "Theoretical analysis of mean-field games in financial markets: continuum of agents, Nash equilibrium, and systemic risk implications",
    "Formal model of backward stochastic differential equations (BSDEs) in derivative pricing: existence, uniqueness, and numerical methods",
    "Theoretical paper on optimal transport and its applications to model-free option pricing: Wasserstein distances and robust bounds",
    "Model of rough path theory applied to financial time series: signature-based methods and universal approximation for price processes",
    "Theoretical framework for McKean-Vlasov equations in interacting particle systems: applications to default clustering and systemic risk",
    "Paper on the mathematical theory of market microstructure: optimal execution, information asymmetry, and price formation in continuous time",
  ]
};
