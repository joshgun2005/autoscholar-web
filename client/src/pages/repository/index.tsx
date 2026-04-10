import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  GraduationCap, FolderOpen, Search,
  GitBranch, Code2, BarChart3, FileText,
  Database, Fingerprint, Archive,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { JournalNav } from "@/components/journal/JournalNav";
import type { Project } from "./types";
import { ProjectBrowser } from "./ProjectBrowser";
import { ProjectListItem } from "./ProjectListItem";
import { CurlBlock } from "./CurlBlock";

export default function Repository() {
  const [, setLocation] = useLocation();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ["/api/repository"],
  });

  const filtered = useMemo(() => {
    if (!searchQuery) return projects;
    const q = searchQuery.toLowerCase();
    return projects.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.domain?.toLowerCase().includes(q) ||
      p.asid?.toLowerCase().includes(q)
    );
  }, [projects, searchQuery]);

  if (selectedProject) {
    return (
      <div className="flex flex-col h-[100dvh] bg-background">
        <ProjectBrowser project={selectedProject} onBack={() => setSelectedProject(null)} />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[100dvh] bg-background relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.03),transparent_50%)]" />
        <div className="absolute inset-0 data-grid-pattern opacity-[0.06]" />
      </div>

      <JournalNav />

      <main className="flex-1 z-10">
        {/* Hero */}
        <section className="py-16 sm:py-24 border-b border-border/30">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-emerald-500/15 bg-emerald-500/[0.04] mb-8">
                <GitBranch className="h-3.5 w-3.5 text-emerald-500" />
                <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 tracking-widest uppercase">Open Science Archive</span>
              </div>

              <h1 className="text-monumental text-4xl sm:text-5xl md:text-6xl mb-5">
                Research Repository
              </h1>

              <div className="rule-editorial mb-6" style={{ background: "linear-gradient(90deg, hsl(152 69% 38%), hsl(199 89% 42%))" }} />

              <p className="text-lg text-muted-foreground leading-relaxed font-serif max-w-2xl mb-8">
                Browse the full scientific artifacts behind each publication — source code, datasets, figures, LaTeX manuscripts, and pipeline configuration files.
              </p>

              {/* Artifact types */}
              <div className="flex items-center gap-4 flex-wrap text-[10px] font-medium uppercase tracking-[0.15em] text-muted-foreground/40">
                {[
                  { icon: Code2, label: "Code" },
                  { icon: BarChart3, label: "Figures" },
                  { icon: FileText, label: "LaTeX" },
                  { icon: Database, label: "Datasets" },
                  { icon: Fingerprint, label: "ASID" },
                  { icon: Archive, label: "Pipeline Artifacts" },
                ].map(({ icon: Icon, label }) => (
                  <span key={label} className="flex items-center gap-1.5">
                    <Icon className="h-3 w-3" />{label}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Search + Projects */}
        <section className="py-10">
          <div className="mx-auto max-w-5xl px-4 sm:px-6">
            {/* Search + stats */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border/50 bg-card/60 focus-within:border-primary/30 focus-within:ring-1 focus-within:ring-primary/10 transition-all">
                <Search className="h-4 w-4 text-muted-foreground/40" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search projects by title, domain, or ASID..."
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/40 text-foreground"
                />
              </div>
              <Badge variant="secondary" className="text-xs shrink-0 rounded-md">
                {projects.length} project{projects.length !== 1 ? "s" : ""}
              </Badge>
            </div>

            {/* Programmatic access */}
            <CurlBlock command={`curl -L -o project.zip "${window.location.origin}/api/repository/<id>/download"`} label="Programmatic Access" />

            {/* Loading */}
            {isLoading && (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-xl" />
                ))}
              </div>
            )}

            {/* Empty state */}
            {!isLoading && filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
                <FolderOpen className="h-16 w-16 text-muted-foreground/10 mb-4" />
                <p className="text-base font-display font-bold">No projects yet</p>
                <p className="text-sm text-muted-foreground/50 mt-1">Generated research papers with project archives will appear here.</p>
              </div>
            )}

            {/* Project list */}
            <div className="space-y-3">
              {filtered.map((project) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <ProjectListItem project={project} onClick={() => setSelectedProject(project)} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/30 py-8 z-10 relative">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 flex items-center justify-center gap-2">
          <GraduationCap className="h-4 w-4 text-primary/40" />
          <span className="text-xs text-muted-foreground/40">AutoScholar Journal — Open Science Repository</span>
        </div>
      </footer>
    </div>
  );
}
