import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Newspaper, ExternalLink, Calendar, TrendingUp } from "lucide-react";

interface NewsArticle {
  title: string;
  text: string;
  url: string;
  site: string;
  publishedDate: string;
  symbol: string;
  image?: string;
  [key: string]: any;
}

interface NewsViewProps {
  news?: NewsArticle[];
}

export function NewsView({ news }: NewsViewProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return "Il y a moins d'une heure";
    if (diffInHours < 24) return `Il y a ${diffInHours} heure${diffInHours > 1 ? 's' : ''}`;
    if (diffInHours < 48) return "Hier";

    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!news || news.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Newspaper className="w-5 h-5" />
            Actualités Financières
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Aucune actualité disponible</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <Newspaper className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Actualités & Analyses</h2>
          <p className="text-muted-foreground">
            {news.length} article{news.length > 1 ? 's' : ''} récent{news.length > 1 ? 's' : ''}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {news.map((article, idx) => (
          <Card
            key={idx}
            className="hover:shadow-lg transition-all duration-300 hover:border-primary/50 cursor-pointer"
            onClick={() => window.open(article.url, '_blank')}
          >
            <CardContent className="pt-6">
              <div className="flex gap-4">
                {/* Image */}
                {article.image && (
                  <div className="flex-shrink-0 w-48 h-32 rounded-lg overflow-hidden bg-muted">
                    <img
                      src={article.image}
                      alt={article.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h3 className="text-xl font-bold line-clamp-2 hover:text-primary transition-colors">
                      {article.title}
                    </h3>
                    <ExternalLink className="w-5 h-5 flex-shrink-0 text-muted-foreground" />
                  </div>

                  <p className="text-muted-foreground line-clamp-3 mb-3">
                    {article.text}
                  </p>

                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge variant="outline" className="gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(article.publishedDate)}
                    </Badge>

                    <Badge variant="secondary">
                      {article.site}
                    </Badge>

                    {article.symbol && (
                      <Badge variant="default">
                        {article.symbol}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Load More Button */}
      {news.length >= 10 && (
        <Card className="border-dashed">
          <CardContent className="flex items-center justify-center py-8">
            <button className="text-primary hover:underline font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Charger plus d'actualités
            </button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
