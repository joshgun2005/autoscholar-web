import { Sparkles } from "lucide-react";
import type { QuestionCategory } from "./types";

export const AI_MACRO_POLICY: QuestionCategory = {
  category: "AI for Macro & Policy Analysis",
  icon: Sparkles,
  questions: [
    "Research paper on GPT-powered Taylor Rule estimation: using LLMs to extract inflation expectations and output gap proxies from Fed communications",
    "Academic study on predicting IMF program outcomes using NLP analysis of Article IV consultation reports and program design documents",
    "Paper on AI-based fiscal policy analysis: classifying government budget documents across 50 countries using multi-model text analysis",
    "Empirical analysis of trade policy sentiment: using Claude batch_sentiment on 20,000 trade-related news articles and WTO dispute filings",
    "Research on central bank credibility measurement through NLP: tracking language consistency and forward guidance reliability across 10 central banks",
    "Paper on AI-assisted macro forecasting: using LLM text features from Beige Book and PMI reports to nowcast GDP growth",
    "Study on geopolitical risk quantification using multi-model NLP on UN Security Council transcripts and diplomatic communications",
    "Academic paper on automated analysis of World Bank and IMF development reports: extracting policy recommendations and tracking implementation",
    "Research on climate policy commitment analysis using NLP: comparing national climate pledges (NDCs) semantically across 190 countries",
    "Paper on labor market analysis through NLP: using AI to extract wage growth signals and hiring sentiment from 100,000 job postings",
  ]
};
