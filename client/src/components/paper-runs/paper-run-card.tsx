import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Loader2, Clock, AlertTriangle, CheckCircle, ChevronRight,
  BookOpen, Image, FileText, BarChart3,
} from "lucide-react";
import { RunPhaseMap } from "./run-phase-map";
import { LiveNarrative } from "./live-narrative";
import type { PaperRunSummary, PaperRunDetail } from "./types";

const STATUS_CONFIG: Record<string, { label: string; color: string; bgAccent: string; icon: typeof Loader2 }> = {
  queued: { label: "Queued", color: "bg-slate-500/10 text-slate-600 border-slate-500/30", bgAccent: "", icon: Clock },
  researching: { label: "Researching", color: "bg-violet-500/10 text-violet-600 border-violet-500/30", bgAccent: "border-l-violet-500", icon: Loader2 },
  analyzing: { label: "Analyzing", color: "bg-blue-500/10 text-blue-600 border-blue-500/30", bgAccent: "border-l-blue-500", icon: Loader2 },
  drafting: { label: "Writing", color: "bg-amber-500/10 text-amber-600 border-amber-500/30", bgAccent: "border-l-amber-500", icon: Loader2 },
  validating: { label: "Peer Review", color: "bg-cyan-500/10 text-cyan-600 border-cyan-500/30", bgAccent: "border-l-cyan-500", icon: Loader2 },
  published: { label: "Published", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30", bgAccent: "border-l-emerald-500", icon: CheckCircle },
  rejected: { label: "Rejected", color: "bg-red-500/10 text-red-600 border-red-500/30", bgAccent: "border-l-red-500", icon: AlertTriangle },
  failed: { label: "Failed", color: "bg-red-500/10 text-red-600 border-red-500/30", bgAccent: "border-l-red-500", icon: AlertTriangle },
};

function formatElapsed(startedAt: string | null): string {
  if (!startedAt) return "";
  const ms = Date.now() - new Date(startedAt).getTime();
  if (ms < 60_000) return "<1m";
  const mins = Math.floor(ms / 60_000);
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

function MiniStat({ icon: Icon, value, color }: { icon: typeof BookOpen; value: number; color: string }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-1">
      <Icon className={cn("h-3 w-3", color)} />
      <span className="text-[11px] font-medium tabular-nums text-foreground/70">{value}</span>
    </div>
  );
}

export function PaperRunCard({
  run,
  onOpenDetail,
}: {
  run: PaperRunSummary;
  onOpenDetail: (runId: string) => void;
}) {
  const isActive = ["queued", "researching", "analyzing", "drafting", "validating"].includes(run.status);
  const cfg = STATUS_CONFIG[run.status] || STATUS_CONFIG.queued;
  const StatusIcon = cfg.icon;

  // Fetch enriched detail for active runs (lightweight polling)
  const { data: detail } = useQuery<PaperRunDetail>({
    queryKey: ["/api/profile/paper-runs", run.id, "detail"],
    queryFn: async () => {
      const res = await fetch(`/api/profile/paper-runs/${run.id}/detail`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    refetchInterval: isActive ? 5000 : false,
    staleTime: isActive ? 3000 : 60000,
  });

  const promptPreview = run.prompt
    ? run.prompt.length > 140 ? run.prompt.slice(0, 140) + "..." : run.prompt
    : "Paper generation";

  return (
    <div
      className={cn(
        "group relative rounded-xl border bg-card overflow-hidden transition-all duration-200",
        "hover:shadow-md hover:border-border/80 cursor-pointer",
        isActive && "border-l-[3px]",
        isActive && cfg.bgAccent,
      )}
      onClick={() => onOpenDetail(run.id)}
    >
      {/* Active indicator glow */}
      {isActive && (
        <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.02] to-transparent pointer-events-none" />
      )}

      <div className="relative p-4 space-y-3">
        {/* Row 1: Status + Domain + Time */}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={cn("text-[10px] gap-1 font-medium", cfg.color)}>
            <StatusIcon className={cn("h-3 w-3", isActive && "animate-spin")} />
            {cfg.label}
          </Badge>
          {run.domain && run.domain !== "Custom" && (
            <Badge variant="outline" className="text-[10px]">{run.domain}</Badge>
          )}
          {run.popperScore != null && (
            <Badge variant="outline" className={cn(
              "text-[10px] gap-1",
              run.popperScore >= 70 ? "text-emerald-600 border-emerald-500/30" :
              run.popperScore >= 50 ? "text-amber-600 border-amber-500/30" : "text-red-600 border-red-500/30",
            )}>
              Popper: {run.popperScore}
            </Badge>
          )}
          <div className="flex items-center gap-1.5 ml-auto">
            {isActive && run.startedAt && (
              <span className="text-[10px] text-muted-foreground tabular-nums flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatElapsed(run.startedAt)}
              </span>
            )}
            <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors" />
          </div>
        </div>

        {/* Row 2: Prompt preview */}
        <p className="text-xs text-foreground/80 leading-relaxed line-clamp-2">
          {detail?.paperTitle || promptPreview}
        </p>

        {/* Row 3: Phase map (from detail data) */}
        {detail?.phases && (
          <RunPhaseMap phases={detail.phases} />
        )}

        {/* Row 4: Narrative (active runs only) */}
        {detail?.narrative && isActive && (
          <div className="pt-1">
            <LiveNarrative narrative={detail.narrative} isActive={isActive} />
          </div>
        )}

        {/* Row 5: Mini artifact stats */}
        {detail?.artifactCounts && (
          <div className="flex items-center gap-3 pt-1">
            <MiniStat icon={BookOpen} value={detail.artifactCounts.papersReviewed} color="text-violet-500" />
            <MiniStat icon={BarChart3} value={detail.artifactCounts.modelsRun} color="text-amber-500" />
            <MiniStat icon={Image} value={detail.artifactCounts.figuresGenerated} color="text-rose-500" />
            <MiniStat icon={FileText} value={detail.artifactCounts.sectionsWritten} color="text-cyan-500" />

            {/* Timestamp for completed runs */}
            {!isActive && run.startedAt && (
              <span className="text-[10px] text-muted-foreground/50 ml-auto">
                {new Date(run.startedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        )}

        {/* Fallback: no detail data yet — show minimal info */}
        {!detail && (
          <div className="flex items-center gap-2 pt-1">
            {isActive && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground/40" />}
            <span className="text-[10px] text-muted-foreground/50">
              {run.startedAt ? new Date(run.startedAt).toLocaleDateString() : ""}
            </span>
          </div>
        )}

        {/* Error banner */}
        {run.errorMessage && run.status === "failed" && (
          <div className="flex items-center gap-2 p-2 rounded-md bg-red-500/5 border border-red-500/15">
            <AlertTriangle className="h-3 w-3 text-red-500 flex-shrink-0" />
            <p className="text-[10px] text-red-600/80 dark:text-red-400/80 truncate">{run.errorMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
}
