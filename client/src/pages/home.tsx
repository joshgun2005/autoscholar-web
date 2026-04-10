import { SearchBar } from "@/components/chat/search-bar";
import { ResearchForm } from "@/components/chat/research-form";
import { StreamingAnswer } from "@/components/streaming-answer";
import { ToolResults } from "@/components/chat/tool-results";
import { AgentSteps } from "@/components/chat/agent-steps";
import { MonteCarloResults } from "@/components/chat/monte-carlo-results";
import { CustomPythonFigure } from "@/components/chat/custom-python-figure";
import { ResultCard } from "@/components/chat/result-card";
import { ErrorState } from "@/components/chat/error-state";
import { AnimatePresence, motion } from "framer-motion";
import { ThemeToggle } from "@/components/theme-toggle";
import { ShareButton } from "@/components/chat/share-button";
import { DownloadButtons } from "@/components/chat/download-buttons";
import { ConversationHistory } from "@/components/chat/conversation-history";
import { SessionHistory } from "@/components/chat/session-history";
import { GraduationCap, BookOpen, Plus, History, Library, ArrowRight, GitBranch, Menu, Radio } from "lucide-react";
import { CryptoDonationBanner } from "@/components/crypto-donation-banner";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useActiveSession } from "@/contexts/active-session-context";

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
  } = useActiveSession();

  return (
    <div className="flex flex-col h-[100dvh] bg-background relative overflow-hidden" data-testid="page-home">
      {/* Background — refined depth */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.03),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,hsl(var(--primary)/0.015),transparent_50%)]" />
        <div className="absolute inset-0 data-grid-pattern opacity-[0.12]" />
      </div>

      {/* Top loading bar */}
      <AnimatePresence>
        {chatMutation.isPending && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed top-0 left-0 right-0 z-[60] h-[2px] bg-primary/10 overflow-hidden"
          >
            <motion.div
              className="h-full bg-gradient-to-r from-transparent via-primary to-transparent"
              animate={{ x: ["-100%", "100%"] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              style={{ width: "50%" }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Crypto donation banner */}
      <div className="flex-shrink-0 z-50 w-full relative">
        <CryptoDonationBanner />
      </div>

      {/* Header — premium institutional */}
      <header className="flex-shrink-0 z-50 w-full" data-testid="header-main">
        <div className="mx-auto max-w-6xl px-4 sm:px-8">
          <div className="flex h-16 sm:h-[68px] items-center justify-between">
            {/* Logo */}
            <div className="cursor-pointer flex-shrink-0 group" data-testid="logo-container" onClick={() => setLocation("/")}>
              <div className="flex items-center gap-3">
                <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-primary/8 group-hover:bg-primary/12 transition-all duration-300">
                  <GraduationCap className="w-[18px] h-[18px] text-primary" data-testid="logo-icon" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[15px] font-semibold text-foreground tracking-[-0.02em] leading-none font-display">
                    AutoScholar
                  </span>
                  <span className="text-[9px] text-muted-foreground/35 font-medium tracking-[0.2em] uppercase leading-none mt-1.5 hidden sm:block">
                    Research Engine
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation — premium */}
            <nav className="flex items-center gap-1 sm:gap-1.5">
              {(conversationHistory.length > 0 || hasSearched) && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={handleNewConversation} data-testid="button-new-conversation" className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl hover:bg-primary/5 transition-all duration-200">
                      <Plus className="h-[18px] w-[18px]" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="rounded-xl px-3 py-2"><p className="text-[12px] font-medium">New conversation</p></TooltipContent>
                </Tooltip>
              )}

              <div className="hidden sm:flex items-center gap-0.5">
                <NavButton icon={<GitBranch className="h-[18px] w-[18px]" />} label="Repository" onClick={() => setLocation('/repository')} />
                <NavButton icon={<Library className="h-[18px] w-[18px]" />} label="Journal" onClick={() => setLocation('/journal')} />
                <NavButton icon={<Radio className="h-[18px] w-[18px]" />} label="Live Paper" onClick={() => setLocation('/live-paper')} />
                <NavButton icon={<BookOpen className="h-[18px] w-[18px]" />} label="Docs" onClick={() => setLocation('/docs')} testId="button-docs" />
              </div>

              {/* Mobile: premium dropdown menu */}
              <div className="flex sm:hidden items-center">
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-primary/5 transition-all duration-200">
                      <Menu className="h-[18px] w-[18px]" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[280px] z-[100]">
                    <DropdownMenuLabel>Navigation</DropdownMenuLabel>
                    <DropdownMenuItem onSelect={() => setLocation('/repository')} className="cursor-pointer">
                      <GitBranch className="h-[18px] w-[18px]" />
                      <div className="flex flex-col gap-0.5">
                        <span>Repository</span>
                        <span className="text-[11px] text-muted-foreground/50 font-normal">Browse research papers</span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setLocation('/journal')} className="cursor-pointer">
                      <Library className="h-[18px] w-[18px]" />
                      <div className="flex flex-col gap-0.5">
                        <span>Journal</span>
                        <span className="text-[11px] text-muted-foreground/50 font-normal">Published research</span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setLocation('/live-paper')} className="cursor-pointer">
                      <Radio className="h-[18px] w-[18px]" />
                      <div className="flex flex-col gap-0.5">
                        <span>Live Paper</span>
                        <span className="text-[11px] text-muted-foreground/50 font-normal">Real-time collaboration</span>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={() => setLocation('/docs')} className="cursor-pointer">
                      <BookOpen className="h-[18px] w-[18px]" />
                      <div className="flex flex-col gap-0.5">
                        <span>Documentation</span>
                        <span className="text-[11px] text-muted-foreground/50 font-normal">Guides and API reference</span>
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="h-5 w-px bg-border/25 mx-2 sm:mx-3" />

              <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
                <SheetTrigger asChild>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl hover:bg-primary/5 transition-all duration-200">
                        <History className="h-[18px] w-[18px]" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="rounded-xl px-3 py-2"><p className="text-[12px] font-medium">History</p></TooltipContent>
                  </Tooltip>
                </SheetTrigger>
                <SheetContent side="right" className="w-[85vw] sm:w-[420px] rounded-l-2xl border-l border-border/50">
                  <SheetHeader><SheetTitle className="text-base font-semibold tracking-[-0.02em]">Research History</SheetTitle></SheetHeader>
                  <div className="mt-6 h-[calc(100dvh-8rem)]">
                    <SessionHistory onLoadSession={handleLoadSession} currentSessionId={currentSessionId} />
                  </div>
                </SheetContent>
              </Sheet>

              <div className="h-5 w-px bg-border/25 mx-1 sm:mx-1.5" />
              <ThemeToggle />
            </nav>
          </div>
        </div>
        {/* Bottom border — refined gradient */}
        <div className="h-px bg-gradient-to-r from-transparent via-border/30 to-transparent" />
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative z-10 pb-40" data-testid="main-content">
        <div className="mx-auto px-4 sm:px-8 max-w-4xl">
          {/* Empty state — research form */}
          {!hasSearched && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="pt-10 sm:pt-16"
            >
              <ResearchForm onSubmit={handleSearch} isLoading={chatMutation.isPending} />
            </motion.div>
          )}

          {/* Error state */}
          {chatMutation.isError && (
            <div className="pt-10">
              <ErrorState error={chatMutation.error?.message || "An error occurred"} onRetry={handleRetry} />
            </div>
          )}

          {/* Conversation history */}
          {conversationHistory.length > 0 && (
            <div className="pt-8">
              <ConversationHistory history={conversationHistory} />
            </div>
          )}

          {/* Results area */}
          {!chatMutation.isError && (searchQueries.length > 0 || streamingAnswer) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="pt-8"
            >
              {/* Share / download bar */}
              {streamingAnswer && !chatMutation.isPending && (
                <div className="mb-8 flex justify-end gap-3" data-testid="share-button-container">
                  <DownloadButtons question={currentQuestion} answer={streamingAnswer} contentRef={resultsRef} />
                  <ShareButton question={currentQuestion} answer={streamingAnswer} toolResults={toolResults} sources={sources} customPythonFigures={customPythonFigures} />
                </div>
              )}

              <div className="space-y-8 pb-8" data-testid="results-container" ref={resultsRef}>
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

                {customPythonFigures.length > 0 && (
                  <div className="max-w-5xl mx-auto mb-10" data-chart data-chart-title="Custom Python Analysis Gallery">
                    <CustomPythonFigure figureBatches={customPythonFigures} />
                  </div>
                )}

                {sources.length > 0 && !chatMutation.isPending && (
                  <div className="max-w-5xl mx-auto" data-testid="web-results-section">
                    <h2 className="text-base font-semibold mb-5 flex items-center gap-3 tracking-[-0.02em]" data-testid="text-web-results-heading">
                      <div className="w-1 h-5 rounded-full bg-primary" />
                      Sources
                    </h2>
                    <div className="space-y-3" data-testid="web-results-list">
                      {sources.map((result, index) => (
                        <ResultCard key={result.url} result={result} index={index} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Floating button during generation */}
          <AnimatePresence>
            {chatMutation.isPending && currentSessionId && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="fixed bottom-28 right-6 z-50"
              >
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full shadow-lg gap-2 text-xs border-primary/30 bg-background/90 backdrop-blur-sm px-4"
                  onClick={() => setLocation(`/live/${currentSessionId}`)}
                >
                  <Radio className="h-3.5 w-3.5 animate-pulse text-primary" />
                  Watch Live
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Search Bar — fixed bottom, premium glass */}
      <div className="fixed bottom-0 left-0 right-0 z-40">
        <div className="absolute inset-0 glass-strong rounded-t-2xl" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/30 to-transparent" />
        <div className="relative mx-auto px-4 sm:px-8 pt-5 pb-4 max-w-3xl">
          <SearchBar onSearch={handleSearch} isLoading={chatMutation.isPending} placeholder="Describe your research paper..." />
          <div className="flex items-center justify-center gap-5 mt-3 text-[10px] text-muted-foreground/25 font-medium tracking-wide">
            <a href="/privacy" className="hover:text-muted-foreground/40 transition-colors">Privacy</a>
            <span className="text-muted-foreground/10">|</span>
            <a href="/terms" className="hover:text-muted-foreground/40 transition-colors">Terms</a>
            <span className="text-muted-foreground/10">|</span>
            <a href="/ai-policy" className="hover:text-muted-foreground/40 transition-colors">AI Policy</a>
            <span className="text-muted-foreground/10">|</span>
            <a href="mailto:contact@autoscholar.ai" className="hover:text-muted-foreground/40 transition-colors">Contact</a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── NavButton helper ─────────────────────────────────────────────

function NavButton({ icon, label, onClick, testId }: { icon: React.ReactNode; label: string; onClick: () => void; testId?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon" onClick={onClick} data-testid={testId} className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-all duration-200">
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent className="rounded-xl px-3 py-2 text-[12px] font-medium"><p>{label}</p></TooltipContent>
    </Tooltip>
  );
}
