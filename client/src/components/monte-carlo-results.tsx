import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { TrendingUp, Code2, BarChart3, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface MonteCarloResultsProps {
  pythonCode?: string;
  results?: {
    success: boolean;
    parameters?: {
      num_simulations: number;
      time_horizon: number;
      initial_investment: number;
      mean_return: number;
      std_return: number;
    };
    statistics?: {
      mean_final_value: number;
      median_final_value: number;
      std_final_value: number;
      min_final_value: number;
      max_final_value: number;
      percentile_5: number;
      percentile_25: number;
      percentile_75: number;
      percentile_95: number;
      probability_of_profit: number;
    };
  };
}

export function MonteCarloResults({ pythonCode, results }: MonteCarloResultsProps) {
  if (!pythonCode && !results) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-5xl mx-auto"
      data-testid="monte-carlo-results"
    >
      <Card className="border-primary/20 shadow-lg">
        <CardHeader className="gap-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <CardTitle className="text-xl">Simulation Monte Carlo</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Analyse de risque et projection des rendements futurs
          </p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="results" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4" data-testid="tabs-monte-carlo">
              <TabsTrigger value="results" data-testid="tab-results">
                <TrendingUp className="w-4 h-4 mr-2" />
                Résultats
              </TabsTrigger>
              <TabsTrigger value="code" data-testid="tab-code">
                <Code2 className="w-4 h-4 mr-2" />
                Code Python
              </TabsTrigger>
            </TabsList>

            <TabsContent value="results" data-testid="content-results">
              {results?.success && results.statistics && results.parameters ? (
                <div className="space-y-6">
                  {/* Parameters */}
                  <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                    <h3 className="font-semibold text-sm text-muted-foreground mb-3">Paramètres de simulation</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="space-y-1" data-testid="param-simulations">
                        <p className="text-xs text-muted-foreground">Simulations</p>
                        <p className="text-sm font-medium">{results.parameters.num_simulations.toLocaleString()}</p>
                      </div>
                      <div className="space-y-1" data-testid="param-horizon">
                        <p className="text-xs text-muted-foreground">Horizon (jours)</p>
                        <p className="text-sm font-medium">{results.parameters.time_horizon}</p>
                      </div>
                      <div className="space-y-1" data-testid="param-investment">
                        <p className="text-xs text-muted-foreground">Investissement initial</p>
                        <p className="text-sm font-medium">{formatCurrency(results.parameters.initial_investment)}</p>
                      </div>
                      <div className="space-y-1" data-testid="param-volatility">
                        <p className="text-xs text-muted-foreground">Volatilité</p>
                        <p className="text-sm font-medium">{formatPercent(results.parameters.std_return * 100)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Key Statistics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card data-testid="stat-mean">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-2 mb-2">
                          <DollarSign className="w-4 h-4 text-primary" />
                          <p className="text-sm text-muted-foreground">Valeur moyenne</p>
                        </div>
                        <p className="text-2xl font-bold">{formatCurrency(results.statistics.mean_final_value)}</p>
                      </CardContent>
                    </Card>
                    
                    <Card data-testid="stat-median">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-2 mb-2">
                          <DollarSign className="w-4 h-4 text-primary" />
                          <p className="text-sm text-muted-foreground">Valeur médiane</p>
                        </div>
                        <p className="text-2xl font-bold">{formatCurrency(results.statistics.median_final_value)}</p>
                      </CardContent>
                    </Card>

                    <Card data-testid="stat-profit-prob">
                      <CardContent className="pt-6">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="w-4 h-4 text-primary" />
                          <p className="text-sm text-muted-foreground">Probabilité de profit</p>
                        </div>
                        <p className="text-2xl font-bold">{formatPercent(results.statistics.probability_of_profit)}</p>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Percentiles */}
                  <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                    <h3 className="font-semibold text-sm text-muted-foreground mb-3">Distribution des résultats</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center" data-testid="percentile-5">
                        <span className="text-sm text-muted-foreground">5e percentile (pire scénario probable)</span>
                        <Badge variant="outline">{formatCurrency(results.statistics.percentile_5)}</Badge>
                      </div>
                      <div className="flex justify-between items-center" data-testid="percentile-25">
                        <span className="text-sm text-muted-foreground">25e percentile</span>
                        <Badge variant="outline">{formatCurrency(results.statistics.percentile_25)}</Badge>
                      </div>
                      <div className="flex justify-between items-center" data-testid="percentile-75">
                        <span className="text-sm text-muted-foreground">75e percentile</span>
                        <Badge variant="outline">{formatCurrency(results.statistics.percentile_75)}</Badge>
                      </div>
                      <div className="flex justify-between items-center" data-testid="percentile-95">
                        <span className="text-sm text-muted-foreground">95e percentile (meilleur scénario probable)</span>
                        <Badge variant="outline">{formatCurrency(results.statistics.percentile_95)}</Badge>
                      </div>
                    </div>
                  </div>

                  {/* Range */}
                  <div className="bg-muted/30 rounded-lg p-4">
                    <h3 className="font-semibold text-sm text-muted-foreground mb-3">Plage de résultats</h3>
                    <div className="flex justify-between items-center">
                      <div className="text-center" data-testid="min-value">
                        <p className="text-xs text-muted-foreground mb-1">Minimum</p>
                        <p className="text-sm font-medium">{formatCurrency(results.statistics.min_final_value)}</p>
                      </div>
                      <div className="flex-1 mx-4">
                        <div className="h-2 bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 rounded-full" />
                      </div>
                      <div className="text-center" data-testid="max-value">
                        <p className="text-xs text-muted-foreground mb-1">Maximum</p>
                        <p className="text-sm font-medium">{formatCurrency(results.statistics.max_final_value)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Aucun résultat disponible
                </div>
              )}
            </TabsContent>

            <TabsContent value="code" data-testid="content-code">
              {pythonCode ? (
                <div className="relative">
                  <div className="absolute top-2 right-2 z-10">
                    <Badge variant="outline" className="text-xs">
                      Python
                    </Badge>
                  </div>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm font-mono" data-testid="python-code-block">
                    <code className="text-foreground">{pythonCode}</code>
                  </pre>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Aucun code disponible
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </motion.div>
  );
}
