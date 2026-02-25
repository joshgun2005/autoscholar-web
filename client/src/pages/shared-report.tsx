import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Sparkles, Loader2, ArrowLeft } from "lucide-react";
import { StreamingAnswer } from "@/components/streaming-answer";
import { ToolResults } from "@/components/tool-results";
import { ResultCard } from "@/components/result-card";
import { ThemeToggle } from "@/components/theme-toggle";
import { ThemeColorPicker } from "@/components/theme-color-picker";
import { Button } from "@/components/ui/button";
import { DownloadButtons } from "@/components/download-buttons";
import { CustomPythonFigure } from "@/components/custom-python-figure";
import type { SearchResult } from "@shared/schema";
import { useRef, useMemo } from "react";

interface SharedReportData {
  question: string;
  answer: string;
  toolResults: any[];
  sources: SearchResult[];
  customPythonFigures?: Array<{ id: string; figures: string[]; output?: string; description?: string }>;
  createdAt: string;
}

export default function SharedReport() {
  const [, params] = useRoute("/share/:shareId");
  const [, setLocation] = useLocation();
  const shareId = params?.shareId;
  const contentRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, error } = useQuery<SharedReportData>({
    queryKey: ["/api/share", shareId],
    enabled: !!shareId,
  });

  // Build figure registry for inline references
  const figureRegistry = useMemo(() => {
    const registry = new Map<string, string>();
    if (data?.customPythonFigures) {
      data.customPythonFigures.forEach(batch => {
        batch.figures.forEach((fig, idx) => {
          const figId = `${batch.id}-${idx}`;
          registry.set(figId, fig);
        });
      });
    }
    return registry;
  }, [data?.customPythonFigures]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Chargement du rapport...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Rapport introuvable</h2>
          <p className="text-muted-foreground">Ce lien de partage n'existe pas ou a expiré</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden" data-testid="page-shared-report">
      {/* Animated Background */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-40 w-96 h-96 bg-gradient-to-br from-emerald-500/15 to-teal-500/15 rounded-full blur-3xl animate-float" />
        <div className="absolute top-1/4 right-0 w-80 h-80 bg-gradient-to-br from-primary/15 to-blue-500/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-gradient-to-br from-teal-500/15 to-cyan-500/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/20 backdrop-blur-xl bg-background/80 shadow-lg shadow-emerald-500/5" data-testid="header-main">
        <div className="container flex h-20 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/')}
              className="rounded-2xl hover:bg-gradient-to-br hover:from-emerald-500/20 hover:to-teal-500/20 hover:scale-105 transition-all duration-300 gap-2"
              data-testid="button-back-to-home"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline font-medium">Retour</span>
            </Button>
            <div className="group cursor-pointer" data-testid="logo-container" onClick={() => setLocation('/')}>
              <div className="relative flex items-center gap-3 px-3 md:px-4 py-2.5 rounded-2xl bg-gradient-to-br from-primary/20 via-blue-500/20 to-purple-500/20 backdrop-blur-md border-2 border-primary/40 shadow-lg shadow-primary/20 group-hover:scale-105 group-hover:border-primary/60 transition-all duration-300">
                {/* Logo Icon */}
                <div className="relative">
                  <Sparkles className="w-7 h-7 text-primary animate-pulse-glow drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" data-testid="logo-icon" />
                  <div className="absolute inset-0 blur-xl bg-primary/60 -z-10" />
                </div>
                {/* Logo Text - Hidden on mobile, visible on desktop */}
                <div className="hidden md:flex flex-col">
                  <span className="text-lg font-bold bg-gradient-to-r from-primary via-blue-500 to-purple-500 bg-clip-text text-transparent leading-tight">
                    VibeQuant
                  </span>
                  <span className="text-[10px] text-muted-foreground/80 leading-none -mt-0.5">
                    AI Financial
                  </span>
                </div>
                <div className="absolute inset-0 blur-2xl bg-gradient-to-br from-primary/30 via-blue-500/30 to-purple-500/30 -z-10 rounded-2xl opacity-50 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-8 w-px bg-border/50" />
            <ThemeColorPicker />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12 md:py-20 relative z-10" data-testid="main-content">
        <div className="max-w-7xl mx-auto">
          {/* Branding */}
          <div className="mb-12 p-8 rounded-3xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-background/50 to-teal-500/10 backdrop-blur-sm shadow-2xl shadow-emerald-500/10" data-testid="branding-section">
            <div className="flex items-center gap-4">
              <div className="relative p-3 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30">
                <Sparkles className="w-8 h-8 text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rapport généré par</p>
                <p className="text-2xl font-black bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 bg-clip-text text-transparent tracking-tight">
                  VibeQuant AI
                </p>
              </div>
            </div>
            <p className="text-base text-muted-foreground mt-4 font-medium">
              {new Date(data.createdAt).toLocaleDateString('fr-FR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>

          {/* Question */}
          <div className="mb-6 p-4 rounded-lg bg-muted/50" data-testid="question-section">
            <p className="text-sm text-muted-foreground mb-1">Question</p>
            <p className="text-lg font-medium" data-testid="text-question">{data.question}</p>
          </div>

          {/* Download Buttons */}
          <div className="flex gap-3 justify-center my-6">
            <DownloadButtons
              question={data.question}
              answer={data.answer}
              contentRef={contentRef}
            />
          </div>

          {/* Content */}
          <div className="space-y-6" data-testid="content-section" ref={contentRef}>
            <StreamingAnswer
              content={data.answer}
              sources={data.sources}
              isStreaming={false}
              searchQueries={[]}
              statusMessage=""
              currentSearchIndex={0}
              figureRegistry={figureRegistry}
            />

            <ToolResults toolResults={data.toolResults} />

            {data.customPythonFigures && data.customPythonFigures.length > 0 && (
              <div className="max-w-5xl mx-auto mb-8">
                <CustomPythonFigure figureBatches={data.customPythonFigures} />
              </div>
            )}

            {data.sources.length > 0 && (
              <div className="max-w-5xl mx-auto" data-testid="web-results-section">
                <h2 className="text-2xl font-semibold mb-6" data-testid="text-web-results-heading">
                  Web Results
                </h2>
                <div className="grid gap-4" data-testid="results-grid">
                  {data.sources.map((result: SearchResult, index: number) => (
                    <ResultCard key={index} result={result} index={index} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
