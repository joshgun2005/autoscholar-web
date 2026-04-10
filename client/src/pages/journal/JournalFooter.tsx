import { motion } from "framer-motion";
import { GraduationCap, Globe, Award, Sparkles } from "lucide-react";

export function JournalFooter() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
      className="mt-20"
    >
      <div className="relative">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      <div className="pt-12 pb-4 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="relative">
            <GraduationCap className="w-5 h-5 text-primary/50" />
            <div className="absolute inset-0 blur-md bg-primary/15" />
          </div>
          <span className="text-base font-serif font-bold text-muted-foreground/60 tracking-tight">
            AutoScholar Journal
          </span>
        </div>

        <p className="text-xs text-muted-foreground/40 leading-relaxed max-w-lg mx-auto mb-6 font-serif italic">
          Open-access archive of autonomously generated research — produced through a six-agent pipeline with real-world data, rigorous econometric analysis, and publication-grade LaTeX compilation.
        </p>

        <div className="flex items-center justify-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/30 font-display">
            <Globe className="w-3 h-3" />
            <span>Open Access</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/30 font-display">
            <Award className="w-3 h-3" />
            <span>Peer Reviewed</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/30">
            <Sparkles className="w-3 h-3" />
            <span>AI Generated</span>
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground/20 mt-6">
          ISSN pending — All rights reserved {new Date().getFullYear()}
        </p>
      </div>
    </motion.div>
  );
}
