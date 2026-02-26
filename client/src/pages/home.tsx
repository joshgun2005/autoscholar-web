import { SearchBar } from "@/components/chat/search-bar";
import { EmptyState } from "@/components/chat/empty-state";
import { StreamingAnswer } from "@/components/streaming-answer";
import { ToolResults } from "@/components/chat/tool-results";
import { AgentSteps } from "@/components/chat/agent-steps";
import { MonteCarloResults } from "@/components/chat/monte-carlo-results";
import { OptionsPricingCard } from "@/components/financial/options-pricing-card";
import { CustomPythonFigure } from "@/components/chat/custom-python-figure";
import { ResultCard } from "@/components/chat/result-card";
import { SearchingWidget } from "@/components/chat/searching-widget";
import { ErrorState } from "@/components/chat/error-state";
import { ThemeToggle } from "@/components/theme-toggle";
import { ThemeColorPicker } from "@/components/theme-color-picker";
import { ShareButton } from "@/components/chat/share-button";
import { DownloadButtons } from "@/components/chat/download-buttons";
import { ConversationHistory } from "@/components/chat/conversation-history";
import { SessionHistory } from "@/components/chat/session-history";
import { MarketTicker } from "@/components/market-ticker";
import { Sparkles, BookOpen, Plus, Users, User, History, LogOut } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useChatSession } from "@/hooks/useChatSession";

export default function Home() {
  const [, setLocation] = useLocation();
  const {
    currentUser,
    handleLogout,
    currentSessionId,
    historyOpen,
    setHistoryOpen,
    handleLoadSession,
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
    chatMutation,
    hasSearched,
    handleSearch,
    handleRetry,
    handleNewConversation,
  } = useChatSession();

  return (
    <div className="flex flex-col h-screen bg-background relative overflow-hidden" data-testid="page-home">
      {/* Subtle Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.03),transparent_70%)]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-sm" data-testid="header-main">
        <div className="container flex h-14 items-center justify-between px-6">
          <div className="cursor-pointer" data-testid="logo-container">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-primary" data-testid="logo-icon" />
              <div className="hidden md:flex items-baseline gap-1.5">
                <span className="text-base font-bold text-foreground leading-tight">
                  VibeQuant
                </span>
                <span className="text-[10px] font-medium text-muted-foreground leading-none">
                  AI Financial
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {(conversationHistory.length > 0 || hasSearched) && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={handleNewConversation} data-testid="button-new-conversation" className="h-9 w-9 hover:bg-muted transition-colors">
                    <Plus className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Nouvelle conversation</p></TooltipContent>
              </Tooltip>
            )}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => setLocation('/showcase')} data-testid="button-showcase" className="h-9 w-9 hover:bg-muted transition-colors">
                  <Users className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Showcase Communautaire</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={() => setLocation('/docs')} data-testid="button-docs" className="h-9 w-9 hover:bg-muted transition-colors">
                  <BookOpen className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>Documentation</p></TooltipContent>
            </Tooltip>
            <div className="h-8 w-px bg-border/50 mx-1" />
            {currentUser ? (
              <>
                <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
                  <SheetTrigger asChild>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-muted transition-colors">
                          <History className="h-5 w-5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent><p>Mon historique</p></TooltipContent>
                    </Tooltip>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-80 sm:w-96">
                    <SheetHeader><SheetTitle>Mon historique</SheetTitle></SheetHeader>
                    <div className="mt-4 h-[calc(100vh-8rem)]">
                      <SessionHistory onLoadSession={handleLoadSession} currentSessionId={currentSessionId} />
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
                    <Button variant="ghost" size="icon" onClick={handleLogout} className="h-9 w-9 hover:bg-muted transition-colors">
                      <LogOut className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent><p>Deconnexion</p></TooltipContent>
                </Tooltip>
              </>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => setLocation('/auth')} className="h-9 w-9 hover:bg-muted transition-colors">
                    <User className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>Mon compte</p></TooltipContent>
              </Tooltip>
            )}
            <div className="h-8 w-px bg-border/50 mx-1" />
            <ThemeColorPicker />
            <ThemeToggle />
          </div>
        </div>
      </header>

      <MarketTicker />

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative z-10 pb-32" data-testid="main-content">
        <div className="container mx-auto px-4 py-6 max-w-5xl">
          {!hasSearched && <EmptyState onQuestionClick={handleSearch} />}

          {chatMutation.isError && (
            <ErrorState error={chatMutation.error?.message || "An error occurred"} onRetry={handleRetry} />
          )}

          {chatMutation.isPending && !streamingAnswer && !chatMutation.isError && <SearchingWidget />}

          {conversationHistory.length > 0 && <ConversationHistory history={conversationHistory} />}

          {!chatMutation.isError && (searchQueries.length > 0 || streamingAnswer) && (
            <>
              {streamingAnswer && !chatMutation.isPending && (
                <div className="mb-6 flex justify-end gap-3" data-testid="share-button-container">
                  <DownloadButtons question={currentQuestion} answer={streamingAnswer} contentRef={resultsRef} figureUrls={figureUrls} />
                  <ShareButton question={currentQuestion} answer={streamingAnswer} toolResults={toolResults} sources={sources} customPythonFigures={customPythonFigures} />
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
                    <h2 className="text-2xl font-semibold mb-6" data-testid="text-web-results-heading">Web Results</h2>
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
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3 max-w-5xl">
          <SearchBar onSearch={handleSearch} isLoading={chatMutation.isPending} placeholder="Posez votre question sur les marches financiers..." />
        </div>
      </div>
    </div>
  );
}
