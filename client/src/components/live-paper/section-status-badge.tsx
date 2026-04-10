import { CheckCircle, Pencil, Clock, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SectionStatus } from "./types";

const CONFIG: Record<SectionStatus, { label: string; icon: React.ElementType; color: string }> = {
  pending:   { label: "Pending",   icon: Clock,       color: "text-muted-foreground/40 border-border/20 bg-muted/10" },
  writing:   { label: "Writing",   icon: Pencil,      color: "text-sky-600 border-sky-500/25 bg-sky-500/8" },
  completed: { label: "Completed", icon: CheckCircle,  color: "text-emerald-600 border-emerald-500/25 bg-emerald-500/8" },
  revising:  { label: "Revising",  icon: RefreshCw,   color: "text-amber-600 border-amber-500/25 bg-amber-500/8" },
};

export function SectionStatusBadge({ status }: { status: SectionStatus }) {
  const cfg = CONFIG[status];
  const Icon = cfg.icon;
  return (
    <Badge variant="outline" className={cn(
      "gap-1 text-[9px] font-semibold px-2 py-0.5 uppercase tracking-wider",
      cfg.color,
    )}>
      <Icon className={cn("h-2.5 w-2.5", status === "writing" && "animate-pulse")} />
      {cfg.label}
    </Badge>
  );
}
