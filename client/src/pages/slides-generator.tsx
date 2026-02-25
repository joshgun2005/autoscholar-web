import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Presentation, Loader2, FileCheck, Sparkles } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function SlidesGenerator() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [authorName, setAuthorName] = useState("");
  const [companyName, setCompanyName] = useState("VibeQuant");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [figureUrls, setFigureUrls] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);

  useEffect(() => {
    // Récupérer le contenu depuis sessionStorage
    const storedContent = sessionStorage.getItem('slidesContent');
    if (storedContent) {
      try {
        const { question: q, answer: a, figureUrls: f } = JSON.parse(storedContent);
        setQuestion(q);
        setAnswer(a);
        if (f) setFigureUrls(f);
      } catch (error) {
        console.error('Error parsing slides content:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger le contenu. Retournez à la page principale.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Aucun contenu",
        description: "Aucun contenu à convertir. Retournez à la page principale.",
        variant: "destructive",
      });
    }
  }, []);

  const handleGenerateSlides = async () => {
    if (!authorName.trim()) {
      toast({
        title: "Nom requis",
        description: "Veuillez entrer votre nom en tant qu'auteur",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      console.log('[SlidesGenerator] Sending request to generate Beamer PDF...');

      const response = await fetch('/api/convert-to-slides', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          answer,
          author: authorName,
          company: companyName,
          figureUrls,
        }),
      });

      console.log('[SlidesGenerator] Response status:', response.status);
      console.log('[SlidesGenerator] Response content-type:', response.headers.get('content-type'));

      // Check if response is an error (JSON)
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate slides');
      }

      // Check if response is OK
      if (!response.ok) {
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      // Response should be PDF blob
      console.log('[SlidesGenerator] Downloading PDF blob...');
      const blob = await response.blob();
      console.log('[SlidesGenerator] PDF blob size:', blob.size, 'bytes');

      if (blob.size === 0) {
        throw new Error('PDF is empty');
      }

      // Download the PDF
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `VibeQuant-Presentation-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log('[SlidesGenerator] ✓ PDF downloaded successfully');

      toast({
        title: "Présentation générée!",
        description: "Votre présentation Beamer PDF a été téléchargée avec succès!",
      });

      // Mark as generated for UI update
      setIsGenerated(true);
    } catch (error) {
      console.error('[SlidesGenerator] Error generating slides:', error);
      toast({
        title: "Erreur de génération",
        description: error instanceof Error ? error.message : "Une erreur s'est produite lors de la génération des slides. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateAnother = () => {
    setIsGenerated(false);
    setAuthorName("");
    sessionStorage.removeItem('slidesContent');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => setLocation('/')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>

        {!isGenerated ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Presentation className="w-6 h-6 text-primary" />
                Générateur de Présentation
              </CardTitle>
              <CardDescription>
                Convertissez votre analyse en présentation reveal.js professionnelle avec Claude AI
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Preview of content */}
              <div className="space-y-2">
                <Label>Contenu à convertir</Label>
                <div className="p-4 bg-muted/50 rounded-lg max-h-48 overflow-y-auto">
                  <p className="font-semibold text-sm mb-2">Question :</p>
                  <p className="text-sm mb-4">{question}</p>
                  <p className="font-semibold text-sm mb-2">Réponse :</p>
                  <p className="text-sm line-clamp-6">{answer}</p>
                </div>
              </div>

              {/* Author name input */}
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

              {/* Company name input */}
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

              {/* Generate button */}
              <Button
                onClick={handleGenerateSlides}
                disabled={isGenerating || !authorName.trim()}
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
                    <Presentation className="w-4 h-4" />
                    Générer la Présentation
                  </>
                )}
              </Button>

              {/* Info box */}
              <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">🎯 Comment ça marche :</strong>
                  <br />
                  1. Claude Sonnet 4.5 analyse votre contenu et extrait les points clés
                  <br />
                  2. Il structure l'analyse en slides professionnelles
                  <br />
                  3. LaTeX Beamer compile le tout en PDF de haute qualité
                  <br />
                  4. Le PDF est téléchargé automatiquement (30-90 secondes)
                  <br />
                  <br />
                  <strong className="text-foreground">✨ Résultat :</strong> Présentation PDF de qualité académique/institutionnelle!
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-2 border-green-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-500">
                <FileCheck className="w-6 h-6" />
                Présentation PDF Générée avec Succès!
              </CardTitle>
              <CardDescription>
                Votre présentation Beamer PDF professionnelle a été téléchargée
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-2 border-green-500/20 rounded-xl text-center">
                <Sparkles className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-lg font-semibold mb-2">Le PDF est dans vos téléchargements!</p>
                <p className="text-sm text-muted-foreground">
                  Ouvrez-le avec n'importe quel lecteur PDF (Adobe, Preview, etc.)
                </p>
              </div>

              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-sm">
                  <strong className="text-foreground">✨ Votre présentation contient :</strong>
                </p>
                <ul className="text-sm space-y-1 mt-2 ml-4">
                  <li>• Slide de titre avec vos informations</li>
                  <li>• Sommaire automatique</li>
                  <li>• Slides de contenu structurées</li>
                  <li>• Métriques clés mises en évidence</li>
                  <li>• Slide de conclusion</li>
                  <li>• Design professionnel LaTeX Beamer</li>
                </ul>
              </div>

              <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                <p className="text-sm">
                  <strong className="text-foreground">🎯 Technologie utilisée :</strong>
                </p>
                <ul className="text-sm space-y-1 mt-2 ml-4">
                  <li>• <strong>Claude Sonnet 4.5</strong> - Structure intelligente du contenu</li>
                  <li>• <strong>LaTeX Beamer</strong> - Rendu professionnel de qualité académique</li>
                  <li>• <strong>Theme Madrid</strong> - Design moderne et épuré</li>
                </ul>
              </div>

              <Button
                variant="default"
                size="lg"
                onClick={handleGenerateAnother}
                className="w-full gap-2"
              >
                <Presentation className="w-4 h-4" />
                Générer une Nouvelle Présentation
              </Button>

              <Button
                variant="outline"
                onClick={() => setLocation('/')}
                className="w-full"
              >
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
