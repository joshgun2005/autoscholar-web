import { Fingerprint } from "lucide-react";
import type { QuestionCategory } from "./types";

export const ENTITY_EXTRACTION: QuestionCategory = {
  category: "NLP Entity Extraction & Knowledge Graphs",
  icon: Fingerprint,
  questions: [
    "Research paper on building financial knowledge graphs from SEC filings using Claude Haiku NER: extracting companies, executives, transactions, and relationships",
    "Academic study on supply chain network inference from earnings call transcripts using entity extraction and relationship classification",
    "Paper on automated M&A network analysis: extracting acquirer-target-advisor relationships from 10,000 deal announcements using NLP",
    "Empirical analysis of executive mobility networks built from NER on proxy statements: do connected boards lead to correlated stock returns?",
    "Research on regulatory entity extraction from central bank communications: mapping the web of financial institutions mentioned by the Fed",
    "Paper on keyword and keyphrase extraction from financial research: using Claude to build topic taxonomies from 1,000 academic papers",
    "Study on geopolitical entity networks from financial news: NLP extraction of country-company-commodity relationships during trade wars",
    "Academic paper on automated literature review using entity extraction: building citation-aware topic maps from OpenAlex abstracts and metadata",
    "Research on contract clause extraction from bond indentures using LLM NER: identifying covenants, triggers, and cross-default provisions",
    "Paper on ESG controversy detection: extracting environmental incidents, labor violations, and governance issues from 50,000 news articles",
  ]
};
