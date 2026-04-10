import {
  Calendar, Download, ChevronDown, ChevronUp, BookOpen,
  FileText, Image, Archive, Tag, DollarSign,
  Quote, ExternalLink, Users, Clock, ClipboardCheck, ArrowUpRight, User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AnimatePresence, motion } from "framer-motion";
import { format } from "date-fns";
import { API_BASE_URL } from "@/config";
import { getDomainStyle } from "@/utils/domainStyles";
import { CitationPanel } from "./CitationPanel";

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
  userId: string | null;
  authorName: string | null;
  publishedAt: string;
  inputTokens: number | null;
  outputTokens: number | null;
  generationCost: number | null;
}

type ViewMode = "list" | "grid";

function formatCost(cost: number | null | undefined): string | null {
  if (!cost || cost === 0) return null;
  return cost < 1 ? `$${cost.toFixed(3)}` : `$${cost.toFixed(2)}`;
}

function formatTokens(tokens: number | null | undefined): string | null {
  if (!tokens || tokens === 0) return null;
  if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`;
  if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(0)}K`;
  return String(tokens);
}

function parseKeywords(keywords: string | null): string[] {
  if (!keywords) return [];
  try {
    const parsed = JSON.parse(keywords);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function formatAuthors(authors: string | null): string {
  if (!authors) return "AutoScholar Research";
  const parts = authors.split(",").map(s => s.trim());
  return parts[0] || "AutoScholar Research";
}

function formatAffiliation(authors: string | null): string | null {
  if (!authors) return null;
  const parts = authors.split(",").map(s => s.trim());
  if (parts.length >= 2) {
    return parts.slice(1).filter(p => !p.includes("@")).join(", ");
  }
  return null;
}

function getInitials(name: string): string {
  return name.split(/\s+/).map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase();
}

const AVATAR_COLORS = [
  'from-blue-500 to-indigo-500',
  'from-emerald-500 to-teal-500',
  'from-violet-500 to-purple-500',
  'from-rose-500 to-pink-500',
  'from-amber-500 to-orange-500',
  'from-cyan-500 to-sky-500',
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function estimateReadingTime(wordCount: number | null): string {
  if (!wordCount || wordCount === 0) return "~5 min";
  const minutes = Math.max(1, Math.ceil(wordCount / 250));
  return `~${minutes} min`;
}

function ReviewBadge({ score }: { score: { overallScore: number; recommendation: string } }) {
  const color = score.overallScore >= 80
    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/8 border-emerald-500/20'
    : score.overallScore >= 65
    ? 'text-blue-600 dark:text-blue-400 bg-blue-500/8 border-blue-500/20'
    : score.overallScore >= 45
    ? 'text-amber-600 dark:text-amber-400 bg-amber-500/8 border-amber-500/20'
    : 'text-red-600 dark:text-red-400 bg-red-500/8 border-red-500/20';

  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-lg border ${color}`}>
      <ClipboardCheck className="w-3 h-3" />
      <span className="font-display font-bold">{score.overallScore}</span>/100
    </span>
  );
}

export function PaperCard({ paper, index, viewMode, onNavigate, onDomainFilter, onSearchKeyword, isAbstractExpanded, isCitationOpen, toggleAbstract, toggleCitation, reviewScore }: {
  paper: PublishedPaper;
  index: number;
  viewMode: ViewMode;
  onNavigate: (path: string) => void;
  onDomainFilter: (domain: string) => void;
  onSearchKeyword: (keyword: string) => void;
  isAbstractExpanded: boolean;
  isCitationOpen: boolean;
  toggleAbstract: (id: string) => void;
  toggleCitation: (id: string) => void;
  reviewScore?: { overallScore: number; recommendation: string };
}) {
  const kw = parseKeywords(paper.keywords);
  const author = formatAuthors(paper.authors);
  const affiliation = formatAffiliation(paper.authors);
  const domainStyle = getDomainStyle(paper.domain);

  /* ═══════════════════════════════════════════════════════════════
     GRID VIEW
     ═══════════════════════════════════════════════════════════════ */
  if (viewMode === "grid") {
    return (
      <motion.article
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, delay: Math.min(index * 0.06, 0.5) }}
      >
        <div
          className="group relative h-full rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
          onClick={() => onNavigate(`/journal/${paper.id}`)}
        >
          {/* Gradient border */}
          <div className={`absolute inset-0 rounded-2xl p-px bg-gradient-to-b from-border/60 via-border/30 to-border/60 group-hover:from-primary/30 group-hover:via-primary/10 group-hover:to-primary/30 transition-all duration-400`}>
            <div className="w-full h-full rounded-[15px] bg-card" />
          </div>

          {/* Domain accent gradient bar at top */}
          <div className={`absolute inset-x-0 top-0 h-2.5 bg-gradient-to-r ${domainStyle.accent} opacity-80 group-hover:opacity-100 transition-opacity duration-300`} />

          {/* Domain accent glow at top */}
          <div className={`absolute inset-x-0 top-0 h-24 bg-gradient-to-b ${domainStyle.accent} opacity-40 group-hover:opacity-70 transition-opacity duration-400`} />

          <div className="relative p-6">
            {/* Top meta */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {paper.domain && (
                  <Badge
                    variant="outline"
                    className={`text-[9px] font-bold px-2.5 py-0.5 rounded-lg uppercase tracking-wider ${domainStyle.bg} ${domainStyle.text} ${domainStyle.border}`}
                    onClick={(e) => { e.stopPropagation(); onDomainFilter(paper.domain!); }}
                  >
                    {paper.domain}
                  </Badge>
                )}
                {reviewScore && <ReviewBadge score={reviewScore} />}
              </div>
              {/* Hover arrow */}
              <div className="w-8 h-8 rounded-full bg-primary/0 group-hover:bg-primary/10 flex items-center justify-center transition-all duration-300">
                <ArrowUpRight className="w-3.5 h-3.5 text-primary/0 group-hover:text-primary transition-all duration-300" />
              </div>
            </div>

            {/* Title */}
            <h3 className="text-base font-display font-bold tracking-tight text-foreground leading-snug mb-3 group-hover:text-primary transition-colors duration-300 line-clamp-3">
              {paper.title}
            </h3>

            {/* Author */}
            <p className="text-xs text-muted-foreground mb-3 flex items-center gap-1.5">
              <Users className="w-3 h-3 text-muted-foreground/30" />
              <span className="font-semibold text-foreground/70">{author}</span>
            </p>

            {/* Abstract preview */}
            {paper.abstract && (
              <p className="text-xs text-muted-foreground/60 leading-relaxed line-clamp-3 mb-5">
                {paper.abstract}
              </p>
            )}

            {/* Keywords */}
            {kw.length > 0 && (
              <div className="flex items-center gap-1.5 mb-5 flex-wrap">
                {kw.slice(0, 4).map((k, i) => (
                  <span
                    key={i}
                    className="text-[9px] text-muted-foreground/50 bg-muted/40 px-2 py-0.5 rounded-md"
                    onClick={(e) => { e.stopPropagation(); onSearchKeyword(k); }}
                  >
                    {k}
                  </span>
                ))}
                {kw.length > 4 && (
                  <span className="text-[9px] text-muted-foreground/25">+{kw.length - 4}</span>
                )}
              </div>
            )}

            {/* Generated by */}
            {paper.authorName && (
              <div className="flex items-center gap-2 mb-4 text-[10px] text-muted-foreground/50">
                <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${getAvatarColor(paper.authorName)} flex items-center justify-center flex-shrink-0`}>
                  <span className="text-[8px] font-bold text-white leading-none">{getInitials(paper.authorName)}</span>
                </div>
                <span>Generated by <span className="font-semibold text-foreground/60">{paper.authorName}</span></span>
              </div>
            )}

            {/* Footer meta */}
            <div className="flex items-center justify-between pt-4 border-t border-border/30">
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground/40">
                <span className="flex items-center gap-1">
                  <Calendar className="w-2.5 h-2.5" />
                  {format(new Date(paper.publishedAt), "MMM d, yyyy")}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  {estimateReadingTime(paper.wordCount)}
                </span>
                {formatCost(paper.generationCost) && (
                  <span className="flex items-center gap-1 text-amber-600/60 dark:text-amber-400/60">
                    <DollarSign className="w-2.5 h-2.5" />
                    {formatCost(paper.generationCost)}
                  </span>
                )}
              </div>
              <a
                href={`${API_BASE_URL}${paper.downloadUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-primary/60 hover:text-primary transition-colors p-1.5 rounded-lg hover:bg-primary/5"
              >
                <Download className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </motion.article>
    );
  }

  /* ═══════════════════════════════════════════════════════════════
     LIST VIEW
     ═══════════════════════════════════════════════════════════════ */
  return (
    <motion.article
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.4) }}
    >
      <div className="group relative rounded-2xl overflow-hidden mb-4 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 hover:shadow-primary/5">
        {/* Gradient border */}
        <div className="absolute inset-0 rounded-2xl p-px bg-gradient-to-r from-border/40 via-border/60 to-border/40 group-hover:from-primary/20 group-hover:via-primary/30 group-hover:to-primary/20 transition-all duration-400">
          <div className="w-full h-full rounded-[15px] bg-card" />
        </div>

        {/* Left accent bar */}
        <div className={`absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b ${domainStyle.accent} opacity-60 group-hover:opacity-100 transition-opacity duration-300`} />

        <div className="relative p-6 sm:p-7 pl-5 sm:pl-6">
          <div className="flex items-start gap-5">
            {/* Article Number */}
            <div className="hidden md:flex flex-col items-center pt-1 shrink-0">
              <span className="text-3xl font-serif font-bold text-muted-foreground/8 tabular-nums select-none leading-none group-hover:text-primary/10 transition-colors duration-300">
                {String(index + 1).padStart(2, "0")}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              {/* Domain + Date + Review */}
              <div className="flex items-center gap-2.5 mb-3 flex-wrap">
                {paper.domain && (
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-lg uppercase tracking-wider cursor-pointer transition-all hover:scale-105 ${domainStyle.bg} ${domainStyle.text} ${domainStyle.border}`}
                    onClick={() => onDomainFilter(paper.domain!)}
                  >
                    {paper.domain}
                  </Badge>
                )}
                {paper.template && paper.template !== 'article' && (
                  <Badge variant="outline" className="text-[10px] font-medium px-2 py-0.5 rounded-lg">
                    {paper.template.replace(/_/g, ' ')}
                  </Badge>
                )}
                {reviewScore && <ReviewBadge score={reviewScore} />}
                <span className="text-xs text-muted-foreground/50 flex items-center gap-1.5 font-medium">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(paper.publishedAt), "MMM d, yyyy")}
                </span>
              </div>

              {/* Title */}
              <h2
                className="text-lg sm:text-xl font-display font-bold tracking-tight text-foreground leading-snug mb-2.5 group-hover:text-primary transition-colors duration-300 cursor-pointer"
                onClick={() => onNavigate(`/journal/${paper.id}`)}
              >
                {paper.title}
              </h2>

              {/* Authors */}
              <p className="text-sm text-muted-foreground mb-1.5 flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-muted-foreground/30" />
                <span className="font-semibold text-foreground/80">{author}</span>
                {affiliation && <span className="text-muted-foreground/40">— {affiliation}</span>}
              </p>

              {/* Generated by user */}
              {paper.authorName && (
                <p className="text-xs text-muted-foreground/50 mb-3 flex items-center gap-2 ml-[1.375rem]">
                  <span className={`w-5 h-5 rounded-full bg-gradient-to-br ${getAvatarColor(paper.authorName)} flex items-center justify-center flex-shrink-0`}>
                    <span className="text-[8px] font-bold text-white leading-none">{getInitials(paper.authorName)}</span>
                  </span>
                  Generated by <span className="font-semibold text-foreground/60">{paper.authorName}</span>
                </p>
              )}

              {/* Abstract */}
              {paper.abstract && (
                <div className="mb-4">
                  <p className={`text-sm text-muted-foreground/70 leading-[1.8] ${isAbstractExpanded ? '' : 'line-clamp-3'}`}>
                    {paper.abstract}
                  </p>
                  {paper.abstract.length > 250 && (
                    <button
                      onClick={() => toggleAbstract(paper.id)}
                      className="text-xs text-primary/60 hover:text-primary mt-1.5 inline-flex items-center gap-1 font-semibold transition-colors"
                    >
                      {isAbstractExpanded ? (
                        <>Show less <ChevronUp className="w-3 h-3" /></>
                      ) : (
                        <>Read more <ChevronDown className="w-3 h-3" /></>
                      )}
                    </button>
                  )}
                </div>
              )}

              {/* Keywords */}
              {kw.length > 0 && (
                <div className="flex items-center gap-1.5 mb-5 flex-wrap">
                  <Tag className="w-3 h-3 text-muted-foreground/20" />
                  {kw.slice(0, 8).map((k, i) => (
                    <span
                      key={i}
                      className="text-[10px] text-muted-foreground/50 bg-muted/30 hover:bg-muted/60 px-2.5 py-0.5 rounded-lg cursor-pointer transition-all duration-200 hover:text-muted-foreground"
                      onClick={() => onSearchKeyword(k)}
                    >
                      {k}
                    </span>
                  ))}
                  {kw.length > 8 && (
                    <span className="text-[10px] text-muted-foreground/30">
                      +{kw.length - 8} more
                    </span>
                  )}
                </div>
              )}

              {/* Meta + Actions */}
              <div className="flex items-center gap-3 flex-wrap border-t border-border/30 pt-4 mt-4">
                {/* Stats */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground/40">
                  {paper.wordCount && paper.wordCount > 0 && (
                    <span className="flex items-center gap-1.5">
                      <BookOpen className="w-3 h-3" />
                      {paper.wordCount.toLocaleString()}
                    </span>
                  )}
                  {paper.sectionCount && paper.sectionCount > 0 && (
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-3 h-3" />
                      {paper.sectionCount} sec
                    </span>
                  )}
                  {paper.figureCount && paper.figureCount > 0 && (
                    <span className="flex items-center gap-1.5">
                      <Image className="w-3 h-3" />
                      {paper.figureCount} fig
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    {estimateReadingTime(paper.wordCount)}
                  </span>
                  {formatCost(paper.generationCost) && (
                    <span className="flex items-center gap-1.5 text-amber-600/50 dark:text-amber-400/50" title={
                      paper.inputTokens && paper.outputTokens
                        ? `Input: ${formatTokens(paper.inputTokens)} tokens · Output: ${formatTokens(paper.outputTokens)} tokens`
                        : undefined
                    }>
                      <DollarSign className="w-3 h-3" />
                      {formatCost(paper.generationCost)}
                    </span>
                  )}
                </div>

                <div className="flex-1" />

                {/* Action buttons */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onNavigate(`/journal/${paper.id}`)}
                    className="h-8 px-3 rounded-lg gap-1.5 text-xs font-semibold text-muted-foreground hover:text-primary hover:bg-primary/5 transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Read
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleCitation(paper.id)}
                    className={`h-8 px-3 rounded-lg gap-1.5 text-xs font-semibold transition-all ${
                      isCitationOpen
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:text-primary hover:bg-primary/5'
                    }`}
                  >
                    <Quote className="w-3.5 h-3.5" />
                    Cite
                  </Button>

                  <a
                    href={`${API_BASE_URL}${paper.downloadUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary/70 hover:text-primary transition-all h-8 px-3 rounded-lg hover:bg-primary/5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    PDF
                  </a>

                  {paper.projectZipUrl && (
                    <a
                      href={`${API_BASE_URL}${paper.projectZipUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground/50 hover:text-foreground transition-all h-8 px-3 rounded-lg hover:bg-muted/50"
                    >
                      <Archive className="w-3.5 h-3.5" />
                      LaTeX
                    </a>
                  )}
                </div>
              </div>

              {/* Citation Panel */}
              <AnimatePresence>
                {isCitationOpen && <CitationPanel paper={paper} />}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </motion.article>
  );
}
