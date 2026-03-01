import { useState, useRef, useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useChatMutation } from "./useChatMutation";
import { useAnalytics } from "./useAnalytics";
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

const FMP_TOOLS = [
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

function resetChatState() {
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
  };
}

const SESSION_STORAGE_KEY = 'vquant_active_session';

export function useChatSession() {
  const queryClient = useQueryClient();

  // ─── Session state ──────────────────────────────────────
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(() => {
    // Restore session ID from sessionStorage on mount
    try { return sessionStorage.getItem(SESSION_STORAGE_KEY); } catch { return null; }
  });
  const [historyOpen, setHistoryOpen] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState("");

  // ─── Chat response state ────────────────────────────────
  const [streamingAnswer, setStreamingAnswer] = useState("");
  const [sources, setSources] = useState<SearchResult[]>([]);
  const [searchQueries, setSearchQueries] = useState<SearchQuery[]>([]);
  const [toolResults, setToolResults] = useState<ToolResult[]>([]);
  const [agentSteps, setAgentSteps] = useState<AgentStep[]>([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [pythonCode, setPythonCode] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Python executor returns untyped JSON
  const [monteCarloResults, setMonteCarloResults] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [optionsPricingResults, setOptionsPricingResults] = useState<any>(null);
  const [customPythonFigures, setCustomPythonFigures] = useState<FigureBatch[]>([]);
  const [figureRegistry, setFigureRegistry] = useState<Map<string, string>>(new Map());
  const [figureUrls, setFigureUrls] = useState<string[]>([]);
  const resultsRef = useRef<HTMLDivElement>(null);

  // ─── Persist session ID ─────────────────────────────────
  useEffect(() => {
    try {
      if (currentSessionId) {
        sessionStorage.setItem(SESSION_STORAGE_KEY, currentSessionId);
      } else {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
      }
    } catch { /* sessionStorage unavailable */ }
  }, [currentSessionId]);

  // ─── Auth ───────────────────────────────────────────────
  const { data: authData } = useQuery<{ user: { id: string; displayName: string } | null }>({
    queryKey: ['/api/auth/me'],
  });
  const currentUser = authData?.user ?? null;

  // ─── SSE event handler ──────────────────────────────────
  const chatMutation = useChatMutation((event) => {
    switch (event.type) {
      case 'text':
        setStreamingAnswer(prev => prev + event.content);
        break;
      case 'retry':
        // Server is retrying after ECONNRESET — discard partial text from failed attempt
        if (event.discardLength > 0) {
          setStreamingAnswer(prev => prev.substring(0, prev.length - event.discardLength));
        }
        break;
      case 'sources':
        setSources(event.sources);
        break;
      case 'done':
        if (event.sessionId && !currentSessionId) {
          setCurrentSessionId(event.sessionId);
        }
        break;
      case 'status':
        setStatusMessage(event.message);
        break;
      case 'search_queries':
        setSearchQueries(event.queries.map((q: string) => ({ query: q })));
        setStatusMessage(event.message);
        break;
      case 'search_progress':
        setCurrentSearchIndex(event.index);
        setStatusMessage(`Search ${event.index}/${event.total}: ${event.query}`);
        break;
      case 'search_result':
        setSearchQueries(prev => {
          const updated = [...prev];
          if (updated[event.index - 1]) {
            updated[event.index - 1].results = event.results;
          }
          return updated;
        });
        break;
      case 'tool_start':
        setAgentSteps(prev => [...prev, {
          tool: event.tool,
          status: 'running',
          input: event.input,
        }]);
        break;
      case 'tool_complete':
        setAgentSteps(prev => prev.map(step =>
          step.tool === event.tool && step.status === 'running'
            ? { ...step, status: 'completed', duration: event.duration }
            : step,
        ));
        break;
      case 'tool_error':
        setAgentSteps(prev => prev.map(step =>
          step.tool === event.tool && step.status === 'running'
            ? { ...step, status: 'error', error: event.error }
            : step,
        ));
        break;
      case 'python_code':
        setPythonCode(event.code);
        break;
      case 'custom_python_figures': {
        const figId = event.figureId || `fig-${Date.now()}`;
        const isPlotTool = figId.startsWith('plot-');

        if (!isPlotTool) {
          setCustomPythonFigures(prev => [...prev, {
            id: figId,
            figures: event.figures || [],
            output: event.output,
            description: event.description,
          }]);
        }

        const urls = event.figureUrls || event.figures || [];
        if (urls.length > 0) {
          setFigureRegistry(prev => {
            const next = new Map(prev);
            urls.forEach((url: string, idx: number) => next.set(`${figId}-${idx}`, url));
            return next;
          });
          setFigureUrls(prev => [...prev, ...urls]);
        }
        break;
      }
      case 'tool_result':
        if (event.tool === 'run_monte_carlo_simulation') {
          setMonteCarloResults(event.result);
        } else if (event.tool === 'calculate_options_price') {
          setOptionsPricingResults(event.result);
        } else if (FMP_TOOLS.includes(event.tool)) {
          setToolResults(prev => [...prev, { tool: event.tool, result: event.result }]);
        }
        break;
    }
  });

  // ─── Analytics ──────────────────────────────────────────
  const analyticsStatus = chatMutation.isPending ? 'generating' : chatMutation.isError ? 'error' : 'idle';
  useAnalytics(analyticsStatus, chatMutation.isPending ? currentQuestion : undefined);

  // ─── Derived state ──────────────────────────────────────
  const hasSearched = streamingAnswer.length > 0 || chatMutation.isPending || chatMutation.isError || searchQueries.length > 0;

  // ─── Actions ────────────────────────────────────────────
  const clearResponseState = useCallback(() => {
    setStreamingAnswer("");
    setSources([]);
    setSearchQueries([]);
    setToolResults([]);
    setAgentSteps([]);
    setStatusMessage("");
    setCurrentSearchIndex(0);
    setPythonCode("");
    setMonteCarloResults(null);
    setOptionsPricingResults(null);
    setCustomPythonFigures([]);
    setFigureRegistry(new Map());
    setFigureUrls([]);
  }, []);

  const handleSearch = useCallback((query: string, imageData?: string, imageMimeType?: string) => {
    if (currentQuestion && streamingAnswer) {
      setConversationHistory(prev => [...prev, {
        question: currentQuestion,
        answer: streamingAnswer,
      }]);
    }

    setCurrentQuestion(query);
    clearResponseState();

    chatMutation.mutate({
      query,
      history: currentQuestion && streamingAnswer
        ? [...conversationHistory, { question: currentQuestion, answer: streamingAnswer }]
        : conversationHistory,
      sessionId: currentSessionId || undefined,
      imageData,
      imageMimeType,
    });
  }, [currentQuestion, streamingAnswer, conversationHistory, currentSessionId, clearResponseState, chatMutation]);

  const handleRetry = useCallback(() => {
    chatMutation.reset();
    clearResponseState();
  }, [chatMutation, clearResponseState]);

  const handleNewConversation = useCallback(() => {
    setCurrentSessionId(null);
    setConversationHistory([]);
    setCurrentQuestion("");
    clearResponseState();
    chatMutation.reset();
    try { sessionStorage.removeItem(SESSION_STORAGE_KEY); } catch { /* noop */ }
  }, [clearResponseState, chatMutation]);

  const handleLogout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    queryClient.invalidateQueries({ queryKey: ['/api/sessions'] });
  }, [queryClient]);

  const handleLoadSession = useCallback(async (sessionId: string) => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}`);
      if (!response.ok) return;
      const session = await response.json();
      setCurrentSessionId(session.sessionId);
      if (session.messages) {
        const msgs = typeof session.messages === 'string' ? JSON.parse(session.messages) : session.messages;
        setConversationHistory(msgs.map((m: { question?: string; answer?: string }) => ({
          question: m.question || '',
          answer: m.answer || '',
        })));
      }
      setHistoryOpen(false);
    } catch (error) {
      console.error('Failed to load session:', error);
    }
  }, []);

  return {
    // Auth
    currentUser,
    handleLogout,

    // Session
    currentSessionId,
    historyOpen,
    setHistoryOpen,
    handleLoadSession,

    // Chat state
    conversationHistory,
    currentQuestion,
    streamingAnswer,
    sources,
    searchQueries,
    toolResults,
    agentSteps,
    statusMessage,
    currentSearchIndex,
    pythonCode,
    monteCarloResults,
    optionsPricingResults,
    customPythonFigures,
    figureRegistry,
    figureUrls,
    resultsRef,

    // Mutation state
    chatMutation,
    hasSearched,

    // Actions
    handleSearch,
    handleRetry,
    handleNewConversation,
  };
}
