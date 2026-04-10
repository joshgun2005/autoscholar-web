import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Search, Database, BarChart3, BrainCircuit, FileText,
  Shield, CheckCircle, XCircle, AlertTriangle, Clock, Microscope,
  Code2, Image, Link2, Zap, Hash, DollarSign, BookOpen,
  ChevronDown, ChevronRight, ExternalLink, Terminal,
  TrendingUp, Award, Eye, Copy, Check, Timer, Cpu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ToolResult, PythonCodeEntry, CustomPythonFigure } from "./types";
import { TOOL_CATEGORY, ACTIVE_STATUSES, STATUS_TO_STAGE_IDX, PIPELINE_STAGES } from "./agent-classification";

// ── Status config ──────────────────────────────────────────

export const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType; glow?: string }> = {
  queued:      { label: "Queued",      color: "text-gray-600 dark:text-gray-400",    bg: "bg-gray-500/10 border-gray-500/20",    icon: Clock },
  researching: { label: "Researching", color: "text-violet-600 dark:text-violet-400", bg: "bg-violet-500/10 border-violet-500/20", icon: Search,       glow: "shadow-violet-500/20" },
  analyzing:   { label: "Analyzing",   color: "text-blue-600 dark:text-blue-400",     bg: "bg-blue-500/10 border-blue-500/20",     icon: Database,     glow: "shadow-blue-500/20" },
  drafting:    { label: "Drafting",    color: "text-rose-600 dark:text-rose-400",     bg: "bg-rose-500/10 border-rose-500/20",     icon: BrainCircuit, glow: "shadow-rose-500/20" },
  validating:  { label: "Validating",  color: "text-amber-600 dark:text-amber-400",   bg: "bg-amber-500/10 border-amber-500/20",   icon: Shield,       glow: "shadow-amber-500/20" },
  published:   { label: "Published",   color: "text-emerald-600 dark:text-emerald-400",bg: "bg-emerald-500/10 border-emerald-500/20",icon: CheckCircle },
  rejected:    { label: "Rejected",    color: "text-red-600 dark:text-red-400",       bg: "bg-red-500/10 border-red-500/20",       icon: XCircle },
  failed:      { label: "Failed",      color: "text-red-600 dark:text-red-400",       bg: "bg-red-500/10 border-red-500/20",       icon: AlertTriangle },
};

// ── Format helpers ─────────────────────────────────────────

export function formatDuration(startedAt: string | null, completedAt: string | null): string {
  if (!startedAt) return "--";
  const start = new Date(startedAt).getTime();
  const end = completedAt ? new Date(completedAt).getTime() : Date.now();
  const secs = Math.round((end - start) / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ${secs % 60}s`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export function formatTimestamp(ts: string | number): string {
  const d = new Date(ts);
  return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

// ── Sub-components ─────────────────────────────────────────

export function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.queued;
  const Icon = cfg.icon;
  const isActive = ACTIVE_STATUSES.has(status);
  return (
    <Badge variant="outline" className={cn(
      "gap-1.5 text-[11px] font-semibold px-3 py-1.5 transition-all",
      cfg.bg, cfg.color,
      isActive && cfg.glow && `shadow-md ${cfg.glow}`,
    )}>
      <Icon className={cn("h-3.5 w-3.5", isActive && "animate-pulse")} />
      {cfg.label}
    </Badge>
  );
}

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="p-1 rounded hover:bg-muted/40 transition-colors text-muted-foreground/40 hover:text-muted-foreground"
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
    >
      {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}

export function ToolResultCard({ tr, index }: { tr: ToolResult; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const cat = TOOL_CATEGORY[tr.tool];
  const resultStr = typeof tr.result === "string" ? tr.result : JSON.stringify(tr.result, null, 2);
  const resultLen = resultStr?.length || 0;
  const hasData = resultLen > 10;

  const summary = useMemo(() => {
    if (!tr.result || typeof tr.result !== 'object') return null;
    const r = tr.result;
    if (r.papers_found !== undefined) return `${r.papers_found} papers found`;
    if (r.total_results !== undefined) return `${r.total_results} results`;
    if (r.count !== undefined) return `${r.count} items`;
    if (r.symbol) return r.symbol;
    if (r.ticker) return r.ticker;
    if (r.title) return r.title.slice(0, 60);
    if (Array.isArray(r) && r.length > 0) return `${r.length} items`;
    return null;
  }, [tr.result]);

  return (
    <div className={cn(
      "border rounded-xl overflow-hidden transition-all",
      expanded ? "border-primary/30 shadow-sm" : "border-border/30 hover:border-border/50",
    )}>
      <button
        className="w-full flex items-center gap-2.5 px-4 py-3 text-left hover:bg-muted/20 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="text-[10px] font-mono text-muted-foreground/40 w-5 text-right shrink-0">{index + 1}</span>
        <Zap className="h-3.5 w-3.5 text-primary/50 shrink-0" />
        <span className="text-xs font-mono font-semibold text-foreground">{tr.tool}</span>
        {cat && (
          <Badge variant="outline" className={cn("text-[8px] px-1.5 py-0 font-semibold uppercase tracking-wider",
            `text-${cat.color}-600 border-${cat.color}-500/20 bg-${cat.color}-500/5`
          )}>
            {cat.label}
          </Badge>
        )}
        {summary && <span className="text-[10px] text-muted-foreground/60 truncate max-w-48">{summary}</span>}
        <div className="ml-auto flex items-center gap-2 shrink-0">
          {hasData && <span className="text-[9px] text-muted-foreground/40 font-mono">{formatNumber(resultLen)} chars</span>}
          {expanded ? <ChevronDown className="h-3 w-3 text-muted-foreground/40" /> : <ChevronRight className="h-3 w-3 text-muted-foreground/40" />}
        </div>
      </button>
      {expanded && (
        <div className="border-t border-border/20">
          <div className="flex items-center justify-between px-4 py-1.5 bg-muted/5">
            <span className="text-[9px] text-muted-foreground/50">Result payload</span>
            <CopyButton text={resultStr || ""} />
          </div>
          <pre className="px-4 py-3 text-[10px] text-muted-foreground whitespace-pre-wrap font-mono max-h-[500px] overflow-y-auto leading-relaxed bg-muted/5">
            {resultStr || "--"}
          </pre>
        </div>
      )}
    </div>
  );
}

export function CodeEntryCard({ entry, index }: { entry: PythonCodeEntry; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const statusColor = entry.status === "success" ? "emerald" : entry.status === "error" ? "red" : "gray";
  return (
    <div className={cn(
      "border rounded-xl overflow-hidden transition-all",
      expanded ? "border-emerald-500/30 shadow-sm" : "border-border/30 hover:border-border/50",
    )}>
      <button
        className="w-full flex items-center gap-2.5 px-4 py-3 text-left hover:bg-muted/20 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="text-[10px] font-mono text-muted-foreground/40 w-5 text-right shrink-0">{index + 1}</span>
        <Terminal className="h-3.5 w-3.5 text-emerald-500/60 shrink-0" />
        <span className="text-xs font-medium text-foreground truncate flex-1">{entry.description || "Python execution"}</span>
        {entry.agent && (
          <Badge variant="outline" className="text-[8px] px-1.5 py-0 font-bold uppercase tracking-wider">
            {entry.agent}
          </Badge>
        )}
        <Badge variant="outline" className={cn("text-[9px] px-2 py-0.5 font-semibold",
          `text-${statusColor}-600 border-${statusColor}-500/20 bg-${statusColor}-500/5`
        )}>
          {entry.status}
        </Badge>
        {entry.duration != null && (
          <span className="text-[10px] text-muted-foreground/50 font-mono flex items-center gap-1 shrink-0">
            <Timer className="h-2.5 w-2.5" />{(entry.duration / 1000).toFixed(1)}s
          </span>
        )}
        {expanded ? <ChevronDown className="h-3 w-3 text-muted-foreground/40" /> : <ChevronRight className="h-3 w-3 text-muted-foreground/40" />}
      </button>
      {expanded && (
        <div className="border-t border-border/20">
          <div className="flex items-center justify-between px-4 py-1.5 bg-emerald-500/3">
            <span className="text-[9px] text-muted-foreground/50">Python source ({entry.code?.split('\n').length || 0} lines)</span>
            <CopyButton text={entry.code || ""} />
          </div>
          <pre className="px-4 py-3 text-[10px] text-foreground/80 whitespace-pre-wrap font-mono max-h-[500px] overflow-y-auto leading-relaxed bg-[#0d1117]/[0.03] dark:bg-[#0d1117]/30">
            {entry.code}
          </pre>
          {entry.error && (
            <div className="border-t border-red-500/20 px-4 py-3 bg-red-500/5">
              <span className="text-[9px] font-bold text-red-600 uppercase tracking-wider block mb-1">Error Output</span>
              <pre className="text-[10px] text-red-600/80 whitespace-pre-wrap font-mono max-h-48 overflow-y-auto">{entry.error}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function FigureGallery({ figures }: { figures: CustomPythonFigure[] }) {
  const allUrls = figures.flatMap(f => {
    const urls = f.figureUrls || f.figures || [];
    return urls.map(url => ({ url, desc: f.description || `Figure ${f.id}` }));
  });
  if (allUrls.length === 0) return null;

  return (
    <div className="space-y-2.5">
      <span className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-wider flex items-center gap-1.5">
        <Image className="h-3 w-3" /> Figures ({allUrls.length})
      </span>
      <div className={cn(
        "grid gap-3",
        allUrls.length === 1 ? "grid-cols-1" : allUrls.length === 2 ? "grid-cols-2" : "grid-cols-2 lg:grid-cols-3"
      )}>
        {allUrls.map(({ url, desc }, i) => (
          <div key={i} className="group relative border border-border/30 rounded-xl overflow-hidden bg-white dark:bg-gray-950 hover:border-border/60 transition-all hover:shadow-md">
            <img
              src={url.startsWith("data:") ? url : `/api/figures/${url}`}
              alt={`Figure ${i + 1}`}
              className="w-full object-contain max-h-72 p-2"
            />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <p className="text-[10px] text-white/90 font-medium truncate">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function EmptyStage({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-muted/20 flex items-center justify-center mb-3 border border-border/20">
        <Hash className="h-6 w-6 text-muted-foreground/20" />
      </div>
      <p className="text-sm text-muted-foreground/50 font-medium">No data for {label}</p>
      <p className="text-xs text-muted-foreground/30 mt-1">This stage hasn't produced results yet.</p>
    </div>
  );
}

export function StageStatus({ runStatus, stageIdx }: { runStatus: string; stageIdx: number }) {
  const currentIdx = STATUS_TO_STAGE_IDX[runStatus] ?? -1;
  if (runStatus === "failed") return <Badge variant="outline" className="text-[9px] text-red-600 border-red-500/20 bg-red-500/5 gap-1"><AlertTriangle className="h-2.5 w-2.5" />Failed</Badge>;
  if (stageIdx < currentIdx) return <Badge variant="outline" className="text-[9px] text-emerald-600 border-emerald-500/20 bg-emerald-500/5 gap-1"><CheckCircle className="h-2.5 w-2.5" />Complete</Badge>;
  if (stageIdx === currentIdx) return <Badge variant="outline" className="text-[9px] text-primary border-primary/20 bg-primary/5 gap-1 animate-pulse"><Zap className="h-2.5 w-2.5" />Active</Badge>;
  return <Badge variant="outline" className="text-[9px] text-muted-foreground/30 border-border/10">Pending</Badge>;
}

// ── Pipeline progress bar ──────────────────────────────────

const PIPELINE_STAGE_ICONS: Record<string, React.ElementType> = {
  Search, Database, BarChart3, Microscope, FileText, Shield,
};

export function PipelineProgress({ status, toolCounts }: { status: string; toolCounts: Record<string, number> }) {
  const currentIdx = STATUS_TO_STAGE_IDX[status] ?? -1;
  return (
    <div className="flex items-center gap-1.5">
      {PIPELINE_STAGES.map((stage, i) => {
        const isActive = i === currentIdx;
        const isDone = i < currentIdx && currentIdx >= 0;
        const isFailed = status === "failed";
        const count = toolCounts[stage.key] || 0;
        const StageIcon = PIPELINE_STAGE_ICONS[stage.icon];
        return (
          <div key={stage.key} className="flex items-center gap-1.5 flex-1">
            <div className={cn(
              "flex items-center gap-1.5 px-2.5 py-2 rounded-xl border text-[9px] font-bold transition-all flex-1 justify-center uppercase tracking-wider",
              isFailed ? "bg-red-500/5 border-red-500/10 text-red-500/30" :
              isActive ? `bg-primary/10 border-primary/30 text-primary shadow-md shadow-primary/10` :
              isDone ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400" :
              "bg-muted/10 border-border/15 text-muted-foreground/25"
            )}>
              {StageIcon && <StageIcon className={cn("h-3 w-3", isActive && "animate-pulse")} />}
              <span className="hidden sm:inline">{stage.label}</span>
              {isDone && <CheckCircle className="h-2.5 w-2.5" />}
              {count > 0 && (
                <span className={cn(
                  "text-[7px] rounded-full px-1.5 py-0 font-mono ml-0.5",
                  isDone ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300" :
                  isActive ? "bg-primary/20 text-primary" :
                  "bg-muted/30 text-muted-foreground/40"
                )}>
                  {count}
                </span>
              )}
            </div>
            {i < PIPELINE_STAGES.length - 1 && (
              <div className={cn("w-4 h-px shrink-0 transition-colors",
                isDone ? "bg-emerald-500/40" : "bg-border/20"
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Metric card ────────────────────────────────────────────

export function MetricCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string; sub?: string; color?: string;
}) {
  return (
    <div className="px-3.5 py-2.5 rounded-xl bg-muted/15 border border-border/20 hover:bg-muted/25 transition-colors">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className={cn("h-3 w-3", color || "text-muted-foreground/50")} />
        <span className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-wider">{label}</span>
      </div>
      <span className={cn("text-sm font-bold font-mono text-foreground block leading-tight", color)}>{value}</span>
      {sub && <span className="text-[9px] text-muted-foreground/40 font-mono">{sub}</span>}
    </div>
  );
}

// ── Popper score donut ─────────────────────────────────────

export function ScoreDonut({ score, size = 80 }: { score: number; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(score, 100) / 100;
  const color = score >= 60 ? "#10b981" : score >= 45 ? "#f59e0b" : "#ef4444";
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" strokeWidth={4} className="text-muted/20" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={4}
          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)} strokeLinecap="round"
          className="transition-all duration-1000 ease-out" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xl font-black font-mono" style={{ color }}>{score}</span>
      </div>
    </div>
  );
}
