import {
  Search, Database, Layers, BarChart3, BrainCircuit, Shield,
} from "lucide-react";

// ─── Agent pipeline definitions ──────────────────────────

export const PIPELINE = [
  { name: "Gauss", role: "Gap Discovery", icon: Search, color: "from-violet-500 to-purple-600", bg: "bg-violet-500/10", text: "text-violet-600 dark:text-violet-400", border: "border-violet-500/20", desc: "Scans 200M+ academic papers to identify unexplored research gaps with citation network analysis", step: "01" },
  { name: "Turing", role: "Data Collection", icon: Database, color: "from-blue-500 to-cyan-500", bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400", border: "border-blue-500/20", desc: "Collects real financial & macroeconomic datasets from 12+ institutional APIs", step: "02" },
  { name: "Newton", role: "Data Preparation", icon: Layers, color: "from-amber-500 to-orange-500", bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", border: "border-amber-500/20", desc: "Cleans, merges, and transforms raw data into analysis-ready panel datasets", step: "03" },
  { name: "Fisher", role: "Empirical Analysis", icon: BarChart3, color: "from-emerald-500 to-teal-500", bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-500/20", desc: "Runs econometric models, robustness checks, and generates publication-quality figures", step: "04" },
  { name: "Euler", role: "Paper Writing", icon: BrainCircuit, color: "from-rose-500 to-pink-600", bg: "bg-rose-500/10", text: "text-rose-600 dark:text-rose-400", border: "border-rose-500/20", desc: "Writes every section and compiles LaTeX to a 60–90 page publication-grade PDF", step: "05" },
  { name: "Popper", role: "Peer Validation", icon: Shield, color: "from-indigo-500 to-blue-600", bg: "bg-indigo-500/10", text: "text-indigo-600 dark:text-indigo-400", border: "border-indigo-500/20", desc: "AI peer review across 6 dimensions — publish or reject with scored evaluation", step: "06" },
];

// ─── Stats interface ─────────────────────────────────────

export interface JournalStats {
  totalPapers: number;
  totalRuns: number;
  publishedRuns: number;
  rejectedRuns: number;
  avgPeerReviewScore: number;
  uniqueDomains: number;
  acceptanceRate: number;
}

export interface PublishedPaper {
  id: string;
  asid: string | null;
  title: string;
  abstract: string | null;
  authors: string | null;
  keywords: string | null;
  domain: string | null;
  wordCount: number | null;
  figureCount: number | null;
  authorName: string | null;
  publishedAt: string;
}

export interface CostStats {
  totalCost: number;
  publishedPapers: number;
  costPerPaper: number;
}
