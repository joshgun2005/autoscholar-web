import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, GraduationCap, Radio, AlertCircle, Loader2,
  Clock, Activity, Eye, ChevronRight, Wifi, WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getBaseUrl } from "@/config";
import { useLiveSession } from "@/components/live-paper/useLiveSession";
import { LivePaperHeader } from "@/components/live-paper/live-paper-header";
import { LivePaperViewer } from "@/components/live-paper/live-paper-viewer";
import { AgentActivityPanel } from "@/components/live-paper/agent-panel";
import { LiveEventFeed } from "@/components/live-paper/event-feed";

// ─── Types ──────────────────────────────────────────────────

interface LiveSessionSummary {
  sessionId: string;
  title: string;
  status: "running" | "completed";
  startedAt: string;
  completedAt?: string;
  domain?: string;
  popperScore?: number;
}

// ─── Session Hub (no sessionId — public, no auth) ──────────

function SessionHub() {
  const [, setLocation] = useLocation();
  const [running, setRunning] = useState<LiveSessionSummary[]>([]);
  const [recent, setRecent] = useState<LiveSessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = async () => {
    try {
      const res = await fetch(`${getBaseUrl()}/api/live-sessions`);
      if (!res.ok) throw new Error("Failed to fetch sessions");
      const data = await res.json();
      setRunning(data.running || []);
      setRecent(data.recent || []);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(fetchSessions, 8_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.03),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,hsl(var(--primary)/0.02),transparent_50%)]" />
      </div>

      {/* Top nav */}
      <header className="sticky top-0 z-50 w-full border-b border-border/30 bg-background/90 backdrop-blur-xl">
        <div className="container flex h-13 items-center justify-between px-4 md:px-6 max-w-[1440px] mx-auto">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/")}
              className="gap-2 text-xs h-8 px-2.5 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Back</span>
            </Button>
            <div className="h-4 w-px bg-border/30" />
            <button onClick={() => setLocation("/")} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <GraduationCap className="w-4.5 h-4.5 text-primary" />
              <span className="hidden md:inline text-sm font-bold text-foreground">AutoScholar</span>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Radio className="h-3.5 w-3.5 text-primary/70" />
            <span className="text-xs font-semibold text-foreground/70">Live Sessions</span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 md:px-6 py-8 lg:py-12 max-w-[900px] relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-8"
        >
          {/* Page header */}
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              Live Paper Generation
            </h1>
            <p className="text-sm text-muted-foreground/60">
              Watch research papers being generated in real-time by the AutoScholar agent pipeline.
            </p>
          </div>

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5 flex items-start gap-3">
              <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">Unable to load sessions</p>
                <p className="text-xs text-muted-foreground">{error}</p>
              </div>
            </div>
          )}

          {!loading && !error && (
            <>
              {/* ── Active Sessions ─────────────────────────────── */}
              <section className="space-y-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50">
                    Active Sessions
                  </h2>
                  <Badge variant="outline" className={cn(
                    "text-[9px] px-2 py-0.5 border",
                    running.length > 0
                      ? "text-emerald-600 border-emerald-500/25 bg-emerald-500/8"
                      : "text-muted-foreground/50 border-border/20"
                  )}>
                    {running.length} running
                  </Badge>
                </div>

                {running.length === 0 ? (
                  <div className="rounded-xl border border-border/25 bg-muted/5 p-8 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-muted/20 flex items-center justify-center mx-auto">
                      <WifiOff className="h-5 w-5 text-muted-foreground/30" />
                    </div>
                    <p className="text-sm text-muted-foreground/50">No sessions running right now</p>
                    <p className="text-xs text-muted-foreground/35">
                      When a research paper is being generated, it will appear here in real-time.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <AnimatePresence mode="popLayout">
                      {running.map((session) => (
                        <SessionCard
                          key={session.sessionId}
                          session={session}
                          onOpen={() => setLocation(`/live-paper/${session.sessionId}`)}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </section>

              {/* ── Recent Completed Sessions ──────────────────── */}
              {recent.length > 0 && (
                <section className="space-y-4">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50">
                    Recently Generated
                  </h2>
                  <div className="space-y-2">
                    {recent.map((session) => (
                      <SessionCard
                        key={session.sessionId}
                        session={session}
                        onOpen={() => setLocation(`/live-paper/${session.sessionId}`)}
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Empty state: no sessions at all */}
              {running.length === 0 && recent.length === 0 && (
                <div className="rounded-xl border border-border/25 bg-muted/5 p-12 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center mx-auto">
                    <Activity className="h-7 w-7 text-primary/30" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground/70">No sessions yet</p>
                    <p className="text-xs text-muted-foreground/40">
                      Research sessions will appear here when papers are being generated.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="h-8" />
        </motion.div>
      </main>
    </div>
  );
}

// ─── Session Card ───────────────────────────────────────────

function SessionCard({ session, onOpen }: { session: LiveSessionSummary; onOpen: () => void }) {
  const isRunning = session.status === "running";

  function timeAgo(dateStr: string): string {
    const secs = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (secs < 60) return "just now";
    if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
    if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`;
    return `${Math.floor(secs / 86400)}d ago`;
  }

  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.3 }}
      onClick={onOpen}
      className={cn(
        "w-full flex items-center gap-4 px-5 py-4 rounded-xl border text-left transition-all duration-200 group",
        isRunning
          ? "border-primary/25 bg-primary/[0.02] hover:bg-primary/[0.04] shadow-sm"
          : "border-border/25 bg-background hover:bg-muted/10",
      )}
    >
      {/* Status indicator */}
      <div className={cn(
        "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
        isRunning ? "bg-primary/10" : "bg-muted/15",
      )}>
        {isRunning ? (
          <div className="relative">
            <Wifi className="h-4.5 w-4.5 text-primary" />
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
          </div>
        ) : (
          <Activity className="h-4.5 w-4.5 text-muted-foreground/40" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground truncate">
            {session.title || "Untitled Research"}
          </span>
          {isRunning && (
            <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-semibold text-emerald-600 border-emerald-500/25 bg-emerald-500/8 shrink-0">
              LIVE
            </Badge>
          )}
          {session.popperScore != null && (
            <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-mono text-muted-foreground/60 border-border/20 shrink-0">
              Score {session.popperScore}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground/45">
          <span className="flex items-center gap-1">
            <Clock className="h-2.5 w-2.5" />
            {isRunning ? `Started ${timeAgo(session.startedAt)}` : timeAgo(session.completedAt || session.startedAt)}
          </span>
          {session.domain && (
            <span className="truncate">{session.domain}</span>
          )}
          <span className="font-mono">{session.sessionId.slice(0, 8)}...</span>
        </div>
      </div>

      {/* Action */}
      <div className="flex items-center gap-2 shrink-0">
        {isRunning && (
          <span className="text-[10px] font-medium text-primary/60 group-hover:text-primary transition-colors flex items-center gap-1">
            <Eye className="h-3 w-3" />
            Watch
          </span>
        )}
        <ChevronRight className="h-4 w-4 text-muted-foreground/25 group-hover:text-muted-foreground/50 transition-colors" />
      </div>
    </motion.button>
  );
}

// ─── Live Paper Room (with sessionId) ───────────────────────

function LivePaperRoom({ sessionId }: { sessionId: string }) {
  const [, setLocation] = useLocation();
  const { state, connected } = useLiveSession(sessionId);

  // Loading state
  if (!state) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Connecting to live session...</p>
        </div>
      </div>
    );
  }

  const isRunning = state.status !== "completed";

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Ambient background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.03),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,hsl(var(--primary)/0.02),transparent_50%)]" />
      </div>

      {/* Top nav */}
      <header className="sticky top-0 z-50 w-full border-b border-border/30 bg-background/90 backdrop-blur-xl">
        <div className="container flex h-13 items-center justify-between px-4 md:px-6 max-w-[1440px] mx-auto">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/live-paper")}
              className="gap-2 text-xs h-8 px-2.5 text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sessions</span>
            </Button>
            <div className="h-4 w-px bg-border/30" />
            <button onClick={() => setLocation("/")} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <GraduationCap className="w-4.5 h-4.5 text-primary" />
              <span className="hidden md:inline text-sm font-bold text-foreground">AutoScholar</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            {!connected && (
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-amber-500 uppercase tracking-wider">
                <AlertCircle className="h-3 w-3" />
                Reconnecting
              </div>
            )}
            {isRunning && (
              <div className="flex items-center gap-1.5 text-[10px] font-semibold text-primary/70 uppercase tracking-wider">
                <Radio className="h-3 w-3 animate-pulse" />
                Live
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 md:px-6 py-6 lg:py-8 max-w-[1440px] relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-6 lg:space-y-8"
        >
          {/* Header block */}
          <LivePaperHeader state={state} />

          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 lg:gap-8 items-start">
            {/* Left: Manuscript viewer */}
            <div className="min-w-0">
              <LivePaperViewer state={state} />
            </div>

            {/* Right: Agents panel */}
            <div className="lg:sticky lg:top-24">
              <AgentActivityPanel agents={state.agents} />
            </div>
          </div>

          {/* Event feed */}
          <LiveEventFeed events={state.events} />

          <div className="h-8" />
        </motion.div>
      </main>
    </div>
  );
}

// ─── Route entry point ──────────────────────────────────────

export default function LivePaperPage() {
  const [matchLive, paramsLive] = useRoute("/live/:sessionId");
  const [matchLivePaper, paramsLivePaper] = useRoute("/live-paper/:sessionId");

  const sessionId = paramsLive?.sessionId || paramsLivePaper?.sessionId || null;

  if (sessionId) {
    return <LivePaperRoom sessionId={sessionId} />;
  }

  return <SessionHub />;
}
