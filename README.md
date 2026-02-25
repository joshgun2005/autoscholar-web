# 🚀 VibeQuant - AI-Powered Financial Intelligence Platform

**Plateforme d'analyse financière de niveau institutionnel propulsée par Claude AI**

🌐 **Website**: https://www.vquant.ai

---

## ✨ Vue d'ensemble

VibeQuant est une plateforme d'analyse financière révolutionnaire qui combine :
- 🧠 **Claude Sonnet 4.5** (1M context) pour l'analyse intelligente
- 📊 **265 endpoints API** (FMP, Firecrawl, Tavily, Exa)
- 🐍 **17 bibliothèques Python** scientifiques
- 🔧 **213 tools spécialisés** pour analyses approfondies
- 📄 **Extraction PDF** jusqu'à 750 pages
- 🤖 **Agents autonomes** multi-sources

---

## 🎯 Capacités principales

### 💰 Données Financières (FMP - 230 endpoints)
- États financiers complets (income, balance, cash flow)
- 50+ ratios et métriques financiers
- 12 indicateurs techniques
- Insider trading & institutional holdings
- Analyst ratings & price targets
- Economic data & Treasury rates
- SEC filings (8-K, 10-K, 10-Q, 13F)
- Senate/House trading
- ESG scores
- DCF valuations
- Bulk APIs

### 🌐 Recherche Web & Extraction
- **Tavily** : Recherche IA avec réponses générées, filtres temporels
- **Firecrawl** : Extraction PDFs, crawling intelligent, agents autonomes
- **Exa** : Recherche sémantique de qualité
- **SerpAPI** : Google search

### 🐍 Analyses Quantitatives Python
- Monte Carlo simulations
- Options pricing (Black-Scholes)
- GARCH volatility modeling
- Value at Risk (VaR)
- Portfolio optimization (Modern Portfolio Theory)
- Risk metrics (Sharpe, Sortino, Beta, Drawdown)
- **Code Python personnalisé** avec 17 bibliothèques
- Machine learning, backtesting, forecasting

### 🤖 Intelligence Artificielle
- Claude Sonnet 4.5 (1M tokens de contexte)
- Batching intelligent (5 tools/batch)
- Gestion optimisée du contexte
- Streaming temps réel (SSE)
- Conversation history persistante

---

## 🚀 Installation

### Prérequis
- Node.js 18+
- Python 3.11+
- npm ou yarn

### Installation rapide

```bash
# 1. Cloner le repo
git clone https://github.com/your-repo/vibequant-app-v2.git
cd vibequant-app-v2

# 2. Installer dépendances Node.js
npm install

# 3. Créer environnement Python
python3 -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# 4. Installer packages Python
pip install -r requirements-safe.txt

# 5. Configurer variables d'environnement
cp .env.example .env
# Éditez .env avec vos clés API

# 6. Vérifier tout
./check-dependencies.sh

# 7. Démarrer
npm run dev
```

**Documentation complète** : Voir [INSTALLATION.md](./INSTALLATION.md)

---

## 🔑 Clés API Requises

Toutes ont des plans gratuits généreux :

| Service | URL | Plan gratuit | Requis |
|---------|-----|--------------|--------|
| Anthropic | https://console.anthropic.com | $5 offerts | ✅ Oui |
| FMP | https://financialmodelingprep.com | 250 calls/jour | ✅ Oui |
| Firecrawl | https://firecrawl.dev | 500 crédits | Recommandé |
| Tavily | https://app.tavily.com | 1000 calls/mois | Recommandé |
| Exa | https://exa.ai | 1000 searches/mois | Optionnel |
| SerpAPI | https://serpapi.com | 100 searches/mois | Optionnel |

---

## 💡 Exemples d'utilisation

### Analyses financières
```
"Analyse complète de NVDA : profile, finances, insider trades, analyst ratings, performance vs secteur"

"Compare AAPL, MSFT et GOOGL sur : capitalisation, P/E, croissance, ESG, analyst consensus"

"Fais une due diligence de TSLA : financials, DCF, insider trading, institutional holders, ESG"
```

### Recherche & Extraction
```
"Recherche avec Tavily : actualités IA cette semaine avec réponse IA"

"Scrape le dernier earnings call transcript de NVIDIA et résume les points clés"

"Crawle investor.nvidia.com et extrait tous les communiqués Q4 2024"
```

### Analyses Python personnalisées
```
"Calcule la matrice de corrélation entre les FAANG et affiche une heatmap"

"Backtest une stratégie RSI sur AAPL et montre l'equity curve"

"Utilise machine learning pour prédire la direction du prix de NVDA"

"Analyse la cointegration entre XLE et XOM pour pair trading"
```

**Plus d'exemples** : Voir [CUSTOM_PYTHON_TOOL.md](./CUSTOM_PYTHON_TOOL.md)

---

## 📊 Architecture

### Architecture système

```
┌────────────────────────────────────────┐
│         VibeQuant Architecture         │
├────────────────────────────────────────┤
│                                         │
│  🧠 Claude Sonnet 4.5 (1M context)     │
│     └─ 213 specialized tools           │
│                                         │
│  📊 Data Sources (265 endpoints)       │
│     ├─ FMP (230) - Financial data      │
│     ├─ Firecrawl (7) - Web/PDFs       │
│     ├─ Tavily (6) - AI search         │
│     ├─ Exa (2) - Semantic search      │
│     └─ Python (9) - Quant analysis    │
│                                         │
│  🐍 Python Layer (17 libraries)        │
│     ├─ Predefined tools (8)            │
│     └─ Custom Python tool (NEW!)       │
│                                         │
│  🛡️ Protection Layer                  │
│     ├─ Batching (5 tools/batch)        │
│     ├─ PDF chunking (750 pages)        │
│     ├─ Rate limiting                   │
│     └─ Fallbacks multi-niveaux         │
└────────────────────────────────────────┘
```

### Architecture des fichiers (Structure du projet)

```
vibequant-app-v2/
├── client/                          # Frontend React + TypeScript
│   ├── src/
│   │   ├── components/              # Composants React (60+)
│   │   │   ├── ui/                  # Composants UI Shadcn (40+)
│   │   │   ├── financial/           # Composants financiers
│   │   │   └── explore/             # Exploration de données
│   │   ├── pages/                   # Pages de l'application
│   │   ├── hooks/                   # React hooks personnalisés
│   │   ├── utils/                   # Utilitaires (PDF, export)
│   │   └── lib/                     # Config et librairies
│   └── index.html
│
├── server/                          # Backend Express + TypeScript
│   ├── services/                    # Services métier
│   │   ├── claude/                  # ✅ Module Claude (refactorisé)
│   │   │   ├── toolDefinitions.ts   # 4480 lignes - 200+ outils
│   │   │   └── tokenManagement.ts   # 164 lignes - Gestion tokens
│   │   ├── claudeService.ts         # ✅ 339 lignes (était 4947)
│   │   ├── fmpService.ts            # ⚠️ 2474 lignes - API FMP
│   │   ├── pythonExecutor.ts        # ⚠️ 2271 lignes - Python
│   │   ├── exaService.ts            # Recherche Exa
│   │   ├── tavilyService.ts         # Recherche Tavily
│   │   ├── firecrawlService.ts      # Extraction web/PDF
│   │   ├── serpapiService.ts        # ⚠️ 545 lignes
│   │   ├── beamerSlidesService.ts   # ⚠️ 546 lignes
│   │   └── *.py                     # Services Python (10+)
│   ├── routes.ts                    # ⚠️ 2891 lignes - Routes API
│   ├── db.ts                        # Configuration DB SQLite
│   ├── storage.ts                   # Gestion stockage
│   └── index.ts                     # Point d'entrée serveur
│
├── shared/                          # Code partagé TypeScript
│   ├── schema.ts                    # Schémas de données
│   └── schema-sqlite.ts             # Schémas SQLite
│
├── docs_archive/                    # 📦 Documentation archivée
├── public/                          # Assets publics
├── .env                             # Variables d'environnement
├── package.json                     # Dépendances Node.js
├── pyproject.toml                   # Configuration Python (uv)
└── README.md                        # Ce fichier
```

### Métriques de code

- **Fichiers source**: 5,812 fichiers TypeScript/Python/JSON
- **Composants React**: 60+ composants UI et métier
- **Routes API**: 100+ endpoints Express
- **Services Python**: 10 services scientifiques
- **Outils Claude**: 213 outils financiers définis

### Refactoring récent ✅

#### 1. claudeService.ts: 4,947 → 339 lignes (-93%)
- Extraction `claude/toolDefinitions.ts`: 4,480 lignes (200+ définitions d'outils)
- Extraction `claude/tokenManagement.ts`: 164 lignes (gestion contexte et tokens)
- Architecture modulaire pour faciliter les ajouts futurs

#### 2. pythonExecutor.ts: 2,271 → 5 lignes (-99.8%)
- Extraction `python/monteCarlo.ts`: 305 lignes
- Extraction `python/optionsPricing.ts`: 350 lignes
- Extraction `python/garch.ts`: 286 lignes
- Extraction `python/var.ts`: 1,372 lignes
- Extraction `python/index.ts`: 41 lignes (barrel export)

**Total lignes réduites**: 7,218 lignes → 344 lignes (-95.2%)

### Fichiers nécessitant refactoring ⚠️

**Priorité critique (2000+ lignes)**:
1. `server/routes.ts` (2,891 lignes) - Splitter par domaine (auth, admin, analytics, chat, tools)
2. `server/services/fmpService.ts` (2,474 lignes) - Séparer par catégorie (company, market, technical)
3. `server/services/pythonExecutor.ts` (2,271 lignes) - Un module par modèle financier

**Priorité élevée (500-800 lignes)**:
4. `client/src/pages/admin.tsx` (775 lignes)
5. `client/src/components/ui/sidebar.tsx` (727 lignes)
6. `client/src/pages/documentation.tsx` (669 lignes)
7. `client/src/utils/pdfGenerator.ts` (639 lignes)
8. `client/src/components/export-buttons.tsx` (611 lignes)

---

## 🛠️ Développement

```bash
# Mode développement
npm run dev

# Build production
npm run build

# Démarrer production
npm start

# Vérifier dépendances
./check-dependencies.sh

# Type checking
npm run check

# Database migrations
npm run db:push
```

---

## 📚 Documentation

- [**QUICK_START.md**](./QUICK_START.md) - Démarrage rapide
- [**INSTALLATION.md**](./INSTALLATION.md) - Guide d'installation complet
- [**CUSTOM_PYTHON_TOOL.md**](./CUSTOM_PYTHON_TOOL.md) - Guide tool Python libre
- [**FMP_PYTHON_GUIDE.md**](./FMP_PYTHON_GUIDE.md) - Utilisation FMP en Python
- [**PYTHON_LIBRE_EXAMPLES.md**](./PYTHON_LIBRE_EXAMPLES.md) - Exemples avancés
- [**CHANGELOG_TODAY.md**](./CHANGELOG_TODAY.md) - Changelog détaillé

---

## 🌟 Fonctionnalités Uniques

### 🔥 Ce qui rend VibeQuant unique :

1. **Coverage FMP complète** - 230 endpoints vs ~40 pour la plupart des apps
2. **Tool Python libre** - Écrivez du code Python arbitraire avec accès FMP
3. **Multi-source research** - Combine FMP + Web (Tavily, Firecrawl, Exa)
4. **Batching intelligent** - Analyses complexes avec 40+ tools sans crash
5. **PDF ultra-longs** - Chunking automatique jusqu'à 750 pages
6. **17 bibliothèques Python** - numpy, pandas, scipy, sklearn, statsmodels, ta, plotly, et plus
7. **Agents autonomes** - Recherche et extraction intelligentes
8. **Extraction structurée** - Schémas JSON pour données web
9. **Niveau institutionnel** - Capacités comparables à Bloomberg sur certains aspects

---

## 🔒 Sécurité

- ✅ CORS configuré pour vquant.ai
- ✅ Session management sécurisé
- ✅ API keys via variables d'environnement
- ✅ Python execution dans environnement contrôlé
- ✅ Input validation sur tous les endpoints
- ✅ Rate limiting intégré
- ✅ Timeouts configurables
- ✅ Secure cookies en production

---

## 📈 Performance

- **Build time** : ~3.7s
- **API response** : <500ms (moyenne)
- **PDF extraction** : 30-120s (selon taille)
- **Python execution** : <90s (timeout)
- **Batching** : 5 tools/batch avec pauses 500ms
- **Streaming SSE** : Réponses en temps réel

---

## 🌐 Déploiement Production

### Variables d'environnement à configurer

```bash
NODE_ENV=production
PORT=5000
BASE_URL=https://www.vquant.ai
DATABASE_URL=postgresql://...
SESSION_SECRET=strong_random_secret

# API Keys
ANTHROPIC_API_KEY=sk-ant-...
FMP_API_KEY=...
FIRECRAWL_API_KEY=fc-...
TAVILY_API_KEY=tvly-...
EXA_API_KEY=...
SERPAPI_API_KEY=...
```

### Build et déploiement

```bash
# Build
npm run build

# Démarrer
NODE_ENV=production npm start
```

---

## 🤝 Contributing

Les contributions sont bienvenues! Pour contribuer :

1. Fork le projet
2. Créez une branche (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

---

## 📝 License

MIT License - Voir [LICENSE](./LICENSE) pour détails

---

## 🙏 Remerciements

- **Anthropic** pour Claude AI
- **Financial Modeling Prep** pour données financières
- **Firecrawl** pour extraction web/PDF
- **Tavily** pour recherche IA
- **Exa** pour recherche sémantique

---

## 📧 Support

- **Website**: https://www.vquant.ai
- **Issues**: GitHub Issues
- **Documentation**: Voir dossier /docs

---

## 🎊 Statistiques

```
┌────────────────────────────────────┐
│      VibeQuant by the Numbers      │
├────────────────────────────────────┤
│  📊 265 API endpoints              │
│  🔧 213 Claude tools               │
│  🐍 17 Python libraries            │
│  📄 750 pages max (PDFs)           │
│  ⚡ 5 tools/batch                  │
│  🎯 4 web sources                  │
│  🔬 8 predefined analyses          │
│  ∞  Custom Python analyses         │
└────────────────────────────────────┘
```

---

**VibeQuant - Where AI Meets Institutional-Grade Financial Analysis** 💎🚀

_Développé avec Claude Sonnet 4.5 - Janvier 2026_
