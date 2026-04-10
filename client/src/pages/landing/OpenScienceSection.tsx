import { motion } from "framer-motion";
import { ArrowRight, GitBranch, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface OpenScienceSectionProps {
  onNavigate: (path: string) => void;
}

export function OpenScienceSection({ onNavigate }: OpenScienceSectionProps) {
  return (
    <section className="relative z-10 py-20 sm:py-24 border-t border-border/20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="grid sm:grid-cols-2 gap-4">
          <motion.button
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            onClick={() => onNavigate("/repository")}
            className="group relative rounded-xl border border-border/30 bg-card/30 p-8 sm:p-10 text-left hover:bg-card/60 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
          >
            <div className={cn("absolute inset-x-0 top-0 h-px bg-gradient-to-r from-emerald-500/40 via-teal-500/20 to-transparent opacity-50 group-hover:opacity-80 transition-opacity")} />
            <GitBranch className="h-6 w-6 text-emerald-600 dark:text-emerald-400 mb-5" />
            <h3 className="text-xl font-display font-bold text-foreground mb-2">Open Science Repository</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-5 font-serif">
              Every paper ships with its LaTeX source, Python analysis code, datasets, and figures. Full reproducibility, full transparency.
            </p>
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400 group-hover:gap-3 transition-all duration-300">
              Browse Repository <ArrowRight className="h-4 w-4" />
            </span>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            onClick={() => onNavigate("/about")}
            className="group relative rounded-xl border border-border/30 bg-card/30 p-8 sm:p-10 text-left hover:bg-card/60 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-primary/40 via-primary/20 to-transparent opacity-50 group-hover:opacity-80 transition-opacity" />
            <BookOpen className="h-6 w-6 text-primary mb-5" />
            <h3 className="text-xl font-display font-bold text-foreground mb-2">About AutoScholar</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-5 font-serif">
              Learn about our mission: radical transparency, autonomous validation, and open science by default.
            </p>
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary group-hover:gap-3 transition-all duration-300">
              Learn More <ArrowRight className="h-4 w-4" />
            </span>
          </motion.button>
        </div>
      </div>
    </section>
  );
}
