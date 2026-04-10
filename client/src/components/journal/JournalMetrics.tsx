import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { FileText, Award, Globe, TrendingUp, Activity, CheckCircle } from "lucide-react";

interface JournalStats {
  totalPapers: number;
  totalRuns: number;
  publishedRuns: number;
  rejectedRuns: number;
  avgPeerReviewScore: number;
  uniqueDomains: number;
  acceptanceRate: number;
}

const METRICS = [
  { key: "totalPapers" as const, label: "Papers Published", icon: FileText, format: (v: number) => `${v}` },
  { key: "avgPeerReviewScore" as const, label: "Avg Peer Review", icon: Award, format: (v: number) => v > 0 ? `${v}/100` : "—" },
  { key: "uniqueDomains" as const, label: "Research Domains", icon: Globe, format: (v: number) => `${v}` },
  { key: "totalRuns" as const, label: "Pipeline Runs", icon: Activity, format: (v: number) => `${v}` },
  { key: "acceptanceRate" as const, label: "Acceptance Rate", icon: CheckCircle, format: (v: number) => v > 0 ? `${v}%` : "—" },
];

export function JournalMetrics() {
  const { data: stats } = useQuery<JournalStats>({
    queryKey: ["/api/platform/journal-stats"],
    queryFn: async () => {
      const res = await fetch("/api/platform/journal-stats");
      return res.json();
    },
    refetchInterval: 30000,
  });

  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 sm:gap-6">
      {METRICS.map((metric, i) => (
        <motion.div
          key={metric.key}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.08 }}
          className="text-center"
        >
          <metric.icon className="h-5 w-5 text-primary/60 mx-auto mb-2" />
          <div className="text-2xl sm:text-3xl font-display font-bold text-foreground">
            {metric.format(stats[metric.key])}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">{metric.label}</div>
        </motion.div>
      ))}
    </div>
  );
}
