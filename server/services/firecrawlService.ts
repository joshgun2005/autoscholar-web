import axios from 'axios';
import { summarizeContent, shouldSummarize } from './contentSummarizerService';

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
const FIRECRAWL_BASE_URL = 'https://api.firecrawl.dev/v2';

// ==================== COMPLETE INTERFACES FROM DOCUMENTATION ====================

export interface FirecrawlLocation {
  country?: string;
  languages?: string[];
}

export interface FirecrawlAction {
  type: 'wait' | 'click' | 'scroll' | 'screenshot' | 'write' | 'press';
  selector?: string;
  milliseconds?: number;
  key?: string;
  text?: string;
}

export interface FirecrawlWebhook {
  url: string;
  headers?: Record<string, string>;
}

export interface FirecrawlScrapeOptions {
  url: string;
  formats?: Array<string | { type: 'json'; schema: any }>;
  onlyMainContent?: boolean;
  includeTags?: string[];
  excludeTags?: string[];
  maxAge?: number;
  headers?: Record<string, string>;
  waitFor?: number;
  mobile?: boolean;
  skipTlsVerification?: boolean;
  timeout?: number;
  parsers?: string[];
  actions?: FirecrawlAction[];
  location?: FirecrawlLocation;
  removeBase64Images?: boolean;
  blockAds?: boolean;
  proxy?: 'basic' | 'stealth' | 'auto';
  storeInCache?: boolean;
  zeroDataRetention?: boolean;
}

export interface FirecrawlCrawlOptions {
  url: string;
  prompt?: string;
  excludePaths?: string[];
  includePaths?: string[];
  maxDiscoveryDepth?: number;
  sitemap?: 'skip' | 'include';
  ignoreQueryParameters?: boolean;
  limit?: number;
  crawlEntireDomain?: boolean;
  allowExternalLinks?: boolean;
  allowSubdomains?: boolean;
  delay?: number;
  maxConcurrency?: number;
  webhook?: FirecrawlWebhook;
  scrapeOptions?: Omit<FirecrawlScrapeOptions, 'url'>;
  zeroDataRetention?: boolean;
}

export interface FirecrawlExtractOptions {
  urls: string[];
  prompt?: string;
  schema?: any;
  enableWebSearch?: boolean;
  ignoreSitemap?: boolean;
  includeSubdomains?: boolean;
  showSources?: boolean;
  scrapeOptions?: Omit<FirecrawlScrapeOptions, 'url'>;
  ignoreInvalidURLs?: boolean;
}

export interface FirecrawlSearchOptions {
  query: string;
  limit?: number;
  sources?: Array<'web' | 'images' | 'news'>;
  categories?: Array<'github' | 'research' | 'pdf'>;
  tbs?: string;
  location?: string;
  country?: string;
  timeout?: number;
  ignoreInvalidURLs?: boolean;
  scrapeOptions?: Omit<FirecrawlScrapeOptions, 'url'>;
}

export interface FirecrawlMapOptions {
  url: string;
  search?: string;
  sitemap?: 'skip' | 'include' | 'only';
  includeSubdomains?: boolean;
  ignoreQueryParameters?: boolean;
  limit?: number;
  timeout?: number;
  location?: FirecrawlLocation;
}

export interface FirecrawlAgentOptions {
  prompt: string;
  urls?: string[];
  schema?: any;
  maxCredits?: number;
  strictConstrainToURLs?: boolean;
  model?: 'spark-1-mini' | 'spark-1-pro';
}

export interface FirecrawlBatchScrapeOptions {
  urls: string[];
  webhook?: FirecrawlWebhook;
  maxConcurrency?: number;
  ignoreInvalidURLs?: boolean;
  formats?: Array<string | { type: 'json'; schema: any }>;
  onlyMainContent?: boolean;
  includeTags?: string[];
  excludeTags?: string[];
  maxAge?: number;
  headers?: Record<string, string>;
  waitFor?: number;
  mobile?: boolean;
  skipTlsVerification?: boolean;
  timeout?: number;
  parsers?: string[];
  actions?: FirecrawlAction[];
  location?: FirecrawlLocation;
  removeBase64Images?: boolean;
  blockAds?: boolean;
  proxy?: 'basic' | 'stealth' | 'auto';
  storeInCache?: boolean;
  zeroDataRetention?: boolean;
}

export interface FirecrawlSearchResult {
  url: string;
  title: string;
  description: string;
  content?: string;
  markdown?: string;
}

export interface FirecrawlScrapeResult {
  url: string;
  content: string;
  markdown?: string;
  metadata?: Record<string, any>;
}

export interface FirecrawlCrawlResult {
  success: boolean;
  data: Array<{
    url: string;
    content: string;
    markdown?: string;
  }>;
}

// Fonction helper pour requêtes authentifiées
async function firecrawlRequest(endpoint: string, data: any, timeoutMs: number = 90000): Promise<any> {
  if (!FIRECRAWL_API_KEY) {
    throw new Error('FIRECRAWL_API_KEY not configured in environment variables');
  }

  try {
    console.log(`[Firecrawl] Requesting ${endpoint} with timeout ${timeoutMs}ms...`);

    const response = await axios.post(`${FIRECRAWL_BASE_URL}${endpoint}`, data, {
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: timeoutMs, // Configurable timeout
      maxContentLength: 50 * 1024 * 1024, // 50MB max response
      maxBodyLength: 50 * 1024 * 1024,
    });

    console.log(`[Firecrawl] ✓ Request successful (${JSON.stringify(response.data).length} chars)`);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        console.error(`[Firecrawl] Timeout after ${timeoutMs}ms for ${endpoint}`);
        throw new Error(`Firecrawl timeout: Request took longer than ${timeoutMs / 1000} seconds. Try reducing the scope or increasing timeout.`);
      }
      if (error.response) {
        console.error(`[Firecrawl] HTTP ${error.response.status}:`, error.response.data);
        throw new Error(`Firecrawl API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
      }
    }
    console.error(`[Firecrawl] ${endpoint} error:`, error);
    throw new Error(`Firecrawl request failed: ${(error as Error).message}`);
  }
}

// ==================== UPDATED FUNCTIONS WITH ALL PARAMETERS ====================

// Scrape - Single URL with full parameter support
export async function scrapeFirecrawl(options: FirecrawlScrapeOptions): Promise<FirecrawlScrapeResult> {
  const requestData: any = {
    url: options.url,
    formats: options.formats || ['markdown'],
    onlyMainContent: options.onlyMainContent ?? true,
    parsers: options.parsers || ['pdf'],
  };

  // Add optional parameters
  if (options.includeTags) requestData.includeTags = options.includeTags;
  if (options.excludeTags) requestData.excludeTags = options.excludeTags;
  if (options.maxAge !== undefined) requestData.maxAge = options.maxAge;
  if (options.headers) requestData.headers = options.headers;
  if (options.waitFor !== undefined) requestData.waitFor = options.waitFor;
  if (options.mobile !== undefined) requestData.mobile = options.mobile;
  if (options.skipTlsVerification !== undefined) requestData.skipTlsVerification = options.skipTlsVerification;
  if (options.timeout !== undefined) requestData.timeout = options.timeout;
  if (options.actions) requestData.actions = options.actions;
  if (options.location) requestData.location = options.location;
  if (options.removeBase64Images !== undefined) requestData.removeBase64Images = options.removeBase64Images;
  if (options.blockAds !== undefined) requestData.blockAds = options.blockAds;
  if (options.proxy) requestData.proxy = options.proxy;
  if (options.storeInCache !== undefined) requestData.storeInCache = options.storeInCache;
  if (options.zeroDataRetention !== undefined) requestData.zeroDataRetention = options.zeroDataRetention;

  // Use longer timeout for PDFs
  const isPDF = options.url.toLowerCase().endsWith('.pdf') || options.url.toLowerCase().includes('.pdf');
  const timeout = isPDF ? 120000 : (options.timeout || 90000); // 2 min for PDFs, 90s for others

  const response = await firecrawlRequest('/scrape', requestData, timeout);
  const data = response.data || {};

  // Log result size
  const resultSize = JSON.stringify(data).length;
  console.log(`[Firecrawl Scrape] Result size: ${resultSize} chars for ${options.url}`);

  // Detect if this is a PDF or large document
  const content = data.markdown || data.content || '';
  const detectedIsPDF = isPDF || data.metadata?.contentType?.includes('pdf');

  // For PDFs, use aggressive summarization threshold (3000 chars = ~2 pages)
  // For other content, use 8000 chars threshold
  const summarizationThreshold = detectedIsPDF ? 3000 : 8000;

  if (content.length > summarizationThreshold) {
    const docType = detectedIsPDF ? 'PDF' : 'document';
    console.log(`[Firecrawl Scrape] Large ${docType} detected (${content.length} chars), summarizing...`);

    try {
      const summaryResult = await summarizeContent(content, 'pdf', {
        focusOn: detectedIsPDF
          ? ['revenue', 'earnings', 'EPS', 'guidance', 'margins', 'growth', 'cash flow', 'outlook', 'risks', 'strategy']
          : undefined
      });

      console.log(`[Firecrawl Scrape] ✓ Summarized: ${summaryResult.metadata.compressionRatio.toFixed(1)}x compression (${summaryResult.metadata.model})`);

      return {
        ...data,
        markdown: summaryResult.summary,
        content: summaryResult.summary,
        metadata: {
          ...data.metadata,
          summarized: true,
          originalLength: summaryResult.metadata.originalLength,
          summaryLength: summaryResult.metadata.summaryLength,
          compressionRatio: summaryResult.metadata.compressionRatio,
          summaryModel: summaryResult.metadata.model,
          keyPoints: summaryResult.keyPoints,
          documentType: docType
        }
      };
    } catch (error) {
      console.error(`[Firecrawl Scrape] Summarization failed:`, error);

      // If summarization fails completely, return truncated version with clear message
      const truncated = content.substring(0, 12000);
      console.warn(`[Firecrawl Scrape] Returning truncated content (12K chars) due to summarization failure`);

      return {
        ...data,
        markdown: truncated + '\n\n[⚠️ Content truncated - original document was too large to process fully. Showing first 12,000 characters.]',
        content: truncated,
        metadata: {
          ...data.metadata,
          truncated: true,
          originalLength: content.length,
          truncatedLength: truncated.length,
          reason: 'summarization_failed'
        }
      };
    }
  }

  return data;
}

// Crawl - Multiple URLs with full parameter support
export async function crawlFirecrawl(options: FirecrawlCrawlOptions): Promise<FirecrawlCrawlResult> {
  const requestData: any = {
    url: options.url,
    limit: Math.min(options.limit || 10, 20), // Cap for performance
  };

  // Add optional parameters
  if (options.prompt) requestData.prompt = options.prompt;
  if (options.excludePaths) requestData.excludePaths = options.excludePaths;
  if (options.includePaths) requestData.includePaths = options.includePaths;
  if (options.maxDiscoveryDepth !== undefined) requestData.maxDiscoveryDepth = options.maxDiscoveryDepth;
  if (options.sitemap) requestData.sitemap = options.sitemap;
  if (options.ignoreQueryParameters !== undefined) requestData.ignoreQueryParameters = options.ignoreQueryParameters;
  if (options.crawlEntireDomain !== undefined) requestData.crawlEntireDomain = options.crawlEntireDomain;
  if (options.allowExternalLinks !== undefined) requestData.allowExternalLinks = options.allowExternalLinks;
  if (options.allowSubdomains !== undefined) requestData.allowSubdomains = options.allowSubdomains;
  if (options.delay !== undefined) requestData.delay = options.delay;
  if (options.maxConcurrency !== undefined) requestData.maxConcurrency = options.maxConcurrency;
  if (options.webhook) requestData.webhook = options.webhook;
  if (options.scrapeOptions) requestData.scrapeOptions = options.scrapeOptions;
  if (options.zeroDataRetention !== undefined) requestData.zeroDataRetention = options.zeroDataRetention;

  const response = await firecrawlRequest('/crawl', requestData);
  const pageCount = response.data?.length || 0;
  console.log(`[Firecrawl Crawl] Crawled ${pageCount} pages from ${options.url}`);
  return response;
}

// Search - Search and scrape results with full parameter support
export async function searchFirecrawl(options: FirecrawlSearchOptions): Promise<FirecrawlSearchResult[]> {
  const requestData: any = {
    query: options.query,
    limit: Math.min(options.limit || 20, 50),
  };

  // Add optional parameters
  if (options.sources) requestData.sources = options.sources;
  if (options.categories) requestData.categories = options.categories;
  if (options.tbs) requestData.tbs = options.tbs;
  if (options.location) requestData.location = options.location;
  if (options.country) requestData.country = options.country;
  if (options.timeout !== undefined) requestData.timeout = options.timeout;
  if (options.ignoreInvalidURLs !== undefined) requestData.ignoreInvalidURLs = options.ignoreInvalidURLs;
  if (options.scrapeOptions) requestData.scrapeOptions = options.scrapeOptions;

  const response = await firecrawlRequest('/search', requestData);

  // Handle different response formats
  let results = [];
  if (response.data) {
    results = response.data;
  } else if (Array.isArray(response)) {
    results = response;
  } else if (response.results) {
    results = response.results;
  }

  console.log(`[Firecrawl Search] Found ${results.length} results for: "${options.query}"`);
  return results;
}

// ==================== NEW ENDPOINTS ====================

// Extract - Extract structured data using LLM
export async function extractFirecrawl(options: FirecrawlExtractOptions): Promise<any> {
  const requestData: any = {
    urls: options.urls,
  };

  // Add optional parameters
  if (options.prompt) requestData.prompt = options.prompt;
  if (options.schema) requestData.schema = options.schema;
  if (options.enableWebSearch !== undefined) requestData.enableWebSearch = options.enableWebSearch;
  if (options.ignoreSitemap !== undefined) requestData.ignoreSitemap = options.ignoreSitemap;
  if (options.includeSubdomains !== undefined) requestData.includeSubdomains = options.includeSubdomains;
  if (options.showSources !== undefined) requestData.showSources = options.showSources;
  if (options.scrapeOptions) requestData.scrapeOptions = options.scrapeOptions;
  if (options.ignoreInvalidURLs !== undefined) requestData.ignoreInvalidURLs = options.ignoreInvalidURLs;

  const response = await firecrawlRequest('/extract', requestData);
  console.log(`[Firecrawl Extract] Extracted data from ${options.urls.length} URL(s)`);
  return response.data || response;
}

// Map - Map all URLs from a website
export async function mapFirecrawl(options: FirecrawlMapOptions): Promise<{ links: string[] }> {
  const requestData: any = {
    url: options.url,
  };

  // Add optional parameters
  if (options.search) requestData.search = options.search;
  if (options.sitemap) requestData.sitemap = options.sitemap;
  if (options.includeSubdomains !== undefined) requestData.includeSubdomains = options.includeSubdomains;
  if (options.ignoreQueryParameters !== undefined) requestData.ignoreQueryParameters = options.ignoreQueryParameters;
  if (options.limit !== undefined) requestData.limit = options.limit;
  if (options.timeout !== undefined) requestData.timeout = options.timeout;
  if (options.location) requestData.location = options.location;

  const response = await firecrawlRequest('/map', requestData);
  const links = response.links || response.data?.links || [];
  console.log(`[Firecrawl Map] Found ${links.length} links from ${options.url}`);
  return { links };
}

// Agent - Autonomous data extraction agent
export async function agentFirecrawl(options: FirecrawlAgentOptions): Promise<any> {
  const requestData: any = {
    prompt: options.prompt,
  };

  // Add optional parameters
  if (options.urls) requestData.urls = options.urls;
  if (options.schema) requestData.schema = options.schema;
  if (options.maxCredits !== undefined) requestData.maxCredits = options.maxCredits;
  if (options.strictConstrainToURLs !== undefined) requestData.strictConstrainToURLs = options.strictConstrainToURLs;
  if (options.model) requestData.model = options.model;

  const response = await firecrawlRequest('/agent', requestData);
  console.log(`[Firecrawl Agent] Task completed with prompt: "${options.prompt.substring(0, 50)}..."`);
  return response.data || response;
}

// Batch Scrape - Scrape multiple URLs in batch
export async function batchScrapeFirecrawl(options: FirecrawlBatchScrapeOptions): Promise<any> {
  const requestData: any = {
    urls: options.urls,
  };

  // Add optional parameters
  if (options.webhook) requestData.webhook = options.webhook;
  if (options.maxConcurrency !== undefined) requestData.maxConcurrency = options.maxConcurrency;
  if (options.ignoreInvalidURLs !== undefined) requestData.ignoreInvalidURLs = options.ignoreInvalidURLs;
  if (options.formats) requestData.formats = options.formats;
  if (options.onlyMainContent !== undefined) requestData.onlyMainContent = options.onlyMainContent;
  if (options.includeTags) requestData.includeTags = options.includeTags;
  if (options.excludeTags) requestData.excludeTags = options.excludeTags;
  if (options.maxAge !== undefined) requestData.maxAge = options.maxAge;
  if (options.headers) requestData.headers = options.headers;
  if (options.waitFor !== undefined) requestData.waitFor = options.waitFor;
  if (options.mobile !== undefined) requestData.mobile = options.mobile;
  if (options.skipTlsVerification !== undefined) requestData.skipTlsVerification = options.skipTlsVerification;
  if (options.timeout !== undefined) requestData.timeout = options.timeout;
  if (options.parsers) requestData.parsers = options.parsers;
  if (options.actions) requestData.actions = options.actions;
  if (options.location) requestData.location = options.location;
  if (options.removeBase64Images !== undefined) requestData.removeBase64Images = options.removeBase64Images;
  if (options.blockAds !== undefined) requestData.blockAds = options.blockAds;
  if (options.proxy) requestData.proxy = options.proxy;
  if (options.storeInCache !== undefined) requestData.storeInCache = options.storeInCache;
  if (options.zeroDataRetention !== undefined) requestData.zeroDataRetention = options.zeroDataRetention;

  const response = await firecrawlRequest('/batch/scrape', requestData);
  console.log(`[Firecrawl Batch Scrape] Scraped ${options.urls.length} URL(s)`);
  return response.data || response;
}
