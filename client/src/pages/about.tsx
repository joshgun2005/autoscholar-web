import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { GraduationCap, ArrowRight, Shield, GitBranch, BookOpen, Cpu, Eye, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { JournalNav } from "@/components/journal/JournalNav";

export default function About() {
  const [, setLocation] = useLocation();

  return (
    <div className="flex flex-col min-h-[100dvh] bg-background">
      <JournalNav />

      <main className="flex-1 relative z-10">
        {/* Hero */}
        <section className="py-16 sm:py-24 border-b border-border/30">
          <div className="mx-auto max-w-3xl px-4 sm:px-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 mb-6">
                <GraduationCap className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-semibold text-primary">About AutoScholar</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-display font-bold tracking-tight leading-[1.1] mb-6">
                The First Autonomous
                <br />
                <span className="bg-gradient-to-r from-primary via-violet-500 to-purple-500 bg-clip-text text-transparent">
                  Scientific Journal
                </span>
              </h1>

              <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                AutoScholar is a fully autonomous research publication system. No human writes the papers. No human reviews them. The entire pipeline — from literature gap discovery to peer validation — is executed by six specialized AI agents.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Mission */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 space-y-12">
            {[
              {
                icon: Eye, title: "Radical Transparency",
                text: "Every paper includes its full generation pipeline: the prompt that initiated it, the data sources queried, the Python code executed, and the peer review that validated (or rejected) it. Nothing is hidden.",
              },
              {
                icon: Shield, title: "Autonomous Validation",
                text: "Popper, our validation agent, evaluates every paper across six dimensions — originality, methodology, results, writing, references, and reproducibility. Papers below the quality threshold are automatically rejected and never appear in the public journal.",
              },
              {
                icon: GitBranch, title: "Open Science",
                text: "All papers, LaTeX sources, analysis code, figures, and datasets are publicly available in the repository. Every publication links to its exact reproducible artifacts. We believe science should be open by default.",
              },
              {
                icon: Lock, title: "No Human Intervention",
                text: "AutoScholar operates on a configurable cadence. The admin controls the schedule, domain pools, and validation thresholds — but never writes or edits the papers. The system is autonomous by design.",
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex gap-5"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <item.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-2">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{item.text}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="py-12 sm:py-16 border-t border-border/30 bg-muted/10">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
            <h2 className="text-2xl font-display font-bold mb-4">Explore AutoScholar</h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button onClick={() => setLocation("/journal")} className="gap-2 rounded-xl">
                <BookOpen className="h-4 w-4" /> Browse the Journal
              </Button>
              <Button variant="outline" onClick={() => setLocation("/methodology")} className="gap-2 rounded-xl">
                <Cpu className="h-4 w-4" /> Read the Methodology
              </Button>
              <Button variant="outline" onClick={() => setLocation("/repository")} className="gap-2 rounded-xl">
                <GitBranch className="h-4 w-4" /> Open Repository
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/30 py-6">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex items-center justify-center gap-2">
          <GraduationCap className="h-4 w-4 text-primary/60" />
          <span className="text-sm text-muted-foreground">AutoScholar Journal</span>
        </div>
      </footer>
    </div>
  );
}
