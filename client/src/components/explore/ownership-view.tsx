import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building2, TrendingUp, TrendingDown, Percent, Calendar } from "lucide-react";

interface InstitutionalHolder {
  holder: string;
  shares: number;
  dateReported: string;
  change: number;
  [key: string]: any;
}

interface OwnershipViewProps {
  institutionalHolders?: InstitutionalHolder[];
}

export function OwnershipView({ institutionalHolders }: OwnershipViewProps) {
  const formatNumber = (value: number) => {
    if (!value) return "N/A";
    if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
    return value.toLocaleString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!institutionalHolders || institutionalHolders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Actionnariat Institutionnel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Aucune donnée d'actionnariat disponible</p>
        </CardContent>
      </Card>
    );
  }

  const totalShares = institutionalHolders.reduce((sum, holder) => sum + (holder.shares || 0), 0);
  const holdersWithIncrease = institutionalHolders.filter(h => (h.change || 0) > 0).length;
  const holdersWithDecrease = institutionalHolders.filter(h => (h.change || 0) < 0).length;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Institutions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{institutionalHolders.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Actions Détenues</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatNumber(totalShares)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Augmentations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500 flex items-center gap-2">
              <TrendingUp className="w-6 h-6" />
              {holdersWithIncrease}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Diminutions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-500 flex items-center gap-2">
              <TrendingDown className="w-6 h-6" />
              {holdersWithDecrease}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Principaux Actionnaires Institutionnels
          </CardTitle>
          <CardDescription>
            Détention institutionnelle et changements récents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Rang</TableHead>
                  <TableHead className="min-w-[300px]">Institution</TableHead>
                  <TableHead className="text-right">Actions Détenues</TableHead>
                  <TableHead className="text-right">Variation</TableHead>
                  <TableHead className="text-right">% de Variation</TableHead>
                  <TableHead>Date de Rapport</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {institutionalHolders.map((holder, idx) => {
                  const changeValue = holder.change || 0;
                  const isPositive = changeValue >= 0;
                  const percentChange = holder.shares > 0 ? (changeValue / holder.shares) * 100 : 0;

                  return (
                    <TableRow key={idx} className="hover:bg-muted/50">
                      <TableCell className="font-bold text-muted-foreground">
                        #{idx + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <div className="font-semibold">{holder.holder}</div>
                            {holder.shares > 0 && (
                              <div className="text-xs text-muted-foreground">
                                {((holder.shares / totalShares) * 100).toFixed(2)}% du total
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatNumber(holder.shares)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className={`flex items-center justify-end gap-1 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                          {isPositive ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : (
                            <TrendingDown className="w-4 h-4" />
                          )}
                          <span className="font-semibold">
                            {isPositive ? '+' : ''}{formatNumber(changeValue)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge
                          variant={isPositive ? "default" : "destructive"}
                          className="font-semibold"
                        >
                          {isPositive ? '+' : ''}{percentChange.toFixed(2)}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          {formatDate(holder.dateReported)}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
