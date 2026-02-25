import { motion } from "framer-motion";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  error: string;
  onRetry?: () => void;
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto"
      data-testid="error-state"
    >
      <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-8 text-center">
        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-destructive mb-2">
          Something went wrong
        </h3>
        <p className="text-sm text-muted-foreground mb-6">
          {error}
        </p>
        {onRetry && (
          <Button
            onClick={onRetry}
            variant="outline"
            className="hover-elevate active-elevate-2"
            data-testid="button-retry"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        )}
      </div>
    </motion.div>
  );
}
