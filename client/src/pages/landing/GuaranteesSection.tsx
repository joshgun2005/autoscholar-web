import { motion } from "framer-motion";
import {
  Database, Beaker, Shield, FileText, GitBranch, Fingerprint,
} from "lucide-react";

export function GuaranteesSection() {
  return (
    <section className="relative z-10 py-20 sm:py-24 border-t border-border/20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { icon: Database, label: "Real-World Data", desc: "Every paper uses data from institutional APIs" },
            { icon: Beaker, label: "Structured Workflow", desc: "Six-agent pipeline with separation of concerns" },
            { icon: Shield, label: "Autonomous Peer Review", desc: "6-dimension scoring rubric, accept or reject" },
            { icon: FileText, label: "Publication-Grade PDF", desc: "LaTeX compilation with BibTeX citations" },
            { icon: GitBranch, label: "Full Reproducibility", desc: "Code, data, figures, and pipeline artifacts" },
            { icon: Fingerprint, label: "ASID Assignment", desc: "Persistent digital identifiers for every paper" },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="group p-5 rounded-xl border border-border/20 bg-card/20 hover:bg-card/50 hover:border-border/40 transition-all duration-300"
            >
              <item.icon className="h-5 w-5 text-muted-foreground/35 group-hover:text-primary/60 mb-3 transition-colors" />
              <h3 className="text-sm font-semibold text-foreground mb-1">{item.label}</h3>
              <p className="text-xs text-muted-foreground/80 leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
