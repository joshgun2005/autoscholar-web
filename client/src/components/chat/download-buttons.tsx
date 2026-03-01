import { FileText, FileDown, FileType, Loader2, Presentation, Code, BookText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface DownloadButtonsProps {
  question: string;
  answer: string;
  contentRef?: React.RefObject<HTMLElement>;
  figureUrls?: string[];
}

export function DownloadButtons({ question, answer, contentRef, figureUrls = [] }: DownloadButtonsProps) {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isGeneratingDOCX, setIsGeneratingDOCX] = useState(false);
  const [isGeneratingHTML, setIsGeneratingHTML] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleDownloadMarkdown = () => {
    const content = answer;
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vibequant-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Téléchargement réussi",
      description: "Le fichier Markdown a été téléchargé avec succès.",
    });
  };

  const handleDownloadPDF = async () => {
    setIsGeneratingPDF(true);

    try {
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          answer
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vibequant-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "PDF généré avec succès",
        description: "Le rapport PDF a été téléchargé.",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: "Erreur de génération",
        description: "Une erreur s'est produite lors de la génération du PDF. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleDownloadDOCX = async () => {
    setIsGeneratingDOCX(true);

    try {
      const response = await fetch('/api/generate-docx', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          answer
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate Word document');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vibequant-${Date.now()}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Word généré avec succès",
        description: "Le document Word a été téléchargé.",
      });
    } catch (error) {
      console.error('Error generating DOCX:', error);
      toast({
        title: "Erreur de génération",
        description: "Une erreur s'est produite lors de la génération du Word. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingDOCX(false);
    }
  };

  const handleDownloadHTML = async () => {
    setIsGeneratingHTML(true);

    try {
      const response = await fetch('/api/generate-html', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          answer
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate HTML');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vibequant-${Date.now()}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "HTML généré avec succès",
        description: "Le rapport HTML a été téléchargé.",
      });
    } catch (error) {
      console.error('Error generating HTML:', error);
      toast({
        title: "Erreur de génération",
        description: "Une erreur s'est produite lors de la génération du HTML. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingHTML(false);
    }
  };

  const handleConvertToReport = () => {
    try {
      sessionStorage.setItem('reportContent', JSON.stringify({ question, answer, figureUrls }));
    } catch {
      try {
        sessionStorage.setItem('reportContent', JSON.stringify({ question, answer, figureUrls: [] }));
      } catch { /* noop */ }
    }
    setLocation('/report-generator');
    toast({
      title: "Redirection...",
      description: "Ouverture du générateur de rapport corporatif",
    });
  };

  const handleConvertToSlides = () => {
    // Store content in sessionStorage to pass to slides generator page
    // figureUrls can be large base64 strings — try with them first, fall back without
    try {
      sessionStorage.setItem('slidesContent', JSON.stringify({ question, answer, figureUrls }));
    } catch {
      try {
        sessionStorage.setItem('slidesContent', JSON.stringify({ question, answer, figureUrls: [] }));
      } catch {
        // sessionStorage unavailable — slides page will handle missing data
      }
    }
    setLocation('/slides-generator');

    toast({
      title: "Redirection...",
      description: "Ouverture du générateur de slides",
    });
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleDownloadMarkdown}
        className="gap-2 hover:bg-muted transition-colors"
        disabled={isGeneratingPDF}
      >
        <FileText className="w-4 h-4" />
        <span className="hidden sm:inline">Télécharger MD</span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleDownloadPDF}
        className="gap-2 hover:bg-muted transition-colors"
        disabled={isGeneratingPDF}
      >
        {isGeneratingPDF ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="hidden sm:inline">Génération...</span>
          </>
        ) : (
          <>
            <FileDown className="w-4 h-4" />
            <span className="hidden sm:inline">Télécharger PDF</span>
          </>
        )}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleDownloadDOCX}
        className="gap-2 hover:bg-muted transition-colors"
        disabled={isGeneratingDOCX}
      >
        {isGeneratingDOCX ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="hidden sm:inline">Génération...</span>
          </>
        ) : (
          <>
            <FileType className="w-4 h-4" />
            <span className="hidden sm:inline">Télécharger Word</span>
          </>
        )}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleDownloadHTML}
        className="gap-2 hover:bg-muted transition-colors"
        disabled={isGeneratingHTML}
      >
        {isGeneratingHTML ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="hidden sm:inline">Génération...</span>
          </>
        ) : (
          <>
            <Code className="w-4 h-4" />
            <span className="hidden sm:inline">Télécharger HTML</span>
          </>
        )}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleConvertToReport}
        className="gap-2 hover:bg-muted transition-colors"
        disabled={isGeneratingPDF || isGeneratingDOCX || !question || !answer}
      >
        <BookText className="w-4 h-4" />
        <span className="hidden sm:inline">Rapport Corporatif</span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleConvertToSlides}
        className="gap-2 hover:bg-muted transition-colors"
        disabled={isGeneratingPDF || isGeneratingDOCX || !question || !answer}
      >
        <Presentation className="w-4 h-4" />
        <span className="hidden sm:inline">Convertir en Slides</span>
      </Button>
    </>
  );
}
