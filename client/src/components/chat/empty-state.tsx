import { useState } from "react";
import {
  TrendingUp, LineChart, DollarSign, PieChart, Sparkles,
  BarChart3, Activity, TrendingDown, Calculator, Target,
  Building2, Newspaper, Users, Globe, Coins, Gauge
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AnimatePresence, motion } from "framer-motion";

interface EmptyStateProps {
  onQuestionClick?: (question: string) => void;
}

const QUESTION_CATEGORIES = [
  {
    category: "Analyse Fondamentale",
    icon: Building2,
    questions: [
      "Analyse complète d'Apple (AAPL)",
      "Profil et métriques clés de Microsoft (MSFT)",
      "Bilan financier et ratios de Tesla",
      "États financiers complets de Google (GOOGL)",
      "Croissance des revenus d'Amazon sur 5 ans",
      "Flux de trésorerie de Meta (META)",
      "Santé financière et ratios clés de Netflix",
    ]
  },
  {
    category: "Analyse Technique",
    icon: Activity,
    questions: [
      "Indicateurs techniques RSI et MACD pour Tesla",
      "Moyennes mobiles EMA et SMA pour AAPL",
      "Analyse ADX et tendance de NVIDIA",
      "Stochastique et Williams %R pour AMD",
      "Tous les indicateurs techniques pour SPY",
      "Analyse technique complète de Bitcoin",
      "Points d'entrée et sortie pour Amazon",
    ]
  },
  {
    category: "Performance et Historique",
    icon: LineChart,
    questions: [
      "Performance de Tesla sur l'année",
      "Historique des prix Apple sur 5 ans",
      "Comparaison AAPL vs MSFT sur 2 ans",
      "Performance du S&P 500 ce trimestre",
      "Évolution du NASDAQ depuis janvier",
      "Historique intraday de NVDA aujourd'hui",
      "Performance des FAANG cette année",
    ]
  },
  {
    category: "Dividendes et Actions Corporate",
    icon: DollarSign,
    questions: [
      "Historique des dividendes Microsoft",
      "Rendement des dividendes de Coca-Cola",
      "Splits d'actions d'Apple historique",
      "Rachats d'actions et dividendes de JPMorgan",
      "Entreprises avec les meilleurs dividendes en technologie",
      "Calendrier des dividendes pour ce mois",
    ]
  },
  {
    category: "Résultats et Estimations",
    icon: Target,
    questions: [
      "Prochains résultats trimestriels d'Apple",
      "Surprises de résultats pour Tesla Q3",
      "Estimations des analystes pour NVIDIA",
      "Calendrier des résultats cette semaine",
      "Objectifs de prix des analystes pour Meta",
      "Révisions à la hausse ou baisse pour Amazon",
    ]
  },
  {
    category: "Actualités et Événements",
    icon: Newspaper,
    questions: [
      "Dernières nouvelles sur Tesla",
      "Communiqués de presse Apple cette semaine",
      "Actualités économiques du jour",
      "Calendrier économique de la semaine",
      "Prochaines IPO à surveiller",
      "Événements importants en finance cette semaine",
    ]
  },
  {
    category: "Trading d'Initiés et Institutionnel",
    icon: Users,
    questions: [
      "Trading d'initiés récent pour Apple",
      "Achats d'actions par les dirigeants de Tesla",
      "Trading des membres du Congrès ce mois",
      "Positions institutionnelles dans NVIDIA",
      "Changements de participations dans Meta",
    ]
  },
  {
    category: "Marchés Globaux",
    icon: Globe,
    questions: [
      "Taux de change EUR/USD aujourd'hui",
      "Prix des commodités or et pétrole",
      "Taux du Trésor américain actuels",
      "Performance des indices mondiaux",
      "Analyse du marché Forex majeurs",
      "COT Report pour le pétrole",
    ]
  },
  {
    category: "Gestion de Portefeuille",
    icon: PieChart,
    questions: [
      "Optimiser portefeuille AAPL, MSFT, GOOGL",
      "Allocation optimale pour tech stocks",
      "Diversification avec 10 actions",
      "Frontière efficiente pour mon portefeuille",
      "Ratio risque/rendement optimal",
    ]
  },
  {
    category: "Analyse de Risque",
    icon: TrendingDown,
    questions: [
      "Value at Risk (VaR) pour Tesla",
      "Volatilité GARCH de Bitcoin",
      "Métriques de risque pour mon portefeuille",
      "Drawdown maximum de NVIDIA",
      "Corrélations entre FAANG stocks",
      "Beta et volatilité d'Amazon",
    ]
  },
  {
    category: "Simulations et Prévisions",
    icon: BarChart3,
    questions: [
      "Simulation Monte Carlo NVDA $100k",
      "Projection de croissance Apple 5 ans",
      "Scénarios d'investissement Tesla",
      "Simulation de portefeuille diversifié",
      "Prévisions basées sur tendances historiques",
    ]
  },
  {
    category: "Options et Dérivés",
    icon: Calculator,
    questions: [
      "Prix d'option call Apple strike 180",
      "Stratégie d'options pour Tesla",
      "Surface de volatilité implicite NVDA",
      "Greeks pour options Microsoft",
      "Valorisation Black-Scholes pour call",
    ]
  },
  {
    category: "Screener et Comparaisons",
    icon: Gauge,
    questions: [
      "Meilleures actions tech par P/E ratio",
      "Compagnies similaires à Apple",
      "Screener: dividendes > 3% et P/E < 15",
      "Top 10 actions momentum ce mois",
      "Comparaison des géants tech FAANG",
    ]
  },
];

export function EmptyState({ onQuestionClick }: EmptyStateProps) {
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState<number | null>(null);

  const handleCategoryChange = (value: string) => {
    const index = parseInt(value);
    setSelectedCategoryIndex(index);
  };

  const selectedCategory = selectedCategoryIndex !== null
    ? QUESTION_CATEGORIES[selectedCategoryIndex]
    : null;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 animate-fade-in">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Sparkles className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">
            VibeQuant
          </h1>
        </div>
        <p className="text-lg text-muted-foreground max-w-md">
          Votre assistant d'analyse financière propulsé par l'IA
        </p>
      </div>

      <div className="w-full max-w-4xl space-y-6 px-4">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-3">
            Choisissez une catégorie pour découvrir des exemples de questions
          </p>
        </div>

        {/* Category dropdown */}
        <div>
          <Select onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-full h-12 text-base font-medium bg-card border border-border rounded-lg transition-colors hover:border-primary/40">
              <div className="flex items-center gap-3 px-1">
                <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
                <SelectValue placeholder="Sélectionnez une catégorie d'analyse..." />
              </div>
            </SelectTrigger>

            <SelectContent className="w-[var(--radix-select-trigger-width)] max-h-[450px] bg-card border border-border rounded-lg p-1">
              <div className="px-3 py-2 mb-1 border-b border-border">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {QUESTION_CATEGORIES.length} Catégories Disponibles
                </p>
              </div>

              <div className="space-y-0.5">
                {QUESTION_CATEGORIES.map((category, idx) => {
                  const Icon = category.icon;
                  return (
                    <SelectItem
                      key={idx}
                      value={idx.toString()}
                      className="cursor-pointer py-3 px-3 text-base rounded-md transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-1.5 rounded-md bg-primary/10 border border-primary/20">
                          <Icon className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex flex-col flex-1">
                          <span className="font-medium text-foreground">
                            {category.category}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {category.questions.length} exemples
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  );
                })}
              </div>
            </SelectContent>
          </Select>
        </div>

        {/* Questions for selected category */}
        <AnimatePresence mode="wait">
          {selectedCategory && (
            <motion.div
              key={selectedCategoryIndex}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Category header */}
              <div className="flex items-center gap-3 p-4 rounded-lg bg-card border border-border">
                {(() => {
                  const Icon = selectedCategory.icon;
                  return (
                    <div className="p-2 rounded-md bg-primary/10 border border-primary/20">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                  );
                })()}
                <h3 className="text-xl font-bold text-foreground">
                  {selectedCategory.category}
                </h3>
              </div>

              {/* Questions grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedCategory.questions.map((question, qIdx) => (
                  <button
                    key={qIdx}
                    onClick={() => onQuestionClick?.(question)}
                    className="group p-4 text-left rounded-lg bg-card border border-border hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-7 h-7 rounded-md bg-muted flex items-center justify-center font-medium text-sm text-muted-foreground">
                        {qIdx + 1}
                      </div>
                      <p className="flex-1 text-sm font-medium leading-relaxed group-hover:text-foreground transition-colors">
                        {question}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
