import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, TrendingUp, TrendingDown, Building2, Globe, ExternalLink, DollarSign } from "lucide-react";

interface CompanyProfile {
  symbol: string;
  companyName: string;
  industry: string;
  sector: string;
  ceo: string;
  website: string;
  description: string;
  country: string;
  city: string;
  address: string;
  employees: number;
  marketCap: number;
  image: string;
  exchange: string;
  isin: string;
  cusip: string;
  phone: string;
}

interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changesPercentage: number;
  dayLow: number;
  dayHigh: number;
  yearHigh: number;
  yearLow: number;
  marketCap: number;
  priceAvg50: number;
  priceAvg200: number;
  volume: number;
  avgVolume: number;
  open: number;
  previousClose: number;
  eps: number;
  pe: number;
  earningsAnnouncement: string;
  sharesOutstanding: number;
  timestamp: number;
}

interface StockHeaderProps {
  ticker: string;
  companyProfile?: CompanyProfile;
  stockQuote?: StockQuote;
  onBack: () => void;
}

export function StockHeader({ ticker, companyProfile, stockQuote, onBack }: StockHeaderProps) {
  const isPositive = (stockQuote?.changesPercentage ?? 0) >= 0;

  const formatNumber = (num: number) => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  const formatVolume = (vol: number) => {
    if (vol >= 1e9) return `${(vol / 1e9).toFixed(2)}B`;
    if (vol >= 1e6) return `${(vol / 1e6).toFixed(2)}M`;
    if (vol >= 1e3) return `${(vol / 1e3).toFixed(2)}K`;
    return vol.toString();
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button
        variant="outline"
        onClick={onBack}
        className="gap-2 hover-elevate active-elevate-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour à l'aperçu du marché
      </Button>

      {/* Main Stock Header */}
      <Card className="bg-gradient-to-br from-card via-card to-primary/5 border-2">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Company Info */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-start gap-4">
                {companyProfile?.image && (
                  <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-white p-2 shadow-md">
                    <img
                      src={companyProfile.image}
                      alt={companyProfile.companyName}
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h1 className="text-3xl font-bold mb-1">
                        {companyProfile?.companyName || ticker}
                      </h1>
                      <div className="flex items-center gap-3 flex-wrap">
                        <Badge variant="secondary" className="text-base font-mono px-3 py-1">
                          {ticker}
                        </Badge>
                        {companyProfile?.exchange && (
                          <Badge variant="outline" className="text-sm">
                            {companyProfile.exchange}
                          </Badge>
                        )}
                        {companyProfile?.sector && (
                          <Badge variant="outline" className="text-sm">
                            {companyProfile.sector}
                          </Badge>
                        )}
                        {companyProfile?.industry && (
                          <Badge variant="outline" className="text-sm">
                            {companyProfile.industry}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {companyProfile?.description && (
                    <p className="mt-3 text-muted-foreground line-clamp-3">
                      {companyProfile.description}
                    </p>
                  )}

                  {companyProfile && (
                    <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
                      {companyProfile.ceo && (
                        <div>
                          <span className="text-muted-foreground">CEO:</span>{" "}
                          <span className="font-semibold">{companyProfile.ceo}</span>
                        </div>
                      )}
                      {companyProfile.employees && (
                        <div>
                          <span className="text-muted-foreground">Employés:</span>{" "}
                          <span className="font-semibold">{companyProfile.employees.toLocaleString()}</span>
                        </div>
                      )}
                      {companyProfile.country && (
                        <div>
                          <span className="text-muted-foreground">Pays:</span>{" "}
                          <span className="font-semibold">{companyProfile.country}</span>
                        </div>
                      )}
                      {companyProfile.website && (
                        <a
                          href={companyProfile.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-primary hover:underline"
                        >
                          <Globe className="w-4 h-4" />
                          Site Web
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Live Quote */}
            {stockQuote && (
              <div className="lg:border-l lg:pl-6">
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Prix Actuel</div>
                    <div className="text-4xl font-bold">
                      ${stockQuote.price?.toFixed(2)}
                    </div>
                    <div className={`text-xl font-semibold flex items-center gap-2 mt-2 ${
                      isPositive ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {isPositive ? (
                        <TrendingUp className="w-5 h-5" />
                      ) : (
                        <TrendingDown className="w-5 h-5" />
                      )}
                      <span>
                        {isPositive ? '+' : ''}{stockQuote.change?.toFixed(2)}
                      </span>
                      <span className="text-lg">
                        ({isPositive ? '+' : ''}{stockQuote.changesPercentage?.toFixed(2)}%)
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div className="text-muted-foreground">Ouverture</div>
                        <div className="font-semibold">${stockQuote.open?.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Clôture Préc.</div>
                        <div className="font-semibold">${stockQuote.previousClose?.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Jour Bas</div>
                        <div className="font-semibold">${stockQuote.dayLow?.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Jour Haut</div>
                        <div className="font-semibold">${stockQuote.dayHigh?.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">52W Bas</div>
                        <div className="font-semibold">${stockQuote.yearLow?.toFixed(2)}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">52W Haut</div>
                        <div className="font-semibold">${stockQuote.yearHigh?.toFixed(2)}</div>
                      </div>
                    </div>

                    <div className="pt-3 border-t space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Volume</span>
                        <span className="font-semibold">{formatVolume(stockQuote.volume)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Vol. Moyen</span>
                        <span className="font-semibold">{formatVolume(stockQuote.avgVolume)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Cap. Boursière</span>
                        <span className="font-semibold">{formatNumber(stockQuote.marketCap)}</span>
                      </div>
                      {stockQuote.pe && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">P/E Ratio</span>
                          <span className="font-semibold">{stockQuote.pe.toFixed(2)}</span>
                        </div>
                      )}
                      {stockQuote.eps && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">EPS</span>
                          <span className="font-semibold">${stockQuote.eps.toFixed(2)}</span>
                        </div>
                      )}
                    </div>

                    {stockQuote.earningsAnnouncement && (
                      <div className="pt-3 border-t">
                        <div className="text-xs text-muted-foreground">Prochains Résultats</div>
                        <div className="text-sm font-semibold">
                          {new Date(stockQuote.earningsAnnouncement).toLocaleDateString('fr-FR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
