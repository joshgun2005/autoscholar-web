import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Sparkles, Search, ArrowLeft, Users, TrendingUp, Filter } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { ThemeColorPicker } from "@/components/theme-color-picker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface SharedReport {
  id: number;
  shareId: string;
  question: string;
  answer: string;
  toolResults: any[];
  createdAt: string;
}

export default function Showcase() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [toolFilter, setToolFilter] = useState<string | null>(null);

  // Fetch all shared reports
  const { data: reports, isLoading } = useQuery<SharedReport[]>({
    queryKey: ["/api/shared-reports"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Extract unique tools used across all reports
  const allTools = new Set<string>();
  reports?.forEach(report => {
    report.toolResults?.forEach((tr: any) => {
      allTools.add(tr.tool);
    });
  });

  // Filter reports based on search query and tool filter
  const filteredReports = reports?.filter(report => {
    const matchesSearch = searchQuery === "" ||
      report.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.answer.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesTool = !toolFilter || report.toolResults?.some((tr: any) => tr.tool === toolFilter);

    return matchesSearch && matchesTool;
  });

  // Complete tool metadata mapping for distinct badges
  const TOOL_METADATA: Record<string, { name: string; color: string }> = {
    // Fundamental Analysis
    get_company_profile: { name: 'Company Profile', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
    get_income_statement: { name: 'Income Statement', color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20' },
    get_balance_sheet: { name: 'Balance Sheet', color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20' },
    get_cash_flow: { name: 'Cash Flow', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' },
    get_key_metrics: { name: 'Key Metrics', color: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20' },
    get_financial_ratios: { name: 'Financial Ratios', color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20' },
    get_financial_growth: { name: 'Financial Growth', color: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20' },

    // Market Data
    get_stock_quote: { name: 'Stock Quote', color: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20' },
    get_historical_price: { name: 'Historical Prices', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
    get_intraday_price: { name: 'Intraday Prices', color: 'bg-lime-500/10 text-lime-600 dark:text-lime-400 border-lime-500/20' },

    // Technical Indicators
    get_rsi: { name: 'RSI', color: 'bg-cyan-600/10 text-cyan-700 dark:text-cyan-300 border-cyan-600/20' },
    get_macd: { name: 'MACD', color: 'bg-blue-600/10 text-blue-700 dark:text-blue-300 border-blue-600/20' },
    get_ema: { name: 'EMA', color: 'bg-indigo-600/10 text-indigo-700 dark:text-indigo-300 border-indigo-600/20' },
    get_sma: { name: 'SMA', color: 'bg-violet-600/10 text-violet-700 dark:text-violet-300 border-violet-600/20' },
    get_adx: { name: 'ADX', color: 'bg-purple-600/10 text-purple-700 dark:text-purple-300 border-purple-600/20' },
    get_williams_r: { name: 'Williams %R', color: 'bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 border-fuchsia-500/20' },
    get_cci: { name: 'CCI', color: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20' },
    get_stochastic: { name: 'Stochastic', color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' },

    // News & Events
    get_financial_news: { name: 'Financial News', color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20' },
    get_press_releases: { name: 'Press Releases', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
    get_stock_news_sentiment: { name: 'News Sentiment', color: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20' },

    // Calendar & Events
    get_economic_calendar: { name: 'Economic Calendar', color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20' },
    get_earnings_calendar: { name: 'Earnings Calendar', color: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20' },
    get_ipo_calendar: { name: 'IPO Calendar', color: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20' },

    // Trading Activity
    get_insider_trading: { name: 'Insider Trading', color: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' },
    get_congressional_trading: { name: 'Congressional Trading', color: 'bg-red-600/10 text-red-700 dark:text-red-300 border-red-600/20' },
    get_senate_trading: { name: 'Senate Trading', color: 'bg-rose-600/10 text-rose-700 dark:text-rose-300 border-rose-600/20' },
    get_institutional_holders: { name: 'Institutional Holders', color: 'bg-pink-600/10 text-pink-700 dark:text-pink-300 border-pink-600/20' },

    // Forex & Commodities
    get_forex_quote: { name: 'Forex Quote', color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20' },
    get_forex_historical: { name: 'Forex Historical', color: 'bg-teal-600/10 text-teal-700 dark:text-teal-300 border-teal-600/20' },
    get_commodity_quotes: { name: 'Commodity Prices', color: 'bg-amber-600/10 text-amber-700 dark:text-amber-300 border-amber-600/20' },

    // Macro & Rates
    get_treasury_rates: { name: 'Treasury Rates', color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20' },
    get_economic_indicator: { name: 'Economic Indicator', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },

    // Analyst & Estimates
    get_analyst_estimates: { name: 'Analyst Estimates', color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' },
    get_earnings_surprises: { name: 'Earnings Surprises', color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20' },
    get_price_target: { name: 'Price Targets', color: 'bg-fuchsia-600/10 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-600/20' },
    get_price_target_summary: { name: 'Price Target Summary', color: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20' },
    get_upgrades_downgrades: { name: 'Upgrades/Downgrades', color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' },

    // Dividends & Splits
    get_dividend_history: { name: 'Dividend History', color: 'bg-green-600/10 text-green-700 dark:text-green-300 border-green-600/20' },
    get_stock_split_history: { name: 'Stock Splits', color: 'bg-emerald-600/10 text-emerald-700 dark:text-emerald-300 border-emerald-600/20' },

    // SEC & Filings
    get_sec_filings: { name: 'SEC Filings', color: 'bg-gray-600/10 text-gray-700 dark:text-gray-300 border-gray-600/20' },
    get_cot_report: { name: 'COT Report', color: 'bg-slate-600/10 text-slate-700 dark:text-slate-300 border-slate-600/20' },

    // ESG
    get_esg_score: { name: 'ESG Score', color: 'bg-lime-600/10 text-lime-700 dark:text-lime-300 border-lime-600/20' },

    // Screening & Search
    get_stock_screener: { name: 'Stock Screener', color: 'bg-orange-600/10 text-orange-700 dark:text-orange-300 border-orange-600/20' },
    search_companies: { name: 'Company Search', color: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20' },
    get_stock_peers: { name: 'Peer Companies', color: 'bg-sky-600/10 text-sky-700 dark:text-sky-300 border-sky-600/20' },

    // ETF
    get_etf_holdings: { name: 'ETF Holdings', color: 'bg-cyan-600/10 text-cyan-700 dark:text-cyan-300 border-cyan-600/20' },
    get_etf_sector_weightings: { name: 'ETF Sectors', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
    get_etf_country_weightings: { name: 'ETF Countries', color: 'bg-indigo-600/10 text-indigo-700 dark:text-indigo-300 border-indigo-600/20' },

    // Crypto
    get_crypto_quote: { name: 'Crypto Quote', color: 'bg-yellow-600/10 text-yellow-700 dark:text-yellow-300 border-yellow-600/20' },
    get_crypto_list: { name: 'Crypto List', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },

    // Advanced Analysis
    run_monte_carlo_simulation: { name: 'Monte Carlo Simulation', color: 'bg-purple-600/10 text-purple-700 dark:text-purple-300 border-purple-600/20' },
    calculate_options_price: { name: 'Options Pricing', color: 'bg-blue-600/10 text-blue-700 dark:text-blue-300 border-blue-600/20' },
    estimate_garch_volatility: { name: 'GARCH Volatility', color: 'bg-amber-600/10 text-amber-700 dark:text-amber-300 border-amber-600/20' },
    calculate_var: { name: 'Value at Risk', color: 'bg-red-600/10 text-red-700 dark:text-red-300 border-red-600/20' },
    optimize_portfolio: { name: 'Portfolio Optimization', color: 'bg-green-600/10 text-green-700 dark:text-green-300 border-green-600/20' },
    analyze_risk_metrics: { name: 'Risk Metrics', color: 'bg-orange-600/10 text-orange-700 dark:text-orange-300 border-orange-600/20' },

    // Research
    web_search_exa: { name: 'Web Search', color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20' },

    // Market Hours & Misc
    get_market_hours: { name: 'Market Hours', color: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20' },
    get_company_outlook: { name: 'Company Outlook', color: 'bg-violet-600/10 text-violet-700 dark:text-violet-300 border-violet-600/20' },
    get_social_sentiment: { name: 'Social Sentiment', color: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20' },

    // Data Downloads & Plots
    create_plot: { name: 'Custom Plot', color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20' },
    download_fmp_data: { name: 'Data Download', color: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20' },
  };

  // Get tool metadata with fallback
  const getToolMetadata = (toolName: string) => {
    return TOOL_METADATA[toolName] || {
      name: toolName.replace(/_/g, ' ').replace(/^get /, ''),
      color: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20'
    };
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden" data-testid="page-showcase">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-40 w-96 h-96 bg-gradient-to-br from-purple-500/15 to-pink-500/15 rounded-full blur-3xl animate-float" />
        <div className="absolute top-1/4 right-0 w-80 h-80 bg-gradient-to-br from-blue-500/15 to-cyan-500/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-gradient-to-br from-primary/15 to-blue-500/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/20 backdrop-blur-xl bg-background/80 shadow-lg shadow-purple-500/5">
        <div className="container flex h-20 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/')}
              className="rounded-2xl hover:bg-gradient-to-br hover:from-primary/20 hover:to-blue-500/20 hover:scale-105 transition-all duration-300 gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline font-medium">Retour</span>
            </Button>
            <button
              onClick={() => setLocation('/')}
              className="group hover:scale-105 transition-all duration-300"
            >
              <div className="relative flex items-center gap-3 px-3 md:px-4 py-2.5 rounded-2xl bg-gradient-to-br from-primary/20 via-blue-500/20 to-purple-500/20 backdrop-blur-md border-2 border-primary/40 shadow-lg shadow-primary/20 group-hover:border-primary/60 transition-all duration-300">
                {/* Logo Icon */}
                <div className="relative">
                  <Sparkles className="w-7 h-7 text-primary animate-pulse-glow drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                  <div className="absolute inset-0 blur-xl bg-primary/60 -z-10" />
                </div>
                {/* Logo Text - Hidden on mobile, visible on desktop */}
                <div className="hidden md:flex flex-col">
                  <span className="text-lg font-bold bg-gradient-to-r from-primary via-blue-500 to-purple-500 bg-clip-text text-transparent leading-tight">
                    VibeQuant
                  </span>
                  <span className="text-[10px] text-muted-foreground/80 leading-none -mt-0.5">
                    AI Financial
                  </span>
                </div>
                <div className="absolute inset-0 blur-2xl bg-gradient-to-br from-primary/30 via-blue-500/30 to-purple-500/30 -z-10 rounded-2xl opacity-50 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-8 w-px bg-border/50" />
            <ThemeColorPicker />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-7xl relative z-10">
        {/* Page Header */}
        <div className="mb-10 space-y-6">
          <div className="flex items-center gap-5">
            <div className="relative p-4 rounded-3xl bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-primary/20 backdrop-blur-md border border-purple-500/30 shadow-2xl shadow-purple-500/20">
              <Users className="w-8 h-8 text-purple-500 drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]" />
              <div className="absolute inset-0 blur-2xl bg-gradient-to-br from-purple-500/30 to-pink-500/30 -z-10 rounded-3xl" />
            </div>
            <div>
              <h1 className="text-4xl font-black bg-gradient-to-r from-purple-500 via-pink-500 to-primary bg-clip-text text-transparent tracking-tight">
                Showcase Communautaire
              </h1>
              <p className="text-muted-foreground text-lg mt-1">
                Découvrez toutes les analyses générées par la communauté VibeQuant
              </p>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Input
                type="text"
                placeholder="Rechercher des analyses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 h-14 rounded-2xl border-2 border-border/50 focus:border-purple-500/50 bg-background/50 backdrop-blur-sm shadow-lg shadow-purple-500/5 text-base transition-all duration-300"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-500/70" />
            </div>
            {toolFilter && (
              <Button
                variant="outline"
                size="lg"
                onClick={() => setToolFilter(null)}
                className="gap-2 rounded-2xl border-2 hover:bg-gradient-to-br hover:from-purple-500/20 hover:to-pink-500/20 hover:scale-105 transition-all duration-300"
              >
                <Filter className="w-4 h-4" />
                Effacer filtre
              </Button>
            )}
          </div>

          {/* Stats */}
          {reports && (
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span>{reports.length} analyses publiques</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>{allTools.size} outils utilisés</span>
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="text-muted-foreground mt-4">Chargement des analyses...</p>
          </div>
        )}

        {/* Reports Grid */}
        {filteredReports && filteredReports.length > 0 && (
          <div className="grid md:grid-cols-2 gap-8">
            {filteredReports.map((report) => (
              <Card
                key={report.id}
                className="group cursor-pointer transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/20 border-2 border-border/50 hover:border-purple-500/50 rounded-3xl overflow-hidden bg-gradient-to-br from-background/80 to-background/40 backdrop-blur-sm"
                onClick={() => setLocation(`/share/${report.shareId}`)}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <CardHeader className="relative z-10 pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-xl font-bold line-clamp-2 group-hover:text-purple-500 transition-colors duration-300">
                      {report.question}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 animate-pulse" />
                    <p className="text-xs text-muted-foreground font-medium">
                      {formatDistanceToNow(new Date(report.createdAt), {
                        addSuffix: true,
                        locale: fr
                      })}
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="relative z-10 space-y-4">
                  {/* Answer Preview */}
                  <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                    {report.answer}
                  </p>

                  {/* Tools Used */}
                  {report.toolResults && report.toolResults.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {Array.from(new Set(report.toolResults.map((tr: any) => tr.tool))).map((tool: any) => {
                        const toolMeta = getToolMetadata(tool);
                        return (
                          <Badge
                            key={tool}
                            variant="outline"
                            className={`text-xs font-medium px-3 py-1 rounded-xl ${toolMeta.color} cursor-pointer hover:scale-110 transition-all duration-300 shadow-md`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setToolFilter(tool);
                            }}
                          >
                            {toolMeta.name}
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {filteredReports && filteredReports.length === 0 && !isLoading && (
          <Card className="text-center py-12">
            <CardContent>
              <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucune analyse trouvée</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || toolFilter
                  ? "Essayez de modifier vos critères de recherche"
                  : "Aucune analyse n'a été partagée pour le moment"}
              </p>
              {(searchQuery || toolFilter) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setToolFilter(null);
                  }}
                >
                  Réinitialiser les filtres
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
