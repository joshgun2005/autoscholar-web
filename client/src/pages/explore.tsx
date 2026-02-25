import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Sparkles, BookOpen, Search, ArrowLeft, BarChart3, FileText, DollarSign, Users, Award, Newspaper } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// New explore-specific components
import { MarketOverview } from "@/components/explore/market-overview";
import { StockHeader } from "@/components/explore/stock-header";
import { FinancialStatementsView } from "@/components/explore/financial-statements-view";
import { MetricsView } from "@/components/explore/metrics-view";
import { AnalystView } from "@/components/explore/analyst-view";
import { OwnershipView } from "@/components/explore/ownership-view";
import { NewsView } from "@/components/explore/news-view";
import { AdvancedPriceChart } from "@/components/financial/advanced-price-chart";
import { MarketTicker } from "@/components/market-ticker";

export default function Explore() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [statementPeriod, setStatementPeriod] = useState<"annual" | "quarter">("annual");

  // Fetch market overview data - Major global indices
  const { data: marketIndices } = useQuery({
    queryKey: ['market-indices'],
    queryFn: async () => {
      // Major global indices to display
      const symbols = [
        '^GSPC',      // S&P 500
        '^DJI',       // Dow Jones Industrial Average
        '^IXIC',      // NASDAQ Composite
        '^RUT',       // Russell 2000
        '^FTSE',      // FTSE 100 (UK)
        '^GDAXI',     // DAX (Germany)
        '^FCHI',      // CAC 40 (France)
        '^N225',      // Nikkei 225 (Japan)
        '^HSI',       // Hang Seng (Hong Kong)
        '^STOXX50E',  // EURO STOXX 50
        '^AXJO',      // S&P/ASX 200 (Australia)
        '^GSPTSE'     // S&P/TSX Composite (Canada)
      ];

      const symbolsParam = symbols.join(',');
      const res = await fetch(`https://financialmodelingprep.com/api/v3/quote/${symbolsParam}?apikey=oCml7pKmszWsSRQm8pouC040r8Gu0u0h`);

      if (!res.ok) throw new Error('Failed to fetch market indices');
      const data = await res.json();

      // Transform data to match expected format with validation
      return data
        .filter((index: any) => index && index.symbol && index.price != null)
        .map((index: any) => ({
          symbol: index.symbol,
          name: index.name || index.symbol,
          price: Number(index.price) || 0,
          change: Number(index.change) || 0,
          changesPercentage: Number(index.changesPercentage) || 0,
          dayLow: Number(index.dayLow) || 0,
          dayHigh: Number(index.dayHigh) || 0,
          yearHigh: Number(index.yearHigh) || 0,
          yearLow: Number(index.yearLow) || 0,
          volume: Number(index.volume) || 0,
          previousClose: Number(index.previousClose) || 0
        }));
    },
    refetchInterval: 60000,
  });

  const { data: marketStatus } = useQuery({
    queryKey: ['market-status'],
    queryFn: async () => {
      const res = await fetch('/api/fmp/market-hours');
      if (!res.ok) throw new Error('Failed to fetch market status');
      return res.json();
    },
  });

  const { data: activeStocks } = useQuery({
    queryKey: ['active-stocks'],
    queryFn: async () => {
      const res = await fetch('/api/fmp/actives');
      if (!res.ok) throw new Error('Failed to fetch active stocks');
      return res.json();
    },
  });

  const { data: gainers } = useQuery({
    queryKey: ['gainers'],
    queryFn: async () => {
      const res = await fetch('/api/fmp/gainers');
      if (!res.ok) throw new Error('Failed to fetch gainers');
      return res.json();
    },
  });

  const { data: losers } = useQuery({
    queryKey: ['losers'],
    queryFn: async () => {
      const res = await fetch('/api/fmp/losers');
      if (!res.ok) throw new Error('Failed to fetch losers');
      return res.json();
    },
  });

  // Fetch stock data when ticker is selected
  const { data: companyProfile } = useQuery({
    queryKey: ['company-profile', selectedTicker],
    queryFn: async () => {
      if (!selectedTicker) return null;
      const res = await fetch(`/api/fmp/company-profile/${selectedTicker}`);
      if (!res.ok) throw new Error('Failed to fetch company profile');
      return res.json();
    },
    enabled: !!selectedTicker,
  });

  const { data: stockQuote } = useQuery({
    queryKey: ['stock-quote', selectedTicker],
    queryFn: async () => {
      if (!selectedTicker) return null;
      const res = await fetch(`/api/fmp/stock-quote/${selectedTicker}`);
      if (!res.ok) throw new Error('Failed to fetch stock quote');
      return res.json();
    },
    enabled: !!selectedTicker,
    refetchInterval: 5000,
  });

  const { data: historicalPrice } = useQuery({
    queryKey: ['historical-price', selectedTicker],
    queryFn: async () => {
      if (!selectedTicker) return null;
      const res = await fetch(`/api/fmp/historical-price/${selectedTicker}`);
      if (!res.ok) throw new Error('Failed to fetch historical price');
      return res.json();
    },
    enabled: !!selectedTicker,
  });

  const { data: incomeStatement } = useQuery({
    queryKey: ['income-statement', selectedTicker, statementPeriod],
    queryFn: async () => {
      if (!selectedTicker) return null;
      const res = await fetch(`/api/fmp/income-statement/${selectedTicker}?period=${statementPeriod}&limit=5`);
      if (!res.ok) throw new Error('Failed to fetch income statement');
      return res.json();
    },
    enabled: !!selectedTicker,
  });

  const { data: balanceSheet } = useQuery({
    queryKey: ['balance-sheet', selectedTicker, statementPeriod],
    queryFn: async () => {
      if (!selectedTicker) return null;
      const res = await fetch(`/api/fmp/balance-sheet/${selectedTicker}?period=${statementPeriod}&limit=5`);
      if (!res.ok) throw new Error('Failed to fetch balance sheet');
      return res.json();
    },
    enabled: !!selectedTicker,
  });

  const { data: cashFlow } = useQuery({
    queryKey: ['cash-flow', selectedTicker, statementPeriod],
    queryFn: async () => {
      if (!selectedTicker) return null;
      const res = await fetch(`/api/fmp/cash-flow/${selectedTicker}?period=${statementPeriod}&limit=5`);
      if (!res.ok) throw new Error('Failed to fetch cash flow');
      return res.json();
    },
    enabled: !!selectedTicker,
  });

  const { data: keyMetrics } = useQuery({
    queryKey: ['key-metrics', selectedTicker],
    queryFn: async () => {
      if (!selectedTicker) return null;
      const res = await fetch(`/api/fmp/key-metrics/${selectedTicker}?period=annual&limit=5`);
      if (!res.ok) throw new Error('Failed to fetch key metrics');
      return res.json();
    },
    enabled: !!selectedTicker,
  });

  const { data: analystEstimates } = useQuery({
    queryKey: ['analyst-estimates', selectedTicker],
    queryFn: async () => {
      if (!selectedTicker) return null;
      const res = await fetch(`/api/fmp/analyst-estimates/${selectedTicker}?period=annual`);
      if (!res.ok) throw new Error('Failed to fetch analyst estimates');
      return res.json();
    },
    enabled: !!selectedTicker,
  });

  const { data: dividends } = useQuery({
    queryKey: ['dividends', selectedTicker],
    queryFn: async () => {
      if (!selectedTicker) return null;
      const res = await fetch(`/api/fmp/dividend-history/${selectedTicker}`);
      if (!res.ok) throw new Error('Failed to fetch dividends');
      return res.json();
    },
    enabled: !!selectedTicker,
  });

  const { data: institutionalHolders } = useQuery({
    queryKey: ['institutional-holders', selectedTicker],
    queryFn: async () => {
      if (!selectedTicker) return null;
      const res = await fetch(`/api/fmp/institutional-holders/${selectedTicker}`);
      if (!res.ok) throw new Error('Failed to fetch institutional holders');
      return res.json();
    },
    enabled: !!selectedTicker,
  });

  const { data: news } = useQuery({
    queryKey: ['news', selectedTicker],
    queryFn: async () => {
      if (!selectedTicker) return null;
      const res = await fetch(`/api/fmp/financial-news/${selectedTicker}?limit=20`);
      if (!res.ok) throw new Error('Failed to fetch news');
      return res.json();
    },
    enabled: !!selectedTicker,
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSelectedTicker(searchQuery.trim().toUpperCase());
    }
  };

  const handleTickerClick = (ticker: string) => {
    setSelectedTicker(ticker);
    setSearchQuery(ticker);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setSelectedTicker(null);
    setSearchQuery("");
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background" data-testid="page-explore">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur-lg">
        <div className="container flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/')}
              className="hover-elevate active-elevate-2 gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Retour</span>
            </Button>
            <button
              onClick={() => setLocation('/')}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="hidden md:inline text-lg font-semibold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent leading-tight">
                VibeQuant
              </span>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setLocation('/docs')}
                  className="hover-elevate active-elevate-2"
                >
                  <BookOpen className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Documentation</p>
              </TooltipContent>
            </Tooltip>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Market Ticker Banner */}
      <MarketTicker />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-[1800px]">
        {/* Search Section */}
        <div className="mb-8 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/10">
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Exploration Boursière</h1>
              <p className="text-muted-foreground">
                Analysez en profondeur n'importe quel titre sur les marchés
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="relative max-w-2xl">
            <Input
              type="text"
              placeholder="Entrez un symbole boursier (ex: AAPL, TSLA, MSFT)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
              className="pl-4 pr-12 h-14 text-lg rounded-2xl"
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg hover:bg-primary/10 transition-colors"
            >
              <Search className="w-5 h-5 text-primary" />
            </button>
          </form>
        </div>

        {/* Market Overview or Stock Dashboard */}
        {!selectedTicker ? (
          <MarketOverview
            marketIndices={marketIndices}
            marketStatus={marketStatus}
            gainers={gainers}
            losers={losers}
            activeStocks={activeStocks}
            onTickerClick={handleTickerClick}
          />
        ) : (
          /* Stock Dashboard */
          <div className="space-y-8">
            {/* Stock Header */}
            <StockHeader
              ticker={selectedTicker}
              companyProfile={companyProfile?.[0]}
              stockQuote={stockQuote?.[0]}
              onBack={handleBack}
            />

            {/* Price Chart */}
            {historicalPrice && (
              <Card>
                <CardContent className="pt-6">
                  <AdvancedPriceChart data={historicalPrice} />
                </CardContent>
              </Card>
            )}

            {/* Tabs for different sections */}
            <Tabs defaultValue="financials" className="w-full">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 h-auto">
                <TabsTrigger value="financials" className="gap-2 py-3">
                  <FileText className="w-4 h-4" />
                  <span className="hidden sm:inline">États Financiers</span>
                  <span className="sm:hidden">Financiers</span>
                </TabsTrigger>
                <TabsTrigger value="metrics" className="gap-2 py-3">
                  <DollarSign className="w-4 h-4" />
                  <span className="hidden sm:inline">Métriques Clés</span>
                  <span className="sm:hidden">Métriques</span>
                </TabsTrigger>
                <TabsTrigger value="analysts" className="gap-2 py-3">
                  <Award className="w-4 h-4" />
                  <span className="hidden sm:inline">Analystes</span>
                  <span className="sm:hidden">Analystes</span>
                </TabsTrigger>
                <TabsTrigger value="ownership" className="gap-2 py-3">
                  <Users className="w-4 h-4" />
                  <span className="hidden sm:inline">Actionnariat</span>
                  <span className="sm:hidden">Actions</span>
                </TabsTrigger>
                <TabsTrigger value="news" className="gap-2 py-3">
                  <Newspaper className="w-4 h-4" />
                  <span className="hidden sm:inline">Actualités</span>
                  <span className="sm:hidden">News</span>
                </TabsTrigger>
              </TabsList>

              {/* Financial Statements Tab */}
              <TabsContent value="financials" className="space-y-6 mt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold">États Financiers Détaillés</h3>
                    <p className="text-muted-foreground">
                      Compte de résultat, bilan et flux de trésorerie
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={statementPeriod === 'annual' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setStatementPeriod('annual')}
                    >
                      Annuel
                    </Button>
                    <Button
                      variant={statementPeriod === 'quarter' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setStatementPeriod('quarter')}
                    >
                      Trimestriel
                    </Button>
                  </div>
                </div>
                <FinancialStatementsView
                  incomeStatement={incomeStatement}
                  balanceSheet={balanceSheet}
                  cashFlow={cashFlow}
                  period={statementPeriod}
                />
              </TabsContent>

              {/* Key Metrics Tab */}
              <TabsContent value="metrics" className="mt-6">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold">Métriques et Ratios Financiers</h3>
                  <p className="text-muted-foreground">
                    Analyse approfondie des ratios de valorisation, rentabilité et efficacité
                  </p>
                </div>
                <MetricsView keyMetrics={keyMetrics} />
              </TabsContent>

              {/* Analysts Tab */}
              <TabsContent value="analysts" className="mt-6">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold">Estimations et Dividendes</h3>
                  <p className="text-muted-foreground">
                    Prévisions des analystes et historique des dividendes
                  </p>
                </div>
                <AnalystView
                  analystEstimates={analystEstimates}
                  dividends={dividends}
                />
              </TabsContent>

              {/* Ownership Tab */}
              <TabsContent value="ownership" className="mt-6">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold">Structure Actionnariale</h3>
                  <p className="text-muted-foreground">
                    Actionnaires institutionnels et changements de position
                  </p>
                </div>
                <OwnershipView institutionalHolders={institutionalHolders} />
              </TabsContent>

              {/* News Tab */}
              <TabsContent value="news" className="mt-6">
                <NewsView news={news} />
              </TabsContent>
            </Tabs>
          </div>
        )}
      </main>
    </div>
  );
}
