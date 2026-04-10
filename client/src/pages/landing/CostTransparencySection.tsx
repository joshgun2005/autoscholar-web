import { motion } from "framer-motion";
import { ArrowRight, Heart, DollarSign, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedCounter } from "./AnimatedCounter";
import type { CostStats } from "./constants";

interface CostTransparencySectionProps {
  costStats: CostStats | undefined;
  onNavigate: (path: string) => void;
}

export function CostTransparencySection({ costStats, onNavigate }: CostTransparencySectionProps) {
  if (!costStats || costStats.totalCost <= 0) return null;

  return (
    <section className="relative z-10 py-24 sm:py-32 border-t border-border/20">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/30 bg-card/40 mb-6">
            <Heart className="h-3 w-3 text-rose-500/60" />
            <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-[0.18em]">Full Cost Transparency</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-5 tracking-tight">
            Every Paper Has a Real Cost
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto font-serif leading-[1.7]">
            AutoScholar is self-funded. Every paper requires real API calls, compute, and infrastructure.
            We believe in full transparency about the cost of autonomous research.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-5 mb-12"
        >
          <div className="text-center p-6 rounded-xl border border-border/30 bg-card/30">
            <DollarSign className="h-4 w-4 mx-auto mb-3 text-muted-foreground/35" />
            <div className="metric-number text-3xl sm:text-4xl text-foreground mb-1">
              <AnimatedCounter value={Math.round(costStats.totalCost)} suffix="" />
              <span className="text-lg text-muted-foreground/50">$</span>
            </div>
            <div className="metric-label">Total Research Cost</div>
          </div>
          <div className="text-center p-6 rounded-xl border border-border/20 bg-card/20">
            <FileText className="h-4 w-4 mx-auto mb-3 text-muted-foreground/30" />
            <div className="metric-number text-3xl sm:text-4xl text-foreground mb-1">
              <AnimatedCounter value={costStats.publishedPapers} />
            </div>
            <div className="metric-label">Papers Published</div>
          </div>
          <div className="text-center p-6 rounded-xl border border-border/20 bg-card/20">
            <DollarSign className="h-4 w-4 mx-auto mb-3 text-muted-foreground/30" />
            <div className="metric-number text-3xl sm:text-4xl text-foreground mb-1">
              <AnimatedCounter value={Math.round(costStats.costPerPaper)} suffix="" />
              <span className="text-lg text-muted-foreground/50">$</span>
            </div>
            <div className="metric-label">Avg. Cost per Paper</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <Button
            size="lg"
            onClick={() => onNavigate("/donate")}
            className="h-12 px-10 text-[13px] font-medium gap-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-500/10 hover:shadow-lg hover:shadow-rose-500/15 transition-all duration-300"
          >
            <Heart className="h-4 w-4" />
            Donate Crypto
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
          <p className="text-[11px] text-muted-foreground/30 mt-4">
            100% of crypto donations go toward API costs and infrastructure. BTC, ETH, USDC accepted.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
