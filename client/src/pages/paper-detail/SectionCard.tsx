import { useState, useMemo } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { latexToHtml } from "@/utils/latexRenderer";
import type { ParsedSection, ParsedReference } from "@/utils/latexRenderer";

function SubsectionContent({ subsection, references, figureUrls }: {
  subsection: { id: string; title: string; content: string };
  references: ParsedReference[];
  figureUrls: string[];
}) {
  const htmlContent = useMemo(
    () => latexToHtml(subsection.content, references, figureUrls),
    [subsection.content, references, figureUrls]
  );

  return (
    <div data-section-id={subsection.id} className="scroll-mt-20 mt-6">
      <h3 className="text-base font-serif font-semibold text-foreground mb-3 flex items-center gap-2">
        <ChevronRight className="w-4 h-4 text-primary/50" />
        {subsection.title}
      </h3>
      <div
        className="latex-content"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </div>
  );
}

export default function SectionCard({ section, references, figureUrls, index }: {
  section: ParsedSection;
  references: ParsedReference[];
  figureUrls: string[];
  index: number;
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  const htmlContent = useMemo(
    () => latexToHtml(section.content, references, figureUrls),
    [section.content, references, figureUrls]
  );

  return (
    <div className="rounded-2xl bg-card border border-border/60 overflow-hidden">
      {/* Section header - collapsible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-4 p-5 hover:bg-muted/20 transition-colors text-left"
      >
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold text-sm flex-shrink-0">
          {index + 1}
        </div>
        <h2 className="text-lg font-serif font-bold text-foreground flex-1">
          {section.title}
        </h2>
        <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      {/* Section content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-6 pt-0">
              <div className="prose prose-sm max-w-none">
                <div
                  className="latex-content"
                  dangerouslySetInnerHTML={{ __html: htmlContent }}
                />

                {/* Subsections */}
                {section.subsections.map(sub => (
                  <SubsectionContent
                    key={sub.id}
                    subsection={sub}
                    references={references}
                    figureUrls={figureUrls}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
