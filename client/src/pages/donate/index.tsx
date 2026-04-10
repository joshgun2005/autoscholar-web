import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { GraduationCap, Heart, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { CostStats, CryptoDonations, DonorWallEntry, CryptoSymbol } from "./constants";
import { WALLETS } from "./constants";
import { DonationForm } from "./DonationForm";
import { DonorWall } from "./DonorWall";
import { DonationBanner } from "./DonationBanner";
import { CostStatsPanel } from "./CostStatsPanel";

export default function Donate() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  // Form state
  const [step, setStep] = useState<"form" | "qr" | "done">("form");
  const [name, setName] = useState("");
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoSymbol>("BTC");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [showOnWall, setShowOnWall] = useState(true);

  // Queries
  const { data: costStats } = useQuery<CostStats>({
    queryKey: ["/api/platform/cost-stats"],
    queryFn: async () => (await fetch("/api/platform/cost-stats")).json(),
  });

  const { data: crypto } = useQuery<CryptoDonations>({
    queryKey: ["/api/platform/crypto-donations"],
    queryFn: async () => (await fetch("/api/platform/crypto-donations")).json(),
    refetchInterval: 5 * 60 * 1000,
  });

  const { data: donorWall } = useQuery<DonorWallEntry[]>({
    queryKey: ["/api/platform/donor-wall"],
    queryFn: async () => (await fetch("/api/platform/donor-wall")).json(),
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/platform/donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          amount: parseFloat(amount),
          currency: selectedCrypto,
          message: message.trim() || undefined,
          showOnWall,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/platform/donor-wall"] });
      setStep("done");
    },
  });

  const wallet = WALLETS[selectedCrypto];
  const parsedAmount = parseFloat(amount) || 0;
  const qrValue = wallet.qrPrefix(wallet.address, parsedAmount);
  const isFormValid = name.trim().length >= 2 && parsedAmount > 0;

  return (
    <div className="min-h-[100dvh] bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-4xl flex h-14 items-center justify-between px-4">
          <button onClick={() => setLocation("/")} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-primary" />
            </div>
            <span className="text-sm font-bold">AutoScholar</span>
          </button>
          <Button variant="ghost" size="sm" onClick={() => setLocation("/")} className="gap-1.5 text-xs">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-rose-500/10 mb-5">
            <Heart className="h-8 w-8 text-rose-500" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-3">
            Support AutoScholar Research
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto text-base font-serif">
            Donate crypto to support the computational infrastructure behind autonomous paper generation.
          </p>
        </motion.div>

        {/* Total donated banner */}
        {crypto && <DonationBanner crypto={crypto} />}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left: Donation Form / QR */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <DonationForm
              step={step}
              setStep={setStep}
              name={name}
              setName={setName}
              selectedCrypto={selectedCrypto}
              setSelectedCrypto={setSelectedCrypto}
              amount={amount}
              setAmount={setAmount}
              message={message}
              setMessage={setMessage}
              showOnWall={showOnWall}
              setShowOnWall={setShowOnWall}
              isFormValid={isFormValid}
              parsedAmount={parsedAmount}
              wallet={wallet}
              qrValue={qrValue}
              submitMutation={submitMutation}
              onNavigateHome={() => setLocation("/")}
            />

            {/* Cost transparency */}
            {costStats && <CostStatsPanel costStats={costStats} />}
          </motion.div>

          {/* Right: Donor Wall */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <DonorWall donorWall={donorWall} crypto={crypto} />
          </motion.div>
        </div>
      </main>
    </div>
  );
}
