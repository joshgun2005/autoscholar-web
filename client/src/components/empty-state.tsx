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
import { motion, AnimatePresence } from "framer-motion";

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

// Couleurs pour chaque catégorie
const CATEGORY_COLORS = [
  { from: "from-blue-500", to: "to-cyan-500", bg: "bg-blue-500/10", border: "border-blue-500/20", hover: "hover:border-blue-500/50" },
  { from: "from-green-500", to: "to-emerald-500", bg: "bg-green-500/10", border: "border-green-500/20", hover: "hover:border-green-500/50" },
  { from: "from-cyan-500", to: "to-blue-500", bg: "bg-cyan-500/10", border: "border-cyan-500/20", hover: "hover:border-cyan-500/50" },
  { from: "from-amber-500", to: "to-orange-500", bg: "bg-amber-500/10", border: "border-amber-500/20", hover: "hover:border-amber-500/50" },
  { from: "from-rose-500", to: "to-red-500", bg: "bg-rose-500/10", border: "border-rose-500/20", hover: "hover:border-rose-500/50" },
  { from: "from-blue-600", to: "to-cyan-600", bg: "bg-blue-600/10", border: "border-blue-600/20", hover: "hover:border-blue-600/50" },
  { from: "from-teal-500", to: "to-cyan-500", bg: "bg-teal-500/10", border: "border-teal-500/20", hover: "hover:border-teal-500/50" },
  { from: "from-slate-500", to: "to-gray-500", bg: "bg-slate-500/10", border: "border-slate-500/20", hover: "hover:border-slate-500/50" },
  { from: "from-cyan-400", to: "to-blue-400", bg: "bg-cyan-400/10", border: "border-cyan-400/20", hover: "hover:border-cyan-400/50" },
  { from: "from-red-500", to: "to-rose-500", bg: "bg-red-500/10", border: "border-red-500/20", hover: "hover:border-red-500/50" },
  { from: "from-sky-500", to: "to-blue-500", bg: "bg-sky-500/10", border: "border-sky-500/20", hover: "hover:border-sky-500/50" },
  { from: "from-lime-500", to: "to-green-500", bg: "bg-lime-500/10", border: "border-lime-500/20", hover: "hover:border-lime-500/50" },
  { from: "from-orange-500", to: "to-amber-500", bg: "bg-orange-500/10", border: "border-orange-500/20", hover: "hover:border-orange-500/50" },
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

  const categoryColor = selectedCategoryIndex !== null
    ? CATEGORY_COLORS[selectedCategoryIndex % CATEGORY_COLORS.length]
    : null;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 animate-fade-in">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        className="text-center space-y-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          className="relative inline-flex items-center gap-3 md:gap-4 mb-4 px-4 md:px-6 py-3 md:py-4 rounded-2xl md:rounded-3xl bg-gradient-to-br from-primary/10 via-blue-500/10 to-purple-500/10 backdrop-blur-md border-2 border-primary/30 shadow-xl md:shadow-2xl shadow-primary/20"
        >
          {/* Logo Icon Container */}
          <div className="relative">
            <div className="relative p-2 md:p-3 rounded-xl md:rounded-2xl bg-gradient-to-br from-primary/20 to-blue-500/20 border-2 border-primary/40">
              <Sparkles className="w-8 h-8 md:w-10 md:h-10 text-primary animate-pulse-glow drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
              <div className="absolute inset-0 blur-xl md:blur-2xl bg-primary/50 -z-10 animate-pulse" />
            </div>
            <div className="absolute -inset-1 md:-inset-2 blur-2xl md:blur-3xl bg-gradient-to-br from-primary/40 via-blue-500/40 to-purple-500/40 -z-20 rounded-2xl md:rounded-3xl" />
          </div>

          {/* Logo Text */}
          <div className="flex flex-col">
            <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-primary via-blue-500 to-purple-500 bg-clip-text text-transparent leading-tight tracking-tight">
              VibeQuant
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground/90 font-medium tracking-wide mt-0.5">
              Powered by AI • Financial Intelligence
            </p>
          </div>

          {/* Background glow effect */}
          <div className="absolute inset-0 blur-2xl md:blur-3xl bg-gradient-to-br from-primary/20 via-blue-500/20 to-purple-500/20 -z-10 rounded-2xl md:rounded-3xl" />
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-xl text-muted-foreground max-w-md"
        >
          Votre assistant d'analyse financière propulsé par l'IA
        </motion.p>
      </motion.div>

      <div className="w-full max-w-4xl space-y-6 px-4">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-3">
            Choisissez une catégorie pour découvrir des exemples de questions
          </p>
        </div>

        {/* Menu déroulant des catégories - Design Sharp */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="relative"
        >
          <Select onValueChange={handleCategoryChange}>
            <SelectTrigger className="group relative w-full h-[72px] text-base font-medium bg-gradient-to-br from-background via-background to-primary/5 border-2 border-primary/20 hover:border-primary/40 rounded-2xl transition-all duration-300 shadow-[0_8px_30px_rgba(0,0,0,0.12)] hover:shadow-[0_12px_40px_rgba(59,130,246,0.15)] hover:scale-[1.01] backdrop-blur-xl">
              <div className="flex items-center gap-3 px-2">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg shadow-primary/10">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <SelectValue placeholder="Sélectionnez une catégorie d'analyse..." />
              </div>
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            </SelectTrigger>

            <SelectContent className="w-[var(--radix-select-trigger-width)] max-h-[450px] bg-background/98 backdrop-blur-2xl border-2 border-primary/20 shadow-[0_20px_70px_rgba(0,0,0,0.3)] rounded-2xl p-2 overflow-hidden">
              <div className="px-4 py-3 mb-2 bg-gradient-to-br from-primary/10 to-primary/5 border-b border-primary/20 rounded-xl">
                <p className="text-xs font-bold text-primary uppercase tracking-wider">
                  {QUESTION_CATEGORIES.length} Catégories Disponibles
                </p>
              </div>

              {/* Liste des catégories */}
              <div className="space-y-1">
                {QUESTION_CATEGORIES.map((category, idx) => {
                  const Icon = category.icon;
                  const color = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
                  return (
                    <SelectItem
                      key={idx}
                      value={idx.toString()}
                      className="group cursor-pointer py-4 px-3 text-base rounded-xl transition-all duration-200 hover:bg-gradient-to-r hover:from-primary/10 hover:to-primary/5 hover:scale-[1.02] hover:shadow-lg focus:bg-gradient-to-r focus:from-primary/10 focus:to-primary/5 data-[state=checked]:bg-gradient-to-r data-[state=checked]:from-primary/15 data-[state=checked]:to-primary/10 data-[state=checked]:border-2 data-[state=checked]:border-primary/40 data-[state=checked]:shadow-lg data-[state=checked]:shadow-primary/20 data-[highlighted]:bg-gradient-to-r data-[highlighted]:from-primary/10 data-[highlighted]:to-primary/5 relative overflow-hidden"
                    >
                      <div className="flex items-center gap-3.5 relative z-10">
                        <div className={`relative p-2.5 rounded-xl ${color.bg} border-2 ${color.border} transition-all duration-300 group-hover:scale-110 group-hover:rotate-6 group-data-[state=checked]:scale-110 group-data-[state=checked]:rotate-6 shadow-lg shadow-black/5`}>
                          <Icon className="w-5 h-5" />
                          <div className={`absolute inset-0 rounded-xl blur-md opacity-50 ${color.bg} group-hover:opacity-80 transition-opacity duration-300`} />
                        </div>

                        <div className="flex flex-col flex-1">
                          <span className="font-bold text-foreground group-hover:text-primary transition-colors">
                            {category.category}
                          </span>
                          <span className="text-xs text-muted-foreground font-medium mt-0.5">
                            {category.questions.length} exemples de questions
                          </span>
                        </div>

                        <div className="opacity-0 group-data-[state=checked]:opacity-100 transition-opacity duration-200">
                          <div className="px-2.5 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-bold shadow-lg shadow-primary/30">
                            ✓
                          </div>
                        </div>
                      </div>

                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none translate-x-[-100%] group-hover:translate-x-[100%] group-hover:transition-transform group-hover:duration-700" />
                    </SelectItem>
                  );
                })}
              </div>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Questions de la catégorie sélectionnée */}
        <AnimatePresence mode="wait">
          {selectedCategory && categoryColor && (
            <motion.div
              key={selectedCategoryIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {/* En-tête de la catégorie */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
                className={`flex items-center gap-3 p-5 rounded-2xl glass border ${categoryColor.border} shadow-lg`}
              >
                {(() => {
                  const Icon = selectedCategory.icon;
                  return (
                    <div className={`p-3 rounded-2xl ${categoryColor.bg} border ${categoryColor.border}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                  );
                })()}
                <h3 className={`text-2xl font-bold bg-gradient-to-r ${categoryColor.from} ${categoryColor.to} bg-clip-text text-transparent`}>
                  {selectedCategory.category}
                </h3>
              </motion.div>

              {/* Grille de questions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedCategory.questions.map((question, qIdx) => (
                  <motion.button
                    key={qIdx}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: qIdx * 0.05, ease: [0.4, 0, 0.2, 1] }}
                    whileHover={{ scale: 1.03, y: -4 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => onQuestionClick?.(question)}
                    className={`
                      group relative p-5 text-left rounded-2xl
                      glass
                      border ${categoryColor.border} ${categoryColor.hover}
                      transition-all duration-300
                      shadow-md hover:shadow-2xl
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`
                        flex-shrink-0 w-9 h-9 rounded-2xl
                        ${categoryColor.bg} border ${categoryColor.border}
                        flex items-center justify-center
                        font-bold text-sm
                        group-hover:scale-110 group-hover:rotate-6 transition-all duration-300
                      `}>
                        {qIdx + 1}
                      </div>
                      <p className="flex-1 text-sm font-medium leading-relaxed group-hover:text-foreground transition-colors">
                        {question}
                      </p>
                    </div>

                    {/* Effet de brillance au survol */}
                    <div className={`
                      absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100
                      bg-gradient-to-r ${categoryColor.from} ${categoryColor.to}
                      transition-opacity duration-300 pointer-events-none
                    `} style={{ opacity: 0.05 }} />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
