import { motion } from "framer-motion";
import { ArrowRight, ChevronRight, FlaskConical, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PIPELINE } from "./constants";

interface PipelineSectionProps {
  onNavigate: (path: string) => void;
}

export function PipelineSection({ onNavigate }: PipelineSectionProps) {
  return (
    <section className="relative z-10 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Section header */}
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/30 bg-card/40 mb-6"
          >
            <Cpu className="h-3.5 w-3.5 text-muted-foreground/50" />
            <span className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-[0.18em]">Autonomous Multi-Agent Pipeline</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-foreground mb-6 tracking-tight"
          >
            How AutoScholar Generates Research
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto font-serif leading-[1.7]"
          >
            Each agent is a domain specialist in the research workflow. Together they execute the complete scientific pipeline — from literature gap to compiled PDF — with Popper rejecting anything below standard.
          </motion.p>
        </div>

        {/* Pipeline flow — horizontal timeline */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="hidden sm:flex items-center justify-center gap-0 mb-16"
        >
          {PIPELINE.map((agent, i) => (
            <div key={agent.name} className="flex items-center">
              <div className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-lg border text-xs font-semibold transition-all duration-300 hover:scale-105 cursor-default",
                agent.bg, agent.text, agent.border
              )}>
                <span className="text-[9px] font-bold opacity-50">{agent.step}</span>
                <agent.icon className="h-3.5 w-3.5" />
                {agent.name}
              </div>
              {i < PIPELINE.length - 1 && (
                <div className="flex items-center mx-1">
                  <div className="w-6 h-[2px] bg-border/40" />
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/25 -ml-1" />
                </div>
              )}
            </div>
          ))}
        </motion.div>

        {/* Agent detail cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PIPELINE.map((agent, i) => (
            <motion.div
              key={agent.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.06 }}
              className={cn(
                "group relative rounded-xl border p-6 transition-all duration-300",
                "bg-card/40 hover:bg-card/70",
                "hover:shadow-md hover:-translate-y-0.5",
                "border-border/30 hover:border-border/50"
              )}
            >
              <div className={cn("absolute inset-x-0 top-0 h-px rounded-t-xl bg-gradient-to-r opacity-30 group-hover:opacity-60 transition-opacity", agent.color)} />
              <div className="flex items-start gap-4">
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-gradient-to-br shadow-sm group-hover:shadow-md transition-shadow", agent.color)}>
                  <agent.icon className="h-4.5 w-4.5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[9px] font-medium text-muted-foreground/35">{agent.step}</span>
                    <h3 className="text-sm font-semibold text-foreground">{agent.name}</h3>
                    <span className={cn("text-[9px] font-medium uppercase tracking-[0.12em]", agent.text)}>{agent.role}</span>
                  </div>
                  <p className="text-[13px] text-muted-foreground leading-relaxed">{agent.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Button variant="outline" size="lg" onClick={() => onNavigate("/methodology")} className="gap-2.5 rounded-xl">
            <FlaskConical className="h-4 w-4" />
            Full Methodology & Scoring Rubric
            <ArrowRight className="h-4 w-4" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
