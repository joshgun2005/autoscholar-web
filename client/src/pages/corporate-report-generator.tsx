import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText, Loader2, FileCheck, Sparkles } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function CorporateReportGenerator() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [authorName, setAuthorName] = useState("");
  const [companyName, setCompanyName] = useState("VQuant");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [figureUrls, setFigureUrls] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);

  useEffect(() => {
    const storedContent = sessionStorage.getItem('reportContent');
    if (storedContent) {
      try {
        const { question: q, answer: a, figureUrls: f } = JSON.parse(storedContent);
        setQuestion(q || "");
        setAnswer(a || "");
        if (f) setFigureUrls(f);
      } catch {
        toast({
          title: "Erreur",
          description: "Impossible de charger le contenu. Retournez à la page principale.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Aucun contenu",
        description: "Aucune analyse à convertir. Retournez à la page principale.",
        variant: "destructive",
      });
    }
  }, []);

  const handleGenerateReport = async () => {
    if (!authorName.trim()) {
      toast({
        title: "Nom requis",
        description: "Veuillez entrer votre nom en tant qu'auteur.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch('/api/generate-corporate-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          answer,
          author: authorName,
          company: companyName,
          figureUrls,
        }),
      });

      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate report');
      }

      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      if (blob.size === 0) throw new Error('PDF is empty');

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `VQuant-Report-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Rapport généré !",
        description: "Votre rapport corporatif PDF a été téléchargé avec succès.",
      });

      setIsGenerated(true);
    } catch (error) {
      console.error('[ReportGenerator] Error:', error);
      toast({
        title: "Erreur de génération",
        description: error instanceof Error ? error.message : "Une erreur s'est produite. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateAnother = () => {
    setIsGenerated(false);
    setAuthorName("");
    sessionStorage.removeItem('reportContent');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" onClick={() => setLocation('/')} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>

        {!isGenerated ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-6 h-6 text-primary" />
                Générateur de Rapport Corporatif
              </CardTitle>
              <CardDescription>
                Convertissez votre analyse en rapport institutionnel PDF — style LaTeX, format A4, avec figures et métriques clés
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Preview */}
              <div className="space-y-2">
                <Label>Contenu à convertir</Label>
                <div className="p-4 bg-muted/50 rounded-lg max-h-48 overflow-y-auto">
                  <p className="font-semibold text-sm mb-2">Question :</p>
                  <p className="text-sm mb-4 text-muted-foreground">{question || "Aucune question chargée"}</p>
                  <p className="font-semibold text-sm mb-2">Analyse :</p>
                  <p className="text-sm line-clamp-5 text-muted-foreground">{answer || "Aucune analyse chargée"}</p>
                </div>
                {figureUrls.length > 0 && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-primary" />
                    {figureUrls.length} figure{figureUrls.length > 1 ? 's' : ''} sera{figureUrls.length > 1 ? 'ont' : ''} intégrée{figureUrls.length > 1 ? 's' : ''} dans le rapport
                  </p>
                )}
              </div>

              {/* Author */}
              <div className="space-y-2">
                <Label htmlFor="author">Nom de l'auteur *</Label>
                <Input
                  id="author"
                  placeholder="Votre nom"
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  className="max-w-md"
                />
              </div>

              {/* Company */}
              <div className="space-y-2">
                <Label htmlFor="company">Société / Organisation</Label>
                <Input
                  id="company"
                  placeholder="Nom de votre société"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="max-w-md"
                />
              </div>

              {/* Generate */}
              <Button
                onClick={handleGenerateReport}
                disabled={isGenerating || !authorName.trim() || !answer}
                className="w-full sm:w-auto gap-2"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Génération en cours avec Claude AI...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    Générer le Rapport
                  </>
                )}
              </Button>

              {/* Info */}
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">🎯 Ce que contient le rapport :</strong>
                  <br />
                  1. Page de couverture corporative (titre, auteur, date)
                  <br />
                  2. Résumé exécutif extrait par Claude Opus
                  <br />
                  3. Métriques clés avec indicateurs de tendance
                  <br />
                  4. Analyse complète en typographie LaTeX (Crimson Pro)
                  <br />
                  5. Graphiques &amp; visualisations intégrés
                  <br />
                  6. Conclusion &amp; perspectives
                  <br />
                  7. En-têtes/pieds de page avec pagination
                  <br />
                  <br />
                  <strong className="text-foreground">✨ Format :</strong> PDF A4 professionnel, style institutionnel Goldman Sachs / McKinsey
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-2 border-green-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-500">
                <FileCheck className="w-6 h-6" />
                Rapport Corporatif Généré avec Succès !
              </CardTitle>
              <CardDescription>
                Votre rapport PDF institutionnel a été téléchargé
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-6 bg-gradient-to-br from-green-500/10 to-teal-500/10 border-2 border-green-500/20 rounded-xl text-center">
                <Sparkles className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-lg font-semibold mb-2">Le rapport est dans vos téléchargements !</p>
                <p className="text-sm text-muted-foreground">
                  Ouvrez-le avec Adobe Acrobat, Preview ou tout lecteur PDF
                </p>
              </div>

              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-sm">
                  <strong className="text-foreground">📄 Votre rapport contient :</strong>
                </p>
                <ul className="text-sm space-y-1 mt-2 ml-4 text-muted-foreground">
                  <li>• Page de couverture avec branding VQuant</li>
                  <li>• Résumé exécutif (style institutionnel)</li>
                  <li>• Métriques clés avec tendances</li>
                  <li>• Analyse complète multi-pages</li>
                  {figureUrls.length > 0 && <li>• {figureUrls.length} graphique{figureUrls.length > 1 ? 's' : ''} intégré{figureUrls.length > 1 ? 's' : ''}</li>}
                  <li>• Section conclusion &amp; perspectives</li>
                  <li>• En-têtes et pagination professionnels</li>
                </ul>
              </div>

              <Button variant="default" size="lg" onClick={handleGenerateAnother} className="w-full gap-2">
                <FileText className="w-4 h-4" />
                Générer un Nouveau Rapport
              </Button>

              <Button variant="outline" onClick={() => setLocation('/')} className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour à l'accueil
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
