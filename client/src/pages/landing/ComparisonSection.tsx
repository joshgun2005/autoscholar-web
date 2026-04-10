import { motion } from "framer-motion";
import { CheckCircle, Scroll, Code2, Microscope } from "lucide-react";
import { cn } from "@/lib/utils";

export function ComparisonSection() {
  return (
    <section className="relative z-10 py-24 sm:py-32 border-t border-border/20">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <div className="text-center mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl sm:text-4xl font-display font-bold text-foreground mb-5 tracking-tight"
          >
            A New Scientific Publishing Architecture
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-muted-foreground max-w-2xl mx-auto font-serif leading-[1.7]"
          >
            AutoScholar is not an AI writing tool. It is a complete autonomous research pipeline — from hypothesis to publication.
          </motion.p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              title: "Traditional Publication",
              items: ["12\u201324 months from idea to print", "Manual peer review with 3\u20136 month cycles", "Limited reproducibility artifacts", "Paywalled access"],
              accent: "border-border/40",
              icon: Scroll,
            },
            {
              title: "AI Writing Tools",
              items: ["Text generation without data", "No methodology or validation", "No figures, no code, no datasets", "No peer review process"],
              accent: "border-border/40",
              icon: Code2,
            },
            {
              title: "AutoScholar Journal",
              items: ["End-to-end in hours, not years", "Autonomous 6-dimension peer review", "Full reproducibility: code, data, figures", "Open access by default"],
              accent: "border-primary/40",
              icon: Microscope,
              highlighted: true,
            },
          ].map((col, i) => (
            <motion.div
              key={col.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className={cn(
                "rounded-xl border p-6 sm:p-8",
                col.highlighted
                  ? "bg-primary/[0.02] border-primary/15 shadow-md shadow-primary/[0.03]"
                  : "bg-card/30 border-border/20"
              )}
            >
              <col.icon className={cn("h-6 w-6 mb-4", col.highlighted ? "text-primary" : "text-muted-foreground/40")} />
              <h3 className={cn("text-lg font-bold mb-4", col.highlighted ? "text-foreground" : "text-muted-foreground/70")}>
                {col.title}
              </h3>
              <ul className="space-y-2.5">
                {col.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-muted-foreground">
                    {col.highlighted
                      ? <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      : <span className="w-1 h-1 rounded-full bg-muted-foreground/30 shrink-0 mt-2" />
                    }
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
