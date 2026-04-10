import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { GraduationCap, Library } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface EmptyStateProps {
  hasFilters: boolean;
  resetFilters: () => void;
}

export function EmptyState({ hasFilters, resetFilters }: EmptyStateProps) {
  const [, setLocation] = useLocation();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="text-center py-24 border-dashed border-border/50 bg-card/50 backdrop-blur-sm rounded-2xl">
        <CardContent>
          <div className="p-5 rounded-2xl bg-primary/5 border border-primary/10 w-fit mx-auto mb-6">
            <Library className="w-12 h-12 text-primary/30" />
          </div>
          {hasFilters ? (
            <>
              <h3 className="text-xl font-serif font-bold mb-2">No papers match your criteria</h3>
              <p className="text-sm text-muted-foreground mb-8">Try adjusting your search or filters.</p>
              <Button variant="outline" className="rounded-xl" onClick={resetFilters}>
                Reset filters
              </Button>
            </>
          ) : (
            <>
              <h3 className="text-xl font-serif font-bold mb-2">The journal is empty</h3>
              <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
                Research papers will appear here automatically when generated through the AutoScholar platform.
                Each compiled LaTeX PDF paper is auto-published to this journal.
              </p>
              <Button onClick={() => setLocation('/')} className="rounded-xl gap-2 h-11 px-6">
                <GraduationCap className="w-4 h-4" />
                Generate your first paper
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
