import { Button } from "@/components/ui/button";
import { Share2, Check, Copy } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface ShareButtonProps {
  question: string;
  answer: string;
  toolResults: any[];
  sources: any[];
  customPythonFigures?: any[];
}

export function ShareButton({ question, answer, toolResults, sources, customPythonFigures }: ShareButtonProps) {
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const { toast } = useToast();

  const handleShare = async () => {
    if (!question || !answer) {
      toast({
        title: "Error",
        description: "Cannot share an empty report",
        variant: "destructive",
      });
      return;
    }

    setIsSharing(true);
    
    try {
      const response = await fetch("/api/share", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question,
          answer,
          toolResults,
          sources,
          customPythonFigures,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to share");
      }

      // Créer le lien de partage
      const url = `${window.location.origin}/share/${data.shareId}`;
      setShareUrl(url);
    } catch (error) {
      console.error("Share error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create share link",
        variant: "destructive",
      });
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
      
      toast({
        title: "Link copied!",
        description: "The link has been copied to your clipboard",
      });
    } catch (error) {
      // Fallback for mobile
      try {
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
        
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
        
        toast({
          title: "Link copied!",
          description: "The link has been copied to your clipboard",
        });
      } catch (fallbackError) {
        toast({
          title: "Error",
          description: "Cannot copy automatically. Please copy the link manually.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={handleShare}
        disabled={isSharing || !question || !answer}
        data-testid="button-share"
        className="hover-elevate active-elevate-2"
      >
        {isSharing ? (
          <>
            <Share2 className="w-4 h-4 mr-2 animate-pulse" />
            Creating...
          </>
        ) : (
          <>
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </>
        )}
      </Button>

      <Dialog open={!!shareUrl} onOpenChange={(open) => !open && setShareUrl(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share link created!</DialogTitle>
            <DialogDescription>
              Copy this link to share your analysis
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2">
            <div className="grid flex-1 gap-2">
              <Input
                readOnly
                value={shareUrl || ''}
                data-testid="input-share-url"
                className="font-mono text-sm"
              />
            </div>
            <Button
              type="button"
              size="sm"
              onClick={handleCopyLink}
              data-testid="button-copy-link"
              className="hover-elevate active-elevate-2"
            >
              {isCopied ? (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
