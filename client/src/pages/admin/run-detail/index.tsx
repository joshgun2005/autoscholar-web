import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, Search, Database, BarChart3, BrainCircuit, FileText,
  Shield, CheckCircle, AlertTriangle, Microscope,
  Image, Link2, Zap, Hash, DollarSign, BookOpen, SaveAll, RefreshCw,
  ExternalLink, Activity, Layers, Terminal,
  TrendingUp, Award, Eye, Timer, Cpu, GitBranch,
} from "lucide-react";
import { cn } from "@/lib/utils";

import type { AdminRunDetailProps, RunDetail, CheckpointResponse } from "./types";
import { classifyTools, classifyCodeEntries, classifyFigures, CHECKPOINT_STAGE_LABELS, ACTIVE_STATUSES, STATUS_TO_STAGE_IDX, PIPELINE_STAGES, TOOL_CATEGORY } from "./agent-classification";
import {
  StatusBadge, CopyButton, ToolResultCard, CodeEntryCard, FigureGallery,
  EmptyStage, StageStatus, PipelineProgress, MetricCard, ScoreDonut,
  formatDuration, formatTimestamp, formatNumber,
} from "./status-helpers";

// ── Pipeline stage icon map (for tabs) ─────────────────────

const STAGE_ICONS: Record<string, React.ElementType> = {
  Search, Database, BarChart3, Microscope, FileText, Shield,
};

// ── Main Component ─────────────────────────────────────────

export default function AdminRunDetail({ runId, onBack }: AdminRunDetailProps) {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<RunDetail>({
    queryKey: ["/api/admin/runs", runId, "detail"],
    queryFn: async () => {
      const r = await fetch(`/api/admin/runs/${runId}/detail`, { credentials: "include" });
      if (!r.ok) throw new Error("Failed to load run detail");
      return r.json();
    },
    refetchInterval: (query) => {
      const run = query.state.data?.run;
      if (run && ACTIVE_STATUSES.has(run.status)) return 5000;
      return false;
    },
  });

  const { data: checkpointData } = useQuery<CheckpointResponse>({
    queryKey: ["/api/admin/runs", runId, "checkpoint"],
    queryFn: async () => {
      const r = await fetch(`/api/admin/runs/${runId}/checkpoint`, { credentials: "include" });
      return r.json();
    },
    enabled: !!data?.run && (data.run.status === 'failed' || ACTIVE_STATUSES.has(data.run.status)),
  });

  const resumeRun = useMutation({
    mutationFn: async () => {
      const r = await fetch(`/api/admin/runs/${runId}/resume`, { method: "POST", credentials: "include" });
      const d = await r.json();
      if (!r.ok || !d.success) throw new Error(d.error || "Resume failed");
      return d;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/runs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/runs/stats"] });
    },
  });

  // Compute classified data
  const classified = useMemo(() => {
    if (!data?.sessionData) return null;
    const tools = classifyTools(data.sessionData.toolResults);
    const code = classifyCodeEntries(data.sessionData.pythonCodeEntries);
    const figs = classifyFigures(data.sessionData.customPythonFigures);
    return { tools, code, figs };
  }, [data?.sessionData]);

  const toolCounts = useMemo((): Record<string, number> => {
    if (!classified) return { gauss: 0, turing: 0, newton: 0, fisher: 0, euler: 0, popper: 0 };
    return {
      gauss: classified.tools.gauss.length,
      turing: classified.tools.turing.length,
      newton: classified.tools.newton.length + classified.code.newton.length,
      fisher: classified.tools.fisher.length + classified.code.fisher.length,
      euler: classified.tools.euler.length,
      popper: data?.peerReview ? 1 : 0,
    };
  }, [classified, data?.peerReview]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center space-y-3">
          <div className="relative mx-auto w-12 h-12">
            <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
            <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
          <p className="text-sm text-muted-foreground/60">Loading run detail...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 text-xs">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to runs
        </Button>
        <div className="flex items-center justify-center py-16">
          <p className="text-sm text-red-500">Failed to load run detail.</p>
        </div>
      </div>
    );
  }

  const { run, sessionData, peerReview, paperTitle, paperAbstract } = data;
  const isActive = ACTIVE_STATUSES.has(run.status);
  const tools = classified?.tools || { gauss: [], turing: [], newton: [], fisher: [], euler: [] };
  const codeByStage = classified?.code || { newton: [], fisher: [] };
  const figsByStage = classified?.figs || { newton: [], fisher: [] };

  const statusIdx = STATUS_TO_STAGE_IDX[run.status] ?? 0;
  const defaultTab = PIPELINE_STAGES[Math.max(0, Math.min(statusIdx, PIPELINE_STAGES.length - 1))]?.key || "gauss";

  // Total stats
  const totalTools = sessionData?.toolResults?.length || 0;
  const totalFigures = sessionData?.customPythonFigures?.reduce((s, f) => s + (f.figureUrls?.length || f.figures?.length || 0), 0) || 0;
  const totalScripts = sessionData?.pythonCodeEntries?.length || 0;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5 text-xs h-8 px-2.5 hover:bg-muted/40">
          <ArrowLeft className="h-3.5 w-3.5" /> Runs
        </Button>
        <div className="h-5 w-px bg-border/30" />
        <StatusBadge status={run.status} />
        {isActive && (
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/60 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
          </span>
        )}
        <span className="text-[10px] text-muted-foreground/40 font-mono ml-auto select-all">{run.id.slice(0, 12)}</span>
      </div>

      {/* ── Run Info Card ── */}
      <Card className="rounded-2xl border-border/30 overflow-hidden">
        <CardContent className="p-0">
          {/* Title bar */}
          <div className="px-6 pt-5 pb-4 border-b border-border/20">
            {paperTitle ? (
              <div>
                <h2 className="text-lg font-bold text-foreground leading-tight">{paperTitle}</h2>
                {paperAbstract && (
                  <p className="text-xs text-muted-foreground/60 mt-2 leading-relaxed line-clamp-3">{paperAbstract}</p>
                )}
              </div>
            ) : (
              <h2 className="text-lg font-bold text-foreground leading-tight">
                {run.domain || "Unknown domain"}{" "}
                <span className="text-muted-foreground/40 font-normal text-base">via</span>{" "}
                {run.method || "Unknown method"}
              </h2>
            )}
          </div>

          {/* Metrics grid */}
          <div className="px-6 py-4 border-b border-border/20">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
              <MetricCard icon={Layers} label="Domain" value={run.domain || "--"} />
              <MetricCard icon={GitBranch} label="Method" value={run.method || "--"} />
              <MetricCard icon={Timer} label="Duration" value={formatDuration(run.startedAt, run.completedAt)} />
              <MetricCard
                icon={Award} label="Popper"
                value={run.popperScore !== null ? `${run.popperScore}/100` : "--"}
                color={run.popperScore !== null ? (run.popperScore >= 60 ? "text-emerald-600" : run.popperScore >= 45 ? "text-amber-600" : "text-red-600") : undefined}
              />
              <MetricCard icon={Zap} label="Tools" value={totalTools.toString()} sub={`${totalScripts} scripts`} />
              <MetricCard icon={Image} label="Figures" value={totalFigures.toString()} />
              {sessionData && (
                <>
                  <MetricCard icon={Cpu} label="Tokens" value={formatNumber(sessionData.inputTokens + sessionData.outputTokens)} sub={`in:${formatNumber(sessionData.inputTokens)} out:${formatNumber(sessionData.outputTokens)}`} />
                  <MetricCard icon={DollarSign} label="Cost" value={`$${sessionData.totalCost.toFixed(2)}`} />
                </>
              )}
            </div>
          </div>

          {/* Pipeline progress */}
          <div className="px-6 py-4">
            <PipelineProgress status={run.status} toolCounts={toolCounts} />
          </div>

          {/* Error message */}
          {run.errorMessage && (
            <div className="mx-6 mb-4 p-4 rounded-xl bg-red-500/5 border border-red-500/20">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider">Error</span>
              </div>
              <pre className="text-xs text-red-600/80 whitespace-pre-wrap font-mono leading-relaxed">{run.errorMessage}</pre>
            </div>
          )}

          {/* Checkpoint info */}
          {checkpointData?.hasCheckpoint && (() => {
            const cp = checkpointData.checkpoint!;
            return (
              <div className="mx-6 mb-4 p-5 rounded-xl bg-indigo-500/5 border border-indigo-500/20 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                    <SaveAll className="h-3.5 w-3.5" /> Pipeline Checkpoint
                  </span>
                  {run.status === 'failed' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-xs h-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 border-indigo-500/30"
                      onClick={() => resumeRun.mutate()}
                      disabled={resumeRun.isPending || cp.resumeCount >= 3}
                    >
                      <RefreshCw className={cn("h-3 w-3", resumeRun.isPending && "animate-spin")} />
                      {resumeRun.isPending ? "Resuming..." : cp.resumeCount >= 3 ? "Max resumes reached" : "Resume from Checkpoint"}
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  <div className="px-3 py-2 rounded-lg bg-background/50 border border-border/20">
                    <span className="text-[9px] font-bold text-muted-foreground/50 block mb-0.5">Last Stage</span>
                    <span className="font-medium text-xs text-foreground">{CHECKPOINT_STAGE_LABELS[cp.lastCompletedStage] || cp.lastCompletedStage}</span>
                  </div>
                  <div className="px-3 py-2 rounded-lg bg-background/50 border border-border/20">
                    <span className="text-[9px] font-bold text-muted-foreground/50 block mb-0.5">Tools Done</span>
                    <span className="font-mono font-bold text-xs text-foreground">{cp.completedTools.length}</span>
                  </div>
                  <div className="px-3 py-2 rounded-lg bg-background/50 border border-border/20">
                    <span className="text-[9px] font-bold text-muted-foreground/50 block mb-0.5">Sections</span>
                    <span className="font-mono font-bold text-xs text-foreground">{cp.sectionsWritten.length}</span>
                  </div>
                  <div className="px-3 py-2 rounded-lg bg-background/50 border border-border/20">
                    <span className="text-[9px] font-bold text-muted-foreground/50 block mb-0.5">Compiled</span>
                    <span className={cn("font-bold text-xs", cp.compilationSeen ? "text-emerald-600" : "text-muted-foreground/40")}>
                      {cp.compilationSeen ? "Yes" : "No"}
                    </span>
                  </div>
                  <div className="px-3 py-2 rounded-lg bg-background/50 border border-border/20">
                    <span className="text-[9px] font-bold text-muted-foreground/50 block mb-0.5">Resumes</span>
                    <span className={cn("font-mono font-bold text-xs",
                      cp.resumeCount >= 3 ? "text-red-600" : cp.resumeCount > 0 ? "text-amber-600" : "text-foreground"
                    )}>
                      {cp.resumeCount}/3
                    </span>
                    {cp.lastResumeAt && (
                      <span className="text-[9px] text-muted-foreground/40 block">{formatTimestamp(cp.lastResumeAt)}</span>
                    )}
                  </div>
                </div>
                {cp.sectionsWritten.length > 0 && (
                  <div>
                    <span className="text-[9px] font-bold text-muted-foreground/50 block mb-1.5">Written Sections</span>
                    <div className="flex flex-wrap gap-1.5">
                      {cp.sectionsWritten.map(s => (
                        <Badge key={s} variant="outline" className="text-[9px] bg-emerald-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2">
                          <CheckCircle className="h-2.5 w-2.5 mr-1" />{s}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {cp.completedTools.length > 0 && (
                  <details>
                    <summary className="text-[10px] font-bold text-muted-foreground/60 cursor-pointer hover:text-foreground transition-colors flex items-center gap-1.5">
                      <Activity className="h-3 w-3" /> Tool execution timeline ({cp.completedTools.length} tools)
                    </summary>
                    <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-border/20 bg-background/50">
                      {cp.completedTools.map((t, i) => (
                        <div key={i} className={cn(
                          "flex items-center gap-2.5 text-[10px] font-mono px-3 py-1.5",
                          i % 2 === 0 ? "bg-transparent" : "bg-muted/10",
                        )}>
                          <span className="text-muted-foreground/30 w-5 text-right shrink-0">{i + 1}</span>
                          <span className="text-foreground/80 font-semibold flex-1">{t.tool}</span>
                          <span className="text-muted-foreground/40 shrink-0">
                            {new Date(t.completedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
                {resumeRun.error && (
                  <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20 text-xs text-red-600">
                    Resume failed: {resumeRun.error.message}
                  </div>
                )}
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* ── Pipeline Tabs ── */}
      <Tabs defaultValue={defaultTab} className="w-full">
        <TabsList className="w-full h-12 bg-muted/20 backdrop-blur-sm rounded-2xl p-1.5 border border-border/20">
          {PIPELINE_STAGES.map((stage) => {
            const count = toolCounts[stage.key] || 0;
            const StageIcon = STAGE_ICONS[stage.icon];
            return (
              <TabsTrigger
                key={stage.key}
                value={stage.key}
                className="flex-1 data-[state=active]:bg-background data-[state=active]:shadow-sm data-[state=active]:border-border/30 transition-all text-[10px] font-bold rounded-xl gap-1.5 uppercase tracking-wider border border-transparent"
              >
                {StageIcon && <StageIcon className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">{stage.label}</span>
                {count > 0 && (
                  <span className="text-[8px] bg-primary/10 text-primary rounded-full px-1.5 py-0.5 font-mono min-w-[18px] text-center">
                    {count}
                  </span>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* ── GAUSS Tab ── */}
        <TabsContent value="gauss" className="mt-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 flex items-center gap-2">
              <Search className="h-4 w-4 text-violet-500" />
              GAUSS -- Literature Discovery
            </h3>
            <StageStatus runStatus={run.status} stageIdx={0} />
          </div>
          {sessionData?.searchQueries && sessionData.searchQueries.length > 0 && (
            <Card className="rounded-xl border-border/30">
              <CardContent className="p-4 space-y-2.5">
                <span className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-wider flex items-center gap-1.5">
                  <Search className="h-3 w-3" /> Search Queries ({sessionData.searchQueries.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {sessionData.searchQueries.map((sq, i) => (
                    <Badge key={i} variant="outline" className="text-[10px] font-mono px-2.5 py-1 hover:bg-muted/20 transition-colors">
                      {sq.query}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          {sessionData?.sources && sessionData.sources.length > 0 && (
            <Card className="rounded-xl border-border/30">
              <CardContent className="p-4 space-y-2.5">
                <span className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="h-3 w-3" /> Sources ({sessionData.sources.length})
                </span>
                <div className="space-y-1">
                  {sessionData.sources.slice(0, 30).map((src, i) => (
                    <div key={i} className="flex items-center gap-2 text-[10px] group py-0.5">
                      <span className="text-muted-foreground/30 font-mono w-4 text-right shrink-0">{i + 1}</span>
                      <Link2 className="h-3 w-3 text-muted-foreground/30 shrink-0" />
                      <span className="font-medium text-foreground/80 truncate group-hover:text-foreground transition-colors">{src.title || src.url}</span>
                      {src.url && (
                        <a href={src.url} target="_blank" rel="noopener noreferrer" className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ExternalLink className="h-2.5 w-2.5 text-muted-foreground/40" />
                        </a>
                      )}
                    </div>
                  ))}
                  {sessionData.sources.length > 30 && (
                    <span className="text-[10px] text-muted-foreground/40 pl-8">+{sessionData.sources.length - 30} more</span>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
          {tools.gauss.length > 0 ? (
            <div className="space-y-2.5">
              <span className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-wider">Tool Calls ({tools.gauss.length})</span>
              {tools.gauss.map((tr, i) => <ToolResultCard key={i} tr={tr} index={i} />)}
            </div>
          ) : (
            !sessionData?.searchQueries?.length && !sessionData?.sources?.length && <EmptyStage label="GAUSS" />
          )}
        </TabsContent>

        {/* ── TURING Tab ── */}
        <TabsContent value="turing" className="mt-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 flex items-center gap-2">
              <Database className="h-4 w-4 text-blue-500" />
              TURING -- Data Collection
            </h3>
            <StageStatus runStatus={run.status} stageIdx={1} />
          </div>
          {tools.turing.length > 0 ? (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-wider">API Calls ({tools.turing.length})</span>
                <div className="flex flex-wrap gap-1 justify-end">
                  {Array.from(new Set(tools.turing.map(t => {
                    const cat = TOOL_CATEGORY[t.tool];
                    return cat?.label || t.tool.split('_').slice(0, 2).join(' ');
                  }))).slice(0, 5).map(api => (
                    <Badge key={api} variant="outline" className="text-[8px] px-1.5 py-0 text-blue-600/60 border-blue-500/15">{api}</Badge>
                  ))}
                </div>
              </div>
              {tools.turing.map((tr, i) => <ToolResultCard key={i} tr={tr} index={i} />)}
            </div>
          ) : (
            <EmptyStage label="TURING" />
          )}
        </TabsContent>

        {/* ── NEWTON Tab ── */}
        <TabsContent value="newton" className="mt-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-cyan-500" />
              NEWTON -- Dataset Preparation
            </h3>
            <StageStatus runStatus={run.status} stageIdx={2} />
          </div>
          {codeByStage.newton.length > 0 && (
            <div className="space-y-2.5">
              <span className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="h-3 w-3" /> Python Scripts ({codeByStage.newton.length})
              </span>
              {codeByStage.newton.map((entry, i) => <CodeEntryCard key={i} entry={entry} index={i} />)}
            </div>
          )}
          <FigureGallery figures={figsByStage.newton} />
          {tools.newton.length > 0 && (
            <div className="space-y-2.5">
              <span className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-wider">Tool Results ({tools.newton.length})</span>
              {tools.newton.map((tr, i) => <ToolResultCard key={i} tr={tr} index={i} />)}
            </div>
          )}
          {codeByStage.newton.length === 0 && figsByStage.newton.length === 0 && tools.newton.length === 0 && (
            <EmptyStage label="NEWTON" />
          )}
        </TabsContent>

        {/* ── FISHER Tab ── */}
        <TabsContent value="fisher" className="mt-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 flex items-center gap-2">
              <Microscope className="h-4 w-4 text-indigo-500" />
              FISHER -- Empirical Analysis
            </h3>
            <StageStatus runStatus={run.status} stageIdx={3} />
          </div>
          {codeByStage.fisher.length > 0 && (
            <div className="space-y-2.5">
              <span className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="h-3 w-3" /> Python Scripts ({codeByStage.fisher.length})
              </span>
              {codeByStage.fisher.map((entry, i) => <CodeEntryCard key={i} entry={entry} index={i + 2} />)}
            </div>
          )}
          <FigureGallery figures={figsByStage.fisher} />
          {tools.fisher.length > 0 && (
            <div className="space-y-2.5">
              <span className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-wider">Tool Results ({tools.fisher.length})</span>
              {tools.fisher.map((tr, i) => <ToolResultCard key={i} tr={tr} index={i} />)}
            </div>
          )}
          {codeByStage.fisher.length === 0 && figsByStage.fisher.length === 0 && tools.fisher.length === 0 && (
            <EmptyStage label="FISHER" />
          )}
        </TabsContent>

        {/* ── EULER Tab ── */}
        <TabsContent value="euler" className="mt-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 flex items-center gap-2">
              <FileText className="h-4 w-4 text-rose-500" />
              EULER -- Paper Synthesis
            </h3>
            <StageStatus runStatus={run.status} stageIdx={4} />
          </div>
          {tools.euler.length > 0 ? (
            <div className="space-y-2.5">
              <span className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-wider">Writing Tools ({tools.euler.length})</span>
              {tools.euler.map((tr, i) => <ToolResultCard key={i} tr={tr} index={i} />)}
            </div>
          ) : (
            <EmptyStage label="EULER" />
          )}
          {sessionData && sessionData.answerLength > 0 && (
            <Card className="rounded-xl border-border/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-6 text-xs">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground/30" />
                    <span className="text-muted-foreground/60">Answer length:</span>
                    <span className="font-mono font-bold text-foreground">{(sessionData.answerLength / 1000).toFixed(1)}K chars</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Hash className="h-4 w-4 text-muted-foreground/30" />
                    <span className="text-muted-foreground/60">~{Math.round(sessionData.answerLength / 5).toLocaleString()} words</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── POPPER Tab ── */}
        <TabsContent value="popper" className="mt-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 flex items-center gap-2">
              <Shield className="h-4 w-4 text-amber-500" />
              POPPER -- Peer Review
            </h3>
            <StageStatus runStatus={run.status} stageIdx={5} />
          </div>
          {peerReview ? (
            <div className="space-y-4">
              {/* Score overview */}
              <Card className="rounded-xl border-border/30 overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-stretch">
                    <div className="flex items-center justify-center px-8 py-6 border-r border-border/20 bg-muted/5">
                      <ScoreDonut score={peerReview.overallScore} size={90} />
                    </div>
                    <div className="flex-1 p-5 space-y-3">
                      <Badge variant="outline" className={cn("text-xs font-semibold px-3 py-1.5",
                        peerReview.recommendation === "accept" ? "text-emerald-600 border-emerald-500/20 bg-emerald-500/5" :
                        peerReview.recommendation === "minor_revision" ? "text-blue-600 border-blue-500/20 bg-blue-500/5" :
                        peerReview.recommendation === "major_revision" ? "text-amber-600 border-amber-500/20 bg-amber-500/5" :
                        "text-red-600 border-red-500/20 bg-red-500/5"
                      )}>
                        {peerReview.recommendation.replace(/_/g, " ").toUpperCase()}
                      </Badge>
                      <p className="text-sm text-muted-foreground leading-relaxed">{peerReview.summary}</p>
                    </div>
                  </div>

                  {peerReview.detailedScores && (
                    <div className="px-6 pb-5 pt-2 border-t border-border/20">
                      <span className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-wider block mb-3">Dimension Scores</span>
                      <div className="space-y-2">
                        {Object.entries(peerReview.detailedScores).map(([key, score]) => {
                          const pct = Math.min(score as number, 100);
                          const color = pct >= 70 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-500" : "bg-red-500";
                          return (
                            <div key={key} className="flex items-center gap-3">
                              <span className="text-[10px] font-semibold capitalize text-muted-foreground w-28 text-right shrink-0">{key}</span>
                              <div className="flex-1 h-2.5 bg-muted/20 rounded-full overflow-hidden">
                                <div className={cn("h-full rounded-full transition-all duration-700", color)} style={{ width: `${pct}%` }} />
                              </div>
                              <span className={cn("text-xs font-bold font-mono w-8",
                                pct >= 70 ? "text-emerald-600" : pct >= 50 ? "text-amber-600" : "text-red-600"
                              )}>{score as number}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Strengths & Weaknesses */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Card className="rounded-xl border-border/30">
                  <CardContent className="p-4 space-y-2.5">
                    <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
                      <TrendingUp className="h-3 w-3" /> Strengths ({peerReview.strengths.length})
                    </span>
                    <ul className="space-y-1.5">
                      {peerReview.strengths.map((s, i) => (
                        <li key={i} className="text-xs text-muted-foreground pl-4 relative before:absolute before:left-0 before:top-1.5 before:w-2 before:h-2 before:rounded-full before:bg-emerald-500/20 before:border before:border-emerald-500/40 leading-relaxed">
                          {s}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
                <Card className="rounded-xl border-border/30">
                  <CardContent className="p-4 space-y-2.5">
                    <span className="text-[9px] font-bold text-red-600 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertTriangle className="h-3 w-3" /> Weaknesses ({peerReview.weaknesses.length})
                    </span>
                    <ul className="space-y-1.5">
                      {peerReview.weaknesses.map((w, i) => (
                        <li key={i} className="text-xs text-muted-foreground pl-4 relative before:absolute before:left-0 before:top-1.5 before:w-2 before:h-2 before:rounded-full before:bg-red-500/20 before:border before:border-red-500/40 leading-relaxed">
                          {w}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Section reviews */}
              {peerReview.sectionReviews && peerReview.sectionReviews.length > 0 && (
                <Card className="rounded-xl border-border/30">
                  <CardContent className="p-4 space-y-3">
                    <span className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-wider">Section Reviews</span>
                    <div className="space-y-2.5">
                      {peerReview.sectionReviews.map((sr, i) => (
                        <div key={i} className="p-3.5 rounded-xl bg-muted/10 border border-border/20 hover:bg-muted/15 transition-colors">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs font-semibold text-foreground">{sr.section}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-muted/20 rounded-full overflow-hidden">
                                <div className={cn("h-full rounded-full",
                                  sr.score >= 70 ? "bg-emerald-500" : sr.score >= 50 ? "bg-amber-500" : "bg-red-500"
                                )} style={{ width: `${Math.min(sr.score, 100)}%` }} />
                              </div>
                              <span className={cn("text-xs font-bold font-mono",
                                sr.score >= 70 ? "text-emerald-600" : sr.score >= 50 ? "text-amber-600" : "text-red-600"
                              )}>{sr.score}</span>
                            </div>
                          </div>
                          <p className="text-[10px] text-muted-foreground/70 leading-relaxed">{sr.comments}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Full report */}
              {peerReview.fullReport && (
                <details className="group">
                  <summary className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors flex items-center gap-1.5">
                    <Eye className="h-3 w-3" /> Full Peer Review Report
                  </summary>
                  <Card className="rounded-xl mt-2 border-border/30">
                    <CardContent className="p-5">
                      <pre className="text-[10px] text-muted-foreground/70 whitespace-pre-wrap font-mono max-h-[500px] overflow-y-auto leading-relaxed">
                        {peerReview.fullReport}
                      </pre>
                    </CardContent>
                  </Card>
                </details>
              )}
            </div>
          ) : (
            <EmptyStage label="POPPER" />
          )}
        </TabsContent>
      </Tabs>

      {/* ── Prompt (collapsible) ── */}
      {run.prompt && (
        <details className="group">
          <summary className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors flex items-center gap-1.5">
            <BrainCircuit className="h-3 w-3" /> View Full Prompt
          </summary>
          <Card className="rounded-xl mt-2 border-border/30">
            <CardContent className="p-5">
              <div className="flex justify-end mb-2">
                <CopyButton text={run.prompt} />
              </div>
              <pre className="text-[10px] text-muted-foreground/70 whitespace-pre-wrap font-mono max-h-80 overflow-y-auto leading-relaxed">
                {run.prompt}
              </pre>
            </CardContent>
          </Card>
        </details>
      )}
    </div>
  );
}
