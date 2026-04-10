import { useState, useCallback } from "react";
import { Terminal, Copy, Check } from "lucide-react";

export function CurlBlock({ command, label }: { command: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(command);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [command]);

  return (
    <div className="mb-8 flex items-center gap-2.5 px-4 py-3 rounded-lg bg-[hsl(224_30%_5%)] dark:bg-[hsl(224_30%_3%)] border border-border/20 font-mono text-[11px]">
      <Terminal className="h-3.5 w-3.5 shrink-0 text-emerald-500/50" />
      <span className="text-muted-foreground/40 mr-1">$</span>
      <code className="text-emerald-400/80 flex-1 truncate select-all">{command}</code>
      <button
        onClick={handleCopy}
        className="shrink-0 p-1 rounded hover:bg-white/10 transition-colors text-emerald-400/60 hover:text-emerald-400"
        title="Copy to clipboard"
      >
        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      </button>
      {label && <span className="metric-label text-muted-foreground/30 shrink-0">{label}</span>}
    </div>
  );
}
