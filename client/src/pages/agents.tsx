import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  GraduationCap, ArrowRight, Brain, Search, Database,
  FlaskConical, BarChart3, ChevronRight, Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { JournalNav } from "@/components/journal/JournalNav";

const agents = [
  {
    name: "Euler",
    title: "The AutoScholar Research Agent",
    role: "Global Orchestrator",
    icon: Brain,
    step: "05",
    accent: "text-teal-600 dark:text-teal-400",
    badge: "bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20",
    border: "border-teal-500/20",
    gradient: "from-teal-500 to-cyan-500",
    description:
      "Euler is the central intelligence of AutoScholar. It coordinates the entire research workflow: planning the paper structure, integrating outputs from Gauss and Turing, writing each section in LaTeX, and compiling the final publication-quality PDF.",
    responsibilities: [
      "Orchestrates the full research generation pipeline",
      "Integrates literature analysis and empirical results",
      "Writes structured academic prose section by section",
      "Produces publication-quality LaTeX output",
      "Manages the 1M-token context across 100+ tool calls",
    ],
    whyName:
      "Named after Leonhard Euler (1707\u20131783), the most prolific mathematician in history. Euler authored over 800 papers across every branch of mathematics known in his time \u2014 from number theory to fluid dynamics, from graph theory to celestial mechanics. His extraordinary breadth and relentless output mirror the role of the AutoScholar orchestrator: a single intelligence that synthesizes knowledge across all domains of quantitative finance to produce rigorous, complete research.",
    quote:
      "\u201CRead Euler, read Euler, he is the master of us all.\u201D \u2014 Pierre-Simon Laplace",
  },
  {
    name: "Gauss",
    title: "Research Gap Analysis Agent",
    role: "Scientific Discovery",
    icon: Search,
    step: "01",
    accent: "text-indigo-600 dark:text-indigo-400",
    badge: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20",
    border: "border-indigo-500/20",
    gradient: "from-indigo-500 to-violet-500",
    description:
      "Gauss is responsible for the most critical intellectual step: finding what has not yet been studied. It searches across 250M+ academic papers, builds citation networks, extracts the scientific landscape, and identifies genuine research gaps with scored novelty, feasibility, and citation potential.",
    responsibilities: [
      "Queries OpenAlex, arXiv, and CrossRef in parallel",
      "Expands citation networks from the most influential papers",
      "Extracts dominant methods, datasets, and limitations from the literature",
      "Clusters papers into thematic groups",
      "Runs 6 gap detection engines (method, dataset, temporal, contradiction, limitation, cross-disciplinary)",
      "Scores and validates each gap before recommending the strongest one",
    ],
    whyName:
      "Named after Carl Friedrich Gauss (1777\u20131855), the \u201CPrince of Mathematicians.\u201D Gauss possessed an unparalleled ability to see patterns where others saw noise \u2014 he discovered the prime number theorem, the method of least squares, and non-Euclidean geometry, often years before anyone else. He was legendary for verifying every claim with meticulous rigor before publishing. This mirrors the Gauss agent perfectly: it sifts through millions of papers to detect what is missing, scores each gap with quantitative precision, and validates every finding.",
    quote:
      "\u201CIt is not knowledge, but the act of learning, not possession but the act of getting there, which grants the greatest enjoyment.\u201D \u2014 Carl Friedrich Gauss",
  },
  {
    name: "Turing",
    title: "Data Collection Agent",
    role: "Data Engineering",
    icon: Database,
    step: "02",
    accent: "text-amber-600 dark:text-amber-400",
    badge: "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20",
    border: "border-amber-500/20",
    gradient: "from-amber-500 to-orange-500",
    description:
      "Turing handles the empirical foundation of every paper. It connects to 10+ institutional-grade data providers, downloads real financial and macroeconomic data, executes Python-based econometric analysis in a sandboxed environment, runs robustness checks, and generates publication-quality figures.",
    responsibilities: [
      "Collects data from FMP, EODHD, FRED, World Bank, IMF, OECD, and Polymarket",
      "Executes Python code with pre-loaded pandas, NumPy, statsmodels, and scikit-learn",
      "Estimates econometric models (GARCH, VAR, panel data, ML)",
      "Runs 3+ robustness checks per paper (subsample, alternative specs, controls)",
      "Generates 10\u201312 publication-quality matplotlib figures per paper",
      "Auto-recovers from execution errors via LLM-powered code repair",
    ],
    whyName:
      "Named after Alan Turing (1912\u20131954), the father of computer science and artificial intelligence. Turing designed the theoretical foundation of all computation \u2014 the Turing machine \u2014 and broke the Enigma cipher by building machines that processed data at unprecedented scale. His vision of machines that could \u201Cthink\u201D is the direct ancestor of everything AutoScholar does. The Turing agent embodies his legacy: it is the computational engine that transforms raw data into scientific insight.",
    quote:
      "\u201CWe can only see a short distance ahead, but we can see plenty there that needs to be done.\u201D \u2014 Alan Turing",
  },
  {
    name: "Newton",
    title: "Dataset Preparation Agent",
    role: "Dataset Engineering",
    icon: FlaskConical,
    step: "03",
    accent: "text-emerald-600 dark:text-emerald-400",
    badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20",
    border: "border-emerald-500/20",
    gradient: "from-emerald-500 to-green-500",
    description:
      "Newton transforms raw, messy data collected by Turing into a clean, analysis-ready dataset. It merges multiple sources on a common timeline, constructs derived variables (returns, spreads, ratios, dummies), handles missing values, normalizes formats, and exports the final dataset with a complete data dictionary.",
    responsibilities: [
      "Cleans raw data: removes duplicates, fixes types, handles encoding issues",
      "Merges multiple data sources on common date indices",
      "Constructs derived variables: log-returns, spreads, rolling statistics, interaction terms",
      "Handles missing values via forward-fill, interpolation, or documented exclusion",
      "Performs descriptive statistics and stationarity tests (ADF, KPSS)",
      "Exports final dataset as CSV + Parquet with a JSON data dictionary",
    ],
    whyName:
      "Named after Isaac Newton (1643\u20131727), who transformed the raw observations of Kepler, Galileo, and Hooke into the unified mathematical framework of classical mechanics. Newton did not merely collect data \u2014 he forged it into laws. The Newton agent does the same: it takes the raw, heterogeneous data and transforms it into a clean, structured dataset ready for rigorous analysis.",
    quote:
      "\u201CIf I have seen further, it is by standing on the shoulders of giants.\u201D \u2014 Isaac Newton",
  },
  {
    name: "Fisher",
    title: "Empirical Analysis Agent",
    role: "Econometric Analysis",
    icon: BarChart3,
    step: "04",
    accent: "text-rose-600 dark:text-rose-400",
    badge: "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20",
    border: "border-rose-500/20",
    gradient: "from-rose-500 to-pink-500",
    description:
      "Fisher is the empirical engine of AutoScholar. It takes Newton\u2019s prepared dataset and writes complete Python scripts for the main econometric model, robustness tests, diagnostic checks, and publication-quality figures and tables. Every regression, every hypothesis test, and every figure in an AutoScholar paper is produced by Fisher.",
    responsibilities: [
      "Writes and executes the main regression / econometric model script",
      "Runs 3+ robustness checks: alternative specs, subsample splits, additional controls",
      "Performs model diagnostics: residual analysis, heteroskedasticity, autocorrelation, normality",
      "Generates 10\u201312 publication-quality matplotlib figures per paper",
      "Exports LaTeX-formatted regression tables (booktabs style)",
      "Produces structured results (CSV) for integration into the manuscript",
    ],
    whyName:
      "Named after Ronald A. Fisher (1890\u20131962), the father of modern statistics. Fisher invented the analysis of variance (ANOVA), the F-test (named after him), maximum likelihood estimation, the concept of sufficiency, and the randomized controlled experiment. He single-handedly created the mathematical framework that underlies virtually every empirical test in economics and finance.",
    quote:
      "\u201CTo consult the statistician after an experiment is finished is often merely to ask him to conduct a post-mortem examination.\u201D \u2014 Ronald A. Fisher",
  },
  {
    name: "Popper",
    title: "Peer Review Agent",
    role: "Peer Validation",
    icon: Shield,
    step: "06",
    accent: "text-indigo-600 dark:text-indigo-400",
    badge: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20",
    border: "border-indigo-500/20",
    gradient: "from-indigo-500 to-purple-600",
    description:
      "Popper evaluates every completed paper with the rigor and skepticism of a top-tier journal referee. It scores across six dimensions \u2014 originality, methodology, results quality, writing clarity, references adequacy, and reproducibility \u2014 and produces a detailed review report. Papers that score below the configurable threshold are automatically rejected and hidden from the public journal.",
    responsibilities: [
      "Evaluates papers across 6 dimensions using a structured scoring rubric (0\u2013100)",
      "Produces section-by-section review comments with specific, actionable feedback",
      "Issues accept/reject/revise recommendations based on configurable thresholds",
      "Issues detailed revision recommendations when weaknesses are identified",
      "Rejected papers are hidden from the public journal; only validated research is published",
      "Review reports are stored and accessible via the admin dashboard",
    ],
    whyName:
      "Named after Karl Popper (1902\u20131994), the philosopher of science who argued that the defining feature of scientific knowledge is falsifiability. Popper rejected the idea that science advances by confirming theories; instead, he insisted that we progress by rigorously trying to disprove them. A theory that cannot be tested is not scientific. The Popper agent embodies this philosophy: it does not confirm that a paper is good \u2014 it actively searches for weaknesses, methodological flaws, and unsupported claims. Only papers that survive this scrutiny are published.",
    quote:
      "\u201CIn so far as a scientific statement speaks about reality, it must be falsifiable; and in so far as it is not falsifiable, it does not speak about reality.\u201D \u2014 Karl Popper",
  },
];

// Sort by pipeline step for the flow display
const pipelineOrder = [...agents].sort((a, b) => parseInt(a.step) - parseInt(b.step));

export default function Agents() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <JournalNav />

      <main className="relative z-10">
        {/* ═══════════════════════════════════════════════════════
            HERO — The Research Faculty
            ═══════════════════════════════════════════════════════ */}
        <section className="py-20 sm:py-32 border-b border-border/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,hsl(var(--primary)/0.04),transparent_60%)] pointer-events-none" />
          <div className="container mx-auto px-4 sm:px-6 max-w-5xl relative">
            {/* Architecture diagram */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-10 rounded-xl overflow-hidden border border-border/40 shadow-lg max-w-3xl mx-auto"
            >
              <img
                src="/agent.png"
                alt="AutoScholar Agent Architecture — Euler, Gauss, Turing, Newton, Fisher"
                className="w-full h-auto"
              />
            </motion.div>

            <div className="text-center">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/15 bg-primary/[0.04] mb-8"
              >
                <GraduationCap className="h-3.5 w-3.5 text-primary" />
                <span className="text-[11px] font-medium text-primary tracking-widest uppercase">Autonomous Research Faculty</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="text-monumental text-4xl md:text-5xl lg:text-6xl mb-5"
              >
                Meet the Agents
              </motion.h1>

              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="rule-editorial mx-auto mb-6"
              />

              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed font-serif"
              >
                AutoScholar is powered by seven specialized agents \u2014 five research agents, a runtime governance engine, and a peer review agent \u2014 each named after a titan of science, mathematics, and philosophy whose legacy defines their role in the autonomous research pipeline.
              </motion.p>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            PIPELINE FLOW
            ═══════════════════════════════════════════════════════ */}
        <section className="py-5 border-b border-border/30 bg-muted/[0.03]">
          <div className="container mx-auto px-4 sm:px-6 max-w-5xl">
            <div className="flex items-center justify-center gap-0 flex-wrap py-2">
              {pipelineOrder.map((agent, i) => (
                <div key={agent.name} className="flex items-center">
                  <div className={cn("px-3.5 py-2 rounded-lg border text-xs font-semibold", agent.badge)}>
                    <span className={cn("font-bold", agent.accent)}>{agent.name}</span>
                    <span className="text-muted-foreground ml-2 text-[10px]">{agent.role}</span>
                  </div>
                  {i < pipelineOrder.length - 1 && (
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
            AGENT PROFILES — Deep, institutional, scholarly
            ═══════════════════════════════════════════════════════ */}
        <section className="py-16 sm:py-24">
          <div className="container mx-auto px-4 sm:px-6 max-w-4xl space-y-10">
            {agents.map((agent, i) => {
              const Icon = agent.icon;
              return (
                <motion.div
                  key={agent.name}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.05 }}
                  className={cn("relative rounded-xl border bg-card/40 backdrop-blur-sm overflow-hidden", agent.border)}
                >
                  {/* Top accent bar */}
                  <div className={cn("h-[3px] bg-gradient-to-r", agent.gradient)} />

                  <div className="p-6 sm:p-8 md:p-10">
                    {/* Agent header */}
                    <div className="flex items-start gap-5 mb-6">
                      <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br shadow-lg", agent.gradient)}>
                        <Icon className="w-7 h-7 text-white" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 flex-wrap mb-1">
                          <span className="text-[10px] font-bold text-muted-foreground/40 tracking-wider">STEP {agent.step}</span>
                          <h2 className="text-2xl font-display font-bold text-foreground">{agent.name}</h2>
                          <span className={cn("text-[10px] font-semibold px-2.5 py-0.5 rounded-md border", agent.badge)}>
                            {agent.role}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{agent.title}</p>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-foreground/80 leading-relaxed mb-6 font-serif">
                      {agent.description}
                    </p>

                    {/* Responsibilities */}
                    <div className="mb-8">
                      <h3 className="metric-label mb-3">Responsibilities</h3>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {agent.responsibilities.map((r, j) => (
                          <li key={j} className="flex items-start gap-2.5 text-sm text-foreground/70">
                            <span className={cn("mt-2 w-1.5 h-1.5 rounded-full flex-shrink-0 bg-current", agent.accent)} />
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Historical context — the "why" card */}
                    <div className="rounded-lg bg-muted/[0.04] border border-border/30 p-6">
                      <h3 className="metric-label mb-3">Why "{agent.name}"?</h3>
                      <p className="text-sm text-foreground/70 leading-relaxed mb-5 font-serif">
                        {agent.whyName}
                      </p>
                      <blockquote className="quote-academic text-sm">
                        {agent.quote}
                      </blockquote>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 border-t border-border/30">
          <div className="container mx-auto px-4 sm:px-6 max-w-3xl text-center">
            <div className="rule-editorial mx-auto mb-8" />
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground mb-4">
              See How They Work Together
            </h2>
            <p className="text-muted-foreground mb-8 font-serif">
              Explore the complete methodology and scoring rubric behind every publication.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Button size="lg" onClick={() => setLocation("/methodology")} className="gap-2.5 rounded-xl">
                <FlaskConical className="h-4 w-4" /> Full Methodology <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg" onClick={() => setLocation("/journal")} className="gap-2.5 rounded-xl">
                <GraduationCap className="h-4 w-4" /> Browse the Journal
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/30 py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex items-center justify-center gap-2">
          <GraduationCap className="h-4 w-4 text-primary/40" />
          <span className="text-xs text-muted-foreground/40">
            AutoScholar Journal — Euler, Gauss, Turing, Newton, Fisher, and Popper work together to produce autonomous, publication-grade research.
          </span>
        </div>
      </footer>
    </div>
  );
}
