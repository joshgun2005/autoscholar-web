import {
  Calendar, Download, BookOpen, Image, Archive, Tag,
  Users, Clock, FileText, Eye, Sparkles, ArrowRight, User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { API_BASE_URL } from "@/config";
import { getDomainStyle } from "@/utils/domainStyles";

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

export function FeaturedPaper({ paper, onNavigate, onDomainFilter }: {
  paper: PublishedPaper;
  onNavigate: (path: string) => void;
  onDomainFilter: (domain: string) => void;
}) {
  const domainStyle = getDomainStyle(paper.domain);
  const author = formatAuthors(paper.authors);
  const affiliation = formatAffiliation(paper.authors);
  const kw = parseKeywords(paper.keywords);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.15 }}
      className="mb-12"
    >
      {/* Section label */}
      <div className="flex items-center gap-2.5 mb-4">
        <div className="relative">
          <Sparkles className="w-4 h-4 text-primary" />
          <div className="absolute inset-0 blur-sm bg-primary/30" />
        </div>
        <span className="text-xs font-bold text-primary uppercase tracking-widest">Latest Publication</span>
        <div className="h-px flex-1 bg-gradient-to-r from-primary/20 to-transparent" />
      </div>

      {/* Featured card */}
      <div
        className="group relative rounded-2xl overflow-hidden cursor-pointer shadow-md transition-all duration-300 hover:shadow-xl hover:shadow-primary/10"
        onClick={() => onNavigate(`/journal/${paper.id}`)}
      >
        {/* Animated gradient border */}
        <div className="absolute inset-0 rounded-2xl p-px bg-gradient-to-br from-primary/30 via-border/50 to-primary/10 group-hover:from-primary/50 group-hover:via-primary/20 group-hover:to-primary/30 transition-all duration-500">
          <div className="w-full h-full rounded-[15px] bg-card" />
        </div>

        {/* Accent gradient overlay at top */}
        <div className={`absolute inset-x-0 top-0 h-32 bg-gradient-to-b ${domainStyle.accent} opacity-30 group-hover:opacity-50 transition-opacity duration-500`} />

        {/* Content */}
        <div className="relative p-7 sm:p-10">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main content */}
            <div className="flex-1 min-w-0">
              {/* Meta badges */}
              <div className="flex items-center gap-2.5 mb-5 flex-wrap">
                {paper.domain && (
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-bold px-3 py-1 rounded-lg uppercase tracking-wider cursor-pointer transition-all hover:scale-105 ${domainStyle.bg} ${domainStyle.text} ${domainStyle.border}`}
                    onClick={(e) => { e.stopPropagation(); onDomainFilter(paper.domain!); }}
                  >
                    {paper.domain}
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground/60 flex items-center gap-1.5 font-medium">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(paper.publishedAt), "MMMM d, yyyy")}
                </span>
                {paper.asid && (
                  <Badge variant="outline" className="text-[10px] font-medium font-mono px-2 py-0.5 rounded-md text-muted-foreground/50 border-border/30">
                    ASID: {paper.asid}
                  </Badge>
                )}
              </div>

              {/* Title — large serif */}
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-display font-bold text-foreground leading-tight mb-4 group-hover:text-primary transition-colors duration-300">
                {paper.title}
              </h2>

              {/* Authors */}
              <p className="text-sm text-muted-foreground mb-1.5 flex items-center gap-2">
                <Users className="w-4 h-4 text-primary/40" />
                <span className="font-semibold text-foreground/80">{author}</span>
                {affiliation && <span className="text-muted-foreground/50">— {affiliation}</span>}
              </p>

              {/* Generated by user */}
              {paper.authorName && (
                <p className="text-xs text-muted-foreground/50 mb-5 flex items-center gap-2 ml-[1.5rem]">
                  <span className={`w-6 h-6 rounded-full bg-gradient-to-br ${getAvatarColor(paper.authorName)} flex items-center justify-center flex-shrink-0`}>
                    <span className="text-[9px] font-bold text-white leading-none">{getInitials(paper.authorName)}</span>
                  </span>
                  Generated by <span className="font-semibold text-foreground/60">{paper.authorName}</span>
                </p>
              )}

              {/* Abstract */}
              {paper.abstract && (
                <p className="text-sm text-muted-foreground/80 leading-[1.8] line-clamp-4 mb-6 max-w-3xl font-serif">
                  {paper.abstract}
                </p>
              )}

              {/* Keywords */}
              {kw.length > 0 && (
                <div className="flex items-center gap-2 mb-7 flex-wrap">
                  <Tag className="w-3 h-3 text-muted-foreground/25" />
                  {kw.slice(0, 6).map((k, i) => (
                    <span
                      key={i}
                      className="text-[10px] text-muted-foreground/60 bg-muted/40 hover:bg-muted/70 px-2.5 py-1 rounded-lg transition-colors cursor-default"
                    >
                      {k}
                    </span>
                  ))}
                  {kw.length > 6 && (
                    <span className="text-[10px] text-muted-foreground/30">+{kw.length - 6}</span>
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex items-center gap-3 flex-wrap">
                <Button
                  size="lg"
                  className="rounded-xl gap-2.5 text-sm font-semibold h-11 px-6 shadow-md shadow-primary/15 hover:shadow-lg hover:shadow-primary/25 transition-all"
                  onClick={(e) => { e.stopPropagation(); onNavigate(`/journal/${paper.id}`); }}
                >
                  <Eye className="w-4 h-4" />
                  Read Paper
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Button>
                <a
                  href={`${API_BASE_URL}${paper.downloadUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-primary/80 hover:text-primary transition-all h-11 px-5 rounded-xl hover:bg-primary/5 border border-primary/15 hover:border-primary/30"
                >
                  <Download className="w-4 h-4" />
                  PDF
                </a>
                {paper.projectZipUrl && (
                  <a
                    href={`${API_BASE_URL}${paper.projectZipUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-all h-11 px-5 rounded-xl hover:bg-muted/50 border border-border/50 hover:border-border"
                  >
                    <Archive className="w-4 h-4" />
                    LaTeX Source
                  </a>
                )}
              </div>
            </div>

            {/* Right side stats panel */}
            <div className="lg:w-52 flex lg:flex-col gap-3 lg:gap-3 flex-wrap lg:justify-center lg:border-l lg:border-border/30 lg:pl-8">
              {paper.wordCount && paper.wordCount > 0 && (
                <div className="flex items-center gap-3 text-sm text-muted-foreground rounded-xl glass-subtle inner-shadow px-4 py-2.5">
                  <BookOpen className="w-4 h-4 text-primary/50 flex-shrink-0" />
                  <div>
                    <div className="font-bold text-foreground tabular-nums">{paper.wordCount.toLocaleString()}</div>
                    <div className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">words</div>
                  </div>
                </div>
              )}
              {paper.sectionCount && paper.sectionCount > 0 && (
                <div className="flex items-center gap-3 text-sm text-muted-foreground rounded-xl glass-subtle inner-shadow px-4 py-2.5">
                  <FileText className="w-4 h-4 text-primary/50 flex-shrink-0" />
                  <div>
                    <div className="font-bold text-foreground tabular-nums">{paper.sectionCount}</div>
                    <div className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">sections</div>
                  </div>
                </div>
              )}
              {paper.figureCount && paper.figureCount > 0 && (
                <div className="flex items-center gap-3 text-sm text-muted-foreground rounded-xl glass-subtle inner-shadow px-4 py-2.5">
                  <Image className="w-4 h-4 text-primary/50 flex-shrink-0" />
                  <div>
                    <div className="font-bold text-foreground tabular-nums">{paper.figureCount}</div>
                    <div className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">figures</div>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm text-muted-foreground rounded-xl glass-subtle inner-shadow px-4 py-2.5">
                <Clock className="w-4 h-4 text-primary/50 flex-shrink-0" />
                <div>
                  <div className="font-bold text-foreground">{estimateReadingTime(paper.wordCount)}</div>
                  <div className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">read time</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
