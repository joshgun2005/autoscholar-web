import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import {
  GraduationCap, ArrowLeft, Calendar, FileText, Download,
  BookOpen, Image, Tag, Quote, Copy, Check, Users, Archive,
  ChevronRight, ChevronDown, List, ExternalLink, Hash,
  Database, GitBranch, Layers, Shield,
  CheckCircle2, XCircle, AlertTriangle,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { API_BASE_URL } from "@/config";
import { getDomainStyle } from "@/utils/domainStyles";
import { parseSections } from "@/utils/latexRenderer";
import { parseBibtex, generateBibtex, generateAPA } from "@/utils/bibtexParser";

import type { PublishedPaper, PeerReviewData, CitationFormat } from "./types";
import { parseKeywords, formatAuthors, formatAffiliation, formatEmail } from "./helpers";
import SectionCard from "./SectionCard";
import PeerReviewPanel from "./PeerReviewPanel";

export default function PaperDetail() {
  const params = useParams<{ paperId: string }>();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [showToc, setShowToc] = useState(true);
  const [citationFormat, setCitationFormat] = useState<CitationFormat>("bibtex");
  const [copied, setCopied] = useState(false);
  const [showCitation, setShowCitation] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const { data: paper, isLoading } = useQuery<PublishedPaper>({
    queryKey: [`/api/journal/papers/${params.paperId}`],
    enabled: !!params.paperId,
  });

  // Fetch available figures for this paper
  const { data: figuresData } = useQuery<{ figures: { index: number; name: string; url: string }[] }>({
    queryKey: [`/api/journal/papers/${params.paperId}/figures`],
    enabled: !!params.paperId && !!paper?.projectZipUrl,
  });

  const figureUrls = useMemo(() => {
    if (!figuresData?.figures) return [];
    return figuresData.figures.map(f => f.url);
  }, [figuresData]);

  const sections = useMemo(() => parseSections(paper?.latexContent ?? null), [paper?.latexContent]);
  const references = useMemo(() => parseBibtex(paper?.bibtexEntries ?? null), [paper?.bibtexEntries]);
  const keywords = useMemo(() => parseKeywords(paper?.keywords ?? null), [paper?.keywords]);

  // Peer review
  const { data: peerReview } = useQuery<PeerReviewData>({
    queryKey: [`/api/journal/papers/${params.paperId}/review`],
    enabled: !!params.paperId,
    retry: false,
  });

  const reviewMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/journal/papers/${params.paperId}/review`, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed' }));
        throw new Error(err.error || 'Failed to generate review');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/journal/papers/${params.paperId}/review`] });
      setShowReview(true);
    },
  });

  // Track scroll position for active section
  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return;
      const sectionEls = contentRef.current.querySelectorAll('[data-section-id]');
      let current: string | null = null;
      sectionEls.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top <= 200) {
          current = el.getAttribute('data-section-id');
        }
      });
      if (current) setActiveSection(current);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = useCallback((sectionId: string) => {
    const el = document.querySelector(`[data-section-id="${sectionId}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const handleCopyCitation = useCallback(async () => {
    if (!paper) return;
    const text = citationFormat === 'bibtex' ? generateBibtex(paper) : generateAPA(paper);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [paper, citationFormat]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground mt-4">Loading paper...</p>
        </div>
      </div>
    );
  }

  if (!paper) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Paper not found</h2>
          <p className="text-sm text-muted-foreground mb-6">This paper may have been removed or the link is invalid.</p>
          <Button onClick={() => setLocation('/journal')} className="rounded-xl gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Journal
          </Button>
        </div>
      </div>
    );
  }

  const domainStyle = getDomainStyle(paper.domain);
  const author = formatAuthors(paper.authors);
  const affiliation = formatAffiliation(paper.authors);
  const email = formatEmail(paper.authors);
  const hasInteractiveContent = sections.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.03),transparent_70%)]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 w-full glass-strong">
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <div className="container flex h-14 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setLocation('/journal')} className="gap-2 rounded-xl">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline font-semibold">Journal</span>
            </Button>
            <button onClick={() => setLocation('/')} className="flex items-center gap-2.5">
              <div className="relative">
                <GraduationCap className="w-5 h-5 text-primary" />
                <div className="absolute inset-0 blur-md bg-primary/20" />
              </div>
              <span className="hidden md:inline text-base font-bold text-foreground tracking-tight">
                AutoScholar
              </span>
            </button>
          </div>
          <div className="flex items-center gap-2">
            {hasInteractiveContent && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowToc(!showToc)}
                className="gap-1.5 rounded-xl text-xs lg:hidden"
              >
                <List className="w-4 h-4" />
                TOC
              </Button>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 relative z-10">
        <div className={`flex gap-8 ${hasInteractiveContent ? 'max-w-7xl' : 'max-w-4xl'} mx-auto`}>

          {/* Table of Contents - Sidebar */}
          {hasInteractiveContent && (
            <AnimatePresence>
              {showToc && (
                <motion.aside
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="hidden lg:block w-64 flex-shrink-0"
                >
                  <div className="sticky top-20">
                    <div className="p-4 rounded-2xl bg-card border border-border/60">
                      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                        <List className="w-3.5 h-3.5" />
                        Table of Contents
                      </h3>
                      <nav className="space-y-1">
                        {sections.map((section) => (
                          <div key={section.id}>
                            <button
                              onClick={() => scrollToSection(section.id)}
                              className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                                activeSection === section.id
                                  ? 'bg-primary/10 text-primary'
                                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                              }`}
                            >
                              {section.title}
                            </button>
                            {section.subsections.map(sub => (
                              <button
                                key={sub.id}
                                onClick={() => scrollToSection(sub.id)}
                                className={`w-full text-left pl-6 pr-3 py-1 rounded-lg text-[11px] transition-all duration-200 ${
                                  activeSection === sub.id
                                    ? 'text-primary'
                                    : 'text-muted-foreground/60 hover:text-muted-foreground'
                                }`}
                              >
                                {sub.title}
                              </button>
                            ))}
                          </div>
                        ))}
                        {references.length > 0 && (
                          <button
                            onClick={() => scrollToSection('references')}
                            className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                              activeSection === 'references'
                                ? 'bg-primary/10 text-primary'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                            }`}
                          >
                            References ({references.length})
                          </button>
                        )}
                      </nav>
                    </div>
                  </div>
                </motion.aside>
              )}
            </AnimatePresence>
          )}

          {/* Main Content */}
          <div className="flex-1 min-w-0" ref={contentRef}>

            {/* Paper Header */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-10"
            >
              {/* Domain & Template badges */}
              <div className="flex items-center gap-2.5 mb-5 flex-wrap">
                {paper.domain && (
                  <Badge
                    variant="outline"
                    className={`text-[11px] font-semibold px-3 py-1 rounded-lg uppercase tracking-wider ${domainStyle.bg} ${domainStyle.text} ${domainStyle.border}`}
                  >
                    {paper.domain}
                  </Badge>
                )}
                {paper.template && (
                  <Badge variant="outline" className="text-[11px] font-medium px-3 py-1 rounded-lg capitalize">
                    {paper.template.replace(/_/g, ' ')}
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground/60 flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(paper.publishedAt), "MMMM d, yyyy")}
                </span>
              </div>

              {/* Title */}
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground leading-tight mb-5">
                {paper.title}
              </h1>

              {/* Authors */}
              <div className="flex items-start gap-4 mb-6 p-4 rounded-xl bg-card border border-border/60">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{author}</p>
                  {affiliation && <p className="text-sm text-muted-foreground">{affiliation}</p>}
                  {email && <p className="text-xs text-muted-foreground/60 mt-0.5">{email}</p>}
                </div>
              </div>

              {/* Keywords */}
              {keywords.length > 0 && (
                <div className="flex items-center gap-2 mb-6 flex-wrap">
                  <Tag className="w-3.5 h-3.5 text-muted-foreground/40" />
                  {keywords.map((k, i) => (
                    <Badge
                      key={i}
                      variant="secondary"
                      className="text-[11px] font-medium px-2.5 py-0.5 rounded-lg cursor-pointer hover:bg-primary/10 hover:text-primary transition-colors"
                      onClick={() => setLocation(`/journal?search=${encodeURIComponent(k)}`)}
                    >
                      {k}
                    </Badge>
                  ))}
                </div>
              )}

              {/* ASID badge */}
              {paper.asid && (
                <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-primary/5 border border-primary/15">
                  <span className="text-[11px] font-bold text-primary uppercase tracking-wider">ASID</span>
                  <a
                    href={`/paper/${paper.asid}`}
                    className="text-sm font-mono text-foreground hover:text-primary transition-colors"
                  >
                    {paper.asid}
                  </a>
                  <button
                    className="ml-auto p-1 rounded hover:bg-primary/10 transition-colors"
                    onClick={() => {
                      navigator.clipboard.writeText(paper.asid!);
                    }}
                    title="Copy ASID"
                  >
                    <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                  </button>
                </div>
              )}

              {/* Stats row */}
              <div className="flex items-center gap-4 flex-wrap text-xs text-muted-foreground/60">
                {paper.wordCount && paper.wordCount > 0 && (
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    ~{paper.wordCount.toLocaleString()} words
                  </span>
                )}
                {paper.sectionCount && paper.sectionCount > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5" />
                    {paper.sectionCount} sections
                  </span>
                )}
                {paper.figureCount && paper.figureCount > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Image className="w-3.5 h-3.5" />
                    {paper.figureCount} figures
                  </span>
                )}
                {references.length > 0 && (
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    {references.length} references
                  </span>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-3 mt-6 flex-wrap">
                <a
                  href={`${API_BASE_URL}${paper.downloadUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </a>
                {paper.projectZipUrl && (
                  <a
                    href={`${API_BASE_URL}${paper.projectZipUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl bg-card border border-border hover:bg-muted transition-colors"
                  >
                    <Archive className="w-4 h-4" />
                    LaTeX Project
                  </a>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCitation(!showCitation)}
                  className={`rounded-xl gap-2 ${showCitation ? 'bg-primary/10 border-primary/30' : ''}`}
                >
                  <Quote className="w-4 h-4" />
                  Cite
                </Button>
              </div>

              {/* Citation panel */}
              <AnimatePresence>
                {showCitation && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 p-4 rounded-xl bg-muted/40 border border-border/60">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1.5">
                          {(["bibtex", "apa"] as CitationFormat[]).map(fmt => (
                            <button
                              key={fmt}
                              onClick={() => setCitationFormat(fmt)}
                              className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${
                                citationFormat === fmt
                                  ? 'bg-primary text-primary-foreground'
                                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                              }`}
                            >
                              {fmt === 'bibtex' ? 'BibTeX' : 'APA'}
                            </button>
                          ))}
                        </div>
                        <button onClick={handleCopyCitation} className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors">
                          {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                          {copied ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                      <pre className="text-xs text-muted-foreground bg-background/60 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed border border-border/40">
                        {citationFormat === 'bibtex' ? generateBibtex(paper) : generateAPA(paper)}
                      </pre>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Abstract Card */}
            {paper.abstract && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="mb-10 p-6 rounded-2xl bg-card border border-border/60"
              >
                <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Abstract
                </h2>
                <p className="text-muted-foreground leading-[1.8] text-[15px]">
                  {paper.abstract}
                </p>
              </motion.div>
            )}

            {/* Document Cards */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10"
            >
              {/* Paper Overview Card */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm p-5"
              >
                <h3 className="metric-label flex items-center gap-2 mb-4">
                  <Layers className="w-3.5 h-3.5" />
                  Paper Overview
                </h3>
                <div className="space-y-3">
                  {paper.abstract && (
                    <div>
                      <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider mb-1">Research Question</p>
                      <p className="text-xs text-foreground leading-relaxed">
                        {paper.abstract.split(/(?<=[.!?])\s+/).slice(0, 2).join(' ')}
                      </p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    {paper.domain && (
                      <div className="text-xs">
                        <span className="text-muted-foreground/60">Domain</span>
                        <p className="font-medium text-foreground capitalize">{paper.domain}</p>
                      </div>
                    )}
                    {paper.template && (
                      <div className="text-xs">
                        <span className="text-muted-foreground/60">Template</span>
                        <p className="font-medium text-foreground capitalize">{paper.template.replace(/_/g, ' ')}</p>
                      </div>
                    )}
                    {paper.wordCount && paper.wordCount > 0 && (
                      <div className="text-xs">
                        <span className="text-muted-foreground/60">Word Count</span>
                        <p className="font-medium text-foreground">~{paper.wordCount.toLocaleString()}</p>
                      </div>
                    )}
                    {paper.sectionCount && paper.sectionCount > 0 && (
                      <div className="text-xs">
                        <span className="text-muted-foreground/60">Sections</span>
                        <p className="font-medium text-foreground">{paper.sectionCount}</p>
                      </div>
                    )}
                    {paper.figureCount && paper.figureCount > 0 && (
                      <div className="text-xs">
                        <span className="text-muted-foreground/60">Figures</span>
                        <p className="font-medium text-foreground">{paper.figureCount}</p>
                      </div>
                    )}
                    <div className="text-xs">
                      <span className="text-muted-foreground/60">Published</span>
                      <p className="font-medium text-foreground">{format(new Date(paper.publishedAt), "MMM d, yyyy")}</p>
                    </div>
                    {paper.asid && (
                      <div className="text-xs col-span-2">
                        <span className="text-muted-foreground/60">ASID</span>
                        <p className="font-medium text-foreground font-mono text-[11px]">{paper.asid}</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Data & Methods Card */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.25 }}
                className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm p-5"
              >
                <h3 className="metric-label flex items-center gap-2 mb-4">
                  <Database className="w-3.5 h-3.5" />
                  Data & Methods
                </h3>
                <div className="space-y-3">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Data sources and methods used in this paper.
                  </p>
                  {keywords.length > 0 && (
                    <div>
                      <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider mb-1.5">Keywords</p>
                      <div className="flex flex-wrap gap-1.5">
                        {keywords.map((k, i) => (
                          <span key={i} className="text-[11px] px-2 py-0.5 rounded-md bg-muted/60 text-muted-foreground font-medium">
                            {k}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {paper.domain && (
                    <div>
                      <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider mb-1">Research Domain</p>
                      <p className="text-xs text-foreground capitalize">{paper.domain}</p>
                    </div>
                  )}
                  {paper.template && (
                    <div>
                      <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider mb-1">Methodology Indicator</p>
                      <p className="text-xs text-foreground capitalize">{paper.template.replace(/_/g, ' ')}</p>
                    </div>
                  )}
                  {paper.figureCount && paper.figureCount > 0 && (
                    <div>
                      <p className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider mb-1">Empirical Artifacts</p>
                      <p className="text-xs text-foreground">{paper.figureCount} figure{paper.figureCount > 1 ? 's' : ''} generated</p>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Reproducibility Card */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
                className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm p-5"
              >
                <h3 className="metric-label flex items-center gap-2 mb-4">
                  <GitBranch className="w-3.5 h-3.5" />
                  Reproducibility
                </h3>
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    {paper.projectZipUrl ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-muted-foreground/40 flex-shrink-0" />
                    )}
                    <span className={`text-xs ${paper.projectZipUrl ? 'text-foreground' : 'text-muted-foreground/50'}`}>
                      Code available
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {(paper.latexContent || paper.projectZipUrl) ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-muted-foreground/40 flex-shrink-0" />
                    )}
                    <span className={`text-xs ${(paper.latexContent || paper.projectZipUrl) ? 'text-foreground' : 'text-muted-foreground/50'}`}>
                      LaTeX source available
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {(paper.figureCount && paper.figureCount > 0) ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-muted-foreground/40 flex-shrink-0" />
                    )}
                    <span className={`text-xs ${(paper.figureCount && paper.figureCount > 0) ? 'text-foreground' : 'text-muted-foreground/50'}`}>
                      Figures reproducible
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {paper.projectZipUrl ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-muted-foreground/40 flex-shrink-0" />
                    )}
                    <span className={`text-xs ${paper.projectZipUrl ? 'text-foreground' : 'text-muted-foreground/50'}`}>
                      Publication package downloadable
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {paper.asid ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-muted-foreground/40 flex-shrink-0" />
                    )}
                    <span className={`text-xs ${paper.asid ? 'text-foreground' : 'text-muted-foreground/50'}`}>
                      ASID assigned
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Limitations Card */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.35 }}
                className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm p-5"
              >
                <h3 className="metric-label flex items-center gap-2 mb-4">
                  <Shield className="w-3.5 h-3.5" />
                  Limitations & Transparency
                </h3>
                <div className="space-y-2.5">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      This paper was generated autonomously by AI agents.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Results should be interpreted as exploratory, not definitive.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Data coverage depends on API availability at generation time.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      External validity should be assessed independently.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      This is computational research, not a substitute for human peer review.
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Interactive Paper Content */}
            {hasInteractiveContent ? (
              <div className="space-y-2">
                {sections.map((section, idx) => (
                  <motion.div
                    key={section.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 + idx * 0.03 }}
                    data-section-id={section.id}
                    className="scroll-mt-20"
                  >
                    <SectionCard
                      section={section}
                      references={references}
                      figureUrls={figureUrls}
                      index={idx}
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-card border border-border/60 text-center">
                <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  Interactive content is not available for this paper.
                  It was published before the interactive viewer was enabled.
                </p>
                <a
                  href={`${API_BASE_URL}${paper.downloadUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  View PDF
                </a>
              </div>
            )}

            {/* References Section */}
            {references.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
                data-section-id="references"
                className="mt-10 scroll-mt-20"
              >
                <div className="p-6 rounded-2xl bg-card border border-border/60">
                  <h2 className="text-xl font-serif font-bold text-foreground mb-6 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <BookOpen className="w-5 h-5 text-primary" />
                    </div>
                    References
                    <Badge variant="secondary" className="text-xs ml-2">{references.length}</Badge>
                  </h2>
                  <div className="space-y-4">
                    {references.map((ref, i) => (
                      <div
                        key={ref.key}
                        id={`ref-${ref.key}`}
                        className="group flex gap-3 p-3 rounded-xl hover:bg-muted/30 transition-colors scroll-mt-24"
                      >
                        <span className="text-xs font-mono text-muted-foreground/40 pt-0.5 w-6 text-right flex-shrink-0">
                          [{i + 1}]
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground font-medium leading-snug">
                            {ref.title || ref.key}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {ref.authors && <span>{ref.authors}</span>}
                            {ref.year && <span> ({ref.year})</span>}
                            {ref.journal && <span className="italic"> — {ref.journal}</span>}
                          </p>
                          {ref.doi && (
                            <a
                              href={`https://doi.org/${ref.doi}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-primary/70 hover:text-primary mt-1 transition-colors"
                            >
                              <ExternalLink className="w-3 h-3" />
                              DOI: {ref.doi}
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Peer Review Section */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.4 }}
              className="mt-10 scroll-mt-20"
              data-section-id="peer-review"
            >
              <PeerReviewPanel
                paper={paper}
                peerReview={peerReview}
                showReview={showReview}
                setShowReview={setShowReview}
                reviewMutation={reviewMutation}
                onNavigate={setLocation}
              />
            </motion.div>

            {/* Footer nav */}
            <div className="mt-12 pt-8 border-t border-border/60 flex items-center justify-between">
              <Button variant="ghost" size="sm" onClick={() => setLocation('/journal')} className="gap-2 rounded-xl">
                <ArrowLeft className="w-4 h-4" />
                Back to Journal
              </Button>
              <a
                href={`${API_BASE_URL}${paper.downloadUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download PDF
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
