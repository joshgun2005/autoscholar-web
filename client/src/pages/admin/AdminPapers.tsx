import { useState } from "react";
import { Search, FileText, Eye, EyeOff, Trash2, ExternalLink, Award } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AdminPaper {
  id: string;
  asid: string | null;
  title: string;
  abstract: string | null;
  authors: string | null;
  domain: string | null;
  wordCount: number | null;
  figureCount: number | null;
  authorName: string | null;
  showInJournal: number;
  publishedAt: string;
  reviewScore: number | null;
  recommendation: string | null;
}

interface AdminPapersProps {
  papers: AdminPaper[];
  onToggleVisibility: (id: string, showInJournal: boolean) => Promise<void>;
  onDeletePaper: (id: string) => Promise<void>;
}

const DOMAIN_COLORS: Record<string, string> = {
  finance: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  economics: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  "machine-learning": "bg-purple-500/10 text-purple-600 border-purple-500/20",
  statistics: "bg-orange-500/10 text-orange-600 border-orange-500/20",
  "computer-science": "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
  mathematics: "bg-red-500/10 text-red-600 border-red-500/20",
};

function getDomainColor(domain: string | null): string {
  if (!domain) return "bg-muted text-muted-foreground";
  return DOMAIN_COLORS[domain.toLowerCase()] || "bg-muted text-muted-foreground";
}

function getRecommendationBadge(rec: string | null) {
  if (!rec) return null;
  const map: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
    accept: { label: "Accept", variant: "default" },
    minor_revision: { label: "Minor Rev.", variant: "secondary" },
    major_revision: { label: "Major Rev.", variant: "outline" },
    reject: { label: "Reject", variant: "destructive" },
  };
  const info = map[rec] || { label: rec, variant: "outline" as const };
  return <Badge variant={info.variant} className="text-[10px]">{info.label}</Badge>;
}

export function AdminPapers({ papers, onToggleVisibility, onDeletePaper }: AdminPapersProps) {
  const [search, setSearch] = useState("");
  const [domainFilter, setDomainFilter] = useState("all");
  const [visibilityFilter, setVisibilityFilter] = useState<"all" | "visible" | "hidden">("all");

  const domains = Array.from(new Set(papers.map(p => p.domain).filter(Boolean))) as string[];

  const filtered = papers.filter(p => {
    if (search) {
      const q = search.toLowerCase();
      const matchesSearch = p.title.toLowerCase().includes(q)
        || (p.authors?.toLowerCase().includes(q))
        || (p.authorName?.toLowerCase().includes(q))
        || (p.asid?.toLowerCase().includes(q));
      if (!matchesSearch) return false;
    }
    if (domainFilter !== "all" && p.domain !== domainFilter) return false;
    if (visibilityFilter === "visible" && p.showInJournal !== 1) return false;
    if (visibilityFilter === "hidden" && p.showInJournal !== 0) return false;
    return true;
  });

  const visibleCount = papers.filter(p => p.showInJournal === 1).length;
  const hiddenCount = papers.length - visibleCount;

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <div className="text-2xl font-bold">{papers.length}</div>
            <div className="text-xs text-muted-foreground">Total Papers</div>
          </CardContent>
        </Card>
        <Card className="border-green-500/30">
          <CardContent className="pt-4 pb-3 text-center">
            <div className="text-2xl font-bold text-green-600 flex items-center justify-center gap-1">
              <Eye className="w-4 h-4" /> {visibleCount}
            </div>
            <div className="text-xs text-muted-foreground">Visible in Journal</div>
          </CardContent>
        </Card>
        <Card className="border-orange-500/30">
          <CardContent className="pt-4 pb-3 text-center">
            <div className="text-2xl font-bold text-orange-600 flex items-center justify-center gap-1">
              <EyeOff className="w-4 h-4" /> {hiddenCount}
            </div>
            <div className="text-xs text-muted-foreground">Hidden</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/40" />
          <Input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by title, author, DOI..."
            className="pl-10"
          />
        </div>
        <Select value={domainFilter} onValueChange={setDomainFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All domains" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All domains</SelectItem>
            {domains.map(d => (
              <SelectItem key={d} value={d}>{d}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={visibilityFilter} onValueChange={v => setVisibilityFilter(v as any)}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="visible">Visible</SelectItem>
            <SelectItem value="hidden">Hidden</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Papers table */}
      <Card>
        <CardContent className="pt-4 px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12 text-center">#</TableHead>
                <TableHead>Title</TableHead>
                <TableHead className="w-28">Domain</TableHead>
                <TableHead className="w-32">Author</TableHead>
                <TableHead className="w-20 text-center">Words</TableHead>
                <TableHead className="w-20 text-center">Review</TableHead>
                <TableHead className="w-28">Date</TableHead>
                <TableHead className="w-24 text-center">Journal</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                    <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    No papers found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((paper, i) => (
                  <TableRow key={paper.id} className={paper.showInJournal === 0 ? "opacity-50" : ""}>
                    <TableCell className="text-center text-xs text-muted-foreground font-mono">
                      {i + 1}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-md">
                        <div className="font-medium text-sm leading-tight line-clamp-2">{paper.title}</div>
                        {paper.asid && (
                          <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">{paper.asid}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {paper.domain && (
                        <Badge variant="outline" className={`text-[10px] ${getDomainColor(paper.domain)}`}>
                          {paper.domain}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {paper.authorName || paper.authors?.split(",")[0] || "—"}
                    </TableCell>
                    <TableCell className="text-center text-xs">
                      {paper.wordCount?.toLocaleString() || "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-0.5">
                        {paper.reviewScore != null ? (
                          <span className={`text-xs font-bold ${paper.reviewScore >= 70 ? "text-green-600" : paper.reviewScore >= 50 ? "text-yellow-600" : "text-red-600"}`}>
                            {paper.reviewScore}/100
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                        {getRecommendationBadge(paper.recommendation)}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(paper.publishedAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-center">
                      <Switch
                        checked={paper.showInJournal === 1}
                        onCheckedChange={(checked) => onToggleVisibility(paper.id, checked)}
                      />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive/60 hover:text-destructive"
                        onClick={() => onDeletePaper(paper.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
