import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Activity, Play, Zap, CheckCircle, XCircle, AlertTriangle,
  Clock, Shield, ChevronDown, ChevronUp, Radio, Search, Database,
  BarChart3, BrainCircuit, FileText, Layers, Trash2, RotateCcw, ExternalLink,
  SaveAll, RefreshCw, StopCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminRunDetail } from "./AdminRunDetail";

interface PipelineCheckpoint {
  version: number;
  lastCompletedStage: 'none' | 'researching' | 'analyzing' | 'drafting';
  completedTools: Array<{ tool: string; toolId: string; completedAt: number }>;
  sectionsWritten: string[];
  compilationSeen: boolean;
  resumeCount: number;
  lastResumeAt: number | null;
}

interface CheckpointResponse {
  runId: string;
  status: string;
  checkpoint: PipelineCheckpoint | null;
  sessionId: string | null;
  hasCheckpoint: boolean;
}

interface PaperRun {
  id: string;
  status: string;
  domain: string | null;
  method: string | null;
  prompt: string | null;
  sessionId: string | null;
  paperId: string | null;
  popperScore: number | null;
  popperRecommendation: string | null;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

interface RunStats { total: number; published: number; rejected: number; failed: number; active: PaperRun | null }
interface SchedulerConfig { intervalMs: number; popperThreshold: number; enabled: boolean; running: boolean; isGenerating: boolean; paperCount: number; selectionMode?: 'sequential' | 'weighted' | 'intelligent' }

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  queued: { label: "Queued", color: "text-gray-600 dark:text-gray-400", bg: "bg-gray-500/10 border-gray-500/20", icon: Clock },
  researching: { label: "Researching", color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-500/10 border-violet-500/20", icon: Search },
  analyzing: { label: "Analyzing", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", icon: Database },
  drafting: { label: "Drafting", color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-500/10 border-rose-500/20", icon: BrainCircuit },
  validating: { label: "Validating", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", icon: Shield },
  published: { label: "Published", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20", icon: CheckCircle },
  rejected: { label: "Rejected", color: "text-red-600 dark:text-red-400", bg: "bg-red-500/10 border-red-500/20", icon: XCircle },
  failed: { label: "Failed", color: "text-red-600 dark:text-red-400", bg: "bg-red-500/10 border-red-500/20", icon: AlertTriangle },
};

const ACTIVE_STATUSES = new Set(["queued", "researching", "analyzing", "drafting", "validating"]);

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.queued;
  const Icon = cfg.icon;
  return (
    <Badge variant="outline" className={cn("gap-1 text-[10px] font-semibold", cfg.bg, cfg.color)}>
      <Icon className={cn("h-3 w-3", ACTIVE_STATUSES.has(status) && "animate-pulse")} />
      {cfg.label}
    </Badge>
  );
}

function formatDuration(startedAt: string | null, completedAt: string | null): string {
  if (!startedAt) return "—";
  const start = new Date(startedAt).getTime();
  const end = completedAt ? new Date(completedAt).getTime() : Date.now();
  const mins = Math.round((end - start) / 60000);
  if (mins < 1) return "<1m";
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

const STAGE_LABELS: Record<string, string> = {
  none: "Not started",
  researching: "Research (Gauss/Turing)",
  analyzing: "Analysis (Newton/Fisher)",
  drafting: "Drafting (Euler)",
};

function CheckpointCard({ runId }: { runId: string }) {
  const { data, isLoading } = useQuery<CheckpointResponse>({
    queryKey: ["/api/admin/runs", runId, "checkpoint"],
    queryFn: async () => {
      const r = await fetch(`/api/admin/runs/${runId}/checkpoint`, { credentials: "include" });
      return r.json();
    },
  });

  if (isLoading) return <div className="text-[10px] text-muted-foreground animate-pulse">Loading checkpoint...</div>;
  if (!data?.hasCheckpoint) return (
    <div className="p-3 rounded-lg bg-muted/20 border border-border/30">
      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
        <SaveAll className="h-3 w-3" /> No checkpoint data
      </span>
    </div>
  );

  const cp = data.checkpoint!;
  return (
    <div className="p-3 rounded-lg bg-indigo-500/5 border border-indigo-500/20 space-y-2">
      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
        <SaveAll className="h-3 w-3" /> Pipeline Checkpoint
      </span>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div>
          <span className="text-[9px] font-bold text-muted-foreground/60 block mb-0.5">Last Stage</span>
          <Badge variant="outline" className="text-[10px] font-semibold">
            {STAGE_LABELS[cp.lastCompletedStage] || cp.lastCompletedStage}
          </Badge>
        </div>
        <div>
          <span className="text-[9px] font-bold text-muted-foreground/60 block mb-0.5">Tools Completed</span>
          <span className="font-mono font-bold text-foreground">{cp.completedTools.length}</span>
        </div>
        <div>
          <span className="text-[9px] font-bold text-muted-foreground/60 block mb-0.5">Sections Written</span>
          <span className="font-mono font-bold text-foreground">{cp.sectionsWritten.length}</span>
        </div>
        <div>
          <span className="text-[9px] font-bold text-muted-foreground/60 block mb-0.5">Resumes</span>
          <span className={cn("font-mono font-bold", cp.resumeCount >= 3 ? "text-red-600" : cp.resumeCount > 0 ? "text-amber-600" : "text-foreground")}>
            {cp.resumeCount}/3
          </span>
        </div>
      </div>
      {cp.sectionsWritten.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1">
          {cp.sectionsWritten.map(s => (
            <Badge key={s} variant="outline" className="text-[9px] bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              {s}
            </Badge>
          ))}
        </div>
      )}
      {cp.completedTools.length > 0 && (
        <details className="group">
          <summary className="text-[10px] font-bold text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
            Tool execution timeline ({cp.completedTools.length} tools)
          </summary>
          <div className="mt-1.5 max-h-32 overflow-y-auto space-y-0.5">
            {cp.completedTools.map((t, i) => (
              <div key={i} className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
                <span className="text-muted-foreground/40 w-4 text-right">{i + 1}</span>
                <span className="text-foreground/80 font-semibold">{t.tool}</span>
                <span className="text-muted-foreground/40 ml-auto">
                  {new Date(t.completedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function ExpandedRunDetail({ run, onViewDetail, onNewRun, onDelete, onResume, onStop, isGenerating, resumeLoading, resumeError, stopLoading }: {
  run: PaperRun;
  onViewDetail: (id: string) => void;
  onNewRun: () => void;
  onDelete: (id: string) => void;
  onResume: (id: string) => void;
  onStop: (id: string) => void;
  isGenerating: boolean;
  resumeLoading: boolean;
  resumeError: string | null;
  stopLoading: boolean;
}) {
  if (!run) return null;
  const canResume = run.status === 'failed';
  const canStop = ACTIVE_STATUSES.has(run.status);

  return (
    <div className="border-t border-border/30 bg-muted/10 p-5 space-y-3" onClick={(e) => e.stopPropagation()}>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div><span className="font-bold text-muted-foreground block mb-0.5">Run ID</span><span className="font-mono text-foreground">{run.id.slice(0, 8)}...</span></div>
        <div><span className="font-bold text-muted-foreground block mb-0.5">Session</span><span className="font-mono text-foreground">{run.sessionId?.slice(0, 20) || "—"}</span></div>
        <div><span className="font-bold text-muted-foreground block mb-0.5">Paper ID</span><span className="font-mono text-foreground">{run.paperId?.slice(0, 8) || "—"}</span></div>
        <div><span className="font-bold text-muted-foreground block mb-0.5">Popper</span><span className="font-mono text-foreground">{run.popperScore !== null ? `${run.popperScore}/100 (${run.popperRecommendation})` : "—"}</span></div>
      </div>

      {/* Checkpoint display */}
      {(run.status === 'failed' || ACTIVE_STATUSES.has(run.status)) && (
        <CheckpointCard runId={run.id} />
      )}

      {run.errorMessage && (
        <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
          <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider block mb-1">Error</span>
          <pre className="text-xs text-red-600/80 whitespace-pre-wrap font-mono">{run.errorMessage}</pre>
        </div>
      )}
      {run.prompt && (
        <details className="group">
          <summary className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors">
            View Prompt
          </summary>
          <pre className="mt-2 p-3 rounded-lg bg-muted/30 border border-border/30 text-[10px] text-muted-foreground whitespace-pre-wrap font-mono max-h-48 overflow-y-auto">
            {run.prompt}
          </pre>
        </details>
      )}
      {/* Resume error */}
      {resumeError && (
        <div className="p-2 rounded-lg bg-red-500/5 border border-red-500/20 text-xs text-red-600">
          Resume failed: {resumeError}
        </div>
      )}
      {/* Actions */}
      <div className="flex items-center gap-2 pt-2 border-t border-border/20">
        {canStop && (
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs h-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 border-red-500/30"
            onClick={() => onStop(run.id)}
            disabled={stopLoading}
          >
            <StopCircle className={cn("h-3 w-3", stopLoading && "animate-spin")} />
            {stopLoading ? "Stopping..." : "Stop Run"}
          </Button>
        )}
        <Button
          size="sm"
          variant="default"
          className="gap-1.5 text-xs h-8 px-4"
          onClick={() => onViewDetail(run.id)}
        >
          <ExternalLink className="h-3 w-3" />
          View Pipeline Detail
        </Button>
        {canResume && (
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs h-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 border-indigo-500/30"
            onClick={() => onResume(run.id)}
            disabled={resumeLoading || isGenerating}
          >
            <RefreshCw className={cn("h-3 w-3", resumeLoading && "animate-spin")} />
            {resumeLoading ? "Resuming..." : "Resume from Checkpoint"}
          </Button>
        )}
        {(run.status === 'failed' || run.status === 'rejected') && (
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs h-8"
            onClick={() => onNewRun()}
            disabled={isGenerating}
          >
            <RotateCcw className="h-3 w-3" />
            New Run
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 text-xs h-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
          onClick={() => onDelete(run.id)}
        >
          <Trash2 className="h-3 w-3" />
          Delete
        </Button>
      </div>
    </div>
  );
}

export function AdminRuns() {
  const queryClient = useQueryClient();
  const [expandedRun, setExpandedRun] = useState<string | null>(null);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  const { data: runs = [] } = useQuery<PaperRun[]>({
    queryKey: ["/api/admin/runs"],
    queryFn: async () => { const r = await fetch("/api/admin/runs", { credentials: "include" }); return r.json(); },
    refetchInterval: 8000,
  });

  const { data: stats } = useQuery<RunStats>({
    queryKey: ["/api/admin/runs/stats"],
    queryFn: async () => { const r = await fetch("/api/admin/runs/stats", { credentials: "include" }); return r.json(); },
    refetchInterval: 8000,
  });

  const { data: config } = useQuery<SchedulerConfig>({
    queryKey: ["/api/admin/scheduler/config"],
    queryFn: async () => { const r = await fetch("/api/admin/scheduler/config", { credentials: "include" }); return r.json(); },
    refetchInterval: 8000,
  });

  const updateConfig = useMutation({
    mutationFn: async (updates: Partial<SchedulerConfig>) => {
      const r = await fetch("/api/admin/scheduler/config", { method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(updates) });
      return r.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/scheduler/config"] }); },
  });

  const triggerRun = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/admin/runs/trigger", { method: "POST", credentials: "include" });
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/runs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/runs/stats"] });
    },
  });

  const deleteRun = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/admin/runs/${id}`, { method: "DELETE", credentials: "include" });
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/runs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/runs/stats"] });
      setExpandedRun(null);
    },
  });

  const resumeRun = useMutation({
    mutationFn: async (runId: string) => {
      const r = await fetch(`/api/admin/runs/${runId}/resume`, { method: "POST", credentials: "include" });
      const data = await r.json();
      if (!r.ok || !data.success) throw new Error(data.error || "Resume failed");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/runs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/runs/stats"] });
    },
  });

  const stopRun = useMutation({
    mutationFn: async (runId: string) => {
      const r = await fetch(`/api/admin/runs/${runId}/stop`, { method: "POST", credentials: "include" });
      const data = await r.json();
      if (!r.ok || !data.success) throw new Error(data.error || "Stop failed");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/runs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/runs/stats"] });
      setExpandedRun(null);
    },
  });

  const intervalMinutes = config ? Math.round(config.intervalMs / 60000) : 60;
  const activeRun = runs.find(r => ACTIVE_STATUSES.has(r.status));

  // ── Detail view for a selected run ──
  if (selectedRunId) {
    return <AdminRunDetail runId={selectedRunId} onBack={() => setSelectedRunId(null)} />;
  }

  return (
    <div className="space-y-5">
      {/* ═══ ACTIVE RUN HIGHLIGHT ═══ */}
      {activeRun && (
        <Card
          className="rounded-xl border-primary/30 bg-primary/[0.03] cursor-pointer hover:border-primary/50 transition-colors"
          onClick={() => setSelectedRunId(activeRun.id)}
        >
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/60 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
              </span>
              <span className="text-sm font-bold text-foreground uppercase tracking-wider">Active Run</span>
              <StatusBadge status={activeRun.status} />
              <span className="text-xs text-muted-foreground ml-auto font-mono flex items-center gap-2">
                {formatDuration(activeRun.startedAt, null)} elapsed
                <ExternalLink className="h-3 w-3 text-primary/40" />
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm">
              {activeRun.domain && <span className="text-muted-foreground"><span className="font-semibold text-foreground">Domain:</span> {activeRun.domain}</span>}
              {activeRun.method && <span className="text-muted-foreground"><span className="font-semibold text-foreground">Method:</span> {activeRun.method}</span>}
            </div>
            {/* Pipeline progress */}
            <div className="flex items-center gap-1 mt-4">
              {[
                { key: "researching", label: "Gauss", icon: Search },
                { key: "analyzing", label: "Turing/Fisher", icon: BarChart3 },
                { key: "drafting", label: "Euler", icon: BrainCircuit },
                { key: "validating", label: "Popper", icon: Shield },
              ].map((step, i) => {
                const stages = ["researching", "analyzing", "drafting", "validating"];
                const currentIdx = stages.indexOf(activeRun.status);
                const stepIdx = stages.indexOf(step.key);
                const isActive = stepIdx === currentIdx;
                const isDone = stepIdx < currentIdx;
                return (
                  <div key={step.key} className="flex items-center gap-1 flex-1">
                    <div className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-semibold transition-all flex-1 justify-center",
                      isActive ? "bg-primary/10 border-primary/30 text-primary" :
                      isDone ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" :
                      "bg-muted/30 border-border/30 text-muted-foreground/40"
                    )}>
                      <step.icon className={cn("h-3 w-3", isActive && "animate-pulse")} />
                      {step.label}
                      {isDone && <CheckCircle className="h-3 w-3" />}
                    </div>
                    {i < 3 && <div className={cn("w-4 h-px", isDone ? "bg-emerald-500/40" : "bg-border/40")} />}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══ SCHEDULER CONTROLS ═══ */}
      <Card className="rounded-xl">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Radio className="h-3.5 w-3.5" />
              Scheduler Controls
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-5">
            {/* Enable/Disable */}
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-border/40 bg-muted/20">
              <Switch
                checked={config?.enabled ?? false}
                onCheckedChange={(enabled) => updateConfig.mutate({ enabled })}
              />
              <span className="text-sm font-semibold">{config?.enabled ? "Active" : "Disabled"}</span>
              {config?.enabled && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
              )}
            </div>

            {/* Interval */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border/40 bg-muted/20">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Every</span>
              <Input
                type="number"
                value={intervalMinutes}
                onChange={(e) => {
                  const min = parseInt(e.target.value);
                  if (min >= 1) updateConfig.mutate({ intervalMs: min * 60000 });
                }}
                className="w-16 h-7 text-sm text-center rounded-md border-border/40"
                min={1}
              />
              <span className="text-xs font-medium text-muted-foreground">min</span>
            </div>

            {/* Popper threshold */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border/40 bg-muted/20">
              <Shield className="h-4 w-4 text-indigo-500" />
              <span className="text-xs font-medium text-muted-foreground">Threshold</span>
              <Input
                type="number"
                value={config?.popperThreshold ?? 45}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (val >= 0 && val <= 100) updateConfig.mutate({ popperThreshold: val } as any);
                }}
                className="w-16 h-7 text-sm text-center rounded-md border-border/40"
                min={0}
                max={100}
              />
              <span className="text-xs font-medium text-muted-foreground">/100</span>
            </div>

            {/* Selection Mode */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border/40 bg-muted/20">
              <BrainCircuit className="h-4 w-4 text-violet-500" />
              <span className="text-xs font-medium text-muted-foreground">Mode</span>
              <select
                value={config?.selectionMode ?? 'sequential'}
                onChange={(e) => updateConfig.mutate({ selectionMode: e.target.value } as any)}
                className="h-7 text-xs rounded-md border border-border/40 bg-background px-2 font-medium"
              >
                <option value="sequential">Sequential</option>
                <option value="weighted">Weighted</option>
                <option value="intelligent">Intelligent (GME)</option>
              </select>
            </div>

            {/* Manual trigger */}
            <Button
              size="sm"
              onClick={() => triggerRun.mutate()}
              disabled={config?.isGenerating}
              className="gap-1.5 rounded-lg h-9 px-4 shadow-lg shadow-primary/20"
            >
              <Zap className="h-3.5 w-3.5" />
              {config?.isGenerating ? "Generating..." : "Trigger Run"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ═══ RUNS TABLE ═══ */}
      <Card className="rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left p-3 font-bold text-[10px] uppercase tracking-widest text-muted-foreground w-28">Status</th>
                <th className="text-left p-3 font-bold text-[10px] uppercase tracking-widest text-muted-foreground">Domain</th>
                <th className="text-left p-3 font-bold text-[10px] uppercase tracking-widest text-muted-foreground hidden lg:table-cell">Method</th>
                <th className="text-left p-3 font-bold text-[10px] uppercase tracking-widest text-muted-foreground w-24">Popper</th>
                <th className="text-left p-3 font-bold text-[10px] uppercase tracking-widest text-muted-foreground w-24 hidden sm:table-cell">Duration</th>
                <th className="text-left p-3 font-bold text-[10px] uppercase tracking-widest text-muted-foreground w-32">Date</th>
                <th className="w-10 p-3" />
              </tr>
            </thead>
            <tbody>
              {runs.length === 0 && (
                <tr><td colSpan={7} className="p-12 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <Activity className="h-8 w-8 text-muted-foreground/30" />
                    <p className="text-sm text-muted-foreground">No runs yet</p>
                    <p className="text-xs text-muted-foreground/60">Enable the scheduler or trigger a manual run to get started.</p>
                  </div>
                </td></tr>
              )}
              {runs.map(run => {
                const isExpanded = expandedRun === run.id;
                const isActive = ACTIVE_STATUSES.has(run.status);

                return (
                  <tr
                    key={run.id}
                    className={cn(
                      "border-b last:border-0 cursor-pointer transition-colors",
                      isActive ? "bg-primary/[0.02] hover:bg-primary/[0.04]" : "hover:bg-muted/20"
                    )}
                    onClick={() => setExpandedRun(isExpanded ? null : run.id)}
                  >
                    <td className="p-3"><StatusBadge status={run.status} /></td>
                    <td className="p-3 max-w-[250px] truncate text-xs font-medium">{run.domain || "—"}</td>
                    <td className="p-3 max-w-[180px] truncate text-xs text-muted-foreground hidden lg:table-cell">{run.method || "—"}</td>
                    <td className="p-3">
                      {run.popperScore !== null ? (
                        <div className="flex items-center gap-1.5">
                          <div className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            run.popperScore >= 80 ? "bg-emerald-500" :
                            run.popperScore >= 60 ? "bg-amber-500" :
                            run.popperScore >= 45 ? "bg-orange-500" : "bg-red-500"
                          )} />
                          <span className="text-xs font-bold font-mono">{run.popperScore}</span>
                          <span className="text-[10px] text-muted-foreground/50">/100</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground/40">—</span>
                      )}
                    </td>
                    <td className="p-3 text-xs text-muted-foreground font-mono hidden sm:table-cell">
                      {formatDuration(run.startedAt, run.completedAt)}
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {new Date(run.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="p-3">
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground/30" />}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Expanded run detail */}
        {expandedRun && <ExpandedRunDetail
          run={runs.find(r => r.id === expandedRun)!}
          onViewDetail={(id) => setSelectedRunId(id)}
          onNewRun={() => triggerRun.mutate()}
          onDelete={(id) => { if (confirm('Delete this run?')) deleteRun.mutate(id); }}
          onResume={(id) => resumeRun.mutate(id)}
          onStop={(id) => { if (confirm('Stop this run? The pipeline will be killed.')) stopRun.mutate(id); }}
          isGenerating={config?.isGenerating ?? false}
          resumeLoading={resumeRun.isPending}
          resumeError={resumeRun.error?.message ?? null}
          stopLoading={stopRun.isPending}
        />}
      </Card>
    </div>
  );
}
