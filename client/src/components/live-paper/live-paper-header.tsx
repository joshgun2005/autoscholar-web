import { motion } from "framer-motion";
import {
  Brain, Clock, Cpu, FileText, Activity, ShieldCheck,
  Loader2, CheckCircle, AlertTriangle, Wrench,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { LivePaperState, PaperStatus } from "./types";

const STATUS_MAP: Record<PaperStatus, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  researching: { label: "Researching",  icon: Activity,       color: "text-violet-500",  bg: "bg-violet-500/10 border-violet-500/25" },
  writing:     { label: "Writing",      icon: FileText,       color: "text-sky-500",     bg: "bg-sky-500/10 border-sky-500/25" },
  validating:  { label: "Validating",   icon: ShieldCheck,    color: "text-amber-500",   bg: "bg-amber-500/10 border-amber-500/25" },
  compiling:   { label: "Compiling",    icon: Cpu,            color: "text-rose-500",    bg: "bg-rose-500/10 border-rose-500/25" },
  recovery:    { label: "Recovering",   icon: Wrench,         color: "text-orange-500",  bg: "bg-orange-500/10 border-orange-500/25" },
  completed:   { label: "Completed",    icon: CheckCircle,    color: "text-emerald-500", bg: "bg-emerald-500/10 border-emerald-500/25" },
};

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 60) return `${m}m ${s.toString().padStart(2, "0")}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${(m % 60).toString().padStart(2, "0")}m`;
}

export function LivePaperHeader({ state }: { state: LivePaperState }) {
  const cfg = STATUS_MAP[state.status];
  const Icon = cfg.icon;
  const isRunning = state.status !== "completed";
  const activeAgent = state.agents.find(a => a.id === state.activeAgentId);

  return (
    <div className="space-y-5">
      {/* Title + status row */}
      <div className="flex flex-col lg:flex-row lg:items-start gap-4">
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <Badge variant="outline" className={cn("gap-1.5 text-[11px] font-semibold px-3 py-1.5 border", cfg.bg, cfg.color)}>
              {isRunning ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Icon className="h-3 w-3" />
              )}
              {cfg.label}
            </Badge>
            {isRunning && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/50 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-[1.7rem] font-bold text-foreground leading-tight tracking-tight">
            {state.title}
          </h1>
          <p className="text-sm text-muted-foreground/60 font-medium">{state.subtitle}</p>
        </div>

        {/* Compact metrics */}
        <div className="flex items-center gap-3 flex-wrap shrink-0">
          <MetricPill icon={Clock} label={formatElapsed(state.elapsedSeconds)} />
          <MetricPill icon={Cpu} label={`${(state.totalTokens / 1000).toFixed(0)}K tokens`} />
          {activeAgent && (
            <MetricPill icon={Brain} label={activeAgent.name} accent />
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground/60 font-medium">Pipeline Progress</span>
          <span className="font-bold font-mono text-foreground">{state.progress}%</span>
        </div>
        <div className="h-2 bg-muted/20 rounded-full overflow-hidden border border-border/20">
          <motion.div
            className={cn(
              "h-full rounded-full",
              state.status === "completed"
                ? "bg-emerald-500"
                : "bg-gradient-to-r from-primary/80 to-primary",
            )}
            initial={{ width: 0 }}
            animate={{ width: `${state.progress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
        {/* Mini stage indicators */}
        <div className="flex items-center gap-0 text-[9px] font-semibold uppercase tracking-widest">
          {(["researching", "writing", "validating", "compiling"] as PaperStatus[]).map((s, i) => {
            const done = statusOrder(state.status) > statusOrder(s);
            const active = state.status === s;
            const label = s === "researching" ? "Research" : s === "writing" ? "Write" : s === "validating" ? "Validate" : "Compile";
            return (
              <span key={s} className="flex items-center">
                {i > 0 && (
                  <span className={cn(
                    "mx-2 text-[8px]",
                    done ? "text-emerald-500/50" : "text-muted-foreground/20",
                  )}>
                    ›
                  </span>
                )}
                <span className={cn(
                  "transition-colors px-1.5 py-0.5 rounded",
                  done && "text-emerald-600 bg-emerald-500/10",
                  active && "text-primary bg-primary/10",
                  !done && !active && "text-muted-foreground/30",
                )}>
                  {done ? `${label} ✓` : label}
                  {active && state.status !== "completed" && (
                    <span className="inline-block w-1 h-1 rounded-full bg-primary ml-1 animate-pulse align-middle" />
                  )}
                </span>
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MetricPill({ icon: Icon, label, accent }: { icon: React.ElementType; label: string; accent?: boolean }) {
  return (
    <div className={cn(
      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[11px] font-medium",
      accent
        ? "bg-primary/5 border-primary/20 text-primary"
        : "bg-muted/15 border-border/20 text-muted-foreground/70"
    )}>
      <Icon className="h-3 w-3" />
      {label}
    </div>
  );
}

function statusOrder(s: PaperStatus): number {
  const order: Record<PaperStatus, number> = { researching: 0, writing: 1, validating: 2, compiling: 3, recovery: 3, completed: 5 };
  return order[s] ?? 0;
}
