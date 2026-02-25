import axios from 'axios';

const EXA_API_KEY = process.env.EXA_API_KEY;
const EXA_BASE_URL = 'https://api.exa.ai';

export interface ExaSearchResult {
  url: string;
  title: string;
  publishedDate?: string;
  author?: string;
  score?: number;
  text?: string;
  highlights?: string[];
  summary?: string;
}

export interface ExaSearchResponse {
  results: ExaSearchResult[];
  autopromptString?: string;
}

export interface ExaContentsResult {
  url: string;
  title: string;
  text?: string;
  highlights?: string[];
  summary?: string;
}

/**
 * Search the web using Exa's semantic search
 */
export async function searchExa(
  query: string,
  options: {
    numResults?: number;
    type?: 'auto' | 'neural' | 'keyword';
    category?: string;
    includeDomains?: string[];
    excludeDomains?: string[];
    startPublishedDate?: string;
    endPublishedDate?: string;
    includeText?: boolean;
    maxCharacters?: number;
  } = {}
): Promise<ExaSearchResponse> {
  if (!EXA_API_KEY) {
    throw new Error('EXA_API_KEY not configured');
  }

  try {
    const requestBody: any = {
      query,
      type: options.type || 'auto',
      numResults: Math.min(options.numResults || 10, 20), // Limit to 20 to avoid context overflow
    };

    if (options.category) requestBody.category = options.category;
    if (options.includeDomains) requestBody.includeDomains = options.includeDomains;
    if (options.excludeDomains) requestBody.excludeDomains = options.excludeDomains;
    if (options.startPublishedDate) requestBody.startPublishedDate = options.startPublishedDate;
    if (options.endPublishedDate) requestBody.endPublishedDate = options.endPublishedDate;

    // Include text content if requested
    if (options.includeText) {
      requestBody.text = {
        maxCharacters: options.maxCharacters || 2000,
        includeHtmlTags: false
      };
    }

    const response = await axios.post(`${EXA_BASE_URL}/search`, requestBody, {
      headers: {
        'x-api-key': EXA_API_KEY,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    });

    return response.data;
  } catch (error) {
    console.error('Exa search error:', error);
    throw new Error(`Failed to search with Exa: ${(error as Error).message}`);
  }
}

/**
 * Get full content from specific URLs using Exa's crawling
 */
export async function getContentsExa(
  urls: string[],
  options: {
    includeText?: boolean;
    maxCharacters?: number;
    includeHighlights?: boolean;
    highlightsQuery?: string;
    numSentences?: number;
    includeSummary?: boolean;
    summaryQuery?: string;
  } = {}
): Promise<ExaContentsResult[]> {
  if (!EXA_API_KEY) {
    throw new Error('EXA_API_KEY not configured');
  }

  try {
    const requestBody: any = {
      urls: urls.slice(0, 5), // Limit to 5 URLs to avoid context overflow
    };

    // Include text content
    if (options.includeText !== false) {
      requestBody.text = {
        maxCharacters: options.maxCharacters || 3000,
        includeHtmlTags: false
      };
    }

    // Include highlights
    if (options.includeHighlights) {
      requestBody.highlights = {
        query: options.highlightsQuery,
        numSentences: options.numSentences || 3,
        highlightsPerUrl: 3
      };
    }

    // Include summary
    if (options.includeSummary && options.summaryQuery) {
      requestBody.summary = {
        query: options.summaryQuery
      };
    }

    const response = await axios.post(`${EXA_BASE_URL}/contents`, requestBody, {
      headers: {
        'x-api-key': EXA_API_KEY,
        'Content-Type': 'application/json',
      },
      timeout: 20000,
    });

    return response.data.results || [];
  } catch (error) {
    console.error('Exa get contents error:', error);
    throw new Error(`Failed to get contents from Exa: ${(error as Error).message}`);
  }
}
