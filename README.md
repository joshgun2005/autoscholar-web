<div align="center">

# VibeQuant

### AI-Powered Institutional-Grade Financial Intelligence Platform

<br/>

[![Live](https://img.shields.io/badge/Live-www.vquant.ai-00c853?style=for-the-badge&logo=googlechrome&logoColor=white)](https://www.vquant.ai)
[![License](https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge)](./LICENSE)
[![Version](https://img.shields.io/badge/Version-2.2.0-blue?style=for-the-badge)](./)

<br/>

**Stack**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-646cff?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Express](https://img.shields.io/badge/Express-4.21-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06b6d4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

**AI & Data**

[![Claude AI](https://img.shields.io/badge/Claude-Opus_4.6_(1M_ctx)-d97706?style=flat-square&logo=anthropic&logoColor=white)](https://anthropic.com/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776ab?style=flat-square&logo=python&logoColor=white)](https://python.org/)
[![NumPy](https://img.shields.io/badge/NumPy-013243?style=flat-square&logo=numpy&logoColor=white)](https://numpy.org/)
[![Pandas](https://img.shields.io/badge/Pandas-150458?style=flat-square&logo=pandas&logoColor=white)](https://pandas.pydata.org/)
[![SciPy](https://img.shields.io/badge/SciPy-8caae6?style=flat-square&logo=scipy&logoColor=white)](https://scipy.org/)
[![scikit--learn](https://img.shields.io/badge/scikit--learn-f7931e?style=flat-square&logo=scikitlearn&logoColor=white)](https://scikit-learn.org/)

**Database & ORM**

[![SQLite](https://img.shields.io/badge/SQLite-003b57?style=flat-square&logo=sqlite&logoColor=white)](https://sqlite.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169e1?style=flat-square&logo=postgresql&logoColor=white)](https://postgresql.org/)
[![Drizzle](https://img.shields.io/badge/Drizzle_ORM-c5f74f?style=flat-square&logo=drizzle&logoColor=black)](https://orm.drizzle.team/)
[![Zod](https://img.shields.io/badge/Zod-3e67b1?style=flat-square&logo=zod&logoColor=white)](https://zod.dev/)

**Quality & Testing**

[![ESLint](https://img.shields.io/badge/ESLint-4b32c3?style=flat-square&logo=eslint&logoColor=white)](https://eslint.org/)
[![Prettier](https://img.shields.io/badge/Prettier-f7b93e?style=flat-square&logo=prettier&logoColor=black)](https://prettier.io/)
[![Vitest](https://img.shields.io/badge/Vitest-6e9f18?style=flat-square&logo=vitest&logoColor=white)](https://vitest.dev/)
[![Testing Library](https://img.shields.io/badge/Testing_Library-e33332?style=flat-square&logo=testinglibrary&logoColor=white)](https://testing-library.com/)

**Metrics**

[![Lines of Code](https://img.shields.io/badge/Lines_of_Code-40,000+-0969da?style=flat-square)](./)
[![Source Files](https://img.shields.io/badge/Source_Files-155+-0969da?style=flat-square)](./)
[![API Endpoints](https://img.shields.io/badge/API_Endpoints-270+-8b5cf6?style=flat-square)](./)
[![Claude Tools](https://img.shields.io/badge/Claude_Tools-213-d97706?style=flat-square)](./)
[![Python Libs](https://img.shields.io/badge/Python_Libs-17-3776ab?style=flat-square)](./)
[![Tests](https://img.shields.io/badge/Tests-41_passing-22c55e?style=flat-square)](./)
[![Test Suites](https://img.shields.io/badge/Test_Suites-6-22c55e?style=flat-square)](./)
[![Components](https://img.shields.io/badge/React_Components-60-61dafb?style=flat-square)](./)
[![Hooks](https://img.shields.io/badge/Custom_Hooks-5-61dafb?style=flat-square)](./)
[![Route Modules](https://img.shields.io/badge/Route_Modules-6-000000?style=flat-square)](./)

---

[**Getting Started**](#-getting-started) &nbsp;&bull;&nbsp; [**Features**](#-features) &nbsp;&bull;&nbsp; [**Architecture**](#-architecture) &nbsp;&bull;&nbsp; [**API Reference**](#-api-reference) &nbsp;&bull;&nbsp; [**Contributing**](#-contributing)

</div>

---

## Overview

VibeQuant is a production-grade full-stack financial analysis platform that combines **Claude AI (Opus 4.6, 1M token context)** with **270+ financial data endpoints** (FMP + EODHD), **quantitative Python analysis** (Monte Carlo, GARCH, VaR, Black-Scholes, portfolio optimization), and **multi-source web research** (Tavily, Firecrawl, Exa, SerpAPI) to deliver institutional-grade insights through a real-time streaming conversational interface.

Built with a modern TypeScript stack (React 18 + Vite + Express + Drizzle ORM), validated with Zod schemas, tested with Vitest, and linted with ESLint + Prettier. Export results as **Corporate Reports, Presentation Slides, PDF, Word, HTML,** or shareable links — all generated on the fly by Claude AI.

---

## Features

### Financial Data Engine

[![FMP API](https://img.shields.io/badge/FMP_API-230_endpoints-8b5cf6?style=flat-square)](https://financialmodelingprep.com/)
[![EODHD API](https://img.shields.io/badge/EODHD_API-Intraday_%26_Options-16a34a?style=flat-square)](https://eodhd.com/)

| Category | Endpoints | Details |
|----------|-----------|---------|
| **Company Fundamentals** | 40+ | Profiles, income statements, balance sheets, cash flows, key metrics, financial ratios, growth rates |
| **Market Data** | 30+ | Real-time quotes, historical prices, intraday data, batch quotes, market hours, gainers/losers/actives |
| **Technical Analysis** | 15+ | RSI, MACD, EMA, SMA, ADX, Williams %R, CCI, Stochastic, WMA, DEMA, TEMA, Bollinger Bands |
| **Analyst & Ratings** | 20+ | Estimates, price targets, upgrades/downgrades, consensus, historical grades, ratings snapshots |
| **Insider & Institutional** | 15+ | Insider trading, institutional holders, 13F filings, Senate/House trading, beneficial ownership |
| **Economic & Macro** | 15+ | Economic calendar, Treasury rates, economic indicators, market risk premium, COT reports |
| **SEC & Compliance** | 25+ | SEC filings (8-K, 10-K, 10-Q), EDGAR search, company notes, earnings transcripts |
| **Alternative Data** | 20+ | ESG scores, social sentiment, Congressional trading, crowdfunding, equity offerings |
| **ETFs & Indices** | 15+ | ETF holdings, sector weightings, S&P 500/NASDAQ/Dow Jones constituents |
| **Valuation** | 10+ | DCF, levered DCF, custom DCF, enterprise values, owner earnings, financial scores |
| **Forex & Crypto** | 15+ | Forex pairs, crypto quotes, commodity prices, historical forex data |
| **Events** | 10+ | Earnings calendar, IPO calendar, dividend history, stock splits, mergers & acquisitions |
| **EODHD Intraday** | — | Sub-minute intraday OHLCV data with robust date-format normalization and ticker mapping |
| **EODHD Options Chain** | — | Full options chain with Black-Scholes Greeks (delta, gamma, theta, vega, rho) for any symbol |

### Quantitative Analysis Engine

[![Python](https://img.shields.io/badge/Python-17_scientific_libraries-3776ab?style=flat-square&logo=python&logoColor=white)](https://python.org/)

| Model | Description | Libraries |
|-------|-------------|-----------|
| **Monte Carlo Simulation** | Price path simulation with customizable parameters (10k+ paths, configurable horizon) | `numpy`, `scipy` |
| **Options Pricing** | Black-Scholes model with full Greeks (delta, gamma, theta, vega, rho) | `scipy.stats` |
| **GARCH Volatility** | Volatility modeling and forecasting with GARCH(1,1) | `arch`, `statsmodels` |
| **Value at Risk (VaR)** | Historical, parametric, and Monte Carlo VaR at multiple confidence levels | `numpy`, `scipy` |
| **Portfolio Optimization** | Mean-variance optimization (Modern Portfolio Theory), efficient frontier | `cvxpy`, `scipy.optimize` |
| **Risk Metrics** | Sharpe, Sortino, Calmar, max drawdown, beta, alpha, information ratio | `numpy`, `pandas` |
| **Custom Python** | Arbitrary Python code execution with access to 17 libraries and FMP data | All libraries |

<details>
<summary><b>Full Python library list (17 packages)</b></summary>

| Library | Version | Purpose |
|---------|---------|---------|
| `numpy` | latest | Numerical computing |
| `pandas` | latest | Data manipulation |
| `scipy` | latest | Scientific computing |
| `scikit-learn` | latest | Machine learning |
| `statsmodels` | latest | Statistical models |
| `matplotlib` | latest | Plotting & charts |
| `seaborn` | latest | Statistical visualization |
| `plotly` | latest | Interactive charts |
| `arch` | latest | GARCH models |
| `cvxpy` | latest | Convex optimization |
| `yfinance` | latest | Market data |
| `ta` | latest | Technical analysis |
| `quantstats` | latest | Portfolio analytics |
| `beautifulsoup4` | latest | Web scraping |
| `requests` | latest | HTTP client |
| `lxml` | latest | XML/HTML parsing |
| `Pillow` | latest | Image processing |

</details>

### Web Research Engine

| Source | Capabilities | Badge |
|--------|-------------|-------|
| **Tavily** | AI-powered search with generated answers, time filters, domain filtering | [![Tavily](https://img.shields.io/badge/Tavily-AI_Search-4f46e5?style=flat-square)](https://tavily.com/) |
| **Firecrawl** | Web scraping, PDF extraction (up to 750 pages), intelligent crawling, structured extraction, autonomous agents | [![Firecrawl](https://img.shields.io/badge/Firecrawl-Web_Extraction-f97316?style=flat-square)](https://firecrawl.dev/) |
| **Exa** | Semantic neural search, content retrieval, similar page discovery | [![Exa](https://img.shields.io/badge/Exa-Semantic_Search-6366f1?style=flat-square)](https://exa.ai/) |
| **SerpAPI** | Google Search, Images, Shopping, Finance, Trends, Scholar, Videos, Flights, Hotels | [![SerpAPI](https://img.shields.io/badge/SerpAPI-Google_Search-34a853?style=flat-square)](https://serpapi.com/) |

### AI Agent

[![Claude](https://img.shields.io/badge/Claude_Opus_4.6-1M_token_context-d97706?style=flat-square&logo=anthropic&logoColor=white)](https://anthropic.com/)

| Feature | Details |
|---------|---------|
| **Model** | Claude Opus 4.6 with 1 million token context window |
| **Tools** | 213 specialized financial tools |
| **Batching** | Intelligent tool batching (5 tools per batch with 500ms pauses) |
| **Streaming** | Real-time Server-Sent Events (SSE) with automatic retry on ECONNRESET |
| **History** | Persistent conversation sessions with token tracking |
| **Vision** | Image analysis support for charts, screenshots, and documents |
| **Figure Vision** | Claude Haiku automatically analyses generated Python figures and adds descriptive captions |
| **Cost Tracking** | Per-session input/output token counting and cost estimation |
| **Loading Overlay** | Animated VQuant overlay during AI generation with live status messages |

### Export & Reports

| Format | Description | Badge |
|--------|-------------|-------|
| **Corporate Report PDF** | Institutional-grade A4 report — Claude extracts executive summary + key metrics, renders in LaTeX-style typography (Crimson Pro serif), includes all figures, running headers/footers, conclusion section | [![Report](https://img.shields.io/badge/Corporate_Report-A4_PDF-119993?style=flat-square)](./) |
| **Presentation Slides PDF** | HTML/CSS slide deck (16:9) generated by Claude Opus 4.6, cover slide, stats cards, figure slides, TOC, rendered to PDF by Puppeteer | [![Slides](https://img.shields.io/badge/Slides-HTML%2FCSS_PDF-2072B2?style=flat-square)](./) |
| **PDF** | Markdown-to-PDF report with KaTeX math rendering, VQuant cover page, and base64-embedded figures | [![PDF](https://img.shields.io/badge/PDF-Puppeteer-ea4335?style=flat-square&logo=googlechrome&logoColor=white)](./) |
| **HTML** | Standalone HTML file with full styles, KaTeX, and embedded images (no server needed) | [![HTML](https://img.shields.io/badge/HTML-Standalone-f97316?style=flat-square)](./) |
| **DOCX** | Word document via Pandoc conversion | [![DOCX](https://img.shields.io/badge/DOCX-Pandoc-2b579a?style=flat-square&logo=microsoftword&logoColor=white)](./) |
| **Markdown** | Raw markdown download of the analysis | [![MD](https://img.shields.io/badge/Markdown-Raw-6b7280?style=flat-square)](./) |
| **Data Files** | CSV, XLSX, JSON, TXT downloads of analysis data | [![Data](https://img.shields.io/badge/Data-CSV_XLSX_JSON-217346?style=flat-square&logo=microsoftexcel&logoColor=white)](./) |
| **Share Links** | Shareable report URLs with unique IDs | [![Share](https://img.shields.io/badge/Share-Unique_Links-0ea5e9?style=flat-square)](./) |

### Community Showcase

| Feature | Details |
|---------|---------|
| **Public Gallery** | Browse all shared analyses from the community with search and tool filters |
| **Continue Analysis** | "Continuer cette analyse" button on every showcase card and shared report — loads the previous Q&A as conversation context and returns to the chat interface ready for a follow-up |
| **Tool Badges** | Click any tool badge to filter the showcase by that data source |

---

## Getting Started

### Prerequisites

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776ab?style=flat-square&logo=python&logoColor=white)](https://python.org/)
[![npm](https://img.shields.io/badge/npm-9+-cb3837?style=flat-square&logo=npm&logoColor=white)](https://npmjs.com/)

### Installation

```bash
# Clone the repository
git clone https://github.com/simonpierreboucher02/vquant.git
cd vquant

# Install Node.js dependencies
npm install

# Set up Python virtual environment
python3 -m venv .venv
source .venv/bin/activate        # macOS/Linux
# .venv\Scripts\activate          # Windows
pip install -r requirements-safe.txt

# Configure environment variables
cp .env.example .env
# Edit .env with your API keys

# Start development server
npm run dev
```

The app will be available at `http://localhost:5000`.

### API Keys

All services offer generous free tiers:

| Service | Sign Up | Free Tier | Required |
|---------|---------|-----------|----------|
| [![Anthropic](https://img.shields.io/badge/Anthropic-d97706?style=flat-square&logo=anthropic&logoColor=white)](https://console.anthropic.com) | [console.anthropic.com](https://console.anthropic.com) | $5 credit | **Yes** |
| [![FMP](https://img.shields.io/badge/FMP-0969da?style=flat-square)](https://financialmodelingprep.com) | [financialmodelingprep.com](https://financialmodelingprep.com) | 250 calls/day | **Yes** |
| [![Firecrawl](https://img.shields.io/badge/Firecrawl-f97316?style=flat-square)](https://firecrawl.dev) | [firecrawl.dev](https://firecrawl.dev) | 500 credits | Recommended |
| [![Tavily](https://img.shields.io/badge/Tavily-4f46e5?style=flat-square)](https://app.tavily.com) | [app.tavily.com](https://app.tavily.com) | 1000 calls/month | Recommended |
| [![Exa](https://img.shields.io/badge/Exa-6366f1?style=flat-square)](https://exa.ai) | [exa.ai](https://exa.ai) | 1000 searches/month | Optional |
| [![SerpAPI](https://img.shields.io/badge/SerpAPI-34a853?style=flat-square)](https://serpapi.com) | [serpapi.com](https://serpapi.com) | 100 searches/month | Optional |

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (Vite HMR + Express) |
| `npm run build` | Build for production (client + server) |
| `npm start` | Start production server |
| `npm run typecheck` | TypeScript type checking (`tsc --noEmit`) |
| `npm run lint` | ESLint check |
| `npm run lint:fix` | ESLint auto-fix |
| `npm run format` | Prettier format all files |
| `npm run format:check` | Prettier check (CI-friendly) |
| `npm test` | Run all tests (Vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run db:push` | Push database schema changes (Drizzle Kit) |

---

## Architecture

```
vquant/
├── client/src/                           # Frontend (React + TypeScript)
│   ├── App.tsx                           # Router + providers + ErrorBoundary
│   ├── main.tsx                          # Entry point
│   ├── config.ts                         # App config, endpoints, feature flags
│   ├── components/
│   │   ├── chat/                         # 13 chat-specific components
│   │   │   ├── search-bar.tsx            #   Query input with image support
│   │   │   ├── streaming-answer.tsx      #   Real-time markdown rendering
│   │   │   ├── agent-steps.tsx           #   Tool execution progress
│   │   │   ├── tool-results.tsx          #   Financial data display
│   │   │   ├── monte-carlo-results.tsx   #   Simulation visualizations
│   │   │   ├── share-button.tsx          #   Report sharing
│   │   │   ├── download-buttons.tsx      #   PDF/DOCX export
│   │   │   └── ...                       #   + 6 more components
│   │   ├── explore/                      # 7 stock explorer components
│   │   ├── financial/                    # Price charts, options pricing
│   │   ├── ui/                           # 35 shadcn/ui primitives
│   │   └── error-boundary.tsx            # Global error handler
│   ├── hooks/
│   │   ├── useChatSession.ts             # All chat state & business logic
│   │   ├── useChatMutation.ts            # SSE streaming client
│   │   ├── useAnalytics.ts              # Heartbeat tracking
│   │   ├── use-toast.ts                 # Toast notifications
│   │   └── use-mobile.tsx               # Responsive detection
│   ├── pages/                            # 11 route pages
│   │   ├── home.tsx                      #   Main chat interface
│   │   ├── explore.tsx                   #   Stock explorer
│   │   ├── admin.tsx                     #   Admin dashboard
│   │   ├── auth.tsx                      #   Login/register
│   │   ├── showcase.tsx                  #   Community reports gallery (+ "Continue" button)
│   │   ├── shared-report.tsx             #   Shared report viewer (+ "Continue" button)
│   │   ├── slides-generator.tsx          #   HTML/CSS presentation slides generator
│   │   ├── corporate-report-generator.tsx #  Institutional A4 PDF report generator
│   │   ├── documentation.tsx             #   API documentation
│   │   └── ...                           #   + privacy, terms, 404
│   ├── lib/
│   │   ├── queryClient.ts               # TanStack Query config
│   │   └── utils.ts                     # cn() + helpers
│   └── utils/
│       ├── chartCapture.ts              # Chart-to-image conversion
│       └── pdfGenerator.ts              # Client-side PDF generation
│
├── server/                               # Backend (Express + TypeScript)
│   ├── index.ts                          # Server bootstrap, CORS, sessions
│   ├── routes.ts                         # /api/chat (SSE streaming) + speech-to-text
│   ├── routes/
│   │   ├── auth.ts                       # /api/auth/* (register, login, logout, me)
│   │   ├── admin.ts                      # /api/admin/* (database, CRUD) + requireAdmin
│   │   ├── analytics.ts                  # /api/analytics/* (heartbeat, active users, metrics)
│   │   ├── fmp.ts                        # /api/fmp/* (23 financial data endpoints)
│   │   ├── reports.ts                    # /api/share/*, sessions, PDF/DOCX/slides, download
│   │   └── validation.ts                # Zod request schemas
│   ├── services/
│   │   ├── claude/
│   │   │   ├── toolDefinitions.ts        #   213 tool definitions (4,480 lines)
│   │   │   └── tokenManagement.ts        #   Context window management
│   │   ├── claudeService.ts              #   Claude API integration + Haiku figure vision
│   │   ├── fmpService.ts                 #   230 FMP API wrapper functions
│   │   ├── eodhd/
│   │   │   └── intradayClient.ts         #   EODHD intraday + options chain with Greeks
│   │   ├── python/
│   │   │   ├── monteCarlo.ts             #   Monte Carlo simulation
│   │   │   ├── optionsPricing.ts         #   Black-Scholes pricing
│   │   │   ├── garch.ts                  #   GARCH volatility model
│   │   │   ├── var.ts                    #   VaR + portfolio + risk metrics
│   │   │   └── shared.ts                #   Python executor config
│   │   ├── *.py                          #   11 Python scientific services
│   │   ├── beamerSlidesService.ts        #   HTML/CSS 16:9 slides → Puppeteer PDF
│   │   ├── corporateReportService.ts     #   LaTeX-style A4 corporate report → Puppeteer PDF
│   │   ├── pdfService.ts                 #   Markdown → PDF/HTML/DOCX
│   │   ├── firecrawlService.ts           #   Web extraction
│   │   ├── tavilyService.ts              #   AI search
│   │   ├── exaService.ts                 #   Semantic search
│   │   └── serpapiService.ts             #   Google search
│   ├── db.ts                             # Drizzle ORM (SQLite + PostgreSQL)
│   ├── storage.ts                        # Typed data access layer
│   ├── types/
│   │   └── modules.d.ts                 # Module declarations
│   └── utils/
│       └── logger.ts                    # Structured logging
│
├── shared/                               # Shared between client & server
│   ├── schema.ts                         # PostgreSQL schema (Drizzle)
│   ├── schema-sqlite.ts                  # SQLite schema (Drizzle)
│   └── types.ts                         # API interfaces (SearchResult, etc.)
│
├── vitest.config.ts                      # Test configuration
├── eslint.config.js                      # ESLint flat config
├── vite.config.ts                        # Vite build config
├── tsconfig.json                         # TypeScript config
├── tailwind.config.ts                    # Tailwind CSS config
├── .prettierrc                           # Prettier config
├── .editorconfig                         # Editor config
├── .env.example                          # Environment template
└── .gitignore                            # Git ignore rules
```

### System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        CLIENT (React 18)                         │
│  ┌──────────┐  ┌──────────────┐  ┌────────────┐  ┌───────────┐ │
│  │ Chat UI  │  │ Explore Page │  │ Admin Panel│  │ Auth/Docs │ │
│  │ (SSE)    │  │ (FMP data)   │  │ (Analytics)│  │ (Sessions)│ │
│  └────┬─────┘  └──────┬───────┘  └─────┬──────┘  └─────┬─────┘ │
│       │               │                │               │        │
│  ┌────┴───────────────┴────────────────┴───────────────┴─────┐  │
│  │              TanStack Query + useChatSession              │  │
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
│  │(Drizzle)│ │Metrics │ │Schemas │ │   │  213 tools         │  │
│  └───┬───┘ └────────┘ └────────┘ │   │  5-tool batching    │  │
│      │                           │   └──────────┬──────────┘  │
│  ┌───┴──────┐              ┌─────┴──────┐ ┌─────┴──────────┐  │
│  │SQLite/PG │              │ FMP Service│ │ Python Engine  │  │
│  │(Drizzle) │              │ 230 funcs  │ │ 17 libraries   │  │
│  └──────────┘              └────────────┘ └────────────────┘  │
│                                                                 │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │              External APIs                                 │  │
│  │  Tavily │ Firecrawl │ Exa │ SerpAPI │ ElevenLabs          │  │
│  └────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## API Reference

### Chat (SSE Streaming)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/chat` | Main AI chat with streaming (Server-Sent Events) |
| `POST` | `/api/speech-to-text` | Audio transcription (ElevenLabs Scribe) |

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Create account (generates unique token) |
| `POST` | `/api/auth/login` | Authenticate with token |
| `POST` | `/api/auth/logout` | End session |
| `GET` | `/api/auth/me` | Get current user |

### Shared Reports & Sessions

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/shared-reports` | List all shared reports |
| `POST` | `/api/share` | Create shareable report |
| `GET` | `/api/share/:shareId` | Get shared report |
| `GET` | `/api/sessions` | List user sessions |
| `GET` | `/api/sessions/:id` | Get session with messages |

### Document Generation

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/generate-corporate-report` | Institutional A4 PDF — Claude extracts metadata, LaTeX-style HTML/CSS, figures embedded, Puppeteer render |
| `POST` | `/api/convert-to-slides` | 16:9 HTML/CSS slide deck PDF — Claude structures content into slides, Puppeteer render |
| `POST` | `/api/generate-pdf` | Markdown to A4 PDF with KaTeX + cover page (Puppeteer) |
| `POST` | `/api/generate-html` | Markdown to standalone HTML with embedded styles and images |
| `POST` | `/api/generate-docx` | Markdown to DOCX (Pandoc) |
| `GET` | `/api/download/:filename` | Download data file (CSV, XLSX, PDF, etc.) |

### Financial Data (FMP)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/fmp/quote/:symbol` | Real-time stock quote |
| `GET` | `/api/fmp/company-profile/:symbol` | Company profile |
| `GET` | `/api/fmp/historical-price/:symbol` | Historical prices |
| `GET` | `/api/fmp/intraday/:symbol` | Intraday price data |
| `GET` | `/api/fmp/income-statement/:symbol` | Income statement |
| `GET` | `/api/fmp/balance-sheet/:symbol` | Balance sheet |
| `GET` | `/api/fmp/cash-flow/:symbol` | Cash flow statement |
| `GET` | `/api/fmp/key-metrics/:symbol` | Key financial metrics |
| `GET` | `/api/fmp/financial-ratios/:symbol` | Financial ratios |
| `GET` | `/api/fmp/analyst-estimates/:symbol` | Analyst estimates |
| `GET` | `/api/fmp/price-target/:symbol` | Price targets |
| `GET` | `/api/fmp/insider-trading/:symbol` | Insider trades |
| `GET` | `/api/fmp/institutional-holders/:symbol` | Institutional holders |
| `GET` | `/api/fmp/earnings-surprises/:symbol` | Earnings surprises |
| `GET` | `/api/fmp/dividend-history/:symbol` | Dividend history |
| `GET` | `/api/fmp/esg-score/:symbol` | ESG score |
| `GET` | `/api/fmp/financial-news/:symbol` | Financial news |
| `GET` | `/api/fmp/upgrades-downgrades/:symbol` | Analyst upgrades/downgrades |
| `GET` | `/api/fmp/gainers` | Top market gainers |
| `GET` | `/api/fmp/losers` | Top market losers |
| `GET` | `/api/fmp/actives` | Most active stocks |
| `GET` | `/api/fmp/market-hours` | Market hours |
| `GET` | `/api/fmp/chart/light/:symbol` | Lightweight chart data |

### Analytics & Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/analytics/heartbeat` | Update user activity |
| `GET` | `/api/analytics/active-users` | Active users (admin) |
| `GET` | `/api/analytics/real-time-stats` | Real-time stats |
| `GET` | `/api/analytics/metrics` | Historical metrics (admin) |
| `POST` | `/api/admin/login` | Admin login |
| `GET` | `/api/admin/database` | Full database view (admin) |
| `DELETE` | `/api/admin/users/:id` | Delete user (admin) |
| `DELETE` | `/api/admin/sessions/:id` | Delete session (admin) |
| `DELETE` | `/api/admin/reports/:id` | Delete report (admin) |

---

## Usage Examples

### Financial Analysis
```
"Full analysis of NVDA: profile, financials, insider trades, analyst ratings, sector performance"

"Compare AAPL, MSFT, GOOGL on: market cap, P/E, revenue growth, ESG scores, analyst consensus"

"Due diligence on TSLA: DCF valuation, institutional holders, insider trading patterns, earnings surprises"

"Show me the top gainers today with their financial ratios and analyst ratings"
```

### Quantitative Analysis
```
"Run a Monte Carlo simulation on AAPL with 10,000 paths over 252 trading days"

"Calculate the correlation matrix of FAANG stocks and display a heatmap"

"Backtest an RSI strategy on SPY and show the equity curve with Sharpe ratio"

"Optimize a portfolio of AAPL, MSFT, GOOGL, AMZN for maximum Sharpe ratio"

"Calculate Value at Risk for a $100,000 NVDA position at 95% and 99% confidence"

"Estimate GARCH volatility for TSLA and forecast 30-day ahead volatility"

"Price a call option on AAPL with strike $200, 30 days to expiry, and show all Greeks"
```

### Web Research
```
"Search latest AI industry news this week and summarize key developments"

"Extract the last NVIDIA earnings call transcript and highlight guidance changes"

"Research the impact of Fed rate decisions on tech stocks in 2024-2025"

"Crawl investor.nvidia.com and extract all Q4 financial press releases"
```

---

## Documentation

Exhaustive documentation is available in the [`docs/`](./docs) directory:

| Document | Description |
|----------|-------------|
| **[Getting Started](./docs/GETTING_STARTED.md)** | Prerequisites, installation, Python setup, env vars, first run, troubleshooting |
| **[Architecture](./docs/ARCHITECTURE.md)** | System diagram, directory structure, data flow, design decisions |
| **[API Reference](./docs/API_REFERENCE.md)** | All 44 endpoints with request/response schemas, SSE event types, query params |
| **[Python Analysis](./docs/PYTHON_ANALYSIS.md)** | 8 built-in models (Monte Carlo, Black-Scholes, GARCH, VaR, portfolio, risk, plots, custom), all 17 libraries |
| **[Database Schema](./docs/DATABASE.md)** | All 9 tables with columns, types, constraints, relationships |
| **[Deployment](./docs/DEPLOYMENT.md)** | Production build, env vars, Docker example, CORS, security checklist |
| **[Contributing](./docs/CONTRIBUTING.md)** | Dev setup, code conventions, commit format, how to add endpoints/tools |
| **[`.env.example`](./.env.example)** | All environment variables with categories |

---

## Testing

[![Tests](https://img.shields.io/badge/Tests-41_passing-22c55e?style=flat-square&logo=vitest&logoColor=white)](./)
[![Vitest](https://img.shields.io/badge/Framework-Vitest_4-6e9f18?style=flat-square)](./)
[![Duration](https://img.shields.io/badge/Duration-<1s-22c55e?style=flat-square)](./)

| Suite | Tests | What it covers |
|-------|-------|---------------|
| `App.test.tsx` | 3 | Smoke test: renders, shows home page, search bar present |
| `config.test.ts` | 5 | App config: name, domain, endpoints, limits, feature flags |
| `utils.test.ts` | 5 | `cn()`: class merging, conditionals, dedup, edge cases |
| `queryClient.test.ts` | 6 | Query defaults: staleTime, gcTime, retry, refetch policy |
| `useChatSession.test.tsx` | 6 | Hook: initial state, reset, history toggle, mutation shape, handlers |
| `validation.test.ts` | 16 | All Zod schemas: valid/invalid inputs, missing fields, max lengths |

```bash
npm test              # Run once
npm run test:watch    # Watch mode
npm run test:coverage # With coverage
```

---

## Deployment

### Production Build

```bash
npm run build         # Builds client (Vite) + server (esbuild)
npm start             # Starts production server
```

### Environment Variables

```bash
# Required
NODE_ENV=production
PORT=5000
SESSION_SECRET=<generate-a-strong-random-secret>
ANTHROPIC_API_KEY=sk-ant-...
FINANCIAL_MODELING_PREP_API_KEY=...

# Database (default: SQLite)
DATABASE_URL=sqlite://local.db
# DATABASE_URL=postgresql://user:pass@host:5432/db

# Optional APIs
FIRECRAWL_API_KEY=fc-...
TAVILY_API_KEY=tvly-...
EXA_API_KEY=...
SERPAPI_API_KEY=...
```

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Run checks before committing:
   ```bash
   npm run typecheck && npm run lint && npm test
   ```
4. Commit with a descriptive message
5. Open a Pull Request

### Code Conventions

| Rule | Enforced By |
|------|------------|
| TypeScript `strict` mode | `tsconfig.json` |
| ESLint (typescript-eslint + react-hooks) | `eslint.config.js` |
| Prettier formatting | `.prettierrc` |
| Zod validation on all API inputs | `server/routes/validation.ts` |
| `logger` instead of `console.log` | ESLint `no-console` rule |
| `@/` path alias (client), `@shared/` (shared) | `tsconfig.json` + `vite.config.ts` |
| Components grouped by domain | `components/chat/`, `components/explore/`, etc. |
| One hook per concern | `useChatSession`, `useChatMutation`, etc. |

---

## Authors

<table>
  <tr>
    <td align="center" width="50%">
      <b>Simon-Pierre Boucher</b><br/>
      <i>Creator & Lead Developer</i><br/><br/>
      <a href="mailto:spbou4@protonmail.com"><img src="https://img.shields.io/badge/Email-spbou4%40protonmail.com-8b5cf6?style=flat-square&logo=protonmail&logoColor=white"/></a><br/>
      <a href="https://www.spboucher.ai"><img src="https://img.shields.io/badge/Website-spboucher.ai-3b82f6?style=flat-square&logo=safari&logoColor=white"/></a><br/>
      <a href="https://github.com/simonpierreboucher"><img src="https://img.shields.io/badge/GitHub-simonpierreboucher-181717?style=flat-square&logo=github&logoColor=white"/></a>
    </td>
    <td align="center" width="50%">
      <b>Claude Opus 4.6</b><br/>
      <i>AI Pair Programmer</i><br/><br/>
      <a href="https://claude.ai/claude-code"><img src="https://img.shields.io/badge/Claude_Code-Anthropic-d97706?style=flat-square&logo=anthropic&logoColor=white"/></a><br/>
      <a href="https://anthropic.com"><img src="https://img.shields.io/badge/Model-Opus_4.6_(1M_ctx)-d97706?style=flat-square"/></a><br/>
      <img src="https://img.shields.io/badge/Contribution-9_commits,_4000+_lines-22c55e?style=flat-square"/>
    </td>
  </tr>
</table>

> Full codebase audit, architecture restructuring, TypeScript typing, route modularization, hook extraction, ESLint/Prettier/Vitest setup, ErrorBoundary, Zod validation, and README authored via [Claude Code](https://claude.ai/claude-code).

---

## Acknowledgments

[![Anthropic](https://img.shields.io/badge/Anthropic-Claude_AI-d97706?style=flat-square&logo=anthropic&logoColor=white)](https://anthropic.com/)
[![FMP](https://img.shields.io/badge/Financial_Modeling_Prep-Financial_Data-0969da?style=flat-square)](https://financialmodelingprep.com/)
[![Firecrawl](https://img.shields.io/badge/Firecrawl-Web_Extraction-f97316?style=flat-square)](https://firecrawl.dev/)
[![Tavily](https://img.shields.io/badge/Tavily-AI_Search-4f46e5?style=flat-square)](https://tavily.com/)
[![Exa](https://img.shields.io/badge/Exa-Semantic_Search-6366f1?style=flat-square)](https://exa.ai/)
[![Radix UI](https://img.shields.io/badge/Radix_UI-Components-161618?style=flat-square)](https://radix-ui.com/)
[![shadcn/ui](https://img.shields.io/badge/shadcn/ui-Design_System-000000?style=flat-square)](https://ui.shadcn.com/)
[![Recharts](https://img.shields.io/badge/Recharts-Charts-22b5bf?style=flat-square)](https://recharts.org/)

---

## License

[![MIT License](https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge)](./LICENSE)

---

<div align="center">

<br/>

[![Website](https://img.shields.io/badge/www.vquant.ai-Visit_Live_Platform-00c853?style=for-the-badge&logo=googlechrome&logoColor=white)](https://www.vquant.ai)

<br/>

*Where AI Meets Institutional-Grade Financial Analysis*

<br/>

**Built with** &nbsp;
[![TypeScript](https://img.shields.io/badge/-TypeScript-3178c6?style=flat-square&logo=typescript&logoColor=white)](./)
[![React](https://img.shields.io/badge/-React-61dafb?style=flat-square&logo=react&logoColor=black)](./)
[![Claude](https://img.shields.io/badge/-Claude_AI-d97706?style=flat-square&logo=anthropic&logoColor=white)](./)
[![Python](https://img.shields.io/badge/-Python-3776ab?style=flat-square&logo=python&logoColor=white)](./)
[![Vite](https://img.shields.io/badge/-Vite-646cff?style=flat-square&logo=vite&logoColor=white)](./)
[![Tailwind](https://img.shields.io/badge/-Tailwind-06b6d4?style=flat-square&logo=tailwindcss&logoColor=white)](./)

</div>
