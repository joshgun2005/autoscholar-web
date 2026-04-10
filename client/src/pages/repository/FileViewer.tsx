import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FileText, FileCode2, FileSpreadsheet, Image, File,
  Download, Copy, Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { fileColor, isTextFile } from "./types";

function getFileIconComponent(name: string) {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (["py"].includes(ext)) return FileCode2;
  if (["tex", "bib", "md", "txt"].includes(ext)) return FileText;
  if (["csv", "tsv", "xlsx", "xls", "parquet", "json"].includes(ext)) return FileSpreadsheet;
  if (["png", "jpg", "jpeg", "svg", "pdf"].includes(ext)) return Image;
  return File;
}

export function FileViewer({ projectId, filePath }: { projectId: string; filePath: string }) {
  const [copied, setCopied] = useState(false);
  const ext = filePath.split(".").pop()?.toLowerCase() || "";
  const isText = isTextFile(filePath);
  const isImage = ["png", "jpg", "jpeg", "svg"].includes(ext);
  const isPdf = ext === "pdf";

  const { data: content, isLoading } = useQuery<string>({
    queryKey: ["/api/repository", projectId, "file", filePath],
    queryFn: async () => {
      const res = await fetch(`/api/repository/${projectId}/file/${filePath}`);
      if (!res.ok) throw new Error("Failed to load file");
      if (isImage) {
        const blob = await res.blob();
        return URL.createObjectURL(blob);
      }
      return res.text();
    },
    enabled: isText || isImage,
    staleTime: 60000,
  });

  const fileName = filePath.split("/").pop() || filePath;
  const rawUrl = `/api/repository/${projectId}/raw/${filePath}`;

  const handleCopy = useCallback(() => {
    if (content && isText) {
      navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [content, isText]);

  const Icon = getFileIconComponent(fileName);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/40 bg-muted/[0.03] shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Icon className={cn("h-4 w-4 shrink-0", fileColor(fileName))} />
          <span className="text-sm font-mono font-medium text-foreground truncate">{filePath}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {isText && (
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1" onClick={handleCopy}>
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          )}
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1" asChild>
            <a href={rawUrl} download={fileName}>
              <Download className="h-3 w-3" /> Raw
            </a>
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        {isLoading && (
          <div className="p-4 space-y-2">
            <Skeleton className="h-4 w-3/4" /> <Skeleton className="h-4 w-1/2" /> <Skeleton className="h-4 w-5/6" /> <Skeleton className="h-4 w-2/3" />
          </div>
        )}
        {!isLoading && isText && content && (
          <pre className="p-4 text-[11px] font-mono leading-5 text-foreground/90 whitespace-pre overflow-x-auto">
            {content.split("\n").map((line, i) => (
              <div key={i} className="flex hover:bg-muted/20">
                <span className="inline-block w-10 shrink-0 text-right pr-3 text-muted-foreground/30 select-none tabular-nums">{i + 1}</span>
                <span className="flex-1">{line || " "}</span>
              </div>
            ))}
          </pre>
        )}
        {!isLoading && isImage && content && (
          <div className="flex items-center justify-center p-6 bg-[repeating-conic-gradient(#80808015_0%_25%,transparent_0%_50%)] bg-[length:16px_16px]">
            <img src={content} alt={fileName} className="max-w-full max-h-[500px] rounded shadow-lg" />
          </div>
        )}
        {!isLoading && isPdf && (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
            <FileText className="h-12 w-12 text-red-400" />
            <p className="text-sm">PDF files cannot be previewed inline</p>
            <Button variant="outline" size="sm" asChild>
              <a href={rawUrl} download={fileName}><Download className="h-3.5 w-3.5 mr-1.5" /> Download PDF</a>
            </Button>
          </div>
        )}
        {!isLoading && !isText && !isImage && !isPdf && (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
            <File className="h-12 w-12 text-muted-foreground/30" />
            <p className="text-sm">Binary file — preview not available</p>
            <Button variant="outline" size="sm" asChild>
              <a href={rawUrl} download={fileName}><Download className="h-3.5 w-3.5 mr-1.5" /> Download</a>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
