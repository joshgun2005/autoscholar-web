import { useState, useEffect, useRef, useMemo, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Check, Search, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { SearchResult } from "@shared/types";

// Stable reference — avoids re-creating the array on every render
const remarkPlugins = [remarkGfm];

/** Safely extract hostname from a URL — returns the raw string on failure */
function safeHostname(url: string): string {
  try { return new URL(url).hostname; } catch { return url; }
}

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
  const isUserNearBottomRef = useRef(true);

  // Track whether the user is near the bottom of the page
  // so we only auto-scroll when they haven't scrolled up
  useEffect(() => {
    const mainEl = document.querySelector('main');
    if (!mainEl) return;

    const handleScroll = () => {
      const threshold = 150;
      const distanceFromBottom = mainEl.scrollHeight - mainEl.scrollTop - mainEl.clientHeight;
      isUserNearBottomRef.current = distanceFromBottom < threshold;
    };

    mainEl.addEventListener('scroll', handleScroll, { passive: true });
    return () => mainEl.removeEventListener('scroll', handleScroll);
  }, []);

  // Build an ordered list of resolved figure sources (data URIs or URLs)
  const resolvedFigures = useMemo(() => {
    const sources: string[] = [];

    if (figureUrls.length > 0) {
      sources.push(...figureUrls);
    }
    else if (figureRegistry.size > 0) {
      figureRegistry.forEach((value) => {
        if (!value || typeof value !== 'string') return;
        if (value.startsWith('data:') || value.startsWith('/') || value.startsWith('http')) {
          sources.push(value);
        } else {
          sources.push(`data:image/png;base64,${value}`);
        }
      });
    }

    return sources;
  }, [figureRegistry, figureUrls]);

  // Strip leaked XML function call blocks that sometimes appear in streaming
  // (Claude attempting tool calls in text instead of structured tool_use)
  const cleanedContent = useMemo(() => {
    return content
      // ── Strip leaked XML function calls ──
      .replace(/<function_calls>[\s\S]*?<\/function_calls>/g, '')
      .replace(/<function_calls>[\s\S]*$/g, '')
      .replace(/<function_invoke[\s\S]*?<\/function_invoke>/g, '')
      .replace(/<function_invoke[\s\S]*$/g, '')
      .replace(/<\/?function_calls>/g, '')
      .replace(/<\/?function_invoke[^>]*>/g, '')
      .replace(/<\/?parameter[^>]*>/g, '')
      // ── Strip ALL raw HTML tags (Claude sometimes outputs HTML instead of markdown) ──
      // Remove complete HTML blocks: <div>...</div>, <details>...</details>, <summary>...</summary>
      .replace(/<div[\s\S]*?<\/div>/gi, '')
      .replace(/<details[\s\S]*?<\/details>/gi, '')
      .replace(/<summary[\s\S]*?<\/summary>/gi, '')
      .replace(/<table[\s\S]*?<\/table>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      // Remove any remaining HTML tags (opening, closing, self-closing)
      .replace(/<\/?(div|span|details|summary|table|thead|tbody|tr|td|th|center|p|strong|em|br|hr|img|a|ul|ol|li|h[1-6]|pre|code|blockquote|section|article|nav|header|footer|main|aside|figure|figcaption|caption|sup|sub|small|big|mark|del|ins|abbr|cite|dfn|kbd|samp|var|ruby|rt|rp|bdi|bdo|wbr|col|colgroup|datalist|fieldset|legend|meter|optgroup|option|output|progress|select|textarea|button|form|input|label|script|noscript|template|slot|canvas|svg|path|circle|rect|line|polyline|polygon|text|tspan|defs|g|use|symbol|desc|title|metadata|foreignObject|switch|animate|set|animateMotion|animateTransform|image|clipPath|mask|pattern|filter|linearGradient|radialGradient|stop|feTurbulence|feDisplacementMap|feBlend|feColorMatrix|feComponentTransfer|feComposite|feConvolveMatrix|feDiffuseLighting|feFlood|feGaussianBlur|feImage|feMerge|feMergeNode|feMorphology|feOffset|feSpecularLighting|feTile|embed|object|param|source|track|video|audio|picture|map|area|base|link|meta|time|data|address|dialog|iframe)(\s[^>]*)?\s*\/?>/gi, '')
      // ── Clean up whitespace artifacts ──
      .replace(/<br\s*\/?\s*>/gi, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\n[ \t]+\n/g, '\n\n')
      .replace(/ {2,}\n/g, '\n')
      .trim();
  }, [content]);

  // Replace ALL markdown image references with resolved figure sources
  const processedContent = useMemo(() => {
    if (resolvedFigures.length === 0) return cleanedContent;

    let processed = cleanedContent;
    const allImagePattern = /!\[([^\]]*)\]\(([^)]+)\)/gi;
    let counter = 0;

    processed = processed.replace(allImagePattern, (match, alt, url) => {
      if (url.startsWith('http') || url.startsWith('data:')) {
        return match;
      }

      if (counter < resolvedFigures.length) {
        const resolved = resolvedFigures[counter];
        counter++;
        return `![${alt}](${resolved})`;
      }
      return match;
    });

    return processed;
  }, [cleanedContent, resolvedFigures]);

  const displayedContent = processedContent;

  // Memoize the ReactMarkdown custom components to avoid re-creating on every render
  const markdownComponents = useMemo(() => ({
    h1: ({ children }: any) => <h1 className="text-2xl font-display font-bold text-foreground mb-5 tracking-[-0.03em]">{children}</h1>,
    h2: ({ children }: any) => <h2 className="text-xl font-display font-semibold text-foreground mt-10 mb-4 tracking-[-0.02em]">{children}</h2>,
    h3: ({ children }: any) => <h3 className="text-base font-semibold text-foreground mt-7 mb-3 tracking-[-0.01em]">{children}</h3>,
    p: ({ children }: any) => <p className="text-foreground/85 leading-[1.8] mb-5 text-[14.5px]">{children}</p>,
    ul: ({ children }: any) => <ul className="text-foreground/85 list-disc list-inside space-y-2.5 mb-5 text-[14.5px]">{children}</ul>,
    ol: ({ children }: any) => <ol className="text-foreground/85 list-decimal list-inside space-y-2.5 mb-5 text-[14.5px]">{children}</ol>,
    li: ({ children }: any) => <li className="text-foreground/85 leading-[1.7]">{children}</li>,
    a: ({ href, children }: any) => {
      if (href?.startsWith('fig://')) {
        return <>{children}</>;
      }
      if (href?.includes('/api/download/')) {
        const handleDownload = async (e: React.MouseEvent) => {
          e.preventDefault();
          try {
            const response = await fetch(href);
            if (!response.ok) throw new Error(`Download failed: ${response.status}`);
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const rawName = href.split('/').pop() || 'download';
            a.download = decodeURIComponent(rawName).replace(/^\d+_/, '');
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          } catch (err) {
            console.error('Download error:', err);
            window.open(href, '_blank');
          }
        };
        return (
          <a href={href} onClick={handleDownload} className="text-primary hover:underline font-medium decoration-primary/30 underline-offset-2 cursor-pointer">
            {children}
          </a>
        );
      }
      return (
        <a href={href} className="text-primary hover:underline font-medium decoration-primary/30 underline-offset-2" target="_blank" rel="noopener noreferrer">
          {children}
        </a>
      );
    },
    strong: ({ children }: any) => <strong className="font-bold text-foreground">{children}</strong>,
    code: ({ children }: any) => (
      <code className="bg-muted/50 px-1.5 py-0.5 rounded-md text-[13px] font-mono text-foreground/75 border border-border/25">
        {children}
      </code>
    ),
    pre: ({ children }: any) => (
      <pre className="bg-[hsl(var(--muted)/0.35)] p-6 rounded-xl overflow-x-auto mb-6 border border-border/20">
        {children}
      </pre>
    ),
    blockquote: ({ children }: any) => (
      <blockquote className="border-l-2 border-primary/25 pl-6 italic text-muted-foreground my-6 bg-primary/[0.02] py-4 pr-5 rounded-r-xl">
        {children}
      </blockquote>
    ),
    img: ({ src, alt }: any) => {
      let imgSrc = src || '';

      if (imgSrc.startsWith('fig://')) {
        const figureId = imgSrc.replace('fig://', '');
        const val = figureRegistry.get(figureId);
        if (val && typeof val === 'string') {
          imgSrc = val.startsWith('/') || val.startsWith('http') || val.startsWith('data:')
            ? val
            : `data:image/png;base64,${val}`;
        }
      }

      if (!imgSrc || imgSrc.startsWith('fig://') || (imgSrc.startsWith('/') && resolvedFigures.length > 0)) {
        const figMatch = (alt || '').match(/(\d+)/);
        if (figMatch) {
          const idx = parseInt(figMatch[1], 10) - 1;
          if (idx >= 0 && idx < resolvedFigures.length) {
            imgSrc = resolvedFigures[idx];
          }
        }
      }

      if ((!imgSrc || imgSrc.startsWith('fig://')) && resolvedFigures.length > 0) {
        imgSrc = resolvedFigures[0];
      }

      if (imgSrc && !imgSrc.startsWith('fig://')) {
        return (
          <div className="my-6 rounded-xl overflow-hidden border border-border shadow-md">
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
                if (retryCount < resolvedFigures.length) {
                  const candidate = resolvedFigures[retryCount];
                  if (candidate === img.src || candidate === imgSrc) {
                    img.dataset.retryCount = String(retryCount + 1);
                    if (retryCount + 1 < resolvedFigures.length) {
                      img.src = resolvedFigures[retryCount + 1];
                      img.dataset.retryCount = String(retryCount + 2);
                      return;
                    }
                  } else {
                    img.dataset.retryCount = String(retryCount + 1);
                    img.src = candidate;
                    return;
                  }
                }
                img.style.display = 'none';
                const fallback = img.parentElement?.querySelector('.figure-fallback');
                if (fallback) (fallback as HTMLElement).style.display = 'flex';
              }}
            />
            <div className="figure-fallback items-center justify-center p-8 bg-muted/30" style={{ display: 'none' }}>
              <p className="text-sm text-muted-foreground">Figure non disponible</p>
            </div>
            {alt && (
              <div className="p-3 bg-muted/30 border-t border-border/50">
                <p className="text-xs text-center font-medium text-muted-foreground">{alt}</p>
              </div>
            )}
          </div>
        );
      }

      return null;
    },
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [figureRegistry, resolvedFigures]);

  // Auto-scroll only when user is near the bottom (don't fight their scroll)
  useEffect(() => {
    if (isStreaming && streamingCursorRef.current && isUserNearBottomRef.current) {
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
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-5xl mx-auto space-y-6"
      data-testid="streaming-answer"
    >
      {/* Search Queries Section */}
      {searchQueries.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="bg-card border border-border/50 rounded-2xl p-6 shadow-xs"
          data-testid="search-queries-section"
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-xl bg-primary/6">
              <Search className="w-4 h-4 text-primary/70" />
            </div>
            <h3 className="text-[14px] font-semibold tracking-[-0.01em]">Optimized Research Queries</h3>
          </div>
          <div className="space-y-2">
            {searchQueries.map((searchQuery, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-start gap-3.5 p-4 bg-muted/25 rounded-xl border border-border/25 transition-colors hover:bg-muted/40"
                data-testid={`search-query-${index}`}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {searchQuery.results ? (
                    <div className="w-5 h-5 rounded-full bg-emerald-500/15 flex items-center justify-center">
                      <Check className="w-3 h-3 text-emerald-500" />
                    </div>
                  ) : currentSearchIndex === index + 1 ? (
                    <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center">
                      <Loader2 className="w-3 h-3 text-primary animate-spin" />
                    </div>
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-muted-foreground/15 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-muted-foreground/80">{index + 1}</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {searchQuery.query}
                  </p>
                  {searchQuery.results && searchQuery.results.length > 0 && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {searchQuery.results.slice(0, 3).map((result, resultIndex) => (
                        <a
                          key={resultIndex}
                          href={result.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-background/60 hover:bg-background border border-border/40"
                          data-testid={`search-result-link-${index}-${resultIndex}`}
                        >
                          <ExternalLink className="w-2.5 h-2.5" />
                          {safeHostname(result.url)}
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
              className="mt-4 text-xs font-medium text-muted-foreground flex items-center gap-2"
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
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="bg-card border border-border/50 rounded-2xl p-7 md:p-10 shadow-xs">
          <div className="prose prose-lg max-w-none dark:prose-invert">
            <ReactMarkdown
              remarkPlugins={remarkPlugins}
              components={markdownComponents}
            >
              {displayedContent}
            </ReactMarkdown>
            {isStreaming && (
              <motion.span
                ref={streamingCursorRef}
                animate={{ opacity: [1, 0.2, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                className="inline-block w-0.5 h-5 bg-primary rounded-full ml-0.5"
              />
            )}
          </div>

          {sources.length > 0 && (
            <div className="mt-10 pt-7 border-t border-border/40">
              <h3 className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-[0.15em] mb-5">Sources</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <AnimatePresence>
                  {sources.map((source, index) => (
                    <motion.a
                      key={source.url}
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.06 }}
                      className="group flex items-start gap-3.5 p-4 rounded-2xl border border-border/40 hover:border-primary/25 transition-all duration-200 hover:bg-muted/25 hover:shadow-sm hover:-translate-y-0.5"
                      data-testid={`link-source-${index}`}
                    >
                      <div className="flex-shrink-0 mt-0.5">
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
                          <div className="w-5 h-5 rounded bg-primary/15 flex items-center justify-center">
                            <span className="text-[8px] font-bold text-primary">
                              {safeHostname(source.url)[0]?.toUpperCase() || '?'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-medium text-foreground truncate">
                            {source.title}
                          </span>
                          <ExternalLink className="w-3 h-3 text-muted-foreground flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <p className="text-[11px] text-muted-foreground font-mono truncate">
                          {safeHostname(source.url)}
                        </p>
                      </div>
                      <Badge variant="secondary" className="flex-shrink-0 text-[10px] no-default-hover-elevate no-default-active-elevate">
                        <Check className="w-2.5 h-2.5 mr-1" />
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
