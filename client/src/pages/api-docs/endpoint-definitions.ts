import {
  Key, FileText, BookOpen, Search, BarChart3, Cpu,
  MessageSquare, Code2,
} from "lucide-react";
import type { EndpointGroup } from "./types";

export const API_GROUPS: EndpointGroup[] = [
  {
    id: "keys",
    name: "API Keys",
    icon: Key,
    color: "from-amber-500 to-orange-500",
    description: "Create and manage API keys for authentication. Key creation is open; management requires a valid key.",
    basePath: "/api/v1/keys",
    endpoints: [
      {
        method: "POST",
        path: "/api/v1/keys",
        description: "Create a new API key. Returns the raw key ONCE — store it securely.",
        scope: "open",
        bodyParams: [
          { name: "name", type: "string", required: true, description: "Human-readable label for the key (min 2 chars)" },
          { name: "scopes", type: "string", required: false, description: "Comma-separated scopes: read, search, download, write" },
          { name: "userId", type: "string", required: false, description: "Link the key to a user account" },
        ],
        exampleResponse: `{
  "ok": true,
  "data": {
    "id": "uuid",
    "key": "ask_a1b2c3d4e5f6...",
    "prefix": "ask_a1b2c3d4",
    "name": "My Research Script",
    "scopes": ["read", "search"],
    "rateLimit": 100,
    "createdAt": "2026-03-30T...",
    "warning": "Store this key securely. It will NOT be shown again."
  }
}`,
      },
      {
        method: "GET",
        path: "/api/v1/keys",
        description: "List all API keys for the authenticated user (key values are masked).",
        scope: "read",
        exampleResponse: `{
  "ok": true,
  "data": [
    {
      "id": "uuid",
      "name": "My Script",
      "prefix": "ask_a1b2c3d4",
      "scopes": ["read"],
      "rateLimit": 100,
      "totalRequests": 42,
      "lastUsedAt": "2026-03-30T...",
      "revoked": false
    }
  ]
}`,
      },
      {
        method: "DELETE",
        path: "/api/v1/keys/:id",
        description: "Revoke an API key permanently.",
        scope: "read",
        params: [{ name: "id", type: "string", required: true, description: "API key ID" }],
      },
    ],
  },
  {
    id: "papers",
    name: "Papers",
    icon: FileText,
    color: "from-blue-500 to-cyan-500",
    description: "Access AutoScholar's published research paper corpus. Full metadata, LaTeX content, BibTeX citations.",
    basePath: "/api/v1/papers",
    endpoints: [
      {
        method: "GET",
        path: "/api/v1/papers",
        description: "List published papers with filtering, sorting, and pagination.",
        scope: "read",
        queryParams: [
          { name: "page", type: "integer", default: "1", description: "Page number" },
          { name: "limit", type: "integer", default: "20", description: "Items per page (max 100)" },
          { name: "domain", type: "string", description: "Filter by research domain" },
          { name: "template", type: "string", description: "Filter by template (article, working_paper, econometrica)" },
          { name: "author", type: "string", description: "Filter by author name (partial match)" },
          { name: "keyword", type: "string", description: "Filter by keyword (partial match)" },
          { name: "q", type: "string", description: "Full-text search in title and abstract" },
          { name: "sort", type: "string", default: "newest", description: "Sort: newest, oldest, words, figures" },
        ],
        exampleResponse: `{
  "ok": true,
  "data": [
    {
      "id": "uuid",
      "asid": "ASID-2026-0042",
      "title": "Monte Carlo Methods for Option Pricing",
      "abstract": "We present a comprehensive...",
      "authors": "AutoScholar AI",
      "keywords": ["Monte Carlo", "options", "pricing"],
      "domain": "quantitative_finance",
      "template": "article",
      "wordCount": 8500,
      "sectionCount": 7,
      "figureCount": 4,
      "generationCost": 0.45,
      "publishedAt": "2026-03-28T..."
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 150, "totalPages": 8 }
}`,
      },
      {
        method: "GET",
        path: "/api/v1/papers/:id",
        description: "Get full paper details including LaTeX sections and BibTeX. Accepts paper ID or ASID.",
        scope: "read",
        params: [{ name: "id", type: "string", required: true, description: "Paper UUID or ASID (e.g., ASID-2026-0042)" }],
        exampleResponse: `{
  "ok": true,
  "data": {
    "id": "uuid",
    "asid": "ASID-2026-0042",
    "title": "...",
    "latexSections": [
      { "type": "introduction", "latex_content": "\\\\section{Introduction}\\n..." },
      { "type": "methodology", "latex_content": "\\\\section{Methodology}\\n..." }
    ],
    "bibtexEntries": "@article{...}\\n..."
  }
}`,
      },
      {
        method: "GET",
        path: "/api/v1/papers/:id/latex",
        description: "Get only the LaTeX content for a paper (sections array + BibTeX).",
        scope: "read",
        params: [{ name: "id", type: "string", required: true, description: "Paper UUID or ASID" }],
      },
      {
        method: "GET",
        path: "/api/v1/papers/:id/bibtex",
        description: "Get a BibTeX citation entry for citing this paper. Returns text/plain by default, or JSON with ?format=json.",
        scope: "read",
        params: [{ name: "id", type: "string", required: true, description: "Paper UUID or ASID" }],
        queryParams: [
          { name: "format", type: "string", description: "Response format: omit for text/plain, 'json' for JSON" },
        ],
      },
      {
        method: "GET",
        path: "/api/v1/papers/domains",
        description: "List all unique research domains with paper counts.",
        scope: "read",
        exampleResponse: `{
  "ok": true,
  "data": [
    { "domain": "quantitative_finance", "count": 45 },
    { "domain": "macroeconomics", "count": 23 },
    { "domain": "machine_learning", "count": 18 }
  ]
}`,
      },
      {
        method: "GET",
        path: "/api/v1/papers/templates",
        description: "List all paper templates with counts.",
        scope: "read",
      },
    ],
  },
  {
    id: "reviews",
    name: "Peer Reviews",
    icon: BookOpen,
    color: "from-violet-500 to-purple-600",
    description: "AI-generated peer reviews with detailed scoring: originality, methodology, results, writing, references, reproducibility.",
    basePath: "/api/v1/reviews",
    endpoints: [
      {
        method: "GET",
        path: "/api/v1/reviews",
        description: "List all peer reviews with filtering and pagination.",
        scope: "read",
        queryParams: [
          { name: "page", type: "integer", default: "1", description: "Page number" },
          { name: "limit", type: "integer", default: "20", description: "Items per page (max 100)" },
          { name: "recommendation", type: "string", description: "Filter: accept, minor_revision, major_revision, reject" },
          { name: "min_score", type: "integer", description: "Minimum overall score (0-100)" },
          { name: "max_score", type: "integer", description: "Maximum overall score (0-100)" },
          { name: "sort", type: "string", default: "newest", description: "Sort: newest, oldest, score_asc, score_desc" },
        ],
        exampleResponse: `{
  "ok": true,
  "data": [
    {
      "paperId": "uuid",
      "overallScore": 78,
      "recommendation": "minor_revision",
      "summary": "This paper presents...",
      "strengths": ["Strong methodology", "Novel approach"],
      "weaknesses": ["Limited dataset"],
      "detailedScores": {
        "originality": 80,
        "methodology": 85,
        "results": 70,
        "writing": 75,
        "references": 82,
        "reproducibility": 68
      }
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 95, "totalPages": 5 }
}`,
      },
      {
        method: "GET",
        path: "/api/v1/reviews/:paperId",
        description: "Get the full peer review for a specific paper (includes full markdown report).",
        scope: "read",
        params: [{ name: "paperId", type: "string", required: true, description: "Paper UUID" }],
      },
      {
        method: "GET",
        path: "/api/v1/reviews/stats/summary",
        description: "Aggregate review statistics: score distributions, recommendation breakdown, detailed score averages.",
        scope: "read",
      },
    ],
  },
  {
    id: "search",
    name: "Search",
    icon: Search,
    color: "from-emerald-500 to-teal-500",
    description: "Cross-resource search across papers, reports, and prompts with relevance scoring.",
    basePath: "/api/v1/search",
    endpoints: [
      {
        method: "GET",
        path: "/api/v1/search",
        description: "Unified full-text search across all resources. Results ranked by relevance score.",
        scope: "read / search",
        queryParams: [
          { name: "q", type: "string", description: "Search query (required, min 2 chars)" },
          { name: "type", type: "string", default: "all", description: "Resource type: all, papers, reports, prompts" },
          { name: "page", type: "integer", default: "1", description: "Page number" },
          { name: "limit", type: "integer", default: "20", description: "Items per page" },
        ],
        exampleResponse: `{
  "ok": true,
  "data": [
    { "type": "paper", "id": "uuid", "title": "...", "snippet": "...", "score": 15 },
    { "type": "report", "id": "share-id", "title": "...", "snippet": "...", "score": 12 },
    { "type": "prompt", "id": "uuid", "title": "...", "snippet": "...", "score": 8 }
  ],
  "meta": { "page": 1, "limit": 20, "total": 42, "totalPages": 3 }
}`,
      },
      {
        method: "GET",
        path: "/api/v1/search/papers",
        description: "Advanced paper search with structured filters.",
        scope: "read / search",
        queryParams: [
          { name: "q", type: "string", description: "Text search" },
          { name: "domain", type: "string", description: "Research domain" },
          { name: "author", type: "string", description: "Author name" },
          { name: "year", type: "integer", description: "Publication year" },
          { name: "min_words", type: "integer", description: "Minimum word count" },
          { name: "max_words", type: "integer", description: "Maximum word count" },
        ],
      },
    ],
  },
  {
    id: "stats",
    name: "Platform Stats",
    icon: BarChart3,
    color: "from-rose-500 to-pink-600",
    description: "Comprehensive platform metrics: papers, tokens, cost, domains, timeline, analytics time-series.",
    basePath: "/api/v1/stats",
    endpoints: [
      {
        method: "GET",
        path: "/api/v1/stats/platform",
        description: "Platform-wide aggregate statistics.",
        scope: "read",
        exampleResponse: `{
  "ok": true,
  "data": {
    "papers": { "total": 150, "totalWords": 1250000, "totalFigures": 420, "uniqueDomains": 12 },
    "sessions": { "total": 3200, "totalTokens": 450000000 },
    "compute": { "totalApiCost": 1250.00, "avgCostPerPaper": 8.33, "totalPythonExecutions": 12000 }
  }
}`,
      },
      {
        method: "GET",
        path: "/api/v1/stats/domains",
        description: "Domain distribution with per-domain word counts, figure counts, and paper IDs.",
        scope: "read",
      },
      {
        method: "GET",
        path: "/api/v1/stats/timeline",
        description: "Paper publication timeline grouped by month.",
        scope: "read",
      },
      {
        method: "GET",
        path: "/api/v1/stats/analytics",
        description: "Time-series analytics metrics (requests, tokens, errors, performance).",
        scope: "read",
        queryParams: [
          { name: "period", type: "string", default: "hour", description: "Aggregation: minute, hour, day" },
          { name: "limit", type: "integer", default: "60", description: "Data points (max 500)" },
        ],
      },
    ],
  },
  {
    id: "pipeline",
    name: "Pipeline",
    icon: Cpu,
    color: "from-indigo-500 to-blue-600",
    description: "Monitor the autonomous paper generation pipeline: runs, stages, Popper scores, governor decisions.",
    basePath: "/api/v1/pipeline",
    endpoints: [
      {
        method: "GET",
        path: "/api/v1/pipeline/runs",
        description: "List pipeline runs with optional status filtering.",
        scope: "read",
        queryParams: [
          { name: "page", type: "integer", default: "1", description: "Page number" },
          { name: "limit", type: "integer", default: "20", description: "Items per page" },
          { name: "status", type: "string", description: "Filter: queued, researching, analyzing, drafting, validating, published, rejected, failed" },
        ],
      },
      {
        method: "GET",
        path: "/api/v1/pipeline/runs/:id",
        description: "Get detailed info about a specific pipeline run (includes governor state).",
        scope: "read",
        params: [{ name: "id", type: "string", required: true, description: "Run UUID" }],
      },
      {
        method: "GET",
        path: "/api/v1/pipeline/stats",
        description: "Aggregate pipeline statistics: success rates, durations, Popper score distribution.",
        scope: "read",
      },
      {
        method: "GET",
        path: "/api/v1/pipeline/active",
        description: "Get currently active (running) pipeline runs.",
        scope: "read",
      },
    ],
  },
  {
    id: "sessions",
    name: "Sessions",
    icon: MessageSquare,
    color: "from-sky-500 to-blue-500",
    description: "Anonymized research session data: topics, token usage, cost, tools used.",
    basePath: "/api/v1/sessions",
    endpoints: [
      {
        method: "GET",
        path: "/api/v1/sessions",
        description: "List anonymized research sessions with metadata.",
        scope: "read",
        queryParams: [
          { name: "page", type: "integer", default: "1", description: "Page number" },
          { name: "limit", type: "integer", default: "20", description: "Items per page" },
          { name: "sort", type: "string", default: "newest", description: "Sort: newest, oldest, cost, tokens" },
        ],
      },
      {
        method: "GET",
        path: "/api/v1/sessions/stats",
        description: "Aggregate session statistics with daily activity for the last 30 days.",
        scope: "read",
      },
    ],
  },
  {
    id: "prompts",
    name: "Prompts",
    icon: Code2,
    color: "from-fuchsia-500 to-purple-500",
    description: "Community-contributed research prompt library. Read and contribute prompts.",
    basePath: "/api/v1/prompts",
    endpoints: [
      {
        method: "GET",
        path: "/api/v1/prompts",
        description: "List all prompts with optional search.",
        scope: "read",
        queryParams: [
          { name: "page", type: "integer", default: "1", description: "Page number" },
          { name: "limit", type: "integer", default: "20", description: "Items per page" },
          { name: "q", type: "string", description: "Search in title and content" },
          { name: "author", type: "string", description: "Filter by author name" },
        ],
      },
      {
        method: "POST",
        path: "/api/v1/prompts",
        description: "Contribute a new prompt to the library.",
        scope: "write",
        bodyParams: [
          { name: "title", type: "string", required: true, description: "Prompt title" },
          { name: "content", type: "string", required: true, description: "Prompt content/template" },
          { name: "authorName", type: "string", required: false, description: "Author display name" },
        ],
      },
    ],
  },
];
