import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  FolderOpen, ChevronRight, FileCode2, FileText,
  FileSpreadsheet, Image, File,
} from "lucide-react";
import type { TreeEntry } from "./types";
import { fileColor, countTreeFiles, formatSize } from "./types";

function getFileIconComponent(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (["py"].includes(ext)) return FileCode2;
  if (["tex", "bib", "md", "txt"].includes(ext)) return FileText;
  if (["csv", "tsv", "xlsx", "xls", "parquet", "json"].includes(ext)) return FileSpreadsheet;
  if (["png", "jpg", "jpeg", "svg", "pdf"].includes(ext)) return Image;
  return File;
}

export function TreeNode({
  entry, depth, projectId, selectedPath, onSelect,
}: {
  entry: TreeEntry; depth: number; projectId: string; selectedPath: string | null; onSelect: (path: string) => void;
}) {
  const [open, setOpen] = useState(depth < 1);
  const isDir = entry.type === "dir";
  const Icon = isDir ? FolderOpen : getFileIconComponent(entry.name);
  const isSelected = selectedPath === entry.path;

  if (isDir) {
    return (
      <div>
        <button
          onClick={() => setOpen(!open)}
          className={cn(
            "w-full flex items-center gap-1.5 py-1 px-1.5 rounded-md text-left transition-colors hover:bg-muted/50",
            "text-[12px] font-medium text-foreground"
          )}
          style={{ paddingLeft: depth * 16 + 4 }}
        >
          <ChevronRight className={cn("h-3 w-3 text-muted-foreground/50 transition-transform shrink-0", open && "rotate-90")} />
          <FolderOpen className={cn("h-3.5 w-3.5 shrink-0", open ? "text-primary" : "text-muted-foreground")} />
          <span className="truncate">{entry.name}</span>
          {entry.children && (
            <span className="text-[10px] text-muted-foreground/40 ml-auto shrink-0">{countTreeFiles(entry.children)}</span>
          )}
        </button>
        <AnimatePresence>
          {open && entry.children && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              {entry.children.map((child) => (
                <TreeNode key={child.path} entry={child} depth={depth + 1} projectId={projectId} selectedPath={selectedPath} onSelect={onSelect} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <button
      onClick={() => onSelect(entry.path)}
      className={cn(
        "w-full flex items-center gap-1.5 py-1 px-1.5 rounded-md text-left transition-colors",
        "text-[12px]",
        isSelected ? "bg-primary/10 text-primary font-medium" : "text-foreground/80 hover:bg-muted/50"
      )}
      style={{ paddingLeft: depth * 16 + 20 }}
    >
      <Icon className={cn("h-3.5 w-3.5 shrink-0", isSelected ? "text-primary" : fileColor(entry.name))} />
      <span className="truncate flex-1">{entry.name}</span>
      {entry.size != null && entry.size > 0 && (
        <span className="text-[9px] text-muted-foreground/40 shrink-0 ml-1">{formatSize(entry.size)}</span>
      )}
    </button>
  );
}
