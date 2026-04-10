import { cn } from "@/lib/utils";
import { BookOpen, Database, BarChart3, Image, FileText, Package } from "lucide-react";
import type { RunArtifactCounts } from "./types";

interface ArtifactItem {
  icon: typeof BookOpen;
  label: string;
  count: number;
  color: string;
}

export function ArtifactPanel({ counts }: { counts: RunArtifactCounts }) {
  const items: ArtifactItem[] = [
    { icon: BookOpen, label: "Papers Reviewed", count: counts.papersReviewed, color: "text-violet-500" },
    { icon: Database, label: "Datasets", count: counts.datasetsRetained, color: "text-blue-500" },
    { icon: BarChart3, label: "Models Run", count: counts.modelsRun, color: "text-amber-500" },
    { icon: Image, label: "Figures", count: counts.figuresGenerated, color: "text-rose-500" },
    { icon: FileText, label: "Sections", count: counts.sectionsWritten, color: "text-cyan-500" },
    { icon: Package, label: "Compiled", count: counts.compilationDone ? 1 : 0, color: "text-emerald-500" },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map((item) => {
        const isActive = item.count > 0;
        return (
          <div
            key={item.label}
            className={cn(
              "flex flex-col items-center gap-1 py-2.5 px-2 rounded-lg border transition-all",
              isActive
                ? "bg-card border-border/60"
                : "bg-muted/20 border-border/20 opacity-50",
            )}
          >
            <item.icon className={cn("h-3.5 w-3.5", isActive ? item.color : "text-muted-foreground/40")} />
            <span className={cn(
              "text-lg font-semibold leading-none tabular-nums",
              isActive ? "text-foreground" : "text-muted-foreground/30",
            )}>
              {item.count}
            </span>
            <span className="text-[9px] text-muted-foreground/60 text-center leading-tight">
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
