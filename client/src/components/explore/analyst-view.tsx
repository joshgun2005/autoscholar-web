import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, TrendingDown, Award, Target, DollarSign, Users } from "lucide-react";

interface AnalystEstimate {
  date: string;
  symbol: string;
  estimatedRevenueAvg: number;
  estimatedRevenueLow: number;
  estimatedRevenueHigh: number;
  estimatedEbitdaAvg: number;
  estimatedEbitdaLow: number;
  estimatedEbitdaHigh: number;
  estimatedEbitAvg: number;
  estimatedEbitLow: number;
  estimatedEbitHigh: number;
  estimatedNetIncomeAvg: number;
  estimatedNetIncomeLow: number;
  estimatedNetIncomeHigh: number;
  estimatedSgaExpenseAvg: number;
  estimatedSgaExpenseLow: number;
  estimatedSgaExpenseHigh: number;
  estimatedEpsAvg: number;
  estimatedEpsLow: number;
  estimatedEpsHigh: number;
  numberAnalystEstimatedRevenue: number;
  numberAnalystsEstimatedEps: number;
}

interface DividendData {
  date: string;
  label: string;
  adjDividend: number;
  dividend: number;
  recordDate: string;
  paymentDate: string;
  declarationDate: string;
}

interface AnalystViewProps {
  analystEstimates?: AnalystEstimate[];
  dividends?: DividendData[];
}

export function AnalystView({ analystEstimates, dividends }: AnalystViewProps) {
  const formatCurrency = (value: number) => {
    if (!value) return "N/A";
    const absValue = Math.abs(value);
    if (absValue >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (absValue >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (absValue >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (absValue >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const estimateRows = [
    {
      label: "Revenu",
      avgKey: "estimatedRevenueAvg",
      lowKey: "estimatedRevenueLow",
      highKey: "estimatedRevenueHigh",
      analystKey: "numberAnalystEstimatedRevenue",
      isCurrency: true
    },
    {
      label: "EBITDA",
      avgKey: "estimatedEbitdaAvg",
      lowKey: "estimatedEbitdaLow",
      highKey: "estimatedEbitdaHigh",
      isCurrency: true
    },
    {
      label: "EBIT",
      avgKey: "estimatedEbitAvg",
      lowKey: "estimatedEbitLow",
      highKey: "estimatedEbitHigh",
      isCurrency: true
    },
    {
      label: "Revenu Net",
      avgKey: "estimatedNetIncomeAvg",
      lowKey: "estimatedNetIncomeLow",
      highKey: "estimatedNetIncomeHigh",
      isCurrency: true
    },
    {
      label: "Dépenses SG&A",
      avgKey: "estimatedSgaExpenseAvg",
      lowKey: "estimatedSgaExpenseLow",
      highKey: "estimatedSgaExpenseHigh",
      isCurrency: true
    },
    {
      label: "BPA",
      avgKey: "estimatedEpsAvg",
      lowKey: "estimatedEpsLow",
      highKey: "estimatedEpsHigh",
      analystKey: "numberAnalystsEstimatedEps",
      isEPS: true
    },
  ];

  return (
    <div className="space-y-6">
      {/* Analyst Estimates */}
      {analystEstimates && analystEstimates.length > 0 ? (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Estimations des Analystes
                </CardTitle>
                <CardDescription>
                  Prévisions consensuelles et fourchettes d'estimations
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {analystEstimates[0]?.numberAnalystsEstimatedEps || 'N/A'} analystes
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Métrique</TableHead>
                    {analystEstimates.slice(0, 4).map((item, idx) => (
                      <TableHead key={idx} className="text-center min-w-[200px]">
                        <div>
                          <div className="font-semibold">{formatDate(item.date)}</div>
                          {item.numberAnalystEstimatedRevenue > 0 && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {item.numberAnalystEstimatedRevenue} analystes
                            </div>
                          )}
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {estimateRows.map((row, rowIdx) => (
                    <TableRow key={rowIdx} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Target className="w-4 h-4 text-muted-foreground" />
                          {row.label}
                        </div>
                      </TableCell>
                      {analystEstimates.slice(0, 4).map((item, idx) => {
                        const avg = item[row.avgKey];
                        const low = item[row.lowKey];
                        const high = item[row.highKey];

                        return (
                          <TableCell key={idx} className="text-center">
                            <div className="space-y-1">
                              <div className="font-bold text-lg">
                                {row.isCurrency ? formatCurrency(avg) : row.isEPS ? `$${avg?.toFixed(2) || 'N/A'}` : avg || 'N/A'}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Fourchette:
                              </div>
                              <div className="flex items-center justify-center gap-2 text-sm">
                                <span className="text-red-500 font-semibold">
                                  {row.isCurrency ? formatCurrency(low) : row.isEPS ? `$${low?.toFixed(2) || 'N/A'}` : low || 'N/A'}
                                </span>
                                <span className="text-muted-foreground">-</span>
                                <span className="text-green-500 font-semibold">
                                  {row.isCurrency ? formatCurrency(high) : row.isEPS ? `$${high?.toFixed(2) || 'N/A'}` : high || 'N/A'}
                                </span>
                              </div>
                            </div>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Estimations des Analystes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Aucune estimation d'analyste disponible</p>
          </CardContent>
        </Card>
      )}

      {/* Dividend History */}
      {dividends && dividends.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Historique des Dividendes
            </CardTitle>
            <CardDescription>
              Paiements de dividendes et dates importantes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date Ex-Dividend</TableHead>
                    <TableHead>Libellé</TableHead>
                    <TableHead className="text-right">Dividende</TableHead>
                    <TableHead className="text-right">Dividende Ajusté</TableHead>
                    <TableHead>Date d'Enregistrement</TableHead>
                    <TableHead>Date de Paiement</TableHead>
                    <TableHead>Date de Déclaration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dividends.slice(0, 20).map((dividend, idx) => (
                    <TableRow key={idx} className="hover:bg-muted/50">
                      <TableCell className="font-semibold">
                        {formatDate(dividend.date)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{dividend.label}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-green-600">
                        ${dividend.dividend?.toFixed(4)}
                      </TableCell>
                      <TableCell className="text-right">
                        ${dividend.adjDividend?.toFixed(4)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {dividend.recordDate ? formatDate(dividend.recordDate) : 'N/A'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {dividend.paymentDate ? formatDate(dividend.paymentDate) : 'N/A'}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {dividend.declarationDate ? formatDate(dividend.declarationDate) : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {dividends.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Total Paiements</div>
                    <div className="text-lg font-bold">{dividends.length}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Dernier Dividende</div>
                    <div className="text-lg font-bold text-green-600">
                      ${dividends[0]?.dividend?.toFixed(4)}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Dividende Annuel (TTM)</div>
                    <div className="text-lg font-bold">
                      ${dividends.slice(0, 4).reduce((sum, d) => sum + (d.dividend || 0), 0).toFixed(4)}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Historique des Dividendes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Cette entreprise ne verse pas de dividendes</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
