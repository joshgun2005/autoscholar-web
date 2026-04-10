import { useState } from "react";
import { Code2, Download, Copy, Check, ChevronDown, ChevronRight, Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import type { PythonCodeEntry } from "@/hooks/useChatSession";

interface CodeHistorySheetProps {
  entries: PythonCodeEntry[];
}

function StatusIcon({ status }: { status: PythonCodeEntry['status'] }) {
  switch (status) {
    case 'running':
      return <Clock className="h-3 w-3 text-amber-500 animate-pulse" />;
    case 'completed':
      return <CheckCircle2 className="h-3 w-3 text-emerald-500" />;
    case 'error':
      return <AlertCircle className="h-3 w-3 text-red-500" />;
  }
}

function CodeEntry({ entry, index }: { entry: PythonCodeEntry; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(entry.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([entry.code], { type: "text/x-python" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safeName = entry.description
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "")
      .substring(0, 40);
    a.download = `${safeName || "script"}_${index + 1}.py`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const timeStr = new Date(entry.timestamp).toLocaleTimeString("fr-CA", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const lineCount = (entry.code || "").split("\n").length;

  return (
    <div className="border border-border/50 rounded-xl overflow-hidden bg-card/50">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-muted/50 transition-colors"
      >
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
        )}
        <StatusIcon status={entry.status} />
        <span className="text-xs font-medium text-foreground truncate flex-1">
          {entry.description}
        </span>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-mono">
            {lineCount}L
          </Badge>
          <span className="text-[10px] text-muted-foreground tabular-nums">{timeStr}</span>
          {entry.duration != null && (
            <span className="text-[10px] text-muted-foreground tabular-nums">
              {(entry.duration / 1000).toFixed(1)}s
            </span>
          )}
        </div>
      </button>

      {entry.error && (
        <div className="px-3 py-1.5 bg-red-500/5 border-t border-red-500/10">
          <p className="text-[11px] text-red-500 font-mono line-clamp-2">{entry.error}</p>
        </div>
      )}

      {expanded && (
        <div className="border-t border-border/50">
          <div className="flex items-center justify-end gap-1 px-2 py-1 bg-muted/30">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleCopy} className="h-6 w-6 rounded-lg">
                  {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom"><p>Copier</p></TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleDownload} className="h-6 w-6 rounded-lg">
                  <Download className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom"><p>Telecharger .py</p></TooltipContent>
            </Tooltip>
          </div>
          <div className="overflow-x-auto max-h-80">
            <pre className="text-[11px] leading-relaxed font-mono px-3 py-2 text-foreground/90">
              <code>{entry.code}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

export function CodeHistorySheet({ entries }: CodeHistorySheetProps) {
  const [open, setOpen] = useState(false);

  const handleDownloadAll = () => {
    const combined = entries
      .map((e, i) => `# ── Script ${i + 1}: ${e.description} ──\n# ${new Date(e.timestamp).toLocaleString("fr-CA")}\n\n${e.code}`)
      .join("\n\n\n");
    const blob = new Blob([combined], { type: "text/x-python" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `autoscholar_scripts_${new Date().toISOString().slice(0, 10)}.py`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(true)}
            className="h-8 w-8 rounded-xl hover:bg-primary/5 transition-all duration-200 relative"
          >
            <Code2 className="h-4 w-4" />
            {entries.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                {entries.length}
              </span>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent><p>Code Python</p></TooltipContent>
      </Tooltip>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-[90vw] sm:w-[540px] sm:max-w-[540px] flex flex-col">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Code2 className="h-4 w-4 text-primary" />
              Code Python
              {entries.length > 0 && (
                <Badge variant="secondary" className="text-[10px] ml-1">
                  {entries.length} script{entries.length > 1 ? "s" : ""}
                </Badge>
              )}
            </SheetTitle>
          </SheetHeader>

          {entries.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
              <div className="w-12 h-12 rounded-2xl bg-muted/50 flex items-center justify-center mb-3">
                <Code2 className="h-6 w-6 text-muted-foreground/50" />
              </div>
              <p className="text-sm text-muted-foreground">Aucun script Python pour le moment</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Les scripts apparaitront ici lors de l'analyse
              </p>
            </div>
          ) : (
            <>
              <div className="flex justify-end px-1 py-2">
                <Button variant="outline" size="sm" onClick={handleDownloadAll} className="h-7 text-xs gap-1.5 rounded-lg">
                  <Download className="h-3 w-3" />
                  Tout telecharger
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {entries.map((entry, i) => (
                  <CodeEntry key={entry.id} entry={entry} index={i} />
                ))}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
