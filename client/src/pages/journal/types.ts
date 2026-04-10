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
  wordCount: number | null;
  sectionCount: number | null;
  figureCount: number | null;
  userId: string | null;
  authorName: string | null;
  publishedAt: string;
  inputTokens: number | null;
  outputTokens: number | null;
  generationCost: number | null;
}

export type SortOrder = "newest" | "oldest" | "longest";
export type ViewMode = "list" | "grid";

export const PAPERS_PER_PAGE = 10;

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
