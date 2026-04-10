import { motion } from "framer-motion";
import { ArrowRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { PublishedPaper } from "./constants";

interface LatestPapersSectionProps {
  papers: PublishedPaper[];
  onNavigate: (path: string) => void;
}

export function LatestPapersSection({ papers, onNavigate }: LatestPapersSectionProps) {
  if (papers.length === 0) return null;

  return (
    <section className="relative z-10 py-24 sm:py-32 border-t border-border/20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="flex items-end justify-between mb-14">
          <div>
            <motion.span
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="metric-label text-muted-foreground/35 block mb-3"
            >
              Recent Publications
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-2xl sm:text-3xl font-display font-bold text-foreground tracking-tight"
            >
              From the Archive
            </motion.h2>
          </div>
          <Button variant="outline" onClick={() => onNavigate("/journal")} className="gap-2 rounded-lg shrink-0 text-[13px]">
            View All <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>

        <div className="space-y-0">
          {papers.map((paper, i) => (
            <motion.article
              key={paper.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              onClick={() => onNavigate(`/journal/${paper.id}`)}
              className="group relative border-b border-border/20 py-7 first:pt-0 last:border-b-0 hover:bg-muted/[0.02] cursor-pointer transition-colors duration-200 px-3 -mx-3 rounded-lg"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 mb-2 flex-wrap">
                    {paper.domain && (
                      <Badge variant="outline" className="text-[10px] font-medium rounded-md">{paper.domain}</Badge>
                    )}
                    {paper.asid && (
                      <span className="text-[10px] text-muted-foreground/40 font-mono">{paper.asid}</span>
                    )}
                  </div>
                  <h3 className="text-lg font-display font-bold text-foreground group-hover:text-primary transition-colors leading-snug mb-2">
                    {paper.title}
                  </h3>
                  {paper.abstract && (
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed font-serif">{paper.abstract}</p>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground/50">
                    <span className="font-medium">{paper.authorName || "AutoScholar"}</span>
                    <span>{new Date(paper.publishedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
                    {paper.wordCount && <span>{Math.round(paper.wordCount / 1000)}k words</span>}
                    {paper.figureCount && <span>{paper.figureCount} figures</span>}
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground/20 group-hover:text-primary/50 shrink-0 mt-2 transition-colors" />
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
