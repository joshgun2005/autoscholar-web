import { useState, useRef } from "react";
import { SearchBar } from "@/components/search-bar";
import { EmptyState } from "@/components/empty-state";
import { StreamingAnswer } from "@/components/streaming-answer";
import { ToolResults } from "@/components/tool-results";
import { AgentSteps, type AgentStep } from "@/components/agent-steps";
import { MonteCarloResults } from "@/components/monte-carlo-results";
import { OptionsPricingCard } from "@/components/financial/options-pricing-card";
import { CustomPythonFigure } from "@/components/custom-python-figure";
import { ResultCard } from "@/components/result-card";
import { Footer } from "@/components/footer";
import { SearchingWidget } from "@/components/searching-widget";
import { ErrorState } from "@/components/error-state";
import { ThemeToggle } from "@/components/theme-toggle";
import { ThemeColorPicker } from "@/components/theme-color-picker";
import { ShareButton } from "@/components/share-button";
import { DownloadButtons } from "@/components/download-buttons";
import { ConversationHistory } from "@/components/conversation-history";
import { SessionHistory } from "@/components/session-history";
import { MarketTicker } from "@/components/market-ticker";
import { Sparkles, BookOpen, Plus, Users, User, History, LogOut } from "lucide-react";
import { useChatMutation } from "@/hooks/useChatMutation";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { SearchResult } from "@shared/schema";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface SearchQuery {
  query: string;
  results?: SearchResult[];
}

interface ToolResult {
  tool: string;
  result: any;
}

interface ConversationMessage {
  question: string;
  answer: string;
}

export default function Home() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  // Auth state
  const { data: authData } = useQuery<{ user: { id: string; displayName: string } | null }>({
    queryKey: ['/api/auth/me'],
  });
  const currentUser = authData?.user ?? null;

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    queryClient.invalidateQueries({ queryKey: ['/api/sessions'] });
  };

  const handleLoadSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}`);
      if (!response.ok) return;
      const session = await response.json();
      setCurrentSessionId(session.sessionId);
      if (session.messages) {
        const msgs = typeof session.messages === 'string' ? JSON.parse(session.messages) : session.messages;
        const history = msgs.map((m: any) => ({
          question: m.question || '',
          answer: m.answer || '',
        }));
        setConversationHistory(history);
      }
      setHistoryOpen(false);
    } catch (error) {
      console.error('Failed to load session:', error);
    }
  };
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [streamingAnswer, setStreamingAnswer] = useState("");
  const [sources, setSources] = useState<SearchResult[]>([]);
  const [searchQueries, setSearchQueries] = useState<SearchQuery[]>([]);
  const [toolResults, setToolResults] = useState<ToolResult[]>([]);
  const [agentSteps, setAgentSteps] = useState<AgentStep[]>([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [pythonCode, setPythonCode] = useState<string>("");
  const [monteCarloResults, setMonteCarloResults] = useState<any>(null);
  const [optionsPricingResults, setOptionsPricingResults] = useState<any>(null);
  const [customPythonFigures, setCustomPythonFigures] = useState<Array<{ id: string; figures: string[]; output?: string; description?: string }>>([]);
  const [figureRegistry, setFigureRegistry] = useState<Map<string, string>>(new Map());
  const [figureUrls, setFigureUrls] = useState<string[]>([]); // Store actual URLs for markdown replacement
  const resultsRef = useRef<HTMLDivElement>(null);

  const chatMutation = useChatMutation((event) => {
    if (event.type === 'text') {
      setStreamingAnswer(prev => prev + event.content);
    } else if (event.type === 'sources') {
      setSources(event.sources);
    } else if (event.type === 'done') {
      // Capture sessionId from done event
      if (event.sessionId && !currentSessionId) {
        setCurrentSessionId(event.sessionId);
      }
    } else if (event.type === 'status') {
      setStatusMessage(event.message);
    } else if (event.type === 'search_queries') {
      const queries = event.queries.map((q: string) => ({ query: q }));
      setSearchQueries(queries);
      setStatusMessage(event.message);
    } else if (event.type === 'search_progress') {
      setCurrentSearchIndex(event.index);
      setStatusMessage(`🔍 Search ${event.index}/${event.total}: ${event.query}`);
    } else if (event.type === 'search_result') {
      setSearchQueries(prev => {
        const updated = [...prev];
        if (updated[event.index - 1]) {
          updated[event.index - 1].results = event.results;
        }
        return updated;
      });
    } else if (event.type === 'tool_start') {
      // Add a new step in running state
      setAgentSteps(prev => [...prev, {
        tool: event.tool,
        status: 'running',
        input: event.input
      }]);
    } else if (event.type === 'tool_complete') {
      // Update the step to completed
      setAgentSteps(prev => prev.map(step =>
        step.tool === event.tool && step.status === 'running'
          ? { ...step, status: 'completed', duration: event.duration }
          : step
      ));
    } else if (event.type === 'tool_error') {
      // Update the step to error
      setAgentSteps(prev => prev.map(step =>
        step.tool === event.tool && step.status === 'running'
          ? { ...step, status: 'error', error: event.error }
          : step
      ));
    } else if (event.type === 'python_code') {
      console.log('Received Python code event, length:', event.code?.length || 0);
      setPythonCode(event.code);
    } else if (event.type === 'custom_python_figures') {
      console.log('Received custom Python figures event, count:', event.figures?.length || 0, 'id:', event.figureId);

      const figId = event.figureId || `fig-${Date.now()}`;
      const isPlotTool = figId.startsWith('plot-');

      // Add to gallery only for custom Python figures (not standalone create_plot)
      if (!isPlotTool) {
        const newFigureBatch = {
          id: figId,
          figures: event.figures || [],
          output: event.output,
          description: event.description
        };
        setCustomPythonFigures(prev => [...prev, newFigureBatch]);
      }

      // Always update figure URLs for markdown correction (both plot and custom python)
      const urls = event.figureUrls || event.figures || [];
      if (urls.length > 0) {
        setFigureRegistry(prev => {
          const newRegistry = new Map(prev);
          urls.forEach((url: string, idx: number) => {
            newRegistry.set(`${figId}-${idx}`, url);
          });
          return newRegistry;
        });
        setFigureUrls(prev => [...prev, ...urls]);
      }
    } else if (event.type === 'tool_result') {
      const fmpTools = [
        'get_company_profile',
        'get_income_statement',
        'get_balance_sheet',
        'get_cash_flow',
        'get_key_metrics',
        'get_financial_ratios',
        'get_stock_quote',
        'get_historical_price',
        'search_companies',
        'get_stock_peers',
        'get_financial_news',
        'get_rsi',
        'get_macd',
        'get_ema',
        'get_sma',
        'get_adx',
        'get_williams_r',
        'get_cci',
        'get_stochastic',
        'get_economic_calendar',
        'get_earnings_calendar',
        'get_insider_trading',
        'get_forex_quote',
        'get_commodity_quotes',
        'get_treasury_rates',
        'get_economic_indicator',
        'get_earnings_surprises',
        'get_analyst_estimates',
        'get_cot_report',
        'get_press_releases',
        'get_dividend_history',
        'get_stock_split_history',
        'get_ipo_calendar',
        'create_plot',
        'estimate_garch_volatility',
        'calculate_var',
        'optimize_portfolio',
        'analyze_risk_metrics',
        'firecrawl_scrape',
        'firecrawl_crawl'
      ];
      
      if (event.tool === 'run_monte_carlo_simulation') {
        console.log('Monte Carlo tool_result event:', event.result);
        setMonteCarloResults(event.result);
      } else if (event.tool === 'calculate_options_price') {
        console.log('Options pricing tool_result event:', event.result);
        setOptionsPricingResults(event.result);
      } else if (fmpTools.includes(event.tool)) {
        setToolResults(prev => [...prev, { tool: event.tool, result: event.result }]);
      }
    }
  });

  // Track analytics - send heartbeat based on generation status
  const analyticsStatus = chatMutation.isPending ? 'generating' : chatMutation.isError ? 'error' : 'idle';
  useAnalytics(analyticsStatus, chatMutation.isPending ? currentQuestion : undefined);

  const hasSearched = streamingAnswer.length > 0 || chatMutation.isPending || chatMutation.isError || searchQueries.length > 0;

  const handleSearch = (query: string, imageData?: string, imageMimeType?: string) => {
    // Save current Q&A to history if exists
    if (currentQuestion && streamingAnswer) {
      setConversationHistory(prev => [...prev, {
        question: currentQuestion,
        answer: streamingAnswer
      }]);
    }

    setCurrentQuestion(query);
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

    // Send with conversation history, sessionId, and optional image
    chatMutation.mutate({
      query,
      history: currentQuestion && streamingAnswer ? [
        ...conversationHistory,
        { question: currentQuestion, answer: streamingAnswer }
      ] : conversationHistory,
      sessionId: currentSessionId || undefined,
      imageData,
      imageMimeType,
    });
  };

  const handleRetry = () => {
    chatMutation.reset();
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
  };

  const handleNewConversation = () => {
    setCurrentSessionId(null);
    setConversationHistory([]);
    setCurrentQuestion("");
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
    chatMutation.reset();
  };


  return (
    <div className="flex flex-col h-screen bg-background relative overflow-hidden" data-testid="page-home">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        {/* Gradient Orbs */}
        <div className="absolute top-0 -left-40 w-96 h-96 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl animate-float" />
        <div className="absolute top-1/4 right-0 w-80 h-80 bg-gradient-to-br from-slate-500/15 to-blue-500/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s', animationDuration: '8s' }} />
        <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s', animationDuration: '10s' }} />
        <div className="absolute bottom-1/4 right-1/3 w-64 h-64 bg-gradient-to-br from-blue-400/15 to-slate-500/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s', animationDuration: '12s' }} />

        {/* Subtle Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_80%)]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/20 backdrop-blur-xl bg-background/80 shadow-lg shadow-primary/5" data-testid="header-main">
        <div className="container flex h-20 items-center justify-between px-6">
          <div className="group cursor-pointer" data-testid="logo-container">
            <div className="relative flex items-center gap-3 px-3 md:px-4 py-2.5 rounded-2xl bg-gradient-to-br from-primary/20 via-blue-500/20 to-purple-500/20 backdrop-blur-md border-2 border-primary/40 shadow-lg shadow-primary/20 group-hover:scale-105 group-hover:border-primary/60 transition-all duration-300">
              {/* Logo Icon */}
              <div className="relative">
                <Sparkles className="w-7 h-7 text-primary animate-pulse-glow drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" data-testid="logo-icon" />
                <div className="absolute inset-0 blur-xl bg-primary/60 -z-10" />
              </div>
              {/* Logo Text - Hidden on mobile, visible on desktop */}
              <div className="hidden md:flex flex-col">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg font-bold bg-gradient-to-r from-primary via-blue-500 to-purple-500 bg-clip-text text-transparent leading-tight">
                    VibeQuant
                  </span>
                  <span className="text-[10px] font-medium text-muted-foreground/60 leading-none">
                    v 2.2026.02.06
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground/80 leading-none -mt-0.5">
                  AI Financial
                </span>
              </div>
              <div className="absolute inset-0 blur-2xl bg-gradient-to-br from-primary/30 via-blue-500/30 to-purple-500/30 -z-10 rounded-2xl opacity-50 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            {(conversationHistory.length > 0 || hasSearched) && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleNewConversation}
                    data-testid="button-new-conversation"
                    className="h-11 w-11 rounded-2xl hover:bg-gradient-to-br hover:from-primary/20 hover:to-blue-500/20 hover:scale-110 hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 border border-transparent hover:border-primary/30"
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="rounded-xl">
                  <p>Nouvelle conversation</p>
                </TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setLocation('/showcase')}
                  data-testid="button-showcase"
                  className="h-11 w-11 rounded-2xl hover:bg-gradient-to-br hover:from-purple-500/20 hover:to-pink-500/20 hover:scale-110 hover:shadow-lg hover:shadow-purple-500/30 transition-all duration-300 border border-transparent hover:border-purple-500/30"
                >
                  <Users className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="rounded-xl">
                <p>Showcase Communautaire</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setLocation('/docs')}
                  data-testid="button-docs"
                  className="h-11 w-11 rounded-2xl hover:bg-gradient-to-br hover:from-blue-500/20 hover:to-cyan-500/20 hover:scale-110 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300 border border-transparent hover:border-blue-500/30"
                >
                  <BookOpen className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="rounded-xl">
                <p>Documentation</p>
              </TooltipContent>
            </Tooltip>
            <div className="h-8 w-px bg-border/50 mx-1" />
            {/* Auth section */}
            {currentUser ? (
              <>
                <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
                  <SheetTrigger asChild>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-11 w-11 rounded-2xl hover:bg-gradient-to-br hover:from-indigo-500/20 hover:to-violet-500/20 hover:scale-110 hover:shadow-lg hover:shadow-indigo-500/30 transition-all duration-300 border border-transparent hover:border-indigo-500/30"
                        >
                          <History className="h-5 w-5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="rounded-xl">
                        <p>Mon historique</p>
                      </TooltipContent>
                    </Tooltip>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-80 sm:w-96">
                    <SheetHeader>
                      <SheetTitle>Mon historique</SheetTitle>
                    </SheetHeader>
                    <div className="mt-4 h-[calc(100vh-8rem)]">
                      <SessionHistory
                        onLoadSession={handleLoadSession}
                        currentSessionId={currentSessionId}
                      />
                    </div>
                  </SheetContent>
                </Sheet>
                <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-primary/10 border border-primary/20">
                  <User className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-medium text-primary max-w-[80px] truncate">
                    {currentUser.displayName}
                  </span>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleLogout}
                      className="h-11 w-11 rounded-2xl hover:bg-gradient-to-br hover:from-red-500/20 hover:to-orange-500/20 hover:scale-110 hover:shadow-lg hover:shadow-red-500/30 transition-all duration-300 border border-transparent hover:border-red-500/30"
                    >
                      <LogOut className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="rounded-xl">
                    <p>Déconnexion</p>
                  </TooltipContent>
                </Tooltip>
              </>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setLocation('/auth')}
                    className="h-11 w-11 rounded-2xl hover:bg-gradient-to-br hover:from-indigo-500/20 hover:to-violet-500/20 hover:scale-110 hover:shadow-lg hover:shadow-indigo-500/30 transition-all duration-300 border border-transparent hover:border-indigo-500/30"
                  >
                    <User className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="rounded-xl">
                  <p>Mon compte</p>
                </TooltipContent>
              </Tooltip>
            )}
            <div className="h-8 w-px bg-border/50 mx-1" />
            <ThemeColorPicker />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Market Ticker Banner */}
      <MarketTicker />

      {/* Main Content - Scrollable area */}
      <main className="flex-1 overflow-y-auto relative z-10 pb-32" data-testid="main-content">
        <div className="container mx-auto px-4 py-6 max-w-5xl">
          {/* Content Area */}
          {!hasSearched && (
            <>
              <EmptyState onQuestionClick={handleSearch} />
            </>
          )}

          {chatMutation.isError && (
            <ErrorState
              error={chatMutation.error?.message || "An error occurred"}
              onRetry={handleRetry}
            />
          )}

          {chatMutation.isPending && !streamingAnswer && !chatMutation.isError && (
            <SearchingWidget />
          )}

          {/* Conversation History */}
          {conversationHistory.length > 0 && (
            <ConversationHistory history={conversationHistory} />
          )}

          {!chatMutation.isError && (searchQueries.length > 0 || streamingAnswer) && (
            <>
              {streamingAnswer && !chatMutation.isPending && (
                <div className="mb-6 flex justify-end gap-3" data-testid="share-button-container">
                  <DownloadButtons
                    question={currentQuestion}
                    answer={streamingAnswer}
                    contentRef={resultsRef}
                    figureUrls={figureUrls}
                  />
                  <ShareButton
                    question={currentQuestion}
                    answer={streamingAnswer}
                    toolResults={toolResults}
                    sources={sources}
                    customPythonFigures={customPythonFigures}
                  />
                </div>
              )}

              <div className="space-y-6 pb-6" data-testid="results-container" ref={resultsRef}>
                <StreamingAnswer
                  content={streamingAnswer}
                  sources={sources}
                  isStreaming={chatMutation.isPending}
                  searchQueries={searchQueries}
                  statusMessage={statusMessage}
                  currentSearchIndex={currentSearchIndex}
                  figureRegistry={figureRegistry}
                  figureUrls={figureUrls}
                />

                <AgentSteps steps={agentSteps} />

                <ToolResults toolResults={toolResults} pythonCode={pythonCode} />

                {monteCarloResults && (
                  <div data-chart data-chart-title="Monte Carlo Simulation Results">
                    <MonteCarloResults pythonCode={pythonCode} results={monteCarloResults} />
                  </div>
                )}

                {optionsPricingResults && (
                  <div className="max-w-5xl mx-auto mb-8" data-chart data-chart-title="Options Pricing Analysis">
                    <OptionsPricingCard data={optionsPricingResults} />
                  </div>
                )}

                {customPythonFigures.length > 0 && (
                  <div className="max-w-5xl mx-auto mb-8" data-chart data-chart-title="Custom Python Analysis Gallery">
                    <CustomPythonFigure figureBatches={customPythonFigures} />
                  </div>
                )}

                {sources.length > 0 && !chatMutation.isPending && (
                  <div className="max-w-5xl mx-auto" data-testid="web-results-section">
                    <h2 className="text-2xl font-semibold mb-6" data-testid="text-web-results-heading">
                      Web Results
                    </h2>
                    <div className="space-y-4" data-testid="web-results-list">
                      {sources.map((result, index) => (
                        <ResultCard key={result.url} result={result} index={index} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Search Bar - Fixed at bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/30 glass">
        <div className="container mx-auto px-6 py-6 max-w-5xl">
          <SearchBar
            onSearch={handleSearch}
            isLoading={chatMutation.isPending}
            placeholder="Posez votre question sur les marchés financiers..."
          />
        </div>
      </div>
    </div>
  );
}
