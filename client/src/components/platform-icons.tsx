/**
 * Real platform/brand SVG icons for academic and professional services.
 * Each icon renders as an inline SVG at the specified size.
 */

interface IconProps {
  className?: string;
  size?: number;
}

export function GoogleScholarIcon({ className, size = 18 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor">
      <path d="M5.242 13.769 0 9.5 12 0l12 9.5-5.242 4.269C17.548 11.249 14.978 9.5 12 9.5c-2.977 0-5.548 1.748-6.758 4.269zM12 10a7 7 0 1 0 0 14 7 7 0 0 0 0-14z" />
    </svg>
  );
}

export function SSRNIcon({ className, size = 18 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor">
      <path d="M3 3h18v18H3V3zm2 2v14h14V5H5zm3 3h8v1.5H8V8zm0 3h8v1.5H8v-1.5zm0 3h5v1.5H8V14z" />
    </svg>
  );
}

export function ORCIDIcon({ className, size = 18 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor">
      <path d="M12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zM7.369 4.378c.525 0 .947.431.947.947s-.422.947-.947.947a.95.95 0 0 1-.947-.947c0-.525.422-.947.947-.947zm-.722 3.038h1.444v10.041H6.647V7.416zm3.562 0h3.9c3.712 0 5.344 2.653 5.344 5.025 0 2.578-2.016 5.025-5.325 5.025h-3.919V7.416zm1.444 1.303v7.444h2.297c3.272 0 4.022-2.484 4.022-3.722 0-1.847-1.238-3.722-3.806-3.722h-2.513z" />
    </svg>
  );
}

export function GitHubIcon({ className, size = 18 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor">
      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
    </svg>
  );
}

export function LinkedInIcon({ className, size = 18 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

export function ResearchGateIcon({ className, size = 18 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor">
      <path d="M19.586 0c-1.752.005-3.53.548-4.794 1.756-1.49 1.423-1.952 3.378-1.952 5.43 0 1.587.393 3.122 1.55 4.27.258.256.702.58.702.58l-.07.278c-.14.557-.28 1.084-.488 1.613-.384.978-1.084 1.77-2.11 2.084-.427.13-.923.18-1.378.1l-.17-.03c1.09-.627 1.745-1.683 1.745-3.003 0-2.415-2.298-3.998-4.602-3.998H2.396v11.36H5.11v-4.24h1.267c.543.014 1.02.1 1.393.407.464.382.605.97.605 1.55v2.284H11.1v-2.37c0-.99-.163-1.918-.78-2.66-.153-.184-.393-.368-.604-.52.816-.27 1.527-.77 2.05-1.426.648-.815 1.058-1.812 1.33-2.826.088-.33.163-.67.22-1.01l.01-.02c.78.648 1.724.956 2.71.956 2.487 0 4.56-1.91 4.56-4.43C20.596 2.07 18.69.22 16.268 0h3.318zM7.694 8.382H5.11V5.31h2.585c1.054 0 1.934.62 1.934 1.536 0 .915-.88 1.536-1.934 1.536zm8.487 1.357c-1.665 0-3.015-1.407-3.015-3.14 0-1.735 1.35-3.142 3.015-3.142 1.666 0 3.015 1.407 3.015 3.141s-1.35 3.14-3.015 3.14z" />
    </svg>
  );
}

export function ArXivIcon({ className, size = 18 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor">
      <path d="M2.1 4.5 12 0l9.9 4.5V12l-9.9 4.5L2.1 12V4.5zm2 1.4v5.2L12 15l7.9-3.9V5.9L12 2 4.1 5.9zM12 18l9.9-4.5V18L12 24 2.1 18v-4.5L12 18z" />
    </svg>
  );
}

export function SemanticScholarIcon({ className, size = 18 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor">
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm-1.5 17.5h-3v-11h3v11zm6 0h-3V9.5h3v8z" />
    </svg>
  );
}

export function TwitterXIcon({ className, size = 18 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function SubstackIcon({ className, size = 18 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="currentColor">
      <path d="M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24l9.54-5.5L20.539 24V10.812H1.46zM22.539 0H1.46v2.836h21.08V0z" />
    </svg>
  );
}

export function GlobeIcon({ className, size = 18 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

export function UniversityIcon({ className, size = 18 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 20h20M4 20V10l8-6 8 6v10M9 20v-6h6v6" />
      <path d="M9 14h6" />
    </svg>
  );
}

/** Map platform key to its icon component */
export const platformIconMap: Record<string, React.FC<IconProps>> = {
  google_scholar: GoogleScholarIcon,
  ssrn: SSRNIcon,
  orcid: ORCIDIcon,
  github: GitHubIcon,
  linkedin: LinkedInIcon,
  researchgate: ResearchGateIcon,
  arxiv: ArXivIcon,
  semantic_scholar: SemanticScholarIcon,
  twitter: TwitterXIcon,
  substack: SubstackIcon,
  personal_website: GlobeIcon,
  university: UniversityIcon,
  other: GlobeIcon,
};

/** Platform display metadata */
export const platformMeta: Record<string, { label: string; placeholder: string; color: string }> = {
  google_scholar: { label: "Google Scholar", placeholder: "https://scholar.google.com/citations?user=...", color: "#4285F4" },
  ssrn: { label: "SSRN", placeholder: "https://papers.ssrn.com/sol3/cf_dev/AbsByAuth.cfm?per_id=...", color: "#154881" },
  orcid: { label: "ORCID", placeholder: "https://orcid.org/0000-0002-...", color: "#A6CE39" },
  github: { label: "GitHub", placeholder: "https://github.com/username", color: "#333333" },
  linkedin: { label: "LinkedIn", placeholder: "https://www.linkedin.com/in/username", color: "#0A66C2" },
  researchgate: { label: "ResearchGate", placeholder: "https://www.researchgate.net/profile/...", color: "#00CCBB" },
  arxiv: { label: "arXiv", placeholder: "https://arxiv.org/a/author.html", color: "#B31B1B" },
  semantic_scholar: { label: "Semantic Scholar", placeholder: "https://www.semanticscholar.org/author/...", color: "#1857B6" },
  twitter: { label: "X / Twitter", placeholder: "https://x.com/username", color: "#000000" },
  substack: { label: "Substack", placeholder: "https://username.substack.com", color: "#FF6719" },
  personal_website: { label: "Personal Website", placeholder: "https://yoursite.com", color: "#6366F1" },
  university: { label: "University Profile", placeholder: "https://university.edu/~username", color: "#7C3AED" },
  other: { label: "Other Link", placeholder: "https://...", color: "#6B7280" },
};
