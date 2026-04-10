import { TrendingDown } from "lucide-react";
import type { QuestionCategory } from "./types";

export const RISK_MANAGEMENT: QuestionCategory = {
  category: "Risk Management",
  icon: TrendingDown,
  questions: [
    "Academic paper on Value-at-Risk and Expected Shortfall: parametric vs historical vs Monte Carlo approaches",
    "Study on systemic risk and financial contagion among European banking sectors using network analysis",
    "Research on credit scoring with machine learning: Random Forest vs Logistic Regression vs XGBoost",
    "Empirical analysis of tail risks and extreme events in financial markets using EVT",
    "Paper on liquidity risk measurement and its impact on asset pricing in equity markets",
    "Academic study on stress testing methodologies for banking portfolios under adverse macroeconomic scenarios",
    "Research on counterparty credit risk and CVA calculation for OTC derivatives portfolios",
    "Paper on operational risk modeling using loss distribution approach and scenario analysis",
    "Study on model risk in VaR estimation: backtesting and regulatory implications under Basel III/IV",
    "Empirical research on the term structure of credit default swap spreads and default probability estimation",
  ]
};
