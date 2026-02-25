<div align="center">

# VibeQuant

**AI-Powered Institutional-Grade Financial Intelligence Platform**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![Claude AI](https://img.shields.io/badge/Claude-Opus_4.6-d97706?logo=anthropic&logoColor=white)](https://anthropic.com/)
[![License](https://img.shields.io/badge/License-MIT-22c55e)](./LICENSE)

[![Lines of Code](https://img.shields.io/badge/Lines_of_Code-36k+-blue)](./)
[![Source Files](https://img.shields.io/badge/Source_Files-150-blue)](./)
[![API Endpoints](https://img.shields.io/badge/API_Endpoints-265+-purple)](./)
[![Claude Tools](https://img.shields.io/badge/Claude_Tools-213-d97706)](./)
[![Python Libraries](https://img.shields.io/badge/Python_Libs-17-3776ab)](./)

[**Live Demo**](https://www.vquant.ai) &nbsp;&middot;&nbsp; [**Documentation**](#documentation) &nbsp;&middot;&nbsp; [**Getting Started**](#getting-started)

</div>

---

## Overview

VibeQuant is a full-stack financial analysis platform that combines **Claude AI** with **265+ financial data endpoints**, **quantitative Python analysis**, and **multi-source web research** to deliver institutional-grade insights through a conversational interface.

### Key Capabilities

| Domain | What it does |
|--------|-------------|
| **Financial Data** | 230 FMP endpoints: statements, ratios, technicals, insider trades, SEC filings, ESG, DCF |
| **Quantitative Analysis** | Monte Carlo, Black-Scholes, GARCH, VaR, portfolio optimization, custom Python |
| **Web Research** | Tavily AI search, Firecrawl PDF extraction, Exa semantic search, SerpAPI |
| **AI Agent** | Claude with 213 specialized tools, 5-tool batching, 1M token context, SSE streaming |
| **Export** | PDF reports, DOCX, Beamer LaTeX slides, CSV/XLSX data downloads |

---

## Tech Stack

```
Client              Server              Data & AI
──────              ──────              ─────────
React 18 + TSX      Express 4           Claude Opus 4.6 (1M ctx)
Vite 5              Drizzle ORM         FMP API (230 endpoints)
TanStack Query      SQLite / PostgreSQL  Tavily, Firecrawl, Exa
shadcn/ui + Radix   Zod validation       Python (numpy, scipy, etc.)
Tailwind CSS        SSE streaming        17 scientific libraries
wouter              multer, Puppeteer
```

---

## Getting Started

### Prerequisites

- **Node.js** 18+
- **Python** 3.11+ (for quantitative analysis)
- **npm** 9+

### Installation

```bash
# Clone
git clone https://github.com/simonpierreboucher/vquant.git
cd vquant

# Install Node dependencies
npm install

# Set up Python virtual environment
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements-safe.txt

# Configure environment
cp .env.example .env
# Edit .env with your API keys (see below)

# Start development server
npm run dev
```

The app will be available at `http://localhost:5000`.

### Required API Keys

| Service | Sign Up | Free Tier |
|---------|---------|-----------|
| **Anthropic** (required) | [console.anthropic.com](https://console.anthropic.com) | $5 credit |
| **FMP** (required) | [financialmodelingprep.com](https://financialmodelingprep.com) | 250 calls/day |
| **Firecrawl** | [firecrawl.dev](https://firecrawl.dev) | 500 credits |
| **Tavily** | [app.tavily.com](https://app.tavily.com) | 1000 calls/month |
| **Exa** | [exa.ai](https://exa.ai) | 1000 searches/month |
| **SerpAPI** | [serpapi.com](https://serpapi.com) | 100 searches/month |

---

## Scripts

```bash
npm run dev           # Start dev server (Vite + Express)
npm run build         # Build for production
npm start             # Start production server
npm run typecheck     # TypeScript check (tsc --noEmit)
npm run lint          # ESLint check
npm run lint:fix      # ESLint auto-fix
npm run format        # Prettier format
npm run format:check  # Prettier check
npm run db:push       # Push database schema
```

---

## Architecture

```
vquant/
├── client/src/
│   ├── App.tsx                    # Router + providers + ErrorBoundary
│   ├── components/
│   │   ├── chat/                  # 13 chat-specific components
│   │   ├── explore/               # 7 stock explorer components
│   │   ├── financial/             # Price charts, options pricing
│   │   └── ui/                    # 35 shadcn/ui primitives
│   ├── hooks/
│   │   ├── useChatSession.ts      # All chat state & logic
│   │   └── useChatMutation.ts     # SSE streaming client
│   ├── pages/                     # 9 route pages
│   └── lib/                       # queryClient, utils
│
├── server/
│   ├── routes.ts                  # /api/chat + /api/speech-to-text
│   ├── routes/
│   │   ├── auth.ts                # /api/auth/*
│   │   ├── admin.ts               # /api/admin/*
│   │   ├── analytics.ts           # /api/analytics/*
│   │   ├── fmp.ts                 # /api/fmp/* (23 endpoints)
│   │   ├── reports.ts             # /api/share, sessions, docs, download
│   │   └── validation.ts          # Zod schemas
│   ├── services/
│   │   ├── claude/                # Tool definitions + token management
│   │   ├── python/                # Monte Carlo, GARCH, VaR, options
│   │   ├── fmpService.ts          # 230 FMP API functions
│   │   └── *.py                   # Python scientific services
│   ├── db.ts                      # Drizzle (SQLite / PostgreSQL)
│   └── storage.ts                 # Typed data access layer
│
└── shared/
    ├── schema.ts                  # PostgreSQL schema (Drizzle)
    ├── schema-sqlite.ts           # SQLite schema (Drizzle)
    └── types.ts                   # Shared API interfaces
```

---

## Usage Examples

### Financial Analysis
```
"Full analysis of NVDA: profile, financials, insider trades, analyst ratings, sector performance"

"Compare AAPL, MSFT, GOOGL on: market cap, P/E, revenue growth, ESG scores"

"Due diligence on TSLA: DCF valuation, institutional holders, insider trading patterns"
```

### Quantitative Analysis
```
"Run a Monte Carlo simulation on AAPL with 10,000 paths over 252 trading days"

"Calculate the correlation matrix of FAANG stocks and display a heatmap"

"Backtest an RSI strategy on SPY and show the equity curve"
```

### Web Research
```
"Search latest AI industry news this week and summarize key developments"

"Extract the last NVIDIA earnings call transcript and highlight guidance changes"
```

---

## Documentation

| Document | Description |
|----------|-------------|
| [`.env.example`](./.env.example) | All required environment variables |
| [`shared/types.ts`](./shared/types.ts) | API type definitions |
| [`server/routes/validation.ts`](./server/routes/validation.ts) | Request validation schemas |

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Run checks before committing:
   ```bash
   npm run typecheck && npm run lint
   ```
4. Commit with a descriptive message
5. Open a Pull Request

### Code Conventions

- **TypeScript strict** mode enabled
- **ESLint** + **Prettier** enforced (see `eslint.config.js`, `.prettierrc`)
- **Zod** validation on all API inputs
- **Logger** instead of `console.log` (server-side)
- **`@/`** path alias for client imports, **`@shared/`** for shared types

---

## Deployment

```bash
# Build
npm run build

# Start production
NODE_ENV=production npm start
```

Required production environment variables:

```bash
NODE_ENV=production
PORT=5000
SESSION_SECRET=<strong-random-secret>  # Required in production
DATABASE_URL=postgresql://...          # Or sqlite://local.db for dev
ANTHROPIC_API_KEY=sk-ant-...
FINANCIAL_MODELING_PREP_API_KEY=...
```

---

## Authors

**Simon-Pierre Boucher** &mdash; Creator & Lead Developer

[![Email](https://img.shields.io/badge/Email-spbou4%40protonmail.com-8b5cf6?logo=protonmail&logoColor=white)](mailto:spbou4@protonmail.com)
[![Website](https://img.shields.io/badge/Website-spboucher.ai-3b82f6?logo=safari&logoColor=white)](https://www.spboucher.ai)
[![GitHub](https://img.shields.io/badge/GitHub-simonpierreboucher-181717?logo=github&logoColor=white)](https://github.com/simonpierreboucher)

**Claude Opus 4.6** &mdash; AI Pair Programmer

[![Anthropic](https://img.shields.io/badge/Anthropic-Claude_Code-d97706?logo=anthropic&logoColor=white)](https://claude.ai/claude-code)

> Codebase audit, refactoring, typing, architecture restructuring, and tooling setup performed via Claude Code (7 commits, ~3000 lines refactored).

---

## License

[MIT](./LICENSE)

---

<div align="center">

**[www.vquant.ai](https://www.vquant.ai)**

*Where AI Meets Institutional-Grade Financial Analysis*

</div>
