import { cn } from "@/lib/utils";
import { Check, Loader2, AlertTriangle, Clock } from "lucide-react";
import type { RunPhase, PhaseState } from "./types";

const PHASE_COLORS: Record<string, string> = {
  literature: "violet",
  data: "blue",
  preparation: "cyan",
  analysis: "amber",
  writing: "rose",
  compilation: "emerald",
};

function PhaseIcon({ state }: { state: PhaseState }) {
  if (state === "complete") return <Check className="h-3 w-3" />;
  if (state === "active") return <Loader2 className="h-3 w-3 animate-spin" />;
  if (state === "failed") return <AlertTriangle className="h-3 w-3" />;
  return <Clock className="h-2.5 w-2.5 opacity-40" />;
}

function PhaseNode({ phase, isLast }: { phase: RunPhase; isLast: boolean }) {
  const color = PHASE_COLORS[phase.key] || "slate";

  const stateStyles: Record<PhaseState, string> = {
    complete: `bg-${color}-500/15 border-${color}-500/40 text-${color}-700 dark:text-${color}-400`,
    active: `bg-${color}-500/10 border-${color}-500/50 text-${color}-700 dark:text-${color}-400 ring-2 ring-${color}-500/20`,
    failed: "bg-red-500/10 border-red-500/40 text-red-600 dark:text-red-400",
    queued: "bg-muted/40 border-border/40 text-muted-foreground/50",
  };

  // Tailwind safelist — keep these classes available for dynamic color usage
  const _safelist = [
    "bg-violet-500/15", "border-violet-500/40", "text-violet-700", "dark:text-violet-400", "bg-violet-500/10", "border-violet-500/50", "ring-violet-500/20", "bg-violet-500",
    "bg-blue-500/15", "border-blue-500/40", "text-blue-700", "dark:text-blue-400", "bg-blue-500/10", "border-blue-500/50", "ring-blue-500/20", "bg-blue-500",
    "bg-cyan-500/15", "border-cyan-500/40", "text-cyan-700", "dark:text-cyan-400", "bg-cyan-500/10", "border-cyan-500/50", "ring-cyan-500/20", "bg-cyan-500",
    "bg-amber-500/15", "border-amber-500/40", "text-amber-700", "dark:text-amber-400", "bg-amber-500/10", "border-amber-500/50", "ring-amber-500/20", "bg-amber-500",
    "bg-rose-500/15", "border-rose-500/40", "text-rose-700", "dark:text-rose-400", "bg-rose-500/10", "border-rose-500/50", "ring-rose-500/20", "bg-rose-500",
    "bg-emerald-500/15", "border-emerald-500/40", "text-emerald-700", "dark:text-emerald-400", "bg-emerald-500/10", "border-emerald-500/50", "ring-emerald-500/20", "bg-emerald-500",
  ];

  return (
    <div className="flex items-center gap-0">
      <div
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition-all duration-300",
          stateStyles[phase.state],
        )}
      >
        <PhaseIcon state={phase.state} />
        <span className="hidden sm:inline">{phase.agent}</span>
        <span className="sm:hidden">{phase.agent.charAt(0)}</span>
      </div>
      {!isLast && (
        <div className={cn(
          "w-3 md:w-5 h-px mx-0.5",
          phase.state === "complete" ? `bg-${color}-500/40` : "bg-border/40",
        )} />
      )}
    </div>
  );
}

export function RunPhaseMap({ phases }: { phases: RunPhase[] }) {
  return (
    <div className="flex items-center flex-wrap gap-y-2">
      {phases.map((phase, i) => (
        <PhaseNode key={phase.key} phase={phase} isLast={i === phases.length - 1} />
      ))}
    </div>
  );
}
