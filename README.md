<div align="center">

<br/>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/AutoScholar-AI_Research_Agent-ffffff?style=for-the-badge&labelColor=0d1117&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMiI+PHBhdGggZD0iTTIgM2g2YTQgNCAwIDAgMSA0IDR2MTRhMyAzIDAgMCAwLTMtM0gyeiIvPjxwYXRoIGQ9Ik0yMiAzaC02YTQgNCAwIDAgMC00IDR2MTRhMyAzIDAgMCAxIDMtM2g3eiIvPjwvc3ZnPg==">
  <img alt="AutoScholar" src="https://img.shields.io/badge/AutoScholar-AI_Research_Agent-000000?style=for-the-badge&labelColor=f8f9fa&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMwMDAiIHN0cm9rZS13aWR0aD0iMiI+PHBhdGggZD0iTTIgM2g2YTQgNCAwIDAgMSA0IDR2MTRhMyAzIDAgMCAwLTMtM0gyeiIvPjxwYXRoIGQ9Ik0yMiAzaC02YTQgNCAwIDAgMC00IDR2MTRhMyAzIDAgMCAxIDMtM2g3eiIvPjwvc3ZnPg==">
</picture>

# AutoScholar

### Open-Source AI Research Agent That Writes Publication-Quality Papers

**From question to 60-page PDF with figures, BibTeX, and peer review -- fully autonomous.**

<br/>

[![License: MIT](https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge)](./LICENSE)
[![Version](https://img.shields.io/badge/v2.2.0-stable-blue?style=for-the-badge)](./)
[![PRs Welcome](https://img.shields.io/badge/PRs-Welcome-ff69b4?style=for-the-badge)](./)

<br/>

<sub>

**Core** &nbsp;
[![TypeScript](https://img.shields.io/badge/TypeScript_5.6-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React_18-61dafb?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express_4-000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com/)
[![Vite](https://img.shields.io/badge/Vite_5-646cff?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
&nbsp;&nbsp;**AI** &nbsp;
[![Claude](https://img.shields.io/badge/Claude_Opus_4.6-d97706?style=flat-square&logo=anthropic&logoColor=white)](https://anthropic.com/)
[![Python](https://img.shields.io/badge/Python_3.11+-3776ab?style=flat-square&logo=python&logoColor=white)](https://python.org/)
&nbsp;&nbsp;**Data** &nbsp;
[![SQLite](https://img.shields.io/badge/SQLite-003b57?style=flat-square&logo=sqlite&logoColor=white)](https://sqlite.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169e1?style=flat-square&logo=postgresql&logoColor=white)](https://postgresql.org/)
[![Drizzle](https://img.shields.io/badge/Drizzle-c5f74f?style=flat-square&logo=drizzle&logoColor=black)](https://orm.drizzle.team/)

</sub>

<br/>

---

[**Why AutoScholar**](#-why-autoscolar) · [**How It Works**](#-how-it-works) · [**Quick Start**](#-quick-start) · [**Features**](#-features) · [**Architecture**](#-architecture) · [**API**](#-api-reference) · [**Contributing**](#-contributing)

---

</div>

<br/>

## Why AutoScholar

Most AI tools help you *write*. AutoScholar helps you **do research**.

It doesn't just generate text -- it runs a full scientific pipeline: identifies a literature gap, collects real data from 270+ financial endpoints, cleans and prepares datasets, runs econometric and ML models, generates publication-quality figures, writes LaTeX sections with proper citations, compiles to PDF, and then peer-reviews its own work.

All of this happens through a conversational interface with real-time streaming, so you can watch the entire process unfold step by step.

```
You: "Analyze the impact of Federal Reserve rate decisions on FAANG stock volatility using GARCH modeling"

AutoScholar:
  Gauss  → Finds literature gap, builds bibliography of 40+ papers
  Turing → Pulls 5 years of daily prices + Fed rate data from FRED & FMP
  Newton → Merges datasets, computes returns, constructs event windows
  Fisher → Fits GARCH(1,1), runs DiD regression, generates 8 figures
  Euler  → Writes 12 LaTeX sections, compiles 62-page PDF with BibTeX
  Popper → Peer reviews: methodology score 84/100, "minor revision"
```

<br/>

## How It Works

AutoScholar uses a **multi-agent pipeline** orchestrated by Claude Opus 4.6 (1M token context). Five named agents collaborate in sequence, each with a specialized role:

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│   EULER (Orchestrator)                                              │
│   Coordinates the full pipeline, writes LaTeX, compiles PDF         │
│                                                                     │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│   │  GAUSS   │→ │  TURING  │→ │  NEWTON  │→ │  FISHER  │          │
│   │ Lit. Gap │  │   Data   │  │  Dataset │  │ Analysis │          │
│   │ Analysis │  │ Collect  │  │   Prep   │  │ & Figs   │          │
│   └──────────┘  └──────────┘  └──────────┘  └──────────┘          │
│                                                                     │
│   ┌──────────┐                                                      │
│   │  POPPER  │  Peer review against top-tier journal standards      │
│   └──────────┘                                                      │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

| Agent | Role | What It Does |
|-------|------|-------------|
| **Gauss** | Literature Gap Analysis | Searches OpenAlex, arXiv, CrossRef, Google Scholar. Identifies 6-8 gaps with novelty/feasibility scores. Selects the most promising direction. |
| **Turing** | Data Collection | Fetches raw datasets from FMP (230+ endpoints), EODHD, FRED, World Bank, IMF, OECD, Polymarket. Scrapes web via Firecrawl/Tavily/Exa. Saves with provenance metadata. |
| **Newton** | Dataset Preparation | Cleans, merges, normalizes. Constructs variables, handles missing values, computes lags and interaction terms. Stores with lineage tracking. |
| **Fisher** | Empirical Analysis | Runs OLS, IV, DiD, RDD, panel FE/RE, GMM, GARCH. Trains RandomForest, XGBoost, LightGBM, ElasticNet. Generates publication-quality matplotlib figures. |
| **Euler** | Orchestrator & Writer | Coordinates the pipeline, writes each LaTeX section (intro, lit review, methodology, data, results, discussion, conclusion), compiles to PDF with BibTeX. |
| **Popper** | Peer Reviewer | Reviews against Journal of Finance / Econometrica standards. Scores on originality, methodology, results, writing, reproducibility. Verdict: accept / minor / major revision / reject. |

### The Governor

A runtime governance layer monitors the entire pipeline:
- Detects Python errors and injects recovery directives
- Tracks confidence (0.0-1.0) -- degrades on failures, recovers on successes
- Enforces figure counts and section word targets
- Switches to conservative mode when data is sparse
- Falls back gracefully when LaTeX compilation fails

<br/>

## Quick Start

### Prerequisites

- **Node.js 18+** with npm 9+
- **Python 3.11+** (for quantitative analysis)
- **Git**

### 1. Clone & Install

```bash
git clone https://github.com/simonpierreboucher02/autoscholar.git
cd autoscholar

# Node dependencies
npm install

# Python environment
python3 -m venv .venv
source .venv/bin/activate          # macOS/Linux
# .venv\Scripts\activate           # Windows
pip install -r requirements-safe.txt
```

### 2. Configure API Keys

```bash
cp .env.example .env
```

Edit `.env` with your keys:

| Key | Service | Free Tier | Required |
|-----|---------|-----------|----------|
| `ANTHROPIC_API_KEY` | [Anthropic](https://console.anthropic.com) | $5 credit | **Yes** |
| `FMP_API_KEY` | [Financial Modeling Prep](https://financialmodelingprep.com) | 250 calls/day | **Yes** |
| `FRED_API_KEY` | [FRED](https://fred.stlouisfed.org/docs/api/api_key.html) | Unlimited | **Yes** |
| `FIRECRAWL_API_KEY` | [Firecrawl](https://firecrawl.dev) | 500 credits | Recommended |
| `TAVILY_API_KEY` | [Tavily](https://app.tavily.com) | 1,000 calls/mo | Recommended |
| `EXA_API_KEY` | [Exa](https://exa.ai) | 1,000 searches/mo | Optional |
| `SERPAPI_API_KEY` | [SerpAPI](https://serpapi.com) | 100 searches/mo | Optional |
| `EODHD_API_KEY` | [EODHD](https://eodhd.com) | Limited | Optional |
| `OPENAI_API_KEY` | [OpenAI](https://platform.openai.com) | Pay-as-you-go | Optional (embeddings) |
| `ELEVENLABS_API_KEY` | [ElevenLabs](https://elevenlabs.io) | Free tier | Optional (speech) |

### 3. Run

```bash
npm run dev
```

Open **http://localhost:5000** -- you're ready to go.

<br/>

## Features

### 213 AI Tools Across 8 Categories

AutoScholar equips Claude with **213 specialized tools** that it can call autonomously during research:

<details>
<summary><b>Financial Data Engine -- 270+ endpoints</b></summary>

| Category | Endpoints | Covers |
|----------|-----------|--------|
| Company Fundamentals | 40+ | Profiles, income statements, balance sheets, cash flows, key metrics, ratios, growth |
| Market Data | 30+ | Real-time quotes, historical prices, intraday, batch quotes, gainers/losers/actives |
| Technical Analysis | 15+ | RSI, MACD, EMA, SMA, ADX, Williams %R, CCI, Stochastic, Bollinger Bands |
| Analyst & Ratings | 20+ | Estimates, price targets, upgrades/downgrades, consensus, historical grades |
| Insider & Institutional | 15+ | Insider trading, 13F filings, Senate/House trading, beneficial ownership |
| Economic & Macro | 15+ | Economic calendar, Treasury rates, indicators, market risk premium, COT |
| SEC & Compliance | 25+ | 8-K, 10-K, 10-Q filings, EDGAR search, earnings transcripts |
| Alternative Data | 20+ | ESG scores, social sentiment, Congressional trading, crowdfunding |
| ETFs & Indices | 15+ | Holdings, sector weightings, S&P 500/NASDAQ/Dow constituents |
| Valuation | 10+ | DCF, levered DCF, enterprise values, financial scores |
| Forex & Crypto | 15+ | Forex pairs, crypto quotes, commodities, historical data |
| Events | 10+ | Earnings calendar, IPO calendar, dividends, stock splits, M&A |
| EODHD Intraday | -- | Sub-minute OHLCV with date normalization and ticker mapping |
| EODHD Options | -- | Full options chain with Black-Scholes Greeks (delta, gamma, theta, vega, rho) |

**Data providers:** FMP (230+ endpoints), EODHD (intraday + options), FRED (840,000+ series), World Bank, IMF, OECD, Polymarket

</details>

<details>
<summary><b>Quantitative Analysis Engine -- 17 Python libraries</b></summary>

| Model | Description | Libraries |
|-------|-------------|-----------|
| Monte Carlo | Price path simulation (10k+ paths, configurable horizon) | `numpy`, `scipy` |
| Options Pricing | Black-Scholes with full Greeks (delta, gamma, theta, vega, rho) | `scipy.stats` |
| GARCH Volatility | Volatility modeling and forecasting with GARCH(1,1) | `arch`, `statsmodels` |
| Value at Risk | Historical, parametric, and Monte Carlo VaR at multiple confidence levels | `numpy`, `scipy` |
| Portfolio Optimization | Mean-variance (Modern Portfolio Theory), efficient frontier | `cvxpy`, `scipy.optimize` |
| Risk Metrics | Sharpe, Sortino, Calmar, max drawdown, beta, alpha, information ratio | `numpy`, `pandas` |
| Custom Python | Arbitrary code with all 17 libraries + API access | Everything |

**Libraries:** numpy, pandas, scipy, scikit-learn, statsmodels, matplotlib, seaborn, plotly, arch, cvxpy, yfinance, ta, quantstats, beautifulsoup4, requests, lxml, Pillow

**Pre-loaded datasets:** SDC Platinum IPO Database (452K IPOs, 1963-2024) and US Housing Database (839K properties, 50 states)

</details>

<details>
<summary><b>Academic Research Tools</b></summary>

| Source | Coverage |
|--------|----------|
| **OpenAlex** | 250M+ academic works (primary source) |
| **arXiv** | Preprints in q-fin, econ, stat.ML, cs.LG |
| **CrossRef** | 140M+ articles with DOI validation + BibTeX |
| **Google Scholar** | Via SerpAPI integration |
| **Multi-source search** | All sources simultaneously with deduplication |

Tools: `academic_search`, `academic_literature_review`, `arxiv_search`, `crossref_lookup`, `openalex_search`, `academic_search_multi`

</details>

<details>
<summary><b>Web Research Engine</b></summary>

| Service | Capabilities |
|---------|-------------|
| **Tavily** | AI-powered search, content extraction, research mode, crawling, sitemapping |
| **Firecrawl** | Web scraping, PDF extraction (750+ pages), structured extraction, agent mode, batch (100+ URLs) |
| **Exa** | Semantic neural search, content retrieval, similar page discovery |
| **SerpAPI** | Google Search, Images, Scholar, Finance, Trends, Videos |

</details>

<details>
<summary><b>Macro Data Tools</b></summary>

| Provider | Tools |
|----------|-------|
| **World Bank** | Indicators, countries, topics, regions, income levels, sources (6 tools) |
| **IMF** | Indicators, dataflows, data structures, code lists (4 tools) |
| **OECD** | Dataflows, structures, country/regional data (3 tools) |
| **FRED** | 840,000+ macroeconomic time series |
| **Polymarket** | Event markets, price history, trades, order books, leaderboards |

</details>

### Document Generation

AutoScholar generates multiple export formats on the fly:

| Format | Details |
|--------|---------|
| **Research Paper PDF** | Full LaTeX compilation with BibTeX, figures, tables -- up to 60-90 pages |
| **Corporate Report** | Institutional A4 format, Crimson Pro serif, executive summary, figures, headers/footers |
| **Presentation Slides** | 16:9 HTML/CSS deck with cover, stats cards, TOC -- rendered to PDF via Puppeteer |
| **PDF** | Markdown-to-PDF with KaTeX math, cover page, embedded figures |
| **HTML** | Standalone file with styles and base64 images (no server needed) |
| **DOCX** | Word document via Pandoc |
| **Data Files** | CSV, XLSX (with formulas), JSON, TXT |
| **Share Links** | Public URLs with unique IDs + view tracking |

### Real-Time Streaming Interface

- **Server-Sent Events** -- watch the AI think, tool by tool
- **Agent timeline** -- color-coded progress for each agent (Euler/Gauss/Turing/Newton/Fisher)
- **Live figures** -- Python-generated charts appear as they're created
- **Session persistence** -- resume any conversation, restore full context
- **Image & file input** -- attach screenshots, CSVs, Excel files, PDFs
- **Voice input** -- speech-to-text via ElevenLabs

### Research Paper Journal

- Browse all generated papers with domain filtering
- **ASID system** (AutoScholar ID: `ASID-2026-0001`) for paper identification
- Peer review scores and publication verdicts
- **"Continue Analysis"** -- load any paper's Q&A context and keep researching
- Citation export (APA, BibTeX)
- Public showcase gallery with tool badges

### Memory & Learning

The global memory engine learns from every run:
- Tracks all papers, methods, and datasets used
- Identifies failure patterns and suggests alternatives
- Deduplicates to prevent redundant research
- Recommends novel method/dataset combinations not yet explored
- Maintains corpus statistics for guiding future research directions

<br/>

## Architecture

```
autoscholar/
├── client/src/                            # React 18 + TypeScript frontend
│   ├── App.tsx                            # Router (wouter) + providers
│   ├── pages/                             # 15+ route pages
│   │   ├── home.tsx                       #   Main chat interface
│   │   ├── landing/                       #   Landing page
│   │   ├── journal/                       #   Research paper journal
│   │   ├── showcase.tsx                   #   Community gallery
│   │   ├── live-paper/                    #   Real-time paper viewer
│   │   └── admin/                         #   Admin dashboard
│   ├── components/
│   │   ├── chat/                          # 13 chat UI components
│   │   │   ├── search-bar.tsx             #   Query input + image/file/voice
│   │   │   ├── agent-steps.tsx            #   Pipeline visualization
│   │   │   ├── custom-python-figure.tsx   #   Figure gallery
│   │   │   ├── download-buttons.tsx       #   Export (PDF/DOCX/HTML/MD)
│   │   │   └── ...
│   │   ├── journal/                       # Paper browsing components
│   │   ├── live-paper/                    # Real-time collaboration
│   │   └── ui/                            # 35+ shadcn/ui primitives
│   ├── hooks/
│   │   ├── useChatMutation.ts             # SSE streaming client
│   │   ├── sseEventHandlers.ts            # 20+ event type handlers
│   │   └── useAnalytics.ts               # Activity tracking
│   └── contexts/
│       └── active-session-context.tsx     # Central state provider
│
├── server/                                # Express 4 + TypeScript backend
│   ├── index.ts                           # Server bootstrap, CORS, sessions
│   ├── routes/
│   │   ├── chat.ts                        # POST /api/chat (SSE streaming)
│   │   ├── reports/                       # Document generation, sharing, journal
│   │   ├── admin.ts                       # Admin dashboard endpoints
│   │   ├── analytics.ts                   # Platform telemetry
│   │   └── api/v1/                        # Public REST API (8 modules)
│   ├── services/
│   │   ├── claude/
│   │   │   ├── systemPrompt.ts            # 1,800-line agent definitions
│   │   │   ├── claudeStreaming.ts          # Core streaming orchestration
│   │   │   ├── tokenManagement.ts         # Context window management
│   │   │   └── tools/                     # 213 tool definitions
│   │   │       ├── financialTools-*.ts    #   100+ financial endpoints
│   │   │       ├── academicTools.ts       #   Academic search tools
│   │   │       ├── webTools.ts            #   Tavily/Firecrawl/Exa/SerpAPI
│   │   │       ├── macroDataTools.ts      #   World Bank/IMF/OECD/FRED
│   │   │       ├── pythonTools.ts         #   Python execution
│   │   │       └── polymarketTools.ts     #   Prediction markets
│   │   ├── python/                        # 24 Python services
│   │   │   ├── monteCarloService.py       #   Monte Carlo simulations
│   │   │   ├── garchService.py            #   GARCH volatility models
│   │   │   ├── varService.py              #   Value at Risk
│   │   │   ├── optionsPricingService.py   #   Black-Scholes pricing
│   │   │   ├── portfolioOptimizer.py      #   MPT optimization
│   │   │   └── customPythonExecutor.py    #   Arbitrary code execution
│   │   ├── governor/                      # Runtime governance layer
│   │   │   ├── governorEngine.ts          #   7 decision rules
│   │   │   ├── promptProfiles.ts          #   Academic style injection
│   │   │   └── decisionLog.ts             #   Audit trail
│   │   ├── memory/                        # Global research memory
│   │   │   ├── memoryOrchestrator.ts      #   Briefs + similarity
│   │   │   ├── researchDirector.ts        #   Next-direction selector
│   │   │   └── deduplicationService.ts    #   Duplicate detection
│   │   ├── latex/                         # LaTeX compilation pipeline
│   │   ├── pdf/                           # PDF/HTML/DOCX generation
│   │   └── [external services]            # FMP, EODHD, Tavily, Firecrawl, etc.
│   ├── routes/tool-handlers/              # Tool dispatch (200+ routes)
│   ├── storage/                           # User/session/paper data access
│   └── db.ts                              # Drizzle ORM (SQLite or PostgreSQL)
│
├── shared/                                # Shared types & schemas
│   ├── schema.ts                          # PostgreSQL Drizzle schema
│   ├── schema-sqlite.ts                   # SQLite Drizzle schema
│   └── types.ts                           # API interfaces
│
├── documentation/                         # 25-section LaTeX documentation
├── .env.example                           # Environment template
├── package.json                           # Monorepo dependencies
└── LICENSE                                # MIT
```

### System Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      CLIENT (React 18 + Vite)                           │
│                                                                         │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐  ┌───────────────┐  │
│  │  Chat UI    │  │   Journal    │  │  Showcase  │  │   Admin       │  │
│  │  (SSE)      │  │  (Papers)    │  │  (Gallery) │  │  (Analytics)  │  │
│  └──────┬──────┘  └──────┬───────┘  └──────┬─────┘  └───────┬──────┘  │
│         │                │                 │                 │          │
│  ┌──────┴────────────────┴─────────────────┴─────────────────┴───────┐  │
│  │          React Query + ActiveSessionProvider + SSE Streaming      │  │
│  └──────────────────────────────────┬────────────────────────────────┘  │
└─────────────────────────────────────┼──────────────────────────────────┘
                                      │ HTTP / SSE
┌─────────────────────────────────────┼──────────────────────────────────┐
│                      SERVER (Express 4)                                 │
│  ┌──────────────────────────────────┴────────────────────────────────┐  │
│  │                      Route Layer                                  │  │
│  │  chat (SSE) │ reports │ admin │ analytics │ auth │ api/v1         │  │
│  └──────┬──────────────┬──────────────┬──────────────┬───────────────┘  │
│         │              │              │              │                   │
│  ┌──────┴──────┐  ┌────┴─────┐  ┌────┴─────┐  ┌────┴──────────────┐   │
│  │ Claude      │  │ Governor │  │ Memory   │  │ Storage           │   │
│  │ Opus 4.6    │  │ Engine   │  │ Engine   │  │ (Drizzle ORM)     │   │
│  │ 213 tools   │  │ 7 rules  │  │ Learning │  │ SQLite / Postgres │   │
│  │ 1M context  │  │          │  │          │  │                   │   │
│  └──────┬──────┘  └──────────┘  └──────────┘  └───────────────────┘   │
│         │                                                               │
│  ┌──────┴──────────────────────────────────────────────────────────┐    │
│  │                    Tool Execution Layer                          │    │
│  │                                                                  │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │    │
│  │  │  FMP     │ │  Python  │ │  Web     │ │ Academic │           │    │
│  │  │  230+    │ │  Engine  │ │ Research │ │ Search   │           │    │
│  │  │endpoints │ │ 17 libs  │ │ Tavily+  │ │ OpenAlex │           │    │
│  │  │          │ │          │ │ Firecrawl│ │ arXiv    │           │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │    │
│  │                                                                  │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │    │
│  │  │  Macro   │ │  LaTeX   │ │ Peer     │ │  EODHD   │           │    │
│  │  │ WB/IMF/  │ │ Compiler │ │ Review   │ │ Intraday │           │    │
│  │  │ OECD/FRED│ │ pdflatex │ │ (Popper) │ │ Options  │           │    │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │    │
│  └──────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

<br/>

## API Reference

### Core Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/chat` | Main research chat with SSE streaming |
| `POST` | `/api/speech-to-text` | Audio transcription (ElevenLabs Scribe) |
| `POST` | `/api/upload-data` | CSV/Excel/Parquet file upload |
| `POST` | `/api/chatbot` | Lightweight AI assistant with RAG |

### Document Generation

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/generate-corporate-report` | Institutional A4 PDF (Puppeteer) |
| `POST` | `/api/convert-to-slides` | 16:9 slide deck PDF (Puppeteer) |
| `POST` | `/api/generate-pdf` | Markdown to PDF with KaTeX + cover |
| `POST` | `/api/generate-html` | Standalone HTML with embedded assets |
| `POST` | `/api/generate-docx` | Word document (Pandoc) |
| `GET` | `/api/download/:filename` | Download data files |

### Sessions & Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/sessions` | List user sessions |
| `GET` | `/api/sessions/:id` | Get session with full history |
| `GET` | `/api/shared-reports` | List all shared reports |
| `POST` | `/api/share` | Create shareable link |
| `GET` | `/api/share/:shareId` | Get shared report |

### Public API (v1)

All `/api/v1/*` endpoints require API key authentication.

| Module | Endpoint | Description |
|--------|----------|-------------|
| Papers | `/api/v1/papers` | Paper CRUD operations |
| Reviews | `/api/v1/reviews` | Peer review queries |
| Reports | `/api/v1/reports` | Report endpoints |
| Search | `/api/v1/search` | Full-text cross-resource search |
| Stats | `/api/v1/stats` | Platform statistics |
| Pipeline | `/api/v1/pipeline` | Research pipeline status |
| Sessions | `/api/v1/sessions` | Session management |
| Keys | `/api/v1/keys` | API key management |

### Financial Data (23 FMP proxy endpoints)

| Method | Endpoint |
|--------|----------|
| `GET` | `/api/fmp/quote/:symbol` `/api/fmp/company-profile/:symbol` `/api/fmp/historical-price/:symbol` |
| `GET` | `/api/fmp/income-statement/:symbol` `/api/fmp/balance-sheet/:symbol` `/api/fmp/cash-flow/:symbol` |
| `GET` | `/api/fmp/key-metrics/:symbol` `/api/fmp/financial-ratios/:symbol` `/api/fmp/analyst-estimates/:symbol` |
| `GET` | `/api/fmp/price-target/:symbol` `/api/fmp/insider-trading/:symbol` `/api/fmp/institutional-holders/:symbol` |
| `GET` | `/api/fmp/earnings-surprises/:symbol` `/api/fmp/dividend-history/:symbol` `/api/fmp/esg-score/:symbol` |
| `GET` | `/api/fmp/financial-news/:symbol` `/api/fmp/upgrades-downgrades/:symbol` |
| `GET` | `/api/fmp/gainers` `/api/fmp/losers` `/api/fmp/actives` `/api/fmp/market-hours` |

<br/>

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Development server (Vite HMR + Express) |
| `npm run build` | Production build (client + server) |
| `npm start` | Start production server |
| `npm run typecheck` | TypeScript type checking |
| `npm run lint` | ESLint check |
| `npm run lint:fix` | ESLint auto-fix |
| `npm run format` | Prettier format all files |
| `npm run format:check` | Prettier check (CI) |
| `npm test` | Run all tests (Vitest) |
| `npm run test:watch` | Tests in watch mode |
| `npm run test:coverage` | Tests with coverage |
| `npm run db:push` | Push DB schema (Drizzle Kit) |

<br/>

## Testing

[![Tests](https://img.shields.io/badge/41_passing-22c55e?style=flat-square&logo=vitest&logoColor=white&label=Tests)](./)
[![Duration](https://img.shields.io/badge/<1s-22c55e?style=flat-square&label=Duration)](./)

| Suite | Tests | Covers |
|-------|-------|--------|
| `App.test.tsx` | 3 | Smoke: renders, home page, search bar |
| `config.test.ts` | 5 | App config: name, domain, endpoints, limits, flags |
| `utils.test.ts` | 5 | Class merging, conditionals, dedup, edge cases |
| `queryClient.test.ts` | 6 | Query defaults: staleTime, gcTime, retry, refetch |
| `useChatSession.test.tsx` | 6 | Hook state, reset, history toggle, mutation, handlers |
| `validation.test.ts` | 16 | Zod schemas: valid/invalid, missing fields, max lengths |

```bash
npm test                # Run once
npm run test:watch      # Watch mode
npm run test:coverage   # Coverage report
```

<br/>

## Deployment

### Production Build

```bash
npm run build     # Vite (client) + esbuild (server) → dist/
npm start         # Starts production server on PORT
```

### Environment

```bash
NODE_ENV=production
PORT=5000
SESSION_SECRET=<strong-random-secret>
ANTHROPIC_API_KEY=sk-ant-...
FMP_API_KEY=...
FRED_API_KEY=...

# Database (default: SQLite, or use PostgreSQL)
DATABASE_URL=sqlite://local.db
# DATABASE_URL=postgresql://user:pass@host:5432/db
```

The server supports both **SQLite** (zero-config, great for development and single-server deployments) and **PostgreSQL** (production scale, supports Neon serverless). The database is auto-migrated on startup.

<br/>

## Contributing

AutoScholar is open source and contributions are welcome.

### Getting Started

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Run checks before committing:
   ```bash
   npm run typecheck && npm run lint && npm test
   ```
4. Commit with a descriptive message
5. Open a Pull Request

### Code Conventions

| Rule | Enforced By |
|------|------------|
| TypeScript strict mode | `tsconfig.json` |
| ESLint (typescript-eslint + react-hooks) | `eslint.config.js` |
| Prettier formatting | `.prettierrc` |
| Zod validation on all API inputs | `server/routes/validation.ts` |
| Structured logging (`logger`) | ESLint `no-console` |
| Path aliases: `@/` (client), `@shared/` (shared) | `tsconfig.json` + `vite.config.ts` |
| Components grouped by domain | `components/chat/`, `components/journal/`, etc. |

### Areas Where Help Is Welcome

- **New data sources** -- integrate additional financial/economic APIs
- **New quantitative models** -- add Python analysis services
- **Frontend improvements** -- UI/UX, accessibility, mobile
- **Testing** -- increase coverage across server services
- **Documentation** -- improve guides, add tutorials
- **Internationalization** -- translate the interface

<br/>

## Usage Examples

### Research Paper Generation
```
"Write a research paper analyzing the impact of ESG scores on stock returns
 using panel data from S&P 500 companies over 2019-2024"

"Generate an empirical study on cryptocurrency volatility spillover effects
 between Bitcoin, Ethereum, and traditional markets using DCC-GARCH"

"Produce a paper on the effectiveness of momentum strategies in emerging
 markets with transaction cost analysis and risk-adjusted returns"
```

### Financial Analysis
```
"Full analysis of NVDA: profile, financials, insider trades, analyst ratings"

"Compare AAPL, MSFT, GOOGL on market cap, P/E, revenue growth, ESG scores"

"Due diligence on TSLA: DCF valuation, institutional holders, insider patterns"
```

### Quantitative Analysis
```
"Run Monte Carlo on AAPL with 10,000 paths over 252 trading days"

"Optimize a portfolio of AAPL, MSFT, GOOGL, AMZN for max Sharpe ratio"

"Calculate VaR for a $100K NVDA position at 95% and 99% confidence"

"Estimate GARCH volatility for TSLA, forecast 30-day ahead volatility"

"Price a call on AAPL, strike $200, 30 DTE, show all Greeks"
```

### Web Research
```
"Search latest AI industry news and summarize key developments"

"Extract the NVIDIA earnings call transcript, highlight guidance changes"

"Research Fed rate decisions' impact on tech stocks in 2024-2025"
```

<br/>

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript 5.6, Vite 5, TailwindCSS 3.4, Radix UI / shadcn/ui, Framer Motion, Recharts, React Query, wouter |
| **Backend** | Express 4, TypeScript 5.6, Drizzle ORM, Zod |
| **AI** | Claude Opus 4.6 (1M context), Claude Haiku (figure captions), 213 tools |
| **Python** | numpy, pandas, scipy, scikit-learn, statsmodels, matplotlib, seaborn, plotly, arch, cvxpy, yfinance, ta, quantstats, beautifulsoup4, requests, lxml, Pillow |
| **Database** | SQLite (dev) / PostgreSQL (prod) with Drizzle ORM |
| **PDF** | Puppeteer, jsPDF, Pandoc, KaTeX, pdflatex |
| **Data** | FMP, EODHD, FRED, World Bank, IMF, OECD, Polymarket |
| **Search** | Tavily, Firecrawl, Exa, SerpAPI, OpenAlex, arXiv, CrossRef |
| **Quality** | ESLint, Prettier, Vitest, Testing Library |

<br/>

## Project Metrics

| Metric | Value |
|--------|-------|
| Lines of Code | 40,000+ |
| Source Files | 155+ |
| Claude Tools | 213 |
| API Endpoints | 270+ |
| Python Libraries | 17 |
| React Components | 90+ |
| Test Suites | 6 (41 tests) |
| Database Tables | 9+ |
| Route Modules | 6 + 8 API v1 |
| Service Modules | 30+ |

<br/>

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
      <a href="https://anthropic.com"><img src="https://img.shields.io/badge/Model-Opus_4.6_(1M_ctx)-d97706?style=flat-square"/></a>
    </td>
  </tr>
</table>

<br/>

## Acknowledgments

[![Anthropic](https://img.shields.io/badge/Anthropic-Claude_AI-d97706?style=flat-square&logo=anthropic&logoColor=white)](https://anthropic.com/)
[![FMP](https://img.shields.io/badge/Financial_Modeling_Prep-Data-0969da?style=flat-square)](https://financialmodelingprep.com/)
[![Firecrawl](https://img.shields.io/badge/Firecrawl-Extraction-f97316?style=flat-square)](https://firecrawl.dev/)
[![Tavily](https://img.shields.io/badge/Tavily-AI_Search-4f46e5?style=flat-square)](https://tavily.com/)
[![Exa](https://img.shields.io/badge/Exa-Search-6366f1?style=flat-square)](https://exa.ai/)
[![Radix UI](https://img.shields.io/badge/Radix_UI-Components-161618?style=flat-square)](https://radix-ui.com/)
[![shadcn/ui](https://img.shields.io/badge/shadcn/ui-Design-000?style=flat-square)](https://ui.shadcn.com/)

<br/>

## License

MIT License -- see [LICENSE](./LICENSE) for details.

Copyright (c) 2026 Simon-Pierre Boucher

<br/>

---

<div align="center">

<br/>

**AutoScholar** -- *Where AI meets institutional-grade research.*

<br/>

[![TypeScript](https://img.shields.io/badge/-TypeScript-3178c6?style=flat-square&logo=typescript&logoColor=white)](./)
[![React](https://img.shields.io/badge/-React-61dafb?style=flat-square&logo=react&logoColor=black)](./)
[![Claude](https://img.shields.io/badge/-Claude_AI-d97706?style=flat-square&logo=anthropic&logoColor=white)](./)
[![Python](https://img.shields.io/badge/-Python-3776ab?style=flat-square&logo=python&logoColor=white)](./)
[![Vite](https://img.shields.io/badge/-Vite-646cff?style=flat-square&logo=vite&logoColor=white)](./)
[![Tailwind](https://img.shields.io/badge/-Tailwind-06b6d4?style=flat-square&logo=tailwindcss&logoColor=white)](./)

</div>
