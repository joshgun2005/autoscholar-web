import { useState, useEffect, type ReactNode } from "react";
import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

const LS_KEY = "vquant_gate_auth";

export function PasswordGate({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showGreeting, setShowGreeting] = useState(false);

  useEffect(() => {
    // Always validate against the server session (source of truth for API calls)
    fetch("/api/gate/status", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.userName) {
          localStorage.setItem(LS_KEY, JSON.stringify({ authenticated: true, userName: data.userName }));
          setUserName(data.userName);
          setAuthenticated(true);
        } else {
          // Server session expired or invalid — clear stale localStorage
          localStorage.removeItem(LS_KEY);
          setAuthenticated(false);
        }
      })
      .catch(() => {
        // Network error — fallback to localStorage to avoid locking out user
        const stored = localStorage.getItem(LS_KEY);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed.authenticated && parsed.userName) {
              setUserName(parsed.userName);
              setAuthenticated(true);
              return;
            }
          } catch {}
        }
        setAuthenticated(false);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/gate/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Mot de passe incorrect");
        return;
      }

      // Persist in localStorage
      localStorage.setItem(LS_KEY, JSON.stringify({ authenticated: true, userName: data.userName }));
      setUserName(data.userName);
      setShowGreeting(true);

      // Show greeting for 2 seconds then reveal the app
      setTimeout(() => {
        setAuthenticated(true);
        setShowGreeting(false);
      }, 2000);
    } catch {
      setError("Erreur de connexion au serveur");
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (authenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Authenticated — render the app
  if (authenticated) {
    return <>{children}</>;
  }

  // Greeting animation after successful login
  if (showGreeting && userName) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-center animate-in fade-in zoom-in duration-500">
          <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-purple-500 to-primary bg-clip-text text-transparent">
            Bonjour {userName}
          </h1>
        </div>
      </div>
    );
  }

  // Not authenticated — show password form
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col relative overflow-hidden">
      {/* Decorative gradient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/60 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2 px-3 py-1.5">
            <Sparkles className="w-6 h-6 text-primary" />
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-semibold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                VQuant
              </span>
              <span className="text-sm text-muted-foreground">
                by Agentilab.ai
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 relative z-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
            <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary via-purple-500 to-primary bg-clip-text text-transparent">
              Accès protégé
            </h1>
            <p className="text-muted-foreground">
              Entrez le mot de passe pour accéder à l'application
            </p>
          </div>

          <Card className="border-border/50 shadow-2xl backdrop-blur-sm bg-card/95">
            <CardHeader className="space-y-3 pb-6">
              <CardTitle className="flex items-center gap-2 text-2xl">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Lock className="w-5 h-5 text-primary" />
                </div>
                Authentification
              </CardTitle>
              <CardDescription className="text-base">
                Cette application est protégée par un mot de passe
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="gate-password" className="text-sm font-medium">
                    Mot de passe
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="gate-password"
                      type="password"
                      placeholder="Entrez le mot de passe"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      autoFocus
                      className="pl-10 h-11 bg-background/50 border-border focus:border-primary transition-all"
                    />
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                  disabled={isLoading}
                >
                  {isLoading ? "Vérification..." : "Accéder"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
