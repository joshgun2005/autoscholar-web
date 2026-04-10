import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import {
  Heart, ArrowLeft, ArrowRight, User,
  DollarSign, MessageSquare, Loader2, Check, ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import type { CryptoSymbol, WalletConfig } from "./constants";
import { WALLETS } from "./constants";
import { CopyButton } from "./CopyButton";

interface DonationFormProps {
  step: "form" | "qr" | "done";
  setStep: (step: "form" | "qr" | "done") => void;
  name: string;
  setName: (name: string) => void;
  selectedCrypto: CryptoSymbol;
  setSelectedCrypto: (sym: CryptoSymbol) => void;
  amount: string;
  setAmount: (amount: string) => void;
  message: string;
  setMessage: (message: string) => void;
  showOnWall: boolean;
  setShowOnWall: (show: boolean) => void;
  isFormValid: boolean;
  parsedAmount: number;
  wallet: WalletConfig;
  qrValue: string;
  submitMutation: { mutate: () => void; isPending: boolean };
  onNavigateHome: () => void;
}

export function DonationForm({
  step, setStep,
  name, setName,
  selectedCrypto, setSelectedCrypto,
  amount, setAmount,
  message, setMessage,
  showOnWall, setShowOnWall,
  isFormValid, parsedAmount,
  wallet, qrValue,
  submitMutation,
  onNavigateHome,
}: DonationFormProps) {
  return (
    <AnimatePresence mode="wait">
      {step === "form" && (
        <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <Card>
            <CardContent className="p-6 sm:p-8 space-y-5">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Heart className="h-5 w-5 text-rose-500" />
                Make a Donation
              </h2>

              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <User className="h-3 w-3" /> Your Name (for donor wall)
                </label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name or pseudonym" />
              </div>

              {/* Crypto selector */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Select Cryptocurrency</label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(WALLETS) as CryptoSymbol[]).map((sym) => {
                    const w = WALLETS[sym];
                    const Icon = w.icon;
                    return (
                      <button
                        key={sym}
                        onClick={() => setSelectedCrypto(sym)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                          selectedCrypto === sym
                            ? `${w.borderColor} ${w.bgColor} shadow-sm`
                            : "border-border/30 hover:border-border/60"
                        }`}
                      >
                        <Icon />
                        <span className={`text-xs font-bold ${selectedCrypto === sym ? w.color : "text-muted-foreground"}`}>
                          {sym}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Amount */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <DollarSign className="h-3 w-3" /> Amount ({selectedCrypto})
                </label>
                <Input
                  type="number"
                  step="any"
                  min="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={selectedCrypto === "BTC" ? "0.001" : selectedCrypto === "ETH" ? "0.05" : "50"}
                  className="font-mono"
                />
              </div>

              {/* Message */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <MessageSquare className="h-3 w-3" /> Message (optional)
                </label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="A message to display on the donor wall..."
                  className="min-h-[60px] resize-y"
                />
              </div>

              {/* Show on wall toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showOnWall}
                  onChange={(e) => setShowOnWall(e.target.checked)}
                  className="rounded border-border"
                />
                <span className="text-xs text-muted-foreground">Show my name on the donor wall</span>
              </label>

              {/* Submit */}
              <Button
                onClick={() => setStep("qr")}
                disabled={!isFormValid}
                className="w-full h-12 text-base font-semibold gap-2 rounded-xl shadow-lg shadow-primary/20"
              >
                Show Payment QR Code
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {step === "qr" && (
        <motion.div key="qr" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <Card className={wallet.borderColor}>
            <CardContent className="p-6 sm:p-8 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <wallet.icon />
                  Send {parsedAmount} {selectedCrypto}
                </h2>
                <Button variant="ghost" size="sm" onClick={() => setStep("form")} className="text-xs gap-1">
                  <ArrowLeft className="h-3 w-3" /> Back
                </Button>
              </div>

              {/* QR Code */}
              <div className="flex justify-center">
                <div className="bg-white p-4 rounded-2xl shadow-lg">
                  <QRCodeSVG
                    value={qrValue}
                    size={200}
                    level="M"
                    includeMargin={false}
                  />
                </div>
              </div>

              {/* Address */}
              <div className="space-y-2">
                <label className="text-[10px] text-muted-foreground uppercase tracking-wider">Wallet Address</label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-[11px] font-mono text-foreground/80 bg-muted/50 px-3 py-2 rounded-lg break-all select-all">
                    {wallet.address}
                  </code>
                  <CopyButton text={wallet.address} />
                </div>
              </div>

              {/* Amount reminder */}
              <div className={`text-center p-3 rounded-xl ${wallet.bgColor}`}>
                <div className="text-xs text-muted-foreground mb-0.5">Amount to send</div>
                <div className={`text-xl font-bold font-mono ${wallet.color}`}>
                  {parsedAmount} {selectedCrypto}
                </div>
              </div>

              {/* Explorer link */}
              <a
                href={wallet.explorerUrl(wallet.address)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View on blockchain explorer
              </a>

              <div className="border-t pt-4 space-y-3">
                <p className="text-[11px] text-muted-foreground text-center">
                  After sending, click below to register your donation on the donor wall.
                </p>
                <Button
                  onClick={() => submitMutation.mutate()}
                  disabled={submitMutation.isPending}
                  className="w-full h-11 font-semibold gap-2 rounded-xl"
                >
                  {submitMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Registering...</>
                  ) : (
                    <><Check className="h-4 w-4" /> I've Sent My Donation</>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {step === "done" && (
        <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
          <Card className="border-emerald-500/20">
            <CardContent className="p-8 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-500/10 mb-5">
                <Check className="h-8 w-8 text-emerald-500" />
              </div>
              <h2 className="text-2xl font-display font-bold text-foreground mb-3">Thank You, {name}!</h2>
              <p className="text-muted-foreground mb-6 font-serif">
                Your donation of <strong>{parsedAmount} {selectedCrypto}</strong> has been registered.
                {showOnWall && " Your name will appear on the donor wall."}
              </p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => { setStep("form"); setAmount(""); setMessage(""); }} className="gap-2 rounded-xl">
                  <Heart className="h-4 w-4" /> Donate Again
                </Button>
                <Button onClick={onNavigateHome} className="gap-2 rounded-xl">
                  <ArrowLeft className="h-4 w-4" /> Back to AutoScholar
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
