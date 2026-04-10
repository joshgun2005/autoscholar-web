import { MessageSquare } from "lucide-react";
import type { QuestionCategory } from "./types";

export const NLP_SENTIMENT: QuestionCategory = {
  category: "NLP & Financial Sentiment",
  icon: MessageSquare,
  questions: [
    "Research paper on FOMC minutes sentiment analysis using Claude Haiku: quantifying hawkish vs dovish tone shifts and their impact on Treasury yields",
    "Academic study on multi-model sentiment robustness: comparing GPT-4o, Gemini, DeepSeek, and Mistral on 10,000 earnings call excerpts",
    "Paper on NLP-based credit risk assessment: using Claude to extract risk signals from 10-K filings and their predictive power for CDS spreads",
    "Empirical analysis of financial news sentiment using batch_sentiment across 50,000 headlines: lead-lag with equity market returns",
    "Research on central bank communication complexity: readability scores and NLP sentiment of Fed, ECB, and BoJ statements over 20 years",
    "Paper on analyst report sentiment extraction using Claude Haiku and its incremental information beyond earnings surprises",
    "Study on real-time crypto sentiment from social media using multi-model NLP: correlation with 1-minute BTC price movements",
    "Academic paper on ESG narrative analysis: NLP sentiment scoring of sustainability reports vs actual ESG performance metrics",
    "Research on earnings call Q&A session sentiment asymmetry: comparing management prepared remarks vs analyst question responses",
    "Paper on sovereign risk sentiment: NLP analysis of IMF Article IV consultations and their predictive power for sovereign spreads",
  ]
};
