import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown } from "lucide-react";

interface MarketIndex {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changesPercentage: number;
}

export function MarketTicker() {
  const { data: marketIndices } = useQuery({
    queryKey: ['market-ticker'],
    queryFn: async () => {
      const symbols = [
        '^GSPC',      // S&P 500
        '^DJI',       // Dow Jones
        '^IXIC',      // NASDAQ
        '^RUT',       // Russell 2000
        '^FTSE',      // FTSE 100
        '^GDAXI',     // DAX
        '^FCHI',      // CAC 40
        '^N225',      // Nikkei 225
        '^HSI',       // Hang Seng
        '^GSPTSE'     // S&P/TSX
      ];

      const symbolsParam = symbols.join(',');
      const res = await fetch(`https://financialmodelingprep.com/api/v3/quote/${symbolsParam}?apikey=oCml7pKmszWsSRQm8pouC040r8Gu0u0h`);

      if (!res.ok) throw new Error('Failed to fetch market indices');
      const data = await res.json();

      return data
        .filter((index: any) => index && index.symbol && index.price != null)
        .map((index: any) => ({
          symbol: index.symbol,
          name: index.name || index.symbol,
          price: Number(index.price) || 0,
          change: Number(index.change) || 0,
          changesPercentage: Number(index.changesPercentage) || 0,
        }));
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (!marketIndices || marketIndices.length === 0) {
    return null;
  }

  // Duplicate the data to create seamless loop
  const tickerData = [...marketIndices, ...marketIndices];

  return (
    <div className="w-full bg-muted/30 border-b border-border/40 overflow-hidden backdrop-blur-sm">
      <div className="relative h-10 flex items-center">
        <div className="animate-ticker flex items-center gap-8 whitespace-nowrap">
          {tickerData.map((index: MarketIndex, i) => {
            const isPositive = index.changesPercentage >= 0;
            const displaySymbol = index.symbol.replace('^', '');

            return (
              <div
                key={`${index.symbol}-${i}`}
                className="flex items-center gap-2 px-4 py-1 rounded-md bg-card/50 backdrop-blur-sm border border-border/30"
              >
                <span className="font-bold text-sm text-primary">
                  {displaySymbol}
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {index.price.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </span>
                <div className={`flex items-center gap-1 text-xs font-semibold ${
                  isPositive ? 'text-green-500' : 'text-red-500'
                }`}>
                  {isPositive ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  <span>
                    {isPositive ? '+' : ''}{index.changesPercentage.toFixed(2)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes ticker {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .animate-ticker {
          animation: ticker 60s linear infinite;
        }

        .animate-ticker:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
