import { Sparkles, TrendingUp, Calculator, BarChart3, DollarSign, ArrowLeft, Activity, LineChart, Zap, Target, Globe, Users, Crown, Rocket, PieChart, BrainCircuit, Code, Database, Search, FileText, Briefcase, TrendingDown, AlertCircle, Newspaper, Building2, CandlestickChart } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { ThemeColorPicker } from "@/components/theme-color-picker";
import { motion } from "framer-motion";

export default function Documentation() {
  const [, setLocation] = useLocation();

  const categories = [
    {
      id: "market-data",
      icon: TrendingUp,
      title: "Données de Marché en Temps Réel",
      color: "from-blue-500 to-cyan-500",
      description: "Cotations, prix historiques, indices et données de marché",
      tools: [
        { name: "get_stock_quote", desc: "Cotation en temps réel d'une action", example: "Quel est le prix actuel d'Apple?" },
        { name: "get_historical_price", desc: "Prix historiques sur une période", example: "Historique de Tesla sur 1 an" },
        { name: "get_intraday_price", desc: "Données intraday (1min, 5min, 15min, etc.)", example: "Prix de NVDA aujourd'hui par intervalle de 5 minutes" },
        { name: "get_forex_quote", desc: "Cotations de paires forex", example: "Taux EUR/USD actuel" },
        { name: "get_commodity_quotes", desc: "Prix des commodités (or, pétrole, etc.)", example: "Prix de l'or aujourd'hui" },
        { name: "get_crypto_quote", desc: "Cotations de cryptomonnaies", example: "Prix du Bitcoin maintenant" },
        { name: "get_market_hours", desc: "Heures d'ouverture des marchés", example: "Le marché NYSE est-il ouvert?" },
        { name: "get_gainers", desc: "Top gainers du jour", example: "Quelles actions ont le plus monté aujourd'hui?" },
        { name: "get_losers", desc: "Top losers du jour", example: "Quelles actions ont le plus baissé?" },
        { name: "get_actives", desc: "Actions les plus actives", example: "Actions avec le plus de volume aujourd'hui" },
      ]
    },
    {
      id: "fundamentals",
      icon: FileText,
      title: "États Financiers & Fondamentaux",
      color: "from-purple-500 to-pink-500",
      description: "Bilans, comptes de résultats, métriques et ratios financiers",
      tools: [
        { name: "get_company_profile", desc: "Profil complet d'une entreprise", example: "Profil complet de Microsoft" },
        { name: "get_income_statement", desc: "Compte de résultat (annuel ou trimestriel)", example: "Revenus annuels d'Apple sur 5 ans" },
        { name: "get_balance_sheet", desc: "Bilan comptable", example: "Bilan de Google" },
        { name: "get_cash_flow", desc: "État des flux de trésorerie", example: "Flux de trésorerie Amazon" },
        { name: "get_key_metrics", desc: "Métriques clés (P/E, ROE, etc.)", example: "Métriques de Tesla" },
        { name: "get_financial_ratios", desc: "Ratios financiers complets", example: "Ratios de profitabilité Meta" },
        { name: "get_financial_growth", desc: "Croissance financière", example: "Croissance des revenus NVIDIA" },
        { name: "get_company_outlook", desc: "Perspectives et guidances", example: "Prévisions pour Amazon" },
        { name: "search_companies", desc: "Rechercher des entreprises", example: "Entreprises du secteur tech" },
        { name: "get_stock_peers", desc: "Entreprises comparables", example: "Concurrents d'Apple" },
      ]
    },
    {
      id: "technical",
      icon: Activity,
      title: "Indicateurs Techniques",
      color: "from-green-500 to-emerald-500",
      description: "RSI, MACD, moyennes mobiles et oscillateurs",
      tools: [
        { name: "get_rsi", desc: "Relative Strength Index", example: "RSI de Tesla sur 14 jours" },
        { name: "get_macd", desc: "MACD (Moving Average Convergence Divergence)", example: "MACD pour Bitcoin" },
        { name: "get_ema", desc: "Moyenne mobile exponentielle", example: "EMA 50 jours de NVDA" },
        { name: "get_sma", desc: "Moyenne mobile simple", example: "SMA 200 jours du S&P 500" },
        { name: "get_adx", desc: "Average Directional Index", example: "Force de tendance Apple avec ADX" },
        { name: "get_williams_r", desc: "Williams %R oscillateur", example: "Williams %R pour Amazon" },
        { name: "get_cci", desc: "Commodity Channel Index", example: "CCI de l'or" },
        { name: "get_stochastic", desc: "Oscillateur stochastique", example: "Stochastique Meta" },
      ]
    },
    {
      id: "quantitative",
      icon: Calculator,
      title: "Analyses Quantitatives Python",
      color: "from-orange-500 to-red-500",
      description: "Monte Carlo, GARCH, VaR, optimisation de portefeuille",
      tools: [
        { name: "run_monte_carlo_simulation", desc: "Simulation Monte Carlo pour projections", example: "Simulation Monte Carlo pour Tesla sur 1 an" },
        { name: "calculate_options_price", desc: "Pricing d'options Black-Scholes avec Greeks", example: "Prix d'une option call Apple strike 200" },
        { name: "estimate_garch_volatility", desc: "Modèle GARCH pour volatilité", example: "Volatilité GARCH de Bitcoin" },
        { name: "calculate_var", desc: "Value-at-Risk (VaR) historique ou paramétrique", example: "VaR à 95% pour mon portefeuille" },
        { name: "optimize_portfolio", desc: "Optimisation de portefeuille Markowitz", example: "Optimise un portefeuille AAPL MSFT GOOGL" },
        { name: "analyze_risk_metrics", desc: "Métriques de risque (Sharpe, Sortino, etc.)", example: "Analyse de risque pour Tesla" },
        { name: "create_plot", desc: "Graphiques Python personnalisés", example: "Crée un graphique de corrélation FAANG" },
        { name: "execute_custom_python", desc: "Code Python libre pour analyses", example: "Calcule la matrice de covariance du portefeuille" },
      ]
    },
    {
      id: "analyst",
      icon: Users,
      title: "Analyses d'Analystes & Consensus",
      color: "from-indigo-500 to-purple-500",
      description: "Recommandations, prix cibles, estimations et surprises",
      tools: [
        { name: "get_price_target", desc: "Prix cibles des analystes", example: "Prix cible consensuel pour Apple" },
        { name: "get_analyst_estimates", desc: "Estimations de revenus et bénéfices", example: "Estimations pour Tesla Q4" },
        { name: "get_earnings_surprises", desc: "Surprises de résultats historiques", example: "Surprises de résultats Netflix" },
        { name: "get_upgrades_downgrades", desc: "Changements de recommandations", example: "Dernières recommandations sur NVDA" },
        { name: "get_earnings_calendar", desc: "Calendrier des résultats", example: "Prochains résultats cette semaine" },
      ]
    },
    {
      id: "insider",
      icon: Briefcase,
      title: "Trading d'Initiés & Institutionnel",
      color: "from-red-500 to-rose-500",
      description: "Transactions d'initiés, Congrès, positions institutionnelles",
      tools: [
        { name: "get_insider_trading", desc: "Transactions d'initiés récentes", example: "Insider trading pour Apple" },
        { name: "get_congressional_trading", desc: "Trading du Congrès américain", example: "Derniers achats du Congrès" },
        { name: "get_senate_trading", desc: "Trading du Sénat", example: "Positions du Sénat" },
        { name: "get_institutional_holders", desc: "Détenteurs institutionnels", example: "Qui détient le plus de Tesla?" },
      ]
    },
    {
      id: "economic",
      icon: Globe,
      title: "Données Économiques & Calendriers",
      color: "from-teal-500 to-cyan-500",
      description: "Indicateurs macroéconomiques, calendrier économique",
      tools: [
        { name: "get_economic_calendar", desc: "Événements économiques à venir", example: "Prochains rapports économiques cette semaine" },
        { name: "get_economic_indicator", desc: "Indicateurs macro (GDP, CPI, etc.)", example: "Inflation CPI récente" },
        { name: "get_treasury_rates", desc: "Taux des bons du Trésor", example: "Rendement du Treasury 10 ans" },
        { name: "get_ipo_calendar", desc: "Calendrier des IPO", example: "Prochaines introductions en bourse" },
      ]
    },
    {
      id: "news",
      icon: Newspaper,
      title: "Actualités & Sentiment",
      color: "from-amber-500 to-yellow-500",
      description: "News financières, sentiment, communiqués de presse",
      tools: [
        { name: "get_financial_news", desc: "Actualités financières récentes", example: "Dernières news sur Apple" },
        { name: "get_press_releases", desc: "Communiqués de presse officiels", example: "Communiqués Tesla" },
        { name: "get_stock_news_sentiment", desc: "Sentiment des actualités", example: "Sentiment news pour NVDA" },
        { name: "get_social_sentiment", desc: "Sentiment des réseaux sociaux", example: "Sentiment Twitter pour Bitcoin" },
      ]
    },
    {
      id: "dividends",
      icon: DollarSign,
      title: "Dividendes & Actions Corporate",
      color: "from-emerald-500 to-green-500",
      description: "Historique dividendes, splits, rachats d'actions",
      tools: [
        { name: "get_dividend_history", desc: "Historique des dividendes", example: "Dividendes Microsoft sur 10 ans" },
        { name: "get_stock_split_history", desc: "Historique des splits", example: "Splits d'Apple" },
      ]
    },
    {
      id: "screening",
      icon: Search,
      title: "Screening & Recherche",
      color: "from-pink-500 to-rose-500",
      description: "Filtrage d'actions, recherche par critères",
      tools: [
        { name: "get_stock_screener", desc: "Filtrer actions par critères", example: "Actions tech avec P/E < 20 et dividende > 2%" },
        { name: "search_symbol", desc: "Rechercher par symbole", example: "Trouver le symbole de Microsoft" },
        { name: "search_by_cik", desc: "Rechercher par CIK (SEC)", example: "Entreprise avec CIK 0000789019" },
      ]
    },
    {
      id: "etf",
      icon: PieChart,
      title: "ETF & Fonds",
      color: "from-violet-500 to-purple-500",
      description: "Composition, pondérations sectorielles et géographiques",
      tools: [
        { name: "get_etf_holdings", desc: "Composition d'un ETF", example: "Holdings du SPY" },
        { name: "get_etf_sector_weightings", desc: "Répartition sectorielle", example: "Exposition sectorielle du QQQ" },
        { name: "get_etf_country_weightings", desc: "Répartition géographique", example: "Exposition pays du VTI" },
      ]
    },
    {
      id: "esg",
      icon: Building2,
      title: "ESG & Gouvernance",
      color: "from-lime-500 to-green-500",
      description: "Scores ESG, critères environnementaux et sociaux",
      tools: [
        { name: "get_esg_score", desc: "Score ESG (Environnement, Social, Gouvernance)", example: "Score ESG de Tesla" },
      ]
    },
    {
      id: "export",
      icon: FileText,
      title: "Export & Visualisation",
      color: "from-sky-500 to-blue-500",
      description: "Génération de graphiques, slides, PDF et exports",
      tools: [
        { name: "create_plot", desc: "Graphiques matplotlib/plotly personnalisés", example: "Crée un graphique de performance FAANG" },
        { name: "generate_slides", desc: "Slides Beamer LaTeX professionnelles (thème Metropolis)", example: "Génère des slides pour mon analyse" },
        { name: "export_pdf", desc: "Export en PDF de l'analyse", example: "Exporte cette analyse en PDF" },
        { name: "download_data", desc: "Téléchargement de données CSV/Excel", example: "Télécharge les données historiques en CSV" },
      ]
    },
    {
      id: "web-research",
      icon: Globe,
      title: "Recherche Web & Scraping",
      color: "from-cyan-500 to-teal-500",
      description: "Recherche web, scraping de sites, extraction de contenu",
      tools: [
        { name: "exa_search", desc: "Recherche sémantique avancée avec Exa AI", example: "Recherche sur le web : analyse de Tesla" },
        { name: "firecrawl_scrape", desc: "Scraping de pages web spécifiques", example: "Scrape la page investor relations d'Apple" },
        { name: "firecrawl_crawl", desc: "Crawl complet d'un site web", example: "Crawl le site de Bloomberg" },
        { name: "tavily_search", desc: "Recherche et agrégation avec Tavily", example: "Recherche actualités économiques récentes" },
      ]
    },
  ];

  const pythonFeatures = [
    { name: "📊 Graphiques Personnalisés", desc: "Créez des visualisations sur mesure avec matplotlib, seaborn ou plotly" },
    { name: "📈 Analyse de Séries Temporelles", desc: "ARIMA, Prophet, décomposition saisonnière" },
    { name: "🎲 Simulations Stochastiques", desc: "Monte Carlo, bootstrap, backtesting" },
    { name: "📉 Modèles de Volatilité", desc: "GARCH, EGARCH, GJR-GARCH" },
    { name: "💰 Gestion de Risque", desc: "VaR, CVaR, Expected Shortfall" },
    { name: "🎯 Optimisation", desc: "Portefeuille Markowitz, Black-Litterman" },
    { name: "🔢 Calculs Personnalisés", desc: "N'importe quel calcul financier avec pandas, numpy, scipy" },
  ];

  const useCases = [
    {
      title: "Analyse Complète d'une Action",
      icon: TrendingUp,
      example: 'Fais une analyse ultra complète de Tesla : états financiers, métriques, ratios, analyse technique, news récentes, insider trading, estimations d\'analystes',
      color: "text-blue-500"
    },
    {
      title: "Analyse de Portefeuille",
      icon: PieChart,
      example: 'Optimise un portefeuille avec AAPL, MSFT, GOOGL, AMZN et NVDA. Calcule les poids optimaux, le ratio Sharpe, et fais une simulation Monte Carlo sur 1 an',
      color: "text-purple-500"
    },
    {
      title: "Analyse de Risque",
      icon: AlertCircle,
      example: 'Calcule la Value-at-Risk à 95% pour un portefeuille 60% SPY / 40% TLT. Ajoute une analyse de stress test avec un scénario de crise',
      color: "text-red-500"
    },
    {
      title: "Analyse de Volatilité",
      icon: LineChart,
      example: 'Estime un modèle GARCH sur les rendements du Bitcoin. Prévois la volatilité pour les 30 prochains jours',
      color: "text-orange-500"
    },
    {
      title: "Valorisation d'Options",
      icon: Target,
      example: 'Calcule le prix d\'une option call sur Apple avec strike $200, expiration dans 30 jours. Montre tous les Greeks',
      color: "text-indigo-500"
    },
    {
      title: "Recherche Sectorielle",
      icon: Building2,
      example: 'Trouve les 10 entreprises tech avec le meilleur rendement de dividendes. Compare leurs ratios P/E et croissance',
      color: "text-emerald-500"
    },
    {
      title: "Analyse Macro",
      icon: Globe,
      example: 'Comment une surprise hawkish du FOMC affecte différents secteurs ? Analyse l\'impact historique sur tech, finance et utilities',
      color: "text-cyan-500"
    },
    {
      title: "Trading d'Initiés",
      icon: Users,
      example: 'Montre les dernières transactions d\'initiés pour NVDA. Y a-t-il des patterns ou signaux ?',
      color: "text-pink-500"
    },
  ];

  const advancedExamples = [
    {
      title: "Analyse Multi-Actions avec Python",
      code: `Crée un graphique de corrélation entre Apple, Microsoft, Google, Amazon et Meta sur les 2 dernières années. Calcule aussi la matrice de covariance.`,
      result: "Graphique matplotlib + matrice de covariance"
    },
    {
      title: "Backtesting de Stratégie",
      code: `Backtest une stratégie simple : achète quand RSI < 30, vends quand RSI > 70 sur Tesla depuis 2020. Calcule le rendement annualisé.`,
      result: "Performance, Sharpe ratio, drawdown"
    },
    {
      title: "Analyse de Surface de Volatilité",
      code: `Génère une surface de volatilité 3D pour les options Apple avec différents strikes et maturités.`,
      result: "Graphique 3D de la volatilité implicite"
    },
    {
      title: "Décomposition de Performance",
      code: `Décompose la performance du S&P 500 en : rendement du marché, contribution sectorielle, et effet devise.`,
      result: "Attribution de performance détaillée"
    },
  ];

  return (
    <div className="min-h-screen bg-background relative overflow-hidden" data-testid="page-documentation">
      {/* Subtle Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.03),transparent_70%)]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="container flex h-14 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-3 md:gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/')}
              className="hover:bg-muted transition-colors gap-2"
              data-testid="button-back-to-home"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline font-medium">Retour</span>
            </Button>
            <button
              className="cursor-pointer"
              onClick={() => setLocation('/')}
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-5 h-5 text-primary" />
                <div className="hidden md:flex items-baseline gap-1.5">
                  <span className="text-base font-bold text-foreground leading-tight">
                    VQuant
                  </span>
                </div>
              </div>
            </button>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <div className="h-8 w-px bg-border/50" />
            <ThemeColorPicker />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 md:py-12 lg:py-20 max-w-7xl relative z-10">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 md:mb-20"
        >
          <div className="inline-flex items-center justify-center p-3 md:p-4 rounded-3xl bg-gradient-to-br from-blue-500/20 via-cyan-500/20 to-primary/20 backdrop-blur-md border-2 border-blue-500/30 shadow-2xl shadow-blue-500/20 mb-6 md:mb-8">
            <Rocket className="w-12 h-12 md:w-16 md:h-16 text-blue-500 drop-shadow-[0_0_12px_rgba(59,130,246,0.6)]" />
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-black mb-4 md:mb-6 bg-gradient-to-r from-blue-500 via-cyan-500 to-primary bg-clip-text text-transparent tracking-tight leading-tight">
            Documentation Complète
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl text-muted-foreground mb-4 md:mb-6 max-w-3xl mx-auto leading-relaxed">
            Découvrez toutes les capacités de VQuant - Plus de 200 outils financiers et analyses quantitatives à votre disposition.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3">
            <Badge className="px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm bg-gradient-to-r from-blue-500 to-cyan-500 border-0">
              <Sparkles className="w-3 h-3 md:w-4 md:h-4 mr-2" />
              Claude Sonnet 4.5
            </Badge>
            <Badge variant="outline" className="px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm">
              200+ Outils FMP
            </Badge>
            <Badge variant="outline" className="px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm">
              Python Intégré
            </Badge>
            <Badge variant="outline" className="px-3 md:px-4 py-1.5 md:py-2 text-xs md:text-sm">
              Temps Réel
            </Badge>
          </div>
        </motion.div>

        {/* Quick Start Examples */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-12 md:mb-20"
        >
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-black mb-3 md:mb-4 text-center">Exemples d'Utilisation</h2>
          <p className="text-center text-muted-foreground mb-8 md:mb-12 text-base md:text-lg">
            Demandez simplement ce que vous voulez analyser - l'IA s'occupe du reste
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {useCases.map((useCase, index) => {
              const Icon = useCase.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: 0.3 + index * 0.05 }}
                >
                  <Card className="h-full hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/50 group cursor-pointer">
                    <CardHeader className="pb-3">
                      <Icon className={`w-8 h-8 md:w-10 md:h-10 ${useCase.color} mb-3`} />
                      <CardTitle className="text-base md:text-lg mb-2">{useCase.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs md:text-sm text-muted-foreground italic leading-relaxed">
                        "{useCase.example}"
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* All Tools by Category - With Accordions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-12 md:mb-20"
        >
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-black mb-3 md:mb-4 text-center">Tous les Outils Disponibles</h2>
          <p className="text-center text-muted-foreground mb-8 md:mb-12 text-base md:text-lg max-w-3xl mx-auto">
            Plus de 200 outils organisés par catégorie. Cliquez pour explorer chaque section.
          </p>

          <Accordion type="multiple" className="space-y-4">
            {categories.map((category, index) => {
              const Icon = category.icon;
              return (
                <AccordionItem
                  key={category.id}
                  value={category.id}
                  className="border-2 rounded-2xl px-4 md:px-6 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-all duration-300"
                >
                  <AccordionTrigger className="hover:no-underline py-4 md:py-6">
                    <div className="flex items-center gap-3 md:gap-4 text-left">
                      <div className={`p-2 md:p-3 rounded-xl bg-gradient-to-br ${category.color} flex-shrink-0`}>
                        <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-base md:text-lg lg:text-xl font-bold mb-1">{category.title}</h3>
                        <p className="text-xs md:text-sm text-muted-foreground">{category.description}</p>
                      </div>
                      <Badge variant="secondary" className="ml-auto text-xs md:text-sm">
                        {category.tools.length} outils
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 pb-6">
                    <div className="grid sm:grid-cols-2 gap-3 md:gap-4 mt-4">
                      {category.tools.map((tool, toolIndex) => (
                        <Card key={toolIndex} className="hover:shadow-lg transition-all duration-200 border hover:border-primary/30">
                          <CardHeader className="p-3 md:p-4">
                            <CardTitle className="text-sm md:text-base font-semibold text-primary mb-1">
                              {tool.name}
                            </CardTitle>
                            <CardDescription className="text-xs md:text-sm leading-relaxed">
                              {tool.desc}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="p-3 md:p-4 pt-0">
                            <div className="bg-muted/50 rounded-lg p-2 md:p-3 border border-border/50">
                              <p className="text-xs md:text-sm italic text-muted-foreground">
                                💬 "{tool.example}"
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </motion.div>

        {/* Python Custom Code Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mb-12 md:mb-20"
        >
          <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 via-background to-purple-500/5 shadow-2xl">
            <CardHeader className="text-center pb-6 md:pb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-primary to-purple-500 mx-auto mb-4 md:mb-6">
                <Code className="w-7 h-7 md:w-8 md:h-8 text-white" />
              </div>
              <CardTitle className="text-2xl md:text-3xl lg:text-4xl font-black mb-3 md:mb-4">
                Code Python Libre
              </CardTitle>
              <CardDescription className="text-base md:text-lg max-w-3xl mx-auto">
                Exécutez n'importe quel code Python pour des analyses personnalisées.
                Utilisez pandas, numpy, scipy, matplotlib, statsmodels et plus encore.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 md:space-y-8">
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {pythonFeatures.map((feature, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 md:p-4 rounded-xl bg-background/80 border-2 border-primary/10 hover:border-primary/30 transition-all duration-200">
                    <div className="text-xl md:text-2xl">{feature.name.split(' ')[0]}</div>
                    <div>
                      <div className="font-semibold text-sm md:text-base mb-1">{feature.name.substring(3)}</div>
                      <div className="text-xs md:text-sm text-muted-foreground">{feature.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-muted/30 rounded-xl p-4 md:p-6 border-2 border-dashed border-primary/20">
                <h4 className="font-bold text-base md:text-lg mb-4 flex items-center gap-2">
                  <Code className="w-5 h-5 text-primary" />
                  Exemples Avancés
                </h4>
                <div className="space-y-4">
                  {advancedExamples.map((ex, i) => (
                    <div key={i} className="bg-background rounded-lg p-3 md:p-4 border">
                      <div className="font-semibold text-sm md:text-base mb-2 text-primary">{ex.title}</div>
                      <div className="bg-muted/50 rounded p-2 md:p-3 mb-2 font-mono text-xs md:text-sm">
                        {ex.code}
                      </div>
                      <div className="text-xs md:text-sm text-muted-foreground flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">Résultat</Badge>
                        {ex.result}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* How It Works */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mb-12 md:mb-20"
        >
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-black mb-3 md:mb-4 text-center">Comment ça marche ?</h2>
          <p className="text-center text-muted-foreground mb-8 md:mb-12 text-base md:text-lg">
            Un processus simple en 3 étapes
          </p>
          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {[
              {
                step: "1",
                title: "Posez votre question",
                desc: "Décrivez simplement ce que vous voulez analyser en langage naturel",
                icon: Sparkles,
                color: "from-blue-500 to-cyan-500"
              },
              {
                step: "2",
                title: "L'IA travaille pour vous",
                desc: "Claude sélectionne et utilise automatiquement les meilleurs outils pour répondre",
                icon: BrainCircuit,
                color: "from-purple-500 to-pink-500"
              },
              {
                step: "3",
                title: "Recevez l'analyse",
                desc: "Obtenez une réponse structurée avec graphiques, données et insights",
                icon: BarChart3,
                color: "from-green-500 to-emerald-500"
              }
            ].map((step, i) => {
              const Icon = step.icon;
              return (
                <Card key={i} className="text-center border-2 hover:shadow-2xl transition-all duration-300">
                  <CardHeader>
                    <div className="mx-auto mb-4">
                      <div className={`inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br ${step.color} p-[2px]`}>
                        <div className="w-full h-full bg-background rounded-[14px] flex items-center justify-center">
                          <Icon className="w-7 h-7 md:w-9 md:h-9 text-primary" />
                        </div>
                      </div>
                    </div>
                    <div className={`inline-flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br ${step.color} text-white font-black text-lg md:text-xl mb-3 md:mb-4 mx-auto`}>
                      {step.step}
                    </div>
                    <CardTitle className="text-lg md:text-xl mb-2 md:mb-3">{step.title}</CardTitle>
                    <CardDescription className="text-sm md:text-base leading-relaxed">
                      {step.desc}
                    </CardDescription>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </motion.div>

        {/* API Coverage */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mb-12 md:mb-20"
        >
          <Card className="border-2 border-green-500/30 bg-gradient-to-br from-green-500/5 via-background to-emerald-500/5">
            <CardHeader className="text-center">
              <Database className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-4 md:mb-6 text-green-500" />
              <CardTitle className="text-2xl md:text-3xl font-bold mb-3">Couverture API Complète</CardTitle>
              <CardDescription className="text-base md:text-lg max-w-3xl mx-auto">
                VQuant s'intègre avec les meilleures sources de données financières
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {[
                  { name: "Financial Modeling Prep", endpoints: "200+", icon: Database, color: "text-blue-500" },
                  { name: "Exa AI Search", endpoints: "Recherche sémantique", icon: Search, color: "text-purple-500" },
                  { name: "Firecrawl", endpoints: "Web scraping", icon: Globe, color: "text-green-500" },
                  { name: "Tavily", endpoints: "Agrégation news", icon: Newspaper, color: "text-orange-500" },
                ].map((api, i) => {
                  const Icon = api.icon;
                  return (
                    <div key={i} className="text-center p-4 md:p-6 rounded-xl bg-background/80 border-2 hover:border-primary/30 transition-all">
                      <Icon className={`w-10 h-10 md:w-12 md:h-12 mx-auto mb-3 md:mb-4 ${api.color}`} />
                      <div className="font-bold text-sm md:text-base mb-1">{api.name}</div>
                      <div className="text-xs md:text-sm text-muted-foreground">{api.endpoints}</div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
        >
          <Card className="border-2 border-primary/50 bg-gradient-to-br from-primary/10 via-background to-blue-500/10 shadow-2xl">
            <CardContent className="p-8 md:p-12 text-center">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-black mb-3 md:mb-4 bg-gradient-to-r from-primary via-blue-500 to-cyan-500 bg-clip-text text-transparent">
                Prêt à Explorer ?
              </h2>
              <p className="text-base md:text-lg text-muted-foreground mb-6 md:mb-8 max-w-2xl mx-auto">
                Posez simplement votre question financière et laissez l'IA faire le travail.
                Analyses complètes, données en temps réel, et insights puissants en quelques secondes.
              </p>
              <Button
                size="lg"
                onClick={() => setLocation('/')}
                className="h-12 md:h-14 px-6 md:px-8 text-base md:text-lg bg-primary hover:bg-primary/90 text-primary-foreground transition-colors"
              >
                <Sparkles className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                Commencer une Analyse
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
