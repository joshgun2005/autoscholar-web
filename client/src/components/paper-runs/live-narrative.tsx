import { cn } from "@/lib/utils";
import { CheckCircle, Loader2, ArrowRight } from "lucide-react";
import type { RunNarrative } from "./types";

export function LiveNarrative({ narrative, isActive }: { narrative: RunNarrative; isActive: boolean }) {
  const hasContent = narrative.justFinished || narrative.happeningNow || narrative.comingNext;
  if (!hasContent) return null;

  return (
    <div className="space-y-2">
      {narrative.justFinished && (
        <div className="flex items-start gap-2.5">
          <div className="h-5 w-5 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <CheckCircle className="h-3 w-3 text-emerald-500" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Just finished</span>
            <p className="text-xs text-foreground/80 mt-0.5">{narrative.justFinished}</p>
          </div>
        </div>
      )}
      {narrative.happeningNow && isActive && (
        <div className="flex items-start gap-2.5">
          <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <Loader2 className="h-3 w-3 text-primary animate-spin" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Now running</span>
            <p className="text-xs text-foreground font-medium mt-0.5">{narrative.happeningNow}</p>
          </div>
        </div>
      )}
      {narrative.comingNext && isActive && (
        <div className="flex items-start gap-2.5">
          <div className="h-5 w-5 rounded-full bg-muted/60 flex items-center justify-center flex-shrink-0 mt-0.5">
            <ArrowRight className="h-3 w-3 text-muted-foreground/50" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider">Coming next</span>
            <p className="text-xs text-muted-foreground mt-0.5">{narrative.comingNext}</p>
          </div>
        </div>
      )}
    </div>
  );
}
