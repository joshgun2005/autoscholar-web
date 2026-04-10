import { Badge } from "@/components/ui/badge";
import { Shield, ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ValidationBadgeProps {
  score: number | null;
  recommendation?: string | null;
  size?: "sm" | "md";
}

function getScoreConfig(score: number) {
  if (score >= 80) return { color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", icon: ShieldCheck, label: "Excellent" };
  if (score >= 60) return { color: "bg-amber-500/10 text-amber-600 border-amber-500/20", icon: Shield, label: "Good" };
  if (score >= 45) return { color: "bg-orange-500/10 text-orange-600 border-orange-500/20", icon: ShieldAlert, label: "Adequate" };
  return { color: "bg-red-500/10 text-red-600 border-red-500/20", icon: ShieldX, label: "Below Standard" };
}

const RECOMMENDATION_LABELS: Record<string, string> = {
  accept: "Accept",
  minor_revision: "Minor Revision",
  major_revision: "Major Revision",
  reject: "Reject",
};

export function ValidationBadge({ score, recommendation, size = "sm" }: ValidationBadgeProps) {
  if (score === null || score === undefined) return null;

  const config = getScoreConfig(score);
  const Icon = config.icon;
  const isSmall = size === "sm";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant="outline" className={`${config.color} gap-1 ${isSmall ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-1'} cursor-help`}>
          <Icon className={isSmall ? "h-3 w-3" : "h-3.5 w-3.5"} />
          {score}/100
        </Badge>
      </TooltipTrigger>
      <TooltipContent className="rounded-xl max-w-xs">
        <div className="space-y-1">
          <p className="font-semibold">Popper Validation: {config.label}</p>
          {recommendation && (
            <p className="text-xs text-muted-foreground">
              Recommendation: {RECOMMENDATION_LABELS[recommendation] || recommendation}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            AI peer review score based on originality, methodology, results, writing, references, and reproducibility.
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
