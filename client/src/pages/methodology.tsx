import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  GraduationCap, Search, Database, Layers, BarChart3, BrainCircuit, Shield,
  ArrowRight, CheckCircle, XCircle, FlaskConical, ChevronRight,
  Beaker, GitBranch, FileText, Fingerprint, Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { JournalNav } from "@/components/journal/JournalNav";

const AGENTS = [
  {
    name: "Gauss", role: "Literature Gap Analysis", icon: Search, step: "01",
    color: "from-violet-500 to-purple-600", bg: "bg-violet-500/10", text: "text-violet-600 dark:text-violet-400", border: "border-violet-500/20",
    description: "Scans 250M+ academic papers across OpenAlex, arXiv, and CrossRef. Identifies unexplored research gaps, formulates hypotheses, and builds comprehensive bibliographies with citation network analysis.",
    tools: ["OpenAlex API", "arXiv Search", "CrossRef", "Citation Network Expansion"],
    output: "Validated research gap with novelty/feasibility scores, literature synthesis, and BibTeX bibliography",
  },
  {
    name: "Turing", role: "Data Collection", icon: Database, step: "02",
    color: "from-blue-500 to-cyan-500", bg: "bg-blue-500/10", text: "text-blue-600 dark:text-blue-400", border: "border-blue-500/20",
    description: "Collects real financial, macroeconomic, and alternative datasets from authoritative sources. Downloads raw data into structured DataFrames with full source provenance.",
    tools: ["FMP API", "FRED (Federal Reserve)", "World Bank", "IMF", "OECD", "Yahoo Finance", "EODHD"],
    output: "Raw datasets with provenance metadata, source documentation",
  },
  {
    name: "Newton", role: "Data Preparation", icon: Layers, step: "03",
    color: "from-amber-500 to-orange-500", bg: "bg-amber-500/10", text: "text-amber-600 dark:text-amber-400", border: "border-amber-500/20",
    description: "Cleans, merges, and transforms raw data into analysis-ready panel datasets. Handles missing values, outliers, and constructs derived variables with full reproducibility.",
    tools: ["pandas", "numpy", "scipy", "statsmodels (ADF/KPSS tests)"],
    output: "Clean, merged dataset with descriptive statistics, correlation matrices, stationarity tests",
  },
  {
    name: "Fisher", role: "Empirical Analysis", icon: BarChart3, step: "04",
    color: "from-emerald-500 to-teal-500", bg: "bg-emerald-500/10", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-500/20",
    description: "Executes rigorous econometric models with multiple robustness checks, sub-sample analyses, and diagnostic tests. Generates publication-quality regression tables and figures.",
    tools: ["statsmodels", "linearmodels", "arch", "scikit-learn", "matplotlib"],
    output: "Regression results, robustness checks, 10-12 publication-quality figures",
  },
  {
    name: "Euler", role: "Paper Writing & Compilation", icon: BrainCircuit, step: "05",
    color: "from-rose-500 to-pink-600", bg: "bg-rose-500/10", text: "text-rose-600 dark:text-rose-400", border: "border-rose-500/20",
    description: "Coordinates the full pipeline, writes every section to journal standards (8 mandatory sections), and compiles LaTeX with BibTeX citations into a 60-90 page publication-grade PDF.",
    tools: ["LaTeX (XeLaTeX)", "BibTeX", "Custom templates (article, working paper, Econometrica)"],
    output: "Complete PDF paper with ASID, reproducible project ZIP",
  },
  {
    name: "Popper", role: "Peer Validation", icon: Shield, step: "06",
    color: "from-indigo-500 to-blue-600", bg: "bg-indigo-500/10", text: "text-indigo-600 dark:text-indigo-400", border: "border-indigo-500/20",
    description: "Evaluates every completed paper with the rigor of a top-tier journal reviewer. Papers that score below the threshold are automatically rejected and hidden from the public journal.",
    tools: ["Claude Opus 4.6 (evaluator model)", "6-dimension scoring rubric"],
    output: "Peer review report with score (0-100), section reviews, accept/reject recommendation",
  },
];

const SCORING_RUBRIC = [
  { range: "90–100", label: "Exceptional", desc: "Publishable in a top-5 journal as-is", color: "text-emerald-600 dark:text-emerald-400", barWidth: "w-full", barColor: "bg-emerald-500" },
  { range: "75–89", label: "Strong", desc: "Minor revisions needed, solid contribution", color: "text-emerald-600 dark:text-emerald-400", barWidth: "w-[85%]", barColor: "bg-emerald-500/70" },
  { range: "60–74", label: "Adequate", desc: "Has merit but significant gaps need addressing", color: "text-amber-600 dark:text-amber-400", barWidth: "w-[67%]", barColor: "bg-amber-500" },
  { range: "40–59", label: "Below Average", desc: "Fundamental issues with methodology or contribution", color: "text-orange-600 dark:text-orange-400", barWidth: "w-[50%]", barColor: "bg-orange-500" },
  { range: "20–39", label: "Weak", desc: "Major revision needed, questionable research design", color: "text-red-600 dark:text-red-400", barWidth: "w-[30%]", barColor: "bg-red-500/80" },
  { range: "0–19", label: "Unacceptable", desc: "Should be rejected", color: "text-red-600 dark:text-red-400", barWidth: "w-[15%]", barColor: "bg-red-500" },
];

const GUARANTEES = [
  { icon: Database, label: "Real-World Data Integration", desc: "Every paper uses data from institutional-grade APIs — FMP, FRED, World Bank, IMF, OECD" },
  { icon: Layers, label: "Structured Workflow Orchestration", desc: "Seven-agent pipeline with strict separation of concerns, sequential validation, and runtime governance" },
  { icon: Shield, label: "Autonomous Peer Review", desc: "6-dimension scoring rubric with automatic rejection below configurable threshold" },
  { icon: FileText, label: "Publication-Grade Compilation", desc: "LaTeX + BibTeX compilation producing 60-90 page manuscripts with proper typesetting" },
  { icon: GitBranch, label: "Full Reproducibility Artifacts", desc: "Every paper includes source code, raw data, figures, and pipeline configuration" },
  { icon: Fingerprint, label: "ASID & Citation Ready", desc: "Persistent digital identifiers and BibTeX export for every published article" },
];

export default function Methodology() {
  const [, setLocation] = useLocation();

  return (
    <div className="flex flex-col min-h-[100dvh] bg-background">
      <JournalNav />

      <main className="flex-1 relative z-10">
        {/* ═══════════════════════════════════════════════════════
            HERO — Institutional, Credible, Monumental
            ═══════════════════════════════════════════════════════ */}
        <section className="py-20 sm:py-32 border-b border-border/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,hsl(var(--primary)/0.04),transparent_60%)] pointer-events-none" />
          <div className="mx-auto max-w-3xl px-4 sm:px-6 relative">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/15 bg-primary/[0.04] mb-8">
                <FlaskConical className="h-3.5 w-3.5 text-primary" />
                <span className="text-[11px] font-medium text-primary tracking-widest uppercase">Methodological Framework</span>
              </div>

              <h1 className="text-monumental text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-6">
                <span className="text-foreground">Scientific</span>
                <br />
                <span className="bg-gradient-to-r from-primary via-violet-500 to-purple-500 bg-clip-text text-transparent">
                  Generation Pipeline
                </span>
              </h1>

              <div className="rule-editorial mb-8" />

              <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed font-serif max-w-2xl">
                A seven-agent pipeline — six sequential research stages plus a runtime governance engine — that autonomously discovers gaps in the literature, collects real data, runs econometric analyses, writes publication-grade papers, and validates through AI peer review, with real-time quality enforcement at every stage.
              </p>
            </motion.div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            PIPELINE FLOW — Visual Timeline
            ═══════════════════════════════════════════════════════ */}
        <section className="py-5 border-b border-border/30 bg-muted/[0.03]">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <div className="flex items-center justify-center gap-0 flex-wrap py-2">
              {AGENTS.map((agent, i) => (
                <div key={agent.name} className="flex items-center">
                  <div className={cn("flex items-center gap-2 px-3.5 py-2 rounded-lg border text-xs font-semibold", agent.bg, agent.text, agent.border)}>
                    <span className="text-[8px] font-bold opacity-40">{agent.step}</span>
                    <agent.icon className="h-3 w-3" />
                    {agent.name}
                  </div>
                  {i < AGENTS.length - 1 && (
                    <div className="flex items-center mx-0.5">
                      <div className="w-4 h-[1.5px] bg-border/40" />
                      <ChevronRight className="h-3 w-3 text-muted-foreground/25 -ml-0.5" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            AGENT DETAILS — Deep cards
            ═══════════════════════════════════════════════════════ */}
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <div className="text-center mb-14">
              <span className="metric-label text-muted-foreground/40 block mb-2">Agent Architecture</span>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground">Seven Agents, One Pipeline</h2>
            </div>

            <div className="space-y-6">
              {AGENTS.map((agent, i) => (
                <motion.div
                  key={agent.name}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className={cn("relative rounded-xl border p-6 sm:p-8 bg-card/50 backdrop-blur-sm", agent.border)}
                >
                  <div className={cn("absolute inset-x-0 top-0 h-[2px] rounded-t-xl bg-gradient-to-r opacity-50", agent.color)} />

                  <div className="flex items-start gap-4 mb-5">
                    <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center shrink-0 bg-gradient-to-br shadow-md", agent.color)}>
                      <agent.icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5 mb-1">
                        <span className="text-[10px] font-bold text-muted-foreground/40">STEP {agent.step}</span>
                        <h3 className="text-lg font-bold text-foreground">{agent.name}</h3>
                        <span className={cn("text-[10px] font-semibold uppercase tracking-wider", agent.text)}>{agent.role}</span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed font-serif">{agent.description}</p>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg border border-border/30 bg-muted/[0.03]">
                      <span className="metric-label block mb-2">Tools & APIs</span>
                      <div className="flex flex-wrap gap-1.5">
                        {agent.tools.map(t => (
                          <span key={t} className="text-[10px] px-2.5 py-1 rounded-md border border-border/40 bg-card/80 text-muted-foreground font-mono">{t}</span>
                        ))}
                      </div>
                    </div>
                    <div className="p-4 rounded-lg border border-border/30 bg-muted/[0.03]">
                      <span className="metric-label block mb-2">Output</span>
                      <p className="text-xs text-muted-foreground leading-relaxed">{agent.output}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            SCORING RUBRIC — Popper's Evaluation Framework
            ═══════════════════════════════════════════════════════ */}
        <section className="py-16 sm:py-24 border-t border-border/30">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <div className="text-center mb-12">
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-indigo-500/15 bg-indigo-500/[0.04] mb-5"
              >
                <Shield className="h-3.5 w-3.5 text-indigo-500" />
                <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 tracking-widest uppercase">Peer Review Framework</span>
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-3"
              >
                Popper Scoring Rubric
              </motion.h2>
              <p className="text-sm text-muted-foreground font-serif">
                Papers are evaluated across six dimensions: originality, methodology, results quality, writing clarity, references adequacy, and reproducibility.
              </p>
            </div>

            <div className="space-y-2.5">
              {SCORING_RUBRIC.map((item, i) => (
                <motion.div
                  key={item.range}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-4 p-4 rounded-lg border border-border/30 bg-card/40"
                >
                  <span className={cn("text-lg font-display font-bold w-20 text-right tabular-nums", item.color)}>{item.range}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-foreground">{item.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                    <div className="mt-2 h-1 rounded-full bg-muted/40 overflow-hidden">
                      <div className={cn("h-full rounded-full", item.barWidth, item.barColor, "opacity-60")} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Publication decision */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="mt-8 p-5 rounded-xl border border-indigo-500/15 bg-indigo-500/[0.03]"
            >
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-indigo-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-foreground mb-2">Publication Decision</p>
                  <div className="flex items-center gap-6 text-sm">
                    <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle className="h-4 w-4" /> Score ≥ threshold → Published
                    </span>
                    <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
                      <XCircle className="h-4 w-4" /> Score &lt; threshold → Rejected
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">The threshold is configurable by the admin (default: 45/100). Rejected papers are hidden from the public journal.</p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            SCIENTIFIC GUARANTEES
            ═══════════════════════════════════════════════════════ */}
        <section className="py-16 sm:py-24 border-t border-border/30">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <div className="text-center mb-12">
              <span className="metric-label text-muted-foreground/40 block mb-2">Commitments</span>
              <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground">Scientific Guarantees</h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {GUARANTEES.map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className="p-5 rounded-xl border border-border/30 bg-card/30 hover:bg-card/60 hover:border-primary/15 transition-all duration-300"
                >
                  <item.icon className="h-5 w-5 text-primary/50 mb-3" />
                  <h3 className="text-sm font-bold text-foreground mb-1.5">{item.label}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 border-t border-border/30">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
            <div className="rule-editorial mx-auto mb-8" />
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-4">
              See the Results
            </h2>
            <p className="text-muted-foreground mb-8 font-serif">
              Browse peer-validated papers produced by this pipeline.
            </p>
            <Button size="lg" onClick={() => setLocation("/journal")} className="gap-2.5 rounded-xl">
              <GraduationCap className="h-4 w-4" /> Explore Published Papers <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/30 py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex items-center justify-center gap-2">
          <GraduationCap className="h-4 w-4 text-primary/40" />
          <span className="text-sm text-muted-foreground/50 font-display">AutoScholar Journal</span>
        </div>
      </footer>
    </div>
  );
}
