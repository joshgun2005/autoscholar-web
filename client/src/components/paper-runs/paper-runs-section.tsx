import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FlaskConical, Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { PaperRunCard } from "./paper-run-card";
import { RunDetailDrawer } from "./run-detail-drawer";
import type { PaperRunSummary } from "./types";

export function PaperRunsSection({ runs }: { runs: PaperRunSummary[] }) {
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  if (runs.length === 0) return null;

  const activeCount = runs.filter((r) =>
    ["queued", "researching", "analyzing", "drafting", "validating"].includes(r.status),
  ).length;
  const publishedCount = runs.filter((r) => r.status === "published").length;
  const failedCount = runs.filter((r) => r.status === "failed" || r.status === "rejected").length;

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <FlaskConical className="w-4 h-4" />
                Research Mission Control
              </CardTitle>
              <CardDescription className="mt-1">
                Track your autonomous paper generation pipeline
              </CardDescription>
            </div>
            <div className="flex items-center gap-1.5">
              {activeCount > 0 && (
                <Badge variant="outline" className="text-[10px] gap-1 bg-primary/5 text-primary border-primary/20">
                  <Loader2 className="h-2.5 w-2.5 animate-spin" />
                  {activeCount} active
                </Badge>
              )}
              {publishedCount > 0 && (
                <Badge variant="outline" className="text-[10px] gap-1 bg-emerald-500/5 text-emerald-600 border-emerald-500/20">
                  <CheckCircle className="h-2.5 w-2.5" />
                  {publishedCount}
                </Badge>
              )}
              {failedCount > 0 && (
                <Badge variant="outline" className="text-[10px] gap-1 bg-red-500/5 text-red-600 border-red-500/20">
                  <AlertTriangle className="h-2.5 w-2.5" />
                  {failedCount}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {runs.map((run) => (
              <PaperRunCard
                key={run.id}
                run={run}
                onOpenDetail={(id) => setSelectedRunId(id)}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <RunDetailDrawer
        runId={selectedRunId}
        open={!!selectedRunId}
        onClose={() => setSelectedRunId(null)}
      />
    </>
  );
}
