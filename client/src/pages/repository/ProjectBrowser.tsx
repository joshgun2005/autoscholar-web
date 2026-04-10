import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FolderOpen, FileText, Download, Search,
  ArrowLeft, Package, Terminal, Layers,
  Copy, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Project, TreeEntry } from "./types";
import { formatSize } from "./types";
import { TreeNode } from "./TreeNode";
import { FileViewer } from "./FileViewer";

export function ProjectBrowser({ project, onBack }: { project: Project; onBack: () => void }) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [filterText, setFilterText] = useState("");

  const hasZip = !!project.projectZipUrl;
  const { data: treeData, isLoading } = useQuery<{ tree: TreeEntry[]; fileCount: number }>({
    queryKey: ["/api/repository", project.id, "tree"],
    queryFn: async () => {
      const res = await fetch(`/api/repository/${project.id}/tree`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    enabled: hasZip,
  });

  const filterTree = useCallback((entries: TreeEntry[], query: string): TreeEntry[] => {
    if (!query) return entries;
    const q = query.toLowerCase();
    return entries.reduce<TreeEntry[]>((acc, entry) => {
      if (entry.type === "file" && entry.name.toLowerCase().includes(q)) {
        acc.push(entry);
      } else if (entry.type === "dir" && entry.children) {
        const filtered = filterTree(entry.children, query);
        if (filtered.length > 0) acc.push({ ...entry, children: filtered });
      }
      return acc;
    }, []);
  }, []);

  const filteredTree = useMemo(
    () => (treeData ? filterTree(treeData.tree, filterText) : []),
    [treeData, filterText, filterTree]
  );

  const safeName = (project.title || "project").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 60);
  const curlExample = `curl -L -o "${safeName}_project.zip" "${window.location.origin}/api/repository/${project.id}/download"`;
  const [curlCopied, setCurlCopied] = useState(false);

  const handleCopyCurl = useCallback(() => {
    navigator.clipboard.writeText(curlExample);
    setCurlCopied(true);
    setTimeout(() => setCurlCopied(false), 2000);
  }, [curlExample]);

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 border-b border-border/40 bg-card/60 backdrop-blur-sm">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3 mb-2">
            <Button variant="ghost" size="sm" className="h-7 px-2 -ml-2" onClick={onBack}>
              <ArrowLeft className="h-3.5 w-3.5" />
            </Button>
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Package className="h-4.5 w-4.5 text-primary shrink-0" />
              <h2 className="text-base font-display font-bold text-foreground truncate">{project.title}</h2>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {project.downloadUrl && (
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1" asChild>
                  <a href={project.downloadUrl}><FileText className="h-3 w-3" /> PDF</a>
                </Button>
              )}
              {project.projectZipUrl && (
                <Button variant="default" size="sm" className="h-7 text-xs gap-1" asChild>
                  <a href={`/api/repository/${project.id}/download`}><Download className="h-3 w-3" /> ZIP</a>
                </Button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap text-[11px] text-muted-foreground">
            {project.domain && <Badge variant="outline" className="text-[9px] rounded-md">{project.domain}</Badge>}
            {project.asid && <span className="font-mono">{project.asid}</span>}
            {treeData && <span><Layers className="inline h-3 w-3 mr-0.5" />{treeData.fileCount} files</span>}
            {project.zipSize && <span>{formatSize(project.zipSize)}</span>}
          </div>
          {/* Terminal block — only shown when project ZIP exists */}
          {project.projectZipUrl && (
            <div className="mt-2.5 flex items-center gap-2 px-3 py-2 rounded-lg bg-[hsl(224_30%_5%)] dark:bg-[hsl(224_30%_3%)] border border-border/20 font-mono text-[10px] text-emerald-400/80">
              <Terminal className="h-3 w-3 shrink-0 text-emerald-500/50" />
              <span className="text-muted-foreground/50 mr-1">$</span>
              <code className="flex-1 truncate select-all">{curlExample}</code>
              <button
                onClick={handleCopyCurl}
                className="shrink-0 p-1 rounded hover:bg-white/10 transition-colors text-emerald-400/60 hover:text-emerald-400"
                title="Copy to clipboard"
              >
                {curlCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 flex min-h-0">
        <div className="w-64 shrink-0 border-r border-border/40 flex flex-col bg-card/30">
          <div className="p-2 border-b border-border/30">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/30 border border-border/40">
              <Search className="h-3 w-3 text-muted-foreground/50" />
              <input type="text" value={filterText} onChange={(e) => setFilterText(e.target.value)} placeholder="Filter files..." className="flex-1 bg-transparent text-[11px] outline-none placeholder:text-muted-foreground/40 text-foreground" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-1.5">
            {isLoading && <div className="space-y-1.5 p-2">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-5 w-full" />)}</div>}
            {!isLoading && filteredTree.map((entry) => (
              <TreeNode key={entry.path} entry={entry} depth={0} projectId={project.id} selectedPath={selectedFile} onSelect={setSelectedFile} />
            ))}
          </div>
        </div>
        <div className="flex-1 min-w-0 bg-background">
          {selectedFile ? (
            <FileViewer projectId={project.id} filePath={selectedFile} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
              <FolderOpen className="h-12 w-12 text-muted-foreground/20" />
              <p className="text-sm">Select a file to preview</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
