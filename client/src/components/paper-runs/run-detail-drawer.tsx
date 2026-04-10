import { useQuery } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Clock, AlertTriangle, CheckCircle, FileText, ExternalLink, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import { RunPhaseMap } from "./run-phase-map";
import { ActivityTimeline } from "./activity-timeline";
import { ArtifactPanel } from "./artifact-panel";
import { LiveNarrative } from "./live-narrative";
import type { PaperRunDetail } from "./types";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof Loader2 }> = {
  queued: { label: "Queued", color: "bg-slate-500/10 text-slate-600 border-slate-500/30", icon: Clock },
  researching: { label: "Researching", color: "bg-violet-500/10 text-violet-600 border-violet-500/30", icon: Loader2 },
  analyzing: { label: "Analyzing", color: "bg-blue-500/10 text-blue-600 border-blue-500/30", icon: Loader2 },
  drafting: { label: "Writing", color: "bg-amber-500/10 text-amber-600 border-amber-500/30", icon: Loader2 },
  validating: { label: "Peer Review", color: "bg-cyan-500/10 text-cyan-600 border-cyan-500/30", icon: Loader2 },
  published: { label: "Published", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30", icon: CheckCircle },
  rejected: { label: "Rejected", color: "bg-red-500/10 text-red-600 border-red-500/30", icon: AlertTriangle },
  failed: { label: "Failed", color: "bg-red-500/10 text-red-600 border-red-500/30", icon: AlertTriangle },
};

function formatDuration(ms: number): string {
  if (ms < 60_000) return "<1 min";
  const mins = Math.floor(ms / 60_000);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m`;
}

function formatCost(cost: number): string {
  return `$${cost.toFixed(2)}`;
}

export function RunDetailDrawer({
  runId,
  open,
  onClose,
}: {
  runId: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const { data, isLoading } = useQuery<PaperRunDetail>({
    queryKey: ["/api/profile/paper-runs", runId, "detail"],
    queryFn: async () => {
      const res = await fetch(`/api/profile/paper-runs/${runId}/detail`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load");
      return res.json();
    },
    enabled: !!runId && open,
    refetchInterval: (query) => {
      const d = query.state.data;
      if (!d) return false;
      const active = ["queued", "researching", "analyzing", "drafting", "validating"].includes(d.run.status);
      return active ? 4000 : false;
    },
  });

  const isActive = data ? ["queued", "researching", "analyzing", "drafting", "validating"].includes(data.run.status) : false;
  const statusCfg = data ? STATUS_CONFIG[data.run.status] || STATUS_CONFIG.queued : STATUS_CONFIG.queued;
  const StatusIcon = statusCfg.icon;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        {isLoading || !data ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-5 w-5 animate-spin text-primary/50" />
          </div>
        ) : (
          <div className="space-y-6 pb-8">
            {/* Header */}
            <SheetHeader className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={cn("text-[11px] gap-1", statusCfg.color)}>
                  <StatusIcon className={cn("h-3 w-3", isActive && "animate-spin")} />
                  {statusCfg.label}
                </Badge>
                {data.run.domain && data.run.domain !== "Custom" && (
                  <Badge variant="outline" className="text-[10px]">{data.run.domain}</Badge>
                )}
                {isActive && (
                  <span className="text-[10px] text-muted-foreground tabular-nums ml-auto">
                    {formatDuration(data.elapsed)}
                  </span>
                )}
              </div>
              <SheetTitle className="text-base leading-snug">
                {data.paperTitle || (data.run.prompt ? data.run.prompt.slice(0, 120) + (data.run.prompt.length > 120 ? "..." : "") : "Paper Generation")}
              </SheetTitle>
              {data.paperAsid && (
                <span className="text-[11px] text-primary font-mono">{data.paperAsid}</span>
              )}
            </SheetHeader>

            {/* Phase Map */}
            <div className="space-y-2">
              <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Pipeline Progress</h4>
              <RunPhaseMap phases={data.phases} />
            </div>

            <Separator />

            {/* Narrative */}
            {(data.narrative.justFinished || data.narrative.happeningNow || data.narrative.comingNext) && (
              <>
                <LiveNarrative narrative={data.narrative} isActive={isActive} />
                <Separator />
              </>
            )}

            {/* Artifacts */}
            <div className="space-y-2">
              <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Research Artifacts</h4>
              <ArtifactPanel counts={data.artifactCounts} />
            </div>

            <Separator />

            {/* Activity Timeline */}
            <div className="space-y-2">
              <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Activity Log</h4>
              <ActivityTimeline events={data.events} maxItems={15} />
            </div>

            {/* Error */}
            {data.run.errorMessage && (
              <>
                <Separator />
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                  <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-red-600 dark:text-red-400">Error</p>
                    <p className="text-[11px] text-red-600/70 dark:text-red-400/70 mt-0.5">{data.run.errorMessage}</p>
                  </div>
                </div>
              </>
            )}

            {/* Peer Review */}
            {data.peerReview && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="h-3.5 w-3.5" /> Peer Review (Popper)
                  </h4>
                  <div className="p-3 rounded-lg border bg-card">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={cn(
                        "text-2xl font-bold tabular-nums",
                        data.peerReview.overallScore >= 70 ? "text-emerald-600" :
                        data.peerReview.overallScore >= 50 ? "text-amber-600" : "text-red-600",
                      )}>
                        {data.peerReview.overallScore}
                      </span>
                      <span className="text-xs text-muted-foreground">/100</span>
                      <Badge variant="outline" className="text-[10px] ml-auto">
                        {data.peerReview.recommendation}
                      </Badge>
                    </div>
                    {data.peerReview.summary && (
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{data.peerReview.summary}</p>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Session Metrics */}
            {data.sessionData && (
              <>
                <Separator />
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <p className="text-lg font-semibold tabular-nums text-foreground">
                      {Math.round(data.sessionData.inputTokens / 1000)}K
                    </p>
                    <p className="text-[10px] text-muted-foreground">Input tokens</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold tabular-nums text-foreground">
                      {Math.round(data.sessionData.outputTokens / 1000)}K
                    </p>
                    <p className="text-[10px] text-muted-foreground">Output tokens</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-semibold tabular-nums text-foreground">
                      {formatCost(data.sessionData.totalCost)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Cost</p>
                  </div>
                </div>
              </>
            )}

            {/* View Paper Link */}
            {data.run.paperId && data.run.status === "published" && (
              <>
                <Separator />
                <a
                  href={data.paperAsid ? `/paper/${data.paperAsid}` : `/journal/${data.run.paperId}`}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg border border-primary/30 bg-primary/5 text-primary text-sm font-medium hover:bg-primary/10 transition-colors"
                >
                  <FileText className="h-4 w-4" />
                  View Published Paper
                  <ExternalLink className="h-3 w-3" />
                </a>
              </>
            )}

            {/* Prompt */}
            {data.run.prompt && (
              <>
                <Separator />
                <div className="space-y-1.5">
                  <h4 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Research Prompt</h4>
                  <p className="text-xs text-foreground/70 leading-relaxed whitespace-pre-wrap">
                    {data.run.prompt}
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
