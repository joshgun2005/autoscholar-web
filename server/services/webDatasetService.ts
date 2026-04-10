/**
 * Web Dataset Collector Service — V3 Structured Web Data Extraction System (SWDES)
 *
 * Multi-source autonomous data collection engine that harvests structured datasets
 * from the web using Firecrawl's full API surface (search, map, crawl, extract,
 * batch scrape) combined with Tavily and Exa for maximum coverage.
 *
 * Architecture:
 *   1. PLAN     — Claude plans search strategy + schema
 *   2. DISCOVER — Parallel multi-source search + URL mapping for data portals
 *   3. EXTRACT  — 6-strategy pipeline: schema extract → crawl portals → batch scrape →
 *                 download links → Tavily → Exa
 *   4. NORMALIZE — Schema enforcement, dedup, type coercion, merge
 *   5. VALIDATE — Statistical validation, completeness checks
 *   6. WRITE    — CSV/JSON output with metadata sidecar + extraction stats
 *
 * Key capabilities over V2:
 *   - mapFirecrawl for discovering data subpages within portals
 *   - crawlFirecrawl for multi-page depth crawling (pagination, subpages)
 *   - batchScrapeFirecrawl for parallel batch scraping
 *   - Content type detection (tables, CSV links, PDF links, JSON data)
 *   - Source traceability (source_url + extraction_type on every row)
 *   - Download link scraping (CSV, Excel, PDF files)
 */

import axios from 'axios';
import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  searchFirecrawl,
  extractFirecrawl,
  scrapeFirecrawl,
  batchScrapeFirecrawl,
  crawlFirecrawl,
  mapFirecrawl,
} from './firecrawlService';
import { searchTavily, extractTavily, crawlTavily } from './tavilyService';
import { searchExa, getContentsExa } from './exaService';

// ── Constants ────────────────────────────────────────────────────
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const PLANNER_MODEL = 'claude-haiku-4-5-20251001';
const NORMALIZER_MODEL = 'claude-haiku-4-5-20251001';
const MAX_ROWS = 100000;
const MAX_SOURCES_PER_ENGINE = 10;
const MAX_TOTAL_SOURCES = 25;
const DATASET_PREFIX = 'vq_dataset_';
const SCRAPE_CONCURRENCY = 8;
const NORMALIZE_CHUNK_SIZE = 200;

// V3 Firecrawl-maximized constants
const MAP_DATA_URL_PATTERNS = ['/data/', '/statistics/', '/dataset/', '/download/', '/open-data/', '/indicator/', '/table/'];
const MAP_DATA_FILE_EXTENSIONS = ['.csv', '.xlsx', '.xls', '.json', '.tsv', '.parquet', '.zip'];
const MAX_MAP_DOMAINS = 5;
const MAX_MAP_URLS_PER_DOMAIN = 30;
const MAX_CRAWL_DOMAINS = 3;
const CRAWL_PAGES_PER_DOMAIN = 20;
const EXTRACT_BATCH_SIZE = 10;
const BATCH_SCRAPE_CHUNK = 15;

// ── Interfaces ───────────────────────────────────────────────────

export interface WebDatasetCollectorInput {
  description: string;
  expectedColumns?: string[];
  maxSources?: number;
  preferredSources?: string[];
  outputFormat?: 'csv' | 'json';
  maxRows?: number;
  enablePagination?: boolean;
  searchEngines?: ('firecrawl' | 'tavily' | 'exa')[];
  onProgress?: (step: string, detail: string) => void;
}

export interface WebDatasetCollectorResult {
  success: boolean;
  file_path?: string;
  row_count?: number;
  columns?: string[];
  sample_rows?: Record<string, any>[];
  sources_used?: string[];
  sources_attempted?: number;
  engines_used?: string[];
  error?: string;
  usage_hint?: string;
  metadata?: {
    collection_time_seconds: number;
    dedup_removed: number;
    validation: DataValidationResult;
    extraction_stats?: ExtractionStats[];
  };
}

interface CollectionPlan {
  searchQueries: string[];
  extractionSchema: Record<string, any>;
  expectedColumns: string[];
  extractionPrompt: string;
  paginationHints?: string[];
  dataType: 'tabular' | 'list' | 'timeseries' | 'hierarchical';
}

interface ScoredSource {
  url: string;
  title: string;
  description: string;
  engine: string;
  score: number;
  contentPreview?: string;
  isDataPortal?: boolean;
  mappedSubpages?: string[];
}

interface DataValidationResult {
  totalRows: number;
  uniqueRows: number;
  completenessPercent: number;
  columnsFound: string[];
  columnCompleteness: Record<string, number>;
  warnings: string[];
}

type ContentType = 'table' | 'csv_link' | 'pdf_link' | 'json_data' | 'download_page' | 'text';

interface ClassifiedPage {
  url: string;
  content: string;
  contentType: ContentType;
  detectedLinks: { url: string; type: 'csv' | 'xlsx' | 'json' | 'pdf' }[];
  tableCount: number;
  rowEstimate: number;
}

interface ExtractionStats {
  url: string;
  contentType: ContentType;
  rowsExtracted: number;
  extractionMethod: string;
}

// ── Claude Helper (supports both Haiku and Sonnet) ───────────────

async function callClaude(
  system: string,
  userMessage: string,
  maxTokens: number = 8192,
  model: string = PLANNER_MODEL
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

  const response = await axios.post(
    ANTHROPIC_API_URL,
    {
      model,
      max_tokens: maxTokens,
      temperature: 0,
      stream: false,
      system,
      messages: [{ role: 'user', content: userMessage }],
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      timeout: 90000,
    }
  );

  const text = response.data?.content?.[0]?.text;
  if (!text) throw new Error('Empty response from Claude');
  return text;
}

function parseJsonResponse(text: string): any {
  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  const jsonStr = fenceMatch ? fenceMatch[1].trim() : text.trim();
  return JSON.parse(jsonStr);
}

// ── Progress helper ──────────────────────────────────────────────

function progress(input: WebDatasetCollectorInput, step: string, detail: string) {
  console.log(`🌐 [WebDataset] ${step}: ${detail}`);
  input.onProgress?.(step, detail);
}

// ── Content Type Detection (pure string analysis, no AI) ─────────

function classifyContent(url: string, markdown: string, links?: string[]): ClassifiedPage {
  const detectedLinks: ClassifiedPage['detectedLinks'] = [];
  let tableCount = 0;
  let rowEstimate = 0;

  // Detect markdown tables (|---|)
  const tableHeaderMatches = markdown.match(/\|[\s-]+\|/g);
  if (tableHeaderMatches) {
    tableCount = tableHeaderMatches.length;
    // Estimate rows by counting lines with | between table headers
    const tableRows = markdown.match(/^\|[^-].*\|$/gm);
    rowEstimate = tableRows ? tableRows.length - tableCount : 0; // subtract header rows
  }

  // Detect download links in markdown and links array
  const allLinks = [...(links || [])];
  // Extract links from markdown: [text](url) and bare URLs
  let mdMatch;
  const mdLinkRe = /\[([^\]]*)\]\(([^)]+)\)/g;
  while ((mdMatch = mdLinkRe.exec(markdown)) !== null) allLinks.push(mdMatch[2]);
  let hrefMatch;
  const hrefRe = /href=["']([^"']+)["']/g;
  while ((hrefMatch = hrefRe.exec(markdown)) !== null) allLinks.push(hrefMatch[1]);

  for (const link of allLinks) {
    const lower = link.toLowerCase();
    if (lower.endsWith('.csv') || lower.includes('.csv?')) {
      detectedLinks.push({ url: link, type: 'csv' });
    } else if (lower.endsWith('.xlsx') || lower.endsWith('.xls')) {
      detectedLinks.push({ url: link, type: 'xlsx' });
    } else if (lower.endsWith('.json') && !lower.includes('package.json')) {
      detectedLinks.push({ url: link, type: 'json' });
    } else if (lower.endsWith('.pdf')) {
      detectedLinks.push({ url: link, type: 'pdf' });
    }
  }

  // Classify content type
  let contentType: ContentType = 'text';
  if (detectedLinks.filter(l => l.type === 'csv' || l.type === 'xlsx' || l.type === 'json').length >= 3) {
    contentType = 'download_page';
  } else if (detectedLinks.some(l => l.type === 'csv' || l.type === 'xlsx' || l.type === 'json')) {
    contentType = 'csv_link';
  } else if (detectedLinks.some(l => l.type === 'pdf')) {
    contentType = 'pdf_link';
  } else if (tableCount > 0) {
    contentType = 'table';
  } else {
    // Check if content is raw JSON data
    const trimmed = markdown.trim();
    if ((trimmed.startsWith('[') || trimmed.startsWith('{')) && trimmed.length > 100) {
      try { JSON.parse(trimmed); contentType = 'json_data'; } catch {}
    }
  }

  return { url, content: markdown, contentType, detectedLinks, tableCount, rowEstimate };
}

// ── Data Portal Detection ────────────────────────────────────────

function isDataPortalDomain(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    const portalPatterns = [
      'data.', 'stat', 'open', '.gov', 'eurostat', 'census',
      'worldbank', 'kaggle', 'datahub', 'who.int', 'oecd',
      'imf.org', 'un.org', 'fao.org', 'tradingeconomics',
    ];
    return portalPatterns.some(p => hostname.includes(p));
  } catch {
    return false;
  }
}

function hasDataUrlPattern(url: string): boolean {
  const lower = url.toLowerCase();
  return MAP_DATA_URL_PATTERNS.some(p => lower.includes(p)) ||
    MAP_DATA_FILE_EXTENSIONS.some(ext => lower.endsWith(ext));
}

// ── Main Pipeline ────────────────────────────────────────────────

export async function collectWebDataset(
  input: WebDatasetCollectorInput
): Promise<WebDatasetCollectorResult> {
  const startTime = Date.now();
  const outputFormat = input.outputFormat || 'csv';
  const maxRows = Math.min(input.maxRows || MAX_ROWS, MAX_ROWS);
  const engines = input.searchEngines || detectAvailableEngines();
  const extractionStats: ExtractionStats[] = [];

  progress(input, 'START', `Collection: "${input.description.substring(0, 100)}..." | Engines: ${engines.join(', ')} | Max: ${maxRows} rows`);

  try {
    // ═══ STEP 1: Plan collection strategy ═══
    progress(input, 'PLAN', 'Generating multi-source search strategy...');
    const plan = await planCollection(input);
    progress(input, 'PLAN', `${plan.searchQueries.length} queries, ${plan.expectedColumns.length} columns, type: ${plan.dataType}`);

    // ═══ STEP 2: Multi-source discovery ═══
    progress(input, 'DISCOVER', `Searching across ${engines.length} engines in parallel...`);
    let scoredSources = await discoverSourcesMultiEngine(plan, engines, input);
    if (scoredSources.length === 0) {
      return {
        success: false,
        error: `No relevant data sources found for: "${input.description}". Try rephrasing, specifying preferred source URLs, or broadening the search.`,
        engines_used: engines,
      };
    }
    progress(input, 'DISCOVER', `${scoredSources.length} sources scored and ranked from ${engines.length} engines`);

    // ═══ STEP 2.5: Expand discovery with URL mapping ═══
    if (process.env.FIRECRAWL_API_KEY) {
      try {
        progress(input, 'DISCOVER', 'Mapping data portals for subpages...');
        scoredSources = await expandSourcesWithMap(scoredSources, plan, input);
        progress(input, 'DISCOVER', `${scoredSources.length} total sources after URL mapping`);
      } catch (err: any) {
        console.warn(`[WebDataset] URL mapping failed (non-fatal): ${err?.message}`);
      }
    }

    // ═══ STEP 3: Multi-strategy extraction ═══
    const maxSources = Math.min(input.maxSources || MAX_TOTAL_SOURCES, MAX_TOTAL_SOURCES);
    const topSources = scoredSources.slice(0, maxSources);
    progress(input, 'EXTRACT', `Extracting from top ${topSources.length} sources...`);
    const rawData = await extractDataMultiStrategy(topSources, plan, input, extractionStats);
    if (!rawData || rawData.length === 0) {
      return {
        success: false,
        error: `Could not extract structured data from ${topSources.length} sources. Pages may not contain tabular data matching: "${input.description}"`,
        sources_attempted: topSources.length,
        engines_used: engines,
      };
    }
    progress(input, 'EXTRACT', `${rawData.length} raw records extracted`);

    // ═══ STEP 4: Normalize + deduplicate ═══
    progress(input, 'NORMALIZE', `Normalizing ${rawData.length} records into schema [${plan.expectedColumns.join(', ')}]...`);
    const normalized = await normalizeData(rawData, plan, maxRows);
    progress(input, 'NORMALIZE', `${normalized.rows.length} rows after normalization`);

    // ═══ STEP 5: Validate ═══
    progress(input, 'VALIDATE', 'Running data quality checks...');
    const validation = validateData(normalized.rows, plan.expectedColumns);
    progress(input, 'VALIDATE', `${validation.completenessPercent.toFixed(1)}% complete, ${validation.warnings.length} warnings`);

    // ═══ STEP 6: Write to file ═══
    progress(input, 'WRITE', `Writing ${normalized.rows.length} rows to ${outputFormat}...`);
    const result = writeDataset(normalized, input.description, outputFormat);

    // Write metadata sidecar with extraction stats
    const metadataPath = result.file_path?.replace(/\.\w+$/, '_metadata.json');
    if (metadataPath) {
      const metadata = {
        description: input.description,
        columns: normalized.columns,
        row_count: normalized.rows.length,
        sources: topSources.map(s => ({ url: s.url, engine: s.engine, score: s.score, isDataPortal: s.isDataPortal })),
        extraction_stats: extractionStats,
        validation,
        collected_at: new Date().toISOString(),
        collection_time_seconds: ((Date.now() - startTime) / 1000),
      };
      fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    progress(input, 'DONE', `${result.row_count} rows, ${result.columns?.length} columns in ${elapsed}s`);

    return {
      ...result,
      sources_used: topSources.map(s => s.url),
      sources_attempted: topSources.length,
      engines_used: Array.from(new Set(topSources.map(s => s.engine))),
      usage_hint: `Load in Python: df = pd.read_${outputFormat}('${result.file_path}')`,
      metadata: {
        collection_time_seconds: parseFloat(elapsed),
        dedup_removed: rawData.length - normalized.rows.length,
        validation,
        extraction_stats: extractionStats,
      },
    };
  } catch (error: any) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.error(`❌ [WebDataset] Failed after ${elapsed}s:`, error?.message || error);
    return {
      success: false,
      error: `Web dataset collection failed: ${error?.message || 'Unknown error'}`,
    };
  }
}

// ── Detect available engines ─────────────────────────────────────

function detectAvailableEngines(): ('firecrawl' | 'tavily' | 'exa')[] {
  const engines: ('firecrawl' | 'tavily' | 'exa')[] = [];
  if (process.env.FIRECRAWL_API_KEY) engines.push('firecrawl');
  if (process.env.TAVILY_API_KEY) engines.push('tavily');
  if (process.env.EXA_API_KEY) engines.push('exa');
  if (engines.length === 0) {
    console.warn('[WebDataset] No search engine API keys found, trying Firecrawl anyway');
    engines.push('firecrawl');
  }
  return engines;
}

// ── Step 1: Plan Collection ──────────────────────────────────────

async function planCollection(input: WebDatasetCollectorInput): Promise<CollectionPlan> {
  const columnsHint = input.expectedColumns?.length
    ? `\nExpected columns: ${input.expectedColumns.join(', ')}`
    : '';
  const sourcesHint = input.preferredSources?.length
    ? `\nPreferred sources: ${input.preferredSources.join(', ')}`
    : '';

  const response = await callClaude(
    `You are a web data collection strategist. Given a data request, produce a JSON collection plan.
Output ONLY valid JSON, no explanation.`,
    `Data needed: ${input.description}${columnsHint}${sourcesHint}

Output this exact JSON structure:
{
  "searchQueries": ["query1", "query2", ...],
  "extractionSchema": {
    "type": "object",
    "properties": {
      "records": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": { ... column definitions with type: "string" or "number" ... }
        }
      }
    }
  },
  "expectedColumns": ["col1", "col2", ...],
  "extractionPrompt": "Extract ... (concise instruction)",
  "paginationHints": ["next page", "load more", "page 2"],
  "dataType": "tabular|list|timeseries|hierarchical"
}

Rules for searchQueries (generate 6-10, NOT just 4):
- Vary search intent: some queries for data tables, some for CSV/Excel downloads, some for APIs/databases, some for government/institutional portals
- Include domain-specific terminology (e.g., for economic data: "OECD statistics", "World Bank open data", "Eurostat database")
- Include queries targeting: open data portals, government statistics, Wikipedia tables, Kaggle datasets, academic repositories, data.gov equivalents
- At least 2 queries should target downloadable files (CSV, Excel, JSON endpoints)
- Include year/date context when relevant (e.g., "2020-2024 data")
- One query should be broad, one very specific with exact column names

Rules for extractionSchema:
- Always wrap in "records" array
- Include ALL expected columns with correct types
- ALWAYS include "source_url" (string) and "extraction_type" (string) columns for traceability

Rules for expectedColumns:
- Include all user-requested columns PLUS "source_url" and "extraction_type"

Rules for dataType:
- "tabular": standard rows/columns (companies, countries, products)
- "list": named entities with attributes (rankings, directories)
- "timeseries": date-indexed data points
- "hierarchical": nested categories (org charts, taxonomies)`,
    8192
  );

  return parseJsonResponse(response);
}

// ── Step 2: Multi-Engine Source Discovery ─────────────────────────

async function discoverSourcesMultiEngine(
  plan: CollectionPlan,
  engines: ('firecrawl' | 'tavily' | 'exa')[],
  input: WebDatasetCollectorInput,
): Promise<ScoredSource[]> {
  const allSources: ScoredSource[] = [];
  const queries = plan.searchQueries.slice(0, 10);

  // Run all engines in parallel
  const enginePromises = engines.map(async (engine) => {
    const sources: ScoredSource[] = [];
    try {
      switch (engine) {
        case 'firecrawl':
          sources.push(...await searchWithFirecrawl(queries));
          break;
        case 'tavily':
          sources.push(...await searchWithTavily(queries));
          break;
        case 'exa':
          sources.push(...await searchWithExa(queries));
          break;
      }
    } catch (err: any) {
      console.warn(`[WebDataset] ${engine} search failed: ${err?.message}`);
    }
    return sources;
  });

  const engineResults = await Promise.all(enginePromises);
  for (const sources of engineResults) {
    allSources.push(...sources);
  }

  // Add preferred sources with high priority
  if (input.preferredSources) {
    for (const src of input.preferredSources) {
      const url = src.startsWith('http') ? src : `https://${src}`;
      if (!allSources.some(s => s.url === url)) {
        allSources.unshift({ url, title: 'Preferred source', description: '', engine: 'preferred', score: 100 });
      }
    }
  }

  // Flag data portals for mapping/crawling
  for (const source of allSources) {
    source.isDataPortal = isDataPortalDomain(source.url) || hasDataUrlPattern(source.url);
  }

  // Deduplicate by URL (keep highest score)
  const urlMap = new Map<string, ScoredSource>();
  for (const source of allSources) {
    const normalized = normalizeUrl(source.url);
    const existing = urlMap.get(normalized);
    if (!existing || source.score > existing.score) {
      urlMap.set(normalized, source);
    }
  }

  // Rank sources using AI
  const deduped = Array.from(urlMap.values());
  console.log(`[WebDataset] ${deduped.length} unique URLs from ${engines.length} engines`);

  if (deduped.length <= 5) return deduped;

  try {
    const ranked = await rankSourcesWithAI(deduped, plan);
    return ranked;
  } catch {
    return deduped.sort((a, b) => b.score - a.score);
  }
}

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    return `${u.hostname}${u.pathname}`.replace(/\/+$/, '').toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

// ── Step 2.5: Expand Sources with URL Mapping ────────────────────

async function expandSourcesWithMap(
  sources: ScoredSource[],
  plan: CollectionPlan,
  input: WebDatasetCollectorInput,
): Promise<ScoredSource[]> {
  // Identify data portal domains for mapping
  const portalSources = sources.filter(s => s.isDataPortal).slice(0, MAX_MAP_DOMAINS);
  if (portalSources.length === 0) return sources;

  // Get unique domains
  const seenDomains = new Set<string>();
  const domainsToMap: ScoredSource[] = [];
  for (const source of portalSources) {
    try {
      const domain = new URL(source.url).hostname;
      if (!seenDomains.has(domain)) {
        seenDomains.add(domain);
        domainsToMap.push(source);
      }
    } catch {}
  }

  const mapPromises = domainsToMap.slice(0, MAX_MAP_DOMAINS).map(async (source) => {
    try {
      const result = await mapFirecrawl({
        url: source.url,
        search: plan.extractionPrompt,
        limit: MAX_MAP_URLS_PER_DOMAIN,
      });

      if (!result.links || result.links.length === 0) return [];

      // Filter for data-relevant URLs
      const dataLinks = result.links.filter(link =>
        hasDataUrlPattern(link) || MAP_DATA_FILE_EXTENSIONS.some(ext => link.toLowerCase().endsWith(ext))
      );

      console.log(`[WebDataset] Map ${source.url}: ${result.links.length} total, ${dataLinks.length} data URLs`);

      // Track mapped subpages on parent
      source.mappedSubpages = dataLinks;

      return dataLinks.map((link, idx) => ({
        url: link,
        title: `Mapped from ${new URL(source.url).hostname}`,
        description: '',
        engine: 'firecrawl-map',
        score: source.score + 15 - idx, // boost mapped URLs
        isDataPortal: true,
      } as ScoredSource));
    } catch (err: any) {
      console.warn(`[WebDataset] Map failed for ${source.url}: ${err?.message}`);
      return [];
    }
  });

  const mapResults = await Promise.all(mapPromises);
  const newSources = mapResults.flat();

  // Deduplicate new sources against existing
  const existingUrls = new Set(sources.map(s => normalizeUrl(s.url)));
  const uniqueNew = newSources.filter(s => !existingUrls.has(normalizeUrl(s.url)));

  progress(input, 'DISCOVER', `URL mapping discovered ${uniqueNew.length} new data pages from ${domainsToMap.length} portals`);

  return [...sources, ...uniqueNew];
}

// ── Search engine implementations ────────────────────────────────

async function searchWithFirecrawl(queries: string[]): Promise<ScoredSource[]> {
  const sources: ScoredSource[] = [];
  const batchSize = 5;

  for (let i = 0; i < queries.length; i += batchSize) {
    const batch = queries.slice(i, i + batchSize);
    const promises = batch.map(async (query) => {
      try {
        const res = await searchFirecrawl({ query, limit: 15 });
        if (Array.isArray(res)) {
          return res.map((r: any, idx: number) => ({
            url: r.url || '',
            title: r.title || '',
            description: r.description || '',
            engine: 'firecrawl' as const,
            score: Math.max(0, 80 - idx * 5),
            contentPreview: (r.markdown || r.content || '').substring(0, 500),
          })).filter((s: ScoredSource) => s.url);
        }
        return [];
      } catch {
        return [];
      }
    });
    const results = await Promise.all(promises);
    for (const batch of results) sources.push(...batch);
  }
  return sources.slice(0, MAX_SOURCES_PER_ENGINE * 2);
}

async function searchWithTavily(queries: string[]): Promise<ScoredSource[]> {
  const sources: ScoredSource[] = [];

  const promises = queries.slice(0, 6).map(async (query) => {
    try {
      const res = await searchTavily({
        query,
        search_depth: 'advanced',
        max_results: 10,
        include_raw_content: 'markdown',
      });
      if (res?.results && Array.isArray(res.results)) {
        return res.results.map((r: any, idx: number) => ({
          url: r.url || '',
          title: r.title || '',
          description: r.content?.substring(0, 300) || '',
          engine: 'tavily' as const,
          score: Math.max(0, (r.score || 0.5) * 100 - idx * 3),
          contentPreview: (r.raw_content || r.content || '').substring(0, 500),
        })).filter((s: ScoredSource) => s.url);
      }
      return [];
    } catch {
      return [];
    }
  });

  const results = await Promise.all(promises);
  for (const batch of results) sources.push(...batch);
  return sources.slice(0, MAX_SOURCES_PER_ENGINE * 2);
}

async function searchWithExa(queries: string[]): Promise<ScoredSource[]> {
  const sources: ScoredSource[] = [];

  const promises = queries.slice(0, 5).map(async (query) => {
    try {
      const res = await searchExa(query, {
        numResults: 10,
        type: 'auto',
        includeText: true,
        maxCharacters: 500,
      });
      if (res?.results && Array.isArray(res.results)) {
        return res.results.map((r: any, idx: number) => ({
          url: r.url || '',
          title: r.title || '',
          description: r.text?.substring(0, 300) || '',
          engine: 'exa' as const,
          score: Math.max(0, (r.score || 0.5) * 80 - idx * 3),
          contentPreview: (r.text || '').substring(0, 500),
        })).filter((s: ScoredSource) => s.url);
      }
      return [];
    } catch {
      return [];
    }
  });

  const results = await Promise.all(promises);
  for (const batch of results) sources.push(...batch);
  return sources.slice(0, MAX_SOURCES_PER_ENGINE * 2);
}

// ── AI Source Ranking ────────────────────────────────────────────

async function rankSourcesWithAI(sources: ScoredSource[], plan: CollectionPlan): Promise<ScoredSource[]> {
  const sourceSummaries = sources.slice(0, 50).map((s, i) => ({
    idx: i,
    url: s.url,
    title: s.title,
    engine: s.engine,
    isDataPortal: s.isDataPortal,
    preview: (s.description || s.contentPreview || '').substring(0, 150),
  }));

  const response = await callClaude(
    `You rank web sources by likelihood of containing structured, extractable data. Output ONLY a JSON array of source indices (numbers), best first.

Ranking criteria (most to least important):
1. Government statistics portals (data.gov, eurostat, census.gov, ONS, StatCan) — HIGHEST
2. International organization databases (World Bank, UN, WHO, OECD, IMF open data)
3. Pages with downloadable CSV/Excel/JSON files
4. Open data portals with structured tables
5. Wikipedia tables with structured data
6. Academic datasets (Kaggle, data repositories, university sites)
7. Industry reports with data tables
8. Financial data aggregators (macrotrends, statista, tradingeconomics)
9. PDF reports with tabular data (can extract tables)
10. News sites with data tables (useful but often limited)

EXCLUDE (return empty or put last):
- Paywalled sites (WSJ, Bloomberg terminal, FT premium)
- Login-required pages
- Social media, forums, blog posts without data
- SEO spam or content farms`,
    `Data needed: ${plan.extractionPrompt}
Expected columns: ${plan.expectedColumns.join(', ')}

Sources to rank (${sourceSummaries.length}):
${JSON.stringify(sourceSummaries, null, 1)}`,
    4096
  );

  const rankedIndices: number[] = parseJsonResponse(response);
  const ranked: ScoredSource[] = [];
  const seen = new Set<number>();

  for (const idx of rankedIndices) {
    if (typeof idx === 'number' && idx >= 0 && idx < sources.length && !seen.has(idx)) {
      seen.add(idx);
      ranked.push(sources[idx]);
    }
  }

  for (let i = 0; i < sources.length; i++) {
    if (!seen.has(i)) ranked.push(sources[i]);
  }

  return ranked;
}

// ── Step 3: Multi-Strategy Extraction ────────────────────────────

async function extractDataMultiStrategy(
  sources: ScoredSource[],
  plan: CollectionPlan,
  input: WebDatasetCollectorInput,
  stats: ExtractionStats[],
): Promise<any[]> {
  const allExtracted: any[] = [];
  const collectedDownloadLinks: ClassifiedPage['detectedLinks'] = [];

  // Strategy 1: Firecrawl Extract with schema (expanded — all sources, batched by 10)
  if (process.env.FIRECRAWL_API_KEY) {
    try {
      progress(input, 'EXTRACT', `Schema-based extraction on ${Math.min(sources.length, 30)} URLs (batched)...`);
      const schemaRecords = await extractWithSchema(sources, plan, input, stats);
      allExtracted.push(...schemaRecords);
      if (allExtracted.length > 0) {
        progress(input, 'EXTRACT', `Schema extraction: ${schemaRecords.length} records`);
      }
    } catch (err: any) {
      console.warn(`[WebDataset] Schema extraction failed: ${err?.message}`);
    }
  }

  // Strategy 2: Crawl data portals (multi-page) — only if < 20 records
  const portalSources = sources.filter(s => s.isDataPortal);
  if (portalSources.length > 0 && allExtracted.length < 20 && process.env.FIRECRAWL_API_KEY) {
    try {
      progress(input, 'EXTRACT', `Crawling ${Math.min(portalSources.length, MAX_CRAWL_DOMAINS)} data portals (depth=2)...`);
      const crawlRecords = await crawlDataPortals(portalSources, plan, input, stats);
      allExtracted.push(...crawlRecords);
      if (crawlRecords.length > 0) {
        progress(input, 'EXTRACT', `Portal crawl: ${crawlRecords.length} records`);
      }
    } catch (err: any) {
      console.warn(`[WebDataset] Portal crawl failed: ${err?.message}`);
    }
  }

  // Strategy 3: Batch scrape + AI parsing — only if < 50 records
  if (allExtracted.length < 50) {
    progress(input, 'EXTRACT', `Batch scraping ${Math.min(sources.length, BATCH_SCRAPE_CHUNK)} sources...`);
    const { records, downloadLinks } = await batchScrapeAndParse(sources, plan, input, stats);
    allExtracted.push(...records);
    collectedDownloadLinks.push(...downloadLinks);
    if (records.length > 0) {
      progress(input, 'EXTRACT', `Batch scrape: ${records.length} records, ${downloadLinks.length} download links found`);
    }
  }

  // Strategy 4: Scrape download links (CSV, Excel, PDF) found during batch scrape
  if (collectedDownloadLinks.length > 0 && allExtracted.length < MAX_ROWS / 2) {
    try {
      progress(input, 'EXTRACT', `Scraping ${collectedDownloadLinks.length} download links (CSV/PDF)...`);
      const dlRecords = await scrapeDownloadLinks(collectedDownloadLinks, plan, input, stats);
      allExtracted.push(...dlRecords);
      if (dlRecords.length > 0) {
        progress(input, 'EXTRACT', `Download links: ${dlRecords.length} records`);
      }
    } catch (err: any) {
      console.warn(`[WebDataset] Download link scraping failed: ${err?.message}`);
    }
  }

  // Strategy 5: Tavily content extraction
  const tavilySources = sources.filter(s => s.engine === 'tavily');
  if (tavilySources.length > 0 && allExtracted.length < 50 && process.env.TAVILY_API_KEY) {
    try {
      progress(input, 'EXTRACT', `Tavily deep extraction on ${Math.min(tavilySources.length, 5)} URLs...`);
      const tavilyResults = await extractTavily({
        urls: tavilySources.slice(0, 5).map(s => s.url),
        query: plan.extractionPrompt,
        extract_depth: 'advanced',
      });
      if (Array.isArray(tavilyResults)) {
        for (const result of tavilyResults) {
          if (result.content) {
            const parsed = await parseContentWithAI(result.content, plan, result.url);
            allExtracted.push(...parsed);
            stats.push({ url: result.url, contentType: 'text', rowsExtracted: parsed.length, extractionMethod: 'tavily_extract' });
          }
        }
      }
    } catch (err: any) {
      console.warn(`[WebDataset] Tavily extract failed: ${err?.message}`);
    }
  }

  // Strategy 6: Exa content extraction
  const exaSources = sources.filter(s => s.engine === 'exa');
  if (exaSources.length > 0 && allExtracted.length < 50 && process.env.EXA_API_KEY) {
    try {
      progress(input, 'EXTRACT', `Exa content extraction on ${Math.min(exaSources.length, 5)} URLs...`);
      const exaResults = await getContentsExa(
        exaSources.slice(0, 5).map(s => s.url),
        { includeText: true, maxCharacters: 30000 }
      );
      if (Array.isArray(exaResults)) {
        for (const result of exaResults) {
          if (result.text) {
            const parsed = await parseContentWithAI(result.text, plan, result.url);
            allExtracted.push(...parsed);
            stats.push({ url: result.url, contentType: 'text', rowsExtracted: parsed.length, extractionMethod: 'exa_extract' });
          }
        }
      }
    } catch (err: any) {
      console.warn(`[WebDataset] Exa extract failed: ${err?.message}`);
    }
  }

  // Deduplicate by content hash
  const seen = new Set<string>();
  const deduped = allExtracted.filter(record => {
    if (!record || typeof record !== 'object') return false;
    const key = JSON.stringify(record);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const dedupRemoved = allExtracted.length - deduped.length;
  if (dedupRemoved > 0) {
    progress(input, 'EXTRACT', `Dedup: ${allExtracted.length} → ${deduped.length} (removed ${dedupRemoved} duplicates)`);
  }

  return deduped;
}

// ── Strategy 1: Schema-Based Extraction (expanded) ───────────────

async function extractWithSchema(
  sources: ScoredSource[],
  plan: CollectionPlan,
  input: WebDatasetCollectorInput,
  stats: ExtractionStats[],
): Promise<any[]> {
  const allRecords: any[] = [];
  const urls = sources.slice(0, 30).map(s => s.url);

  // Batch in groups of EXTRACT_BATCH_SIZE
  for (let i = 0; i < urls.length; i += EXTRACT_BATCH_SIZE) {
    const batch = urls.slice(i, i + EXTRACT_BATCH_SIZE);
    if (allRecords.length >= 100) break; // Stop if we have enough

    try {
      const extracted = await extractFirecrawl({
        urls: batch,
        prompt: plan.extractionPrompt,
        schema: plan.extractionSchema,
        enableWebSearch: false,
        showSources: true,
        ignoreInvalidURLs: true,
      });

      if (extracted) {
        const records = extracted.records || extracted.data?.records || (Array.isArray(extracted) ? extracted : []);
        if (Array.isArray(records) && records.length > 0) {
          // Add source traceability
          const traceable = records.map((r: any) => ({
            ...r,
            source_url: r.source_url || batch[0],
            extraction_type: 'schema_extract',
          }));
          allRecords.push(...traceable);
          stats.push({ url: batch.join(', '), contentType: 'table', rowsExtracted: records.length, extractionMethod: 'firecrawl_extract' });
        } else if (typeof records === 'object' && !Array.isArray(records)) {
          allRecords.push({ ...records, extraction_type: 'schema_extract' });
        }
      }
    } catch (err: any) {
      console.warn(`[WebDataset] Extract batch ${i / EXTRACT_BATCH_SIZE + 1} failed: ${err?.message}`);
    }
  }

  return allRecords;
}

// ── Strategy 2: Crawl Data Portals ───────────────────────────────

async function crawlDataPortals(
  sources: ScoredSource[],
  plan: CollectionPlan,
  input: WebDatasetCollectorInput,
  stats: ExtractionStats[],
): Promise<any[]> {
  const allRecords: any[] = [];

  // Select top portal domains (deduplicated by hostname)
  const seenDomains = new Set<string>();
  const portals: ScoredSource[] = [];
  for (const source of sources) {
    try {
      const domain = new URL(source.url).hostname;
      if (!seenDomains.has(domain)) {
        seenDomains.add(domain);
        portals.push(source);
      }
    } catch {}
  }

  const crawlPromises = portals.slice(0, MAX_CRAWL_DOMAINS).map(async (source) => {
    try {
      const crawlResult = await crawlFirecrawl({
        url: source.url,
        limit: CRAWL_PAGES_PER_DOMAIN,
        maxDiscoveryDepth: 2,
        scrapeOptions: {
          formats: ['markdown'],
          onlyMainContent: true,
          blockAds: true,
        },
      });

      const pages = crawlResult?.data || [];
      if (pages.length === 0) return [];

      console.log(`[WebDataset] Crawled ${pages.length} pages from ${source.url}`);

      // Parse each crawled page
      const records: any[] = [];
      for (const page of pages.slice(0, CRAWL_PAGES_PER_DOMAIN)) {
        const content = page.markdown || page.content || '';
        if (content.length < 200) continue;

        const classified = classifyContent(page.url || source.url, content);

        if (classified.contentType === 'table' || classified.contentType === 'text') {
          try {
            const parsed = await parseContentWithAI(content.substring(0, 50000), plan, page.url || source.url);
            // Add source traceability
            const traceable = parsed.map((r: any) => ({
              ...r,
              source_url: page.url || source.url,
              extraction_type: 'crawl',
            }));
            records.push(...traceable);
            stats.push({ url: page.url || source.url, contentType: classified.contentType, rowsExtracted: parsed.length, extractionMethod: 'crawl_parse' });
          } catch {}
        }

        if (records.length >= MAX_ROWS / 4) break; // Don't over-extract from one domain
      }

      return records;
    } catch (err: any) {
      console.warn(`[WebDataset] Crawl failed for ${source.url}: ${err?.message}`);
      return [];
    }
  });

  const results = await Promise.all(crawlPromises);
  for (const records of results) {
    allRecords.push(...records);
  }

  return allRecords;
}

// ── Strategy 3: Batch Scrape + AI Parse ──────────────────────────

async function batchScrapeAndParse(
  sources: ScoredSource[],
  plan: CollectionPlan,
  input: WebDatasetCollectorInput,
  stats: ExtractionStats[],
): Promise<{ records: any[]; downloadLinks: ClassifiedPage['detectedLinks'] }> {
  const allRecords: any[] = [];
  const allDownloadLinks: ClassifiedPage['detectedLinks'] = [];
  const urls = sources.slice(0, BATCH_SCRAPE_CHUNK).map(s => s.url);

  // Try batch scrape first, fall back to individual scrape
  let scrapedPages: Array<{ url: string; content: string; links?: string[] }> = [];

  if (process.env.FIRECRAWL_API_KEY && urls.length > 1) {
    try {
      const batchResult = await batchScrapeFirecrawl({
        urls,
        formats: ['markdown', 'links'],
        onlyMainContent: true,
        blockAds: true,
        timeout: 45000,
      });

      if (Array.isArray(batchResult)) {
        scrapedPages = batchResult
          .filter((r: any) => r && (r.markdown || r.content))
          .map((r: any) => ({
            url: r.metadata?.sourceURL || r.url || '',
            content: r.markdown || r.content || '',
            links: r.links || [],
          }));
      }
      progress(input, 'EXTRACT', `Batch scrape: ${scrapedPages.length}/${urls.length} pages`);
    } catch (err: any) {
      console.warn(`[WebDataset] Batch scrape failed, falling back to individual: ${err?.message}`);
    }
  }

  // Fallback: individual scraping
  if (scrapedPages.length === 0) {
    scrapedPages = await parallelScrapeAndParseFallback(sources, input);
  }

  // Classify and parse each page
  for (const page of scrapedPages) {
    if (page.content.length < 300) continue;

    const classified = classifyContent(page.url, page.content, page.links);

    // Collect download links for Strategy 4
    allDownloadLinks.push(...classified.detectedLinks);

    // Parse content
    if (classified.contentType !== 'download_page' || classified.tableCount > 0) {
      try {
        const parsed = await parseContentWithAI(page.content.substring(0, 50000), plan, page.url);
        const traceable = parsed.map((r: any) => ({
          ...r,
          source_url: r.source_url || page.url,
          extraction_type: classified.contentType === 'table' ? 'table_parse' : 'ai_parse',
        }));
        allRecords.push(...traceable);
        stats.push({ url: page.url, contentType: classified.contentType, rowsExtracted: parsed.length, extractionMethod: 'batch_scrape_parse' });
      } catch {}
    }

    if (allRecords.length >= MAX_ROWS / 2) break;
  }

  return { records: allRecords, downloadLinks: allDownloadLinks };
}

// Fallback individual scraping (renamed from original parallelScrapeAndParse)
async function parallelScrapeAndParseFallback(
  sources: ScoredSource[],
  input: WebDatasetCollectorInput,
): Promise<Array<{ url: string; content: string; links?: string[] }>> {
  const results: Array<{ url: string; content: string }> = [];
  const urls = sources.slice(0, SCRAPE_CONCURRENCY * 2);

  for (let i = 0; i < urls.length; i += SCRAPE_CONCURRENCY) {
    const batch = urls.slice(i, i + SCRAPE_CONCURRENCY);

    const scrapePromises = batch.map(async (source) => {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const scraped = await scrapeFirecrawl({
            url: source.url,
            formats: ['markdown'],
            onlyMainContent: true,
            blockAds: true,
            timeout: 45000,
          });
          const content = (scraped?.markdown || scraped?.content || '').substring(0, 50000);
          if (content.length > 300) {
            return { url: source.url, content };
          }
          return null;
        } catch {
          if (attempt === 0) await new Promise(r => setTimeout(r, 1500));
        }
      }
      return null;
    });

    const scrapeResults = await Promise.all(scrapePromises);
    const successful = scrapeResults.filter((s): s is { url: string; content: string } => s !== null);
    progress(input, 'EXTRACT', `Fallback batch ${Math.floor(i / SCRAPE_CONCURRENCY) + 1}: scraped ${successful.length}/${batch.length} URLs`);
    results.push(...successful);
  }

  return results;
}

// ── Strategy 4: Scrape Download Links ────────────────────────────

async function scrapeDownloadLinks(
  links: ClassifiedPage['detectedLinks'],
  plan: CollectionPlan,
  input: WebDatasetCollectorInput,
  stats: ExtractionStats[],
): Promise<any[]> {
  const allRecords: any[] = [];
  const uniqueLinks = links.filter((l, i) => links.findIndex(l2 => l2.url === l.url) === i).slice(0, 10);

  for (const link of uniqueLinks) {
    try {
      // Resolve relative URLs
      let fullUrl = link.url;
      if (!fullUrl.startsWith('http')) continue;

      const isPdf = link.type === 'pdf';
      const scraped = await scrapeFirecrawl({
        url: fullUrl,
        formats: ['markdown'],
        onlyMainContent: !isPdf, // For PDFs, get everything
        parsers: isPdf ? ['pdf'] : undefined,
        blockAds: true,
        timeout: isPdf ? 120000 : 60000,
      });

      const content = scraped?.markdown || scraped?.content || '';
      if (content.length < 100) continue;

      const parsed = await parseContentWithAI(content.substring(0, 50000), plan, fullUrl);
      const traceable = parsed.map((r: any) => ({
        ...r,
        source_url: fullUrl,
        extraction_type: `${link.type}_download`,
      }));
      allRecords.push(...traceable);
      stats.push({ url: fullUrl, contentType: link.type === 'pdf' ? 'pdf_link' : 'csv_link', rowsExtracted: parsed.length, extractionMethod: 'download_link' });

      if (allRecords.length >= MAX_ROWS / 4) break;
    } catch (err: any) {
      console.warn(`[WebDataset] Download link scrape failed for ${link.url}: ${err?.message}`);
    }
  }

  return allRecords;
}

// ── AI Content Parser ────────────────────────────────────────────

async function parseContentWithAI(
  content: string,
  plan: CollectionPlan,
  sourceUrl: string,
): Promise<any[]> {
  try {
    const response = await callClaude(
      `You are a data extraction specialist. Extract structured data from web content into a JSON array.

CRITICAL RULES:
- Output ONLY valid JSON — a single array of objects
- Each object must have exactly these keys: ${plan.expectedColumns.join(', ')}
- Use null for missing values, NEVER make up data
- Convert all numbers to numeric types (remove $, %, commas, then parse)
- Standardize dates to YYYY-MM-DD format when possible
- Extract ALL rows/records you can find, not just a sample
- If data is in a table, extract every row
- If data is in a list, extract every item
- If no matching data found, output: []
- Handle common patterns: Wikipedia tables, data portals, government statistics, financial tables
- For percentage values: store as numbers (e.g., 5.2 not "5.2%")
- For currency values: store as numbers without symbols (e.g., 1000000 not "$1M")
- ALWAYS set "source_url" to the source URL provided
- ALWAYS set "extraction_type" to "ai_parse"`,
      `Source URL: ${sourceUrl}
Data description: ${plan.extractionPrompt}
Expected columns: ${plan.expectedColumns.join(', ')}
Data type: ${plan.dataType}

Web content (may include markdown tables, lists, or unstructured text):
${content.substring(0, 50000)}

Extract all matching records as a JSON array.`,
      16384,
      NORMALIZER_MODEL
    );

    const parsed = parseJsonResponse(response);
    if (Array.isArray(parsed)) {
      // Ensure source traceability
      const traceable = parsed.map(record => ({
        ...record,
        source_url: record.source_url || sourceUrl,
        extraction_type: record.extraction_type || 'ai_parse',
      }));
      console.log(`[WebDataset] AI parsed ${traceable.length} records from ${sourceUrl}`);
      return traceable;
    }
    return [];
  } catch (err: any) {
    console.warn(`[WebDataset] AI parsing failed for ${sourceUrl}: ${err?.message}`);
    return [];
  }
}

// ── Step 4: Normalize Data ───────────────────────────────────────

async function normalizeData(
  rawData: any[],
  plan: CollectionPlan,
  maxRows: number,
): Promise<{ columns: string[]; rows: Record<string, any>[] }> {
  // Quick consistency check
  if (rawData.length > 0 && isConsistentData(rawData, plan.expectedColumns)) {
    console.log('[WebDataset] Data already consistent, skipping AI normalization');
    return { columns: plan.expectedColumns, rows: rawData.slice(0, maxRows) };
  }

  // Process in chunks with AI normalization
  const allNormalized: Record<string, any>[] = [];

  for (let i = 0; i < rawData.length; i += NORMALIZE_CHUNK_SIZE) {
    const chunk = rawData.slice(i, i + NORMALIZE_CHUNK_SIZE);
    try {
      const response = await callClaude(
        `You normalize messy, heterogeneous data into consistent records. Output ONLY a valid JSON array.

Rules:
- Every object MUST have exactly these keys: ${plan.expectedColumns.join(', ')}
- Use null for missing values
- Convert numbers: remove "$", "%", ",", then parse to numeric
- Dates → YYYY-MM-DD
- Remove exact duplicates
- Fix obvious typos in categorical values (e.g., "Uinted States" → "United States")
- Merge records that clearly refer to the same entity (keep the more complete one)
- If a field has mixed types across records, coerce to the most common type
- PRESERVE source_url and extraction_type columns — do NOT remove them`,
        `Normalize this data batch (${chunk.length} records):\n${JSON.stringify(chunk).substring(0, 50000)}`,
        16384,
        NORMALIZER_MODEL
      );

      const normalized = parseJsonResponse(response);
      if (Array.isArray(normalized)) {
        allNormalized.push(...normalized);
      }
    } catch (err: any) {
      console.warn(`[WebDataset] Normalization chunk ${i} failed, using raw: ${err?.message}`);
      allNormalized.push(...chunk);
    }

    if (allNormalized.length >= maxRows) break;
  }

  const finalColumns = allNormalized.length > 0
    ? Object.keys(allNormalized[0])
    : plan.expectedColumns;

  return { columns: finalColumns, rows: allNormalized.slice(0, maxRows) };
}

function isConsistentData(data: any[], expectedColumns: string[]): boolean {
  if (data.length === 0) return false;
  const expected = expectedColumns.map(c => c.toLowerCase().replace(/[_\s-]/g, ''));
  return data.slice(0, 10).every(row => {
    if (typeof row !== 'object' || !row) return false;
    const keys = Object.keys(row).map(k => k.toLowerCase().replace(/[_\s-]/g, ''));
    return expected.length <= keys.length &&
      expected.every(col => keys.some(k => k === col));
  });
}

// ── Step 5: Data Validation ──────────────────────────────────────

function validateData(rows: Record<string, any>[], expectedColumns: string[]): DataValidationResult {
  if (rows.length === 0) {
    return {
      totalRows: 0,
      uniqueRows: 0,
      completenessPercent: 0,
      columnsFound: [],
      columnCompleteness: {},
      warnings: ['No data rows to validate'],
    };
  }

  const actualColumns = Object.keys(rows[0]);
  const warnings: string[] = [];

  const columnCompleteness: Record<string, number> = {};
  for (const col of actualColumns) {
    const nonNull = rows.filter(r => r[col] !== null && r[col] !== undefined && r[col] !== '').length;
    columnCompleteness[col] = Math.round((nonNull / rows.length) * 100);
    if (columnCompleteness[col] < 50 && col !== 'source_url' && col !== 'extraction_type') {
      warnings.push(`Column "${col}" is ${columnCompleteness[col]}% complete (< 50%)`);
    }
  }

  const missingCols = expectedColumns.filter(c =>
    !actualColumns.some(ac => ac.toLowerCase() === c.toLowerCase())
  );
  if (missingCols.length > 0) {
    // Don't warn about source_url/extraction_type since they're optional
    const meaningful = missingCols.filter(c => c !== 'source_url' && c !== 'extraction_type');
    if (meaningful.length > 0) {
      warnings.push(`Missing expected columns: ${meaningful.join(', ')}`);
    }
  }

  const uniqueHashes = new Set(rows.map(r => JSON.stringify(r)));
  if (uniqueHashes.size < rows.length) {
    warnings.push(`${rows.length - uniqueHashes.size} duplicate rows detected`);
  }

  const totalCells = rows.length * actualColumns.length;
  const nonNullCells = rows.reduce((sum, row) => {
    return sum + actualColumns.filter(col => row[col] !== null && row[col] !== undefined && row[col] !== '').length;
  }, 0);

  return {
    totalRows: rows.length,
    uniqueRows: uniqueHashes.size,
    completenessPercent: totalCells > 0 ? Math.round((nonNullCells / totalCells) * 1000) / 10 : 0,
    columnsFound: actualColumns,
    columnCompleteness,
    warnings,
  };
}

// ── Step 6: Write Dataset ────────────────────────────────────────

function writeDataset(
  data: { columns: string[]; rows: Record<string, any>[] },
  description: string,
  format: 'csv' | 'json'
): WebDatasetCollectorResult {
  if (!data.rows || data.rows.length === 0) {
    return { success: false, error: 'No data rows to write after normalization' };
  }

  const safeName = description
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .substring(0, 50)
    .replace(/_+$/, '');

  const filename = `${DATASET_PREFIX}${Date.now()}_${safeName}.${format}`;
  const filePath = path.join(os.tmpdir(), filename);

  if (format === 'json') {
    fs.writeFileSync(filePath, JSON.stringify(data.rows, null, 2), 'utf-8');
  } else {
    const columns = data.columns.length > 0 ? data.columns : Object.keys(data.rows[0]);
    const lines: string[] = [];
    lines.push(columns.map(escapeCsvField).join(','));
    for (const row of data.rows) {
      const values = columns.map(col => {
        const val = row[col] ?? row[col.toLowerCase()] ?? '';
        return escapeCsvField(String(val));
      });
      lines.push(values.join(','));
    }
    fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
  }

  const stat = fs.statSync(filePath);
  console.log(`[WebDataset] Written ${stat.size} bytes (${data.rows.length} rows) to ${filePath}`);

  return {
    success: true,
    file_path: filePath,
    row_count: data.rows.length,
    columns: data.columns.length > 0 ? data.columns : Object.keys(data.rows[0]),
    sample_rows: data.rows.slice(0, 8),
  };
}

function escapeCsvField(value: string): string {
  if (value === 'null' || value === 'undefined') return '';
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
