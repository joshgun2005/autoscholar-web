// ── Types ──────────────────────────────────────────────────────

export interface PublishedPaper {
  id: string;
  asid: string | null;
  title: string;
  abstract: string | null;
  authors: string | null;
  keywords: string | null;
  template: string | null;
  domain: string | null;
  filename: string;
  downloadUrl: string;
  projectZipUrl: string | null;
  latexContent: string | null;
  bibtexEntries: string | null;
  wordCount: number | null;
  sectionCount: number | null;
  figureCount: number | null;
  sessionId: string | null;
  userId: string | null;
  authorName: string | null;
  publishedAt: string;
}

export interface PeerReviewData {
  id: string;
  paperId: string;
  overallScore: number;
  summary: string;
  strengths: string;
  weaknesses: string;
  detailedScores: string;
  sectionReviews: string;
  recommendation: string;
  fullReport: string;
  createdAt: string;
}

export interface DetailedScores {
  originality: number;
  methodology: number;
  results: number;
  writing: number;
  references: number;
  reproducibility: number;
}

export interface SectionReviewItem {
  section: string;
  score: number;
  comments: string;
}

export type CitationFormat = "bibtex" | "apa";
