import { useState } from "react";
import { useLocation } from "wouter";
import { Shield, Database, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AdminLoginProps {
  onAuthenticated: () => void;
}

export function AdminLogin({ onAuthenticated }: AdminLoginProps) {
  const [, setLocation] = useLocation();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to login");
      }

      onAuthenticated();
    } catch (err: any) {
      setError(err.message || "Failed to login");
    } finally {
      setIsLoading(false);
    }
  };

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
          <button
            onClick={() => setLocation('/')}
            className="flex items-center gap-2 hover-elevate active-elevate-2 px-3 py-1.5 rounded-md cursor-pointer transition-all duration-200"
          >
            <GraduationCap className="w-6 h-6 text-primary" />
            <div className="hidden md:flex items-baseline gap-2">
              <span className="text-xl font-semibold text-foreground font-bold">
                AutoScholar
              </span>
              <span className="text-sm text-muted-foreground">
                by Agentilab.ai
              </span>
            </div>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 relative z-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary via-purple-500 to-primary bg-clip-text text-transparent">
              Admin Access
            </h1>
            <p className="text-muted-foreground">
              Enter the admin password to access the database panel
            </p>
          </div>

          <Card className="border-border/50 shadow-2xl backdrop-blur-sm bg-card/95">
            <CardHeader className="space-y-3 pb-6">
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Database className="w-5 h-5 text-primary" />
                Database Administration
              </CardTitle>
              <CardDescription className="text-base">
                View and manage all database records
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="admin-password" className="text-sm font-medium">Admin Password</Label>
                  <Input
                    id="admin-password"
                    type="password"
                    placeholder="Enter admin password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="h-11 bg-background/50 border-border/50 focus:border-primary transition-all"
                  />
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200"
                  disabled={isLoading}
                >
                  {isLoading ? "Authenticating..." : "Access Admin Panel"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
