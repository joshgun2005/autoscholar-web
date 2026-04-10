import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, Image, BookOpen, Quote } from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionStatusBadge } from "./section-status-badge";
import type { LivePaperState, PaperSection, PaperFigure } from "./types";

function timeAgo(ts: number): string {
  if (!ts) return "";
  const secs = Math.floor((Date.now() - ts) / 1000);
  if (secs < 10) return "just now";
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
  return `${Math.floor(secs / 3600)}h ago`;
}

// ── Section card ─────────────────────────────────────────────

function SectionCard({ section, figures, isWriting }: {
  section: PaperSection;
  figures: PaperFigure[];
  isWriting: boolean;
}) {
  const [expanded, setExpanded] = useState(section.status === "writing" || section.status === "completed");
  const hasContent = section.content.length > 0 || section.recentChanges.length > 0 || isWriting;
  const sectionFigures = figures.filter(f => f.sectionId === section.id);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "border rounded-xl overflow-hidden transition-all duration-300",
        isWriting
          ? "border-sky-500/30 bg-sky-500/[0.02] shadow-sm shadow-sky-500/5"
          : section.status === "completed"
            ? "border-border/30 bg-background"
            : "border-border/20 bg-muted/5",
      )}
    >
      {/* Section header */}
      <button
        className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-muted/10 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded
          ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
          : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
        }
        <span className={cn(
          "text-sm font-semibold tracking-tight flex-1",
          section.status === "pending" ? "text-muted-foreground/40" : "text-foreground",
        )}>
          {section.title}
        </span>

        <div className="flex items-center gap-2 shrink-0">
          {section.wordCount > 0 && (
            <span className="text-[10px] text-muted-foreground/40 font-mono">{section.wordCount} words</span>
          )}
          {sectionFigures.length > 0 && (
            <span className="text-[10px] text-muted-foreground/40 flex items-center gap-0.5">
              <Image className="h-2.5 w-2.5" />{sectionFigures.length}
            </span>
          )}
          <SectionStatusBadge status={section.status} />
        </div>
      </button>

      {/* Expanded content */}
      <AnimatePresence>
        {expanded && hasContent && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4 space-y-3">
              {/* Recent changes badges */}
              {section.recentChanges.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {section.recentChanges.map((change, i) => (
                    <span key={i} className="inline-flex items-center gap-1 text-[9px] font-medium text-primary/70 bg-primary/5 border border-primary/10 rounded-md px-2 py-0.5">
                      {change}
                    </span>
                  ))}
                </div>
              )}

              {/* Updated indicator */}
              {section.updatedAt > 0 && (
                <div className="text-[10px] text-muted-foreground/40 italic">
                  Updated {timeAgo(section.updatedAt)}
                </div>
              )}

              {/* Content preview */}
              {section.content.length > 0 ? (
                <div className={cn(
                  "text-[13px] leading-[1.75] text-foreground/75 font-[system-ui]",
                  "selection:bg-primary/10",
                  section.id === "abstract" && "italic",
                )}>
                  {section.content.split("\n\n").map((paragraph, i) => (
                    <p key={i} className={cn(i > 0 && "mt-3")}>
                      {paragraph}
                    </p>
                  ))}
                  {isWriting && (
                    <span className="inline-block w-[2px] h-[1em] bg-primary/60 animate-pulse ml-0.5 align-text-bottom" />
                  )}
                </div>
              ) : isWriting ? (
                <div className="flex items-center gap-2 text-[13px] text-sky-500/70">
                  <span className="inline-block w-[2px] h-[1em] bg-sky-500/60 animate-pulse" />
                  <span className="italic">Writing section content...</span>
                </div>
              ) : null}

              {/* Inline figures */}
              {sectionFigures.length > 0 && (
                <div className="space-y-2 pt-1">
                  {sectionFigures.map(fig => (
                    <FigurePreview key={fig.id} figure={fig} />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Figure preview ───────────────────────────────────────────

function FigurePreview({ figure }: { figure: PaperFigure }) {
  const hasImage = figure.previewUrl && figure.status === "completed";

  return (
    <div className={cn(
      "flex items-start gap-3 px-4 py-3 rounded-lg border",
      figure.status === "generating"
        ? "border-amber-500/20 bg-amber-500/[0.03]"
        : "border-border/20 bg-muted/5",
    )}>
      {hasImage ? (
        <img
          src={figure.previewUrl!}
          alt={figure.title}
          className="w-24 h-auto rounded-md border border-border/20 shrink-0 object-contain bg-white"
          loading="lazy"
        />
      ) : (
        <div className={cn(
          "w-16 h-12 rounded-md flex items-center justify-center shrink-0 border",
          figure.status === "generating"
            ? "bg-amber-500/10 border-amber-500/20"
            : "bg-muted/20 border-border/20",
        )}>
          <Image className={cn("h-5 w-5",
            figure.status === "generating" ? "text-amber-500/60 animate-pulse" : "text-muted-foreground/30"
          )} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-foreground">{figure.title}</span>
          {figure.status === "generating" && (
            <span className="text-[9px] font-medium text-amber-600 bg-amber-500/10 px-1.5 py-0.5 rounded">Generating</span>
          )}
          {figure.status === "completed" && (
            <span className="text-[9px] font-medium text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">Ready</span>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground/60 mt-0.5 line-clamp-2">{figure.caption}</p>
      </div>
    </div>
  );
}

// ── Main viewer ──────────────────────────────────────────────

export function LivePaperViewer({ state }: { state: LivePaperState }) {
  const completedSections = state.sections.filter(s => s.status === "completed").length;
  const writingSections = state.sections.filter(s => s.status === "writing").length;
  const totalWords = state.sections.reduce((sum, s) => sum + s.wordCount, 0);
  const totalRefs = state.references.length;

  return (
    <div className="space-y-4">
      {/* Manuscript header */}
      <div className="px-5 py-5 rounded-xl border border-border/30 bg-background space-y-3">
        {/* Paper "title page" feel */}
        <div className="text-center space-y-2 pb-3 border-b border-border/20">
          <h2 className="text-lg sm:text-xl font-bold text-foreground tracking-tight leading-tight px-4">
            {state.title}
          </h2>
          <p className="text-[11px] text-muted-foreground/50 font-medium">
            Generated by AutoScholar &mdash; Autonomous Research Pipeline
          </p>
        </div>

        {/* Mini stats */}
        <div className="flex items-center justify-center gap-5 text-[10px] text-muted-foreground/50">
          <span className="flex items-center gap-1">
            <BookOpen className="h-3 w-3" />
            {completedSections}/{state.sections.length} sections
            {writingSections > 0 && <span className="text-sky-500">({writingSections} writing)</span>}
          </span>
          {totalWords > 0 && (
            <span className="font-mono">{totalWords.toLocaleString()} words</span>
          )}
          <span className="flex items-center gap-1">
            <Image className="h-3 w-3" />
            {state.figures.length} figures
          </span>
          <span className="flex items-center gap-1">
            <Quote className="h-3 w-3" />
            {totalRefs} references
          </span>
        </div>
      </div>

      {/* Sections list */}
      <div className="space-y-2">
        {state.sections.map(section => (
          <SectionCard
            key={section.id}
            section={section}
            figures={state.figures}
            isWriting={section.status === "writing"}
          />
        ))}
      </div>

      {/* All figures gallery */}
      {state.figures.length > 0 && (
        <div className="px-5 py-4 rounded-xl border border-border/30 bg-background space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50 flex items-center gap-2">
            <Image className="h-3.5 w-3.5" />
            Generated Figures ({state.figures.length})
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {state.figures.map(fig => (
              <FigurePreview key={fig.id} figure={fig} />
            ))}
          </div>
        </div>
      )}

      {/* References summary */}
      {state.references.length > 0 && (
        <div className="px-5 py-4 rounded-xl border border-border/30 bg-background space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50 flex items-center gap-2">
            <Quote className="h-3.5 w-3.5" />
            References ({state.references.length})
          </h3>
          <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
            {state.references.slice(0, 30).map(ref => (
              <div key={ref.id} className="text-[11px] text-muted-foreground/70 leading-relaxed">
                <span className="font-medium text-foreground/70">{ref.authors}</span>
                {" "}({ref.year}).{" "}
                <span className="italic">{ref.title}</span>
                {ref.journal && <span>. {ref.journal}</span>}
              </div>
            ))}
            {state.references.length > 30 && (
              <p className="text-[10px] text-muted-foreground/40 italic">
                + {state.references.length - 30} more references
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
