import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import type { CryptoDonations } from "./constants";

interface DonationBannerProps {
  crypto: CryptoDonations;
}

export function DonationBanner({ crypto }: DonationBannerProps) {
  if (crypto.totalUsd <= 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8">
      <Card className="border-emerald-500/20 bg-emerald-500/[0.03]">
        <CardContent className="p-5 text-center">
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Total Donations Received (on-chain)</div>
          <div className="text-3xl font-bold font-mono text-foreground">
            ${crypto.totalUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="flex items-center justify-center gap-4 mt-3 text-xs text-muted-foreground">
            {crypto.fiatUsd > 0 && <span className="text-green-600">${crypto.fiatUsd.toLocaleString()} USD</span>}
            {crypto.btc > 0 && <span className="text-orange-500">{crypto.btc.toFixed(6)} BTC</span>}
            {crypto.eth > 0 && <span className="text-blue-500">{crypto.eth.toFixed(4)} ETH</span>}
            {crypto.usdc > 0 && <span className="text-emerald-500">{crypto.usdc.toFixed(2)} USDC</span>}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
