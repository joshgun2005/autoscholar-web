export interface Project {
  id: string;
  title: string;
  authors: string | null;
  domain: string | null;
  template: string | null;
  asid: string | null;
  wordCount: number | null;
  sectionCount: number | null;
  figureCount: number | null;
  publishedAt: string;
  downloadUrl: string | null;
  projectZipUrl: string | null;
  sessionId: string | null;
  zipSize: number | null;
}

export interface TreeEntry {
  name: string;
  path: string;
  type: "file" | "dir";
  size?: number;
  children?: TreeEntry[];
}

export function formatSize(bytes: number | null | undefined): string {
  if (!bytes) return "";
  if (bytes >= 1e6) return (bytes / 1e6).toFixed(1) + " MB";
  if (bytes >= 1e3) return (bytes / 1e3).toFixed(1) + " KB";
  return bytes + " B";
}

export function fileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  // Dynamic imports are not ideal for icons; we return a string key instead.
  // The actual icon mapping is done at the component level.
  return ext;
}

export function fileColor(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (ext === "py") return "text-yellow-500";
  if (ext === "tex") return "text-emerald-500";
  if (ext === "pdf") return "text-red-500";
  if (["csv", "tsv", "parquet", "xlsx"].includes(ext)) return "text-blue-500";
  if (["png", "jpg", "jpeg", "svg"].includes(ext)) return "text-purple-500";
  if (ext === "bib") return "text-amber-500";
  if (ext === "md" || ext === "txt") return "text-muted-foreground";
  if (ext === "json") return "text-orange-500";
  return "text-muted-foreground";
}

export function isTextFile(name: string): boolean {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  return ["py", "tex", "bib", "md", "txt", "csv", "tsv", "json", "yaml", "yml", "toml", "cfg", "ini", "r", "sql"].includes(ext);
}

export function countTreeFiles(entries: TreeEntry[]): number {
  let count = 0;
  for (const e of entries) {
    if (e.type === "file") count++;
    if (e.children) count += countTreeFiles(e.children);
  }
  return count;
}

export function getFileIcon(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (["py"].includes(ext)) return "FileCode2";
  if (["tex", "bib", "md", "txt"].includes(ext)) return "FileText";
  if (["csv", "tsv", "xlsx", "xls", "parquet", "json"].includes(ext)) return "FileSpreadsheet";
  if (["png", "jpg", "jpeg", "svg", "pdf"].includes(ext)) return "Image";
  return "File";
}
