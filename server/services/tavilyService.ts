import axios from 'axios';
import { summarizeContent, shouldSummarize } from './contentSummarizerService';

const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
const TAVILY_BASE_URL = 'https://api.tavily.com';

// ==================== COMPLETE INTERFACES FROM DOCUMENTATION ====================

export interface TavilySearchOptions {
  query: string;
  search_depth?: 'advanced' | 'basic' | 'fast' | 'ultra-fast';
  chunks_per_source?: number;
  max_results?: number;
  topic?: 'general' | 'news' | 'finance';
  time_range?: 'day' | 'week' | 'month' | 'year' | 'd' | 'w' | 'm' | 'y';
  start_date?: string; // YYYY-MM-DD
  end_date?: string; // YYYY-MM-DD
  include_answer?: boolean | 'basic' | 'advanced';
  include_raw_content?: boolean | 'markdown' | 'text';
  include_images?: boolean;
  include_image_descriptions?: boolean;
  include_favicon?: boolean;
  include_domains?: string[];
  exclude_domains?: string[];
  country?: string;
  auto_parameters?: boolean;
  include_usage?: boolean;
}

export interface TavilyExtractOptions {
  urls: string | string[];
  query?: string;
  chunks_per_source?: number;
  extract_depth?: 'basic' | 'advanced';
  include_images?: boolean;
  include_favicon?: boolean;
  format?: 'markdown' | 'text';
  timeout?: number;
  include_usage?: boolean;
}

export interface TavilyCrawlOptions {
  url: string;
  instructions?: string;
  chunks_per_source?: number;
  max_depth?: number;
  max_breadth?: number;
  limit?: number;
  select_paths?: string[];
  select_domains?: string[];
  exclude_paths?: string[];
  exclude_domains?: string[];
  allow_external?: boolean;
  include_images?: boolean;
  extract_depth?: 'basic' | 'advanced';
  format?: 'markdown' | 'text';
  include_favicon?: boolean;
  timeout?: number;
  include_usage?: boolean;
}

export interface TavilyMapOptions {
  url: string;
  instructions?: string;
  max_depth?: number;
  max_breadth?: number;
  limit?: number;
  select_paths?: string[];
  select_domains?: string[];
  exclude_paths?: string[];
  exclude_domains?: string[];
  allow_external?: boolean;
  timeout?: number;
  include_usage?: boolean;
}

export interface TavilyResearchOptions {
  input: string;
  model?: 'mini' | 'pro' | 'auto';
  stream?: boolean;
  output_schema?: any;
  citation_format?: 'numbered' | 'mla' | 'apa' | 'chicago';
}

export interface TavilySearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
  raw_content?: string;
  favicon?: string;
  published_date?: string;
}

export interface TavilySearchResponse {
  query: string;
  answer?: string;
  results: TavilySearchResult[];
  images?: Array<{
    url: string;
    description?: string;
  }>;
  response_time?: number;
  usage?: {
    credits_used: number;
    credits_remaining: number;
  };
}

export interface TavilyExtractResult {
  url: string;
  content: string;
  chunks: Array<{
    text: string;
    score: number;
  }>;
  images?: string[];
  favicon?: string;
}

export interface TavilyCrawlResult {
  url: string;
  results: Array<{
    url: string;
    content: string;
    chunks: Array<{
      text: string;
      score: number;
    }>;
    images?: string[];
    favicon?: string;
  }>;
  usage?: {
    credits_used: number;
  };
}

export interface TavilyMapResult {
  url: string;
  links: string[];
  usage?: {
    credits_used: number;
  };
}

export interface TavilyResearchResult {
  report: string;
  sources: Array<{
    url: string;
    title: string;
  }>;
  usage?: {
    credits_used: number;
  };
}

// ==================== HELPER FUNCTION ====================

async function tavilyRequest<T>(endpoint: string, data: any): Promise<T> {
  if (!TAVILY_API_KEY) {
    throw new Error('TAVILY_API_KEY not configured in environment variables');
  }

  try {
    const response = await axios.post(`${TAVILY_BASE_URL}${endpoint}`, data, {
      headers: {
        'Authorization': `Bearer ${TAVILY_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error(`Tavily ${endpoint} error:`, error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(`Tavily API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    }
    throw new Error(`Tavily request failed: ${(error as Error).message}`);
  }
}

// ==================== API FUNCTIONS ====================

// Search - Advanced web search with AI
export async function searchTavily(options: TavilySearchOptions): Promise<TavilySearchResponse> {
  const requestData: any = {
    query: options.query,
    api_key: TAVILY_API_KEY,
  };

  // Add optional parameters
  if (options.search_depth) requestData.search_depth = options.search_depth;
  if (options.chunks_per_source !== undefined) requestData.chunks_per_source = options.chunks_per_source;
  if (options.max_results !== undefined) requestData.max_results = options.max_results;
  if (options.topic) requestData.topic = options.topic;
  if (options.time_range) requestData.time_range = options.time_range;
  if (options.start_date) requestData.start_date = options.start_date;
  if (options.end_date) requestData.end_date = options.end_date;
  if (options.include_answer !== undefined) requestData.include_answer = options.include_answer;
  if (options.include_raw_content !== undefined) requestData.include_raw_content = options.include_raw_content;
  if (options.include_images !== undefined) requestData.include_images = options.include_images;
  if (options.include_image_descriptions !== undefined) requestData.include_image_descriptions = options.include_image_descriptions;
  if (options.include_favicon !== undefined) requestData.include_favicon = options.include_favicon;
  if (options.include_domains) requestData.include_domains = options.include_domains;
  if (options.exclude_domains) requestData.exclude_domains = options.exclude_domains;
  if (options.country) requestData.country = options.country;
  if (options.auto_parameters !== undefined) requestData.auto_parameters = options.auto_parameters;
  if (options.include_usage !== undefined) requestData.include_usage = options.include_usage;

  const response = await tavilyRequest<TavilySearchResponse>('/search', requestData);
  console.log(`[Tavily Search] Found ${response.results?.length || 0} results for: "${options.query}"`);
  return response;
}

// Extract - Extract content from specific URLs
export async function extractTavily(options: TavilyExtractOptions): Promise<TavilyExtractResult[]> {
  const requestData: any = {
    urls: options.urls,
    api_key: TAVILY_API_KEY,
  };

  // Add optional parameters
  if (options.query) requestData.query = options.query;
  if (options.chunks_per_source !== undefined) requestData.chunks_per_source = options.chunks_per_source;
  if (options.extract_depth) requestData.extract_depth = options.extract_depth;
  if (options.include_images !== undefined) requestData.include_images = options.include_images;
  if (options.include_favicon !== undefined) requestData.include_favicon = options.include_favicon;
  if (options.format) requestData.format = options.format;
  if (options.timeout !== undefined) requestData.timeout = options.timeout;
  if (options.include_usage !== undefined) requestData.include_usage = options.include_usage;

  const response = await tavilyRequest<{ results: TavilyExtractResult[] }>('/extract', requestData);
  const urlCount = Array.isArray(options.urls) ? options.urls.length : 1;
  console.log(`[Tavily Extract] Extracted content from ${urlCount} URL(s)`);

  // Smart summarization for long extracts
  const results = response.results || [];
  const processedResults = await Promise.all(
    results.map(async (result) => {
      const content = result.content || '';

      if (shouldSummarize(content, 8000)) {
        console.log(`[Tavily Extract] Large content detected (${content.length} chars), summarizing...`);
        try {
          const summaryResult = await summarizeContent(content, 'document');
          return {
            ...result,
            content: summaryResult.summary,
            metadata: {
              summarized: true,
              originalLength: summaryResult.metadata.originalLength,
              compressionRatio: summaryResult.metadata.compressionRatio,
            }
          };
        } catch (error) {
          console.error(`[Tavily Extract] Summarization failed for ${result.url}:`, error);
          return result;
        }
      }
      return result;
    })
  );

  return processedResults;
}

// Crawl - Graph-based website traversal with extraction
export async function crawlTavily(options: TavilyCrawlOptions): Promise<TavilyCrawlResult> {
  const requestData: any = {
    url: options.url,
    api_key: TAVILY_API_KEY,
  };

  // Add optional parameters
  if (options.instructions) requestData.instructions = options.instructions;
  if (options.chunks_per_source !== undefined) requestData.chunks_per_source = options.chunks_per_source;
  if (options.max_depth !== undefined) requestData.max_depth = options.max_depth;
  if (options.max_breadth !== undefined) requestData.max_breadth = options.max_breadth;
  if (options.limit !== undefined) requestData.limit = options.limit;
  if (options.select_paths) requestData.select_paths = options.select_paths;
  if (options.select_domains) requestData.select_domains = options.select_domains;
  if (options.exclude_paths) requestData.exclude_paths = options.exclude_paths;
  if (options.exclude_domains) requestData.exclude_domains = options.exclude_domains;
  if (options.allow_external !== undefined) requestData.allow_external = options.allow_external;
  if (options.include_images !== undefined) requestData.include_images = options.include_images;
  if (options.extract_depth) requestData.extract_depth = options.extract_depth;
  if (options.format) requestData.format = options.format;
  if (options.include_favicon !== undefined) requestData.include_favicon = options.include_favicon;
  if (options.timeout !== undefined) requestData.timeout = options.timeout;
  if (options.include_usage !== undefined) requestData.include_usage = options.include_usage;

  const response = await tavilyRequest<TavilyCrawlResult>('/crawl', requestData);
  console.log(`[Tavily Crawl] Crawled ${response.results?.length || 0} pages from ${options.url}`);
  return response;
}

// Map - Generate comprehensive site maps
export async function mapTavily(options: TavilyMapOptions): Promise<TavilyMapResult> {
  const requestData: any = {
    url: options.url,
    api_key: TAVILY_API_KEY,
  };

  // Add optional parameters
  if (options.instructions) requestData.instructions = options.instructions;
  if (options.max_depth !== undefined) requestData.max_depth = options.max_depth;
  if (options.max_breadth !== undefined) requestData.max_breadth = options.max_breadth;
  if (options.limit !== undefined) requestData.limit = options.limit;
  if (options.select_paths) requestData.select_paths = options.select_paths;
  if (options.select_domains) requestData.select_domains = options.select_domains;
  if (options.exclude_paths) requestData.exclude_paths = options.exclude_paths;
  if (options.exclude_domains) requestData.exclude_domains = options.exclude_domains;
  if (options.allow_external !== undefined) requestData.allow_external = options.allow_external;
  if (options.timeout !== undefined) requestData.timeout = options.timeout;
  if (options.include_usage !== undefined) requestData.include_usage = options.include_usage;

  const response = await tavilyRequest<TavilyMapResult>('/map', requestData);
  console.log(`[Tavily Map] Mapped ${response.links?.length || 0} links from ${options.url}`);
  return response;
}

// Research - Comprehensive research agent
export async function researchTavily(options: TavilyResearchOptions): Promise<TavilyResearchResult> {
  const requestData: any = {
    input: options.input,
    api_key: TAVILY_API_KEY,
  };

  // Add optional parameters
  if (options.model) requestData.model = options.model;
  if (options.stream !== undefined) requestData.stream = options.stream;
  if (options.output_schema) requestData.output_schema = options.output_schema;
  if (options.citation_format) requestData.citation_format = options.citation_format;

  const response = await tavilyRequest<TavilyResearchResult>('/research', requestData);
  console.log(`[Tavily Research] Completed research on: "${options.input.substring(0, 50)}..."`);
  return response;
}

// Usage - Get API usage information
export async function getUsageTavily(): Promise<{
  key: { usage: number; limit: number };
  account: {
    current_plan: string;
    plan_usage: number;
    plan_limit: number;
    paygo_usage: number;
    paygo_limit: number;
  };
}> {
  if (!TAVILY_API_KEY) {
    throw new Error('TAVILY_API_KEY not configured in environment variables');
  }

  try {
    const response = await axios.get(`${TAVILY_BASE_URL}/usage`, {
      headers: {
        'Authorization': `Bearer ${TAVILY_API_KEY}`,
      },
    });
    console.log(`[Tavily Usage] Credits used: ${response.data.key?.usage || 0}/${response.data.key?.limit || 'unlimited'}`);
    return response.data;
  } catch (error) {
    console.error('Tavily usage error:', error);
    throw new Error(`Tavily usage check failed: ${(error as Error).message}`);
  }
}
