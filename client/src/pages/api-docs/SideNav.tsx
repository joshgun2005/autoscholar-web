import { cn } from "@/lib/utils";
import { Zap, Shield, Clock, Braces, Lock, type LucideIcon } from "lucide-react";
import { CopyBtn } from "./EndpointCard";
import { API_GROUPS } from "./endpoint-definitions";

function SidebarSection({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border/30 bg-card/50 backdrop-blur-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/20">
        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">{title}</span>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

export function CodeBlock({ code, lang = "bash" }: { code: string; lang?: string }) {
  return (
    <div className="relative rounded-xl overflow-hidden border border-border/30 group">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border-b border-white/10">
        <div className="w-2 h-2 rounded-full bg-red-500/50" />
        <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
        <div className="w-2 h-2 rounded-full bg-green-500/50" />
        <span className="ml-2 text-[10px] text-white/40 font-mono">{lang}</span>
        <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
          <CopyBtn text={code} />
        </div>
      </div>
      <pre className="bg-zinc-950 px-4 py-3 text-[12px] overflow-x-auto font-mono text-emerald-400 leading-relaxed">
        {code}
      </pre>
    </div>
  );
}

export function SideNav({ activeGroup, onSelect }: { activeGroup: string | null; onSelect: (id: string) => void }) {
  return (
    <aside className="space-y-5 lg:sticky lg:top-20 lg:self-start">
      {/* Quick Start */}
      <SidebarSection icon={Zap} title="Quick Start">
        <div className="space-y-3 text-sm">
          <p className="text-muted-foreground text-xs mb-2">1. Create an API key</p>
          <CodeBlock code={`curl -X POST ${typeof window !== "undefined" ? window.location.origin : ""}/api/v1/keys \\
  -H "Content-Type: application/json" \\
  -d '{"name": "my-research"}'`} />
          <p className="text-muted-foreground text-xs mb-2">2. Use your key</p>
          <CodeBlock code={`curl ${typeof window !== "undefined" ? window.location.origin : ""}/api/v1/papers \\
  -H "Authorization: Bearer ask_..."`} />
        </div>
      </SidebarSection>

      {/* Resources */}
      <div className="rounded-2xl border border-border/30 bg-card/50 backdrop-blur-sm overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/20">
          <Braces className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">Resources</span>
        </div>
        <div className="py-1">
          {API_GROUPS.map(g => {
            const Icon = g.icon;
            const isActive = activeGroup === g.id;
            return (
              <button
                key={g.id}
                className={cn(
                  "w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-all",
                  isActive
                    ? "bg-primary/5 text-primary border-l-2 border-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/30 border-l-2 border-transparent",
                )}
                onClick={() => onSelect(g.id)}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1 text-left">{g.name}</span>
                <span className={cn(
                  "text-[10px] font-mono tabular-nums",
                  isActive ? "text-primary/60" : "text-muted-foreground/40",
                )}>
                  {g.endpoints.length}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Auth Info */}
      <SidebarSection icon={Lock} title="Authentication">
        <div className="space-y-3 text-xs text-muted-foreground">
          <p>All endpoints (except key creation) require an API key.</p>
          <div className="space-y-1.5">
            <p className="font-medium text-foreground/70">Header (recommended)</p>
            <code className="block bg-zinc-950 rounded-lg p-2 font-mono text-emerald-400 text-[11px]">
              Authorization: Bearer ask_...
            </code>
          </div>
          <div className="space-y-1.5">
            <p className="font-medium text-foreground/70">Query parameter</p>
            <code className="block bg-zinc-950 rounded-lg p-2 font-mono text-emerald-400 text-[11px]">
              ?api_key=ask_...
            </code>
          </div>
        </div>
      </SidebarSection>

      {/* Scopes */}
      <SidebarSection icon={Shield} title="Scopes">
        <div className="space-y-2">
          {[
            { scope: "read", desc: "Access all data", color: "bg-emerald-500/10 text-emerald-500 ring-emerald-500/20" },
            { scope: "search", desc: "Cross-resource search", color: "bg-blue-500/10 text-blue-500 ring-blue-500/20" },
            { scope: "download", desc: "PDF / ZIP downloads", color: "bg-amber-500/10 text-amber-500 ring-amber-500/20" },
            { scope: "write", desc: "Create prompts", color: "bg-purple-500/10 text-purple-500 ring-purple-500/20" },
          ].map(s => (
            <div key={s.scope} className="flex items-center gap-2.5">
              <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold ring-1", s.color)}>{s.scope}</span>
              <span className="text-xs text-muted-foreground">{s.desc}</span>
            </div>
          ))}
        </div>
      </SidebarSection>

      {/* Rate Limits */}
      <SidebarSection icon={Clock} title="Rate Limits">
        <div className="space-y-2 text-xs text-muted-foreground">
          <p>Default: <strong className="text-foreground">100 requests/hour</strong> per key.</p>
          <CodeBlock lang="headers" code={`X-RateLimit-Limit: 100
X-RateLimit-Remaining: 97
X-RateLimit-Reset: 2026-03-30T12:00:00Z`} />
        </div>
      </SidebarSection>

      {/* Response Format */}
      <SidebarSection icon={Braces} title="Response Format">
        <div className="text-xs text-muted-foreground space-y-2">
          <p>All responses use a standard JSON envelope:</p>
          <CodeBlock lang="json" code={`{
  "ok": true,
  "data": { ... },
  "error": "message",
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}`} />
        </div>
      </SidebarSection>
    </aside>
  );
}
