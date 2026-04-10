import { useState } from "react";
import {
  GraduationCap,
  ChevronRight, Wand2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AnimatePresence, motion } from "framer-motion";
import { QUESTION_CATEGORIES } from "./question-categories";

interface EmptyStateProps {
  onQuestionClick?: (question: string) => void;
}

// ── Surprise paper: pick a random prompt from the 300 available ──────

const SURPRISE_HISTORY_KEY = 'autoscholar_surprise_history';
const MAX_HISTORY = 30;

function getSurpriseHistory(): number[] {
  try {
    const raw = localStorage.getItem(SURPRISE_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveSurpriseHistory(history: number[]) {
  try {
    localStorage.setItem(SURPRISE_HISTORY_KEY, JSON.stringify(history.slice(-MAX_HISTORY)));
  } catch { /* noop */ }
}

function pickRandomPrompt(): { category: string; prompt: string } {
  // Flatten all prompts with their flat index
  const allPrompts: { category: string; prompt: string; flatIdx: number }[] = [];
  let idx = 0;
  for (const cat of QUESTION_CATEGORIES) {
    for (const q of cat.questions) {
      allPrompts.push({ category: cat.category, prompt: q, flatIdx: idx++ });
    }
  }

  // Weighted selection: avoid recently picked prompts
  const history = getSurpriseHistory();
  const recentSet = new Set(history);
  // Prefer prompts not in recent history
  const candidates = allPrompts.filter(p => !recentSet.has(p.flatIdx));
  const pool = candidates.length > 0 ? candidates : allPrompts;

  const pick = pool[Math.floor(Math.random() * pool.length)];
  saveSurpriseHistory([...history, pick.flatIdx]);
  return pick;
}

export function generateSurprisePrompt(): string {
  const { prompt } = pickRandomPrompt();
  return prompt;
}

export function EmptyState({ onQuestionClick }: EmptyStateProps) {
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState<number | null>(null);

  const handleCategoryChange = (value: string) => {
    const index = parseInt(value);
    setSelectedCategoryIndex(index);
  };

  const selectedCategory = selectedCategoryIndex !== null
    ? QUESTION_CATEGORIES[selectedCategoryIndex]
    : null;

  const totalPrompts = QUESTION_CATEGORIES.reduce((sum, c) => sum + c.questions.length, 0);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-14 animate-fade-in">
      {/* Hero section */}
      <div className="text-center space-y-7">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center justify-center gap-3 mb-4"
        >
          <div className="relative">
            <GraduationCap className="w-11 h-11 text-primary/80" />
            <div className="absolute inset-0 blur-xl bg-primary/15" />
          </div>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl sm:text-5xl md:text-6xl font-display font-bold tracking-[-0.03em] text-foreground"
        >
          <span className="relative">
            AutoScholar
            <span className="absolute -bottom-2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
          </span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-[15px] sm:text-base text-muted-foreground/65 max-w-lg mx-auto leading-[1.7]"
        >
          Autonomous AI-powered platform for generating publication-grade academic research papers
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="w-full max-w-4xl space-y-8 px-4"
      >
        <div className="text-center">
          <p className="text-[13px] text-muted-foreground/50 font-medium">
            Select a research domain
          </p>
        </div>

        {/* Category dropdown */}
        <div>
          <Select onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-full h-13 text-[14px] font-medium bg-card border border-border/60 rounded-2xl transition-all duration-300 hover:border-border hover:shadow-sm focus:border-primary/30 focus:shadow-[0_0_20px_hsl(var(--primary)/0.05)]">
              <div className="flex items-center gap-3 px-1">
                <div className="p-1.5 rounded-lg bg-primary/6">
                  <GraduationCap className="w-4 h-4 text-primary/70" />
                </div>
                <SelectValue placeholder="Select a research domain..." />
              </div>
            </SelectTrigger>

            <SelectContent className="w-[var(--radix-select-trigger-width)] max-h-[450px] bg-card/98 backdrop-blur-xl border border-border/60 rounded-2xl p-2 shadow-xl">
              <div className="px-4 py-3 mb-1.5 border-b border-border/30">
                <p className="text-[10px] font-semibold text-muted-foreground/45 uppercase tracking-[0.15em]">
                  {QUESTION_CATEGORIES.length} Domains — {totalPrompts} Research Prompts
                </p>
              </div>

              <div className="space-y-0.5">
                {QUESTION_CATEGORIES.map((category, idx) => {
                  const Icon = category.icon;
                  return (
                    <SelectItem
                      key={idx}
                      value={idx.toString()}
                      className="cursor-pointer py-3 px-4 text-[14px] rounded-xl transition-all duration-150"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="p-1.5 rounded-lg bg-primary/6 border border-primary/10">
                          <Icon className="w-4 h-4 text-primary/70" />
                        </div>
                        <div className="flex flex-col flex-1 gap-0.5">
                          <span className="font-semibold text-foreground text-[13px]">
                            {category.category}
                          </span>
                          <span className="text-[11px] text-muted-foreground/50">
                            {category.questions.length} prompts
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  );
                })}
              </div>
            </SelectContent>
          </Select>
        </div>

        {/* Questions for selected category */}
        <AnimatePresence mode="wait">
          {selectedCategory && (
            <motion.div
              key={selectedCategoryIndex}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-5"
            >
              {/* Category header */}
              <div className="flex items-center gap-3.5 p-5 rounded-2xl bg-card border border-border/50">
                {(() => {
                  const Icon = selectedCategory.icon;
                  return (
                    <div className="p-2.5 rounded-xl bg-primary/6 border border-primary/10">
                      <Icon className="w-[18px] h-[18px] text-primary/70" />
                    </div>
                  );
                })()}
                <h3 className="text-base font-semibold text-foreground tracking-[-0.02em]">
                  {selectedCategory.category}
                </h3>
              </div>

              {/* Questions grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {selectedCategory.questions.map((question, qIdx) => (
                  <motion.button
                    key={qIdx}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: qIdx * 0.03 }}
                    onClick={() => onQuestionClick?.(question)}
                    className="group p-4.5 text-left rounded-2xl bg-card/80 border border-border/40 hover:border-border/70 hover:shadow-sm transition-all duration-250 hover:-translate-y-0.5"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-muted/50 flex items-center justify-center font-semibold text-[11px] text-muted-foreground/50 group-hover:bg-primary/8 group-hover:text-primary/70 transition-all duration-300">
                        {qIdx + 1}
                      </div>
                      <p className="flex-1 text-[13px] font-medium leading-[1.6] text-foreground/75 group-hover:text-foreground transition-colors">
                        {question}
                      </p>
                      <ChevronRight className="w-4 h-4 text-muted-foreground/0 group-hover:text-primary/50 transition-all duration-300 -translate-x-1 group-hover:translate-x-0 flex-shrink-0" />
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Surprise paper button */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="pt-6 border-t border-border/25"
        >
          <button
            onClick={() => onQuestionClick?.(generateSurprisePrompt())}
            className="group w-full p-6 rounded-2xl border border-border/40 bg-card/40 hover:bg-card/70 hover:border-border/70 hover:shadow-sm transition-all duration-300 hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-5">
              <div className="p-3 rounded-xl bg-primary/6 border border-primary/10 group-hover:bg-primary/10 transition-colors">
                <Wand2 className="w-[18px] h-[18px] text-primary/70" />
              </div>
              <div className="text-left flex-1">
                <p className="font-semibold text-foreground text-[14px] tracking-[-0.01em]">
                  Generate a surprise paper
                </p>
                <p className="text-[12px] text-muted-foreground/50 mt-1 leading-[1.6]">
                  The agent selects an original topic, identifies a literature gap, conducts full econometric analysis, and produces a figure-rich paper
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground/15 group-hover:text-primary/50 transition-all duration-300 -translate-x-1 group-hover:translate-x-0 flex-shrink-0" />
            </div>
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
