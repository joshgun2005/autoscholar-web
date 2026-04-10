import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Save, X, Pencil, Search, Rocket, Shuffle, ChevronDown, ChevronUp, Library, Zap, Loader2, CheckCircle, AlertTriangle } from "lucide-react";
import { ADMIN_PROMPT_BANK, TOTAL_PROMPT_COUNT, searchPrompts, getRandomPrompt } from "./prompt-bank";

interface SavedPrompt {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

interface SchedulerConfig {
  domainPool: string[];
  methodPool: string[];
}

const PAGE_SIZE = 50;

export function AdminPrompts() {
  const queryClient = useQueryClient();

  const [showForm, setShowForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [editingDomains, setEditingDomains] = useState(false);
  const [editingMethods, setEditingMethods] = useState(false);
  const [domainsText, setDomainsText] = useState("");
  const [methodsText, setMethodsText] = useState("");

  // Prompt bank state
  const [bankSearch, setBankSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [bankPage, setBankPage] = useState(0);
  const [expandedBank, setExpandedBank] = useState(true);

  const { data: prompts = [] } = useQuery<SavedPrompt[]>({
    queryKey: ["/api/admin/prompts"],
    queryFn: async () => { const res = await fetch("/api/admin/prompts", { credentials: "include" }); return res.json(); },
  });

  const { data: config } = useQuery<SchedulerConfig>({
    queryKey: ["/api/admin/scheduler/config"],
    queryFn: async () => { const res = await fetch("/api/admin/scheduler/config", { credentials: "include" }); return res.json(); },
  });

  const createPrompt = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/prompts", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle, content: newContent }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/prompts"] });
      setShowForm(false); setNewTitle(""); setNewContent("");
    },
  });

  const updatePools = useMutation({
    mutationFn: async (updates: Partial<SchedulerConfig>) => {
      const res = await fetch("/api/admin/scheduler/config", {
        method: "PATCH", credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/scheduler/config"] });
      setEditingDomains(false); setEditingMethods(false);
    },
  });

  // ── Prompt Bank Filtering ──────────────────────────
  const filteredPrompts = useMemo(() => {
    let results = bankSearch.trim()
      ? searchPrompts(bankSearch)
      : ADMIN_PROMPT_BANK.flatMap(c => c.prompts.map(p => ({ category: c.category, prompt: p })));

    if (selectedCategory !== "all") {
      results = results.filter(r => r.category === selectedCategory);
    }
    return results;
  }, [bankSearch, selectedCategory]);

  const totalPages = Math.ceil(filteredPrompts.length / PAGE_SIZE);
  const pagedPrompts = filteredPrompts.slice(bankPage * PAGE_SIZE, (bankPage + 1) * PAGE_SIZE);

  // Launch prompt via the backend pipeline (trigger-custom), not via frontend chat
  const [launchStatus, setLaunchStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const launchMutation = useMutation({
    mutationFn: async (prompt: string) => {
      const res = await fetch("/api/admin/runs/trigger-custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ prompt }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to trigger run");
      }
      return res.json();
    },
    onSuccess: (data) => {
      setLaunchStatus({ type: 'success', message: `Paper generation started — Run ${data.runId?.slice(0, 8)}... Track in Pipeline Runs tab.` });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/runs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/runs/stats"] });
      setTimeout(() => setLaunchStatus(null), 8000);
    },
    onError: (err: Error) => {
      setLaunchStatus({ type: 'error', message: err.message });
      setTimeout(() => setLaunchStatus(null), 8000);
    },
  });

  const handleLaunch = (prompt: string) => {
    if (launchMutation.isPending) return;
    launchMutation.mutate(prompt);
  };

  const handleRandomLaunch = () => {
    const r = getRandomPrompt();
    handleLaunch(r.prompt);
  };

  return (
    <div className="space-y-6">
      {/* ══ PROMPT BANK (1500+ prompts) ════════════════ */}
      <Card className="rounded-xl border-primary/20">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Library className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Prompt Bank
              </h3>
              <Badge variant="secondary" className="text-[10px] font-mono">
                {TOTAL_PROMPT_COUNT.toLocaleString()} prompts
              </Badge>
              <Badge variant="outline" className="text-[10px] font-mono">
                {ADMIN_PROMPT_BANK.length} categories
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="default" onClick={handleRandomLaunch} disabled={launchMutation.isPending} className="gap-1.5 rounded-lg">
                {launchMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Shuffle className="h-3.5 w-3.5" />}
                {launchMutation.isPending ? "Launching..." : "Random Launch"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setExpandedBank(!expandedBank)} className="gap-1 rounded-lg">
                {expandedBank ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Launch status feedback */}
          {launchStatus && (
            <div className={`flex items-center gap-2 p-2.5 rounded-lg mb-3 ${
              launchStatus.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/20'
                : 'bg-red-500/10 border border-red-500/20'
            }`}>
              {launchStatus.type === 'success'
                ? <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                : <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" />}
              <p className={`text-[11px] ${launchStatus.type === 'success' ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-600'}`}>
                {launchStatus.message}
              </p>
            </div>
          )}

          {expandedBank && (
            <>
              {/* Search + Category Filter */}
              <div className="flex flex-col sm:flex-row gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search prompts... (e.g., GARCH, Bitcoin, Monte Carlo)"
                    value={bankSearch}
                    onChange={e => { setBankSearch(e.target.value); setBankPage(0); }}
                    className="pl-9 rounded-lg text-sm"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={e => { setSelectedCategory(e.target.value); setBankPage(0); }}
                  className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground min-w-[220px]"
                >
                  <option value="all">All Categories ({TOTAL_PROMPT_COUNT})</option>
                  {ADMIN_PROMPT_BANK.map(c => (
                    <option key={c.category} value={c.category}>
                      {c.category} ({c.prompts.length})
                    </option>
                  ))}
                </select>
              </div>

              {/* Results count */}
              <div className="flex items-center justify-between mb-3">
                <p className="text-[11px] text-muted-foreground">
                  Showing {bankPage * PAGE_SIZE + 1}–{Math.min((bankPage + 1) * PAGE_SIZE, filteredPrompts.length)} of{" "}
                  <span className="font-bold text-foreground">{filteredPrompts.length.toLocaleString()}</span> prompts
                </p>
                {totalPages > 1 && (
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={bankPage === 0}
                      onClick={() => setBankPage(p => p - 1)}
                      className="h-7 px-2 text-[10px] rounded-md"
                    >
                      Prev
                    </Button>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {bankPage + 1}/{totalPages}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={bankPage >= totalPages - 1}
                      onClick={() => setBankPage(p => p + 1)}
                      className="h-7 px-2 text-[10px] rounded-md"
                    >
                      Next
                    </Button>
                  </div>
                )}
              </div>

              {/* Prompt List */}
              <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
                {pagedPrompts.map((item, i) => (
                  <div
                    key={`${bankPage}-${i}`}
                    className="group flex items-start gap-3 p-3 rounded-lg border border-border/30 bg-card/40 hover:bg-primary/5 hover:border-primary/30 transition-all"
                  >
                    <div className="flex-1 min-w-0">
                      <Badge variant="outline" className="text-[9px] font-mono mb-1.5 px-1.5 py-0">
                        {item.category}
                      </Badge>
                      <p className="text-xs text-foreground leading-relaxed">{item.prompt}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={launchMutation.isPending}
                      onClick={() => handleLaunch(item.prompt)}
                      className="shrink-0 h-8 gap-1 rounded-lg opacity-50 group-hover:opacity-100 group-hover:bg-primary group-hover:text-primary-foreground transition-all"
                    >
                      {launchMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Rocket className="h-3 w-3" />}
                      <span className="text-[10px] font-semibold">{launchMutation.isPending ? "..." : "Launch"}</span>
                    </Button>
                  </div>
                ))}
              </div>

              {/* Bottom pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-1.5 mt-4 pt-3 border-t border-border/30">
                  <Button size="sm" variant="outline" disabled={bankPage === 0} onClick={() => setBankPage(0)} className="h-7 px-2 text-[10px] rounded-md">
                    First
                  </Button>
                  <Button size="sm" variant="outline" disabled={bankPage === 0} onClick={() => setBankPage(p => p - 1)} className="h-7 px-2 text-[10px] rounded-md">
                    Prev
                  </Button>
                  {/* Page numbers */}
                  {Array.from({ length: Math.min(7, totalPages) }, (_, idx) => {
                    let page: number;
                    if (totalPages <= 7) {
                      page = idx;
                    } else if (bankPage < 3) {
                      page = idx;
                    } else if (bankPage > totalPages - 4) {
                      page = totalPages - 7 + idx;
                    } else {
                      page = bankPage - 3 + idx;
                    }
                    return (
                      <Button
                        key={page}
                        size="sm"
                        variant={page === bankPage ? "default" : "outline"}
                        onClick={() => setBankPage(page)}
                        className="h-7 w-7 p-0 text-[10px] rounded-md"
                      >
                        {page + 1}
                      </Button>
                    );
                  })}
                  <Button size="sm" variant="outline" disabled={bankPage >= totalPages - 1} onClick={() => setBankPage(p => p + 1)} className="h-7 px-2 text-[10px] rounded-md">
                    Next
                  </Button>
                  <Button size="sm" variant="outline" disabled={bankPage >= totalPages - 1} onClick={() => setBankPage(totalPages - 1)} className="h-7 px-2 text-[10px] rounded-md">
                    Last
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* ── System Prompt Templates ────────────────── */}
      <Card className="rounded-xl">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Prompt Templates</h3>
            <Button size="sm" variant="outline" onClick={() => setShowForm(!showForm)} className="gap-1.5 rounded-lg">
              {showForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
              {showForm ? "Cancel" : "New Template"}
            </Button>
          </div>

          {showForm && (
            <div className="space-y-3 mb-4 p-4 rounded-xl border border-border/40 bg-muted/20">
              <Input
                placeholder="Template title..."
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                className="rounded-lg"
              />
              <Textarea
                placeholder="Prompt content..."
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
                rows={8}
                className="rounded-lg font-mono text-xs"
              />
              <Button size="sm" onClick={() => createPrompt.mutate()} disabled={!newTitle || !newContent} className="gap-1.5 rounded-lg">
                <Save className="h-3.5 w-3.5" />
                Save Template
              </Button>
            </div>
          )}

          {prompts.length === 0 && !showForm && (
            <p className="text-sm text-muted-foreground text-center py-6">No system templates yet.</p>
          )}

          <div className="space-y-3">
            {prompts.map(p => (
              <div key={p.id} className="p-4 rounded-xl border border-border/40 bg-card/60">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-sm">{p.title}</span>
                  <span className="text-[10px] text-muted-foreground">{new Date(p.createdAt).toLocaleDateString()}</span>
                </div>
                <pre className="text-xs text-muted-foreground whitespace-pre-wrap max-h-32 overflow-y-auto">{p.content.slice(0, 500)}{p.content.length > 500 ? "..." : ""}</pre>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* ── Domain Pool ────────────────────────────── */}
      <Card className="rounded-xl">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Domain Pool ({config?.domainPool?.length ?? 0})</h3>
            <Button size="sm" variant="outline" onClick={() => {
              if (editingDomains) { setEditingDomains(false); }
              else { setDomainsText(config?.domainPool?.join("\n") || ""); setEditingDomains(true); }
            }} className="gap-1.5 rounded-lg">
              <Pencil className="h-3.5 w-3.5" />
              {editingDomains ? "Cancel" : "Edit"}
            </Button>
          </div>

          {editingDomains ? (
            <div className="space-y-3">
              <Textarea value={domainsText} onChange={e => setDomainsText(e.target.value)} rows={10} className="rounded-lg font-mono text-xs" placeholder="One domain per line..." />
              <Button size="sm" onClick={() => updatePools.mutate({ domainPool: domainsText.split("\n").map(s => s.trim()).filter(Boolean) })} className="gap-1.5 rounded-lg">
                <Save className="h-3.5 w-3.5" /> Save Domains
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {config?.domainPool?.map((d, i) => (
                <Badge key={i} variant="outline" className="text-[10px]">{d}</Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Method Pool ────────────────────────────── */}
      <Card className="rounded-xl">
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Method Pool ({config?.methodPool?.length ?? 0})</h3>
            <Button size="sm" variant="outline" onClick={() => {
              if (editingMethods) { setEditingMethods(false); }
              else { setMethodsText(config?.methodPool?.join("\n") || ""); setEditingMethods(true); }
            }} className="gap-1.5 rounded-lg">
              <Pencil className="h-3.5 w-3.5" />
              {editingMethods ? "Cancel" : "Edit"}
            </Button>
          </div>

          {editingMethods ? (
            <div className="space-y-3">
              <Textarea value={methodsText} onChange={e => setMethodsText(e.target.value)} rows={10} className="rounded-lg font-mono text-xs" placeholder="One method per line..." />
              <Button size="sm" onClick={() => updatePools.mutate({ methodPool: methodsText.split("\n").map(s => s.trim()).filter(Boolean) })} className="gap-1.5 rounded-lg">
                <Save className="h-3.5 w-3.5" /> Save Methods
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {config?.methodPool?.map((m, i) => (
                <Badge key={i} variant="outline" className="text-[10px]">{m}</Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
