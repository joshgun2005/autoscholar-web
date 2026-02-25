import { useLocation } from "wouter";

export function Footer() {
  const [, setLocation] = useLocation();

  return (
    <footer className="border-t border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          {/* Left: Copyright */}
          <div className="flex items-center gap-2">
            <span>© 2026 VibeQuant</span>
            <span className="hidden md:inline">|</span>
            <span className="hidden md:inline">AI-Powered Financial Intelligence</span>
          </div>

          {/* Center: Legal Links */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setLocation('/privacy')}
              className="hover:text-primary transition-colors hover:underline"
            >
              Privacy Policy
            </button>
            <span>•</span>
            <button
              onClick={() => setLocation('/terms')}
              className="hover:text-primary transition-colors hover:underline"
            >
              Terms of Service
            </button>
            <span>•</span>
            <a
              href="mailto:admin@vquant.ai"
              className="hover:text-primary transition-colors hover:underline"
            >
              Contact
            </a>
          </div>

          {/* Right: Version */}
          <div className="flex items-center gap-2 text-xs">
            <span className="px-2 py-1 rounded-full bg-primary/10 text-primary font-mono">
              v2.0.0
            </span>
          </div>
        </div>

        {/* Disclaimer - On mobile only when expanded */}
        <div className="mt-4 pt-4 border-t border-border/20 text-center">
          <p className="text-xs text-muted-foreground max-w-3xl mx-auto">
            ⚠️ <strong>Disclaimer</strong>: VibeQuant fournit des informations à but éducatif uniquement.
            Les analyses ne constituent pas des conseils financiers. Consultez toujours un conseiller financier agréé.
          </p>
        </div>
      </div>
    </footer>
  );
}
