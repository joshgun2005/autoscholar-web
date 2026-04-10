import {
  GitBranch, BarChart3, Layers, Archive, Calendar, Hash, ChevronRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Project } from "./types";
import { formatSize } from "./types";

export function ProjectListItem({ project, onClick }: { project: Project; onClick: () => void }) {
  const date = new Date(project.publishedAt);
  return (
    <Card
      className="p-5 cursor-pointer hover:border-primary/20 hover:shadow-md transition-all duration-300 group bg-card/50"
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-primary/[0.06] flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
          <GitBranch className="h-5 w-5 text-primary/60 group-hover:text-primary transition-colors" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-display font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors mb-1.5">
            {project.title}
          </h3>
          <div className="flex items-center gap-2 flex-wrap mb-2">
            {project.domain && <Badge variant="outline" className="text-[9px] rounded-md">{project.domain}</Badge>}
            {project.template && <Badge variant="secondary" className="text-[9px] rounded-md">{project.template}</Badge>}
          </div>
          <div className="flex items-center gap-3 flex-wrap text-[10px] text-muted-foreground/50">
            {project.figureCount != null && project.figureCount > 0 && (
              <span className="flex items-center gap-1"><BarChart3 className="h-3 w-3" />{project.figureCount} figures</span>
            )}
            {project.sectionCount != null && (
              <span className="flex items-center gap-1"><Layers className="h-3 w-3" />{project.sectionCount} sections</span>
            )}
            {project.zipSize && (
              <span className="flex items-center gap-1"><Archive className="h-3 w-3" />{formatSize(project.zipSize)}</span>
            )}
            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{date.toLocaleDateString("en-CA")}</span>
            {project.asid && (
              <span className="flex items-center gap-1 font-mono"><Hash className="h-3 w-3" />{project.asid}</span>
            )}
          </div>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground/20 group-hover:text-primary/50 transition-colors shrink-0 mt-3" />
      </div>
    </Card>
  );
}
