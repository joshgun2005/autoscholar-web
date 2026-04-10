import { Network } from "lucide-react";
import type { QuestionCategory } from "./types";

export const TEXT_EMBEDDINGS: QuestionCategory = {
  category: "Text Embeddings & Semantic Analysis",
  icon: Network,
  questions: [
    "Research paper on academic literature mapping using text-embedding-3-large: clustering 500+ papers on volatility modeling into thematic sub-fields",
    "Academic study on semantic similarity of FOMC statements: embedding-based analysis of policy language evolution from 2000 to 2025",
    "Paper on duplicate detection in financial research: using cosine similarity on abstracts to identify overlapping studies across 10,000 papers",
    "Empirical analysis of embedding-based topic discovery in 10-K filings: unsupervised clustering reveals hidden risk factors across S&P 500 firms",
    "Research on semantic search for financial regulation: using embeddings to find relevant SEC rules and precedents from natural language queries",
    "Paper on cross-lingual financial text similarity: comparing BGE-M3 vs text-embedding-3 for matching English and non-English research papers",
    "Study on earnings call semantic drift: do companies whose language embeddings shift dramatically quarter-over-quarter have higher volatility?",
    "Academic paper on embedding-based patent similarity for tech company valuation: measuring innovation overlap using 14 embedding models",
    "Research on semantic clustering of sell-side analyst reports: identifying consensus narratives vs contrarian views using K-Means on embeddings",
    "Paper on the information content of embedding distance: do stocks with semantically similar 10-K filings co-move more in returns?",
  ]
};
