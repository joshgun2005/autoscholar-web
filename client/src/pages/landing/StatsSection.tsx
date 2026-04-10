import { motion } from "framer-motion";
import {
  FileText, BookOpen, BarChart3, Globe,
  Activity, Award, CheckCircle, Shield,
} from "lucide-react";
import { AnimatedCounter } from "./AnimatedCounter";
import type { JournalStats } from "./constants";

interface StatsSectionProps {
  stats: JournalStats | undefined;
  totalWords: number;
  totalFigures: number;
}

export function StatsSection({ stats, totalWords, totalFigures }: StatsSectionProps) {
  return (
    <section className="relative z-10 py-20 sm:py-24 border-y border-border/20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <span className="metric-label text-muted-foreground/40 mb-3 block">Scientific Output</span>
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground tracking-tight">Publication Metrics</h2>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 sm:gap-5">
          {[
            { label: "Papers Published", value: stats?.totalPapers ?? 0, suffix: "", icon: FileText },
            { label: "Words Generated", value: totalWords > 0 ? Math.round(totalWords / 1000) : 0, suffix: "k", icon: BookOpen },
            { label: "Figures Produced", value: totalFigures, suffix: "", icon: BarChart3 },
            { label: "Domains Covered", value: stats?.uniqueDomains ?? 0, suffix: "", icon: Globe },
            { label: "Pipeline Runs", value: stats?.totalRuns ?? 0, suffix: "", icon: Activity },
            { label: "Review Average", value: stats?.avgPeerReviewScore ?? 0, suffix: "", icon: Award },
            { label: "Acceptance Rate", value: stats?.acceptanceRate ?? 0, suffix: "%", icon: CheckCircle },
            { label: "Rejected Papers", value: stats?.rejectedRuns ?? 0, suffix: "", icon: Shield },
          ].map((metric, i) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="group text-center p-5 rounded-xl border border-border/20 bg-card/30 hover:bg-card/60 hover:border-border/40 transition-all duration-300"
            >
              <metric.icon className="h-4 w-4 mx-auto mb-3 text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
              <div className="metric-number text-2xl sm:text-3xl text-foreground mb-1.5">
                {metric.value > 0 ? <AnimatedCounter value={metric.value} suffix={metric.suffix} /> : <span className="text-muted-foreground/30">—</span>}
              </div>
              <div className="metric-label">{metric.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
