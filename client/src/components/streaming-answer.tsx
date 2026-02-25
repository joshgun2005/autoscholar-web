import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Check, Search, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { SearchResult } from "@shared/types";

interface SearchQuery {
  query: string;
  results?: SearchResult[];
}

interface StreamingAnswerProps {
  content: string;
  sources?: SearchResult[];
  isStreaming?: boolean;
  searchQueries?: SearchQuery[];
  statusMessage?: string;
  currentSearchIndex?: number;
  figureRegistry?: Map<string, string>; // Map of figure IDs to base64 images
  figureUrls?: string[]; // Actual URLs of generated figures
}

export function StreamingAnswer({
  content,
  sources = [],
  isStreaming = false,
  searchQueries = [],
  statusMessage = "",
  currentSearchIndex = 0,
  figureRegistry = new Map(),
  figureUrls = []
}: StreamingAnswerProps) {
  const streamingCursorRef = useRef<HTMLSpanElement>(null);

  // Process content to replace figure references with actual URLs or base64 images
  // This handles cases where Claude generates different IDs than the server
  const processedContent = useMemo(() => {
    let processed = content;

    if (figureUrls.length > 0) {
      // Build a Set of known valid figure/plot URLs for fast lookup
      const knownUrls = new Set(figureUrls);

      // Single pass: fix ALL image references with unknown/hallucinated URLs
      // This catches any ![alt](url) pattern — no matter what alt text Claude uses
      const allImagePattern = /!\[([^\]]*)\]\(([^)]+)\)/gi;
      let sequentialCounter = 0;

      processed = processed.replace(allImagePattern, (match, alt, url) => {
        // External URLs, data URIs, fig:// — keep as-is
        if (url.startsWith('http') || url.startsWith('data:') || url.startsWith('fig://')) {
          return match;
        }

        // Already a known valid figure URL — keep it and advance counter
        if (knownUrls.has(url)) {
          sequentialCounter++;
          return match;
        }

        // Unknown URL (hallucinated by Claude) — replace with next available figure URL
        if (sequentialCounter < figureUrls.length) {
          const correctUrl = figureUrls[sequentialCounter];
          sequentialCounter++;
          return `![${alt}](${correctUrl})`;
        }
        return match;
      });
    }
    // Fallback to figureRegistry with fig:// protocol
    else if (figureRegistry.size > 0) {
      const figureEntries = Array.from(figureRegistry.entries());
      const figurePattern = /!\[(?:Figure|Graphique|Fig\.?)\s*(\d+)[^\]]*\]\([^)]+\)/gi;
      processed = processed.replace(figurePattern, (match, figNum) => {
        const idx = parseInt(figNum, 10) - 1;
        if (idx >= 0 && idx < figureEntries.length) {
          const [figId] = figureEntries[idx];
          return `![Figure ${figNum}](fig://${figId})`;
        }
        return match;
      });
    }

    return processed;
  }, [content, figureRegistry, figureUrls]);

  // Display content directly without artificial delay - streaming is already real-time from server
  const displayedContent = processedContent;

  // Auto-scroll to keep streaming cursor visible
  useEffect(() => {
    if (isStreaming && streamingCursorRef.current) {
      streamingCursorRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest'
      });
    }
  }, [content, isStreaming]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-5xl mx-auto space-y-6"
      data-testid="streaming-answer"
    >
      {/* Search Queries Section */}
      {searchQueries.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          className="card-premium rounded-3xl p-8"
          data-testid="search-queries-section"
        >
          <div className="flex items-center gap-2 mb-4">
            <Search className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Requêtes de recherche optimisées</h3>
          </div>
          <div className="space-y-3">
            {searchQueries.map((searchQuery, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3 p-5 glass rounded-2xl"
                data-testid={`search-query-${index}`}
              >
                <div className="flex-shrink-0">
                  {searchQuery.results ? (
                    <Check className="w-5 h-5 text-green-500 mt-0.5" />
                  ) : currentSearchIndex === index + 1 ? (
                    <Loader2 className="w-5 h-5 text-primary animate-spin mt-0.5" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center mt-0.5">
                      <span className="text-xs font-semibold">{index + 1}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {searchQuery.query}
                  </p>
                  {searchQuery.results && searchQuery.results.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {searchQuery.results.slice(0, 3).map((result, resultIndex) => (
                        <a
                          key={resultIndex}
                          href={result.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 px-3 py-1.5 rounded-full bg-background/50 hover:bg-background"
                          data-testid={`search-result-link-${index}-${resultIndex}`}
                        >
                          <ExternalLink className="w-3 h-3" />
                          {new URL(result.url).hostname}
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
          {statusMessage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 text-sm text-muted-foreground flex items-center gap-2"
              data-testid="status-message"
            >
              {statusMessage}
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Answer Section */}
      {displayedContent && (
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1], delay: 0.1 }}
          className="card-premium rounded-3xl p-10">
          <div className="prose prose-lg max-w-none dark:prose-invert">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => <h1 className="text-3xl font-bold text-foreground mb-4">{children}</h1>,
                h2: ({ children }) => <h2 className="text-2xl font-semibold text-foreground mt-6 mb-3">{children}</h2>,
                h3: ({ children }) => <h3 className="text-xl font-semibold text-foreground mt-4 mb-2">{children}</h3>,
                p: ({ children }) => <p className="text-foreground leading-relaxed mb-4">{children}</p>,
                ul: ({ children }) => <ul className="text-foreground list-disc list-inside space-y-2 mb-4">{children}</ul>,
                ol: ({ children }) => <ol className="text-foreground list-decimal list-inside space-y-2 mb-4">{children}</ol>,
                li: ({ children }) => <li className="text-foreground">{children}</li>,
                a: ({ href, children }) => {
                  // Don't create clickable links for fig:// references (they're for images only)
                  if (href?.startsWith('fig://')) {
                    return <>{children}</>;
                  }

                  return (
                    <a
                      href={href}
                      className="text-primary hover:underline font-medium"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {children}
                    </a>
                  );
                },
                strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
                code: ({ children }) => (
                  <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-foreground">
                    {children}
                  </code>
                ),
                pre: ({ children }) => (
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto mb-4">
                    {children}
                  </pre>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground my-4">
                    {children}
                  </blockquote>
                ),
                img: ({ src, alt }) => {
                  // Determine the actual image source
                  let imgSrc = src || '';

                  // Handle fig:// protocol — resolve from registry
                  if (imgSrc.startsWith('fig://')) {
                    const figureId = imgSrc.replace('fig://', '');
                    const registryValue = figureRegistry.get(figureId);
                    if (registryValue) {
                      // Registry may contain a URL or base64
                      imgSrc = registryValue.startsWith('/') || registryValue.startsWith('http')
                        ? registryValue
                        : `data:image/png;base64,${registryValue}`;
                    }
                  }

                  // Valid image source — render it
                  if (imgSrc && !imgSrc.startsWith('fig://')) {
                    return (
                      <div className="my-6 border-2 border-primary/20 rounded-xl overflow-hidden shadow-lg">
                        <img
                          key={imgSrc}
                          src={imgSrc}
                          alt={alt || 'Python generated figure'}
                          className="w-full h-auto cursor-default"
                          style={{ maxHeight: '600px', objectFit: 'contain' }}
                          loading="lazy"
                          onError={(e) => {
                            const img = e.currentTarget;
                            const retryCount = parseInt(img.dataset.retryCount || '0', 10);

                            if (retryCount >= figureUrls.length || figureUrls.length === 0) {
                              // Exhausted all figure URLs — show fallback
                              img.style.display = 'none';
                              const fallback = img.parentElement?.querySelector('.figure-fallback');
                              if (fallback) (fallback as HTMLElement).style.display = 'flex';
                              return;
                            }

                            // Try figure URLs one by one until one works
                            // First try: match by number in alt text
                            if (retryCount === 0) {
                              const figMatch = (alt || '').match(/(\d+)/);
                              if (figMatch && figureUrls.length > 0) {
                                const idx = parseInt(figMatch[1], 10) - 1;
                                if (idx >= 0 && idx < figureUrls.length) {
                                  img.dataset.retryCount = '1';
                                  img.src = figureUrls[idx];
                                  return;
                                }
                              }
                            }

                            // Sequential fallback: try the next figure URL
                            if (retryCount < figureUrls.length) {
                              img.dataset.retryCount = String(retryCount + 1);
                              img.src = figureUrls[retryCount];
                              return;
                            }

                            // Final fallback
                            img.style.display = 'none';
                            const fallback = img.parentElement?.querySelector('.figure-fallback');
                            if (fallback) (fallback as HTMLElement).style.display = 'flex';
                          }}
                        />
                        <div className="figure-fallback items-center justify-center p-8 bg-muted/30" style={{ display: 'none' }}>
                          <p className="text-sm text-muted-foreground">Figure non disponible</p>
                        </div>
                        {alt && (
                          <div className="p-3 bg-muted/50 border-t border-primary/10">
                            <p className="text-sm text-center font-medium">{alt}</p>
                          </div>
                        )}
                      </div>
                    );
                  }

                  // Unresolved figure — show placeholder
                  return (
                    <div className="my-4 p-4 border-2 border-dashed border-muted rounded-lg text-center">
                      <p className="text-sm text-muted-foreground">
                        Loading figure...
                      </p>
                    </div>
                  );
                },
              }}
            >
              {displayedContent}
            </ReactMarkdown>
            {isStreaming && (
              <motion.span
                ref={streamingCursorRef}
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="inline-block w-2 h-5 bg-primary ml-1"
              />
            )}
          </div>

          {sources.length > 0 && (
            <div className="mt-8 pt-6 border-t border-border">
              <h3 className="text-sm font-medium text-muted-foreground mb-4">Sources</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <AnimatePresence>
                  {sources.map((source, index) => (
                    <motion.a
                      key={source.url}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="group flex items-start gap-3 p-4 bg-muted/30 hover:bg-muted/50 rounded-lg border border-transparent hover:border-primary/30 transition-all hover-elevate"
                      data-testid={`link-source-${index}`}
                    >
                      <div className="flex-shrink-0 mt-1">
                        {source.favicon ? (
                          <img
                            src={source.favicon}
                            alt=""
                            className="w-5 h-5 rounded"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-5 h-5 rounded bg-primary/20 flex items-center justify-center">
                            <span className="text-xs font-mono text-primary">
                              {new URL(source.url).hostname[0].toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-foreground truncate">
                            {source.title}
                          </span>
                          <ExternalLink className="w-3 h-3 text-muted-foreground flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <p className="text-xs text-muted-foreground font-mono truncate">
                          {new URL(source.url).hostname}
                        </p>
                      </div>
                      <Badge variant="secondary" className="flex-shrink-0 no-default-hover-elevate no-default-active-elevate">
                        <Check className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    </motion.a>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
