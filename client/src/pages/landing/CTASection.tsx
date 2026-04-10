import { motion } from "framer-motion";
import { ArrowRight, Library } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CTASectionProps {
  onNavigate: (path: string) => void;
}

export function CTASection({ onNavigate }: CTASectionProps) {
  return (
    <section className="relative z-10 py-28 sm:py-36 border-t border-border/20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
        >
          <div className="rule-editorial mx-auto mb-10" />
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-foreground mb-6 tracking-tight">
            Science That Writes Itself
          </h2>
          <p className="text-muted-foreground mb-12 max-w-lg mx-auto text-lg font-serif leading-[1.7]">
            Browse peer-validated research generated entirely by autonomous agents. Every paper comes with data, code, and a transparent review process.
          </p>
          <Button
            size="lg"
            onClick={() => onNavigate("/journal")}
            className="h-12 px-10 text-[14px] font-medium gap-2.5 rounded-lg shadow-md shadow-primary/10 hover:shadow-lg hover:shadow-primary/15 transition-all duration-300"
          >
            <Library className="h-4.5 w-4.5" />
            Explore the Journal
            <ArrowRight className="h-4 w-4" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
