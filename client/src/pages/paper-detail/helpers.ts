// ── Helper functions ──────────────────────────────────────────

export function parseKeywords(keywords: string | null): string[] {
  if (!keywords) return [];
  try {
    const parsed = JSON.parse(keywords);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function formatAuthors(authors: string | null): string {
  if (!authors) return "AutoScholar Research";
  const parts = authors.split(",").map(s => s.trim());
  return parts[0] || "AutoScholar Research";
}

export function formatAffiliation(authors: string | null): string | null {
  if (!authors) return null;
  const parts = authors.split(",").map(s => s.trim());
  if (parts.length >= 2) {
    return parts.slice(1).filter(p => !p.includes("@")).join(", ");
  }
  return null;
}

export function formatEmail(authors: string | null): string | null {
  if (!authors) return null;
  const parts = authors.split(",").map(s => s.trim());
  return parts.find(p => p.includes("@")) || null;
}

export function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600 dark:text-green-400';
  if (score >= 65) return 'text-blue-600 dark:text-blue-400';
  if (score >= 45) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

export function getScoreBg(score: number): string {
  if (score >= 80) return 'bg-green-500/10 border-green-500/20';
  if (score >= 65) return 'bg-blue-500/10 border-blue-500/20';
  if (score >= 45) return 'bg-amber-500/10 border-amber-500/20';
  return 'bg-red-500/10 border-red-500/20';
}

export function getRecommendationInfo(rec: string): { label: string; color: string } {
  switch (rec) {
    case 'accept': return { label: 'Accept', color: 'text-green-600 dark:text-green-400 bg-green-500/10 border-green-500/20' };
    case 'minor_revision': return { label: 'Minor Revision', color: 'text-blue-600 dark:text-blue-400 bg-blue-500/10 border-blue-500/20' };
    case 'major_revision': return { label: 'Major Revision', color: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20' };
    case 'reject': return { label: 'Reject', color: 'text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/20' };
    default: return { label: rec, color: 'text-muted-foreground bg-muted/30 border-border/40' };
  }
}
