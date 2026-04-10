import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Filter, SlidersHorizontal,
  LayoutGrid, LayoutList,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SortOrder, ViewMode, PublishedPaper } from "./types";

interface FilterPanelProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  domainFilter: string;
  setDomainFilter: (d: string) => void;
  sortOrder: SortOrder;
  setSortOrder: (s: SortOrder) => void;
  viewMode: ViewMode;
  setViewMode: (v: ViewMode) => void;
  domains: string[];
  filteredCount: number;
  totalCount: number;
}

export function FilterPanel({
  searchQuery, setSearchQuery,
  domainFilter, setDomainFilter,
  sortOrder, setSortOrder,
  viewMode, setViewMode,
  domains, filteredCount, totalCount,
}: FilterPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="mb-10 space-y-4"
    >
      <div className="relative rounded-2xl border border-border/50 bg-card/60 backdrop-blur-sm p-3 shadow-sm glass-subtle">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
            <Input
              type="text"
              placeholder="Search papers by title, abstract, author, keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 pr-4 h-11 border-0 bg-background/60 text-sm rounded-xl focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <Select value={domainFilter} onValueChange={setDomainFilter}>
            <SelectTrigger className="w-full sm:w-56 h-11 rounded-xl bg-background/60 border-0 focus:ring-2 focus:ring-primary/20">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-muted-foreground/50" />
                <SelectValue placeholder="All domains" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">All domains</SelectItem>
              {domains.map(d => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as SortOrder)}>
            <SelectTrigger className="w-full sm:w-40 h-11 rounded-xl bg-background/60 border-0 focus:ring-2 focus:ring-primary/20">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground/50" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="newest">Newest first</SelectItem>
              <SelectItem value="oldest">Oldest first</SelectItem>
              <SelectItem value="longest">Longest first</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center rounded-xl bg-background/60 overflow-hidden h-11">
            <button
              onClick={() => setViewMode("list")}
              className={`h-full px-3.5 flex items-center transition-all duration-200 ${viewMode === "list" ? "bg-primary/10 text-primary shadow-sm" : "text-muted-foreground/50 hover:text-foreground"}`}
              title="List view"
            >
              <LayoutList className="w-4 h-4" />
            </button>
            <div className="w-px h-5 bg-border/30" />
            <button
              onClick={() => setViewMode("grid")}
              className={`h-full px-3.5 flex items-center transition-all duration-200 ${viewMode === "grid" ? "bg-primary/10 text-primary shadow-sm" : "text-muted-foreground/50 hover:text-foreground"}`}
              title="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {(searchQuery || domainFilter !== "all") && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-2 text-xs text-muted-foreground px-1"
          >
            <span className="font-medium">Showing {filteredCount} of {totalCount} papers</span>
            {domainFilter !== "all" && (
              <Badge variant="secondary" className="text-[10px] gap-1 cursor-pointer hover:bg-destructive/10 rounded-lg" onClick={() => setDomainFilter("all")}>
                {domainFilter} &times;
              </Badge>
            )}
            {searchQuery && (
              <Badge variant="secondary" className="text-[10px] gap-1 cursor-pointer hover:bg-destructive/10 rounded-lg" onClick={() => setSearchQuery("")}>
                "{searchQuery}" &times;
              </Badge>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
