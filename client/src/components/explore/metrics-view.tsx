import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Percent,
  TrendingUpDown,
  Calculator,
  PieChart,
  Activity
} from "lucide-react";

interface KeyMetrics {
  date: string;
  symbol: string;
  period: string;
  revenuePerShare: number;
  netIncomePerShare: number;
  operatingCashFlowPerShare: number;
  freeCashFlowPerShare: number;
  cashPerShare: number;
  bookValuePerShare: number;
  tangibleBookValuePerShare: number;
  shareholdersEquityPerShare: number;
  interestDebtPerShare: number;
  marketCap: number;
  enterpriseValue: number;
  peRatio: number;
  priceToSalesRatio: number;
  pocfratio: number;
  pfcfRatio: number;
  pbRatio: number;
  ptbRatio: number;
  evToSales: number;
  enterpriseValueOverEBITDA: number;
  evToOperatingCashFlow: number;
  evToFreeCashFlow: number;
  earningsYield: number;
  freeCashFlowYield: number;
  debtToEquity: number;
  debtToAssets: number;
  netDebtToEBITDA: number;
  currentRatio: number;
  interestCoverage: number;
  incomeQuality: number;
  dividendYield: number;
  payoutRatio: number;
  salesGeneralAndAdministrativeToRevenue: number;
  researchAndDdevelopementToRevenue: number;
  intangiblesToTotalAssets: number;
  capexToOperatingCashFlow: number;
  capexToRevenue: number;
  capexToDepreciation: number;
  stockBasedCompensationToRevenue: number;
  grahamNumber: number;
  roic: number;
  returnOnTangibleAssets: number;
  grahamNetNet: number;
  workingCapital: number;
  tangibleAssetValue: number;
  netCurrentAssetValue: number;
  investedCapital: number;
  averageReceivables: number;
  averagePayables: number;
  averageInventory: number;
  daysSalesOutstanding: number;
  daysPayablesOutstanding: number;
  daysOfInventoryOnHand: number;
  receivablesTurnover: number;
  payablesTurnover: number;
  inventoryTurnover: number;
  roe: number;
  capexPerShare: number;
  [key: string]: any;
}

interface MetricsViewProps {
  keyMetrics?: KeyMetrics[];
}

export function MetricsView({ keyMetrics }: MetricsViewProps) {
  const formatNumber = (value: number) => {
    if (!value) return "N/A";
    const absValue = Math.abs(value);
    if (absValue >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (absValue >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (absValue >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (absValue >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  const formatPercent = (value: number) => {
    if (!value && value !== 0) return "N/A";
    return `${(value * 100).toFixed(2)}%`;
  };

  const formatRatio = (value: number) => {
    if (!value && value !== 0) return "N/A";
    return value.toFixed(2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short'
    });
  };

  const getChangeIndicator = (current: number, previous: number) => {
    if (!current || !previous) return null;
    const change = ((current - previous) / Math.abs(previous)) * 100;
    const isPositive = change >= 0;

    return (
      <span className={`text-xs flex items-center gap-1 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
        {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {isPositive ? '+' : ''}{change.toFixed(1)}%
      </span>
    );
  };

  if (!keyMetrics || keyMetrics.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Métriques Clés</CardTitle>
          <CardDescription>Aucune donnée disponible</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const metricsSections = [
    {
      title: "Métriques de Valorisation",
      icon: <DollarSign className="w-5 h-5" />,
      description: "Ratios de valorisation et prix",
      metrics: [
        { label: "Capitalisation Boursière", key: "marketCap", format: "currency" },
        { label: "Valeur d'Entreprise", key: "enterpriseValue", format: "currency" },
        { label: "P/E Ratio", key: "peRatio", format: "ratio" },
        { label: "P/S Ratio", key: "priceToSalesRatio", format: "ratio" },
        { label: "P/B Ratio", key: "pbRatio", format: "ratio" },
        { label: "P/TBV Ratio", key: "ptbRatio", format: "ratio" },
        { label: "P/FCF Ratio", key: "pfcfRatio", format: "ratio" },
        { label: "EV/Sales", key: "evToSales", format: "ratio" },
        { label: "EV/EBITDA", key: "enterpriseValueOverEBITDA", format: "ratio" },
        { label: "EV/Operating CF", key: "evToOperatingCashFlow", format: "ratio" },
        { label: "EV/Free CF", key: "evToFreeCashFlow", format: "ratio" },
        { label: "Graham Number", key: "grahamNumber", format: "currency" },
      ]
    },
    {
      title: "Rentabilité & Rendements",
      icon: <TrendingUp className="w-5 h-5" />,
      description: "Indicateurs de rentabilité",
      metrics: [
        { label: "ROE (Return on Equity)", key: "roe", format: "percent" },
        { label: "ROIC (Return on Invested Capital)", key: "roic", format: "percent" },
        { label: "Return on Tangible Assets", key: "returnOnTangibleAssets", format: "percent" },
        { label: "Earnings Yield", key: "earningsYield", format: "percent" },
        { label: "Free Cash Flow Yield", key: "freeCashFlowYield", format: "percent" },
        { label: "Dividend Yield", key: "dividendYield", format: "percent" },
        { label: "Payout Ratio", key: "payoutRatio", format: "percent" },
        { label: "Income Quality", key: "incomeQuality", format: "ratio" },
      ]
    },
    {
      title: "Métriques par Action",
      icon: <PieChart className="w-5 h-5" />,
      description: "Données normalisées par action",
      metrics: [
        { label: "Revenu par Action", key: "revenuePerShare", format: "currency" },
        { label: "Bénéfice Net par Action", key: "netIncomePerShare", format: "currency" },
        { label: "Operating CF par Action", key: "operatingCashFlowPerShare", format: "currency" },
        { label: "Free CF par Action", key: "freeCashFlowPerShare", format: "currency" },
        { label: "Cash par Action", key: "cashPerShare", format: "currency" },
        { label: "Book Value par Action", key: "bookValuePerShare", format: "currency" },
        { label: "Tangible BV par Action", key: "tangibleBookValuePerShare", format: "currency" },
        { label: "Shareholders Equity par Action", key: "shareholdersEquityPerShare", format: "currency" },
        { label: "Capex par Action", key: "capexPerShare", format: "currency" },
      ]
    },
    {
      title: "Santé Financière & Dette",
      icon: <Calculator className="w-5 h-5" />,
      description: "Indicateurs de solvabilité et liquidité",
      metrics: [
        { label: "Dette/Capitaux Propres", key: "debtToEquity", format: "ratio" },
        { label: "Dette/Actifs", key: "debtToAssets", format: "ratio" },
        { label: "Dette Nette/EBITDA", key: "netDebtToEBITDA", format: "ratio" },
        { label: "Ratio de Liquidité", key: "currentRatio", format: "ratio" },
        { label: "Couverture des Intérêts", key: "interestCoverage", format: "ratio" },
        { label: "Fonds de Roulement", key: "workingCapital", format: "currency" },
        { label: "Capital Investi", key: "investedCapital", format: "currency" },
        { label: "Tangible Asset Value", key: "tangibleAssetValue", format: "currency" },
      ]
    },
    {
      title: "Efficacité Opérationnelle",
      icon: <Activity className="w-5 h-5" />,
      description: "Ratios de rotation et cycles d'exploitation",
      metrics: [
        { label: "Rotation des Créances", key: "receivablesTurnover", format: "ratio" },
        { label: "Rotation des Dettes", key: "payablesTurnover", format: "ratio" },
        { label: "Rotation des Stocks", key: "inventoryTurnover", format: "ratio" },
        { label: "Jours de Recouvrement (DSO)", key: "daysSalesOutstanding", format: "ratio" },
        { label: "Jours de Paiement (DPO)", key: "daysPayablesOutstanding", format: "ratio" },
        { label: "Jours de Stock (DIO)", key: "daysOfInventoryOnHand", format: "ratio" },
        { label: "Créances Moyennes", key: "averageReceivables", format: "currency" },
        { label: "Dettes Moyennes", key: "averagePayables", format: "currency" },
        { label: "Stock Moyen", key: "averageInventory", format: "currency" },
      ]
    },
    {
      title: "Dépenses & Allocation",
      icon: <Percent className="w-5 h-5" />,
      description: "Structure des dépenses en % du revenu",
      metrics: [
        { label: "SG&A / Revenu", key: "salesGeneralAndAdministrativeToRevenue", format: "percent" },
        { label: "R&D / Revenu", key: "researchAndDdevelopementToRevenue", format: "percent" },
        { label: "Stock Comp / Revenu", key: "stockBasedCompensationToRevenue", format: "percent" },
        { label: "Capex / Operating CF", key: "capexToOperatingCashFlow", format: "percent" },
        { label: "Capex / Revenu", key: "capexToRevenue", format: "percent" },
        { label: "Capex / Depreciation", key: "capexToDepreciation", format: "ratio" },
        { label: "Intangibles / Total Assets", key: "intangiblesToTotalAssets", format: "percent" },
      ]
    },
  ];

  return (
    <div className="space-y-6">
      {metricsSections.map((section, sectionIdx) => (
        <Card key={sectionIdx}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {section.icon}
              {section.title}
            </CardTitle>
            <CardDescription>{section.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[250px] sticky left-0 bg-card z-10">Métrique</TableHead>
                    {keyMetrics.slice(0, 5).map((item, idx) => (
                      <TableHead key={idx} className="text-right min-w-[150px]">
                        <div>
                          <div className="font-semibold">{formatDate(item.date)}</div>
                          <Badge variant="outline" className="text-xs mt-1">
                            {item.period}
                          </Badge>
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {section.metrics.map((metric, metricIdx) => (
                    <TableRow key={metricIdx} className="hover:bg-muted/50">
                      <TableCell className="font-medium sticky left-0 bg-card z-10">
                        {metric.label}
                      </TableCell>
                      {keyMetrics.slice(0, 5).map((item, idx) => {
                        const value = item[metric.key];
                        const prevValue = idx < keyMetrics.length - 1 ? keyMetrics[idx + 1][metric.key] : null;
                        let formattedValue = "N/A";

                        if (value || value === 0) {
                          switch (metric.format) {
                            case "currency":
                              formattedValue = formatNumber(value);
                              break;
                            case "percent":
                              formattedValue = formatPercent(value);
                              break;
                            case "ratio":
                              formattedValue = formatRatio(value);
                              break;
                            default:
                              formattedValue = value.toString();
                          }
                        }

                        return (
                          <TableCell key={idx} className="text-right">
                            <div>
                              <div className="font-semibold">{formattedValue}</div>
                              {value && prevValue && getChangeIndicator(value, prevValue)}
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
      ))}
    </div>
  );
}
