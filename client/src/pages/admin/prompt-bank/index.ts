/**
 * Admin Prompt Bank -- aggregates all category modules.
 * Each category file contains a PromptBankCategory with ~30 prompts.
 */

export type { PromptBankCategory } from "./types";

import { GARCH_VOLATILITY_PROMPTS } from "./garch-volatility";
import { STOCHASTIC_VOLATILITY_PROMPTS } from "./stochastic-volatility";
import { OPTIONS_DERIVATIVES_PROMPTS } from "./options-derivatives";
import { PORTFOLIO_OPTIMIZATION_PROMPTS } from "./portfolio-optimization";
import { FACTOR_INVESTING_PROMPTS } from "./factor-investing";
import { RISK_MANAGEMENT_PROMPTS } from "./risk-management";
import { CREDIT_RISK_PROMPTS } from "./credit-risk";
import { MARKET_MICROSTRUCTURE_PROMPTS } from "./market-microstructure";
import { FIXED_INCOME_PROMPTS } from "./fixed-income";
import { MACROECONOMICS_PROMPTS } from "./macroeconomics";
import { BEHAVIORAL_FINANCE_PROMPTS } from "./behavioral-finance";
import { ML_FINANCE_PROMPTS } from "./ml-finance";
import { NLP_TEXT_MINING_PROMPTS } from "./nlp-text-mining";
import { ESG_SUSTAINABLE_PROMPTS } from "./esg-sustainable";
import { CRYPTOCURRENCY_DEFI_PROMPTS } from "./cryptocurrency-defi";
import { ALGORITHMIC_TRADING_PROMPTS } from "./algorithmic-trading";
import { SYSTEMIC_RISK_PROMPTS } from "./systemic-risk";
import { REGIME_SWITCHING_PROMPTS } from "./regime-switching";
import { COPULA_MODELS_PROMPTS } from "./copula-models";
import { EXTREME_VALUE_THEORY_PROMPTS } from "./extreme-value-theory";
import { TIME_SERIES_ECONOMETRICS_PROMPTS } from "./time-series-econometrics";
import { PANEL_DATA_PROMPTS } from "./panel-data";
import { BAYESIAN_ECONOMETRICS_PROMPTS } from "./bayesian-econometrics";
import { WAVELETS_SPECTRAL_PROMPTS } from "./wavelets-spectral";
import { NETWORK_ANALYSIS_PROMPTS } from "./network-analysis";
import { MONTE_CARLO_PROMPTS } from "./monte-carlo";
import { INTEREST_RATE_MODELS_PROMPTS } from "./interest-rate-models";
import { FOREIGN_EXCHANGE_PROMPTS } from "./foreign-exchange";
import { COMMODITY_MARKETS_PROMPTS } from "./commodity-markets";
import { REAL_ESTATE_PROMPTS } from "./real-estate";
import { INSURANCE_ACTUARIAL_PROMPTS } from "./insurance-actuarial";
import { CORPORATE_FINANCE_PROMPTS } from "./corporate-finance";
import { BANKING_REGULATION_PROMPTS } from "./banking-regulation";
import { EMERGING_MARKETS_PROMPTS } from "./emerging-markets";
import { FINTECH_INNOVATION_PROMPTS } from "./fintech-innovation";
import { PENSION_RETIREMENT_PROMPTS } from "./pension-retirement";
import { PRIVATE_EQUITY_VC_PROMPTS } from "./private-equity-vc";
import { STRUCTURED_PRODUCTS_PROMPTS } from "./structured-products";
import { ENERGY_FINANCE_PROMPTS } from "./energy-finance";
import { CLIMATE_FINANCE_PROMPTS } from "./climate-finance";
import { ROBUST_STATISTICS_PROMPTS } from "./robust-statistics";
import { HIGH_DIMENSIONAL_PROMPTS } from "./high-dimensional";
import { QUANTITATIVE_RISK_METRICS_PROMPTS } from "./quantitative-risk-metrics";
import { MARKET_ANOMALIES_PROMPTS } from "./market-anomalies";
import { VOLATILITY_SURFACES_PROMPTS } from "./volatility-surfaces";
import { OPTIMAL_EXECUTION_PROMPTS } from "./optimal-execution";
import { SENTIMENT_ALTERNATIVE_DATA_PROMPTS } from "./sentiment-alternative-data";
import { GEOPOLITICAL_RISK_PROMPTS } from "./geopolitical-risk";
import { FINANCIAL_HISTORY_PROMPTS } from "./financial-history";
import { STATISTICAL_INFERENCE_PROMPTS } from "./statistical-inference";
import { ML_FOR_FINANCE_TYPED_PROMPTS } from "./ml-for-finance-typed";
import { DEEP_LEARNING_AI_PROMPTS } from "./deep-learning-ai";
import { APPLIED_STATISTICS_PROMPTS } from "./applied-statistics";
import { ML_SCIENCE_CROSS_DOMAIN_PROMPTS } from "./ml-science-cross-domain";
import { QUANTITATIVE_METHODS_MISC_PROMPTS } from "./quantitative-methods-misc";

import type { PromptBankCategory } from "./types";

export const ADMIN_PROMPT_BANK: PromptBankCategory[] = [
  GARCH_VOLATILITY_PROMPTS,
  STOCHASTIC_VOLATILITY_PROMPTS,
  OPTIONS_DERIVATIVES_PROMPTS,
  PORTFOLIO_OPTIMIZATION_PROMPTS,
  FACTOR_INVESTING_PROMPTS,
  RISK_MANAGEMENT_PROMPTS,
  CREDIT_RISK_PROMPTS,
  MARKET_MICROSTRUCTURE_PROMPTS,
  FIXED_INCOME_PROMPTS,
  MACROECONOMICS_PROMPTS,
  BEHAVIORAL_FINANCE_PROMPTS,
  ML_FINANCE_PROMPTS,
  NLP_TEXT_MINING_PROMPTS,
  ESG_SUSTAINABLE_PROMPTS,
  CRYPTOCURRENCY_DEFI_PROMPTS,
  ALGORITHMIC_TRADING_PROMPTS,
  SYSTEMIC_RISK_PROMPTS,
  REGIME_SWITCHING_PROMPTS,
  COPULA_MODELS_PROMPTS,
  EXTREME_VALUE_THEORY_PROMPTS,
  TIME_SERIES_ECONOMETRICS_PROMPTS,
  PANEL_DATA_PROMPTS,
  BAYESIAN_ECONOMETRICS_PROMPTS,
  WAVELETS_SPECTRAL_PROMPTS,
  NETWORK_ANALYSIS_PROMPTS,
  MONTE_CARLO_PROMPTS,
  INTEREST_RATE_MODELS_PROMPTS,
  FOREIGN_EXCHANGE_PROMPTS,
  COMMODITY_MARKETS_PROMPTS,
  REAL_ESTATE_PROMPTS,
  INSURANCE_ACTUARIAL_PROMPTS,
  CORPORATE_FINANCE_PROMPTS,
  BANKING_REGULATION_PROMPTS,
  EMERGING_MARKETS_PROMPTS,
  FINTECH_INNOVATION_PROMPTS,
  PENSION_RETIREMENT_PROMPTS,
  PRIVATE_EQUITY_VC_PROMPTS,
  STRUCTURED_PRODUCTS_PROMPTS,
  ENERGY_FINANCE_PROMPTS,
  CLIMATE_FINANCE_PROMPTS,
  ROBUST_STATISTICS_PROMPTS,
  HIGH_DIMENSIONAL_PROMPTS,
  QUANTITATIVE_RISK_METRICS_PROMPTS,
  MARKET_ANOMALIES_PROMPTS,
  VOLATILITY_SURFACES_PROMPTS,
  OPTIMAL_EXECUTION_PROMPTS,
  SENTIMENT_ALTERNATIVE_DATA_PROMPTS,
  GEOPOLITICAL_RISK_PROMPTS,
  FINANCIAL_HISTORY_PROMPTS,
  STATISTICAL_INFERENCE_PROMPTS,
  ML_FOR_FINANCE_TYPED_PROMPTS,
  DEEP_LEARNING_AI_PROMPTS,
  APPLIED_STATISTICS_PROMPTS,
  ML_SCIENCE_CROSS_DOMAIN_PROMPTS,
  QUANTITATIVE_METHODS_MISC_PROMPTS,
];

// -- Utilities --

export const TOTAL_PROMPT_COUNT = ADMIN_PROMPT_BANK.reduce((sum, c) => sum + c.prompts.length, 0);

export function getAllPromptsFlat(): { category: string; prompt: string }[] {
  return ADMIN_PROMPT_BANK.flatMap(c =>
    c.prompts.map(p => ({ category: c.category, prompt: p }))
  );
}

export function searchPrompts(query: string): { category: string; prompt: string }[] {
  const lower = query.toLowerCase();
  return getAllPromptsFlat().filter(
    p => p.prompt.toLowerCase().includes(lower) || p.category.toLowerCase().includes(lower)
  );
}

export function getRandomPrompt(): { category: string; prompt: string } {
  const all = getAllPromptsFlat();
  return all[Math.floor(Math.random() * all.length)];
}
