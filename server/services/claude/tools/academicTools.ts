import type { ClaudeToolDefinition } from './types';

export const ACADEMIC_TOOLS: ClaudeToolDefinition[] = [
  // ── Academic Research Tools ──
  {
    name: 'academic_search',
    description: 'Search academic papers on Google Scholar. Returns titles, authors, publication info, citation count, snippets, and PDF links. Use for literature reviews, finding methodology references, and citing prior work.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Academic search query',
        },
        limit: {
          type: 'number',
          description: 'Max results (default: 10, max: 20)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'academic_literature_review',
    description: 'Conduct an automated literature review on a topic. Searches Google Scholar, extracts key papers, reads abstracts/PDFs, and returns a structured literature survey with BibTeX entries. Use when writing a research paper or when the user asks for a "revue de littérature".',
    input_schema: {
      type: 'object',
      properties: {
        topic: {
          type: 'string',
          description: 'Research topic for the literature review',
        },
        num_papers: {
          type: 'number',
          description: 'Target number of papers (default: 15, max: 30)',
        },
        focus_areas: {
          type: 'array',
          items: { type: 'string' },
          description: 'Specific aspects to focus on',
        },
        date_range: {
          type: 'string',
          description: 'Publication date range (e.g., "2015-2025")',
        },
      },
      required: ['topic'],
    },
  },
  // ─────────────────────────────────────────────
  // Academic Search Tools (OpenAlex, arXiv, CrossRef)
  // ─────────────────────────────────────────────
  {
    name: 'arxiv_search',
    description: `Search arXiv for academic preprints in quantitative finance, economics, and machine learning.
Returns papers with arXiv IDs and PDF links.
Best categories: q-fin (quantitative finance), econ (economics), stat.ML (statistical ML), cs.LG (machine learning).`,
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query',
        },
        limit: {
          type: 'number',
          description: 'Number of papers to retrieve (default: 10, max: 30)',
        },
        category: {
          type: 'string',
          description: 'arXiv category filter: "q-fin", "q-fin.PR", "q-fin.RM", "q-fin.ST", "q-fin.PM", "econ", "econ.EM", "stat.ML", "cs.LG"',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'crossref_lookup',
    description: `Look up a paper by DOI via CrossRef and get validated BibTeX metadata.
Use when you have a DOI and need accurate, publisher-verified citation data.
Also supports keyword search across CrossRef's 140M+ academic works.`,
    input_schema: {
      type: 'object',
      properties: {
        doi: {
          type: 'string',
          description: 'DOI to look up e.g. "10.1016/j.jfineco.2023.01.001" (mutually exclusive with query)',
        },
        query: {
          type: 'string',
          description: 'Keyword search across CrossRef (mutually exclusive with doi)',
        },
        limit: {
          type: 'number',
          description: 'Number of results for query search (default: 10)',
        },
        filter: {
          type: 'string',
          description: 'CrossRef filter e.g. "from-pub-date:2015", "type:journal-article"',
        },
      },
      required: [],
    },
  },
  {
    name: 'openalex_search',
    description: `Search OpenAlex — 250M+ academic works, completely free, no API key needed.
Primary academic search engine with excellent coverage of economics, finance, and social sciences.
Returns DOIs, citation counts, open-access PDF links, and BibTeX.
IMPORTANT: Use this as your primary tool for finding academic papers with verified citations.`,
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query',
        },
        limit: {
          type: 'number',
          description: 'Number of papers (default: 10, max: 50)',
        },
        filter: {
          type: 'string',
          description: 'OpenAlex filter e.g. "publication_year:>2015", "type:article", "open_access.is_oa:true"',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'academic_search_multi',
    description: `Search ALL academic databases simultaneously (OpenAlex + arXiv + CrossRef + Google Scholar) and return deduplicated, merged results sorted by citation count.
- OpenAlex: 250M+ works, primary source, excellent economics/finance/social science coverage
- arXiv: preprints in q-fin, econ, ML
- CrossRef: publisher-verified DOIs, 140M+ articles
- Google Scholar: widest coverage (requires SERPAPI_KEY env var)
Returns a ready-to-use bibtex_block for compile_research_paper, plus sources_used/sources_failed for transparency.
ALWAYS use this for literature reviews in research papers.`,
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query',
        },
        limit: {
          type: 'number',
          description: 'Papers per source (default: 10)',
        },
        sources: {
          type: 'array',
          items: { type: 'string', enum: ['openalex', 'arxiv', 'crossref', 'google_scholar'] },
          description: 'Sources to include (default: openalex + arxiv + crossref). Add "google_scholar" for maximum coverage if SERPAPI_KEY is set.',
        },
        arxiv_category: {
          type: 'string',
          description: 'arXiv category filter: "q-fin", "econ", "econ.EM", "stat.ML", "cs.LG"',
        },
      },
      required: ['query'],
    },
  },
  // ==================== LITERATURE GAP FINDER ====================
  {
    name: 'literature_gap_finder',
    description: `Advanced 7-step academic literature analysis sub-agent. Acts as a scientific discovery engine using multi-source search (OpenAlex, arXiv, CrossRef — 250M+ papers).

Pipeline:
1. Query Planning — generates 7 diverse search queries (theoretical, methodological, empirical, cross-disciplinary, applied)
2. Multi-Source Discovery — parallel search across OpenAlex, arXiv, and CrossRef
3. Citation Network Expansion — follows references from top-cited papers via OpenAlex and CrossRef
4. Scientific Structure Extraction — identifies dominant methods, datasets, limitations, future directions
5. Thematic Clustering & Synthesis — groups papers into 5-7 clusters with scholarly synthesis
6. Gap Detection Engines — 6 specialized detectors:
   • Method Gap — methods from adjacent fields absent in target
   • Dataset Gap — available datasets rarely used
   • Temporal Gap — under-studied time periods
   • Contradiction Detector — conflicting results across papers
   • Limitation Aggregator — repeated limitations signaling opportunities
   • Cross-Disciplinary Bridge — disconnected clusters that should interact
7. Gap Validation — targeted search to verify gaps aren't already covered, numeric scoring (0-1)

Returns: ranked gaps with evidence, literature synthesis, thematic clusters, scientific landscape analysis, paper proposal (title + abstract + contributions), complete BibTeX block.

USE THIS TOOL AS THE FIRST STEP when generating a research paper.`,
    input_schema: {
      type: 'object',
      properties: {
        topic: {
          type: 'string',
          description: 'Research topic or area to analyze (e.g., "Impact of monetary policy on emerging market volatility", "Machine learning for credit risk prediction")',
        },
        focus_areas: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional: specific sub-topics to prioritize (e.g., ["GARCH models", "asymmetric effects", "contagion"])',
        },
        date_range: {
          type: 'string',
          description: 'Optional: preferred publication date range (e.g., "2015-2025")',
        },
        paper_limit: {
          type: 'number',
          description: 'Papers per query per source (default: 15). Higher = more comprehensive but slower.',
        },
        sources: {
          type: 'array',
          items: { type: 'string', enum: ['openalex', 'arxiv', 'crossref', 'google_scholar'] },
          description: 'Academic sources to search (default: openalex + arxiv + crossref). Add "google_scholar" if SERPAPI_KEY is set.',
        },
        arxiv_category: {
          type: 'string',
          description: 'Optional arXiv category filter: "q-fin", "econ", "econ.EM", "stat.ML", "cs.LG"',
        },
      },
      required: ['topic'],
    },
  },
  // ==================== WEB DATASET COLLECTOR V3 (SWDES) ====================
  {
    name: 'web_dataset_collector',
    description: `Collect large-scale structured datasets from the web using Firecrawl's full API surface (search, map, crawl, extract, batch scrape) combined with Tavily + Exa for maximum coverage.

This is a POWERFUL Structured Web Data Extraction System (SWDES) that:
1. Plans optimal search queries with AI (6-10 diverse queries)
2. Searches across 3 engines simultaneously (Firecrawl, Tavily, Exa)
3. Maps data portal sites to discover all data subpages (via Firecrawl Map)
4. Ranks sources by data quality (govt portals > open data > Wikipedia > aggregators)
5. Extracts structured data with 6-strategy pipeline:
   - Schema-based extraction (Firecrawl Extract on up to 30 URLs)
   - Multi-page crawling of data portals (depth=2, 20 pages per domain)
   - Batch scraping with content-type detection (tables, CSV/PDF/Excel links)
   - Download link scraping (direct CSV/PDF files found during scraping)
   - Tavily deep extraction + Exa content extraction (fallbacks)
6. Detects content types: HTML tables, CSV/Excel download links, PDF links, JSON data
7. Normalizes, deduplicates, and validates the dataset
8. Outputs clean CSV/JSON with metadata sidecar, extraction stats, and source traceability

Scale: Up to 100,000 rows from 25+ web sources in a single call.
Traceability: Every row includes source_url and extraction_type columns.

USE WHEN you need:
- ESG scores, sustainability rankings, carbon emissions data
- Crypto metrics (hashrate, TVL, exchange volumes, on-chain data)
- Alternative data (satellite stats, app downloads, social sentiment)
- Industry-specific metrics (shipping rates, fab utilization, pharma pipelines)
- Cross-country regulatory, policy, demographic comparison data
- Historical niche data (commodity reserves, trade tariffs, patent filings)
- Any tabular data from government portals, UN, WHO, Eurostat, data.gov
- Company directories, product catalogs, university rankings
- Climate/environmental datasets, energy production statistics
- Data from multi-page sites, paginated tables, or downloadable CSV/Excel files

DO NOT USE for data available via existing API tools.

After this tool returns file_path, load in execute_custom_python_analysis:
  df = pd.read_csv(file_path)  # or pd.read_json(file_path)
  # Then ALWAYS save for reproducibility:
  save_raw_data(df, "web_dataset.csv", source="web_dataset_collector", method="web")`,
    input_schema: {
      type: 'object',
      properties: {
        description: {
          type: 'string',
          description: 'Detailed description of the dataset needed. Be VERY specific: (1) entities (companies, countries, assets), (2) metrics/variables, (3) time period, (4) scope/filters, (5) granularity. Example: "Annual ESG scores for all S&P 500 companies from 2018 to 2024, with E/S/G sub-scores, industry sector, market cap tier, and controversy flags"',
        },
        expected_columns: {
          type: 'array',
          items: { type: 'string' },
          description: 'Expected column names. Helps AI structure data correctly. Example: ["company", "ticker", "year", "esg_total", "environmental", "social", "governance", "sector"]',
        },
        max_sources: {
          type: 'number',
          description: 'Maximum web sources to scrape (1-25, default: 15). For large datasets use 20-25.',
        },
        max_rows: {
          type: 'number',
          description: 'Maximum rows to collect (default: 100000). For focused datasets set lower (e.g., 5000).',
        },
        preferred_sources: {
          type: 'array',
          items: { type: 'string' },
          description: 'Preferred source URLs/domains. Example: ["data.worldbank.org", "eurostat.ec.europa.eu", "data.gov", "kaggle.com"]',
        },
        search_engines: {
          type: 'array',
          items: { type: 'string', enum: ['firecrawl', 'tavily', 'exa'] },
          description: 'Which search engines to use (default: all available). Use all 3 for maximum coverage.',
        },
        output_format: {
          type: 'string',
          enum: ['csv', 'json'],
          description: 'Output format. Default: "csv". Use "json" for nested/hierarchical data.',
        },
      },
      required: ['description'],
    },
  },
];
