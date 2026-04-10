import { Heart, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { DonorWallEntry, CurrencySymbol, CryptoSymbol, CryptoDonations } from "./constants";
import { WALLETS, USD_DISPLAY, timeAgo } from "./constants";

interface DonorWallProps {
  donorWall: DonorWallEntry[] | undefined;
  crypto: CryptoDonations | undefined;
}

export function DonorWall({ donorWall, crypto }: DonorWallProps) {
  return (
    <Card className="h-full">
      <CardContent className="p-6 sm:p-8">
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-5">
          <Users className="h-5 w-5 text-primary" />
          Donor Wall
        </h2>

        {!donorWall || donorWall.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-muted/50 mb-4">
              <Heart className="h-6 w-6 text-muted-foreground/40" />
            </div>
            <p className="text-sm text-muted-foreground font-serif">
              Be the first to donate and appear on the wall!
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {donorWall.map((donor) => {
              const sym = (donor.currency || "BTC") as CurrencySymbol;
              const isUsd = sym === "USD";
              const display = isUsd ? USD_DISPLAY : (WALLETS[sym as CryptoSymbol] || WALLETS.BTC);
              const Icon = display.icon;
              return (
                <div
                  key={donor.id}
                  className={`p-3 rounded-xl border ${display.borderColor} bg-card/50 hover:bg-card transition-colors`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-6 h-6 rounded-md ${display.bgColor} flex items-center justify-center`}>
                      <Icon />
                    </div>
                    <span className="text-sm font-semibold text-foreground">{donor.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground/50">
                      {donor.createdAt ? timeAgo(donor.createdAt) : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 pl-8">
                    <span className={`text-sm font-bold font-mono ${display.color}`}>
                      {isUsd ? `$${donor.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}` : `${donor.amount} ${sym}`}
                    </span>
                  </div>
                  {donor.message && (
                    <p className="text-xs text-muted-foreground mt-1.5 pl-8 italic">
                      "{donor.message}"
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-5 pt-4 border-t text-center">
          <p className="text-[10px] text-muted-foreground/40">
            All balances verified on-chain in real-time
          </p>
          {crypto?.lastUpdated && (
            <p className="text-[9px] text-muted-foreground/30 mt-0.5">
              Updated {new Date(crypto.lastUpdated).toLocaleTimeString()}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
