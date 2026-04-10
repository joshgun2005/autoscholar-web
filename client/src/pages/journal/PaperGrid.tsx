import { motion } from "framer-motion";
import {
  Library, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
} from "lucide-react";
import { FeaturedPaper } from "@/components/journal/FeaturedPaper";
import { PaperCard } from "@/components/journal/PaperCard";
import type { PublishedPaper, ViewMode } from "./types";
import { PAPERS_PER_PAGE } from "./types";

interface PaperGridProps {
  filteredPapers: PublishedPaper[];
  featuredPaper: PublishedPaper | null;
  allRemainingPapers: PublishedPaper[];
  remainingPapers: PublishedPaper[];
  viewMode: ViewMode;
  safePage: number;
  totalPages: number;
  goToPage: (page: number) => void;
  onNavigate: (path: string) => void;
  onDomainFilter: (domain: string) => void;
  onSearchKeyword: (keyword: string) => void;
  expandedAbstracts: Set<string>;
  openCitations: Set<string>;
  toggleAbstract: (id: string) => void;
  toggleCitation: (id: string) => void;
  reviewsByPaperId: Map<string, { overallScore: number; recommendation: string }>;
}

export function PaperGrid({
  filteredPapers, featuredPaper, allRemainingPapers, remainingPapers,
  viewMode, safePage, totalPages, goToPage,
  onNavigate, onDomainFilter, onSearchKeyword,
  expandedAbstracts, openCitations, toggleAbstract, toggleCitation,
  reviewsByPaperId,
}: PaperGridProps) {
  return (
    <>
      {/* Featured Paper */}
      {featuredPaper && (
        <FeaturedPaper
          paper={featuredPaper}
          onNavigate={onNavigate}
          onDomainFilter={onDomainFilter}
        />
      )}

      {/* Papers List/Grid */}
      {allRemainingPapers.length > 0 && (
        <>
          {featuredPaper && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-4 mb-8 mt-4"
            >
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
              <span className="text-xs text-muted-foreground/50 font-semibold uppercase tracking-widest flex items-center gap-2">
                <Library className="w-3 h-3" />
                Previous Publications
                <span className="text-muted-foreground/30">({allRemainingPapers.length})</span>
              </span>
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
            </motion.div>
          )}

          <div className={
            viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
              : "space-y-0"
          }>
            {remainingPapers.map((paper, index) => (
              <PaperCard
                key={paper.id}
                paper={paper}
                index={(safePage - 1) * PAPERS_PER_PAGE + index}
                viewMode={viewMode}
                onNavigate={onNavigate}
                onDomainFilter={onDomainFilter}
                onSearchKeyword={onSearchKeyword}
                isAbstractExpanded={expandedAbstracts.has(paper.id)}
                isCitationOpen={openCitations.has(paper.id)}
                toggleAbstract={toggleAbstract}
                toggleCitation={toggleCitation}
                reviewScore={reviewsByPaperId.get(paper.id)}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-10"
            >
              <div className="flex flex-col items-center gap-4">
                <p className="text-xs text-muted-foreground/50 font-medium">
                  Showing {(safePage - 1) * PAPERS_PER_PAGE + 1}&ndash;{Math.min(safePage * PAPERS_PER_PAGE, allRemainingPapers.length)} of {allRemainingPapers.length} papers
                </p>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => goToPage(1)}
                    disabled={safePage === 1}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground/50 hover:text-foreground hover:bg-muted/50 disabled:opacity-25 disabled:cursor-not-allowed transition-all duration-200"
                    title="First page"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => goToPage(safePage - 1)}
                    disabled={safePage === 1}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground/50 hover:text-foreground hover:bg-muted/50 disabled:opacity-25 disabled:cursor-not-allowed transition-all duration-200"
                    title="Previous page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {(() => {
                    const pages: number[] = [];
                    let start = Math.max(1, safePage - 2);
                    let end = Math.min(totalPages, start + 4);
                    if (end - start < 4) start = Math.max(1, end - 4);

                    for (let i = start; i <= end; i++) pages.push(i);

                    return (
                      <>
                        {start > 1 && (
                          <>
                            <button
                              onClick={() => goToPage(1)}
                              className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-semibold text-muted-foreground/60 hover:text-foreground hover:bg-muted/50 transition-all duration-200"
                            >
                              1
                            </button>
                            {start > 2 && (
                              <span className="w-6 text-center text-muted-foreground/30 text-xs">...</span>
                            )}
                          </>
                        )}
                        {pages.map(p => (
                          <button
                            key={p}
                            onClick={() => goToPage(p)}
                            className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                              p === safePage
                                ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                                : "text-muted-foreground/60 hover:text-foreground hover:bg-muted/50"
                            }`}
                          >
                            {p}
                          </button>
                        ))}
                        {end < totalPages && (
                          <>
                            {end < totalPages - 1 && (
                              <span className="w-6 text-center text-muted-foreground/30 text-xs">...</span>
                            )}
                            <button
                              onClick={() => goToPage(totalPages)}
                              className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-semibold text-muted-foreground/60 hover:text-foreground hover:bg-muted/50 transition-all duration-200"
                            >
                              {totalPages}
                            </button>
                          </>
                        )}
                      </>
                    );
                  })()}

                  <button
                    onClick={() => goToPage(safePage + 1)}
                    disabled={safePage === totalPages}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground/50 hover:text-foreground hover:bg-muted/50 disabled:opacity-25 disabled:cursor-not-allowed transition-all duration-200"
                    title="Next page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => goToPage(totalPages)}
                    disabled={safePage === totalPages}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground/50 hover:text-foreground hover:bg-muted/50 disabled:opacity-25 disabled:cursor-not-allowed transition-all duration-200"
                    title="Last page"
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </>
      )}
    </>
  );
}
