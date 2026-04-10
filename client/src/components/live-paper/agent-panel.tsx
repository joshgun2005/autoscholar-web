import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Database, BarChart3, Microscope, Brain, Shield,
  Zap, CheckCircle, Clock, AlertTriangle, Code, BookOpen, FileText,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { LiveAgent, AgentStatus } from "./types";

// ── Icon map ─────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ElementType> = {
  "Search": Search,
  "search": Search,
  "Database": Database,
  "database": Database,
  "BarChart3": BarChart3,
  "bar-chart-2": BarChart3,
  "bar-chart-3": BarChart3,
  "Microscope": Microscope,
  "microscope": Microscope,
  "Brain": Brain,
  "brain": Brain,
  "Shield": Shield,
  "shield": Shield,
  "code": Code,
  "book-open": BookOpen,
  "file-text": FileText,
};

const STATUS_STYLE: Record<AgentStatus, { label: string; dot: string; border: string }> = {
  active:    { label: "Active",    dot: "bg-emerald-500",  border: "border-primary/25 shadow-sm" },
  idle:      { label: "Idle",      dot: "bg-muted-foreground/30", border: "border-border/20" },
  completed: { label: "Done",      dot: "bg-emerald-500",  border: "border-border/20" },
  queued:    { label: "Queued",    dot: "bg-muted-foreground/20", border: "border-border/15" },
  warning:   { label: "Warning",   dot: "bg-amber-500",    border: "border-amber-500/20" },
};

const COLOR_MAP: Record<string, { text: string; bg: string; glow: string }> = {
  blue:    { text: "text-blue-500",    bg: "bg-blue-500/10",    glow: "shadow-blue-500/10" },
  violet:  { text: "text-violet-500",  bg: "bg-violet-500/10",  glow: "shadow-violet-500/10" },
  emerald: { text: "text-emerald-500", bg: "bg-emerald-500/10", glow: "shadow-emerald-500/10" },
  amber:   { text: "text-amber-500",   bg: "bg-amber-500/10",   glow: "shadow-amber-500/10" },
  rose:    { text: "text-rose-500",    bg: "bg-rose-500/10",    glow: "shadow-rose-500/10" },
  indigo:  { text: "text-indigo-500",  bg: "bg-indigo-500/10",  glow: "shadow-indigo-500/10" },
  cyan:    { text: "text-cyan-500",    bg: "bg-cyan-500/10",    glow: "shadow-cyan-500/10" },
  teal:    { text: "text-teal-500",    bg: "bg-teal-500/10",    glow: "shadow-teal-500/10" },
};

function timeAgo(ts: number | null): string {
  if (!ts) return "";
  const secs = Math.floor((Date.now() - ts) / 1000);
  if (secs < 10) return "just now";
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  return "";
}

// ── Agent card ───────────────────────────────────────────────

function AgentCard({ agent }: { agent: LiveAgent }) {
  const Icon = ICON_MAP[agent.icon] || Brain;
  const statusCfg = STATUS_STYLE[agent.status];
  const colorCfg = COLOR_MAP[agent.color] || COLOR_MAP.teal;
  const isActive = agent.status === "active";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "rounded-xl border p-4 space-y-2.5 transition-all duration-300",
        statusCfg.border,
        isActive ? `bg-background ${colorCfg.glow} shadow-md` : "bg-muted/5",
        agent.status === "queued" && "opacity-50",
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", colorCfg.bg)}>
          <Icon className={cn("h-4 w-4", colorCfg.text)} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-foreground">{agent.name}</span>
            {/* Status dot */}
            <span className="relative flex h-2 w-2 shrink-0">
              {isActive && <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", statusCfg.dot)} />}
              <span className={cn("relative inline-flex rounded-full h-2 w-2", statusCfg.dot)} />
            </span>
          </div>
          <span className="text-[10px] text-muted-foreground/50 font-medium leading-tight">{agent.role}</span>
        </div>
        {agent.toolCalls > 0 && (
          <span className="text-[9px] text-muted-foreground/40 font-mono flex items-center gap-0.5 shrink-0">
            <Zap className="h-2.5 w-2.5" />{agent.toolCalls}
          </span>
        )}
      </div>

      {/* Current task */}
      {agent.currentTask && (
        <div className="text-[11px] text-foreground/70 leading-relaxed pl-[42px]">
          {agent.currentTask}
        </div>
      )}

      {/* Last action */}
      {agent.lastAction && !agent.currentTask && (
        <div className="text-[10px] text-muted-foreground/50 leading-relaxed pl-[42px] italic">
          {agent.lastAction}
        </div>
      )}

      {/* Timestamp */}
      {agent.lastActionAt && (
        <div className="text-[9px] text-muted-foreground/30 pl-[42px]">
          {timeAgo(agent.lastActionAt)}
        </div>
      )}
    </motion.div>
  );
}

// ── Panel ────────────────────────────────────────────────────

export function AgentActivityPanel({ agents }: { agents: LiveAgent[] }) {
  // Sort: active first, then completed, then queued
  const sorted = [...agents].sort((a, b) => {
    const order: Record<AgentStatus, number> = { active: 0, warning: 1, idle: 2, completed: 3, queued: 4 };
    return (order[a.status] ?? 5) - (order[b.status] ?? 5);
  });

  const activeCount = agents.filter(a => a.status === "active").length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50">
          Agents
        </h3>
        <Badge variant="outline" className="text-[9px] px-2 py-0.5 text-muted-foreground/50 border-border/20">
          {activeCount} active
        </Badge>
      </div>
      <div className="space-y-2.5">
        <AnimatePresence mode="popLayout">
          {sorted.map(agent => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
