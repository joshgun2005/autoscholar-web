# Architecture

Detailed technical architecture of the VibeQuant platform.

## System Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                        CLIENT (React 18)                         │
│  ┌──────────┐  ┌──────────────┐  ┌────────────┐  ┌───────────┐ │
│  │ Chat UI  │  │ Explore Page │  │ Admin Panel│  │ Auth/Docs │ │
│  │ (SSE)    │  │ (FMP data)   │  │ (Analytics)│  │ (Sessions)│ │
│  └────┬─────┘  └──────┬───────┘  └─────┬──────┘  └─────┬─────┘ │
│       │               │                │               │        │
│  ┌────┴───────────────┴────────────────┴───────────────┴─────┐  │
│  │         TanStack Query + useChatSession Hook              │  │
│  └───────────────────────────┬───────────────────────────────┘  │
└──────────────────────────────┼──────────────────────────────────┘
                               │ HTTP / SSE
┌──────────────────────────────┼──────────────────────────────────┐
│                       SERVER (Express 4)                        │
│  ┌───────────────────────────┴───────────────────────────────┐  │
│  │                    Route Modules (6)                       │  │
│  │  auth │ admin │ analytics │ fmp │ reports │ chat (SSE)    │  │
│  └───┬───────┬──────────┬──────────┬──────────┬──────────────┘  │
│      │       │          │          │          │                  │
│  ┌───┴───┐ ┌─┴──────┐ ┌┴────────┐ │   ┌─────┴──────────────┐  │
│  │Storage│ │Analytics│ │Zod Valid│ │   │  Claude Opus 4.6   │  │
│  │(Drizzle)│ │Metrics │ │Schemas │ │   │  237 tools         │  │
│  └───┬───┘ └────────┘ └────────┘ │   │  5-tool batching    │  │
│      │                           │   └──────────┬──────────┘  │
│  ┌───┴──────┐              ┌─────┴──────┐ ┌─────┴──────────┐  │
│  │SQLite/PG │              │ FMP Service│ │ Python Engine  │  │
│  │(Drizzle) │              │ 256 funcs  │ │ 17 libraries   │  │
│  └──────────┘              └────────────┘ └────────────────┘  │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │              External APIs                                 │  │
│  │  Tavily │ Firecrawl │ Exa │ SerpAPI │ ElevenLabs          │  │
│  └────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
vquant/
├── client/src/                           # Frontend
│   ├── App.tsx                           # Router + ErrorBoundary + providers
│   ├── main.tsx                          # Entry point (createRoot)
│   ├── config.ts                         # App config, endpoints, feature flags
│   ├── index.css                         # Global styles + Tailwind
│   │
│   ├── components/
│   │   ├── chat/                         # 13 chat-specific components
│   │   │   ├── search-bar.tsx            # Query input with image upload
│   │   │   ├── streaming-answer.tsx      # Real-time markdown rendering
│   │   │   ├── agent-steps.tsx           # Tool execution progress display
│   │   │   ├── tool-results.tsx          # Financial data cards
│   │   │   ├── monte-carlo-results.tsx   # Monte Carlo visualization
│   │   │   ├── custom-python-figure.tsx  # Python-generated chart gallery
│   │   │   ├── result-card.tsx           # Web search result card
│   │   │   ├── search-bar.tsx            # Search input component
│   │   │   ├── searching-widget.tsx      # Loading animation
│   │   │   ├── empty-state.tsx           # Welcome screen with suggestions
│   │   │   ├── error-state.tsx           # Error display with retry
│   │   │   ├── conversation-history.tsx  # Past Q&A accordion
│   │   │   ├── session-history.tsx       # Session list sidebar
│   │   │   ├── share-button.tsx          # Report sharing dialog
│   │   │   └── download-buttons.tsx      # PDF/DOCX export buttons
│   │   ├── explore/                      # 7 stock explorer components
│   │   │   ├── stock-header.tsx          # Symbol + price display
│   │   │   ├── market-overview.tsx       # Gainers, losers, actives
│   │   │   ├── financial-statements-view.tsx
│   │   │   ├── metrics-view.tsx
│   │   │   ├── analyst-view.tsx
│   │   │   ├── news-view.tsx
│   │   │   └── ownership-view.tsx
│   │   ├── financial/                    # Charts
│   │   │   ├── advanced-price-chart.tsx  # TradingView-style chart
│   │   │   └── options-pricing-card.tsx  # Black-Scholes display
│   │   ├── ui/                           # 35 shadcn/ui primitives
│   │   ├── error-boundary.tsx            # Global React error handler
│   │   ├── streaming-answer.tsx          # Shared markdown renderer
│   │   ├── market-ticker.tsx             # Top market ticker bar
│   │   ├── theme-provider.tsx            # Dark/light mode context
│   │   ├── theme-toggle.tsx              # Theme switch button
│   │   └── theme-color-picker.tsx        # Accent color selector
│   │
│   ├── hooks/
│   │   ├── useChatSession.ts             # All chat state + business logic (313 lines)
│   │   ├── useChatMutation.ts            # SSE streaming fetch client
│   │   ├── useAnalytics.ts               # Heartbeat tracking
│   │   ├── use-toast.ts                  # Toast notifications
│   │   └── use-mobile.tsx                # Responsive media query
│   │
│   ├── pages/                            # 9 route pages
│   │   ├── home.tsx                      # Main chat (255 lines, pure render)
│   │   ├── explore.tsx                   # Stock explorer
│   │   ├── admin.tsx                     # Admin dashboard
│   │   ├── auth.tsx                      # Login / register
│   │   ├── showcase.tsx                  # Community shared reports
│   │   ├── shared-report.tsx             # View shared report
│   │   ├── documentation.tsx             # Docs page
│   │   ├── slides-generator.tsx          # Beamer slide creator
│   │   ├── privacy.tsx / terms.tsx       # Legal pages
│   │   └── not-found.tsx                 # 404
│   │
│   ├── lib/
│   │   ├── queryClient.ts               # TanStack Query defaults
│   │   └── utils.ts                      # cn() class merger
│   │
│   └── utils/
│       ├── chartCapture.ts               # DOM-to-image for charts
│       └── pdfGenerator.ts              # Client-side PDF assembly
│
├── server/                               # Backend
│   ├── index.ts                          # Express bootstrap, CORS, sessions, middleware
│   ├── routes.ts                         # /api/chat (SSE) + /api/speech-to-text (~1960 lines)
│   ├── routes/
│   │   ├── auth.ts                       # /api/auth/* (4 endpoints)
│   │   ├── admin.ts                      # /api/admin/* (5 endpoints) + requireAdmin
│   │   ├── analytics.ts                  # /api/analytics/* (4 endpoints)
│   │   ├── fmp.ts                        # /api/fmp/* (23 endpoints)
│   │   ├── reports.ts                    # /api/share, sessions, docs, download (8 endpoints)
│   │   └── validation.ts                # Zod request schemas
│   ├── services/
│   │   ├── claude/
│   │   │   ├── toolDefinitions.ts        # 237 tool definitions (~4,480 lines)
│   │   │   └── tokenManagement.ts        # Context window management
│   │   ├── claudeService.ts              # Claude API streaming integration
│   │   ├── fmpService.ts                 # 256 FMP API wrapper functions
│   │   ├── python/
│   │   │   ├── monteCarlo.ts             # Monte Carlo simulation executor
│   │   │   ├── optionsPricing.ts         # Black-Scholes executor
│   │   │   ├── garch.ts                  # GARCH model executor
│   │   │   ├── var.ts                    # VaR + portfolio + risk + plot + custom Python
│   │   │   ├── shared.ts                 # Python path config
│   │   │   └── index.ts                  # Barrel exports
│   │   ├── pythonExecutor.ts             # Re-exports from python/
│   │   ├── firecrawlService.ts           # 7 Firecrawl functions
│   │   ├── tavilyService.ts              # 6 Tavily functions
│   │   ├── exaService.ts                 # 2 Exa functions
│   │   ├── serpapiService.ts             # 11 SerpAPI functions
│   │   ├── pdfService.ts                 # Puppeteer PDF + Pandoc DOCX
│   │   ├── beamerSlidesService.ts        # LaTeX Beamer slides
│   │   ├── slidesConverterService.ts     # Markdown to slide structure
│   │   ├── contentSummarizerService.ts   # Content summarization
│   │   ├── financialDataService.ts       # Options chain data
│   │   └── *.py                          # 11 Python services
│   ├── db.ts                             # Drizzle ORM setup (SQLite + PostgreSQL)
│   ├── storage.ts                        # Typed data access layer (IStorage interface)
│   ├── types/modules.d.ts               # Module declarations
│   └── utils/logger.ts                  # Structured logging utility
│
├── shared/                               # Shared between client & server
│   ├── schema.ts                         # PostgreSQL schema (Drizzle, 9 tables)
│   ├── schema-sqlite.ts                  # SQLite schema (Drizzle, 9 tables)
│   └── types.ts                          # API interfaces (SearchResult, ChatRequest, etc.)
│
├── docs/                                 # Documentation
├── .github/workflows/ci.yml             # CI pipeline
├── vitest.config.ts                      # Test config
├── eslint.config.js                      # ESLint flat config
├── vite.config.ts                        # Vite build config
├── tsconfig.json                         # TypeScript config
├── tailwind.config.ts                    # Tailwind config
├── .prettierrc                           # Prettier config
├── .editorconfig                         # Editor config
├── .env.example                          # Env template
└── .gitignore                            # Git ignore rules
```

## Data Flow

### Chat Request Flow

```
User types query
  → useChatSession.handleSearch()
  → useChatMutation.mutate() (POST /api/chat)
  → Express receives request
  → Zod validates chatBodySchema
  → SSE headers sent, streaming begins
  → Claude Opus 4.6 called with 237 tools
  → Claude returns tool_use blocks
  → Tools executed in batches of 5
    → FMP API calls (financial data)
    → Python scripts (quant analysis)
    → Web search (Tavily/Firecrawl/Exa)
  → Results sent back to Claude
  → Claude generates final answer
  → Answer streamed via SSE events:
    - type: "text" (incremental tokens)
    - type: "sources" (web results)
    - type: "tool_start/complete/error"
    - type: "tool_result" (data display)
    - type: "custom_python_figures"
    - type: "done" (sessionId)
  → Client renders in real-time
  → Session saved to database
```

### Database Architecture

```
users ──┐
        ├── conversationSessions (userId FK)
        ├── activeUsers (userId FK)
        └── requestLogs (userId FK)

crawledPages ── embeddings (pageId FK)

messages (sessionId, no FK)
sharedReports (standalone)
analyticsMetrics (standalone, time-series)
```

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Database** | SQLite (dev) / PostgreSQL (prod) | Zero setup locally, Neon serverless for production |
| **ORM** | Drizzle | Type-safe, lightweight, dual-driver support |
| **Streaming** | Server-Sent Events | Simpler than WebSocket for unidirectional streaming |
| **State management** | TanStack Query + hooks | No Redux needed — server state cached, local state in hooks |
| **UI framework** | shadcn/ui + Radix | Accessible primitives, full control over styling |
| **Validation** | Zod | Runtime validation matching TypeScript types |
| **AI model** | Claude Opus 4.6 | 1M token context for complex financial analysis |
| **Python execution** | Child process spawn | Isolated execution, no shared state, timeout support |
