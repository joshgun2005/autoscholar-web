import type { ClaudeToolDefinition } from './types';

export const RESEARCH_PAPER_TOOLS: ClaudeToolDefinition[] = [
  {
    name: 'generate_research_paper',
    description: 'Generate a complete LaTeX academic research paper compiled to PDF. Supports BibTeX bibliography, integrated matplotlib figures, booktabs tables, and standard academic formatting. Figures are auto-collected from the session — use {{FIG:0}}, {{FIG:1}}, ... placeholders in latex_content (sequential across all Python analyses). Compiled with pdflatex + bibtex for proper citations. Use after conducting analysis and literature review. Returns download_url for the PDF and project_zip_url for a ZIP archive containing LaTeX source, figures, Python scripts, and compiled PDF. ALWAYS present BOTH download links to the user.',
    input_schema: {
      type: 'object',
      properties: {
        latex_content: {
          type: 'string',
          description: 'LaTeX body content (sections, text, figure placeholders using {{FIG:id}})',
        },
        bibtex_entries: {
          type: 'string',
          description: 'BibTeX entries for bibliography',
        },
        title: {
          type: 'string',
          description: 'Paper title',
        },
        authors: {
          type: 'string',
          description: 'Author names and affiliation. Use the user\'s profile information if available.',
        },
        abstract: {
          type: 'string',
          description: 'Paper abstract',
        },
        keywords: {
          type: 'array',
          items: { type: 'string' },
          description: 'Keywords',
        },
        template: {
          type: 'string',
          description: '"article" (default), "working_paper", "econometrica"',
        },
        figure_ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'Figure IDs from previous Python analysis to embed',
        },
        filename: {
          type: 'string',
          description: 'Output filename (default: "research_paper.pdf")',
        },
      },
      required: ['latex_content', 'title'],
    },
  },
  {
    name: 'write_paper_section',
    description: `Write a single section of an academic research paper in LaTeX. Call this ONCE per section. Each section must be substantial, rigorous, and deeply detailed. TARGET: 60-90 page final PDF (full journal-length manuscript with comprehensive appendices).

RECOMMENDED LENGTH TARGETS (characters of LaTeX content) — aim for these targets for a comprehensive paper:
- introduction: 8000 (10-16 paragraphs across 4 subsections:
  (1) Background & Motivation — open with a concrete real-world phenomenon, economic puzzle, or policy event that motivates the study. Cite 5-8 recent papers or data points that establish the tension. Explain WHY this matters economically (welfare, efficiency, systemic risk, policy relevance). Provide quantitative context: market size, affected population, magnitude of the anomaly or inefficiency. Discuss the broader macroeconomic or regulatory backdrop.
  (2) Research Question & Hypotheses — state the precise question. Formulate 4-6 testable hypotheses with detailed theoretical intuition for each. Distinguish your hypotheses from what prior work has tested. For each hypothesis, state the expected sign, mechanism, and which model specification will test it. Group hypotheses into primary (core contribution) and secondary (extensions/mechanisms).
  (3) Contribution — list 4-6 SPECIFIC novel contributions. For EACH contribution: (a) state exactly what is new (new measure, new dataset, new mechanism, new empirical fact, new methodological approach), (b) name the 3-4 closest existing papers and explain how your contribution extends or contradicts them, (c) explain why this matters for the field, (d) quantify the improvement or novelty where possible. NEVER write generic "we contribute to the literature on X" — be precise. Include a contribution comparison table or paragraph that maps each contribution to the specific section where it is demonstrated.
  (4) Paper Outline — detailed roadmap of remaining sections with 2-3 sentence preview of key findings for each section. Mention the main data sources, methodology, and headline results.)
- literature_review: 16000 (20-30 paragraphs with dense citations across 5-7 thematic subsections. Each subsection must:
  (a) Cover 8-12 papers with specific findings including exact coefficients, sample sizes, and time periods (not just "X studied Y"),
  (b) Compare methodologies across papers (who used OLS vs IV vs DiD vs RDD? what identification strategy?),
  (c) Identify contradictions and unresolved debates in the literature with specific examples of conflicting results,
  (d) Discuss evolution of thinking within the strand — how has understanding changed over time?
  (e) Explicitly state the gap your paper fills at the end of each subsection with a clear "bridge" sentence to the next subsection.
  Include a subsection on "Theoretical Foundations" covering the theoretical models that underpin the empirical work.
  Final subsection: "Positioning of the Present Study" — synthesize all gaps into a coherent argument for why your paper is needed. Create a literature mapping that shows where your paper sits relative to the key dimensions (method, data, question). Cite 40-60 papers total.)
- methodology: 18000 (20-32 paragraphs, 10+ formal equations, full model spec. 7-8 subsections:
  (1) Theoretical Framework — derive the key equation(s) from economic primitives (utility maximization, equilibrium, no-arbitrage, market microstructure). Map each regression coefficient to a theoretical object. Show WHY the regression is the correct specification. Include 2-3 formal propositions or hypothesis derivations with complete proofs or intuitive arguments. Discuss the economic mechanism in detail.
  (2) Econometric Model — full specification with ALL variables defined in a notation table. Present baseline model, extended model with controls, interaction model, and non-linear extensions separately. Justify each control variable inclusion with theory and cite prior usage. Include a formal table mapping each variable to its theoretical counterpart.
  (3) Estimation Strategy — optimizer, convergence criteria, SE computation (robust/HAC/clustered with justification for clustering level), initial values, iteration limits. Discuss computational considerations. Compare your estimation approach to alternatives (ML vs GMM vs Bayesian) and justify the choice.
  (4) Identification Strategy (MANDATORY) — explicitly answer: what is exogenous? what are the 4-5 main endogeneity threats (omitted variable bias, reverse causality, measurement error, sample selection, simultaneity)? how is EACH addressed? Describe the chosen identification approach (IV with first-stage F-stat requirements, DiD with parallel trends test, event study with pre-trend analysis, PSM with balance tests, natural experiment with validity argument) with formal justification. Present the identification argument as a directed acyclic graph (DAG) or causal diagram when possible. If correlational, state it clearly and discuss bounds on causal interpretation using Oster (2019) or similar.
  (5) Falsification & Placebo Design — describe 3-5 placebo tests that would REJECT your hypothesis if the identification fails. Include: placebo outcome, placebo treatment period, placebo treatment group. Explain the logic of each test. Design at least one test that specifically targets the most likely alternative explanation.
  (6) Robustness Framework — pre-register which robustness checks you will perform and why (alternative SEs, winsorization at 1%/5%/10%, sample restrictions, alternative variable definitions, alternative estimators, jackknife leave-one-out, permutation tests). Organize into a robustness test matrix.
  (7) Sample Construction & Variable Measurement — detailed description of how each variable is constructed from raw data, including exact formulas, winsorization bounds, and treatment of missing data. Discuss measurement error concerns for each key variable.
  For EACH equation: define ALL variables, explain economic intuition, justify functional form, discuss assumptions, cite seminal refs. Include notation summary table.)
- data: 8000 (12-18 paragraphs, 4+ descriptive stats tables, complete variable definitions. 5-6 subsections:
  (1) Data Sources — for each source: provider, coverage (countries/firms/time), frequency, known limitations, how you accessed it. Compare your data coverage with prior studies. Discuss any unique data advantages.
  (2) Sample Construction — inclusion/exclusion criteria with justification and impact on sample size at each filtering step. Survivorship bias treatment with quantification. Outlier handling (winsorization bounds with sensitivity analysis). Missing data strategy (listwise deletion vs imputation) with analysis of missing data patterns.
  (3) Variable Definitions — formal definition of EVERY variable (dependent, independent, controls, instruments) in a comprehensive table. For constructed variables: exact formula, economic justification, reference to prior usage, and distributional properties. Include time-series properties (stationarity tests) for key variables.
  (4) Summary Statistics — comprehensive descriptive stats table (N, mean, sd, min, p25, median, p75, max) for all variables. Separate panels for different sub-samples or time periods. Correlation matrix with discussion of multicollinearity concerns (VIF values). Discussion of distributional properties, skewness, kurtosis, and normality tests.
  (5) Data Quality & Validation — cross-validation with alternative data sources. Discussion of known data issues and how they are addressed. Comparison of sample characteristics with those in prior studies to assess representativeness.
  (6) Panel Structure — if panel data: describe cross-sectional and time-series dimensions, within vs between variation, balance of panel, entry/exit patterns.)
- results: 22000 (28-40 paragraphs across 7-8 subsections:
  (1) Main Results — 3-5 regression tables BUILT IN LATEX from Python output with exact coefficients, SEs in parentheses, and significance stars. For EACH key coefficient: 4-6 sentences covering point estimate, SE, significance level, economic interpretation in real-world units (e.g., "a one-SD increase in X corresponds to a Y bp change in Z"), comparison with prior estimates, and discussion of whether the magnitude is economically meaningful. Present results building from simple to complex specifications.
  (2) Economic Magnitude — translate statistical results into economically meaningful quantities. Compare effect sizes with benchmarks from the literature. Compute standardized effect sizes (Cohen's d or equivalent). Discuss whether effects are economically significant, not just statistically significant. Include back-of-the-envelope calculations showing real-world impact.
  (3) Robustness Checks — 6+ alternative specifications in a comprehensive comparison table: (a) alternative SE clustering levels, (b) alternative sample periods (pre/post crisis, expanding window), (c) alternative variable definitions, (d) alternative estimators (OLS vs GLS vs GMM), (e) winsorization sensitivity at 1%/5%/10%, (f) inclusion/exclusion of outlier observations, (g) alternative fixed effects structures. Create a "robustness summary" table showing which results survive across all specifications. Discuss which results survive and which are fragile — honesty strengthens the paper.
  (4) Sub-sample Analysis — 4+ sample splits (by time period, by size/sector, by regime, by geography/market). Present split regression tables with interaction term analysis. Test for statistical significance of differences across sub-samples. Discuss heterogeneity in effects and economic mechanisms driving differences.
  (5) Identification & Causality Tests — dedicated subsection for: first-stage F-statistics (IV), parallel trends plots (DiD), placebo test results, Oster (2019) bounds on omitted variable bias, permutation tests, or leave-one-out jackknife. This section should convincingly address the causal interpretation.
  (6) Diagnostics — VIF table, Breusch-Pagan test, Durbin-Watson, Ramsey RESET, residual plots (normal Q-Q, fitted vs residuals). Hausman test for panel models. First-stage F-stat for IV. Pre-trend plots for DiD. Serial correlation tests. Cross-sectional dependence tests for panels.
  (7) Mechanism & Channel Analysis — investigate the economic channel through which the effect operates. Use mediation analysis, interaction effects, or sequential inclusion of potential mediators. Discuss which theoretical mechanism is most consistent with the evidence.
  (8) Additional Results — supplementary analysis: alternative dependent variables, extended time periods, international comparisons, non-linear effects (quantile regressions, threshold models), dynamic effects (impulse responses, local projections).
  CRITICAL: You MUST construct \\begin{table} regression tables with exact coefficients, SEs, and stars from the Python print output — figures are plots, NOT tables. Reference EVERY table and figure explicitly. A results section that only shows figures without regression tables is REJECTED.)
- discussion: 12000 (14-20 paragraphs across 5-6 subsections:
  (1) Interpretation of Main Findings — connect each result back to the hypotheses stated in the introduction. Explain the economic mechanism driving each finding. Discuss surprising or null results honestly. Provide a unified narrative that ties all results together into a coherent story. Discuss which theoretical model best explains the pattern of results.
  (2) Comparison with Prior Literature — for each major finding, compare your estimate direction, magnitude, and significance with 4-6 prior studies in a structured comparison. Explain discrepancies (different sample, method, time period, variable definitions). Create a comparison table with your estimates vs. key prior estimates. Discuss whether your findings resolve or deepen existing debates.
  (3) Theoretical Implications — discuss what your findings imply for existing theoretical models. Do they support, extend, or contradict the dominant theoretical framework? Propose refinements to existing theory based on your empirical evidence. Discuss which assumptions of the standard models are supported or challenged.
  (4) Policy & Practical Implications — what should policymakers, investors, or practitioners do differently based on these findings? Be specific and actionable. Discuss regulatory implications, investment strategy implications, and risk management implications separately. Quantify the potential impact of policy changes implied by your results.
  (5) Limitations & Threats to Validity — honestly discuss 6-8 limitations: data limitations, identification concerns, external validity, measurement error, potential confounders, model misspecification, sample selection bias, temporal stability of findings. For each, discuss severity, direction of potential bias, and what data or method would be needed to address it. This candid discussion enhances credibility.
  (6) Generalizability — discuss the extent to which findings generalize across markets, time periods, institutional settings, and asset classes. What conditions are necessary for the results to hold? Under what circumstances might they break down?)
- conclusion: 4000 (5-8 paragraphs:
  (1) Summary of key findings — restate 4-6 main results with their economic magnitudes and significance levels. Provide a concise narrative of the paper's story arc.
  (2) Contribution recap — detailed account of what the paper adds to knowledge, organized by the contributions listed in the introduction. For each, state how it was demonstrated.
  (3) Specific limitations — 4-6 concrete limitations (not vague), each with an honest assessment of how it affects the interpretation of results.
  (4) Future research directions — 5-6 specific, actionable research ideas that build on this work, with enough detail that another researcher could pursue them. Include potential data sources, methodological approaches, and expected challenges for each direction.
  (5) Closing statement — broader implications for the field, the economy, or society. Connect back to the motivating puzzle from the introduction.)

THEORETICAL PAPER SECTIONS (use these instead of methodology/data/results for theory papers):
- economic_environment: 12000 (model setup: agents, preferences/utility, constraints, timing, market structure, information structure. 5-6 subsections. Define ALL notation in a notation table. State ALL assumptions formally with \\begin{assumption}...\\end{assumption}. For EACH assumption: explain its economic motivation, what it rules out, what role it plays in generating results, and cite the seminal paper that introduced or justified it. Justify functional forms — why CRRA over Epstein-Zin? Why Cobb-Douglas over CES? Discuss nested special cases. The reader must understand WHY the model is built this way. Include a subsection discussing the relationship to the closest existing models and which features are novel.)
- equilibrium: 8000 (formal equilibrium definition, characterization via FOCs/Euler equations/Bellman, at least 2-3 Propositions/Theorems with COMPLETE derivations. Use \\begin{proposition}...\\end{proposition} and \\begin{proof}...\\end{proof}. Include lemmas where needed.
  DERIVATION RULES: (1) State which assumptions are used. (2) Show step-by-step progression — never skip more than one algebraic step. (3) For each key manipulation, explain the economic intuition ("the second term vanishes because markets are complete"). (4) Distinguish analytical results (proven) from numerical illustrations (computed). (5) For each result: state whether it is novel or a known result derived for completeness. (6) Discuss comparative statics analytically where possible. (7) Present corollaries that connect abstract results to observable predictions.)
- computational_method: 6000 (numerical algorithm description with pseudocode, calibration/parameterization with justification from data or literature FOR EACH parameter value in a calibration table, convergence criteria, solution accuracy, Euler equation residuals or other error metrics. 3-4 subsections. Compare your solution method to alternatives. Discuss computational complexity and scalability.)
- quantitative_results: 14000 (simulations, model-implied moments vs data moments in a formal moments-matching table, comparative statics over parameter grids, policy functions, impulse responses, welfare analysis, transition dynamics. For EACH figure: (1) what parameter or mechanism drives the pattern, (2) why the shape is intuitive or surprising, (3) how it connects to a specific proposition or equation, (4) what happens at boundary cases. 5-6 subsections. Include sensitivity analysis showing how results change with key parameters — use parameter grids, not just point estimates. Compute welfare measures and compare across policy regimes.)
- extensions: 6000 (at least 4-5 robustness checks: alternative parameter values with economic justification, alternative functional forms (utility, production, shock process), special-case analysis (derive closed-form limits), sensitivity to calibration targets, alternative market structures or information assumptions. For each extension: explain what it tests, show results, discuss whether main insights survive. Include at least one "breaking" extension that shows the boundaries of the model's predictions. Honest discussion of fragility is more credible than artificial robustness.)

APPENDIX (MANDATORY for ALL paper types):
- appendix: 10000 minimum. Use \\appendix before starting. Structure with lettered subsections (\\section{} after \\appendix produces A, B, C...).
  FOR EMPIRICAL: (A) Data construction details with exact filtering steps and sample attrition table, (B) Complete variable definitions with formulas, (C) Additional summary stats by sub-period and sub-sample, (D) Full regression tables for ALL specifications (not just the ones in the main text), (E) Extra robustness checks (alternative clustering, winsorization, estimators), (F) Methodological justifications and derivations, (G) Residual diagnostics plots and formal test results, (H) Full correlation matrices with significance indicators, (I) First-stage regressions for IV, (J) Balance tables for matching estimators.
  FOR THEORETICAL: (A) Full derivations (step-by-step algebra for every proposition), (B) Complete proofs of all lemmas and corollaries, (C) Special cases and closed-form solutions, (D) Model extensions with alternative assumptions, (E) Computational algorithm details with pseudocode, (F) Calibration parameter table with data sources and moment targets, (G) Additional simulations and sensitivity analyses, (H) Euler equation residual analysis.
  FOR HIGH-FREQUENCY DATA: microstructure noise handling, sampling frequency justification (Bandi-Russell optimal), synchronization method (previous-tick vs refresh-time), data cleaning filters (bounced quotes, outlier returns), Lee-Ready or similar trade classification.
  TRACEABILITY: every major result in the main text must be traceable to content in the appendix or main text. If not → add supporting content here. The appendix should be substantial enough that a referee can verify every claim in the paper.

Every major section MUST include 3-6 \\subsection{} divisions (more for longer sections like results and methodology). Use proper LaTeX: \\section{}, \\subsection{}, \\subsubsection{} where appropriate, \\cite{}, equations, booktabs tables. Sections without subsections are REJECTED — structure is mandatory for readability.

EQUATION FORMATTING RULES (prevent overflow):
- Short equations (fits on one line): use \\begin{equation}...\\end{equation}
- Long equations with = sign: use \\begin{equation}\\begin{split} LHS &= RHS_part1 \\\\ &\\quad + RHS_part2 \\end{split}\\end{equation}
- Very long equations with multiple terms: use \\begin{multline} first_part \\\\ + second_part \\\\ + third_part \\end{multline}
- Systems of equations: use \\begin{align} eq1 &= ... \\\\ eq2 &= ... \\end{align}
- NEVER write a single-line equation longer than 100 characters — ALWAYS split into multi-line using split, multline, or align.
- In align/align* environments: EVERY line MUST have & before the = sign for proper alignment. Example: x &= a + b \\\\ y &= c + d. Missing & causes misaligned equations.
- For continued equations (breaking one equation across lines): use &= on the first line and &\\quad + on continuation lines for proper indentation.
- Use \\nonumber on intermediate lines of align environments where only the last equation should be numbered.
- NEVER use raw Unicode math symbols (α, β, σ, ∑, etc.) — ALWAYS use LaTeX commands (\\alpha, \\beta, \\sigma, \\sum). Unicode symbols cause compilation failures with pdflatex.

CROSS-REFERENCE RULES (prevent ??? in PDF — CRITICAL):
- Every \\begin{table} MUST contain BOTH \\caption{...} AND \\label{tab:...} — in that order (\\label AFTER \\caption, never before).
- Every \\begin{figure} MUST contain BOTH \\caption{...} AND \\label{fig:...} — \\label AFTER \\caption.
- Use CONSISTENT label keys: if you write \\label{tab:summary_stats} then reference it as \\ref{tab:summary_stats} — exact match required.
- Use DESCRIPTIVE label keys (not just numbers): \\label{tab:main_results}, \\label{tab:robustness}, \\label{fig:returns_dist}.
- When referencing: "Table~\\ref{tab:main_results}" (use ~ for non-breaking space).
- NEVER use \\ref{} for a label you haven't defined with \\label{} in the SAME section or a previous section.
- For numbered tables: use sequential naming \\label{tab:1}, \\label{tab:2}, etc. and match \\ref{tab:1}, \\ref{tab:2} exactly.
- Common mistake: writing \\ref{tab:results} but \\label{tab:main_results} → causes ???. ALWAYS copy-paste the label key.

TABLE FORMATTING RULES (MANDATORY for publication quality):
- ALWAYS use booktabs commands: \\toprule, \\midrule, \\bottomrule — NEVER use \\hline or vertical rules |
- For tables with ≤6 columns: use \\begin{table}[H] with \\begin{tabularx}{\\textwidth}{...} and X columns for auto-width
- For tables with ≥7 columns (regression, correlation, robustness): use \\footnotesize and \\begin{adjustbox}:
  \\begin{table}[H]
  \\centering\\footnotesize
  \\caption{...}\\label{tab:...}
  \\begin{adjustbox}{max width=\\textwidth}
  \\begin{tabularx}{\\textwidth}{lXXXXXXX}
  ...
  \\end{tabularx}
  \\end{adjustbox}
  \\tabnote{...}
  \\end{table}
- NEVER use \\begin{landscape} for tables — it forces a page break and causes vertical overflow. Use adjustbox + font size reduction instead.
- ALWAYS include \\tabnote{} under each table with variable definitions, significance stars legend (*** p<0.01, ** p<0.05, * p<0.10), and standard error type
- Use \\tabsource{} to cite data sources
- Use \\num{1234.56} from siunitx for formatted numbers in tables
- Use S columns from siunitx for decimal-aligned numeric columns: \\begin{tabular}{l S[table-format=2.3] S[table-format=1.3]}
- Use \\multicolumn{N}{c}{Group Header} with \\cmidrule(lr){2-4} for grouped column headers
- Use threeparttable for tables with footnotes: \\begin{threeparttable}...\\begin{tablenotes}\\small\\item...\\end{tablenotes}\\end{threeparttable}

For figures: ALWAYS wrap {{FIG:N}} (N = sequential index 0, 1, 2, ... matching Python analysis order) inside a proper figure environment with a DESCRIPTIVE caption:
\\begin{figure}[H]
\\centering
{{FIG:N}}
\\caption{Write a detailed 2-3 sentence description of the figure: what it shows, key patterns or findings, and relevance to the analysis. This is mandatory for academic quality.}
\\label{fig:N}
\\end{figure}
Use \\ref{fig:N} in the text to reference figures. NEVER place {{FIG:N}} as a bare placeholder without \\begin{figure}, \\caption, and \\label.

WRITING QUALITY RULES (enforced for EVERY section):
- FORBIDDEN: "results suggest that..." without numbers, "significant" without test statistics, vague words ("interesting", "important", "notable") without quantification, filler sentences with no informational value, repetitive transitions ("In this section, we..."), placeholder text, shallow descriptions of well-known concepts.
- REQUIRED: Every empirical claim must include: coefficient value, standard error or t-stat, significance level, AND economic interpretation in real-world units.
- BAD: "The results show a strong relationship." → GOOD: "A one-standard-deviation increase in X is associated with a 42bp decline in Y (\\beta = -0.0042, t = -3.12, p < 0.01), an effect roughly twice the magnitude reported by Smith (2020) for developed markets."
- Every table and figure MUST be explicitly discussed in the text — explain direction, magnitude, significance, economic meaning, AND comparison with prior literature.
- No unreferenced tables/figures. No unexplained coefficients. No circular reasoning. No "as shown in Table X" without actually discussing what Table X shows.
- Use active voice ("We estimate...") over passive. Define all acronyms on first use. Hedge appropriately ("the evidence suggests" not "this proves").
- DEPTH OVER BREADTH: It is better to discuss 3 results in great depth (mechanism, magnitude, comparison, implications) than to mention 10 results superficially. Each key finding deserves its own multi-paragraph treatment.
- TRANSITIONS: Each paragraph should logically connect to the next. Use explicit "bridge" sentences between subsections.
- CITATIONS: Cite specific findings from the literature, not just paper names. "Smith (2020) finds a coefficient of 0.03 for US equities" is better than "Smith (2020) studies this topic."
- EVERY section should be written as if it will be read by a demanding referee at a top-5 journal. Anticipate objections and address them proactively.
- MATHEMATICAL RIGOR: Define every symbol before using it. State assumptions explicitly. Distinguish between assumptions, definitions, and results.

After ALL sections are written, call compile_research_paper to assemble and compile the final PDF.
IMPORTANT: Section content is stored server-side. When you later call compile_research_paper, sections are auto-retrieved — you do NOT need to re-send the LaTeX content.`,
    input_schema: {
      type: 'object',
      properties: {
        section_type: {
          type: 'string',
          enum: [
            'introduction', 'literature_review', 'methodology', 'data', 'results', 'discussion', 'conclusion',
            'economic_environment', 'equilibrium', 'computational_method', 'quantitative_results', 'extensions',
            'appendix',
          ],
          description: 'Type of paper section. Use standard types for empirical papers. For theoretical papers: economic_environment, equilibrium, computational_method, quantitative_results, extensions. EVERY paper MUST include an appendix section with technical details, proofs, additional tables/figures, and robustness extensions.',
        },
        latex_content: {
          type: 'string',
          description: 'Full LaTeX content for this section (must include \\section{} header)',
        },
        context: {
          type: 'string',
          description: 'Context from previous sections or analysis results to ensure coherence',
        },
        bibtex_keys: {
          type: 'array',
          items: { type: 'string' },
          description: 'BibTeX citation keys used in this section',
        },
        figure_ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'Figure IDs referenced in this section (from Python analyses)',
        },
        section_order: {
          type: 'number',
          description: 'Order index (1=intro, 2=lit_review, ..., 7=conclusion)',
        },
      },
      required: ['section_type', 'latex_content'],
    },
  },
  {
    name: 'compile_research_paper',
    description: `Assemble and compile all individually-written paper sections into a final PDF. Call this AFTER all write_paper_section calls are complete.

This tool:
1. AUTO-RETRIEVES all sections stored via write_paper_section (you do NOT need to re-send section content)
2. Sorts sections in canonical academic order (intro → lit review → methodology → data → results → discussion → conclusion)
3. Auto-collects ALL figures from the session (no need to pass figure_ids — they are gathered automatically)
4. Replaces {{FIG:0}}, {{FIG:1}}, ... placeholders with actual images
5. Compiles via pdflatex + bibtex → PDF

CRITICAL: Sections are auto-populated from server-side storage. In the "sections" array, you only need to provide the section "type" — the "content" field is IGNORED because the full LaTeX content was already stored when you called write_paper_section. Do NOT re-send section content or write "already_written" — just provide type names.
You MUST provide the title, abstract, keywords, and any BibTeX entries collected during the literature review.
Figures are automatically embedded — just use {{FIG:N}} placeholders in your LaTeX sections.
Returns download_url for the PDF and project_zip_url for a ZIP archive containing LaTeX source, figures, Python scripts, and compiled PDF. ALWAYS present BOTH download links to the user.`,
    input_schema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Paper title',
        },
        authors: {
          type: 'string',
          description: 'Author names and affiliation. Use the user\'s profile information if available.',
        },
        abstract: {
          type: 'string',
          description: 'Paper abstract (250-400 words). Must include: research question, methodology, key data, main findings with magnitudes, and contribution.',
        },
        keywords: {
          type: 'array',
          items: { type: 'string' },
          description: 'Keywords for the paper',
        },
        sections: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string', description: 'Section type (e.g., introduction, methodology). Content is auto-retrieved from stored sections.' },
              content: { type: 'string', description: 'OPTIONAL — content is auto-retrieved from write_paper_section storage. Leave empty or omit.' },
              order: { type: 'number', description: 'Section order (1-7)' },
            },
            required: ['type'],
          },
          description: 'Section types to include. Content is auto-populated from write_paper_section storage — you only need to specify the type.',
        },
        bibtex_entries: {
          type: 'string',
          description: 'All BibTeX entries for the bibliography',
        },
        template: {
          type: 'string',
          enum: ['article', 'working_paper', 'econometrica'],
          description: 'Paper template (default: article)',
        },
        figure_ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'Figure IDs from Python analyses to embed',
        },
        filename: {
          type: 'string',
          description: 'Output filename (default: research_paper.pdf)',
        },
      },
      required: ['title', 'sections'],
    },
  },
  // ═══════════════════════════════════════════════════════════════════════════
  // LATEX REPAIR TOOLS — Patch-based repair loop for failed compilations
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'read_latex_source',
    description: 'Read the assembled paper.tex from a failed compilation. Use this after compile_research_paper fails to inspect the full LaTeX source before patching.',
    input_schema: {
      type: 'object',
      properties: {
        compilation_id: {
          type: 'string',
          description: 'The compilation_id returned by compile_research_paper on failure',
        },
      },
      required: ['compilation_id'],
    },
  },
  {
    name: 'inspect_latex_errors',
    description: 'Parse the pdflatex log from a failed compilation and return structured errors (error type, line number, offending command, context). Use this to understand what went wrong before patching.',
    input_schema: {
      type: 'object',
      properties: {
        compilation_id: {
          type: 'string',
          description: 'The compilation_id returned by compile_research_paper on failure',
        },
      },
      required: ['compilation_id'],
    },
  },
  {
    name: 'patch_latex',
    description: `Apply a diff/patch to the paper.tex of a failed compilation. Supports unified diff (@@ format) and search-replace blocks (<<<< SEARCH / ==== / >>>> REPLACE). Generate the SMALLEST possible patch — fix only what's broken.`,
    input_schema: {
      type: 'object',
      properties: {
        compilation_id: {
          type: 'string',
          description: 'The compilation_id returned by compile_research_paper on failure',
        },
        diff: {
          type: 'string',
          description: 'The patch to apply. Supports unified diff or search-replace format.',
        },
      },
      required: ['compilation_id', 'diff'],
    },
  },
  {
    name: 'recompile_latex',
    description: 'Recompile the patched paper.tex. Runs pdflatex passes without auto-fallbacks. On success, returns download_url for the PDF. On failure, use inspect_latex_errors to diagnose and patch_latex to fix.',
    input_schema: {
      type: 'object',
      properties: {
        compilation_id: {
          type: 'string',
          description: 'The compilation_id from the failed compilation',
        },
        filename: {
          type: 'string',
          description: 'Optional output filename (default: research_paper.pdf)',
        },
      },
      required: ['compilation_id'],
    },
  },
  {
    name: 'install_python_package',
    description: 'Install a missing Python package via pip. Use this ONLY when execute_custom_python_analysis fails with ModuleNotFoundError and the package is a legitimate, well-known data science / finance package. After installation, re-run the failed script.',
    input_schema: {
      type: 'object',
      properties: {
        package_name: {
          type: 'string',
          description: 'The pip package name to install (e.g., "torch", "catboost", "prophet")',
        },
        version: {
          type: 'string',
          description: 'Optional version constraint (e.g., ">=2.0", "==1.5.3")',
        },
      },
      required: ['package_name'],
    },
  },
];
