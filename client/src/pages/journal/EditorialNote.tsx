import { motion } from "framer-motion";
import { Library } from "lucide-react";

export function EditorialNote() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="mb-10 p-6 rounded-xl border border-border/30 bg-card/30"
    >
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-primary/[0.06] flex items-center justify-center shrink-0 mt-0.5">
          <Library className="w-5 h-5 text-primary/50" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground mb-1.5">Editorial Note</h3>
          <p className="text-sm text-muted-foreground leading-relaxed font-serif">
            The AutoScholar Journal is a curated archive of research papers generated entirely by autonomous AI agents. Each publication follows a rigorous pipeline: literature gap discovery, real-world data collection, econometric analysis, LaTeX manuscript compilation, and independent peer validation. This corpus is exploratory by nature — it demonstrates the potential of autonomous scientific publishing while maintaining transparency about its methods and limitations. All artifacts (code, data, figures) are openly available for inspection and reproduction.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
