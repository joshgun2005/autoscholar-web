# Getting Started

Complete guide to set up and run VibeQuant locally.

## Prerequisites

| Requirement | Version | Purpose |
|-------------|---------|---------|
| **Node.js** | 18+ | Server & client runtime |
| **npm** | 9+ | Package manager |
| **Python** | 3.11+ | Quantitative analysis (Monte Carlo, GARCH, VaR, etc.) |
| **LaTeX** (optional) | Any | Beamer PDF slide generation |
| **Pandoc** (optional) | Any | DOCX document generation |

## Step 1 — Clone & Install

```bash
git clone https://github.com/simonpierreboucher02/vquant.git
cd vquant

# Install Node.js dependencies
npm install
```

## Step 2 — Python Environment

The Python environment is required for quantitative analysis features (Monte Carlo, GARCH, VaR, portfolio optimization, custom Python code).

```bash
# Create virtual environment
python3 -m venv .venv

# Activate it
source .venv/bin/activate        # macOS / Linux
# .venv\Scripts\activate          # Windows

# Install scientific libraries
pip install -r requirements-safe.txt
```

### Included Python Libraries (17)

| Library | Purpose |
|---------|---------|
| numpy | Numerical computing |
| pandas | Data manipulation & analysis |
| scipy | Scientific computing & statistics |
| scikit-learn | Machine learning |
| statsmodels | Statistical models |
| matplotlib | Static charts |
| seaborn | Statistical visualization |
| plotly | Interactive charts |
| arch | GARCH volatility models |
| cvxpy | Convex optimization (portfolio) |
| yfinance | Market data provider |
| ta | Technical analysis indicators |
| quantstats | Portfolio analytics |
| beautifulsoup4 | Web scraping |
| requests | HTTP client |
| lxml | XML/HTML parsing |
| Pillow | Image processing |

## Step 3 — Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your API keys:

```bash
# ─── Required ──────────────────────────────────────────
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here    # Claude AI
FMP_API_KEY=your-fmp-key-here                    # Financial data

# ─── Recommended ───────────────────────────────────────
FIRECRAWL_API_KEY=fc-your-key-here               # Web/PDF extraction
TAVILY_API_KEY=tvly-your-key-here                # AI-powered search

# ─── Optional ──────────────────────────────────────────
EXA_API_KEY=your-exa-key-here                    # Semantic search
SERPAPI_API_KEY=your-serpapi-key-here             # Google search
ELEVENLABS_API_KEY=your-elevenlabs-key-here      # Speech-to-text

# ─── Server Config ─────────────────────────────────────
DATABASE_URL=sqlite://local.db                   # SQLite (default) or PostgreSQL
SESSION_SECRET=generate-a-strong-random-secret   # Required in production
PORT=5000
NODE_ENV=development
```

### Where to get API keys

| Service | Free Tier | Sign Up |
|---------|-----------|---------|
| **Anthropic** | $5 credit | [console.anthropic.com](https://console.anthropic.com) |
| **FMP** | 250 calls/day | [financialmodelingprep.com](https://financialmodelingprep.com) |
| **Firecrawl** | 500 credits | [firecrawl.dev](https://firecrawl.dev) |
| **Tavily** | 1000 calls/month | [app.tavily.com](https://app.tavily.com) |
| **Exa** | 1000 searches/month | [exa.ai](https://exa.ai) |
| **SerpAPI** | 100 searches/month | [serpapi.com](https://serpapi.com) |

## Step 4 — Run

```bash
# Development (with hot-reload)
npm run dev

# The app is available at http://localhost:5000
```

## Step 5 — Verify

1. Open `http://localhost:5000` in your browser
2. Type a query like: `"Analyze AAPL stock: profile, financials, and analyst ratings"`
3. Watch the AI agent execute tools and stream the response in real-time

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (Vite HMR + Express) |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run typecheck` | TypeScript check |
| `npm run lint` | ESLint check |
| `npm run lint:fix` | ESLint auto-fix |
| `npm run format` | Prettier format |
| `npm test` | Run all tests |
| `npm run test:watch` | Tests in watch mode |
| `npm run db:push` | Push database schema |

## Troubleshooting

### Python not found
```bash
# Specify Python path explicitly in .env
PYTHON_PATH=/path/to/.venv/bin/python
```

### Port already in use
```bash
# Change port in .env
PORT=3001
```

### npm install peer dependency errors
```bash
npm install --legacy-peer-deps
```
