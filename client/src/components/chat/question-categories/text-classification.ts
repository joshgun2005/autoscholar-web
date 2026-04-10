import { TextSearch } from "lucide-react";
import type { QuestionCategory } from "./types";

export const TEXT_CLASSIFICATION: QuestionCategory = {
  category: "Financial Text Classification",
  icon: TextSearch,
  questions: [
    "Research paper on automated sector classification of companies using LLM analysis of business descriptions from 10-K filings",
    "Academic study on news event classification for trading signals: categorizing 100,000 financial headlines into actionable event types using multi-model AI",
    "Paper on regulatory document classification: using Claude to categorize SEC enforcement actions by violation type and severity",
    "Empirical analysis of earnings surprise direction prediction from earnings call tone classification across GPT, Gemini, and DeepSeek",
    "Research on multi-label classification of financial risk factors: extracting market, credit, operational, and liquidity risks from annual reports",
    "Paper on automated classification of monetary policy stance from central bank speeches using fine-grained NLP categories beyond hawk/dove",
    "Study on investor letter style classification: using LLMs to categorize hedge fund letters by investment philosophy and market outlook",
    "Academic paper on bankruptcy prediction from management discussion text: NLP classification features vs traditional financial ratios",
    "Research on patent classification for tech company competitive analysis: LLM-based categorization of patent abstracts into technology domains",
    "Paper on automated peer group identification using business description embeddings: NLP-based industry clustering vs SIC/NAICS codes",
  ]
};
