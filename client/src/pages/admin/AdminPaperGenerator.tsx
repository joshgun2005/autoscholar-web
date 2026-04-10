import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Rocket, AlertTriangle, CheckCircle, Loader2, BookOpen,
  Beaker, ChevronDown, ChevronUp, FileText, Sparkles, Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

const DOMAINS = [
  "Market microstructure & high-frequency trading",
  "Volatility & risk modeling",
  "Asset allocation & portfolio theory",
  "Machine learning applied to finance",
  "Macro-finance & interest rates",
  "Crypto-assets & decentralized finance",
  "ESG, sustainable finance & climate risk",
  "Market anomalies & factor investing",
  "Applied financial econometrics",
  "Systemic risk & contagion",
  "Behavioral finance & market sentiment",
  "Derivatives, options & structured products",
  "Credit, default & ratings",
  "Monetary policy & market transmission",
  "Banking microeconomics & regulation",
  "Commodity & energy markets",
  "Emerging & frontier markets",
  "Fintech, payments & financial innovation",
];

const RESEARCH_TYPES = [
  { value: "", label: "Auto-detect from prompt" },
  { value: "A", label: "Type A — Empirical", desc: "Data-driven, econometric estimation, causal inference" },
  { value: "B", label: "Type B — Theoretical", desc: "Model-based, mechanism-driven, proofs, simulations" },
  { value: "C", label: "Type C — Hybrid", desc: "Formal model + empirical validation with real data" },
  { value: "D", label: "Type D — Statistics", desc: "Hypothesis testing, distribution analysis, inference" },
  { value: "E", label: "Type E — Machine Learning", desc: "Prediction, feature engineering, model evaluation" },
  { value: "F", label: "Type F — AI / Deep Learning", desc: "Neural architecture, training, representation" },
];

const METHODS = [
  "GARCH / EGARCH / GJR-GARCH",
  "Structural VAR",
  "Factor models",
  "Dynamic copulas",
  "DCC-GARCH",
  "Regime-switching (Markov)",
  "Local projections",
  "Event study",
  "Dynamic panel (GMM)",
  "Machine learning (Random Forest, XGBoost)",
  "Neural networks (LSTM, Transformer)",
  "NLP & text analysis",
  "Stochastic volatility models",
  "Wavelet approach",
  "Bootstrap & robust inference",
  "Threshold models (STAR, TAR)",
  "Network analysis & graph theory",
  "Affine term structure models",
];

const EXAMPLE_PROMPTS = [
  {
    label: "Volatility spillovers post-COVID",
    prompt: "Investigate volatility spillover dynamics between US equity markets (S&P 500), crude oil (WTI), and cryptocurrency (Bitcoin) in the post-COVID period (2020-2025). Use a DCC-GARCH framework to estimate time-varying conditional correlations and identify structural breaks in cross-market contagion patterns. Compare pre- and post-pandemic regimes using Markov-switching models. Include analysis of the 2022 crypto crash and 2023 banking crisis as event studies.",
    domain: "Volatility & risk modeling",
    method: "DCC-GARCH",
  },
  {
    label: "ESG factor premium in emerging markets",
    prompt: "Examine whether ESG scores carry a risk premium in emerging equity markets (2015-2025). Construct long-short portfolios sorted on ESG ratings across 20+ emerging economies. Test if the ESG premium persists after controlling for Fama-French factors, momentum, and liquidity. Investigate whether the premium varies with institutional quality (World Bank governance indicators) and market development. Use panel regression with country and time fixed effects.",
    domain: "ESG, sustainable finance & climate risk",
    method: "Factor models",
  },
  {
    label: "FOMC communication & yield curve",
    prompt: "Analyze the impact of Federal Reserve communication on the US Treasury yield curve using NLP techniques on FOMC minutes and press conferences (2000-2025). Construct sentiment and hawkishness indices using both dictionary-based methods and transformer embeddings. Estimate the response of 2Y, 5Y, 10Y, and 30Y yields to communication shocks using local projections. Compare the information channel vs. the pure monetary policy channel.",
    domain: "Monetary policy & market transmission",
    method: "Local projections",
  },
];

interface SchedulerConfig {
  isGenerating: boolean;
  maxConcurrent: number;
  popperEnabled: boolean;
  popperThreshold: number;
}

export function AdminPaperGenerator() {
  const queryClient = useQueryClient();
  const [prompt, setPrompt] = useState("");
  const [domain, setDomain] = useState("");
  const [method, setMethod] = useState("");
  const [researchType, setResearchType] = useState("");
  const [showExamples, setShowExamples] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [lastResult, setLastResult] = useState<{ runId: string; sessionId: string } | null>(null);

  const { data: config } = useQuery<SchedulerConfig>({
    queryKey: ["/api/admin/scheduler/config"],
    queryFn: async () => {
      const r = await fetch("/api/admin/scheduler/config", { credentials: "include" });
      return r.json();
    },
    refetchInterval: 5000,
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/runs/trigger-custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          prompt: prompt.trim(),
          domain: domain || undefined,
          method: method || undefined,
          researchType: researchType || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to trigger run");
      }
      return res.json();
    },
    onSuccess: (data) => {
      setLastResult({ runId: data.runId, sessionId: data.sessionId });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/runs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/runs/stats"] });
    },
  });

  const charCount = prompt.trim().length;
  const isValid = charCount >= 50;
  const isTooLong = charCount > 10000;

  function applyExample(ex: typeof EXAMPLE_PROMPTS[0]) {
    setPrompt(ex.prompt);
    setDomain(ex.domain);
    setMethod(ex.method);
    setShowExamples(false);
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="border-primary/20 bg-primary/[0.02]">
        <CardContent className="p-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Rocket className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Paper Generator</h3>
              <p className="text-xs text-muted-foreground">
                Submit a research prompt to generate a rigorous, journal-quality paper through the full Euler pipeline
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Pipeline info */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Info className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Pipeline: 6 stages, ~30-60 min</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { label: "Gauss", desc: "Gap Discovery", color: "bg-violet-500/10 text-violet-600 border-violet-500/20" },
              { label: "Turing", desc: "Data Collection", color: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
              { label: "Newton", desc: "Dataset Prep", color: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20" },
              { label: "Fisher", desc: "Analysis", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
              { label: "Euler", desc: "Writing", color: "bg-rose-500/10 text-rose-600 border-rose-500/20" },
              { label: "Popper", desc: "Peer Review", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
            ].map((stage) => (
              <Badge key={stage.label} variant="outline" className={cn("text-[10px] gap-1", stage.color)}>
                {stage.label} <span className="opacity-60">{stage.desc}</span>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main form */}
      <Card>
        <CardContent className="p-4 space-y-4">
          {/* Prompt textarea */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Research Prompt</label>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1"
                  onClick={() => setShowExamples(!showExamples)}
                >
                  <Sparkles className="h-3 w-3" />
                  Examples
                  {showExamples ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </Button>
                <span className={cn(
                  "text-[10px] font-mono tabular-nums",
                  charCount < 50 ? "text-red-500" : charCount > 10000 ? "text-red-500" : "text-muted-foreground"
                )}>
                  {charCount}/10000
                </span>
              </div>
            </div>

            {/* Examples panel */}
            {showExamples && (
              <div className="space-y-2 p-3 rounded-lg bg-muted/50 border">
                {EXAMPLE_PROMPTS.map((ex) => (
                  <button
                    key={ex.label}
                    onClick={() => applyExample(ex)}
                    className="w-full text-left p-2.5 rounded-md border bg-background hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <FileText className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                      <span className="text-xs font-medium">{ex.label}</span>
                      <Badge variant="outline" className="text-[9px] ml-auto">{ex.domain.split(" ")[0]}</Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2">{ex.prompt}</p>
                  </button>
                ))}
              </div>
            )}

            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your research question in detail. Include: the specific topic, time period, markets/assets of interest, expected methodology, and key hypotheses to test. Be specific — the more detail you provide, the more rigorous the paper will be."
              className="min-h-[160px] text-sm font-mono resize-y"
            />

            {charCount > 0 && charCount < 50 && (
              <p className="text-[11px] text-red-500 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Prompt too short — provide at least 50 characters for a rigorous paper
              </p>
            )}
          </div>

          {/* Research Type selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-medium text-muted-foreground">Research Type</label>
            <div className="grid grid-cols-1 gap-1.5">
              {RESEARCH_TYPES.map((rt) => (
                <button
                  key={rt.value}
                  type="button"
                  onClick={() => setResearchType(rt.value)}
                  className={cn(
                    "w-full text-left px-3 py-2 rounded-md border text-xs transition-colors",
                    researchType === rt.value
                      ? "border-primary bg-primary/5 text-foreground"
                      : "border-border bg-background text-muted-foreground hover:bg-accent"
                  )}
                >
                  <span className="font-medium">{rt.label}</span>
                  {rt.desc && <span className="ml-1.5 opacity-60">— {rt.desc}</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Domain & Method selectors */}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1 -ml-2"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <Beaker className="h-3 w-3" />
            Domain & Method (optional)
            {showAdvanced ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>

          {showAdvanced && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-muted-foreground">Domain</label>
                <select
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="w-full h-9 rounded-md border bg-background px-3 text-xs"
                >
                  <option value="">Auto-detect from prompt</option>
                  {DOMAINS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-muted-foreground">Method</label>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  className="w-full h-9 rounded-md border bg-background px-3 text-xs"
                >
                  <option value="">Auto-detect from prompt</option>
                  {METHODS.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Submit */}
          <div className="flex items-center gap-3 pt-2 border-t">
            <Button
              onClick={() => submitMutation.mutate()}
              disabled={!isValid || isTooLong || submitMutation.isPending}
              className="gap-2 shadow-lg shadow-primary/20"
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Rocket className="h-4 w-4" />
                  Generate Paper
                </>
              )}
            </Button>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {config?.popperEnabled ? (
                <Badge variant="outline" className="text-[10px] gap-1 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                  <CheckCircle className="h-3 w-3" />
                  Popper Review ON (threshold: {config.popperThreshold}/100)
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] gap-1 bg-amber-500/10 text-amber-600 border-amber-500/20">
                  <AlertTriangle className="h-3 w-3" />
                  Popper Review OFF — auto-publish
                </Badge>
              )}
            </div>
          </div>

          {/* Error */}
          {submitMutation.isError && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
              <p className="text-xs text-red-600">
                {(submitMutation.error as Error).message}
              </p>
            </div>
          )}

          {/* Success */}
          {lastResult && submitMutation.isSuccess && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />
              <div className="text-xs text-emerald-700 dark:text-emerald-400">
                <p className="font-medium">Paper generation started!</p>
                <p className="text-emerald-600/70 dark:text-emerald-400/70 mt-0.5">
                  Run ID: <code className="font-mono">{lastResult.runId.slice(0, 8)}...</code>
                  {" "} — Track progress in the <strong>Runs</strong> tab
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Guidelines */}
      <Card className="border-dashed">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-xs font-semibold text-muted-foreground">Guidelines for rigorous prompts</h4>
          </div>
          <ul className="space-y-1.5 text-[11px] text-muted-foreground">
            <li>
              <strong className="text-foreground/80">Be specific:</strong> "Volatility spillovers between crypto and commodities post-2020 using DCC-GARCH" &gt; "Study crypto volatility"
            </li>
            <li>
              <strong className="text-foreground/80">Specify time period:</strong> Include start/end dates (e.g., "2015-2025") — the pipeline fetches real-time data from APIs
            </li>
            <li>
              <strong className="text-foreground/80">Name assets/markets:</strong> Mention specific tickers, indices, or country groups (e.g., "S&P 500, FTSE 100, Nikkei 225")
            </li>
            <li>
              <strong className="text-foreground/80">State hypotheses:</strong> "We expect volatility transmission to be asymmetric and regime-dependent"
            </li>
            <li>
              <strong className="text-foreground/80">Suggest methodology:</strong> If you have a preferred method, name it — otherwise Gauss will select based on the gap analysis
            </li>
            <li>
              <strong className="text-foreground/80">All data is real:</strong> The pipeline fetches from FMP, FRED, EODHD, World Bank, IMF, OECD, and web sources — no simulated data
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
