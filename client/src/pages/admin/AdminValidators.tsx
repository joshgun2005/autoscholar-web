import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Shield, ShieldCheck, ShieldAlert, ShieldX, Cpu, Power, PowerOff } from "lucide-react";

interface PopperConfig {
  threshold: number;
  popperEnabled: boolean;
  model: string;
  dimensions: string[];
}

interface PeerReview {
  id: string;
  paperId: string;
  overallScore: number;
  summary: string;
  recommendation: string;
  createdAt: string;
}

const DIMENSION_LABELS: Record<string, string> = {
  originality: "Originality",
  methodology: "Methodology",
  results: "Results Quality",
  writing: "Writing Quality",
  references: "References",
  reproducibility: "Reproducibility",
};

export function AdminValidators() {
  const queryClient = useQueryClient();

  const { data: popperConfig } = useQuery<PopperConfig>({
    queryKey: ["/api/admin/validators/popper"],
    queryFn: async () => { const res = await fetch("/api/admin/validators/popper", { credentials: "include" }); return res.json(); },
  });

  const { data: reviews = [] } = useQuery<PeerReview[]>({
    queryKey: ["/api/journal/reviews"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/journal/reviews", { credentials: "include" });
        if (!res.ok) return [];
        return res.json();
      } catch { return []; }
    },
  });

  const updateThreshold = useMutation({
    mutationFn: async (threshold: number) => {
      const res = await fetch("/api/admin/validators/popper", {
        method: "PATCH", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threshold }),
      });
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/validators/popper"] }); },
  });

  const togglePopper = useMutation({
    mutationFn: async (enabled: boolean) => {
      const res = await fetch("/api/admin/validators/popper", {
        method: "PATCH", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ popperEnabled: enabled }),
      });
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/validators/popper"] }); },
  });

  const popperEnabled = popperConfig?.popperEnabled ?? true;

  const avgScore = reviews.length > 0
    ? Math.round(reviews.reduce((s, r) => s + r.overallScore, 0) / reviews.length)
    : 0;

  const scoreDistribution = { excellent: 0, good: 0, adequate: 0, below: 0 };
  for (const r of reviews) {
    if (r.overallScore >= 80) scoreDistribution.excellent++;
    else if (r.overallScore >= 60) scoreDistribution.good++;
    else if (r.overallScore >= 45) scoreDistribution.adequate++;
    else scoreDistribution.below++;
  }

  return (
    <div className="space-y-6">
      {/* ── Popper ON/OFF Toggle ───────────────────── */}
      <Card className={`rounded-xl border-2 transition-colors ${popperEnabled ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-red-500/30 bg-red-500/5'}`}>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {popperEnabled ? (
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-emerald-500" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center">
                  <ShieldX className="h-5 w-5 text-red-500" />
                </div>
              )}
              <div>
                <h3 className="text-sm font-bold">
                  Popper Peer Review
                  <Badge variant={popperEnabled ? "default" : "destructive"} className="ml-2 text-[10px]">
                    {popperEnabled ? "ACTIVE" : "DISABLED"}
                  </Badge>
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {popperEnabled
                    ? "Papers are validated by Popper before publication. Papers below threshold are rejected."
                    : "Popper is OFF — all generated papers are auto-published without peer review."}
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant={popperEnabled ? "destructive" : "default"}
              onClick={() => togglePopper.mutate(!popperEnabled)}
              className="gap-1.5 rounded-lg min-w-[120px]"
              disabled={togglePopper.isPending}
            >
              {popperEnabled ? (
                <>
                  <PowerOff className="h-3.5 w-3.5" />
                  Disable Popper
                </>
              ) : (
                <>
                  <Power className="h-3.5 w-3.5" />
                  Enable Popper
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Popper Configuration ────────────────────── */}
      <Card className={`rounded-xl transition-opacity ${popperEnabled ? '' : 'opacity-50 pointer-events-none'}`}>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="h-5 w-5 text-indigo-500" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Popper Validator Configuration</h3>
          </div>

          <div className="space-y-6">
            {/* Threshold slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Publication Threshold</span>
                <span className="text-lg font-bold text-primary">{popperConfig?.threshold ?? 45}/100</span>
              </div>
              <Slider
                value={[popperConfig?.threshold ?? 45]}
                onValueChange={([value]) => updateThreshold.mutate(value)}
                min={0}
                max={100}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
                <span>Publish everything</span>
                <span>Very strict</span>
              </div>
            </div>

            {/* Model info */}
            <div className="flex items-center gap-3 p-3 rounded-xl border border-border/40 bg-muted/20">
              <Cpu className="h-4 w-4 text-muted-foreground" />
              <div>
                <span className="text-xs font-semibold">Model:</span>
                <span className="text-xs text-muted-foreground ml-1">{popperConfig?.model || "claude-opus-4-6"}</span>
              </div>
            </div>

            {/* Dimensions */}
            <div>
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Evaluation Dimensions</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {popperConfig?.dimensions?.map(d => (
                  <Badge key={d} variant="outline" className="text-[10px]">
                    {DIMENSION_LABELS[d] || d}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Score Distribution ──────────────────────── */}
      <Card className="rounded-xl">
        <CardContent className="p-5">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Score Distribution</h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            {[
              { label: "Excellent (80+)", count: scoreDistribution.excellent, icon: ShieldCheck, color: "text-emerald-500" },
              { label: "Good (60-79)", count: scoreDistribution.good, icon: Shield, color: "text-amber-500" },
              { label: "Adequate (45-59)", count: scoreDistribution.adequate, icon: ShieldAlert, color: "text-orange-500" },
              { label: "Below (<45)", count: scoreDistribution.below, icon: ShieldX, color: "text-red-500" },
            ].map(s => (
              <div key={s.label} className="text-center p-3 rounded-xl border border-border/40 bg-card/60">
                <s.icon className={`h-5 w-5 mx-auto mb-1 ${s.color}`} />
                <div className="text-xl font-bold">{s.count}</div>
                <div className="text-[10px] text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="text-center p-3 rounded-xl border border-border/40 bg-muted/20">
            <span className="text-xs text-muted-foreground">Average Score: </span>
            <span className="text-sm font-bold">{avgScore > 0 ? `${avgScore}/100` : "No reviews yet"}</span>
            <span className="text-xs text-muted-foreground ml-2">({reviews.length} reviews)</span>
          </div>
        </CardContent>
      </Card>

      {/* ── Recent Validations ─────────────────────── */}
      <Card className="rounded-xl">
        <CardContent className="p-5">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Recent Validations</h3>

          {reviews.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">No peer reviews yet. Popper will validate papers automatically.</p>
          )}

          <div className="space-y-2">
            {reviews.slice(0, 20).map(r => (
              <div key={r.id} className="flex items-center justify-between p-3 rounded-xl border border-border/40 bg-card/60">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground truncate">{r.summary?.slice(0, 80) || "—"}...</p>
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <Badge variant="outline" className={`text-[10px] ${r.overallScore >= 45 ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-red-500/10 text-red-600 border-red-500/20"}`}>
                    {r.overallScore}/100
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">{r.recommendation}</Badge>
                  <span className="text-[10px] text-muted-foreground">{new Date(r.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
