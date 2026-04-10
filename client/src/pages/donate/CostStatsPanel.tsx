import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import type { CostStats } from "./constants";

interface CostStatsPanelProps {
  costStats: CostStats;
}

export function CostStatsPanel({ costStats }: CostStatsPanelProps) {
  if (costStats.totalCost <= 0 && costStats.publishedPapers <= 0) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="mt-6">
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-primary/15 bg-primary/[0.02]">
          <CardContent className="p-3 text-center">
            <div className="text-lg font-bold font-mono text-foreground">${(costStats.totalCost ?? 0).toFixed(0)}</div>
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">Research Cost</div>
          </CardContent>
        </Card>
        <Card className="border-border/30">
          <CardContent className="p-3 text-center">
            <div className="text-lg font-bold font-mono text-foreground">{costStats.publishedPapers}</div>
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">Papers</div>
          </CardContent>
        </Card>
        <Card className="border-border/30">
          <CardContent className="p-3 text-center">
            <div className="text-lg font-bold font-mono text-foreground">${(costStats.costPerPaper ?? 0).toFixed(0)}</div>
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider mt-0.5">Avg / Paper</div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
