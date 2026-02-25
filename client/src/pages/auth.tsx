import { useState } from "react";
import { User, KeyRound, Sparkles, Copy, Check, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLocation } from "wouter";

export default function Auth() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Create account state
  const [name, setName] = useState("");
  const [generatedToken, setGeneratedToken] = useState("");
  const [copied, setCopied] = useState(false);

  // Login state
  const [loginToken, setLoginToken] = useState("");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setGeneratedToken("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la création du compte");
      }

      setGeneratedToken(data.token);
      setSuccess(`Compte créé avec succès! Bienvenue, ${data.user.displayName}!`);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la création du compte");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: loginToken.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Token invalide");
      }

      setSuccess(`Bienvenue, ${data.user.displayName}!`);

      setTimeout(() => {
        setLocation('/');
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Erreur de connexion");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyToken = async () => {
    try {
      await navigator.clipboard.writeText(generatedToken);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for mobile
      const textarea = document.createElement('textarea');
      textarea.value = generatedToken;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleGoHome = () => {
    setLocation('/');
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
            className="flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer transition-all duration-200 hover:bg-muted/50"
          >
            <Sparkles className="w-6 h-6 text-primary" />
            <div className="hidden md:flex items-baseline gap-2">
              <span className="text-xl font-semibold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
                VibeQuant
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
          {/* Welcome message */}
          <div className="text-center mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
            <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-primary via-purple-500 to-primary bg-clip-text text-transparent">
              Mon Compte
            </h1>
            <p className="text-muted-foreground">
              Créez un compte pour garder vos analyses privées
            </p>
          </div>

          <Tabs defaultValue="create" className="w-full">
            <TabsList className="grid w-full grid-cols-2 h-12 bg-muted/50 backdrop-blur-sm">
              <TabsTrigger value="create" className="data-[state=active]:bg-background data-[state=active]:shadow-md transition-all">
                Créer un compte
              </TabsTrigger>
              <TabsTrigger value="login" className="data-[state=active]:bg-background data-[state=active]:shadow-md transition-all">
                Se connecter
              </TabsTrigger>
            </TabsList>

            {/* Create Account Tab */}
            <TabsContent value="create" className="mt-6">
              <Card className="border-border/50 shadow-2xl backdrop-blur-sm bg-card/95">
                <CardHeader className="space-y-3 pb-6">
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    Créer un compte
                  </CardTitle>
                  <CardDescription className="text-base">
                    Entrez votre nom pour recevoir un token d'accès unique. Vos générations resteront privées.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <form onSubmit={handleCreate} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="create-name" className="text-sm font-medium">Votre nom</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="create-name"
                          type="text"
                          placeholder="Entrez votre nom (min. 2 caractères)"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                          minLength={2}
                          disabled={isLoading || !!generatedToken}
                          className="pl-10 h-11 bg-background/50 border-border focus:border-primary transition-all"
                        />
                      </div>
                    </div>

                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    {success && !generatedToken && (
                      <Alert>
                        <AlertDescription>{success}</AlertDescription>
                      </Alert>
                    )}

                    {generatedToken && (
                      <Alert className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/50 shadow-lg">
                        <KeyRound className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                        <AlertDescription>
                          <p className="font-semibold mb-2 text-foreground">
                            Votre token d'accès
                          </p>
                          <div className="flex items-center gap-2">
                            <code className="flex-1 bg-background/80 p-3 rounded-lg text-sm break-all select-all border border-yellow-500/30 shadow-inner font-mono">
                              {generatedToken}
                            </code>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleCopyToken}
                              className="shrink-0 h-10 w-10 p-0"
                            >
                              {copied ? (
                                <Check className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                          <p className="text-xs mt-3 text-destructive font-medium">
                            IMPORTANT: Sauvegardez ce token! C'est votre SEUL moyen de vous reconnecter.
                          </p>
                          <Button
                            type="button"
                            onClick={handleGoHome}
                            className="w-full mt-4 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 text-white"
                          >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Aller à l'accueil
                          </Button>
                        </AlertDescription>
                      </Alert>
                    )}

                    {!generatedToken && (
                      <Button
                        type="submit"
                        className="w-full h-11 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                        disabled={isLoading}
                      >
                        {isLoading ? "Création en cours..." : "Créer mon compte"}
                      </Button>
                    )}
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Login Tab */}
            <TabsContent value="login" className="mt-6">
              <Card className="border-border/50 shadow-2xl backdrop-blur-sm bg-card/95">
                <CardHeader className="space-y-3 pb-6">
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <KeyRound className="w-5 h-5 text-primary" />
                    </div>
                    Se connecter
                  </CardTitle>
                  <CardDescription className="text-base">
                    Entrez votre token pour accéder à votre historique privé
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <form onSubmit={handleLogin} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="login-token" className="text-sm font-medium">Token d'accès</Label>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="login-token"
                          type="text"
                          placeholder="vquant-xxxxxxx"
                          value={loginToken}
                          onChange={(e) => setLoginToken(e.target.value)}
                          required
                          disabled={isLoading}
                          className="pl-10 h-11 bg-background/50 border-border focus:border-primary transition-all font-mono"
                        />
                      </div>
                    </div>

                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    {success && (
                      <Alert>
                        <AlertDescription>{success}</AlertDescription>
                      </Alert>
                    )}

                    <Button
                      type="submit"
                      className="w-full h-11 bg-gradient-to-r from-primary to-purple-500 hover:from-primary/90 hover:to-purple-500/90 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                      disabled={isLoading}
                    >
                      {isLoading ? "Connexion..." : "Se connecter"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
