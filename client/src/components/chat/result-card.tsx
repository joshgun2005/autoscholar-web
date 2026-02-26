import { ExternalLink } from "lucide-react";
import type { SearchResult } from "@shared/types";

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
      className="group block bg-card border border-border rounded-xl p-5 hover:border-primary/40 transition-colors"
      data-testid={`link-result-${index}`}
    >
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 mt-1">
          {result.favicon ? (
            <img
              src={result.favicon}
              alt=""
              className="w-6 h-6 rounded"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-mono font-semibold text-primary">
                {new URL(result.url).hostname[0].toUpperCase()}
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h3 className="text-lg font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors" data-testid={`text-result-title-${index}`}>
              {result.title}
            </h3>
            <ExternalLink className="w-4 h-4 text-muted-foreground flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" data-testid={`icon-external-link-${index}`} />
          </div>

          <p className="text-sm text-muted-foreground font-mono mb-2 truncate" data-testid={`text-result-domain-${index}`}>
            {new URL(result.url).hostname}
          </p>

          <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed" data-testid={`text-result-snippet-${index}`}>
            {result.snippet}
          </p>
        </div>
      </div>
    </a>
  );
}
