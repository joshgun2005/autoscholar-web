import { ExternalLink } from "lucide-react";
import type { SearchResult } from "@shared/types";

function safeHostname(url: string): string {
  try { return new URL(url).hostname; } catch { return url; }
}

interface ResultCardProps {
  result: SearchResult;
  index: number;
}

export function ResultCard({ result, index }: ResultCardProps) {
  return (
    <a
      href={result.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block bg-card/80 border border-border/40 rounded-2xl p-5 hover:border-border/70 hover:shadow-sm transition-all duration-250 hover:-translate-y-0.5"
      data-testid={`link-result-${index}`}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 mt-1">
          {result.favicon ? (
            <img
              src={result.favicon}
              alt=""
              className="w-6 h-6 rounded-lg"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="text-[10px] font-bold text-primary">
                {safeHostname(result.url)[0]?.toUpperCase() || '?'}
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h3 className="text-[14px] font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors tracking-[-0.01em] leading-snug" data-testid={`text-result-title-${index}`}>
              {result.title}
            </h3>
            <ExternalLink className="w-4 h-4 text-muted-foreground/30 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" data-testid={`icon-external-link-${index}`} />
          </div>

          <p className="text-[11px] text-muted-foreground/40 font-mono mb-2 truncate" data-testid={`text-result-domain-${index}`}>
            {safeHostname(result.url)}
          </p>

          <p className="text-[13px] text-muted-foreground/65 line-clamp-2 leading-[1.6]" data-testid={`text-result-snippet-${index}`}>
            {result.snippet}
          </p>
        </div>
      </div>
    </a>
  );
}
