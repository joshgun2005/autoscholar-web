import type { SearchResult } from "@shared/types";
import type { AgentStep } from "@/components/chat/agent-steps";

export interface SearchQuery {
  query: string;
  results?: SearchResult[];
}

export interface ToolResult {
  tool: string;
  result: unknown;
}

export interface ConversationMessage {
  question: string;
  answer: string;
}

export interface FigureBatch {
  id: string;
  figures: string[];
  output?: string;
  description?: string;
}

export interface PythonCodeEntry {
  id: string;
  code: string;
  description: string;
  timestamp: number;
  status: 'running' | 'completed' | 'error';
  error?: string;
  duration?: number;
}

export const FMP_TOOLS = [
  'get_company_profile', 'get_income_statement', 'get_balance_sheet',
  'get_cash_flow', 'get_key_metrics', 'get_financial_ratios',
  'get_stock_quote', 'get_historical_price', 'search_companies',
  'get_stock_peers', 'get_financial_news', 'get_rsi', 'get_macd',
  'get_ema', 'get_sma', 'get_adx', 'get_williams_r', 'get_cci',
  'get_stochastic', 'get_economic_calendar', 'get_earnings_calendar',
  'get_insider_trading', 'get_forex_quote', 'get_commodity_quotes',
  'get_treasury_rates', 'get_economic_indicator', 'get_earnings_surprises',
  'get_analyst_estimates', 'get_cot_report', 'get_press_releases',
  'get_dividend_history', 'get_stock_split_history', 'get_ipo_calendar',
  'create_plot', 'estimate_garch_volatility', 'calculate_var',
  'optimize_portfolio', 'analyze_risk_metrics', 'firecrawl_scrape',
  'firecrawl_crawl',
] as const;

export function resetChatState() {
  return {
    streamingAnswer: "",
    sources: [] as SearchResult[],
    searchQueries: [] as SearchQuery[],
    toolResults: [] as ToolResult[],
    agentSteps: [] as AgentStep[],
    statusMessage: "",
    currentSearchIndex: 0,
    pythonCode: "",
    monteCarloResults: null as unknown,
    optionsPricingResults: null as unknown,
    customPythonFigures: [] as FigureBatch[],
    figureRegistry: new Map<string, string>(),
    figureUrls: [] as string[],
    pythonCodeHistory: [] as PythonCodeEntry[],
  };
}
