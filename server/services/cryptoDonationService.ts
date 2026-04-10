/**
 * Crypto Donation Service
 * Monitors BTC, ETH, and USDC wallet balances via public blockchain APIs.
 * Caches results for 5 minutes to avoid rate limits.
 */

const WALLETS = {
  btc: "bc1qld6thwyay7g88nr48mgwvape4jtwwmxtg2faa6",
  eth: "0xa4Aa9d4f54595d561667624D7D1b2F6C9B5897eE",
  usdc: "0xa4Aa9d4f54595d561667624D7D1b2F6C9B5897eE", // same address, ERC-20
} as const;

// USDC contract on Ethereum mainnet
const USDC_CONTRACT = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

interface CryptoBalance {
  btc: number;
  eth: number;
  usdc: number;
  btcUsd: number;
  ethUsd: number;
  usdcUsd: number;
  totalUsd: number;
  lastUpdated: string;
}

let cache: CryptoBalance | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function fetchJson(url: string, timeout = 10_000): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  } finally {
    clearTimeout(timer);
  }
}

/** Fetch BTC balance via Blockchain.info */
async function getBtcBalance(): Promise<number> {
  try {
    const data = await fetchJson(
      `https://blockchain.info/q/addressbalance/${WALLETS.btc}`
    );
    // Returns satoshis as a plain number
    return Number(data) / 1e8;
  } catch (e) {
    console.warn("[crypto] BTC balance fetch failed:", (e as Error).message);
    return 0;
  }
}

/** Fetch ETH balance via public Ethereum RPC (eth_getBalance) */
async function getEthBalance(): Promise<number> {
  try {
    const res = await fetch("https://eth.llamarpc.com", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_getBalance",
        params: [WALLETS.eth, "latest"],
        id: 1,
      }),
    });
    const data = await res.json();
    return parseInt(data.result, 16) / 1e18;
  } catch (e) {
    console.warn("[crypto] ETH balance fetch failed:", (e as Error).message);
    return 0;
  }
}

/** Fetch USDC balance via public Ethereum RPC (ERC-20 balanceOf) */
async function getUsdcBalance(): Promise<number> {
  try {
    // balanceOf(address) selector = 0x70a08231, padded address
    const paddedAddr = WALLETS.usdc.toLowerCase().replace("0x", "").padStart(64, "0");
    const callData = `0x70a08231${paddedAddr}`;

    const res = await fetch("https://eth.llamarpc.com", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "eth_call",
        params: [{ to: USDC_CONTRACT, data: callData }, "latest"],
        id: 2,
      }),
    });
    const data = await res.json();
    // USDC has 6 decimals
    return parseInt(data.result, 16) / 1e6;
  } catch (e) {
    console.warn("[crypto] USDC balance fetch failed:", (e as Error).message);
    return 0;
  }
}

/** Fetch crypto prices from CoinGecko (free, no key needed) */
async function getPrices(): Promise<{ btcUsd: number; ethUsd: number }> {
  try {
    const data = await fetchJson(
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd"
    );
    return {
      btcUsd: data.bitcoin?.usd ?? 0,
      ethUsd: data.ethereum?.usd ?? 0,
    };
  } catch (e) {
    console.warn("[crypto] Price fetch failed:", (e as Error).message);
    return { btcUsd: 0, ethUsd: 0 };
  }
}

/** Get all crypto donation balances (cached) */
export async function getCryptoDonations(): Promise<CryptoBalance> {
  const now = Date.now();
  if (cache && now - cacheTimestamp < CACHE_TTL) {
    return cache;
  }

  const [btc, eth, usdc, prices] = await Promise.all([
    getBtcBalance(),
    getEthBalance(),
    getUsdcBalance(),
    getPrices(),
  ]);

  const btcUsd = btc * prices.btcUsd;
  const ethUsd = eth * prices.ethUsd;
  const usdcUsd = usdc; // 1 USDC ≈ 1 USD

  cache = {
    btc,
    eth,
    usdc,
    btcUsd,
    ethUsd,
    usdcUsd,
    totalUsd: btcUsd + ethUsd + usdcUsd,
    lastUpdated: new Date().toISOString(),
  };
  cacheTimestamp = now;

  return cache;
}

export { WALLETS };
