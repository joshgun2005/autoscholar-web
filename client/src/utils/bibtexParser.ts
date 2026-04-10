import { format } from "date-fns";
import { API_BASE_URL } from "@/config";
import type { ParsedReference } from "./latexRenderer";

// Re-export ParsedReference so consumers can get it from either module
export type { ParsedReference };

// ── BibTeX parser ───────────────────────────────────────────────

export function parseBibtex(bibtex: string | null): ParsedReference[] {
  if (!bibtex) return [];
  const refs: ParsedReference[] = [];
  const entryRegex = /@\w+\{([^,]+),([^@]*)/g;
  let match;
  while ((match = entryRegex.exec(bibtex)) !== null) {
    const key = match[1].trim();
    const body = match[2];
    const getField = (name: string) => {
      const fieldMatch = body.match(new RegExp(`${name}\\s*=\\s*[{"]([^}"]*)[}"]`));
      return fieldMatch?.[1]?.trim() || '';
    };
    refs.push({
      key,
      authors: getField('author'),
      title: getField('title'),
      journal: getField('journal') || getField('booktitle'),
      year: getField('year'),
      doi: getField('doi') || undefined,
    });
  }
  return refs;
}

// ── Helper types ────────────────────────────────────────────────

interface PaperForCitation {
  id: string;
  title: string;
  authors: string | null;
  abstract: string | null;
  keywords: string | null;
  publishedAt: string;
  downloadUrl: string;
}

// ── Citation generators ─────────────────────────────────────────

function formatAuthorsForCitation(authors: string | null): string {
  if (!authors) return "AutoScholar Research";
  const parts = authors.split(",").map(s => s.trim());
  return parts[0] || "AutoScholar Research";
}

function parseKeywordsForCitation(keywords: string | null): string[] {
  if (!keywords) return [];
  try {
    const parsed = JSON.parse(keywords);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function generateBibtex(paper: PaperForCitation): string {
  const author = formatAuthorsForCitation(paper.authors);
  const date = new Date(paper.publishedAt);
  const year = date.getFullYear();
  const citeKey = `autoscholar_${author.split(' ').pop()?.toLowerCase() || 'research'}_${year}_${paper.id.slice(0, 6)}`;
  const kw = parseKeywordsForCitation(paper.keywords);
  return `@article{${citeKey},
  title     = {${paper.title}},
  author    = {${author}},
  journal   = {AutoScholar Journal},
  year      = {${year}},
  month     = {${format(date, 'MMMM').toLowerCase()}},
  abstract  = {${paper.abstract?.slice(0, 300) || ''}},${kw.length > 0 ? `\n  keywords  = {${kw.join(', ')}},` : ''}
  note      = {AI-generated research paper, AutoScholar Platform},
  url       = {${API_BASE_URL}${paper.downloadUrl}}
}`;
}

export function generateAPA(paper: PaperForCitation): string {
  const author = formatAuthorsForCitation(paper.authors);
  const date = new Date(paper.publishedAt);
  return `${author}. (${date.getFullYear()}, ${format(date, 'MMMM')}). ${paper.title}. *AutoScholar Journal*. ${API_BASE_URL}${paper.downloadUrl}`;
}

export function generateChicago(paper: PaperForCitation): string {
  const author = formatAuthorsForCitation(paper.authors);
  const date = new Date(paper.publishedAt);
  const year = date.getFullYear();
  return `${author}. "${paper.title}." *AutoScholar Journal* (${year}). ${API_BASE_URL}${paper.downloadUrl}.`;
}
