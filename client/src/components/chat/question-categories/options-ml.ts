import { Brain } from "lucide-react";
import type { QuestionCategory } from "./types";

export const OPTIONS_ML: QuestionCategory = {
  category: "Options & Machine Learning",
  icon: Brain,
  questions: [
    "Research paper on neural network-based option pricing: deep learning vs Black-Scholes for out-of-sample pricing accuracy",
    "Academic study on using random forests to predict next-day implied volatility surface movements from features",
    "Paper on LSTM networks for modeling implied volatility surface dynamics and volatility forecasting",
    "Empirical analysis of machine learning approaches to delta-hedging: learning the optimal hedge ratio from data",
    "Research on autoencoders for dimensionality reduction of the implied volatility surface: latent factor extraction",
    "Paper on reinforcement learning for dynamic option hedging under transaction costs and discrete rebalancing",
    "Study on gradient boosting models for predicting option mispricing: feature engineering from Greeks and IV surface",
    "Academic paper on GANs for generating realistic implied volatility surfaces under no-arbitrage constraints",
    "Research on explainable AI for option pricing: SHAP-based interpretation of deep learning pricing models",
    "Paper on transformer models for learning cross-sectional option pricing patterns across 5,000 US equities",
    "Empirical study on ML-based volatility surface interpolation and extrapolation vs parametric models (SVI, SABR)",
    "Research on using option-implied features (IV, skew, put-call ratio) as ML inputs for equity return prediction",
  ]
};
