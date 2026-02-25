import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ErrorBoundary } from "@/components/error-boundary";
import Home from "@/pages/home";
import Showcase from "@/pages/showcase";
import Admin from "@/pages/admin";
import SharedReport from "@/pages/shared-report";
import Documentation from "@/pages/documentation";
import Privacy from "@/pages/privacy";
import Terms from "@/pages/terms";
import SlidesGenerator from "@/pages/slides-generator";
import Auth from "@/pages/auth";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/auth" component={Auth} />
      <Route path="/showcase" component={Showcase} />
      <Route path="/admin" component={Admin} />
      <Route path="/share/:shareId" component={SharedReport} />
      <Route path="/docs" component={Documentation} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/terms" component={Terms} />
      <Route path="/slides-generator" component={SlidesGenerator} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="light" storageKey="perplexity-theme">
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
