import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ChevronRight, Copy, Check } from "lucide-react";
import type { Endpoint } from "./types";

export function MethodBadge({ method }: { method: string }) {
  const styles: Record<string, string> = {
    GET: "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 ring-emerald-500/20",
    POST: "bg-blue-500/10 text-blue-500 dark:text-blue-400 ring-blue-500/20",
    DELETE: "bg-red-500/10 text-red-500 dark:text-red-400 ring-red-500/20",
  };
  return (
    <span className={cn("px-2.5 py-1 rounded-md text-[11px] font-mono font-bold tracking-wider ring-1", styles[method])}>
      {method}
    </span>
  );
}

export function CopyBtn({ text, className }: { text: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className={cn("p-1.5 rounded-md hover:bg-white/10 transition-colors", className)}
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
    >
      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-muted-foreground" />}
    </button>
  );
}

function ParamTable({ title, params, color }: {
  title: string;
  params: Array<{ name: string; type: string; required?: boolean; default?: string; description: string }>;
  color: string;
}) {
  return (
    <div>
      <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-2.5">{title}</h4>
      <div className="rounded-lg border border-border/40 overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border/30 bg-muted/30">
              <th className="text-left px-3 py-2 font-medium text-muted-foreground">Name</th>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground">Type</th>
              <th className="text-left px-3 py-2 font-medium text-muted-foreground hidden sm:table-cell">Description</th>
            </tr>
          </thead>
          <tbody>
            {params.map((p, i) => (
              <tr key={p.name} className={cn(i < params.length - 1 && "border-b border-border/20")}>
                <td className="px-3 py-2 font-mono">
                  <span className={color}>{p.name}</span>
                  {"required" in p && p.required && <span className="ml-1.5 text-[9px] text-red-400 font-sans">*</span>}
                </td>
                <td className="px-3 py-2 text-muted-foreground font-mono">
                  {p.type}
                  {p.default && <span className="ml-1 text-muted-foreground/50">= {p.default}</span>}
                </td>
                <td className="px-3 py-2 text-muted-foreground hidden sm:table-cell">{p.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function EndpointCard({ ep, groupColor }: { ep: Endpoint; groupColor: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={cn(
      "rounded-xl border transition-all duration-200",
      open ? "border-border/60 bg-muted/20 shadow-sm" : "border-border/30 hover:border-border/50",
    )}>
      <button
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left group"
        onClick={() => setOpen(!open)}
      >
        <div className={cn(
          "w-5 h-5 rounded-md flex items-center justify-center transition-transform duration-200",
          open && "rotate-90",
        )}>
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
        <MethodBadge method={ep.method} />
        <code className="text-[13px] font-mono flex-1 text-foreground/90 group-hover:text-foreground transition-colors">
          {ep.path}
        </code>
        <span className={cn(
          "text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full",
          ep.scope === "open" ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground",
        )}>
          {ep.scope}
        </span>
      </button>

      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.2 }}
          className="px-5 pb-5 space-y-4"
        >
          <div className="border-t border-border/20 pt-4" />
          <p className="text-sm text-muted-foreground leading-relaxed">{ep.description}</p>

          {ep.params && ep.params.length > 0 && (
            <ParamTable title="Path Parameters" params={ep.params} color="text-orange-400" />
          )}
          {ep.queryParams && ep.queryParams.length > 0 && (
            <ParamTable title="Query Parameters" params={ep.queryParams} color="text-cyan-400" />
          )}
          {ep.bodyParams && ep.bodyParams.length > 0 && (
            <ParamTable title="Request Body (JSON)" params={ep.bodyParams} color="text-purple-400" />
          )}

          {ep.exampleResponse && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">Response</h4>
                <CopyBtn text={ep.exampleResponse} />
              </div>
              <div className="relative rounded-xl overflow-hidden border border-border/30">
                <div className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border-b border-white/10">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
                  <span className="ml-2 text-[10px] text-white/40 font-mono">JSON</span>
                </div>
                <pre className="bg-zinc-950 p-4 text-[12px] overflow-x-auto font-mono text-emerald-400 leading-relaxed">
                  {ep.exampleResponse}
                </pre>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
