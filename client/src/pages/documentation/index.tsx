import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { JournalNav } from "@/components/journal/JournalNav";
import {
  GraduationCap, BookOpen, FileText,
  Database, BarChart3, FlaskConical,
  Layers, Shield, Eye, GitBranch,
  ChevronRight, CheckCircle, HelpCircle, ListOrdered,
  BookMarked, RefreshCw,
  Scroll, Fingerprint, FileDown,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

import {
  SECTIONS, PIPELINE_STEPS, DATA_SOURCES, GLOSSARY, FAQ, ENGINE_UPDATES,
} from "./content-data";
import { FadeIn, SectionHeading } from "./DocComponents";

export default function Documentation() {
  const [, setLocation] = useLocation();
  const [activeSection, setActiveSection] = useState<string>(SECTIONS[0].id);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  /* ── Intersection Observer for active section ────────────────────── */
  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    const callback = (entries: IntersectionObserverEntry[]) => {
      // Find the topmost visible section
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (visible.length > 0) {
        setActiveSection(visible[0].target.id);
      }
    };

    const observer = new IntersectionObserver(callback, {
      rootMargin: "-80px 0px -60% 0px",
      threshold: 0,
    });

    SECTIONS.forEach((s) => {
      const el = sectionRefs.current[s.id];
      if (el) {
        observer.observe(el);
        observers.push(observer);
      }
    });

    return () => observer.disconnect();
  }, []);

  /* ── Register section ref ────────────────────────────────────────── */
  const setSectionRef = (id: string) => (el: HTMLElement | null) => {
    sectionRefs.current[id] = el;
  };

  /* ── Sidebar click handler ───────────────────────────────────────── */
  const scrollToSection = (id: string) => {
    const el = sectionRefs.current[id];
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 90;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  return (
    <div className="flex flex-col min-h-[100dvh] bg-background">
      <JournalNav />

      <main className="flex-1 relative z-10">
        {/* ═══════════════════════════════════════════════════════
            HERO
            ═══════════════════════════════════════════════════════ */}
        <section className="py-20 sm:py-28 border-b border-border/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,hsl(var(--primary)/0.04),transparent_60%)] pointer-events-none" />
          <div className="mx-auto max-w-3xl px-4 sm:px-6 relative">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/15 bg-primary/[0.04] mb-8">
                <BookOpen className="h-3.5 w-3.5 text-primary" />
                <span className="text-[11px] font-medium text-primary tracking-widest uppercase">Institutional Documentation</span>
              </div>

              <h1 className="text-monumental text-4xl sm:text-5xl md:text-6xl lg:text-7xl mb-6">
                <span className="text-foreground">Documentation</span>
              </h1>

              <div className="rule-editorial mb-8" />

              <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed font-serif max-w-2xl">
                A comprehensive reference for the AutoScholar autonomous research publication system.
                Architecture, methodology, data sources, research standards, and the principles
                that govern every paper published in this journal.
              </p>
            </motion.div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            SIDEBAR + CONTENT LAYOUT
            ═══════════════════════════════════════════════════════ */}
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 sm:py-16">
          <div className="flex gap-10 lg:gap-14">

            {/* ── Sidebar ──────────────────────────────────────── */}
            <aside className="hidden lg:block w-[220px] shrink-0">
              <nav className="sticky top-24">
                <p className="metric-label text-muted-foreground mb-4">Contents</p>
                <ul className="space-y-0.5">
                  {SECTIONS.map((s) => (
                    <li key={s.id}>
                      <button
                        onClick={() => scrollToSection(s.id)}
                        className={cn(
                          "flex items-center gap-2.5 w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200",
                          activeSection === s.id
                            ? "bg-primary/10 text-primary font-semibold"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                      >
                        <s.icon className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{s.label}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            </aside>

            {/* ── Main content ─────────────────────────────────── */}
            <div className="flex-1 min-w-0 space-y-20">

              {/* ─── 1. What is AutoScholar ──────────────────── */}
              <section id="what-is-autoscholar" ref={setSectionRef("what-is-autoscholar")}>
                <FadeIn>
                  <SectionHeading
                    icon={GraduationCap}
                    title="What is AutoScholar"
                    subtitle="Understanding the system, its purpose, and its boundaries."
                  />

                  <div className="space-y-6 font-serif text-muted-foreground leading-relaxed">
                    <div className="p-5 rounded-xl border border-primary/15 bg-primary/[0.03]">
                      <p className="text-foreground font-semibold text-base mb-2">Core Definition</p>
                      <p className="text-[15px]">
                        AutoScholar is not an AI writing assistant. It is a complete autonomous research pipeline.
                        The system independently discovers research gaps in the academic literature, collects real data
                        from institutional sources, executes rigorous econometric analyses, generates publication-quality
                        figures, writes full-length manuscripts in LaTeX, and subjects every paper to autonomous peer review.
                      </p>
                    </div>

                    <p>
                      Unlike AI writing tools that assist human authors, AutoScholar operates without human intervention
                      in the research process. No human selects the topic, writes the text, chooses the methodology,
                      or decides whether to publish. The system is autonomous by design.
                    </p>

                    <p>
                      AutoScholar is best understood as an autonomous scientific journal. It maintains its own publication
                      standards, its own peer review process, and its own quality thresholds. The administrator configures
                      the system parameters (domain pools, generation schedule, acceptance threshold) but never participates
                      in the research itself.
                    </p>

                    <div className="grid sm:grid-cols-2 gap-4 not-prose">
                      <div className="p-4 rounded-xl border border-border/50 bg-muted/[0.03]">
                        <p className="metric-label text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-1.5">
                          <CheckCircle className="h-3 w-3" /> What AutoScholar Is
                        </p>
                        <ul className="text-sm text-muted-foreground space-y-1.5">
                          <li>An autonomous research pipeline</li>
                          <li>A self-publishing scientific journal</li>
                          <li>A system for generating reproducible empirical papers</li>
                          <li>A transparent experiment in AI-driven science</li>
                        </ul>
                      </div>
                      <div className="p-4 rounded-xl border border-border/50 bg-muted/[0.03]">
                        <p className="metric-label text-red-600 dark:text-red-400 mb-2 flex items-center gap-1.5">
                          <AlertTriangle className="h-3 w-3" /> What AutoScholar Is Not
                        </p>
                        <ul className="text-sm text-muted-foreground space-y-1.5">
                          <li>A ghostwriting or paraphrasing tool</li>
                          <li>A human-in-the-loop co-authoring system</li>
                          <li>A traditional peer-reviewed journal</li>
                          <li>A replacement for domain-expert research</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </FadeIn>
              </section>

              {/* ─── 2. How It Works ─────────────────────────── */}
              <section id="how-it-works" ref={setSectionRef("how-it-works")}>
                <FadeIn>
                  <SectionHeading
                    icon={ListOrdered}
                    title="How It Works"
                    subtitle="The complete ten-stage pipeline from gap detection to publication."
                  />

                  <div className="space-y-4">
                    {PIPELINE_STEPS.map((step, i) => (
                      <FadeIn key={step.num} delay={i * 0.03}>
                        <div className="flex gap-4 p-4 rounded-xl border border-border/40 bg-muted/[0.02] hover:bg-muted/[0.06] transition-colors">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-xs font-bold text-primary">{step.num}</span>
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-foreground mb-1">{step.title}</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed font-serif">{step.desc}</p>
                          </div>
                        </div>
                      </FadeIn>
                    ))}
                  </div>
                </FadeIn>
              </section>

              {/* ─── 3. Methodological Principles ────────────── */}
              <section id="methodological-principles" ref={setSectionRef("methodological-principles")}>
                <FadeIn>
                  <SectionHeading
                    icon={FlaskConical}
                    title="Methodological Principles"
                    subtitle="The foundational commitments that govern the AutoScholar research engine."
                  />

                  <div className="space-y-8 font-serif text-muted-foreground leading-relaxed">
                    <div>
                      <h3 className="text-lg font-display font-bold text-foreground mb-3">Separation of Agent Roles</h3>
                      <p>
                        Each stage of the research pipeline is executed by a distinct agent with a defined scope and no
                        access to the internal state of other agents. The literature agent cannot modify data; the analysis
                        agent cannot rewrite the literature review; the peer review agent has no memory of how the paper
                        was generated. This separation prevents circular reasoning and ensures that validation is genuinely
                        independent.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-display font-bold text-foreground mb-3">Validation Logic</h3>
                      <p>
                        Every stage produces structured outputs that are validated before being passed to the next agent.
                        Data collection must produce non-empty DataFrames with provenance metadata. Data preparation must
                        pass stationarity tests and produce descriptive statistics. Analysis must include at least one
                        main regression and one robustness check. The paper must meet minimum section length requirements.
                        Failure at any stage halts the pipeline.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-display font-bold text-foreground mb-3">Source Management</h3>
                      <p>
                        Every data point and every citation is traceable to its source. Datasets include the API endpoint,
                        retrieval timestamp, and license under which the data was obtained. Bibliography entries are
                        validated against CrossRef DOIs. Figures include the exact Python code and data used to generate
                        them. This traceability is not optional; it is enforced by the pipeline architecture.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-display font-bold text-foreground mb-3">Reproducibility</h3>
                      <p>
                        Every published paper ships with a self-contained ZIP archive that can be executed independently
                        of the AutoScholar platform. Scripts are numbered in pipeline order. A requirements.txt specifies
                        exact package versions. Data files are included in their raw and processed forms. The goal is that
                        any researcher with Python installed can re-execute the analysis and obtain identical results.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-display font-bold text-foreground mb-3">System Limitations</h3>
                      <p>
                        AutoScholar cannot perform qualitative research, conduct interviews, run experiments, or access
                        proprietary databases. It cannot reason about institutional context the way a domain expert can.
                        Its peer review, while structured, lacks the nuanced judgment of human reviewers with decades of
                        field-specific experience. These are not bugs; they are inherent boundaries of the current system
                        architecture that readers should understand when interpreting results.
                      </p>
                    </div>
                  </div>
                </FadeIn>
              </section>

              {/* ─── 4. Research Standards ────────────────────── */}
              <section id="research-standards" ref={setSectionRef("research-standards")}>
                <FadeIn>
                  <SectionHeading
                    icon={Shield}
                    title="Research Standards"
                    subtitle="The quality requirements and publication standards enforced by the system."
                  />

                  <div className="space-y-6">
                    {[
                      {
                        title: "Real Data Only",
                        icon: Database,
                        text: "Every empirical paper uses data downloaded from authoritative institutional APIs at the time of generation. No synthetic, simulated, or fabricated data is permitted. If a data source is unavailable or returns insufficient observations, the pipeline halts rather than substituting placeholder data.",
                      },
                      {
                        title: "Figure Generation Standards",
                        icon: BarChart3,
                        text: "All figures are generated programmatically using matplotlib with journal-standard formatting: 300 DPI resolution, consistent color palettes, labeled axes, proper legends, and standardized dimensions. Each paper includes 10-12 figures covering descriptive statistics, regression results, diagnostics, and robustness checks.",
                      },
                      {
                        title: "ASID Assignment",
                        icon: Fingerprint,
                        text: "Every accepted paper is assigned a persistent AutoScholar ID (ASID) upon publication. This enables permanent citation, indexing, and retrieval. The ASID is embedded in the PDF metadata and displayed on the paper detail page.",
                      },
                      {
                        title: "Artifact Deposit",
                        icon: FileDown,
                        text: "The complete publication package is archived and made available for download. This includes the compiled PDF, LaTeX source, BibTeX bibliography, all Python scripts in pipeline order, raw and processed datasets, all generated figures, and pipeline configuration metadata.",
                      },
                      {
                        title: "Citation Standards",
                        icon: BookOpen,
                        text: "All references are formatted using BibTeX and validated against CrossRef. Citation counts are verified, DOIs are resolved, and author names are disambiguated. The bibliography is compiled automatically during the LaTeX build process using standard citation styles (APA, Chicago, or journal-specific).",
                      },
                      {
                        title: "Publication Package Contents",
                        icon: Layers,
                        text: "Each publication package contains: (1) the compiled PDF manuscript, (2) LaTeX source files, (3) BibTeX bibliography, (4) numbered Python scripts, (5) raw datasets with provenance, (6) processed datasets, (7) all generated figures as PNG files, (8) a requirements.txt for exact reproducibility, and (9) pipeline metadata in JSON format.",
                      },
                    ].map((item, i) => (
                      <FadeIn key={item.title} delay={i * 0.04}>
                        <div className="flex gap-4">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                            <item.icon className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-foreground mb-1.5">{item.title}</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed font-serif">{item.text}</p>
                          </div>
                        </div>
                      </FadeIn>
                    ))}
                  </div>
                </FadeIn>
              </section>

              {/* ─── 5. Data Sources ─────────────────────────── */}
              <section id="data-sources" ref={setSectionRef("data-sources")}>
                <FadeIn>
                  <SectionHeading
                    icon={Database}
                    title="Data Sources"
                    subtitle="The institutional and academic APIs that power AutoScholar's empirical research."
                  />

                  <div className="space-y-5">
                    {DATA_SOURCES.map((src, i) => (
                      <FadeIn key={src.abbr} delay={i * 0.03}>
                        <div className="rounded-xl border border-border/40 overflow-hidden">
                          <div className="p-5">
                            <div className="flex items-center gap-3 mb-3">
                              <span className={cn("inline-flex px-2.5 py-1 rounded-md text-xs font-bold border", src.color)}>
                                {src.abbr}
                              </span>
                              <h3 className="text-base font-bold text-foreground">{src.name}</h3>
                            </div>
                            <p className="text-sm text-muted-foreground leading-relaxed font-serif mb-3">{src.desc}</p>
                            <p className="text-sm text-muted-foreground leading-relaxed font-serif mb-3">
                              <span className="font-semibold text-foreground/80">Why it is used:</span> {src.why}
                            </p>
                            <div>
                              <p className="metric-label text-muted-foreground mb-2">Typical Use Cases</p>
                              <div className="flex flex-wrap gap-1.5">
                                {src.useCases.map((uc) => (
                                  <span key={uc} className="inline-flex px-2 py-0.5 rounded-md bg-muted/50 text-xs text-muted-foreground border border-border/30">
                                    {uc}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </FadeIn>
                    ))}
                  </div>
                </FadeIn>
              </section>

              {/* ─── 6. Paper Anatomy ────────────────────────── */}
              <section id="paper-anatomy" ref={setSectionRef("paper-anatomy")}>
                <FadeIn>
                  <SectionHeading
                    icon={FileText}
                    title="Paper Anatomy"
                    subtitle="A walk-through of how each component of an AutoScholar paper is produced."
                  />

                  <div className="space-y-8 font-serif text-muted-foreground leading-relaxed">
                    <div>
                      <h3 className="text-lg font-display font-bold text-foreground mb-2">How the Gap Was Found</h3>
                      <p>
                        The literature gap agent (Gauss) queries OpenAlex, arXiv, and CrossRef with
                        domain-specific search terms. It builds a citation network, identifies clusters of related work,
                        and looks for variable interactions that have been theorized but not empirically tested, or that
                        show contradictory findings across studies. Each candidate gap receives a novelty score (how
                        underexplored it is) and a feasibility score (whether sufficient data exists to study it).
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-display font-bold text-foreground mb-2">How Sources Were Selected</h3>
                      <p>
                        The literature retrieval process expands the initial gap analysis by following citation links
                        two levels deep, deduplicating results, and ranking papers by relevance and influence. The
                        final bibliography typically includes 40-80 references, with priority given to seminal papers,
                        recent contributions, and methodologically relevant work. Every reference has a validated
                        BibTeX entry.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-display font-bold text-foreground mb-2">How the Dataset Was Built</h3>
                      <p>
                        The data agent (Turing) maps the research question to specific variables and identifies which
                        data sources provide them. It downloads raw data via API, tags each variable with provenance
                        metadata, and stores it in structured DataFrames. The preparation agent (Newton) then cleans
                        the data: handling missing values, detecting outliers, running stationarity tests, and
                        constructing any derived variables (growth rates, ratios, lags, interaction terms).
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-display font-bold text-foreground mb-2">How the Model Was Chosen</h3>
                      <p>
                        Model selection is driven by the data structure and the research question. Panel data with
                        country and time dimensions triggers fixed-effects or GMM estimation. Time series data triggers
                        VAR, VECM, or GARCH models. Cross-sectional data triggers OLS with heteroskedasticity-robust
                        standard errors. The analysis agent selects the primary specification and runs at least one
                        alternative estimator as a robustness check.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-display font-bold text-foreground mb-2">How Figures Were Produced</h3>
                      <p>
                        Every figure is generated by a Python script using matplotlib. The analysis agent produces
                        figures for: raw data visualization, variable distributions, correlation heatmaps, regression
                        coefficient plots, residual diagnostics, impulse response functions, sub-sample comparisons,
                        and robustness check summaries. Each figure is exported at 300 DPI with standardized dimensions
                        and embedded in the LaTeX manuscript.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-display font-bold text-foreground mb-2">How the PDF Was Assembled</h3>
                      <p>
                        The writing agent (Euler) produces LaTeX source files for each section. These are combined with
                        the BibTeX bibliography, figure files, and a professional template. The compilation pipeline runs
                        XeLaTeX followed by BibTeX followed by two additional XeLaTeX passes to resolve all cross-references
                        and citations. The result is a typeset PDF manuscript typically spanning 60-90 pages.
                      </p>
                    </div>
                  </div>
                </FadeIn>
              </section>

              {/* ─── 7. Transparency ─────────────────────────── */}
              <section id="transparency" ref={setSectionRef("transparency")}>
                <FadeIn>
                  <SectionHeading
                    icon={Eye}
                    title="Transparency"
                    subtitle="Full disclosure on how decisions are made and where the system's boundaries lie."
                  />

                  <div className="space-y-8 font-serif text-muted-foreground leading-relaxed">
                    <div>
                      <h3 className="text-lg font-display font-bold text-foreground mb-2">How Topics Are Chosen</h3>
                      <p>
                        The administrator configures a set of domain pools (e.g., "financial economics," "macroeconomics,"
                        "monetary policy," "development economics") and a generation schedule. Within each domain pool,
                        the gap detection agent autonomously identifies research questions. No human selects specific topics
                        or steers the system toward particular conclusions.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-display font-bold text-foreground mb-2">How Data Is Selected</h3>
                      <p>
                        Data source selection is driven by the variables required to answer the research question. The
                        system maintains a mapping between economic concepts (e.g., "inflation," "GDP growth,"
                        "stock returns") and the APIs that provide them. When multiple sources offer the same variable,
                        the system prefers the source with longer historical coverage and higher update frequency.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-display font-bold text-foreground mb-2">How Models Are Decided</h3>
                      <p>
                        Model selection follows established econometric principles. The system tests data properties
                        (stationarity, panel structure, heteroskedasticity) and selects estimation methods accordingly.
                        It does not "shop" for models that produce significant results. If the primary specification
                        yields insignificant coefficients, this is reported as a finding, not overridden.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-display font-bold text-foreground mb-2">What "Peer Review" Means Here</h3>
                      <p>
                        AutoScholar's peer review is performed by an independent AI agent (Popper) that evaluates the
                        completed paper across six dimensions: originality, methodology, results, writing, references,
                        and reproducibility. This is not equivalent to traditional peer review by domain experts. It is
                        a structured quality gate that filters out clearly weak or methodologically flawed papers. Papers
                        near the acceptance threshold may still contain significant limitations.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-display font-bold text-foreground mb-2">What Is Automated vs. Not</h3>
                      <p>
                        Everything from topic selection through publication is automated: gap detection, literature
                        retrieval, data collection, data preparation, analysis, figure generation, paper writing,
                        LaTeX compilation, peer review, ASID assignment, and publication. The only human inputs are
                        system configuration (domain pools, schedule, acceptance threshold) and infrastructure
                        maintenance (server deployment, API key management).
                      </p>
                    </div>

                    <div>
                      <h3 className="text-lg font-display font-bold text-foreground mb-2">Known Limitations</h3>
                      <div className="space-y-2 text-sm">
                        <p><span className="font-semibold text-foreground/80">Data dependency:</span> Papers can only study what available APIs provide. Proprietary, survey-based, or experimental data is out of scope.</p>
                        <p><span className="font-semibold text-foreground/80">Causal inference:</span> Most analyses are correlational. The system applies standard identification strategies but cannot run experiments or exploit natural experiments with the same judgment as a human researcher.</p>
                        <p><span className="font-semibold text-foreground/80">Domain knowledge:</span> The system lacks the deep institutional knowledge that field experts bring. It may miss important contextual factors or interpret results without sufficient nuance.</p>
                        <p><span className="font-semibold text-foreground/80">Review quality:</span> The autonomous peer review catches structural problems but may miss subtle methodological errors that a specialist reviewer would identify.</p>
                        <p><span className="font-semibold text-foreground/80">Temporal scope:</span> Data is downloaded at generation time. Papers do not self-update when new data becomes available.</p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-display font-bold text-foreground mb-2">Failure Modes</h3>
                      <div className="space-y-2 text-sm">
                        <p><span className="font-semibold text-foreground/80">API failures:</span> If a data source is unavailable, the pipeline halts. Papers are not published with incomplete data.</p>
                        <p><span className="font-semibold text-foreground/80">Insufficient data:</span> If the available time series is too short for the chosen methodology, the analysis stage fails and the paper is abandoned.</p>
                        <p><span className="font-semibold text-foreground/80">LaTeX compilation errors:</span> Rare formatting issues can prevent PDF generation. The system retries with simplified formatting before abandoning.</p>
                        <p><span className="font-semibold text-foreground/80">Peer review rejection:</span> Papers that score below the acceptance threshold are automatically rejected and do not appear in the journal.</p>
                      </div>
                    </div>
                  </div>
                </FadeIn>
              </section>

              {/* ─── 8. Glossary ─────────────────────────────── */}
              <section id="glossary" ref={setSectionRef("glossary")}>
                <FadeIn>
                  <SectionHeading
                    icon={BookMarked}
                    title="Glossary"
                    subtitle="Key terms used throughout AutoScholar documentation and publications."
                  />

                  <div className="space-y-4">
                    {GLOSSARY.map((item, i) => (
                      <FadeIn key={item.term} delay={i * 0.02}>
                        <div className="p-4 rounded-xl border border-border/40 bg-muted/[0.02]">
                          <h3 className="text-sm font-bold text-foreground mb-1.5">{item.term}</h3>
                          <p className="text-sm text-muted-foreground leading-relaxed font-serif">{item.definition}</p>
                        </div>
                      </FadeIn>
                    ))}
                  </div>
                </FadeIn>
              </section>

              {/* ─── 9. Scientific FAQ ───────────────────────── */}
              <section id="scientific-faq" ref={setSectionRef("scientific-faq")}>
                <FadeIn>
                  <SectionHeading
                    icon={HelpCircle}
                    title="Scientific FAQ"
                    subtitle="Frequently asked questions about AutoScholar's research process and outputs."
                  />

                  <div className="space-y-5">
                    {FAQ.map((item, i) => (
                      <FadeIn key={i} delay={i * 0.03}>
                        <div className="rounded-xl border border-border/40 overflow-hidden">
                          <div className="p-5">
                            <h3 className="text-base font-bold text-foreground mb-3 flex items-start gap-2.5">
                              <span className="inline-flex w-6 h-6 rounded-md bg-primary/10 items-center justify-center shrink-0 mt-0.5">
                                <span className="text-xs font-bold text-primary">Q</span>
                              </span>
                              {item.q}
                            </h3>
                            <div className="pl-8">
                              <p className="text-sm text-muted-foreground leading-relaxed font-serif">{item.a}</p>
                            </div>
                          </div>
                        </div>
                      </FadeIn>
                    ))}
                  </div>
                </FadeIn>
              </section>

              {/* ─── 10. Research Engine Updates ──────────────── */}
              <section id="engine-updates" ref={setSectionRef("engine-updates")}>
                <FadeIn>
                  <SectionHeading
                    icon={RefreshCw}
                    title="Research Engine Updates"
                    subtitle="A changelog of improvements to the AutoScholar generation pipeline."
                  />

                  <div className="space-y-6">
                    {ENGINE_UPDATES.map((update, i) => (
                      <FadeIn key={update.version} delay={i * 0.04}>
                        <div className="rounded-xl border border-border/40 p-5">
                          <div className="flex items-center gap-3 mb-3">
                            <span className="inline-flex px-2.5 py-1 rounded-md bg-primary/10 text-xs font-bold text-primary border border-primary/20">
                              {update.version}
                            </span>
                            <span className="text-xs text-muted-foreground">{update.date}</span>
                          </div>
                          <h3 className="text-base font-bold text-foreground mb-3">{update.title}</h3>
                          <ul className="space-y-1.5">
                            {update.items.map((item, j) => (
                              <li key={j} className="flex items-start gap-2 text-sm text-muted-foreground font-serif">
                                <ChevronRight className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </FadeIn>
                    ))}
                  </div>
                </FadeIn>
              </section>

              {/* ─── 11. White Paper ─────────────────────────── */}
              <section id="white-paper" ref={setSectionRef("white-paper")}>
                <FadeIn>
                  <SectionHeading
                    icon={Scroll}
                    title="White Paper"
                    subtitle="The foundational document describing the vision and architecture of AutoScholar."
                  />

                  <div className="rounded-xl border border-border/40 overflow-hidden">
                    <div className="p-6 sm:p-8">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-violet-500/20 flex items-center justify-center">
                          <Scroll className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-lg font-display font-bold text-foreground">
                            AutoScholar: Toward an Autonomous Scientific Publishing System
                          </h3>
                          <p className="text-xs text-muted-foreground">Working Paper — March 2026</p>
                        </div>
                      </div>

                      <div className="rule-editorial mb-6" />

                      <div className="space-y-5 font-serif text-muted-foreground leading-relaxed text-sm">
                        <p>
                          This white paper presents the design, architecture, and philosophical foundations of AutoScholar,
                          a system for fully autonomous scientific paper generation. It covers the following areas:
                        </p>

                        <div className="grid sm:grid-cols-2 gap-3">
                          {[
                            { title: "Vision", desc: "Why autonomous scientific publishing, what problems it addresses, and what it is not trying to replace." },
                            { title: "Architecture Overview", desc: "The six-agent pipeline, inter-agent communication protocols, and validation checkpoints." },
                            { title: "Agent Workflow", desc: "Detailed specifications for Gauss, Turing, Newton, Fisher, Euler, and Popper agents." },
                            { title: "Publication Lifecycle", desc: "From gap detection through peer review to ASID assignment and artifact deposit." },
                            { title: "Repository Structure", desc: "How publication packages are organized, stored, and made available for download." },
                            { title: "Reproducibility Philosophy", desc: "Why every paper includes full source code, data, and execution instructions." },
                            { title: "Limits & Future Directions", desc: "Honest assessment of current capabilities and a roadmap for future development." },
                            { title: "Ethical Considerations", desc: "Transparency obligations, citation ethics, and the role of AI-generated research." },
                          ].map((item) => (
                            <div key={item.title} className="p-3 rounded-lg border border-border/30 bg-muted/[0.03]">
                              <p className="text-xs font-semibold text-foreground mb-1">{item.title}</p>
                              <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                            </div>
                          ))}
                        </div>

                        <blockquote className="quote-academic">
                          AutoScholar does not aim to replace human researchers. It aims to demonstrate that the
                          infrastructure of scientific publishing — literature review, data analysis, manuscript
                          preparation, and quality control — can be systematically automated while maintaining
                          transparency and reproducibility at every stage.
                        </blockquote>
                      </div>

                      <div className="mt-6 flex flex-wrap gap-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 rounded-xl"
                          onClick={() => window.open("/WHITEPAPER.pdf", "_blank")}
                        >
                          <FileDown className="h-3.5 w-3.5" />
                          Download PDF
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2 rounded-xl"
                          onClick={() => setLocation("/methodology")}
                        >
                          <FlaskConical className="h-3.5 w-3.5" />
                          Read Methodology
                        </Button>
                      </div>
                    </div>
                  </div>
                </FadeIn>
              </section>

            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════
            CTA FOOTER SECTION
            ═══════════════════════════════════════════════════════ */}
        <section className="py-12 sm:py-16 border-t border-border/30 bg-muted/10">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
            <h2 className="text-2xl font-display font-bold mb-4">Explore AutoScholar</h2>
            <p className="text-muted-foreground mb-6 font-serif">
              Browse the journal, study the methodology, or download the white paper.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button onClick={() => setLocation("/journal")} className="gap-2 rounded-xl">
                <BookOpen className="h-4 w-4" /> Browse the Journal
              </Button>
              <Button variant="outline" onClick={() => setLocation("/methodology")} className="gap-2 rounded-xl">
                <FlaskConical className="h-4 w-4" /> Methodology
              </Button>
              <Button variant="outline" onClick={() => setLocation("/repository")} className="gap-2 rounded-xl">
                <GitBranch className="h-4 w-4" /> Repository
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/30 py-6">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex items-center justify-center gap-2">
          <GraduationCap className="h-4 w-4 text-primary/60" />
          <span className="text-sm text-muted-foreground">AutoScholar Journal</span>
        </div>
      </footer>
    </div>
  );
}
