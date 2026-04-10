import type { ClaudeToolDefinition } from './types';

export const WEB_TOOLS: ClaudeToolDefinition[] = [
  {
    name: 'web_search_exa',
    description: 'Search the web using Exa\'s semantic search engine for high-quality, relevant content. Use this to find information from websites, articles, news, research papers, and other web sources. Excellent for finding recent news, industry trends, company information not in financial databases, product details, market analysis from various sources, etc.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Natural language search query (e.g., "recent AI developments", "electric vehicle market trends")',
        },
        numResults: {
          type: 'number',
          description: 'Number of results to return (1-20, default: 10)',
        },
        type: {
          type: 'string',
          description: 'Search type: "auto" (default), "neural" (semantic), or "keyword" (exact match)',
        },
        category: {
          type: 'string',
          description: 'Filter by content type: "company", "research_paper", "news_article", "tweet", "github", "pdf"',
        },
        includeDomains: {
          type: 'array',
          items: { type: 'string' },
          description: 'Only search within these domains (e.g., ["techcrunch.com", "reuters.com"])',
        },
        excludeDomains: {
          type: 'array',
          items: { type: 'string' },
          description: 'Exclude these domains from search',
        },
        startPublishedDate: {
          type: 'string',
          description: 'Filter results published after this date (ISO 8601 format: YYYY-MM-DD)',
        },
        endPublishedDate: {
          type: 'string',
          description: 'Filter results published before this date (ISO 8601 format: YYYY-MM-DD)',
        },
        includeText: {
          type: 'boolean',
          description: 'Include page text content in results (default: true)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_contents_exa',
    description: 'Get full content from specific URLs using Exa\'s web crawler. Use this after finding interesting URLs with web_search_exa to extract complete text, highlights, and summaries. Perfect for deep-diving into specific articles, research papers, or web pages to extract detailed information.',
    input_schema: {
      type: 'object',
      properties: {
        urls: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of URLs to crawl and extract content from (max 5 URLs)',
        },
        includeText: {
          type: 'boolean',
          description: 'Include full page text content (default: true)',
        },
        maxCharacters: {
          type: 'number',
          description: 'Maximum characters to extract per page (default: 3000)',
        },
        includeHighlights: {
          type: 'boolean',
          description: 'Extract key sentences as highlights (default: false)',
        },
        highlightsQuery: {
          type: 'string',
          description: 'Query to focus highlights on specific topics',
        },
        numSentences: {
          type: 'number',
          description: 'Number of highlight sentences per URL (default: 3)',
        },
        includeSummary: {
          type: 'boolean',
          description: 'Generate AI summary of the content (default: false)',
        },
        summaryQuery: {
          type: 'string',
          description: 'Query to focus summary on specific aspects',
        },
      },
      required: ['urls'],
    },
  },
  // ==================== FIRECRAWL WEB NAVIGATION & EXTRACTION TOOLS ====================
  {
    name: 'firecrawl_scrape',
    description: 'Extract complete content from a single URL. Supports HTML pages, PDFs, Word docs, and more. Perfect for extracting financial reports, company filings, research papers, and documentation. Returns clean markdown with automatic PDF summarization for long documents.',
    input_schema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'URL to scrape (HTTP/HTTPS). Supports PDFs, HTML, Word docs, etc.',
        },
        formats: {
          type: 'array',
          items: { type: 'string' },
          description: 'Output formats: ["markdown", "html", "rawHtml", "links", "screenshot"]. Default: ["markdown"]',
        },
        onlyMainContent: {
          type: 'boolean',
          description: 'Extract only main content, removing navigation/ads/footers. Default: true',
        },
        parsers: {
          type: 'array',
          items: { type: 'string' },
          description: 'Parsers to enable. Default: ["pdf"] for PDF extraction',
        },
        includeTags: {
          type: 'array',
          items: { type: 'string' },
          description: 'HTML tags to include (e.g., ["article", "main"])',
        },
        excludeTags: {
          type: 'array',
          items: { type: 'string' },
          description: 'HTML tags to exclude (e.g., ["nav", "footer", "aside"])',
        },
        waitFor: {
          type: 'number',
          description: 'Wait milliseconds before scraping (for dynamic content). Default: 0',
        },
        mobile: {
          type: 'boolean',
          description: 'Emulate mobile device. Default: false',
        },
        blockAds: {
          type: 'boolean',
          description: 'Block ads and cookie popups. Default: true',
        },
        timeout: {
          type: 'number',
          description: 'Request timeout in milliseconds. Default: 30000',
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'firecrawl_search',
    description: 'Search the web and automatically scrape matching results. Perfect for finding recent news, research papers (PDFs), financial reports, or specific information across multiple sources. Can filter by categories (github, research, pdf) and sources (web, images, news).',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query (e.g., "NVDA Q4 2024 earnings report PDF", "climate change research papers")',
        },
        limit: {
          type: 'number',
          description: 'Number of results to return (1-50). Default: 20',
        },
        sources: {
          type: 'array',
          items: { type: 'string', enum: ['web', 'images', 'news'] },
          description: 'Sources to search. Default: ["web"]. Options: "web", "images", "news"',
        },
        categories: {
          type: 'array',
          items: { type: 'string', enum: ['github', 'research', 'pdf'] },
          description: 'Categories to filter results. Options: "github" (repos), "research" (papers), "pdf" (documents)',
        },
        country: {
          type: 'string',
          description: 'Country code for geo-targeting (e.g., "US", "FR", "UK"). Default: "US"',
        },
        tbs: {
          type: 'string',
          description: 'Time-based search parameter (e.g., "qdr:d" = past day, "qdr:w" = past week, "qdr:m" = past month)',
        },
        onlyMainContent: {
          type: 'boolean',
          description: 'Extract only main content from scraped results. Default: false',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'firecrawl_crawl',
    description: 'Crawl and extract content from multiple pages of a website. Follows internal links to map entire documentation sites, corporate websites, or knowledge bases. Can use natural language prompts to guide crawling or use regex patterns for precise control.',
    input_schema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'Root URL to start crawling (e.g., "https://example.com/docs")',
        },
        prompt: {
          type: 'string',
          description: 'Natural language prompt to guide what to crawl (e.g., "crawl all product documentation pages")',
        },
        limit: {
          type: 'number',
          description: 'Maximum pages to crawl (1-20). Default: 10',
        },
        includePaths: {
          type: 'array',
          items: { type: 'string' },
          description: 'Regex patterns for URLs to include (e.g., ["/docs/.*", "/blog/.*"])',
        },
        excludePaths: {
          type: 'array',
          items: { type: 'string' },
          description: 'Regex patterns for URLs to exclude (e.g., ["/admin/.*", "/login"])',
        },
        maxDiscoveryDepth: {
          type: 'number',
          description: 'Maximum link depth to follow from root URL',
        },
        sitemap: {
          type: 'string',
          enum: ['skip', 'include'],
          description: 'Sitemap handling. Default: "include"',
        },
        crawlEntireDomain: {
          type: 'boolean',
          description: 'Allow crawling parent/sibling URLs. Default: false',
        },
        allowSubdomains: {
          type: 'boolean',
          description: 'Allow following subdomain links. Default: false',
        },
        ignoreQueryParameters: {
          type: 'boolean',
          description: 'Treat URLs with different query params as same page. Default: false',
        },
        onlyMainContent: {
          type: 'boolean',
          description: 'Extract only main content from each page. Default: false',
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'firecrawl_extract',
    description: 'Extract structured data from websites using AI. Define a schema and let Firecrawl intelligently extract matching data across multiple pages. Perfect for extracting product catalogs, company directories, financial metrics, or any structured information from websites.',
    input_schema: {
      type: 'object',
      properties: {
        urls: {
          type: 'array',
          items: { type: 'string' },
          description: 'URLs to extract data from (1-10 URLs recommended)',
        },
        prompt: {
          type: 'string',
          description: 'Prompt describing what data to extract (e.g., "Extract all product names, prices, and descriptions")',
        },
        schema: {
          type: 'object',
          description: 'JSON schema defining the structure of data to extract. Example: {type: "object", properties: {products: {type: "array", items: {type: "object", properties: {name: {type: "string"}, price: {type: "number"}}}}}}',
        },
        enableWebSearch: {
          type: 'boolean',
          description: 'Use web search to find additional data. Default: false',
        },
        includeSubdomains: {
          type: 'boolean',
          description: 'Also extract from subdomains. Default: true',
        },
        showSources: {
          type: 'boolean',
          description: 'Include source URLs in response. Default: false',
        },
      },
      required: ['urls'],
    },
  },
  {
    name: 'firecrawl_map',
    description: 'Map all URLs from a website without crawling content. Fast way to discover site structure, find all pages, or generate a sitemap. Can filter by search relevance and handle sitemaps intelligently.',
    input_schema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'Website URL to map',
        },
        search: {
          type: 'string',
          description: 'Search query to rank results by relevance (e.g., "pricing" to find pricing pages)',
        },
        sitemap: {
          type: 'string',
          enum: ['skip', 'include', 'only'],
          description: 'Sitemap mode. "only" = only sitemap URLs, "include" = sitemap + discovered, "skip" = no sitemap. Default: "include"',
        },
        includeSubdomains: {
          type: 'boolean',
          description: 'Include subdomain URLs. Default: true',
        },
        ignoreQueryParameters: {
          type: 'boolean',
          description: 'Ignore query parameters in URLs. Default: true',
        },
        limit: {
          type: 'number',
          description: 'Maximum links to return. Default: 5000',
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'firecrawl_agent',
    description: 'Autonomous AI agent for complex data extraction tasks. Give it a natural language prompt and optional URLs, and it will intelligently navigate, search, and extract the data you need. Uses advanced reasoning to understand your requirements and gather comprehensive information.',
    input_schema: {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description: 'Detailed prompt describing what data to extract (e.g., "Find and extract all executive compensation data from the latest 10-K filings of FAANG companies")',
        },
        urls: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional: Constrain agent to specific URLs (agent will only visit these)',
        },
        schema: {
          type: 'object',
          description: 'Optional: JSON schema to structure extracted data',
        },
        maxCredits: {
          type: 'number',
          description: 'Maximum credits to spend on this task',
        },
        strictConstrainToURLs: {
          type: 'boolean',
          description: 'If true, agent only visits provided URLs. Default: false',
        },
        model: {
          type: 'string',
          enum: ['spark-1-mini', 'spark-1-pro'],
          description: 'Agent model: "spark-1-mini" (fast, cheap) or "spark-1-pro" (powerful, accurate). Default: "spark-1-mini"',
        },
      },
      required: ['prompt'],
    },
  },
  {
    name: 'firecrawl_batch_scrape',
    description: 'Scrape multiple URLs in batch with high concurrency. Perfect for efficiently extracting content from many pages simultaneously (e.g., scraping multiple financial reports, news articles, or product pages at once).',
    input_schema: {
      type: 'object',
      properties: {
        urls: {
          type: 'array',
          items: { type: 'string' },
          description: 'URLs to scrape in batch (recommended: 5-50 URLs)',
        },
        maxConcurrency: {
          type: 'number',
          description: 'Number of simultaneous scrapes. Default: system optimized',
        },
        onlyMainContent: {
          type: 'boolean',
          description: 'Extract only main content. Default: true',
        },
        parsers: {
          type: 'array',
          items: { type: 'string' },
          description: 'Parsers to enable (e.g., ["pdf"]). Default: ["pdf"]',
        },
        formats: {
          type: 'array',
          items: { type: 'string' },
          description: 'Output formats. Default: ["markdown"]',
        },
        timeout: {
          type: 'number',
          description: 'Timeout per URL in milliseconds. Default: 30000',
        },
        blockAds: {
          type: 'boolean',
          description: 'Block ads and popups. Default: true',
        },
      },
      required: ['urls'],
    },
  },
  // ==================== TAVILY WEB RESEARCH & SEARCH TOOLS ====================
  {
    name: 'tavily_search',
    description: 'Advanced web search using Tavily AI. Perfect for real-time research with AI-generated answers, time-filtered results, and topic-specific searches (general, news, finance). Supports advanced search depth for more comprehensive results and can include images, raw content, and more.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query (e.g., "latest developments in quantum computing", "NVDA earnings analysis")',
        },
        search_depth: {
          type: 'string',
          enum: ['advanced', 'basic', 'fast', 'ultra-fast'],
          description: 'Search depth. "advanced" = most comprehensive (slower), "ultra-fast" = quickest. Default: "basic"',
        },
        max_results: {
          type: 'number',
          description: 'Maximum number of results to return (1-20). Default: 5',
        },
        topic: {
          type: 'string',
          enum: ['general', 'news', 'finance'],
          description: 'Search topic category. "finance" optimizes for financial content. Default: "general"',
        },
        time_range: {
          type: 'string',
          enum: ['day', 'week', 'month', 'year', 'd', 'w', 'm', 'y'],
          description: 'Filter by time range. "day" = last 24h, "week" = last 7 days, "month" = last 30 days, "year" = last 12 months',
        },
        start_date: {
          type: 'string',
          description: 'Filter results from this date onwards (YYYY-MM-DD format)',
        },
        end_date: {
          type: 'string',
          description: 'Filter results up to this date (YYYY-MM-DD format)',
        },
        include_answer: {
          description: 'Include AI-generated answer. true/"basic" = quick answer, "advanced" = comprehensive answer. Default: false',
        },
        include_raw_content: {
          description: 'Include full page content. true/"text" = plain text, "markdown" = formatted. Default: false',
        },
        include_images: {
          type: 'boolean',
          description: 'Include image results. Default: false',
        },
        include_domains: {
          type: 'array',
          items: { type: 'string' },
          description: 'Only search these domains (e.g., ["reuters.com", "bloomberg.com"])',
        },
        exclude_domains: {
          type: 'array',
          items: { type: 'string' },
          description: 'Exclude these domains from search',
        },
        country: {
          type: 'string',
          description: 'Boost results from specific country (e.g., "US", "FR", "UK")',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'tavily_extract',
    description: 'Extract and rank content from specific URLs. Uses AI to find the most relevant chunks based on optional query. Perfect for extracting key information from known URLs like financial reports, articles, or documentation.',
    input_schema: {
      type: 'object',
      properties: {
        urls: {
          description: 'URL or array of URLs to extract from (1-10 URLs recommended)',
        },
        query: {
          type: 'string',
          description: 'Query to rank/filter extracted content chunks (e.g., "revenue growth" to find relevant sections)',
        },
        chunks_per_source: {
          type: 'number',
          description: 'Max relevant chunks per URL. Default: 3',
        },
        extract_depth: {
          type: 'string',
          enum: ['basic', 'advanced'],
          description: 'Extraction depth. "advanced" = more thorough. Default: "basic"',
        },
        include_images: {
          type: 'boolean',
          description: 'Include images from pages. Default: false',
        },
        format: {
          type: 'string',
          enum: ['markdown', 'text'],
          description: 'Content format. Default: "markdown"',
        },
        timeout: {
          type: 'number',
          description: 'Timeout in seconds per URL. Default: system optimized',
        },
      },
      required: ['urls'],
    },
  },
  {
    name: 'tavily_crawl',
    description: 'Graph-based intelligent website crawling with content extraction. Explores multiple paths in parallel using AI-guided discovery. Perfect for extracting comprehensive data from documentation sites, blogs, or knowledge bases.',
    input_schema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'Root URL to start crawling',
        },
        instructions: {
          type: 'string',
          description: 'Natural language instructions to guide the crawl (e.g., "focus on product documentation pages")',
        },
        max_depth: {
          type: 'number',
          description: 'Maximum link depth from root. Default: 1',
        },
        max_breadth: {
          type: 'number',
          description: 'Max links to follow per level. Default: 20',
        },
        limit: {
          type: 'number',
          description: 'Total URLs to process before stopping. Default: 50',
        },
        select_paths: {
          type: 'array',
          items: { type: 'string' },
          description: 'Regex patterns for URLs to include (e.g., ["/docs/.*", "/api/.*"])',
        },
        exclude_paths: {
          type: 'array',
          items: { type: 'string' },
          description: 'Regex patterns for URLs to exclude',
        },
        select_domains: {
          type: 'array',
          items: { type: 'string' },
          description: 'Regex patterns for domains to include',
        },
        exclude_domains: {
          type: 'array',
          items: { type: 'string' },
          description: 'Regex patterns for domains to exclude',
        },
        allow_external: {
          type: 'boolean',
          description: 'Allow external domain links in results. Default: true',
        },
        extract_depth: {
          type: 'string',
          enum: ['basic', 'advanced'],
          description: 'Content extraction depth. Default: "basic"',
        },
        format: {
          type: 'string',
          enum: ['markdown', 'text'],
          description: 'Content format. Default: "markdown"',
        },
        timeout: {
          type: 'number',
          description: 'Total timeout in seconds. Default: 150',
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'tavily_map',
    description: 'Fast site mapping to discover all URLs without extracting content. Explores website structure in parallel using graph traversal. Perfect for discovering site architecture, finding specific page patterns, or generating sitemaps.',
    input_schema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'Website URL to map',
        },
        instructions: {
          type: 'string',
          description: 'Natural language instructions for mapping (e.g., "find all product pages")',
        },
        max_depth: {
          type: 'number',
          description: 'Maximum depth to traverse. Default: 1',
        },
        max_breadth: {
          type: 'number',
          description: 'Max links per level. Default: 20',
        },
        limit: {
          type: 'number',
          description: 'Total links to process. Default: 50',
        },
        select_paths: {
          type: 'array',
          items: { type: 'string' },
          description: 'Regex patterns for paths to include',
        },
        exclude_paths: {
          type: 'array',
          items: { type: 'string' },
          description: 'Regex patterns for paths to exclude',
        },
        allow_external: {
          type: 'boolean',
          description: 'Include external links. Default: true',
        },
        timeout: {
          type: 'number',
          description: 'Timeout in seconds. Default: 150',
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'tavily_research',
    description: 'Autonomous AI research agent that conducts comprehensive research on any topic. Performs multiple searches, analyzes sources, synthesizes information, and generates a detailed research report with citations. Perfect for in-depth research tasks, competitive analysis, market research, or academic inquiries.',
    input_schema: {
      type: 'object',
      properties: {
        input: {
          type: 'string',
          description: 'Research question or topic (e.g., "What are the latest trends in renewable energy investment?", "Comprehensive analysis of AI chip market")',
        },
        model: {
          type: 'string',
          enum: ['mini', 'pro', 'auto'],
          description: 'Research model. "mini" = fast & cost-effective, "pro" = most thorough, "auto" = adaptive. Default: "auto"',
        },
        output_schema: {
          type: 'object',
          description: 'JSON schema to structure research output (e.g., {type: "object", properties: {summary: {type: "string"}, key_findings: {type: "array"}}})',
        },
        citation_format: {
          type: 'string',
          enum: ['numbered', 'mla', 'apa', 'chicago'],
          description: 'Citation format for sources. Default: "numbered"',
        },
      },
      required: ['input'],
    },
  },
];
