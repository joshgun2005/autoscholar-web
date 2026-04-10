/**
 * Domain and method definitions for the AutoPaper prompt bank.
 */

export const DOMAINS = [
  "Market microstructure & high-frequency trading",
  "Volatility & risk modeling",
  "Asset allocation & portfolio theory",
  "Machine learning applied to finance",
  "Macro-finance & interest rates",
  "Crypto-assets & decentralized finance",
  "ESG, sustainable finance & climate risk",
  "Market anomalies & factor investing",
  "Applied financial econometrics",
  "Systemic risk & contagion",
  "Behavioral finance & market sentiment",
  "Derivatives, options & structured products",
  "Credit, default & ratings",
  "Monetary policy & market transmission",
  "Banking microeconomics & regulation",
  "Commodity & energy markets",
  "Emerging & frontier markets",
  "Fintech, payments & financial innovation",
  // Stats / ML / AI domains
  "Statistical inference & hypothesis testing",
  "Machine learning for prediction",
  "Deep learning & neural networks",
  "Applied statistics & experimental design",
  "Supervised & unsupervised learning",
  "AI for scientific discovery",
] as const;

export const METHODS = [
  "GARCH / EGARCH / GJR-GARCH",                   // 0
  "Structural VAR",                                 // 1
  "Factor models",                                  // 2
  "Dynamic copulas",                                // 3
  "DCC-GARCH",                                      // 4
  "Regime-switching (Markov)",                       // 5
  "Local projections",                               // 6
  "Event study",                                     // 7
  "Dynamic panel (GMM)",                             // 8
  "Machine learning (Random Forest, XGBoost)",       // 9
  "Neural networks (LSTM, Transformer)",             // 10
  "NLP & text analysis",                             // 11
  "Stochastic volatility models",                    // 12
  "Wavelet approach",                                // 13
  "Bootstrap & robust inference",                    // 14
  "Threshold models (STAR, TAR)",                    // 15
  "Network analysis & graph theory",                 // 16
  "Affine term structure models",                    // 17
  // Stats / ML / AI methods
  "Hypothesis testing (t-test, ANOVA, chi-square)",  // 18
  "Random Forest / Gradient Boosting (XGBoost)",     // 19
  "Neural networks (MLP, LSTM, Transformer)",        // 20
  "Bayesian inference (MCMC, Bayes factors)",        // 21
  "Cross-validation & hyperparameter tuning",        // 22
  "Clustering (K-Means, DBSCAN, GMM)",               // 23
] as const;

/**
 * Maps each domain index to compatible method indices.
 * Avoids nonsensical pairings (e.g. affine term structure for NLP).
 */
export const DOMAIN_METHOD_COMPAT: Record<number, number[]> = {
  0:  [0, 4, 5, 9, 10, 14, 15],     // Microstructure & HFT
  1:  [0, 3, 4, 5, 12, 13, 14, 15], // Volatility & Risk
  2:  [2, 3, 5, 9, 10, 14],         // Asset Allocation & Portfolio
  3:  [9, 10, 11, 14],              // ML in Finance
  4:  [1, 5, 6, 7, 17],            // Macro-Finance & Interest Rates
  5:  [0, 4, 5, 9, 10, 13, 16],    // Crypto & DeFi
  6:  [2, 7, 8, 9, 11],            // ESG & Sustainable Finance
  7:  [2, 7, 8, 9, 14],            // Market Anomalies & Factor Investing
  8:  [0, 1, 2, 5, 8, 14, 15],     // Applied Financial Econometrics
  9:  [3, 4, 5, 14, 16],           // Systemic Risk & Contagion
  10: [7, 8, 9, 11],               // Behavioral Finance & Sentiment
  11: [0, 5, 12, 13, 14],          // Derivatives, Options & Structured Products
  12: [2, 5, 8, 9, 17],            // Credit, Default & Ratings
  13: [1, 5, 6, 7, 17],            // Monetary Policy & Transmission
  14: [2, 7, 8, 9, 16],            // Banking & Regulation
  15: [0, 3, 5, 13, 15],           // Commodity & Energy Markets
  16: [0, 1, 4, 5, 8],             // Emerging & Frontier Markets
  17: [7, 8, 9, 11, 16],           // Fintech & Innovation
  // Stats / ML / AI domain-method compat
  18: [14, 18, 21],                // Statistical inference
  19: [9, 19, 22],                 // ML for prediction
  20: [10, 20, 22],                // Deep learning
  21: [14, 18, 21],                // Applied statistics
  22: [9, 19, 22, 23],             // Supervised/unsupervised
  23: [10, 11, 19, 20, 23],        // AI for science
};
