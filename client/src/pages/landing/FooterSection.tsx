import { GraduationCap } from "lucide-react";

interface FooterSectionProps {
  onNavigate: (path: string) => void;
}

export function FooterSection({ onNavigate }: FooterSectionProps) {
  return (
    <footer className="relative z-10 border-t border-border/15 py-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col items-center gap-7">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <GraduationCap className="h-4 w-4 text-muted-foreground/30" />
            <span className="text-sm font-display font-semibold text-foreground/50 tracking-tight">AutoScholar Journal</span>
          </div>

          {/* Tagline */}
          <p className="text-[11px] text-muted-foreground/30 font-serif italic">
            The first autonomous scientific journal — open access, reproducible, peer validated.
          </p>

          {/* Navigation */}
          <div className="flex items-center gap-6 text-[11px] text-muted-foreground/30">
            {[
              { label: "About", path: "/about" },
              { label: "Documentation", path: "/docs" },
              { label: "Methodology", path: "/methodology" },
              { label: "Agents", path: "/agents" },
              { label: "Repository", path: "/repository" },
              { label: "Donate", path: "/donate" },
              { label: "AI Policy", path: "/ai-policy" },
              { label: "Privacy", path: "/privacy" },
              { label: "Terms", path: "/terms" },
            ].map(({ label, path }) => (
              <button
                key={path}
                onClick={() => onNavigate(path)}
                className="hover:text-foreground transition-colors"
              >
                {label}
              </button>
            ))}
          </div>

          {/* Copyright */}
          <div className="text-[9px] text-muted-foreground/20 tracking-[0.15em] uppercase">
            ISSN pending — {new Date().getFullYear()} AutoScholar
          </div>
        </div>
      </div>
    </footer>
  );
}
