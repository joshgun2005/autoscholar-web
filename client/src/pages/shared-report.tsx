import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Sparkles, Loader2, ArrowLeft } from "lucide-react";
import { StreamingAnswer } from "@/components/streaming-answer";
import { ToolResults } from "@/components/chat/tool-results";
import { ResultCard } from "@/components/chat/result-card";
import { ThemeToggle } from "@/components/theme-toggle";
import { ThemeColorPicker } from "@/components/theme-color-picker";
import { Button } from "@/components/ui/button";
import { DownloadButtons } from "@/components/chat/download-buttons";
import { CustomPythonFigure } from "@/components/chat/custom-python-figure";
import type { SearchResult } from "@shared/types";
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

  // Extract flat list of figure data URIs for markdown image resolution
  // Figures are stored as base64 in the DB — convert to data URIs so they
  // survive redeployments (file-based /figures/ URLs are ephemeral on disk).
  const figureUrls = useMemo(() => {
    if (!data?.customPythonFigures) return [];
    return data.customPythonFigures.flatMap(batch =>
      batch.figures.map(fig =>
        fig.startsWith('/') || fig.startsWith('http') || fig.startsWith('data:')
          ? fig
          : `data:image/png;base64,${fig}`
      )
    );
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
      {/* Subtle Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.03),transparent_70%)]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-sm" data-testid="header-main">
        <div className="container flex h-14 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/')}
              className="hover:bg-muted transition-colors gap-2"
              data-testid="button-back-to-home"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline font-medium">Retour</span>
            </Button>
            <div className="cursor-pointer" data-testid="logo-container" onClick={() => setLocation('/')}>
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-primary" data-testid="logo-icon" />
                <div className="hidden md:flex items-baseline gap-1.5">
                  <span className="text-base font-bold text-foreground leading-tight">
                    VibeQuant
                  </span>
                  <span className="text-[10px] text-muted-foreground leading-none">
                    AI Financial
                  </span>
                </div>
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
          <div className="mb-10 p-6 rounded-xl border border-border bg-card" data-testid="branding-section">
            <div className="flex items-center gap-4">
              <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Rapport généré par</p>
                <p className="text-xl font-bold text-foreground tracking-tight">
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
              figureUrls={figureUrls}
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
              figureUrls={figureUrls}
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
