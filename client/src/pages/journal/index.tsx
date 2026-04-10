import { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { generateBibtex } from "@/utils/bibtexParser";
import type { PublishedPaper, SortOrder, ViewMode } from "./types";
import { PAPERS_PER_PAGE, parseKeywords } from "./types";
import { JournalHeader } from "./JournalHeader";
import { EditorialNote } from "./EditorialNote";
import { FilterPanel } from "./FilterPanel";
import { PaperGrid } from "./PaperGrid";
import { EmptyState } from "./EmptyState";
import { JournalFooter } from "./JournalFooter";

export default function Journal() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [domainFilter, setDomainFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedAbstracts, setExpandedAbstracts] = useState<Set<string>>(new Set());
  const [openCitations, setOpenCitations] = useState<Set<string>>(new Set());

  const { data: papers, isLoading } = useQuery<PublishedPaper[]>({
    queryKey: ["/api/journal/papers"],
    refetchInterval: 30000,
  });

  const { data: rawReviews } = useQuery<{ id: string; paperId: string; overallScore: number; recommendation: string }[]>({
    queryKey: ["/api/journal/reviews"],
  });
  const reviewsByPaperId = useMemo(() => {
    const map = new Map<string, { overallScore: number; recommendation: string }>();
    if (Array.isArray(rawReviews)) {
      for (const r of rawReviews) {
        map.set(r.paperId, { overallScore: r.overallScore, recommendation: r.recommendation });
      }
    }
    return map;
  }, [rawReviews]);

  const toggleAbstract = useCallback((id: string) => {
    setExpandedAbstracts(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const toggleCitation = useCallback((id: string) => {
    setOpenCitations(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const domains = useMemo(() => {
    if (!papers) return [];
    const set = new Set(papers.map(p => p.domain).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [papers]);

  const filteredPapers = useMemo(() => {
    if (!papers) return [];
    let result = papers;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.title.toLowerCase().includes(q) ||
        (p.abstract?.toLowerCase().includes(q)) ||
        (p.domain?.toLowerCase().includes(q)) ||
        (p.authors?.toLowerCase().includes(q)) ||
        parseKeywords(p.keywords).some(k => k.toLowerCase().includes(q))
      );
    }

    if (domainFilter !== "all") {
      result = result.filter(p => p.domain === domainFilter);
    }

    switch (sortOrder) {
      case "oldest":
        return [...result].sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime());
      case "longest":
        return [...result].sort((a, b) => (b.wordCount || 0) - (a.wordCount || 0));
      default:
        return [...result].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    }
  }, [papers, searchQuery, domainFilter, sortOrder]);

  const totalWords = papers?.reduce((sum, p) => sum + (p.wordCount || 0), 0) || 0;
  const totalFigures = papers?.reduce((sum, p) => sum + (p.figureCount || 0), 0) || 0;
  const totalCost = papers?.reduce((sum, p) => sum + (p.generationCost || 0), 0) || 0;

  const downloadAllBibtex = useCallback(() => {
    if (!papers || papers.length === 0) return;
    const allBibtex = papers.map(p => generateBibtex(p)).join('\n\n');
    const blob = new Blob([allBibtex], { type: 'application/x-bibtex' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `autoscholar-journal-${papers.length}-papers.bib`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [papers]);

  useEffect(() => { setCurrentPage(1); }, [searchQuery, domainFilter, sortOrder]);

  const showFeatured = !searchQuery && domainFilter === "all" && sortOrder === "newest" && filteredPapers.length > 1;
  const featuredPaper = showFeatured ? filteredPapers[0] : null;
  const allRemainingPapers = showFeatured ? filteredPapers.slice(1) : filteredPapers;

  const totalPages = Math.max(1, Math.ceil(allRemainingPapers.length / PAPERS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const remainingPapers = allRemainingPapers.slice((safePage - 1) * PAPERS_PER_PAGE, safePage * PAPERS_PER_PAGE);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    window.scrollTo({ top: 400, behavior: "smooth" });
  }, [totalPages]);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden" data-testid="page-journal">
      {/* Ambient background layers */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(var(--primary)/0.08),transparent_70%)] mesh-gradient" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_80%_50%,hsl(var(--primary)/0.03),transparent_60%)]" />
        <div className="absolute bottom-0 left-0 right-0 h-[40vh] bg-gradient-to-t from-background to-transparent" />
        <div className="absolute inset-0 bg-[linear-gradient(hsl(var(--primary)/0.015)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--primary)/0.015)_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      {/* JournalHeader renders the sticky <header> and the masthead hero */}
      <JournalHeader
        papers={papers}
        totalWords={totalWords}
        totalFigures={totalFigures}
        totalCost={totalCost}
        domains={domains}
        downloadAllBibtex={downloadAllBibtex}
      />

      <main className="container mx-auto px-4 py-10 md:py-16 max-w-6xl relative z-10">
        <EditorialNote />

        <FilterPanel
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          domainFilter={domainFilter}
          setDomainFilter={setDomainFilter}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          viewMode={viewMode}
          setViewMode={setViewMode}
          domains={domains}
          filteredCount={filteredPapers.length}
          totalCount={papers?.length || 0}
        />

        {/* Loading */}
        {isLoading && (
          <div className="text-center py-32">
            <div className="relative inline-block">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary/20 border-t-primary" />
              <div className="absolute inset-0 animate-ping rounded-full border border-primary/10" />
            </div>
            <p className="text-sm text-muted-foreground mt-6">Loading journal...</p>
          </div>
        )}

        {/* Papers */}
        {!isLoading && filteredPapers.length > 0 && (
          <PaperGrid
            filteredPapers={filteredPapers}
            featuredPaper={featuredPaper}
            allRemainingPapers={allRemainingPapers}
            remainingPapers={remainingPapers}
            viewMode={viewMode}
            safePage={safePage}
            totalPages={totalPages}
            goToPage={goToPage}
            onNavigate={setLocation}
            onDomainFilter={setDomainFilter}
            onSearchKeyword={setSearchQuery}
            expandedAbstracts={expandedAbstracts}
            openCitations={openCitations}
            toggleAbstract={toggleAbstract}
            toggleCitation={toggleCitation}
            reviewsByPaperId={reviewsByPaperId}
          />
        )}

        {/* Empty State */}
        {!isLoading && filteredPapers.length === 0 && (
          <EmptyState
            hasFilters={!!searchQuery || domainFilter !== "all"}
            resetFilters={() => { setSearchQuery(""); setDomainFilter("all"); }}
          />
        )}

        {/* Footer */}
        {filteredPapers.length > 0 && <JournalFooter />}
      </main>
    </div>
  );
}
