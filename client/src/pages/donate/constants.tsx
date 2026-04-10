export interface CostStats {
  totalCost: number;
  publishedPapers: number;
  costPerPaper: number;
  totalInputTokens: number;
  totalOutputTokens: number;
}

export interface CryptoDonations {
  btc: number;
  eth: number;
  usdc: number;
  btcUsd: number;
  ethUsd: number;
  usdcUsd: number;
  fiatUsd: number;
  totalUsd: number;
  lastUpdated: string | null;
  wallets: { btc: string; eth: string; usdc: string };
}

export interface DonorWallEntry {
  id: string;
  name: string;
  amount: number;
  currency: string;
  message: string | null;
  createdAt: string;
}

export type CryptoSymbol = "BTC" | "ETH" | "USDC";
export type CurrencySymbol = CryptoSymbol | "USD";

export interface WalletConfig {
  name: string;
  address: string;
  color: string;
  bgColor: string;
  borderColor: string;
  qrPrefix: (addr: string, amount: number) => string;
  explorerUrl: (addr: string) => string;
  icon: () => JSX.Element;
}

export const USD_DISPLAY = {
  name: "US Dollar",
  color: "text-green-600",
  bgColor: "bg-green-600/10",
  borderColor: "border-green-600/20",
  icon: () => (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
};

export const WALLETS: Record<CryptoSymbol, WalletConfig> = {
  BTC: {
    name: "Bitcoin",
    address: "bc1qld6thwyay7g88nr48mgwvape4jtwwmxtg2faa6",
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/20",
    qrPrefix: (addr, amt) => `bitcoin:${addr}${amt > 0 ? `?amount=${amt}` : ""}`,
    explorerUrl: (addr) => `https://mempool.space/address/${addr}`,
    icon: () => (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
        <path d="M23.638 14.904c-1.602 6.43-8.113 10.34-14.542 8.736C2.67 22.05-1.244 15.525.362 9.105 1.962 2.67 8.475-1.243 14.9.358c6.43 1.605 10.342 8.115 8.738 14.546z" fill="#f7931a"/>
        <path d="M17.2 10.576c.24-1.578-1.004-2.425-2.712-2.992l.554-2.22-1.354-.337-.54 2.163c-.356-.089-.722-.172-1.086-.255l.543-2.178-1.352-.338-.555 2.22c-.294-.067-.584-.133-.865-.203l.002-.006-1.866-.466-.36 1.446s1.004.23.983.244c.548.137.647.5.63.788l-.632 2.534c.038.01.087.024.14.045l-.142-.035-.886 3.553c-.067.166-.237.416-.62.322.013.02-.984-.246-.984-.246l-.672 1.55 1.762.44c.328.082.649.168.965.249l-.56 2.247 1.352.338.555-2.224c.37.1.728.193 1.08.28l-.553 2.213 1.354.337.56-2.243c2.306.436 4.04.26 4.77-1.826.588-1.68-.029-2.649-1.244-3.28.885-.204 1.55-.786 1.728-1.987zm-3.093 4.34c-.418 1.68-3.244.771-4.16.544l.742-2.977c.916.229 3.855.682 3.418 2.433zm.418-4.363c-.38 1.527-2.733.751-3.497.561l.673-2.7c.764.19 3.222.546 2.824 2.14z" fill="#fff"/>
      </svg>
    ),
  },
  ETH: {
    name: "Ethereum",
    address: "0xa4Aa9d4f54595d561667624D7D1b2F6C9B5897eE",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
    qrPrefix: (addr, amt) => `ethereum:${addr}${amt > 0 ? `?value=${amt}e18` : ""}`,
    explorerUrl: (addr) => `https://etherscan.io/address/${addr}`,
    icon: () => (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
        <path d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM12.056 0L4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z" fill="#627EEA"/>
      </svg>
    ),
  },
  USDC: {
    name: "USD Coin (ERC-20)",
    address: "0xa4Aa9d4f54595d561667624D7D1b2F6C9B5897eE",
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    borderColor: "border-emerald-500/20",
    qrPrefix: (addr) => `ethereum:${addr}`,
    explorerUrl: (addr) => `https://etherscan.io/address/${addr}#tokentxns`,
    icon: () => (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="currentColor">
        <circle cx="12" cy="12" r="12" fill="#2775CA"/>
        <path d="M15.6 14.4c0-1.68-1.02-2.25-3.06-2.49-1.44-.18-1.74-.54-1.74-1.17s.48-1.02 1.44-1.02c.84 0 1.32.3 1.56.96.06.12.18.18.3.18h.72c.18 0 .3-.12.3-.3v-.06c-.24-.96-1.02-1.68-2.1-1.8V7.56c0-.18-.12-.3-.36-.36h-.6c-.18 0-.3.12-.36.36v1.08c-1.44.18-2.34 1.08-2.34 2.22 0 1.56.96 2.22 3 2.46 1.32.18 1.8.48 1.8 1.2 0 .72-.66 1.2-1.56 1.2-1.2 0-1.62-.48-1.8-1.14-.06-.12-.18-.24-.3-.24h-.78c-.18 0-.3.12-.3.3v.06c.24 1.08 1.02 1.86 2.28 2.1v1.14c0 .18.12.3.36.36h.6c.18 0 .3-.12.36-.36v-1.14c1.44-.24 2.4-1.14 2.4-2.4z" fill="white"/>
      </svg>
    ),
  },
};

export function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000_000) return `${(tokens / 1_000_000_000).toFixed(1)}B`;
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(0)}K`;
  return String(tokens);
}

export function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}
