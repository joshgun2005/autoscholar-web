/**
 * Academic Search Service
 * Integrates 4 primary sources for real academic citations:
 *   1. OpenAlex         — free, 250M+ works, primary source, excellent coverage
 *   2. arXiv            — preprints (q-fin, econ, stat.ML)
 *   3. CrossRef         — DOI validation, 140M+ articles
 *   4. Google Scholar   — via SerpAPI (requires SERPAPI_KEY), widest coverage
 * Semantic Scholar functions are retained for backward compatibility but are no
 * longer used by the gap finder pipeline (which relies on OpenAlex + CrossRef).
 * All sources except Google Scholar are free with no API key.
 */

import { academicBreakers } from '../utils/circuitBreaker';

const SEMANTIC_SCHOLAR_BASE = 'https://api.semanticscholar.org/graph/v1';
const CROSSREF_BASE = 'https://api.crossref.org';
const ARXIV_BASE = 'https://export.arxiv.org/api';
const OPENALEX_BASE = 'https://api.openalex.org';

// Fields to request from Semantic Scholar
const S2_PAPER_FIELDS = 'paperId,title,authors,year,abstract,citationCount,venue,publicationVenue,externalIds,openAccessPdf,fieldsOfStudy,publicationTypes';

export interface AcademicPaper {
  title: string;
  authors: string[];
  year: number | null;
  abstract: string;
  doi: string | null;
  arxivId: string | null;
  venue: string;
  citationCount: number;
  pdfUrl: string | null;
  source: 'semantic_scholar' | 'openalex' | 'arxiv' | 'crossref' | 'google_scholar';
  bibtex: string;
  citeKey: string;
}

export type AcademicSource = AcademicPaper['source'];

// ─────────────────────────────────────────────
// Semantic Scholar
// ─────────────────────────────────────────────

export async function searchSemanticScholar(
  query: string,
  limit = 10,
  fields?: string,
  yearFilter?: string,
): Promise<AcademicPaper[]> {
  const params = new URLSearchParams({
    query,
    limit: String(Math.min(limit, 100)),
    fields: fields || S2_PAPER_FIELDS,
  });
  if (yearFilter) params.set('year', yearFilter);

  // Retry with exponential backoff on 429 (rate limit)
  const maxRetries = 3;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const resp = await fetch(`${SEMANTIC_SCHOLAR_BASE}/paper/search?${params}`, {
      headers: { 'User-Agent': 'AutoScholar/1.0' },
    });

    if (resp.status === 429 && attempt < maxRetries) {
      const wait = (attempt + 1) * 2000; // 2s, 4s, 6s
      console.log(`[Gauss] Semantic Scholar 429 — retrying in ${wait / 1000}s (attempt ${attempt + 1}/${maxRetries})`);
      await new Promise(r => setTimeout(r, wait));
      continue;
    }

    if (!resp.ok) throw new Error(`Semantic Scholar search failed: ${resp.status}`);
    const data = await resp.json();
    return (data.data || []).map(parseSemScholarPaper);
  }

  return []; // Should not reach here, but safety fallback
}

export async function getSemanticScholarPaper(paperId: string): Promise<AcademicPaper | null> {
  const resp = await fetch(
    `${SEMANTIC_SCHOLAR_BASE}/paper/${paperId}?fields=${S2_PAPER_FIELDS}`,
    { headers: { 'User-Agent': 'AutoScholar/1.0' } },
  );
  if (!resp.ok) return null;
  return parseSemScholarPaper(await resp.json());
}

export async function getSemanticScholarReferences(paperId: string, limit = 20): Promise<AcademicPaper[]> {
  const resp = await fetch(
    `${SEMANTIC_SCHOLAR_BASE}/paper/${paperId}/references?fields=${S2_PAPER_FIELDS}&limit=${limit}`,
    { headers: { 'User-Agent': 'AutoScholar/1.0' } },
  );
  if (!resp.ok) return [];
  const data = await resp.json();
  return (data.data || []).map((r: any) => r.citedPaper).filter(Boolean).map(parseSemScholarPaper);
}

function parseSemScholarPaper(p: any): AcademicPaper {
  const authors = (p.authors || []).map((a: any) => a.name);
  const doi = p.externalIds?.DOI || null;
  const arxivId = p.externalIds?.ArXiv || null;
  const citeKey = buildCiteKey(authors[0] || 'unknown', p.year);
  return {
    title: p.title || 'Untitled',
    authors,
    year: p.year || null,
    abstract: p.abstract || '',
    doi,
    arxivId,
    venue: p.venue || p.publicationVenue?.name || '',
    citationCount: p.citationCount || 0,
    pdfUrl: p.openAccessPdf?.url || null,
    source: 'semantic_scholar',
    citeKey,
    bibtex: buildBibtex({ title: p.title, authors, year: p.year, doi, venue: p.venue || p.publicationVenue?.name || '', citeKey }),
  };
}

// ─────────────────────────────────────────────
// arXiv
// ─────────────────────────────────────────────

export async function searchArxiv(
  query: string,
  limit = 10,
  category?: string,
): Promise<AcademicPaper[]> {
  const searchQuery = category ? `cat:${category} AND ${query}` : query;
  const params = new URLSearchParams({
    search_query: `all:${searchQuery}`,
    start: '0',
    max_results: String(Math.min(limit, 50)),
    sortBy: 'relevance',
    sortOrder: 'descending',
  });

  const resp = await fetch(`${ARXIV_BASE}/query?${params}`, {
    headers: { 'User-Agent': 'AutoScholar/1.0' },
  });
  if (!resp.ok) throw new Error(`arXiv search failed: ${resp.status}`);

  const xml = await resp.text();
  return parseArxivXml(xml);
}

function parseArxivXml(xml: string): AcademicPaper[] {
  const entries = xml.match(/<entry>([\s\S]*?)<\/entry>/g) || [];
  return entries.map((entry) => {
    const get = (tag: string) => {
      const m = entry.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
      return m ? m[1].trim() : '';
    };
    const authorRe = /<author>\s*<name>([\s\S]*?)<\/name>/g;
    const authors: string[] = [];
    let am: RegExpExecArray | null;
    while ((am = authorRe.exec(entry)) !== null) authors.push(am[1].trim());
    const idUrl = get('id');
    const arxivId = idUrl.replace('http://arxiv.org/abs/', '').replace('https://arxiv.org/abs/', '');
    const published = get('published');
    const year = published ? parseInt(published.substring(0, 4)) : null;
    const title = get('title').replace(/\s+/g, ' ');
    const abstract = get('summary').replace(/\s+/g, ' ');
    const citeKey = buildCiteKey(authors[0] || 'unknown', year);

    return {
      title,
      authors,
      year,
      abstract,
      doi: null,
      arxivId,
      venue: 'arXiv preprint',
      citationCount: 0,
      pdfUrl: `https://arxiv.org/pdf/${arxivId}`,
      source: 'arxiv' as const,
      citeKey,
      bibtex: buildBibtex({ title, authors, year, doi: null, venue: 'arXiv preprint', citeKey, arxivId }),
    };
  });
}

// ─────────────────────────────────────────────
// CrossRef (DOI lookup → BibTeX)
// ─────────────────────────────────────────────

export async function lookupDoi(doi: string): Promise<AcademicPaper | null> {
  const resp = await fetch(`${CROSSREF_BASE}/works/${encodeURIComponent(doi)}`, {
    headers: { 'User-Agent': 'AutoScholar/1.0 (mailto:research@autoscholar.ai)' },
  });
  if (!resp.ok) return null;
  const data = await resp.json();
  const w = data.message;
  return parseCrossrefWork(w);
}

export async function searchCrossref(query: string, limit = 10, filter?: string): Promise<AcademicPaper[]> {
  const params = new URLSearchParams({
    query,
    rows: String(Math.min(limit, 50)),
    select: 'DOI,title,author,published,container-title,abstract,is-referenced-by-count',
  });
  if (filter) params.set('filter', filter);

  const resp = await fetch(`${CROSSREF_BASE}/works?${params}`, {
    headers: { 'User-Agent': 'AutoScholar/1.0 (mailto:research@autoscholar.ai)' },
  });
  if (!resp.ok) throw new Error(`CrossRef search failed: ${resp.status}`);
  const data = await resp.json();
  return (data.message?.items || []).map(parseCrossrefWork).filter(Boolean) as AcademicPaper[];
}

function parseCrossrefWork(w: any): AcademicPaper | null {
  if (!w) return null;
  const authors = (w.author || []).map((a: any) => `${a.given || ''} ${a.family || ''}`.trim());
  const year = w.published?.['date-parts']?.[0]?.[0] || null;
  const title = Array.isArray(w.title) ? w.title[0] : (w.title || 'Untitled');
  const venue = Array.isArray(w['container-title']) ? w['container-title'][0] : (w['container-title'] || '');
  const doi = w.DOI || null;
  const citeKey = buildCiteKey(authors[0] || 'unknown', year);
  return {
    title,
    authors,
    year,
    abstract: w.abstract || '',
    doi,
    arxivId: null,
    venue,
    citationCount: w['is-referenced-by-count'] || 0,
    pdfUrl: null,
    source: 'crossref',
    citeKey,
    bibtex: buildBibtex({ title, authors, year, doi, venue, citeKey }),
  };
}

// ─────────────────────────────────────────────
// OpenAlex (250M+ works, completely free, no key)
// ─────────────────────────────────────────────

const OPENALEX_FIELDS = 'id,title,authorships,publication_year,doi,cited_by_count,primary_location,open_access,abstract_inverted_index,topics';

export async function searchOpenAlex(
  query: string,
  limit = 10,
  filter?: string,
): Promise<AcademicPaper[]> {
  const params = new URLSearchParams({
    search: query,
    'per-page': String(Math.min(limit, 50)),
    select: OPENALEX_FIELDS,
    mailto: 'research@autoscholar.ai',
  });
  if (filter) params.set('filter', filter);

  const resp = await fetch(`${OPENALEX_BASE}/works?${params}`, {
    headers: { 'User-Agent': 'AutoScholar/1.0 (mailto:research@autoscholar.ai)' },
  });
  if (!resp.ok) throw new Error(`OpenAlex search failed: ${resp.status}`);
  const data = await resp.json();
  return (data.results || []).map(parseOpenAlexWork);
}

export async function getOpenAlexWork(doi: string): Promise<AcademicPaper | null> {
  const cleanDoi = doi.replace('https://doi.org/', '');
  const resp = await fetch(
    `${OPENALEX_BASE}/works/https://doi.org/${cleanDoi}?select=${OPENALEX_FIELDS}&mailto=research@autoscholar.ai`,
    { headers: { 'User-Agent': 'AutoScholar/1.0' } },
  );
  if (!resp.ok) return null;
  return parseOpenAlexWork(await resp.json());
}

function parseOpenAlexWork(w: any): AcademicPaper {
  const authors = (w.authorships || []).map((a: any) => a.author?.display_name || '').filter(Boolean);
  const doi = w.doi ? w.doi.replace('https://doi.org/', '') : null;
  const year = w.publication_year || null;
  const venue = w.primary_location?.source?.display_name || '';
  const pdfUrl = w.open_access?.oa_url || null;

  // Reconstruct abstract from inverted index (OpenAlex stores it as word→positions map)
  let abstract = '';
  if (w.abstract_inverted_index) {
    const positions: { word: string; pos: number }[] = [];
    for (const [word, posList] of Object.entries(w.abstract_inverted_index as Record<string, number[]>)) {
      for (const pos of posList) positions.push({ word, pos });
    }
    abstract = positions.sort((a, b) => a.pos - b.pos).map((p) => p.word).join(' ');
  }

  const citeKey = buildCiteKey(authors[0] || 'unknown', year);
  return {
    title: w.title || 'Untitled',
    authors,
    year,
    abstract,
    doi,
    arxivId: null,
    venue,
    citationCount: w.cited_by_count || 0,
    pdfUrl,
    source: 'openalex',
    citeKey,
    bibtex: buildBibtex({ title: w.title || 'Untitled', authors, year, doi, venue, citeKey }),
  };
}

// ─────────────────────────────────────────────
// Google Scholar via SerpAPI (requires SERPAPI_KEY)
// ─────────────────────────────────────────────

export async function searchGoogleScholarDirect(
  query: string,
  limit = 10,
  asOf?: string,
): Promise<AcademicPaper[]> {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) throw new Error('SERPAPI_KEY not set — Google Scholar unavailable');

  const params = new URLSearchParams({
    engine: 'google_scholar',
    q: query,
    num: String(Math.min(limit, 20)),
    api_key: apiKey,
  });
  if (asOf) params.set('as_ylo', asOf);

  const resp = await fetch(`https://serpapi.com/search?${params}`);
  if (!resp.ok) throw new Error(`SerpAPI Scholar failed: ${resp.status}`);
  const data = await resp.json();

  return (data.organic_results || []).map((r: any) => {
    const authors = (r.publication_info?.authors || []).map((a: any) => a.name);
    const yearMatch = (r.publication_info?.summary || '').match(/\b(19|20)\d{2}\b/);
    const year = yearMatch ? parseInt(yearMatch[0]) : null;
    const venue = r.publication_info?.summary?.split('-')[0]?.trim() || '';
    const citeKey = buildCiteKey(authors[0] || 'unknown', year);
    return {
      title: r.title || 'Untitled',
      authors,
      year,
      abstract: r.snippet || '',
      doi: null,
      arxivId: null,
      venue,
      citationCount: r.inline_links?.cited_by?.total || 0,
      pdfUrl: r.resources?.find((x: any) => x.file_format === 'PDF')?.link || null,
      source: 'google_scholar' as const,
      citeKey,
      bibtex: buildBibtex({ title: r.title || 'Untitled', authors, year, doi: null, venue, citeKey }),
    };
  });
}

// ─────────────────────────────────────────────
// OpenAlex Citation Expansion (no API key needed, generous rate limits)
// ─────────────────────────────────────────────

/**
 * Get referenced works for a paper via OpenAlex.
 * Works with DOI or OpenAlex ID. No API key needed — just polite pool (mailto).
 */
export async function getOpenAlexReferences(doi: string, limit = 15): Promise<AcademicPaper[]> {
  try {
    const cleanDoi = doi.replace('https://doi.org/', '');
    // First, get the OpenAlex work to find its referenced_works
    const workResp = await fetch(
      `${OPENALEX_BASE}/works/https://doi.org/${cleanDoi}?select=id,referenced_works&mailto=research@autoscholar.ai`,
      { headers: { 'User-Agent': 'AutoScholar/1.0 (mailto:research@autoscholar.ai)' } },
    );
    if (!workResp.ok) return [];
    const work = await workResp.json();

    const refIds = (work.referenced_works || []).slice(0, limit);
    if (refIds.length === 0) return [];

    // Batch-fetch referenced works using OpenAlex filter (up to 50 IDs per request)
    const idsFilter = refIds.map((id: string) => id.replace('https://openalex.org/', '')).join('|');
    const refsResp = await fetch(
      `${OPENALEX_BASE}/works?filter=openalex_id:${idsFilter}&select=${OPENALEX_FIELDS}&per-page=${limit}&mailto=research@autoscholar.ai`,
      { headers: { 'User-Agent': 'AutoScholar/1.0 (mailto:research@autoscholar.ai)' } },
    );
    if (!refsResp.ok) return [];
    const refsData = await refsResp.json();
    return (refsData.results || []).map(parseOpenAlexWork);
  } catch {
    return [];
  }
}

/**
 * Get citing works for a paper via OpenAlex (papers that cite this one).
 */
export async function getOpenAlexCitations(doi: string, limit = 10): Promise<AcademicPaper[]> {
  try {
    const cleanDoi = doi.replace('https://doi.org/', '');
    const resp = await fetch(
      `${OPENALEX_BASE}/works?filter=cites:https://doi.org/${cleanDoi}&select=${OPENALEX_FIELDS}&per-page=${limit}&sort=cited_by_count:desc&mailto=research@autoscholar.ai`,
      { headers: { 'User-Agent': 'AutoScholar/1.0 (mailto:research@autoscholar.ai)' } },
    );
    if (!resp.ok) return [];
    const data = await resp.json();
    return (data.results || []).map(parseOpenAlexWork);
  } catch {
    return [];
  }
}

/**
 * Get references for a paper via CrossRef (works cited by this DOI).
 */
export async function getCrossRefReferences(doi: string, limit = 15): Promise<AcademicPaper[]> {
  try {
    const cleanDoi = doi.replace('https://doi.org/', '');
    const resp = await fetch(
      `${CROSSREF_BASE}/works/${encodeURIComponent(cleanDoi)}`,
      { headers: { 'User-Agent': 'AutoScholar/1.0 (mailto:research@autoscholar.ai)' } },
    );
    if (!resp.ok) return [];
    const data = await resp.json();
    const references = (data.message?.reference || []).slice(0, limit);

    const papers: AcademicPaper[] = [];
    for (const ref of references) {
      if (!ref.DOI && !ref['article-title']) continue;
      const authors = ref.author ? [ref.author] : [];
      const year = ref.year ? parseInt(ref.year) : null;
      const citeKey = buildCiteKey(authors[0] || ref['article-title']?.split(' ')[0] || 'unknown', year);
      papers.push({
        title: ref['article-title'] || ref['volume-title'] || 'Untitled',
        authors,
        year,
        abstract: '',
        doi: ref.DOI || null,
        arxivId: null,
        venue: ref['journal-title'] || '',
        citationCount: 0,
        pdfUrl: null,
        source: 'crossref',
        citeKey,
        bibtex: buildBibtex({ title: ref['article-title'] || 'Untitled', authors, year, doi: ref.DOI || null, venue: ref['journal-title'] || '', citeKey }),
      });
    }
    return papers;
  } catch {
    return [];
  }
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function buildCiteKey(firstAuthor: string, year: number | null): string {
  const lastName = firstAuthor.split(' ').pop() || 'unknown';
  const clean = lastName.toLowerCase().replace(/[^a-z]/g, '');
  return `${clean}${year || 'nd'}`;
}

function buildBibtex(p: {
  title: string;
  authors: string[];
  year: number | null;
  doi: string | null;
  venue: string;
  citeKey: string;
  arxivId?: string | null;
}): string {
  const type = p.arxivId ? 'misc' : 'article';
  const authorsStr = p.authors.join(' and ') || 'Unknown Author';
  const lines = [
    `@${type}{${p.citeKey},`,
    `  author = {${authorsStr}},`,
    `  title = {${(p.title || 'Untitled').replace(/[{}]/g, '')}},`,
    p.venue ? `  journal = {${p.venue}},` : null,
    p.year ? `  year = {${p.year}},` : null,
    p.doi ? `  doi = {${p.doi}},` : null,
    p.doi ? `  url = {https://doi.org/${p.doi}},` : null,
    p.arxivId ? `  eprint = {${p.arxivId}},` : null,
    p.arxivId ? `  archivePrefix = {arXiv},` : null,
    `}`,
  ].filter(Boolean);
  return lines.join('\n');
}

// ─────────────────────────────────────────────
// Combined search (OpenAlex + arXiv + CrossRef in parallel)
// ─────────────────────────────────────────────

export async function multiSourceAcademicSearch(
  query: string,
  limit = 10,
  sources: AcademicSource[] = ['openalex', 'arxiv', 'crossref'],
  arxivCategory?: string,
): Promise<{
  papers: AcademicPaper[];
  bibtex_block: string;
  summary: string;
  sources_used: string[];
  sources_failed: string[];
}> {
  const searches: { source: AcademicSource; promise: Promise<AcademicPaper[]> }[] = [];

  // Each source is wrapped in its circuit breaker — after N consecutive failures
  // the source is skipped entirely for a cooldown period, avoiding timeouts.
  if (sources.includes('semantic_scholar')) {
    searches.push({ source: 'semantic_scholar', promise: academicBreakers.semanticScholar.execute(() => searchSemanticScholar(query, limit), []) });
  }
  if (sources.includes('openalex')) {
    searches.push({ source: 'openalex', promise: academicBreakers.openAlex.execute(() => searchOpenAlex(query, limit), []) });
  }
  if (sources.includes('arxiv')) {
    searches.push({ source: 'arxiv', promise: academicBreakers.arxiv.execute(() => searchArxiv(query, Math.ceil(limit / 2), arxivCategory), []) });
  }
  if (sources.includes('crossref')) {
    searches.push({ source: 'crossref', promise: academicBreakers.crossref.execute(() => searchCrossref(query, Math.ceil(limit / 2)), []) });
  }
  if (sources.includes('google_scholar')) {
    searches.push({ source: 'google_scholar', promise: academicBreakers.googleScholar.execute(() => searchGoogleScholarDirect(query, limit), []) });
  }

  // Run all in parallel, track which succeeded/failed
  const settled = await Promise.allSettled(searches.map((s) => s.promise));
  const sourcesUsed: string[] = [];
  const sourcesFailed: string[] = [];
  const allPapers: AcademicPaper[] = [];

  settled.forEach((result, i) => {
    const sourceName = searches[i].source;
    if (result.status === 'fulfilled' && result.value.length > 0) {
      allPapers.push(...result.value);
      sourcesUsed.push(`${sourceName} (${result.value.length})`);
    } else {
      sourcesFailed.push(sourceName + (result.status === 'rejected' ? ` — ${(result as any).reason?.message}` : ' (0 results)'));
    }
  });

  // Deduplicate by DOI, then by title similarity
  const seen = new Set<string>();
  const unique: AcademicPaper[] = [];
  for (const p of allPapers) {
    const key = p.doi || p.arxivId || p.title.toLowerCase().substring(0, 50);
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(p);
    }
  }

  // Sort by citation count (OpenAlex provides this)
  unique.sort((a, b) => (b.citationCount || 0) - (a.citationCount || 0));

  // Ensure unique cite keys
  const usedKeys = new Map<string, number>();
  for (const p of unique) {
    const base = p.citeKey;
    const count = usedKeys.get(base) || 0;
    usedKeys.set(base, count + 1);
    if (count > 0) p.citeKey = `${base}${String.fromCharCode(96 + count)}`; // smith2023a, smith2023b
    // Rebuild bibtex with new key
    p.bibtex = buildBibtex({
      title: p.title, authors: p.authors, year: p.year, doi: p.doi,
      venue: p.venue, citeKey: p.citeKey, arxivId: p.arxivId,
    });
  }

  const bibtex_block = unique.map((p) => p.bibtex).join('\n\n');
  const summary = unique
    .slice(0, 10)
    .map((p) => `- \\cite{${p.citeKey}}: ${p.title} (${p.authors[0] || '?'}${p.year ? `, ${p.year}` : ''}${p.citationCount ? `, ${p.citationCount} citations` : ''}) [${p.source}]`)
    .join('\n');

  return { papers: unique, bibtex_block, summary, sources_used: sourcesUsed, sources_failed: sourcesFailed };
}
