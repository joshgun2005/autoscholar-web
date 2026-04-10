import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Search, Database, BarChart3, FileText, Shield } from "lucide-react";

interface ActiveRun {
  id: string;
  status: string;
  domain: string | null;
  method: string | null;
  startedAt: string | null;
  createdAt: string;
}

const STATUS_CONFIG: Record<string, { label: string; agent: string; icon: React.ElementType; color: string }> = {
  queued: { label: "Queued", agent: "", icon: Loader2, color: "text-muted-foreground" },
  researching: { label: "Literature Analysis", agent: "Gauss", icon: Search, color: "text-violet-500" },
  analyzing: { label: "Data & Analysis", agent: "Turing/Fisher", icon: Database, color: "text-blue-500" },
  drafting: { label: "Writing Paper", agent: "Euler", icon: FileText, color: "text-rose-500" },
  validating: { label: "Peer Review", agent: "Popper", icon: Shield, color: "text-amber-500" },
};

export function LiveRunTicker() {
  const { data: activeRun } = useQuery<ActiveRun | null>({
    queryKey: ["/api/platform/active-run"],
    queryFn: async () => {
      const res = await fetch("/api/platform/active-run");
      return res.json();
    },
    refetchInterval: 8000,
  });

  return (
    <AnimatePresence mode="wait">
      {activeRun && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="w-full border-b border-primary/20 bg-primary/[0.03] backdrop-blur-sm"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-2.5 flex items-center justify-center gap-3 text-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>

            <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">Pipeline Active</span>
            <span className="text-muted-foreground/30">·</span>

            {(() => {
              const config = STATUS_CONFIG[activeRun.status] || STATUS_CONFIG.queued;
              const Icon = config.icon;
              return (
                <span className={`inline-flex items-center gap-1.5 font-semibold ${config.color}`}>
                  <Icon className={`h-3.5 w-3.5 ${activeRun.status === 'queued' ? 'animate-spin' : ''}`} />
                  {config.agent && <span>{config.agent}:</span>}
                  {config.label}
                </span>
              );
            })()}

            {activeRun.domain && (
              <span className="hidden sm:inline text-xs text-muted-foreground/60 truncate max-w-[200px]">
                {activeRun.domain}
              </span>
            )}

            {activeRun.startedAt && (
              <span className="text-xs text-muted-foreground/40">
                {Math.round((Date.now() - new Date(activeRun.startedAt).getTime()) / 60000)} min
              </span>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
