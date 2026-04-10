import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  GraduationCap, ArrowLeft, Library, FileText, Download,
  BookOpen, DollarSign, TrendingUp, Image,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { PublishedPaper } from "./types";

function AnimatedStat({ icon: Icon, value, label, delay }: { icon: React.ElementType; value: string; label: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay }}
      className="group relative"
    >
      <div className="relative rounded-xl border border-border/30 bg-card/40 p-4 text-center transition-all duration-300 hover:border-primary/20 hover:bg-card/70 hover:-translate-y-0.5">
        <div className="relative">
          <Icon className="w-4 h-4 text-primary/40 mx-auto mb-2.5" />
          <p className="metric-number text-2xl text-foreground">{value}</p>
          <p className="metric-label mt-1">{label}</p>
        </div>
      </div>
    </motion.div>
  );
}

interface JournalHeaderProps {
  papers: PublishedPaper[] | undefined;
  totalWords: number;
  totalFigures: number;
  totalCost: number;
  domains: string[];
  downloadAllBibtex: () => void;
}

export function JournalHeader({ papers, totalWords, totalFigures, totalCost, domains, downloadAllBibtex }: JournalHeaderProps) {
  const [, setLocation] = useLocation();

  return (
    <>
      {/* Header */}
      <header className="sticky top-0 z-50 w-full glass-strong">
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
        <div className="container flex h-14 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setLocation('/')} className="gap-2 rounded-xl">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline font-semibold">Back</span>
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
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="hidden sm:flex text-[10px] font-mono font-display gap-1.5 rounded-lg">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Open Access
            </Badge>
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Masthead */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-16"
      >
        <div className="relative text-center">
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent -translate-y-1/2"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-primary/[0.04] border border-primary/15 text-primary text-[11px] font-medium tracking-widest uppercase mb-8 backdrop-blur-sm"
          >
            <Library className="w-3.5 h-3.5" />
            <span>Open Access Academic Review</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-monumental text-5xl sm:text-6xl md:text-7xl lg:text-8xl mb-5"
          >
            <span className="text-foreground">AutoScholar</span>
            {" "}
            <span className="bg-gradient-to-r from-primary via-violet-500 to-purple-500 bg-clip-text text-transparent">Journal</span>
          </motion.h1>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="rule-editorial mx-auto mb-6"
          />

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-muted-foreground max-w-2xl mx-auto leading-relaxed text-base md:text-lg font-serif"
          >
            A curated archive of autonomously generated research. Each article is produced through a six-agent pipeline — from literature gap discovery to peer-validated, publication-grade LaTeX PDF.
          </motion.p>

          {papers && papers.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-10 max-w-4xl mx-auto">
              <AnimatedStat icon={FileText} value={String(papers.length)} label="Papers" delay={0.5} />
              <AnimatedStat icon={BookOpen} value={`${Math.round(totalWords / 1000)}k`} label="Words" delay={0.6} />
              <AnimatedStat icon={Image} value={String(totalFigures)} label="Figures" delay={0.7} />
              <AnimatedStat icon={TrendingUp} value={String(domains.length)} label="Domains" delay={0.8} />
              {totalCost > 0 && (
                <AnimatedStat icon={DollarSign} value={`$${totalCost.toFixed(2)}`} label="API Cost" delay={0.9} />
              )}
            </div>
          )}

          {papers && papers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.9 }}
              className="mt-8 flex items-center justify-center gap-3"
            >
              <button
                onClick={downloadAllBibtex}
                className="group inline-flex items-center gap-2.5 px-5 py-2.5 text-xs font-semibold text-primary/80 hover:text-primary bg-primary/5 hover:bg-primary/10 border border-primary/15 hover:border-primary/30 rounded-xl transition-all duration-300 hover:shadow-md hover:shadow-primary/10"
              >
                <Download className="w-3.5 h-3.5 group-hover:animate-bounce" />
                Download BibTeX ({papers.length} papers)
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </>
  );
}
