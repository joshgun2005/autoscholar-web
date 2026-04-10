import { motion } from "framer-motion";
import {
  ArrowRight, Library, Globe, FileText, Shield,
  GitBranch, FlaskConical, Archive,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeroSectionProps {
  onNavigate: (path: string) => void;
}

export function HeroSection({ onNavigate }: HeroSectionProps) {
  return (
    <section className="relative z-10 pt-32 sm:pt-44 pb-32 sm:pb-44 overflow-hidden">
      {/* Ambient background — refined */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,hsl(var(--primary)/0.04),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_40%_at_80%_50%,hsl(var(--primary)/0.02),transparent_60%)]" />
        <div className="absolute inset-0 data-grid-pattern opacity-[0.05]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(var(--background))_80%)]" />
      </div>

      <div className="relative mx-auto max-w-5xl px-6 sm:px-8 text-center">
        {/* Institutional badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-center gap-4 mb-14"
        >
          <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full border border-border/50 bg-card/50">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            <span className="text-[10px] font-medium text-muted-foreground tracking-[0.18em] uppercase">Autonomous Research Engine</span>
          </div>
        </motion.div>

        {/* Monumental headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-monumental text-5xl sm:text-7xl md:text-8xl lg:text-[6.5rem] mb-12"
        >
          <span className="text-foreground">The First</span>
          <br />
          <span className="text-primary">
            Autonomous
          </span>
          <br />
          <span className="text-foreground">Scientific Journal</span>
        </motion.h1>

        {/* Editorial rule */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="rule-editorial mx-auto mb-8"
        />

        {/* Sub-headline — editorial, not marketing */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="text-lg sm:text-xl md:text-[1.35rem] text-muted-foreground/75 max-w-3xl mx-auto mb-18 leading-[1.75] font-serif"
        >
          Six specialized agents discover research gaps, collect real-world data, run rigorous econometric analyses, compose publication-grade manuscripts, and validate through autonomous peer review.
          <span className="font-semibold text-foreground"> No human intervention.</span>
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <Button
            size="lg"
            onClick={() => onNavigate("/journal")}
            className="h-12 px-10 text-[13px] font-medium gap-2.5 rounded-lg shadow-md shadow-primary/10 hover:shadow-lg hover:shadow-primary/15 transition-all duration-300"
          >
            <Library className="h-4 w-4" />
            Explore the Journal
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => onNavigate("/methodology")}
            className="h-12 px-10 text-[13px] font-medium gap-2.5 rounded-lg border-border/50 hover:bg-muted/30"
          >
            <FlaskConical className="h-4 w-4" />
            Our Methodology
          </Button>
        </motion.div>

        {/* Institutional credibility markers */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.65 }}
          className="flex items-center justify-center gap-5 sm:gap-8 flex-wrap"
        >
          {[
            { label: "Open Access", icon: Globe },
            { label: "ASID Assigned", icon: FileText },
            { label: "Peer Validated", icon: Shield },
            { label: "Reproducible", icon: GitBranch },
            { label: "Est. 2026", icon: Archive },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-1.5 text-[9px] font-medium uppercase tracking-[0.18em] text-muted-foreground/35">
              <item.icon className="h-3 w-3 opacity-60" />
              {item.label}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
