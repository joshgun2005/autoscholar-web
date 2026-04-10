import { useQuery } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { useLocation } from "wouter";

interface CryptoDonations {
  btc: number;
  eth: number;
  usdc: number;
  btcUsd: number;
  ethUsd: number;
  usdcUsd: number;
  fiatUsd: number;
  totalUsd: number;
  lastUpdated: string | null;
}

export function CryptoDonationBanner() {
  const [, setLocation] = useLocation();

  const { data: crypto } = useQuery<CryptoDonations>({
    queryKey: ["/api/platform/crypto-donations"],
    queryFn: async () => {
      const r = await fetch("/api/platform/crypto-donations");
      return r.json();
    },
    refetchInterval: 5 * 60 * 1000,
    staleTime: 4 * 60 * 1000,
  });

  return (
    <button
      onClick={() => setLocation("/donate")}
      className="w-full bg-gradient-to-r from-orange-500/10 via-blue-500/10 to-emerald-500/10 border-b border-border/30 hover:from-orange-500/15 hover:via-blue-500/15 hover:to-emerald-500/15 transition-all duration-300 cursor-pointer group"
    >
      <div className="mx-auto max-w-7xl px-4 py-1.5 flex items-center justify-center gap-3 text-xs">
        <Heart className="h-3 w-3 text-rose-500 flex-shrink-0" />
        <span className="text-muted-foreground">
          Total donations received:
        </span>
        <span className="font-mono font-semibold text-foreground">
          ${crypto?.totalUsd?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) ?? "0.00"}
        </span>
        <div className="hidden sm:flex items-center gap-2 text-muted-foreground/60">
          <span className="w-px h-3 bg-border/40" />
          {crypto && crypto.fiatUsd > 0 && (
            <span className="font-mono text-green-600/70">${crypto.fiatUsd.toLocaleString()} USD</span>
          )}
          {crypto && crypto.btc > 0 && (
            <span className="font-mono text-orange-500/70">{crypto.btc.toFixed(4)} BTC</span>
          )}
          {crypto && crypto.eth > 0 && (
            <span className="font-mono text-blue-500/70">{crypto.eth.toFixed(3)} ETH</span>
          )}
          {crypto && crypto.usdc > 0 && (
            <span className="font-mono text-emerald-500/70">{crypto.usdc.toFixed(0)} USDC</span>
          )}
        </div>
        <span className="text-primary/60 group-hover:text-primary text-[10px] font-medium transition-colors ml-1">
          Donate &rarr;
        </span>
      </div>
    </button>
  );
}
