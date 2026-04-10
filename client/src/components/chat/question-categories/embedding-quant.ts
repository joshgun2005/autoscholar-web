import { Binary } from "lucide-react";
import type { QuestionCategory } from "./types";

export const EMBEDDING_QUANT: QuestionCategory = {
  category: "Embedding-Based Quant Strategies",
  icon: Binary,
  questions: [
    "Research paper on text-based industry momentum: using 10-K embedding similarity to define peer groups and trade semantic momentum signals",
    "Academic study on earnings call embedding drift as an alpha signal: stocks whose call language shifts most earn abnormal returns",
    "Paper on semantic risk factor extraction: using autoencoders on 10-K embeddings to discover latent risk factors beyond Fama-French",
    "Empirical analysis of analyst report embedding consensus: when report embeddings cluster tightly, does price discovery improve?",
    "Research on cross-sectional return prediction using combined embedding features from filings, news, and analyst reports for 3,000 stocks",
    "Paper on ESG-momentum interaction: using embedding similarity to identify ESG leaders/laggards and test momentum strategy performance",
    "Study on patent embedding similarity as an innovation premium proxy: do firms with unique patent language earn higher risk-adjusted returns?",
    "Academic paper on market regime detection from news embeddings: clustering daily news corpora to identify risk-on vs risk-off regimes",
    "Research on conference call embedding-based earnings surprise prediction: using semantic change detection between consecutive quarters",
    "Paper on text-based asset allocation: constructing portfolios weighted by embedding-derived thematic exposure scores across 500 stocks",
  ]
};
