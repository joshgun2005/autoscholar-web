import { motion } from "framer-motion";
import { type LucideIcon } from "lucide-react";

export function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function SectionHeading({ icon: Icon, title, subtitle }: { icon: LucideIcon; title: string; subtitle?: string }) {
  return (
    <div className="mb-10">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-foreground">{title}</h2>
      </div>
      <div className="rule-editorial mb-4" />
      {subtitle && <p className="text-muted-foreground font-serif leading-relaxed max-w-2xl">{subtitle}</p>}
    </div>
  );
}
