import { Newspaper } from "lucide-react";
import type { QuestionCategory } from "./types";

export const FINANCIAL_NEWS_NLP: QuestionCategory = {
  category: "Financial News & Media NLP",
  icon: Newspaper,
  questions: [
    "Research paper on real-time financial news sentiment and intraday equity returns: using Tavily + Claude Haiku for live sentiment scoring",
    "Academic study on media bias in financial reporting: comparing sentiment of the same earnings event across 10 news sources using multi-model NLP",
    "Paper on fake financial news detection: using embedding similarity and multi-LLM classification to identify misleading market narratives",
    "Empirical analysis of news sentiment propagation speed: how fast does negative sentiment spread across related stocks using real-time web data?",
    "Research on analyst vs media sentiment divergence: when NLP sentiment from analyst reports disagrees with news sentiment, who is right?",
    "Paper on social media sentiment for crypto markets: using Exa semantic search + Claude sentiment on Reddit and Twitter for BTC return prediction",
    "Study on M&A rumor detection from financial news using NLP: extracting deal signals before official announcements from web scraping",
    "Academic paper on central bank communication media coverage: how financial journalists interpret and amplify Fed statements using NLP analysis",
    "Research on commodity market sentiment from web datasets: scraping and analyzing shipping reports, crop reports, and energy commentary",
    "Paper on IPO media sentiment and first-day returns: NLP analysis of pre-IPO coverage from financial news using web_dataset_collector",
  ]
};
