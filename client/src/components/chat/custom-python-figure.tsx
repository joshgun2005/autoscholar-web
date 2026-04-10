import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FigureBatch {
  id: string;
  figures: string[]; // URLs (/figures/xxx.png) or base64 encoded images
  output?: string; // Text output from Python
  description?: string;
}

function figureSrc(figure: string): string {
  // If it starts with / or http, it's a URL — use directly
  if (figure.startsWith('/') || figure.startsWith('http')) return figure;
  // Otherwise treat as base64
  return `data:image/png;base64,${figure}`;
}

interface CustomPythonFigureGalleryProps {
  figureBatches: FigureBatch[]; // Array of figure batches
}

export function CustomPythonFigure({ figureBatches }: CustomPythonFigureGalleryProps) {
  // Initialize with all batches expanded
  const [expandedBatches, setExpandedBatches] = useState<Set<string>>(
    new Set(figureBatches.map(b => b.id))
  );

  // When new batches are added, expand them automatically
  useEffect(() => {
    const allIds = new Set(figureBatches.map(b => b.id));
    setExpandedBatches(allIds);
  }, [figureBatches.length]); // Update when number of batches changes

  if (!figureBatches || figureBatches.length === 0) {
    return null;
  }

  const totalFigures = figureBatches.reduce((sum, batch) => sum + batch.figures.length, 0);

  const toggleBatch = (batchId: string) => {
    setExpandedBatches(prev => {
      const newSet = new Set(prev);
      if (newSet.has(batchId)) {
        newSet.delete(batchId);
      } else {
        newSet.add(batchId);
      }
      return newSet;
    });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="text-2xl">🐍</span>
          Galerie d'Analyses Python
          <Badge variant="secondary" className="ml-auto">
            {totalFigures} figure{totalFigures > 1 ? 's' : ''}
          </Badge>
        </CardTitle>
        <CardDescription>
          {figureBatches.length} analyse{figureBatches.length > 1 ? 's' : ''} Python générée{figureBatches.length > 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {figureBatches.map((batch, batchIndex) => {
          const isExpanded = expandedBatches.has(batch.id);
          const batchNumber = batchIndex + 1;

          return (
            <div key={batch.id} className="border rounded-lg overflow-hidden">
              {/* Batch Header - Collapsible */}
              <div
                className="flex items-center justify-between p-4 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleBatch(batch.id)}
              >
                <div className="flex items-center gap-3">
                  <Badge variant="outline">#{batchNumber}</Badge>
                  <div>
                    <div className="font-semibold text-sm">
                      {batch.description || `Analyse Python #${batchNumber}`}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {batch.figures.length} figure{batch.figures.length > 1 ? 's' : ''}
                      {batch.output && ` • ${batch.output.split('\n').length} lignes de résultats`}
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </div>

              {/* Batch Content - Expandable */}
              {isExpanded && (
                <div className="p-4 space-y-4">
                  {/* Text output if available */}
                  {batch.output && batch.output.trim() && (
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2 text-sm">📊 Résultats</h4>
                      <pre className="text-sm font-mono whitespace-pre-wrap overflow-x-auto">
                        {batch.output}
                      </pre>
                    </div>
                  )}

                  {/* Figures Grid */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm">
                        📈 Graphique{batch.figures.length > 1 ? 's' : ''}
                      </h4>
                      {batch.figures.length > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Download all figures as zip would be nice, but for now just show button
                          }}
                          className="text-xs"
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Tout télécharger
                        </Button>
                      )}
                    </div>

                    <div className={`grid gap-4 ${batch.figures.length > 1 ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
                      {batch.figures.map((figure, figIndex) => {
                        const figureId = `${batch.id}-${figIndex}`;

                        return (
                          <div key={figIndex} className="border rounded-lg overflow-hidden bg-card group relative">
                            {/* Figure ID badge for reference */}
                            <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Badge variant="secondary" className="text-xs font-mono">
                                {figureId}
                              </Badge>
                            </div>

                            <img
                              src={figureSrc(figure)}
                              alt={`Figure ${batchNumber}.${figIndex + 1}`}
                              className="w-full h-auto cursor-pointer"
                              style={{ maxHeight: '600px', objectFit: 'contain' }}
                              onError={(e) => {
                                const img = e.currentTarget;
                                if (!img.dataset.retried) {
                                  img.dataset.retried = 'true';
                                  // Retry with cache-busted URL
                                  const src = figureSrc(figure);
                                  img.src = src.includes('?') ? `${src}&t=${Date.now()}` : `${src}?t=${Date.now()}`;
                                } else {
                                  img.style.display = 'none';
                                  const fallback = img.parentElement?.querySelector('.figure-fallback');
                                  if (fallback) (fallback as HTMLElement).style.display = 'flex';
                                }
                              }}
                              onClick={() => {
                                const win = window.open();
                                if (win) {
                                  win.document.write(`<img src="${figureSrc(figure)}" style="max-width: 100%; height: auto;" />`);
                                  win.document.title = `Figure ${batchNumber}.${figIndex + 1}`;
                                }
                              }}
                            />
                            <div className="figure-fallback items-center justify-center p-8 bg-muted/30" style={{ display: 'none' }}>
                              <p className="text-sm text-muted-foreground">Figure non disponible</p>
                            </div>

                            {/* Figure info footer */}
                            <div className="p-2 bg-muted/30 border-t flex items-center justify-between">
                              <div className="text-xs text-muted-foreground">
                                Figure {batchNumber}.{figIndex + 1}
                              </div>
                              <a
                                href={figureSrc(figure)}
                                download={`autoscholar-figure-${figureId}.png`}
                                className="text-xs text-primary hover:underline flex items-center gap-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Download className="w-3 h-3" />
                                Télécharger
                              </a>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
