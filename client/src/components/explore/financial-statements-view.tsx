import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, TrendingDown, FileText, DollarSign, Wallet, Activity } from "lucide-react";

interface FinancialStatement {
  date: string;
  symbol: string;
  reportedCurrency: string;
  cik: string;
  fillingDate: string;
  acceptedDate: string;
  calendarYear: string;
  period: string;
  link: string;
  finalLink: string;
  [key: string]: any;
}

interface FinancialStatementsViewProps {
  incomeStatement?: FinancialStatement[];
  balanceSheet?: FinancialStatement[];
  cashFlow?: FinancialStatement[];
  period: "annual" | "quarter";
}

export function FinancialStatementsView({
  incomeStatement,
  balanceSheet,
  cashFlow,
  period
}: FinancialStatementsViewProps) {
  const formatCurrency = (value: number) => {
    if (!value) return "N/A";
    const absValue = Math.abs(value);
    if (absValue >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (absValue >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (absValue >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (absValue >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return `$${value.toFixed(2)}`;
  };

  const formatPercent = (value: number) => {
    if (!value) return "N/A";
    return `${(value * 100).toFixed(2)}%`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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

  // Income Statement
  const incomeStatementRows = [
    { label: "Revenu Total", key: "revenue", highlight: true },
    { label: "Coût des Revenus", key: "costOfRevenue" },
    { label: "Marge Brute", key: "grossProfit", highlight: true },
    { label: "Dépenses R&D", key: "researchAndDevelopmentExpenses" },
    { label: "Dépenses Générales", key: "generalAndAdministrativeExpenses" },
    { label: "Dépenses Marketing", key: "sellingAndMarketingExpenses" },
    { label: "Dépenses d'Exploitation", key: "operatingExpenses" },
    { label: "Revenu d'Exploitation", key: "operatingIncome", highlight: true },
    { label: "Revenu d'Intérêts", key: "interestIncome" },
    { label: "Dépenses d'Intérêts", key: "interestExpense" },
    { label: "Autres Revenus/Dépenses", key: "otherExpenses" },
    { label: "Revenu avant Impôts", key: "incomeBeforeTax", highlight: true },
    { label: "Charge d'Impôt", key: "incomeTaxExpense" },
    { label: "Revenu Net", key: "netIncome", highlight: true, important: true },
    { label: "BPA", key: "eps", isEPS: true },
    { label: "BPA Dilué", key: "epsdiluted", isEPS: true },
  ];

  // Balance Sheet
  const balanceSheetRows = [
    { label: "Actifs", section: true },
    { label: "Trésorerie", key: "cashAndCashEquivalents" },
    { label: "Placements Court Terme", key: "shortTermInvestments" },
    { label: "Comptes Clients", key: "netReceivables" },
    { label: "Inventaire", key: "inventory" },
    { label: "Actifs Courants", key: "totalCurrentAssets", highlight: true },
    { label: "Immobilisations", key: "propertyPlantEquipmentNet" },
    { label: "Goodwill", key: "goodwill" },
    { label: "Actifs Intangibles", key: "intangibleAssets" },
    { label: "Placements Long Terme", key: "longTermInvestments" },
    { label: "Total Actifs", key: "totalAssets", highlight: true, important: true },
    { label: "Passifs", section: true },
    { label: "Comptes Fournisseurs", key: "accountPayables" },
    { label: "Dette Court Terme", key: "shortTermDebt" },
    { label: "Passifs Courants", key: "totalCurrentLiabilities", highlight: true },
    { label: "Dette Long Terme", key: "longTermDebt" },
    { label: "Total Passifs", key: "totalLiabilities", highlight: true, important: true },
    { label: "Capitaux Propres", section: true },
    { label: "Actions Ordinaires", key: "commonStock" },
    { label: "Bénéfices Non Répartis", key: "retainedEarnings" },
    { label: "Total Capitaux Propres", key: "totalStockholdersEquity", highlight: true, important: true },
  ];

  // Cash Flow
  const cashFlowRows = [
    { label: "Activités d'Exploitation", section: true },
    { label: "Revenu Net", key: "netIncome", highlight: true },
    { label: "Dépréciation & Amortissement", key: "depreciationAndAmortization" },
    { label: "Variation Fonds de Roulement", key: "changeInWorkingCapital" },
    { label: "Flux de Trésorerie d'Exploitation", key: "operatingCashFlow", highlight: true, important: true },
    { label: "Activités d'Investissement", section: true },
    { label: "Investissements en Immobilisations", key: "capitalExpenditure" },
    { label: "Acquisitions", key: "acquisitionsNet" },
    { label: "Achats d'Investissements", key: "purchasesOfInvestments" },
    { label: "Ventes d'Investissements", key: "salesMaturitiesOfInvestments" },
    { label: "Flux de Trésorerie d'Investissement", key: "netCashUsedForInvestingActivites", highlight: true },
    { label: "Activités de Financement", section: true },
    { label: "Dette Émise", key: "debtRepayment" },
    { label: "Actions Rachetées", key: "commonStockRepurchased" },
    { label: "Dividendes Payés", key: "dividendsPaid" },
    { label: "Flux de Trésorerie de Financement", key: "netCashUsedProvidedByFinancingActivities", highlight: true },
    { label: "Variation Nette de Trésorerie", key: "netChangeInCash", highlight: true, important: true },
    { label: "Flux de Trésorerie Libre", key: "freeCashFlow", highlight: true, important: true },
  ];

  const renderTable = (
    data: FinancialStatement[] | undefined,
    rows: Array<{ label: string; key?: string; highlight?: boolean; important?: boolean; section?: boolean; isEPS?: boolean }>,
    title: string,
    description: string,
    icon: React.ReactNode
  ) => {
    if (!data || data.length === 0) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {icon}
              {title}
            </CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Aucune donnée disponible</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px] sticky left-0 bg-card z-10">Élément</TableHead>
                  {data.slice(0, 5).map((item, idx) => (
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
                {rows.map((row, rowIdx) => {
                  if (row.section) {
                    return (
                      <TableRow key={rowIdx} className="bg-muted/50">
                        <TableCell colSpan={6} className="font-bold sticky left-0 bg-muted/50 z-10">
                          {row.label}
                        </TableCell>
                      </TableRow>
                    );
                  }

                  return (
                    <TableRow
                      key={rowIdx}
                      className={`${row.highlight ? 'bg-primary/5' : ''} ${row.important ? 'border-l-4 border-l-primary' : ''}`}
                    >
                      <TableCell className={`sticky left-0 bg-card z-10 ${row.highlight ? 'font-semibold' : ''} ${row.important ? 'font-bold text-primary' : ''}`}>
                        {row.label}
                      </TableCell>
                      {data.slice(0, 5).map((item, idx) => {
                        const value = row.key ? item[row.key] : null;
                        const prevValue = idx < data.length - 1 && row.key ? data[idx + 1][row.key] : null;

                        return (
                          <TableCell key={idx} className={`text-right ${row.highlight ? 'font-semibold' : ''} ${row.important ? 'font-bold' : ''}`}>
                            <div>
                              <div>
                                {row.isEPS ? (value ? `$${value.toFixed(2)}` : 'N/A') : formatCurrency(value)}
                              </div>
                              {value && prevValue && getChangeIndicator(value, prevValue)}
                            </div>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {data[0]?.link && (
            <div className="mt-4 pt-4 border-t">
              <a
                href={data[0].link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                Voir le document SEC complet →
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {renderTable(
        incomeStatement,
        incomeStatementRows,
        "Compte de Résultat",
        "Performance financière et rentabilité",
        <FileText className="w-5 h-5" />
      )}

      {renderTable(
        balanceSheet,
        balanceSheetRows,
        "Bilan",
        "Actifs, passifs et capitaux propres",
        <Wallet className="w-5 h-5" />
      )}

      {renderTable(
        cashFlow,
        cashFlowRows,
        "Tableau de Flux de Trésorerie",
        "Flux de trésorerie par activité",
        <Activity className="w-5 h-5" />
      )}
    </div>
  );
}
