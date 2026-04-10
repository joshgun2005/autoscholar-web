/**
 * Research Form — structured paper generation input.
 *
 * Suggestion data extracted to ./research-form-suggestions.ts
 * TypeAhead components extracted to ./TypeAhead.tsx
 */

import { useState, useRef, useCallback } from "react";
import {
  GraduationCap,
  FlaskConical,
  Database,
  BarChart3,
  FileText,
  X,
  Sparkles,
  ArrowRight,
  Target,
  FileSpreadsheet,
  Upload,
  Loader2,
  Wand2,
  TestTube,
  Brain,
  Cpu,
  BookOpen,
  TrendingUp,
  Beaker,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { UploadedFile } from "@/hooks/useChatMutation";
import { generateSurprisePrompt } from "./empty-state";
import { TypeAhead, MultiTypeAhead } from "./TypeAhead";
import {
  DOMAIN_SUGGESTIONS,
  DATA_SUGGESTIONS,
  METHOD_SUGGESTIONS,
  OUTPUT_SUGGESTIONS,
  TOPIC_SUGGESTIONS,
} from "./research-form-suggestions";

// ── Constants ───────────────────────────────────────────────────

interface ResearchFormProps {
  onSubmit: (query: string, imageData?: string, imageMimeType?: string, uploadedFiles?: UploadedFile[]) => void;
  isLoading?: boolean;
}

const PAPER_TYPES = [
  { key: "", label: "Auto", desc: "Auto-detect from topic", icon: Sparkles },
  { key: "A", label: "A — Empirical", desc: "Econometrics, causal inference", icon: TrendingUp },
  { key: "B", label: "B — Theoretical", desc: "Formal model, proofs, simulations", icon: BookOpen },
  { key: "C", label: "C — Hybrid", desc: "Model + empirical validation", icon: Beaker },
  { key: "D", label: "D — Statistics", desc: "Hypothesis testing, effect sizes", icon: TestTube },
  { key: "E", label: "E — Machine Learning", desc: "Prediction, cross-validation", icon: Brain },
  { key: "F", label: "F — AI / Deep Learning", desc: "Neural networks, ablation", icon: Cpu },
] as const;

// ── Component ───────────────────────────────────────────────────

export function ResearchForm({ onSubmit, isLoading }: ResearchFormProps) {
  const [topic, setTopic] = useState("");
  const [domain, setDomain] = useState("");
  const [objective, setObjective] = useState("");
  const [dataSources, setDataSources] = useState<string[]>([]);
  const [method, setMethod] = useState("");
  const [outputType, setOutputType] = useState("");
  const [paperType, setPaperType] = useState("");

  // File upload state
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesUpload = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    const allowed = ['.csv', '.tsv', '.xlsx', '.xls', '.parquet', '.json', '.txt'];
    const valid = fileArray.filter(f => {
      const ext = '.' + f.name.split('.').pop()?.toLowerCase();
      return allowed.includes(ext);
    });
    if (valid.length === 0) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      for (const f of valid) formData.append("files", f);
      const response = await fetch("/api/upload-data", { method: "POST", credentials: "include", body: formData });
      const data = await response.json();
      if (response.ok && data.files) {
        setUploadedFiles(prev => [...prev, ...data.files]);
      }
    } catch (err) {
      console.error("[Upload] Failed:", err);
    } finally {
      setIsUploading(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files.length > 0) handleFilesUpload(e.dataTransfer.files);
  }, [handleFilesUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragOver(true); }, []);
  const handleDragLeave = useCallback(() => setIsDragOver(false), []);

  const composeQuery = useCallback(() => {
    const parts: string[] = [];
    if (topic) parts.push(topic.trim());
    if (domain || method || dataSources.length > 0 || objective || outputType || paperType) {
      parts.push("\n");
    }
    if (paperType) {
      const typeLabel = PAPER_TYPES.find(t => t.key === paperType);
      parts.push(`Paper type: ${typeLabel?.label || paperType}`);
    }
    if (domain) parts.push(`Field: ${domain}`);
    if (objective) parts.push(`Objective: ${objective}`);
    if (dataSources.length > 0) parts.push(`Data sources: ${dataSources.join(", ")}`);
    if (method) parts.push(`Methodology: ${method}`);
    if (outputType) parts.push(`Output: ${outputType}`);
    return parts.join("\n").trim();
  }, [topic, domain, objective, dataSources, method, outputType, paperType]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const query = composeQuery();
    if (query) onSubmit(query, undefined, undefined, uploadedFiles.length > 0 ? uploadedFiles : undefined);
  }, [composeQuery, onSubmit, uploadedFiles]);

  const filledCount = [topic, domain, objective, dataSources.length > 0 ? "x" : "", method, outputType, paperType, uploadedFiles.length > 0 ? "x" : ""]
    .filter(Boolean).length;
  const isValid = topic.trim().length > 0;

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Hero */}
      <div className="text-center mb-10">
        <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 mb-5 shadow-lg shadow-primary/10">
          <GraduationCap className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-display font-bold tracking-tight mb-3">
          <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/50 bg-clip-text text-transparent">
            AutoScholar
          </span>
        </h1>
        <p className="text-base text-muted-foreground max-w-lg mx-auto leading-relaxed">
          Autonomous AI-powered research engine. Type your topic below and start typing in any field to see suggestions.
        </p>
      </div>

      {/* Form card */}
      <div className="rounded-2xl border border-border bg-card/90 backdrop-blur-sm shadow-xl shadow-black/[0.04] p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Topic */}
          <TypeAhead
            value={topic}
            onChange={setTopic}
            suggestions={TOPIC_SUGGESTIONS}
            placeholder="Start typing your research topic..."
            icon={<Sparkles className="h-4 w-4" />}
            label="Research Topic *"
          />

          {/* Paper Type Selector */}
          <div>
            <label className="block text-[11px] font-semibold text-foreground/60 mb-2 ml-0.5 tracking-wider uppercase">
              Paper Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {PAPER_TYPES.map((type) => {
                const Icon = type.icon;
                const isSelected = paperType === type.key;
                return (
                  <button
                    key={type.key}
                    type="button"
                    onClick={() => setPaperType(isSelected ? "" : type.key)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all duration-200",
                      isSelected
                        ? "border-primary bg-primary/10 ring-1 ring-primary/30 shadow-sm"
                        : "border-border/60 bg-card hover:border-primary/30 hover:bg-muted/30"
                    )}
                  >
                    <Icon className={cn("h-3.5 w-3.5 shrink-0", isSelected ? "text-primary" : "text-muted-foreground/50")} />
                    <div className="min-w-0">
                      <p className={cn("text-[11px] font-semibold truncate", isSelected ? "text-primary" : "text-foreground/70")}>
                        {type.label}
                      </p>
                      <p className="text-[9px] text-muted-foreground/50 truncate leading-tight">
                        {type.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 py-0.5">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[10px] font-medium text-muted-foreground/40 uppercase tracking-widest">
              Optional — refine your paper
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Two columns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TypeAhead
              value={domain}
              onChange={setDomain}
              suggestions={DOMAIN_SUGGESTIONS}
              placeholder="Type to search fields..."
              icon={<FlaskConical className="h-4 w-4" />}
              label="Field / Domain"
            />
            <TypeAhead
              value={method}
              onChange={setMethod}
              suggestions={METHOD_SUGGESTIONS}
              placeholder="Type to search methods..."
              icon={<BarChart3 className="h-4 w-4" />}
              label="Methodology"
            />
          </div>

          {/* Data — multi */}
          <MultiTypeAhead
            values={dataSources}
            onChange={setDataSources}
            suggestions={DATA_SUGGESTIONS}
            placeholder="Type to search data sources..."
            icon={<Database className="h-4 w-4" />}
            label="Data Preferences"
          />

          {/* Objective */}
          <div>
            <label className="block text-[11px] font-semibold text-foreground/60 mb-1.5 ml-0.5 tracking-wider uppercase">
              Objective
            </label>
            <textarea
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="What specific research question do you want to investigate?"
              rows={2}
              className={cn(
                "w-full rounded-xl border px-3.5 py-3 text-sm text-foreground outline-none transition-all duration-200 resize-none",
                "bg-card shadow-sm placeholder:text-muted-foreground/40",
                "border-border hover:border-primary/30 hover:shadow",
                "focus:border-primary focus:ring-2 focus:ring-primary/20 focus:shadow-md"
              )}
            />
          </div>

          {/* Output */}
          <TypeAhead
            value={outputType}
            onChange={setOutputType}
            suggestions={OUTPUT_SUGGESTIONS}
            placeholder="Type to search output formats..."
            icon={<FileText className="h-4 w-4" />}
            label="Output Type"
          />

          {/* File Upload Zone */}
          <div>
            <label className="block text-[11px] font-semibold text-foreground/60 mb-1.5 ml-0.5 tracking-wider uppercase">
              Your Data Files
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.tsv,.xlsx,.xls,.parquet,.json,.txt"
              multiple
              onChange={(e) => { if (e.target.files) handleFilesUpload(e.target.files); e.target.value = ""; }}
              className="hidden"
            />
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "relative rounded-xl border-2 border-dashed px-4 py-4 cursor-pointer transition-all duration-200",
                "flex flex-col items-center gap-2",
                isDragOver
                  ? "border-primary bg-primary/5 shadow-inner"
                  : uploadedFiles.length > 0
                    ? "border-primary/30 bg-primary/[0.02]"
                    : "border-border/60 hover:border-primary/30 hover:bg-muted/30"
              )}
            >
              {isUploading ? (
                <div className="flex items-center gap-2 py-1">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-xs font-medium text-muted-foreground">Uploading...</span>
                </div>
              ) : uploadedFiles.length === 0 ? (
                <>
                  <Upload className="h-5 w-5 text-muted-foreground/40" />
                  <div className="text-center">
                    <p className="text-xs font-medium text-muted-foreground/70">
                      Drop your datasets here or <span className="text-primary font-semibold">browse</span>
                    </p>
                    <p className="text-[10px] text-muted-foreground/40 mt-0.5">
                      CSV, Excel, Parquet, JSON, TSV — up to 100 MB
                    </p>
                  </div>
                </>
              ) : (
                <div className="w-full space-y-1.5">
                  {uploadedFiles.map((f, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-card border border-border/50 group"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="text-xs font-medium text-foreground flex-1 truncate">{f.originalName}</span>
                      <span className="text-[10px] text-muted-foreground/50 flex-shrink-0">{(f.size / 1024).toFixed(0)} KB</span>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setUploadedFiles(prev => prev.filter((_, i) => i !== idx)); }}
                        className="p-0.5 rounded-full hover:bg-destructive/15 text-muted-foreground/40 hover:text-destructive transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <p className="text-[10px] text-center text-muted-foreground/40 pt-0.5">
                    Click or drop to add more files
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Submit */}
          <div className="pt-2">
            <Button
              type="submit"
              disabled={!isValid || isLoading || isUploading}
              className="w-full h-13 rounded-xl text-base font-semibold gap-2.5 transition-all duration-300 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 disabled:shadow-none"
              size="lg"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  Generating...
                </>
              ) : (
                <>
                  <Target className="h-4.5 w-4.5" />
                  Generate Research Paper
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
            {filledCount > 0 && (
              <p className="text-center text-xs text-muted-foreground/40 mt-2.5">
                {filledCount}/8 fields — {filledCount >= 6 ? "excellent detail" : filledCount >= 3 ? "good start" : "add more for precision"}
              </p>
            )}
          </div>

          {/* Surprise paper divider + button */}
          <div className="flex items-center gap-3 pt-1">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[10px] font-medium text-muted-foreground/40 uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <button
            type="button"
            onClick={() => {
              const prompt = generateSurprisePrompt();
              onSubmit(prompt, undefined, undefined, undefined);
            }}
            disabled={isLoading}
            className="group w-full p-4 rounded-xl border border-border/60 hover:border-primary/40 bg-card/50 hover:bg-primary/[0.04] transition-all duration-300 hover:shadow-md hover:shadow-primary/10 disabled:opacity-50 disabled:pointer-events-none"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary/10 border border-primary/20 group-hover:bg-primary/15 transition-colors">
                <Wand2 className="w-4.5 h-4.5 text-primary" />
              </div>
              <div className="text-left flex-1">
                <p className="font-semibold text-foreground text-sm">
                  Generate a surprise paper
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                  The agent picks an original topic, finds a literature gap, runs econometrics, and produces a full paper
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-primary/40 group-hover:text-primary/80 transition-all duration-300 -translate-x-1 group-hover:translate-x-0" />
            </div>
          </button>
        </form>
      </div>

      <p className="text-center text-[11px] text-muted-foreground/35 mt-4">
        You can also type freely in the search bar below — the form is optional guidance.
      </p>
    </div>
  );
}
