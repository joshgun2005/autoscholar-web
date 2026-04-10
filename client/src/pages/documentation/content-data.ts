import {
  GraduationCap, BookOpen, FileText,
  Database, FlaskConical,
  Shield, Eye,
  ListOrdered,
  BookMarked, RefreshCw,
  Scroll, HelpCircle,
  type LucideIcon,
} from "lucide-react";

// ─── Section Definitions ────────────────────────────────────

export interface SectionDef {
  id: string;
  label: string;
  icon: LucideIcon;
}

export const SECTIONS: SectionDef[] = [
  { id: "what-is-autoscholar", label: "What is AutoScholar", icon: GraduationCap },
  { id: "how-it-works", label: "How It Works", icon: ListOrdered },
  { id: "methodological-principles", label: "Methodological Principles", icon: FlaskConical },
  { id: "research-standards", label: "Research Standards", icon: Shield },
  { id: "data-sources", label: "Data Sources", icon: Database },
  { id: "paper-anatomy", label: "Paper Anatomy", icon: FileText },
  { id: "transparency", label: "Transparency", icon: Eye },
  { id: "glossary", label: "Glossary", icon: BookMarked },
  { id: "scientific-faq", label: "Scientific FAQ", icon: HelpCircle },
  { id: "engine-updates", label: "Engine Updates", icon: RefreshCw },
  { id: "white-paper", label: "White Paper", icon: Scroll },
];

// ─── Pipeline Steps ─────────────────────────────────────────

export const PIPELINE_STEPS = [
  { num: "01", title: "Gap Detection", desc: "The system scans 250M+ academic papers across OpenAlex, arXiv, and CrossRef to identify unexplored research questions, underexamined interactions between variables, or contradictions in existing literature. Novelty and feasibility scores are computed for each candidate gap." },
  { num: "02", title: "Literature Retrieval", desc: "Once a gap is validated, the system retrieves a comprehensive corpus of related papers. Citation networks are expanded, bibliographies are deduplicated, and a structured literature synthesis is generated with BibTeX entries for every referenced work." },
  { num: "03", title: "Data Collection", desc: "Real-world datasets are downloaded from authoritative institutional sources: FRED, IMF, World Bank, OECD, FMP, and EODHD. Every data point is tagged with full provenance metadata including source URL, retrieval timestamp, and license information." },
  { num: "04", title: "Data Preparation", desc: "Raw data is cleaned, merged, and transformed into analysis-ready panel datasets. This includes handling missing values, outlier detection, stationarity testing (ADF/KPSS), and construction of derived variables. Descriptive statistics and correlation matrices are generated." },
  { num: "05", title: "Modeling & Analysis", desc: "Rigorous econometric models are estimated with multiple robustness checks, sub-sample analyses, and diagnostic tests. The system selects appropriate methodologies (OLS, fixed effects, GMM, VAR, GARCH) based on the data structure and research question. Publication-quality figures are generated with monochrome palettes, journal-specific dimensions, font embedding (TrueType only), and WCAG accessibility compliance." },
  { num: "06", title: "Figure Generation", desc: "Publication-quality figures are produced using matplotlib with Journal of Finance visual standards. Every figure follows strict rules: serif fonts at 9pt, black-and-grayscale default palette, bottom-left spines only, inward ticks, 600 DPI export with embedded TrueType fonts. Colorblind-safe palettes (Paul Tol, Okabe-Ito) are used only when grayscale is exhausted." },
  { num: "07", title: "Paper Writing", desc: "Every section is written to Journal of Finance publication standards, enforcing literary present tense, JF citation format, and targeting 60-90 pages including appendices." },
  { num: "08", title: "LaTeX Compilation", desc: "The manuscript is compiled using XeLaTeX with BibTeX citation processing. Professional templates (article, working paper, Econometrica-style) ensure proper typesetting, table formatting, and figure placement." },
  { num: "09", title: "Peer Review", desc: "An independent evaluator agent scores the paper across six dimensions: originality, methodology, results quality, writing quality, references, and reproducibility. Papers below the acceptance threshold are automatically rejected." },
  { num: "10", title: "Publication", desc: "Accepted papers are assigned an ASID (AutoScholar ID), bundled into a reproducible ZIP archive (PDF, LaTeX source, Python scripts, datasets, figures), and published to the AutoScholar journal with full metadata." },
];

// ─── Data Sources ───────────────────────────────────────────

export interface DataSourceDef {
  name: string;
  abbr: string;
  desc: string;
  why: string;
  useCases: string[];
  color: string;
}

export const DATA_SOURCES: DataSourceDef[] = [
  {
    name: "Federal Reserve Economic Data",
    abbr: "FRED",
    desc: "The Federal Reserve Bank of St. Louis maintains FRED, one of the most comprehensive public databases of U.S. and international economic time series. It contains over 800,000 data series from 107 sources.",
    why: "FRED provides authoritative macroeconomic indicators with long historical coverage, consistent formatting, and programmatic API access.",
    useCases: ["GDP growth rates", "Inflation (CPI, PCE)", "Interest rates (Fed Funds, Treasury yields)", "Unemployment rates", "Money supply aggregates"],
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  },
  {
    name: "International Monetary Fund",
    abbr: "IMF",
    desc: "The IMF provides global macroeconomic and financial data through its World Economic Outlook, International Financial Statistics, and Balance of Payments databases.",
    why: "IMF data offers standardized cross-country comparisons essential for international finance and macroeconomic research with consistent methodology across 190 member countries.",
    useCases: ["Cross-country GDP comparisons", "Balance of payments data", "Exchange rate regimes", "Sovereign debt statistics", "World Economic Outlook forecasts"],
    color: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
  },
  {
    name: "World Bank",
    abbr: "World Bank",
    desc: "The World Bank Open Data initiative provides free and open access to global development data, covering 217 economies with over 1,400 indicators.",
    why: "The World Bank is the standard source for development indicators, governance metrics, and long-run structural data used in development economics and cross-country analyses.",
    useCases: ["Governance indicators", "Poverty and inequality metrics", "Health and education statistics", "Infrastructure data", "Trade openness measures"],
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  },
  {
    name: "Organisation for Economic Co-operation and Development",
    abbr: "OECD",
    desc: "The OECD provides harmonized economic, social, and environmental statistics for its 38 member countries and selected partner economies.",
    why: "OECD data is essential for research on advanced economies, offering harmonized indicators that allow rigorous cross-country panel estimation with consistent definitions.",
    useCases: ["Tax-to-GDP ratios", "Labor market indicators", "Productivity statistics", "Housing price indices", "Environmental policy stringency"],
    color: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
  },
  {
    name: "Financial Modeling Prep",
    abbr: "FMP",
    desc: "FMP provides institutional-grade financial market data including stock prices, financial statements, economic calendars, and alternative data for over 70,000 instruments globally.",
    why: "FMP offers granular financial data (daily prices, quarterly financials, insider transactions) essential for asset pricing, corporate finance, and market microstructure research.",
    useCases: ["Historical stock prices", "Financial statements (10-K, 10-Q)", "Earnings calendars", "Insider trading data", "ETF holdings and constituents"],
    color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  },
  {
    name: "EODHD",
    abbr: "EODHD",
    desc: "EODHD (End-of-Day Historical Data) provides global market data covering 70+ exchanges, including equities, ETFs, mutual funds, bonds, and options with intraday and end-of-day granularity.",
    why: "EODHD complements FMP with broader international exchange coverage and intraday data, critical for cross-market event studies and high-frequency research.",
    useCases: ["International equity prices", "Intraday tick data", "Options chain data", "Bond prices", "Fundamental data for non-US markets"],
    color: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
  },
  {
    name: "OpenAlex",
    abbr: "OpenAlex",
    desc: "OpenAlex is an open catalog of the global research system, indexing over 250M scholarly works with rich metadata, citations, and institutional affiliations.",
    why: "OpenAlex provides the broadest open-access coverage of scholarly works, enabling comprehensive literature surveys and cross-disciplinary research gap analysis.",
    useCases: ["Broad literature surveys", "Institutional affiliation mapping", "Open access status detection", "Concept and topic tagging", "Cross-disciplinary discovery"],
    color: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
  },
  {
    name: "arXiv",
    abbr: "arXiv",
    desc: "arXiv is the premier open-access preprint repository, hosting over 2.4M scholarly articles in physics, mathematics, computer science, economics, and quantitative finance.",
    why: "arXiv provides access to cutting-edge research before formal publication, essential for identifying the latest methodological advances and ensuring literature reviews capture frontier work.",
    useCases: ["Preprint discovery", "Working paper retrieval", "Methodology tracking", "Quantitative finance papers", "Econometrics advances"],
    color: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  },
  {
    name: "CrossRef",
    abbr: "CrossRef",
    desc: "CrossRef is the official DOI registration agency for scholarly publications, providing metadata for over 150M records including journal articles, conference papers, and books.",
    why: "CrossRef ensures bibliographic accuracy by providing authoritative DOI-linked metadata, enabling reliable citation generation and reference validation.",
    useCases: ["DOI resolution and validation", "Bibliographic metadata retrieval", "Citation count verification", "Journal ISSN lookup", "Reference deduplication"],
    color: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20",
  },
];

// ─── Glossary ───────────────────────────────────────────────

export const GLOSSARY: { term: string; definition: string }[] = [
  { term: "Research Gap", definition: "An unexplored or underexamined question in the existing academic literature. AutoScholar identifies gaps by analyzing citation networks, cross-referencing variable interactions, and detecting contradictions in published findings." },
  { term: "Identification", definition: "The econometric strategy used to establish a causal or structural relationship between variables. Proper identification requires addressing endogeneity, omitted variable bias, and selection effects through instrumental variables, difference-in-differences, or other quasi-experimental methods." },
  { term: "Structural Break", definition: "A point in time where the statistical properties of a time series undergo a significant shift, often due to policy changes, crises, or regime transitions. AutoScholar tests for structural breaks using Chow tests, CUSUM, and Bai-Perron procedures." },
  { term: "Reproducibility", definition: "The ability to re-execute the entire research pipeline and obtain identical results. Every AutoScholar paper includes all source code, datasets, and configuration needed for exact reproduction." },
  { term: "Robustness Check", definition: "An alternative specification or estimation method used to verify that main results are not artifacts of a particular modeling choice. AutoScholar papers include multiple robustness checks including sub-sample analysis, alternative variable definitions, and different estimators." },
  { term: "ASID", definition: "AutoScholar ID. A persistent, unique identifier (format: ASID-YYYY-NNNN) assigned to every published AutoScholar paper, enabling permanent citation and retrieval regardless of URL changes." },
  { term: "Artifact", definition: "Any output produced by the research pipeline: datasets, Python scripts, figures, LaTeX source files, BibTeX bibliographies, and the compiled PDF. All artifacts are bundled into a reproducible ZIP archive." },
  { term: "Empirical Paper", definition: "A research paper whose findings are derived from the analysis of observed data, as opposed to purely theoretical or simulation-based work. The majority of AutoScholar papers are empirical." },
  { term: "Theoretical Paper", definition: "A research paper that develops formal mathematical models, derives propositions, and establishes logical relationships without direct data analysis. AutoScholar occasionally produces theoretical contributions in financial economics and monetary theory." },
  { term: "Validation Stage", definition: "The final phase of the AutoScholar pipeline where an independent evaluator agent reviews the completed paper. This agent has no memory of the generation process and evaluates the paper as a blind reviewer would." },
  { term: "Acceptance Rate", definition: "The proportion of generated papers that pass the peer review threshold and are published to the journal. AutoScholar maintains a deliberately selective acceptance rate by setting high quality thresholds." },
  { term: "Peer Review Score", definition: "A composite score (0-100) computed across six evaluation dimensions: originality, methodology, results, writing, references, and reproducibility. Papers must exceed the configured threshold to be accepted." },
  { term: "Publication Package", definition: "The complete set of artifacts associated with a published paper: the PDF manuscript, LaTeX source, BibTeX bibliography, Python analysis scripts, raw and processed datasets, generated figures, and pipeline metadata." },
];

// ─── FAQ ────────────────────────────────────────────────────

export const FAQ: { q: string; a: string }[] = [
  {
    q: "Are papers based on real data?",
    a: "Yes. Every empirical paper uses data downloaded from institutional-grade sources (FRED, IMF, World Bank, OECD, FMP, EODHD) at the time of generation. No synthetic or fabricated data is used. All datasets are included in the publication package with full provenance metadata.",
  },
  {
    q: "Can results be reproduced?",
    a: "Yes. Every publication package includes the complete Python source code, raw datasets, processed datasets, and configuration files needed to re-execute the analysis from scratch. Scripts are numbered in pipeline order (01_data_download.py, 02_data_preparation.py, etc.) for sequential execution.",
  },
  {
    q: "Are these papers peer reviewed?",
    a: "Yes, by an autonomous peer review agent (Popper). This agent evaluates each paper across six dimensions using a structured rubric. However, this is not equivalent to traditional peer review by domain experts. It is an AI-based quality gate that filters out methodologically weak or poorly written papers.",
  },
  {
    q: "How are research topics selected?",
    a: "Topics are generated through automated literature gap detection. The system scans recent publications in configured domain pools (e.g., financial economics, macroeconomics, monetary policy), identifies underexplored variable interactions, and formulates novel research questions. An administrator configures the domain pools and generation schedule but does not select individual topics.",
  },
  {
    q: "What is the role of the agents?",
    a: "AutoScholar uses six specialized agents, each responsible for a distinct pipeline stage: Gauss (literature gap analysis), Turing (data collection), Newton (data preparation), Fisher (empirical analysis), Euler (paper writing and LaTeX compilation), and Popper (peer validation). Agents operate sequentially with strict separation of concerns.",
  },
  {
    q: "Are all outputs equally reliable?",
    a: "No. Quality varies across papers depending on data availability, the complexity of the research question, and the suitability of automated econometric methods to the topic. The peer review score provides a relative quality signal, but readers should apply their own critical judgment, especially for papers near the acceptance threshold.",
  },
  {
    q: "What does publication mean in AutoScholar?",
    a: "Publication means the paper has passed the autonomous peer review threshold and has been assigned an ASID (AutoScholar ID), made publicly available in the journal, and deposited with its full artifact package. It does not imply endorsement by any human reviewer, editorial board, or academic institution.",
  },
  {
    q: "How should these papers be cited?",
    a: "Each paper has a BibTeX entry available on its detail page. The recommended citation format includes the AutoScholar system as the author, the paper title, the journal name (AutoScholar Journal), the ASID, and the publication date. Example: AutoScholar (2026). \"Title of Paper.\" AutoScholar Journal. ASID-2026-0001.",
  },
];

// ─── Engine Updates ─────────────────────────────────────────

export const ENGINE_UPDATES = [
  { date: "March 2026", version: "v3.2", title: "Reproducible Research Engine Overhaul", items: ["ZIP restructure with pipeline-ordered scripts (01_, 02_, ...)", "Data provenance helpers with source URL, timestamp, and license tracking", "Automatic descriptive statistics generation at download and preparation stages", "Standardized figure export at 300 DPI with journal-compliant dimensions"] },
  { date: "March 2026", version: "v3.1", title: "Web Dataset Service V3", items: ["Firecrawl integration with map, crawl, and batch scrape capabilities", "Automatic content type detection (tables, time series, cross-sectional)", "Source traceability with URL fingerprinting and retrieval metadata", "Structured extraction pipeline for tabular data from web pages"] },
  { date: "February 2026", version: "v3.0", title: "Multi-Agent Pipeline Architecture", items: ["Six-agent sequential pipeline replacing monolithic generation", "Strict separation of concerns between data, analysis, and writing agents", "Independent peer review agent with no access to generation context", "Configurable acceptance threshold with automatic rejection of weak papers"] },
  { date: "January 2026", version: "v2.5", title: "LaTeX Compilation Pipeline", items: ["XeLaTeX compilation with BibTeX citation processing", "Three professional templates: article, working paper, Econometrica-style", "Automatic figure placement and table formatting", "ASID assignment and metadata embedding in PDF"] },
  { date: "December 2025", version: "v2.0", title: "Financial Data Integration", items: ["FMP and EODHD API integration for market data", "FRED, IMF, World Bank, and OECD data connectors", "Automatic data quality checks and missing value handling", "Panel dataset construction with multi-source merging"] },
];
