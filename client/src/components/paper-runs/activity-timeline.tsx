import { cn } from "@/lib/utils";
import { Check, AlertTriangle, Info, FileText, Zap } from "lucide-react";
import type { RunEvent } from "./types";

const EVENT_ICONS: Record<string, typeof Check> = {
  success: Check,
  error: AlertTriangle,
  warning: AlertTriangle,
  artifact: FileText,
  phase: Zap,
  info: Info,
};

const EVENT_STYLES: Record<string, string> = {
  success: "text-emerald-500 bg-emerald-500/10",
  error: "text-red-500 bg-red-500/10",
  warning: "text-amber-500 bg-amber-500/10",
  artifact: "text-primary bg-primary/10",
  phase: "text-violet-500 bg-violet-500/10",
  info: "text-blue-500 bg-blue-500/10",
};

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = Date.now();
  const diff = now - date.getTime();

  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return date.toLocaleDateString();
}

export function ActivityTimeline({ events, maxItems = 8 }: { events: RunEvent[]; maxItems?: number }) {
  const visible = events.slice(-maxItems).reverse();

  if (visible.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-xs text-muted-foreground/60">No activity yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {visible.map((event, i) => {
        const Icon = EVENT_ICONS[event.type] || Info;
        const style = EVENT_STYLES[event.type] || EVENT_STYLES.info;
        const isFirst = i === 0;

        return (
          <div key={event.id} className="flex items-start gap-3 group">
            {/* Timeline line + dot */}
            <div className="flex flex-col items-center flex-shrink-0">
              <div className={cn(
                "h-6 w-6 rounded-full flex items-center justify-center transition-all",
                style,
                isFirst && "ring-2 ring-offset-2 ring-offset-card ring-current/20",
              )}>
                <Icon className="h-3 w-3" />
              </div>
              {i < visible.length - 1 && (
                <div className="w-px h-4 bg-border/40" />
              )}
            </div>
            {/* Content */}
            <div className="flex-1 min-w-0 pb-3 -mt-0.5">
              <div className="flex items-baseline gap-2">
                <p className={cn(
                  "text-xs font-medium truncate",
                  isFirst ? "text-foreground" : "text-foreground/70",
                )}>
                  {event.title}
                </p>
                <span className="text-[10px] text-muted-foreground/50 flex-shrink-0 tabular-nums">
                  {formatTime(event.timestamp)}
                </span>
              </div>
              {event.agent && (
                <span className="text-[10px] text-muted-foreground/60">{event.agent}</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
