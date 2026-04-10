import { useState, useMemo, useCallback } from "react";
import { Copy, Check, Quote } from "lucide-react";
import { motion } from "framer-motion";
import { generateBibtex, generateAPA, generateChicago } from "@/utils/bibtexParser";

interface PublishedPaper {
  id: string;
  asid: string | null;
  title: string;
  abstract: string | null;
  authors: string | null;
  keywords: string | null;
  template: string | null;
  domain: string | null;
  filename: string;
  downloadUrl: string;
  projectZipUrl: string | null;
  wordCount: number | null;
  sectionCount: number | null;
  figureCount: number | null;
  publishedAt: string;
}

type CitationFormat = "bibtex" | "apa" | "chicago";

export function CitationPanel({ paper }: { paper: PublishedPaper }) {
  const [citationFormat, setCitationFormat] = useState<CitationFormat>("bibtex");
  const [copied, setCopied] = useState(false);

  const citationText = useMemo(() => {
    switch (citationFormat) {
      case "bibtex": return generateBibtex(paper);
      case "apa": return generateAPA(paper);
      case "chicago": return generateChicago(paper);
    }
  }, [paper, citationFormat]);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(citationText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [citationText]);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25 }}
      className="overflow-hidden"
    >
      <div className="mt-5 rounded-xl overflow-hidden border border-border/40">
        {/* Header bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-muted/30 border-b border-border/30">
          <div className="flex items-center gap-2">
            <Quote className="w-3.5 h-3.5 text-primary/50" />
            <div className="flex items-center gap-1 bg-background/60 rounded-lg p-0.5">
              {(["bibtex", "apa", "chicago"] as CitationFormat[]).map(fmt => (
                <button
                  key={fmt}
                  onClick={() => setCitationFormat(fmt)}
                  className={`px-3 py-1.5 text-[11px] font-semibold rounded-md transition-all duration-200 ${
                    citationFormat === fmt
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground/60 hover:text-foreground hover:bg-muted/60'
                  }`}
                >
                  {fmt === 'bibtex' ? 'BibTeX' : fmt.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={handleCopy}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold rounded-lg transition-all duration-200 ${
              copied
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'text-muted-foreground/60 hover:text-foreground hover:bg-muted/60'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        {/* Code block */}
        <pre className="text-xs text-muted-foreground/80 bg-background/40 p-4 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
          {citationText}
        </pre>
      </div>
    </motion.div>
  );
}
