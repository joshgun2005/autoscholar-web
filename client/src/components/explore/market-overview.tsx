import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Activity, Clock, DollarSign, BarChart3 } from "lucide-react";

interface MarketIndex {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changesPercentage: number;
  dayLow: number;
  dayHigh: number;
  yearHigh: number;
  yearLow: number;
  volume: number;
  previousClose: number;
}

interface MarketStatus {
  isTheStockMarketOpen: boolean;
  stockMarketHours: {
    openingHour: string;
    closingHour: string;
  };
}

interface Stock {
  symbol: string;
  name: string;
  price: number;
  changesPercentage: number;
  change: number;
  volume?: number;
  marketCap?: number;
}

interface MarketOverviewProps {
  marketIndices?: MarketIndex[];
  marketStatus?: MarketStatus;
  gainers?: Stock[];
  losers?: Stock[];
  activeStocks?: Stock[];
  onTickerClick: (ticker: string) => void;
}

export function MarketOverview({
  marketIndices,
  marketStatus,
  gainers,
  losers,
  activeStocks,
  onTickerClick
}: MarketOverviewProps) {
  const formatNumber = (num: number) => {
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  const formatVolume = (vol: number) => {
    if (vol >= 1e9) return `${(vol / 1e9).toFixed(2)}B`;
    if (vol >= 1e6) return `${(vol / 1e6).toFixed(2)}M`;
    if (vol >= 1e3) return `${(vol / 1e3).toFixed(2)}K`;
    return vol.toString();
  };

  return (
    <div className="space-y-8">
      {/* Market Status Banner */}
      {marketStatus && (
        <Card className="bg-gradient-to-br from-card via-card to-primary/5 border-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl">Statut du Marché</CardTitle>
                  <CardDescription className="text-base">
                    Heures d'ouverture: {marketStatus.stockMarketHours?.openingHour} - {marketStatus.stockMarketHours?.closingHour}
                  </CardDescription>
                </div>
              </div>
              <Badge
                variant={marketStatus.isTheStockMarketOpen ? "default" : "secondary"}
                className="text-lg px-6 py-3"
              >
                {marketStatus.isTheStockMarketOpen ? "🟢 OUVERT" : "🔴 FERMÉ"}
              </Badge>
            </div>
          </CardHeader>
        </Card>
      )}

      {/* Major Indices */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/10">
            <Activity className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Indices Majeurs</h2>
            <p className="text-muted-foreground">Performance en temps réel des principaux indices boursiers</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {marketIndices?.map((index) => {
            const isPositive = index.changesPercentage >= 0;

            return (
              <Card
                key={index.symbol}
                className="cursor-pointer hover:border-primary/50 hover:shadow-xl transition-all duration-300 hover:scale-[1.02]"
                onClick={() => onTickerClick(index.symbol)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl mb-1">{index.name}</CardTitle>
                      <CardDescription className="text-base font-mono">{index.symbol}</CardDescription>
                    </div>
                    <div className={`p-2 rounded-lg ${isPositive ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                      {isPositive ? (
                        <TrendingUp className="w-5 h-5 text-green-500" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-3xl font-bold">
                        {index.price?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className={`text-base font-semibold flex items-center gap-1.5 mt-1 ${
                        isPositive ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {isPositive ? '+' : ''}{index.change?.toFixed(2)}
                        <span className="text-sm">({isPositive ? '+' : ''}{index.changesPercentage?.toFixed(2)}%)</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div className="text-muted-foreground text-xs">Jour Bas/Haut</div>
                      <div className="font-semibold">
                        {index.dayLow > 0 ? `${index.dayLow.toFixed(2)} / ${index.dayHigh.toFixed(2)}` : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs">Année Bas/Haut</div>
                      <div className="font-semibold">
                        {index.yearLow > 0 ? `${index.yearLow.toFixed(2)} / ${index.yearHigh.toFixed(2)}` : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs">Clôture Précédente</div>
                      <div className="font-semibold">
                        {index.previousClose > 0 ? index.previousClose.toFixed(2) : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs">Volume</div>
                      <div className="font-semibold">
                        {index.volume > 0 ? formatVolume(index.volume) : 'N/A'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Market Movers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Gainers */}
        <Card className="border-2 hover:border-green-500/50 transition-colors">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <CardTitle className="text-xl text-green-500">Top Hausses</CardTitle>
                <CardDescription>Actions les plus performantes</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {gainers?.slice(0, 8).map((stock, index) => (
                <div
                  key={stock.symbol}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-accent cursor-pointer transition-all hover:shadow-md border border-transparent hover:border-green-500/30"
                  onClick={() => onTickerClick(stock.symbol)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center text-xs font-bold text-green-500">
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-base">{stock.symbol}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {stock.name}
                      </div>
                      {stock.volume && (
                        <div className="text-xs text-muted-foreground">
                          Vol: {formatVolume(stock.volume)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <div className="font-bold text-base">${stock.price?.toFixed(2)}</div>
                    <div className="text-sm font-semibold text-green-500">
                      +{stock.changesPercentage?.toFixed(2)}%
                    </div>
                    <div className="text-xs text-green-500">
                      +${stock.change?.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Losers */}
        <Card className="border-2 hover:border-red-500/50 transition-colors">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-500/10">
                <TrendingDown className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <CardTitle className="text-xl text-red-500">Top Baisses</CardTitle>
                <CardDescription>Actions les plus en baisse</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {losers?.slice(0, 8).map((stock, index) => (
                <div
                  key={stock.symbol}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-accent cursor-pointer transition-all hover:shadow-md border border-transparent hover:border-red-500/30"
                  onClick={() => onTickerClick(stock.symbol)}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-500/10 flex items-center justify-center text-xs font-bold text-red-500">
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-base">{stock.symbol}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {stock.name}
                      </div>
                      {stock.volume && (
                        <div className="text-xs text-muted-foreground">
                          Vol: {formatVolume(stock.volume)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <div className="font-bold text-base">${stock.price?.toFixed(2)}</div>
                    <div className="text-sm font-semibold text-red-500">
                      {stock.changesPercentage?.toFixed(2)}%
                    </div>
                    <div className="text-xs text-red-500">
                      ${stock.change?.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Most Active */}
        <Card className="border-2 hover:border-blue-500/50 transition-colors">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Activity className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <CardTitle className="text-xl text-blue-500">Plus Actifs</CardTitle>
                <CardDescription>Volume de transactions le plus élevé</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeStocks?.slice(0, 8).map((stock, index) => {
                const isPositive = stock.changesPercentage >= 0;
                return (
                  <div
                    key={stock.symbol}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-accent cursor-pointer transition-all hover:shadow-md border border-transparent hover:border-blue-500/30"
                    onClick={() => onTickerClick(stock.symbol)}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center text-xs font-bold text-blue-500">
                        {index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-base">{stock.symbol}</div>
                        <div className="text-xs text-muted-foreground truncate">
                          {stock.name}
                        </div>
                        {stock.volume && (
                          <div className="text-xs text-blue-500 font-semibold">
                            Vol: {formatVolume(stock.volume)}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <div className="font-bold text-base">${stock.price?.toFixed(2)}</div>
                      <div className={`text-sm font-semibold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                        {isPositive ? '+' : ''}{stock.changesPercentage?.toFixed(2)}%
                      </div>
                      <div className={`text-xs ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                        {isPositive ? '+' : ''}${stock.change?.toFixed(2)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
