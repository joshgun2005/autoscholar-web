import type { ToolResult, PythonCodeEntry, CustomPythonFigure } from "./types";

// ── Tool -> Agent mapping (Sets) ────────────────────────────

export const GAUSS_TOOLS = new Set([
  "academic_search", "academic_literature_review", "academic_search_multi",
  "arxiv_search", "crossref_lookup", "openalex_search",
  "literature_gap_finder",
]);

export const TURING_TOOLS = new Set([
  "get_company_profile", "get_income_statement", "get_balance_sheet", "get_cash_flow",
  "get_key_metrics", "get_financial_ratios", "get_stock_quote", "get_historical_price",
  "search_companies", "get_stock_peers", "get_financial_news",
  "get_rsi", "get_macd", "get_ema", "get_sma", "get_adx", "get_williams_r", "get_cci", "get_stochastic",
  "get_economic_calendar", "get_treasury_rates", "get_economic_indicator",
  "get_earnings_calendar", "get_earnings_surprises", "get_analyst_estimates",
  "get_insider_trading", "get_forex_quote", "get_commodity_quotes",
  "get_option_chain", "get_option_prices", "get_option_greeks",
  "get_crypto_quote", "get_forex_historical", "get_forex_list",
  "download_fmp_data", "get_eodhd_eod", "get_eodhd_intraday", "get_eodhd_options",
  "get_wb_indicator_data", "get_wb_countries", "search_wb_indicators",
  "get_imf_indicator_data", "get_imf_indicators",
  "get_oecd_data", "search_oecd_dataflows",
  "web_search_exa", "get_contents_exa",
  "firecrawl_scrape", "firecrawl_search", "firecrawl_crawl", "firecrawl_extract",
  "tavily_search", "tavily_extract", "tavily_crawl", "tavily_research",
  "web_dataset_collector",
  "search_symbol", "search_name", "search_exchange_variants",
  "get_polymarket_events", "get_polymarket_markets", "search_polymarket",
  "get_stock_screener", "get_market_hours", "get_etf_holdings",
  "get_press_releases", "get_dividend_history", "get_stock_split_history",
  "get_ipo_calendar", "get_intraday_price", "get_price_target",
  "get_institutional_holders", "get_esg_score", "get_social_sentiment",
  "get_congressional_trading", "get_senate_trading",
  "get_cot_report", "get_cot_analysis",
]);

export const EULER_TOOLS = new Set([
  "generate_research_paper", "write_paper_section", "compile_research_paper",
  "read_latex_source", "inspect_latex_errors", "patch_latex", "recompile_latex",
]);

export const PYTHON_TOOLS = new Set([
  "execute_custom_python_analysis", "run_python_script", "read_python_script",
  "apply_patch", "inspect_python_logs", "install_python_package",
  "create_plot", "calculate_var", "optimize_portfolio", "analyze_risk_metrics",
  "estimate_garch_volatility",
]);

// ── Tool category labels (for nicer display) ──

export const TOOL_CATEGORY: Record<string, { label: string; color: string }> = {
  academic_search: { label: "Academic Search", color: "violet" },
  arxiv_search: { label: "arXiv", color: "violet" },
  crossref_lookup: { label: "CrossRef", color: "violet" },
  openalex_search: { label: "OpenAlex", color: "violet" },
  literature_gap_finder: { label: "Gap Finder", color: "purple" },
  academic_literature_review: { label: "Literature Review", color: "violet" },
  academic_search_multi: { label: "Multi-Search", color: "violet" },
  firecrawl_scrape: { label: "Firecrawl Scrape", color: "orange" },
  firecrawl_search: { label: "Firecrawl Search", color: "orange" },
  firecrawl_crawl: { label: "Firecrawl Crawl", color: "orange" },
  firecrawl_extract: { label: "Firecrawl Extract", color: "orange" },
  tavily_search: { label: "Tavily Search", color: "orange" },
  web_search_exa: { label: "Exa Search", color: "orange" },
  web_dataset_collector: { label: "Web Dataset", color: "orange" },
  execute_custom_python_analysis: { label: "Python Analysis", color: "emerald" },
  run_python_script: { label: "Python Script", color: "emerald" },
  create_plot: { label: "Plot", color: "blue" },
  calculate_var: { label: "VaR", color: "rose" },
  optimize_portfolio: { label: "Portfolio Opt.", color: "rose" },
  analyze_risk_metrics: { label: "Risk Metrics", color: "rose" },
  estimate_garch_volatility: { label: "GARCH", color: "rose" },
  generate_research_paper: { label: "Generate Paper", color: "rose" },
  write_paper_section: { label: "Write Section", color: "rose" },
  compile_research_paper: { label: "Compile LaTeX", color: "rose" },
  read_latex_source: { label: "Read LaTeX", color: "rose" },
  patch_latex: { label: "Patch LaTeX", color: "rose" },
  recompile_latex: { label: "Recompile", color: "rose" },
};

// ── Classifier functions ────────────────────────────────────

export function classifyTools(toolResults: ToolResult[]): {
  gauss: ToolResult[];
  turing: ToolResult[];
  newton: ToolResult[];
  fisher: ToolResult[];
  euler: ToolResult[];
} {
  const gauss: ToolResult[] = [];
  const turing: ToolResult[] = [];
  const newton: ToolResult[] = [];
  const fisher: ToolResult[] = [];
  const euler: ToolResult[] = [];
  let pythonCount = 0;

  for (const tr of toolResults) {
    if (GAUSS_TOOLS.has(tr.tool)) gauss.push(tr);
    else if (TURING_TOOLS.has(tr.tool)) turing.push(tr);
    else if (EULER_TOOLS.has(tr.tool)) euler.push(tr);
    else if (PYTHON_TOOLS.has(tr.tool)) {
      pythonCount++;
      if (pythonCount <= 2) newton.push(tr);
      else fisher.push(tr);
    } else {
      turing.push(tr);
    }
  }
  return { gauss, turing, newton, fisher, euler };
}

export function classifyCodeEntries(entries: PythonCodeEntry[]): { newton: PythonCodeEntry[]; fisher: PythonCodeEntry[] } {
  const newton: PythonCodeEntry[] = [];
  const fisher: PythonCodeEntry[] = [];
  entries.forEach((e, i) => { if (i < 2) newton.push(e); else fisher.push(e); });
  return { newton, fisher };
}

export function classifyFigures(figures: CustomPythonFigure[]): { newton: CustomPythonFigure[]; fisher: CustomPythonFigure[] } {
  const newton: CustomPythonFigure[] = [];
  const fisher: CustomPythonFigure[] = [];
  figures.forEach((f, i) => { if (i < 2) newton.push(f); else fisher.push(f); });
  return { newton, fisher };
}

// ── Pipeline stage constants ────────────────────────────────

export const CHECKPOINT_STAGE_LABELS: Record<string, string> = {
  none: "Not started",
  researching: "Research (Gauss/Turing)",
  analyzing: "Analysis (Newton/Fisher)",
  drafting: "Drafting (Euler)",
};

export const ACTIVE_STATUSES = new Set(["queued", "researching", "analyzing", "drafting", "validating"]);

export const STATUS_TO_STAGE_IDX: Record<string, number> = {
  queued: -1, researching: 1, analyzing: 3, drafting: 4, validating: 5,
  published: 6, rejected: 6, failed: -2,
};

export const PIPELINE_STAGES = [
  { key: "gauss",  label: "GAUSS",  subtitle: "Literature Discovery", icon: "Search",     color: "violet" },
  { key: "turing", label: "TURING", subtitle: "Data Collection",      icon: "Database",   color: "blue" },
  { key: "newton", label: "NEWTON", subtitle: "Dataset Prep",         icon: "BarChart3",  color: "cyan" },
  { key: "fisher", label: "FISHER", subtitle: "Empirical Analysis",   icon: "Microscope", color: "indigo" },
  { key: "euler",  label: "EULER",  subtitle: "Paper Synthesis",      icon: "FileText",   color: "rose" },
  { key: "popper", label: "POPPER", subtitle: "Peer Review",          icon: "Shield",     color: "amber" },
] as const;
