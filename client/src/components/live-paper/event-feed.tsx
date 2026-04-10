import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Database, BarChart3, FileText, ShieldCheck, Cpu,
  Settings, CheckCircle, AlertTriangle, Info, Sparkles,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { LiveEvent, EventSeverity } from "./types";

// ── Config ───────────────────────────────────────────────────

const TYPE_ICON: Record<string, React.ElementType> = {
  research:    Search,
  data:        Database,
  analysis:    BarChart3,
  writing:     FileText,
  validation:  ShieldCheck,
  compilation: Cpu,
  system:      Settings,
};

const SEVERITY_STYLE: Record<EventSeverity, { dot: string; accent: string }> = {
  info:      { dot: "bg-sky-500/60",     accent: "" },
  success:   { dot: "bg-emerald-500",    accent: "text-emerald-600 dark:text-emerald-400" },
  warning:   { dot: "bg-amber-500",      accent: "text-amber-600 dark:text-amber-400" },
  recovered: { dot: "bg-orange-500/70",  accent: "text-orange-600 dark:text-orange-400" },
};

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
}

// ── Single event row ─────────────────────────────────────────

function EventRow({ event, isNew }: { event: LiveEvent; isNew: boolean }) {
  const Icon = TYPE_ICON[event.type] || Info;
  const severity = SEVERITY_STYLE[event.severity];

  return (
    <motion.div
      initial={isNew ? { opacity: 0, y: -8, scale: 0.98 } : false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-start gap-3 py-2.5 px-1 group"
    >
      {/* Timeline dot */}
      <div className="flex flex-col items-center pt-1 shrink-0">
        <div className={cn("w-2 h-2 rounded-full", severity.dot)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center gap-2 flex-wrap">
          <Icon className="h-3 w-3 text-muted-foreground/40 shrink-0" />
          <span className={cn(
            "text-[11px] font-semibold",
            severity.accent || "text-foreground/80",
          )}>
            {event.title}
          </span>
          {event.agentId && (
            <span className="text-[9px] text-muted-foreground/35 font-mono uppercase">{event.agentId}</span>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground/50 leading-relaxed">{event.message}</p>
      </div>

      {/* Timestamp */}
      <span className="text-[9px] text-muted-foreground/30 font-mono shrink-0 pt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        {formatTime(event.timestamp)}
      </span>
    </motion.div>
  );
}

// ── Feed ─────────────────────────────────────────────────────

const DEFAULT_VISIBLE = 10;

export function LiveEventFeed({ events }: { events: LiveEvent[] }) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? events : events.slice(0, DEFAULT_VISIBLE);
  const hasMore = events.length > DEFAULT_VISIBLE;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50">
          Activity Feed
        </h3>
        <span className="text-[9px] text-muted-foreground/35 font-mono">{events.length} events</span>
      </div>

      <div className="rounded-xl border border-border/25 bg-background overflow-hidden">
        <div className="divide-y divide-border/10 px-3">
          <AnimatePresence initial={false}>
            {visible.map((event, i) => (
              <EventRow key={event.id} event={event} isNew={i === 0} />
            ))}
          </AnimatePresence>
        </div>

        {hasMore && !showAll && (
          <button
            onClick={() => setShowAll(true)}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 text-[10px] text-muted-foreground/40 hover:text-muted-foreground/60 transition-colors border-t border-border/10"
          >
            <ChevronDown className="h-3 w-3" />
            Show {events.length - DEFAULT_VISIBLE} older events
          </button>
        )}
      </div>
    </div>
  );
}
