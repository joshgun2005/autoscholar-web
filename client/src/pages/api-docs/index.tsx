import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { JournalNav } from "@/components/journal/JournalNav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Shield, Clock, Code2, Terminal, Play,
  ArrowRight, ExternalLink, Hash, Braces, Zap,
} from "lucide-react";

import { API_GROUPS } from "./endpoint-definitions";
import { EndpointCard, CopyBtn } from "./EndpointCard";
import { SideNav, CodeBlock } from "./SideNav";

// ─── Animations ──────────────────────────────────────────────

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
};

// ─── Main Page ───────────────────────────────────────────────

export default function ApiDocs() {
  const [activeGroup, setActiveGroup] = useState<string | null>(null);
  const [tryItKey, setTryItKey] = useState("");
  const [tryItPath, setTryItPath] = useState("/api/v1/papers?limit=2");
  const [tryItResult, setTryItResult] = useState<string | null>(null);
  const [tryItLoading, setTryItLoading] = useState(false);
  const [tryItMethod, setTryItMethod] = useState<"GET" | "POST">("GET");

  const handleTryIt = async () => {
    if (!tryItKey) return;
    setTryItLoading(true);
    setTryItResult(null);
    try {
      const opts: RequestInit = { headers: { Authorization: `Bearer ${tryItKey}`, "Content-Type": "application/json" } };
      if (tryItMethod === "POST") opts.method = "POST";
      const resp = await fetch(tryItPath, opts);
      const data = await resp.json();
      setTryItResult(JSON.stringify(data, null, 2));
    } catch (err: any) {
      setTryItResult(`Error: ${err.message}`);
    } finally {
      setTryItLoading(false);
    }
  };

  const handleScrollTo = (id: string) => {
    setActiveGroup(id);
    document.getElementById(`group-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const totalEndpoints = API_GROUPS.reduce((s, g) => s + g.endpoints.length, 0);

  // Track active section on scroll
  const observerRef = useRef<IntersectionObserver | null>(null);
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.id.replace("group-", "");
            setActiveGroup(id);
          }
        }
      },
      { rootMargin: "-20% 0px -60% 0px" },
    );
    API_GROUPS.forEach(g => {
      const el = document.getElementById(`group-${g.id}`);
      if (el) observerRef.current?.observe(el);
    });
    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <div className="flex flex-col min-h-[100dvh] bg-background">
      <JournalNav />

      {/* ── Hero ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-border/30">
        {/* Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,hsl(var(--primary)/0.06),transparent_60%)]" />
          <div className="absolute inset-0 data-grid-pattern opacity-[0.04]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(var(--background))_80%)]" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-20 sm:pt-28 pb-16 sm:pb-24">
          <motion.div {...fadeUp}>
            {/* Tag */}
            <div className="flex items-center gap-2.5 mb-6">
              <div className="h-px w-8 bg-gradient-to-r from-primary/60 to-transparent" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary/70">Public Research API</span>
              <Badge variant="outline" className="text-[10px] font-mono border-primary/20 text-primary/60">v1</Badge>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold tracking-tight text-foreground leading-[1.1] mb-5">
              AutoScholar
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/80 to-primary/60">
                Research API
              </span>
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed mb-8">
              Programmatic access to {totalEndpoints} endpoints across {API_GROUPS.length} resource groups.
              Papers, peer reviews, LaTeX content, BibTeX citations, platform metrics, and more.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-3">
              {[
                { icon: Shield, label: "API Key Auth", desc: "Bearer token" },
                { icon: Clock, label: "100 req/hr", desc: "Per key" },
                { icon: Braces, label: "JSON Envelope", desc: "Consistent format" },
                { icon: Hash, label: "Pagination", desc: "Cursor-based" },
              ].map(f => (
                <div key={f.label} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/40 border border-border/30">
                  <f.icon className="w-3.5 h-3.5 text-primary/60" />
                  <div>
                    <span className="text-xs font-medium text-foreground">{f.label}</span>
                    <span className="text-[10px] text-muted-foreground ml-1.5">{f.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4"
          >
            {[
              { value: totalEndpoints, label: "Endpoints", icon: Terminal },
              { value: API_GROUPS.length, label: "Resource Groups", icon: Braces },
              { value: 4, label: "Auth Scopes", icon: Shield },
              { value: 100, label: "Req/Hour", icon: Zap },
            ].map(s => (
              <div key={s.label} className="rounded-2xl border border-border/30 bg-card/30 backdrop-blur-sm p-4 text-center">
                <s.icon className="w-4 h-4 text-primary/40 mx-auto mb-2" />
                <div className="text-2xl font-bold font-display text-foreground">{s.value}</div>
                <div className="text-[11px] text-muted-foreground/60 uppercase tracking-wider mt-0.5">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Content ─────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 lg:gap-12">
        <SideNav activeGroup={activeGroup} onSelect={handleScrollTo} />

        <main className="space-y-10 min-w-0">
          {/* Try It Console */}
          <motion.div {...fadeUp} className="rounded-2xl border border-border/30 bg-card/50 backdrop-blur-sm overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border/20">
              <Play className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">API Console</span>
              <span className="text-[10px] text-muted-foreground ml-1">Test endpoints live</span>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="API Key (ask_...)"
                  type="password"
                  value={tryItKey}
                  onChange={e => setTryItKey(e.target.value)}
                  className="max-w-[200px] h-9 text-xs font-mono bg-background/50"
                />
                <select
                  value={tryItMethod}
                  onChange={e => setTryItMethod(e.target.value as "GET" | "POST")}
                  className="h-9 px-2 rounded-md border border-border/40 bg-background/50 text-xs font-mono"
                >
                  <option>GET</option>
                  <option>POST</option>
                </select>
                <Input
                  placeholder="/api/v1/papers?limit=2"
                  value={tryItPath}
                  onChange={e => setTryItPath(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleTryIt()}
                  className="flex-1 h-9 text-xs font-mono bg-background/50"
                />
                <Button
                  onClick={handleTryIt}
                  disabled={tryItLoading || !tryItKey}
                  size="sm"
                  className="h-9 px-4 gap-1.5"
                >
                  {tryItLoading ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <ArrowRight className="w-3.5 h-3.5" />
                  )}
                  Send
                </Button>
              </div>
              {tryItResult && (
                <div className="relative">
                  <div className="absolute top-2 right-2 z-10">
                    <CopyBtn text={tryItResult} />
                  </div>
                  <div className="rounded-xl overflow-hidden border border-border/30">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border-b border-white/10">
                      <div className="w-2 h-2 rounded-full bg-red-500/50" />
                      <div className="w-2 h-2 rounded-full bg-yellow-500/50" />
                      <div className="w-2 h-2 rounded-full bg-green-500/50" />
                      <span className="ml-2 text-[10px] text-white/40 font-mono">response.json</span>
                    </div>
                    <pre className="bg-zinc-950 p-4 text-[12px] overflow-x-auto font-mono text-emerald-400 max-h-80 overflow-y-auto leading-relaxed">
                      {tryItResult}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Python Example */}
          <motion.div {...fadeUp} className="rounded-2xl border border-border/30 bg-card/50 backdrop-blur-sm overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border/20">
              <Code2 className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">Python Example</span>
            </div>
            <div className="p-5">
              <CodeBlock lang="python" code={`import requests

BASE = "${typeof window !== "undefined" ? window.location.origin : "https://autoscholar.ai"}/api/v1"
HEADERS = {"Authorization": "Bearer ask_YOUR_KEY_HERE"}

# List all papers in quantitative finance
papers = requests.get(f"{BASE}/papers", headers=HEADERS, params={
    "domain": "quantitative_finance",
    "sort": "newest",
    "limit": 50,
}).json()

for p in papers["data"]:
    print(f"[{p['asid']}] {p['title']} ({p['wordCount']} words)")

# Get LaTeX content for a specific paper
paper = requests.get(f"{BASE}/papers/{papers['data'][0]['id']}", headers=HEADERS).json()
for section in paper["data"]["latexSections"]:
    print(f"  Section: {section['type']} ({len(section['latex_content'])} chars)")

# Get the peer review
review = requests.get(
    f"{BASE}/reviews/{papers['data'][0]['id']}", headers=HEADERS
).json()
if review["ok"]:
    print(f"  Score: {review['data']['overallScore']}/100")
    print(f"  Recommendation: {review['data']['recommendation']}")

# Search across all resources
results = requests.get(f"{BASE}/search", headers=HEADERS, params={
    "q": "volatility surface",
    "type": "papers",
}).json()
print(f"Found {results['meta']['total']} results")

# Platform statistics
stats = requests.get(f"{BASE}/stats/platform", headers=HEADERS).json()
print(f"Total papers: {stats['data']['papers']['total']}")`} />
            </div>
          </motion.div>

          {/* Endpoint Groups */}
          <motion.div variants={stagger} initial="initial" animate="animate" className="space-y-8">
            {API_GROUPS.map(group => {
              const Icon = group.icon;
              return (
                <motion.div key={group.id} id={`group-${group.id}`} variants={fadeUp}>
                  <div className="rounded-2xl border border-border/30 bg-card/50 backdrop-blur-sm overflow-hidden">
                    {/* Group header */}
                    <div className="px-5 py-5 border-b border-border/20">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={cn("w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center", group.color)}>
                          <Icon className="w-4.5 h-4.5 text-white" />
                        </div>
                        <div>
                          <h2 className="text-lg font-semibold font-display flex items-center gap-2">
                            {group.name}
                            <span className="text-[10px] font-mono text-muted-foreground/50 font-normal">
                              {group.endpoints.length} endpoint{group.endpoints.length > 1 ? "s" : ""}
                            </span>
                          </h2>
                          <p className="text-xs text-muted-foreground font-mono">{group.basePath}</p>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed mt-2">{group.description}</p>
                    </div>

                    {/* Endpoints */}
                    <div className="p-4 space-y-2">
                      {group.endpoints.map((ep, i) => (
                        <EndpointCard key={i} ep={ep} groupColor={group.color} />
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Error Codes */}
          <motion.div {...fadeUp} className="rounded-2xl border border-border/30 bg-card/50 backdrop-blur-sm overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border/20">
              <ExternalLink className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold">HTTP Status Codes</span>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[
                  { code: 200, label: "OK", desc: "Successful request", color: "text-emerald-500 bg-emerald-500/10 ring-emerald-500/20" },
                  { code: 201, label: "Created", desc: "Resource created", color: "text-emerald-500 bg-emerald-500/10 ring-emerald-500/20" },
                  { code: 400, label: "Bad Request", desc: "Invalid parameters", color: "text-amber-500 bg-amber-500/10 ring-amber-500/20" },
                  { code: 401, label: "Unauthorized", desc: "Missing/invalid API key", color: "text-red-500 bg-red-500/10 ring-red-500/20" },
                  { code: 403, label: "Forbidden", desc: "Key revoked or insufficient scope", color: "text-red-500 bg-red-500/10 ring-red-500/20" },
                  { code: 404, label: "Not Found", desc: "Resource does not exist", color: "text-amber-500 bg-amber-500/10 ring-amber-500/20" },
                  { code: 429, label: "Too Many Requests", desc: "Rate limit exceeded", color: "text-orange-500 bg-orange-500/10 ring-orange-500/20" },
                  { code: 500, label: "Server Error", desc: "Internal server error", color: "text-red-500 bg-red-500/10 ring-red-500/20" },
                ].map(e => (
                  <div key={e.code} className="flex items-center gap-3 rounded-xl border border-border/20 px-3.5 py-2.5">
                    <span className={cn("text-xs font-mono font-bold px-2 py-0.5 rounded-md ring-1", e.color)}>
                      {e.code}
                    </span>
                    <div className="min-w-0">
                      <span className="text-xs font-medium text-foreground">{e.label}</span>
                      <span className="text-[11px] text-muted-foreground ml-1.5">{e.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    </div>
  );
}
