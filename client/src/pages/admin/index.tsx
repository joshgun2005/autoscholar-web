import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Database, FileText, MessageSquare, GraduationCap, Activity, RefreshCw,
  BookOpen, Play, Shield, Zap, Settings, LogOut, Radio, Clock,
  CheckCircle, XCircle, AlertTriangle, TrendingUp, Rocket, DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AdminMetrics } from "./AdminMetrics";
import { SessionsTable, ReportsTable } from "./AdminTables";
import { AdminPapers } from "./AdminPapers";
import { AdminRuns } from "./AdminRuns";
import { AdminPrompts } from "./AdminPrompts";
import { AdminValidators } from "./AdminValidators";
import { AdminPaperGenerator } from "./AdminPaperGenerator";
import { AdminCosts } from "./AdminCosts";
import { AdminLogin } from "./AdminLogin";

interface DatabaseData {
  users: Array<{ id: string; displayName: string; createdAt: string }>;
  sessions: Array<{ id: string; sessionId: string; userId: string | null; title: string; createdAt: string; updatedAt: string; inputTokens: number; outputTokens: number; totalCost: number }>;
  sharedReports: Array<{ id: string; shareId: string; question: string; createdAt: string }>;
  metrics: { totalInputTokens: number; totalOutputTokens: number; totalTokens: number; totalCost: number; totalSessions: number; averageCostPerSession: number; userMetrics: any[] };
}

interface ActiveUsersData { total: number; generating: number; idle: number; error: number; users: any[] }
interface RealTimeStats { activeUsers: { total: number; generating: number }; sessions: { total: number; today: number }; tokens: { total: number; input: number; output: number }; cost: { total: number; today: number }; errors: { lastHour: number; rate: number } }

interface AdminPaper {
  id: string; asid: string | null; title: string; abstract: string | null; authors: string | null; domain: string | null;
  wordCount: number | null; figureCount: number | null; authorName: string | null; showInJournal: number; publishedAt: string;
  reviewScore: number | null; recommendation: string | null;
}

interface RunStats { total: number; published: number; rejected: number; failed: number; active: any | null }
interface SchedulerConfig { enabled: boolean; isGenerating: boolean; intervalMs: number; popperThreshold: number; paperCount: number; running: boolean }

export default function Admin() {
  const [, setLocation] = useLocation();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [databaseData, setDatabaseData] = useState<DatabaseData | null>(null);
  const [activeUsersData, setActiveUsersData] = useState<ActiveUsersData | null>(null);
  const [realTimeStats, setRealTimeStats] = useState<RealTimeStats | null>(null);
  const [papers, setPapers] = useState<AdminPaper[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Live scheduler data
  const { data: runStats } = useQuery<RunStats>({
    queryKey: ["/api/admin/runs/stats"],
    queryFn: async () => { const r = await fetch("/api/admin/runs/stats", { credentials: "include" }); return r.json(); },
    refetchInterval: 8000,
    enabled: isAuthenticated,
  });

  const { data: schedulerConfig } = useQuery<SchedulerConfig>({
    queryKey: ["/api/admin/scheduler/config"],
    queryFn: async () => { const r = await fetch("/api/admin/scheduler/config", { credentials: "include" }); return r.json(); },
    refetchInterval: 8000,
    enabled: isAuthenticated,
  });

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me", { credentials: "include" });
        const data = await res.json();
        if (data.user?.isAdmin) setIsAuthenticated(true);
      } catch { /* not admin */ }
      finally { setIsLoading(false); }
    };
    checkAuth();
  }, []);

  const loadDatabaseData = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/database", { credentials: "include" });
      if (!response.ok) { if (response.status === 403) setIsAuthenticated(false); return; }
      setDatabaseData(await response.json());
    } catch (err: any) { setError(err.message); }
  }, []);

  const loadActiveUsers = useCallback(async () => {
    try { const r = await fetch("/api/analytics/active-users", { credentials: "include" }); if (r.ok) setActiveUsersData(await r.json()); } catch {}
  }, []);

  const loadRealTimeStats = useCallback(async () => {
    try { const r = await fetch("/api/analytics/real-time-stats", { credentials: "include" }); if (r.ok) setRealTimeStats(await r.json()); } catch {}
  }, []);

  const loadPapers = useCallback(async () => {
    try { const r = await fetch("/api/admin/papers", { credentials: "include" }); if (r.ok) setPapers(await r.json()); } catch {}
  }, []);

  const refreshAllData = useCallback(async () => {
    await Promise.all([loadDatabaseData(), loadActiveUsers(), loadRealTimeStats(), loadPapers()]);
  }, [loadDatabaseData, loadActiveUsers, loadRealTimeStats, loadPapers]);

  useEffect(() => { if (isAuthenticated) refreshAllData(); }, [isAuthenticated]);
  useEffect(() => {
    if (!isAuthenticated || !autoRefresh) return;
    const interval = setInterval(refreshAllData, 10000);
    return () => clearInterval(interval);
  }, [isAuthenticated, autoRefresh, refreshAllData]);

  const deleteSession = async (id: string) => {
    if (!confirm("Delete this session?")) return;
    try { await fetch(`/api/admin/sessions/${id}`, { method: "DELETE", credentials: "include" }); await loadDatabaseData(); }
    catch (err: any) { setError(err.message); }
  };

  const deleteReport = async (id: string) => {
    if (!confirm("Delete this shared report?")) return;
    try { await fetch(`/api/admin/reports/${id}`, { method: "DELETE", credentials: "include" }); await loadDatabaseData(); }
    catch (err: any) { setError(err.message); }
  };

  const togglePaperVisibility = async (id: string, showInJournal: boolean) => {
    try {
      await fetch(`/api/admin/papers/${id}/visibility`, { method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ showInJournal }) });
      setPapers(prev => prev.map(p => p.id === id ? { ...p, showInJournal: showInJournal ? 1 : 0 } : p));
    } catch (err: any) { setError(err.message); }
  };

  const deletePaper = async (id: string) => {
    if (!confirm("Delete this paper permanently?")) return;
    try { await fetch(`/api/admin/papers/${id}`, { method: "DELETE", credentials: "include" }); setPapers(prev => prev.filter(p => p.id !== id)); }
    catch (err: any) { setError(err.message); }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Database className="w-8 h-8 text-primary animate-pulse" />
          </div>
          <p className="text-muted-foreground text-sm">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return <AdminLogin onAuthenticated={() => setIsAuthenticated(true)} />;

  const visiblePapers = papers.filter(p => p.showInJournal === 1).length;
  const acceptRate = runStats && runStats.total > 0 ? Math.round((runStats.published / runStats.total) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* ═══ COMMAND CENTER HEADER ═══ */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-[1400px] flex h-14 items-center justify-between px-4 sm:px-6">
          {/* Left: Logo + title */}
          <div className="flex items-center gap-3">
            <button onClick={() => setLocation('/')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-primary" />
              </div>
              <div className="hidden sm:block">
                <span className="text-sm font-bold text-foreground">AutoScholar</span>
                <span className="text-[10px] text-muted-foreground/60 ml-1.5 uppercase tracking-wider font-semibold">Command Center</span>
              </div>
            </button>
          </div>

          {/* Center: Live status indicators */}
          <div className="flex items-center gap-3 sm:gap-5">
            {/* Scheduler status */}
            <div className="flex items-center gap-1.5">
              {schedulerConfig?.enabled ? (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
              ) : (
                <span className="flex h-2 w-2 rounded-full bg-muted-foreground/30" />
              )}
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground hidden sm:inline">
                {schedulerConfig?.isGenerating ? "Generating" : schedulerConfig?.enabled ? "Scheduler ON" : "Scheduler OFF"}
              </span>
            </div>

            {/* Quick stats */}
            <div className="hidden md:flex items-center gap-4 text-[10px] font-mono text-muted-foreground/60">
              <span className="flex items-center gap-1"><FileText className="h-3 w-3" />{papers.length} papers</span>
              <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3 text-emerald-500/60" />{runStats?.published ?? 0}</span>
              <span className="flex items-center gap-1"><XCircle className="h-3 w-3 text-red-500/60" />{runStats?.rejected ?? 0}</span>
              <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" />{acceptRate}%</span>
            </div>
          </div>

          {/* Right: Controls */}
          <div className="flex items-center gap-2">
            <Badge
              variant={autoRefresh ? "default" : "outline"}
              className="cursor-pointer text-[10px] px-2 py-0.5 h-6"
              onClick={() => setAutoRefresh(!autoRefresh)}
            >
              <RefreshCw className={`w-3 h-3 mr-1 ${autoRefresh ? 'animate-spin' : ''}`} />
              {autoRefresh ? 'LIVE' : 'PAUSED'}
            </Badge>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="h-8 w-8 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* ═══ QUICK STATS BAR ═══ */}
      <div className="border-b border-border/30 bg-muted/20">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 py-3">
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {[
              { label: "Total Runs", value: runStats?.total ?? 0, icon: Activity, color: "text-primary" },
              { label: "Published", value: runStats?.published ?? 0, icon: CheckCircle, color: "text-emerald-500" },
              { label: "Rejected", value: runStats?.rejected ?? 0, icon: XCircle, color: "text-red-500" },
              { label: "Failed", value: runStats?.failed ?? 0, icon: AlertTriangle, color: "text-amber-500" },
              { label: "Papers Live", value: visiblePapers, icon: BookOpen, color: "text-blue-500" },
              { label: "Acceptance", value: `${acceptRate}%`, icon: TrendingUp, color: "text-violet-500" },
            ].map(s => (
              <div key={s.label} className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-card/60 border border-border/30">
                <s.icon className={`h-4 w-4 ${s.color} shrink-0`} />
                <div className="min-w-0">
                  <div className="text-sm font-bold text-foreground leading-tight">{s.value}</div>
                  <div className="text-[9px] text-muted-foreground/60 uppercase tracking-wider truncate">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ MAIN CONTENT ═══ */}
      <main className="mx-auto max-w-[1400px] px-4 sm:px-6 py-6">
        {error && (
          <Alert variant="destructive" className="mb-4 rounded-xl">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="runs" className="w-full">
          <TabsList className="w-full max-w-3xl h-11 bg-muted/40 backdrop-blur-sm rounded-xl p-1 mb-6">
            {[
              { value: "generate", label: "Generate", icon: Rocket },
              { value: "runs", label: "Pipeline Runs", icon: Play },
              { value: "papers", label: "Papers", icon: BookOpen },
              { value: "prompts", label: "Prompts & Config", icon: Settings },
              { value: "validators", label: "Popper", icon: Shield },
              { value: "costs", label: "Costs & Donations", icon: DollarSign },
              { value: "metrics", label: "Metrics", icon: Activity },
              { value: "legacy", label: "Data", icon: Database },
            ].map(tab => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="flex-1 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all text-[11px] font-semibold rounded-lg gap-1.5"
              >
                <tab.icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="generate" className="mt-0">
            <AdminPaperGenerator />
          </TabsContent>

          <TabsContent value="runs" className="mt-0">
            <AdminRuns />
          </TabsContent>

          <TabsContent value="papers" className="mt-0">
            <AdminPapers papers={papers} onToggleVisibility={togglePaperVisibility} onDeletePaper={deletePaper} />
          </TabsContent>

          <TabsContent value="prompts" className="mt-0">
            <AdminPrompts />
          </TabsContent>

          <TabsContent value="validators" className="mt-0">
            <AdminValidators />
          </TabsContent>

          <TabsContent value="costs" className="mt-0">
            <AdminCosts />
          </TabsContent>

          <TabsContent value="metrics" className="mt-0">
            {databaseData && (
              <AdminMetrics
                activeUsersData={activeUsersData}
                realTimeStats={realTimeStats}
                metrics={databaseData.metrics}
                totalPapers={papers.length}
                visiblePapers={visiblePapers}
                totalUsers={databaseData.users.length}
              />
            )}
          </TabsContent>

          <TabsContent value="legacy" className="mt-0 space-y-6">
            <Card className="rounded-xl">
              <CardContent className="p-5">
                <h3 className="text-sm font-bold mb-4 flex items-center gap-2 uppercase tracking-wider text-muted-foreground">
                  <MessageSquare className="w-4 h-4" />
                  Sessions ({databaseData?.sessions.length ?? 0})
                </h3>
                {databaseData && <SessionsTable sessions={databaseData.sessions} onDeleteSession={deleteSession} />}
              </CardContent>
            </Card>
            <Card className="rounded-xl">
              <CardContent className="p-5">
                <h3 className="text-sm font-bold mb-4 flex items-center gap-2 uppercase tracking-wider text-muted-foreground">
                  <FileText className="w-4 h-4" />
                  Shared Reports ({databaseData?.sharedReports.length ?? 0})
                </h3>
                {databaseData && <ReportsTable reports={databaseData.sharedReports} onDeleteReport={deleteReport} />}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
