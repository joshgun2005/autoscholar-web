import { lazy, Suspense } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ErrorBoundary } from "@/components/error-boundary";
import { ActiveSessionProvider } from "@/contexts/active-session-context";
import { Loader2 } from "lucide-react";
import { Chatbot } from "@/components/chatbot/chatbot";

// Critical routes — loaded eagerly (landing + main app)
import Landing from "@/pages/landing";
import Home from "@/pages/home";

// Secondary routes — lazy loaded to reduce initial bundle
const About = lazy(() => import("@/pages/about"));
const Methodology = lazy(() => import("@/pages/methodology"));
const Showcase = lazy(() => import("@/pages/showcase"));
const Admin = lazy(() => import("@/pages/admin"));
const SharedReport = lazy(() => import("@/pages/shared-report"));
const Documentation = lazy(() => import("@/pages/documentation"));
const Privacy = lazy(() => import("@/pages/privacy"));
const Terms = lazy(() => import("@/pages/terms"));
const Journal = lazy(() => import("@/pages/journal"));
const PaperDetail = lazy(() => import("@/pages/paper-detail"));
const AIPolicy = lazy(() => import("@/pages/ai-policy"));
const Agents = lazy(() => import("@/pages/agents"));
const AsidResolver = lazy(() => import("@/pages/doi-resolver"));
const Repository = lazy(() => import("@/pages/repository"));
const LivePaperRoom = lazy(() => import("@/pages/live-paper"));
const Donate = lazy(() => import("@/pages/donate"));
const ApiDocs = lazy(() => import("@/pages/api-docs"));
const NotFound = lazy(() => import("@/pages/not-found"));

function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center h-[60dvh] gap-4">
      <Loader2 className="w-5 h-5 animate-spin text-primary/60" />
      <span className="text-[11px] font-medium text-muted-foreground/40 tracking-[0.1em] uppercase">Loading</span>
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/about" component={About} />
      <Route path="/methodology" component={Methodology} />
      <Route path="/app" component={Home} />
      <Route path="/showcase" component={Showcase} />
      <Route path="/admin" component={Admin} />
      <Route path="/share/:shareId" component={SharedReport} />
      <Route path="/docs" component={Documentation} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/terms" component={Terms} />
      <Route path="/journal" component={Journal} />
      <Route path="/journal/:paperId" component={PaperDetail} />
      <Route path="/paper/:asid" component={AsidResolver} />
      <Route path="/ai-policy" component={AIPolicy} />
      <Route path="/agents" component={Agents} />
      <Route path="/repository" component={Repository} />
      <Route path="/donate" component={Donate} />
      <Route path="/api" component={ApiDocs} />
      <Route path="/live-paper" component={LivePaperRoom} />
      <Route path="/live-paper/:sessionId" component={LivePaperRoom} />
      <Route path="/live/:sessionId" component={LivePaperRoom} />
      <Route component={NotFound} />
    </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="light" storageKey="autoscholar-theme">
          <TooltipProvider>
            <ActiveSessionProvider>
              <Toaster />
              <Router />
              <Chatbot />
            </ActiveSessionProvider>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
