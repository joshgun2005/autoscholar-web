import { Bot } from "lucide-react";
import type { QuestionCategory } from "./types";

export const MULTI_MODEL_AI: QuestionCategory = {
  category: "Multi-Model AI Comparison",
  icon: Bot,
  questions: [
    "Research paper on LLM agreement rates for financial text classification: comparing 6 models (GPT, Gemini, DeepSeek, Mistral, Qwen, Claude) on 10K filings",
    "Academic study on model robustness in financial NER: extracting company names, tickers, and metrics across GPT-4o, Gemini Flash, and Claude Haiku",
    "Paper on the cost-accuracy frontier of LLMs for financial sentiment: budget models vs premium models on earnings call transcripts",
    "Empirical analysis of inter-model disagreement as an uncertainty signal: when LLMs disagree on sentiment, do markets move more?",
    "Research on prompt sensitivity in financial classification: how minor prompt variations affect GPT, Gemini, and DeepSeek outputs on credit ratings",
    "Paper on multi-model ensemble for financial text summarization: combining 5 LLMs for robust earnings call summaries",
    "Study on LLM-based ESG scoring: do GPT, Claude, and Gemini agree on corporate sustainability assessments from annual reports?",
    "Academic paper on zero-shot vs few-shot financial task performance: comparing 8 LLMs on sector classification, event detection, and tone analysis",
    "Research on hallucination rates in financial LLM outputs: quantifying factual accuracy across models for stock analysis tasks",
    "Paper on latency-accuracy tradeoffs for real-time financial NLP: budget models (Gemini Flash Lite, Qwen Flash) vs premium models in production",
  ]
};
