import { Check, Loader2, Zap, AlertCircle, Clock, ChevronDown, ChevronUp, Brain, Search, Database, FlaskConical, BarChart3, Wrench } from "lucide-react";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface AgentStep {
  tool: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  input?: any;
  error?: string;
  duration?: number;
  parallel?: boolean;
  agent?: string | null;
}

interface AgentStepsProps {
  steps: AgentStep[];
  currentStep?: number;
}

// ── Agent identity system ──────────────────────────────────

const AGENT_CONFIG: Record<string, {
  label: string;
  role: string;
  icon: typeof Brain;
  bg: string;
  border: string;
  text: string;
  dot: string;
  badgeBg: string;
}> = {
  Euler: {
    label: 'Euler',
    role: 'Orchestrator',
    icon: Brain,
    bg: 'bg-teal-500/8',
    border: 'border-teal-500/25',
    text: 'text-teal-600 dark:text-teal-400',
    dot: 'bg-teal-500',
    badgeBg: 'bg-teal-500/10',
  },
  Gauss: {
    label: 'Gauss',
    role: 'Gap Analysis',
    icon: Search,
    bg: 'bg-indigo-500/8',
    border: 'border-indigo-500/25',
    text: 'text-indigo-600 dark:text-indigo-400',
    dot: 'bg-indigo-500',
    badgeBg: 'bg-indigo-500/10',
  },
  Turing: {
    label: 'Turing',
    role: 'Data Collection',
    icon: Database,
    bg: 'bg-amber-500/8',
    border: 'border-amber-500/25',
    text: 'text-amber-600 dark:text-amber-400',
    dot: 'bg-amber-500',
    badgeBg: 'bg-amber-500/10',
  },
  Newton: {
    label: 'Newton',
    role: 'Dataset Prep',
    icon: FlaskConical,
    bg: 'bg-emerald-500/8',
    border: 'border-emerald-500/25',
    text: 'text-emerald-600 dark:text-emerald-400',
    dot: 'bg-emerald-500',
    badgeBg: 'bg-emerald-500/10',
  },
  Fisher: {
    label: 'Fisher',
    role: 'Empirical Analysis',
    icon: BarChart3,
    bg: 'bg-rose-500/8',
    border: 'border-rose-500/25',
    text: 'text-rose-600 dark:text-rose-400',
    dot: 'bg-rose-500',
    badgeBg: 'bg-rose-500/10',
  },
};

const DEFAULT_AGENT = {
  label: 'Tool',
  role: '',
  icon: Wrench,
  bg: 'bg-muted/50',
  border: 'border-border',
  text: 'text-muted-foreground',
  dot: 'bg-muted-foreground/50',
  badgeBg: 'bg-muted/50',
};

function getAgentConfig(agent?: string | null) {
  if (agent && AGENT_CONFIG[agent]) return AGENT_CONFIG[agent];
  return DEFAULT_AGENT;
}

/** Human-readable tool labels */
const TOOL_LABELS: Record<string, string> = {
  execute_custom_python_analysis: "Python Analysis",
  run_python_script: "Re-run Script",
  apply_patch: "Patch Script",
  read_python_script: "Read Script",
  inspect_python_logs: "Inspect Logs",
  write_paper_section: "Writing Section",
  compile_research_paper: "Compiling Paper",
  generate_research_paper: "Generating Paper",
  literature_gap_finder: "Literature Gap Finder",
  academic_search: "Academic Search",
  academic_literature_review: "Literature Review",
  firecrawl_search: "Web Search",
  firecrawl_scrape: "Scraping Page",
  firecrawl_extract: "Extracting Data",
  firecrawl_crawl: "Crawling Site",
  firecrawl_agent: "Web Agent",
  web_dataset_collector: "Collecting Dataset",
  get_stock_quote: "Stock Quote",
  get_company_profile: "Company Profile",
  get_income_statement: "Income Statement",
  get_balance_sheet: "Balance Sheet",
  get_historical_price: "Historical Prices",
  get_eodhd_eod: "Historical Data (EODHD)",
  get_eodhd_intraday: "Intraday Data",
  run_monte_carlo_simulation: "Monte Carlo Sim",
  calculate_options_price: "Options Pricing",
  get_economic_calendar: "Economic Calendar",
  get_treasury_rates: "Treasury Rates",
  tavily_search: "Web Research",
  tavily_research: "Deep Research",
  install_python_package: "Installing Package",
};

function getToolLabel(tool: string): string {
  return TOOL_LABELS[tool] || tool.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// ── Step icon ─────────────────────────────────────────────

function StepIcon({ status, agent }: { status: AgentStep['status']; agent?: string | null }) {
  const config = getAgentConfig(agent);
  const Icon = config.icon;

  if (status === 'running') {
    return (
      <div className={`w-8 h-8 rounded-full ${config.bg} border ${config.border} flex items-center justify-center flex-shrink-0 relative shadow-sm shadow-[0_0_8px_hsl(var(--primary)/0.15)]`}>
        <Icon className={`w-3.5 h-3.5 ${config.text}`} />
        <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-primary border-2 border-card animate-pulse" />
      </div>
    );
  }
  if (status === 'completed') {
    return (
      <div className={`w-8 h-8 rounded-full bg-emerald-500/12 border border-emerald-500/25 flex items-center justify-center flex-shrink-0 shadow-sm shadow-[0_0_6px_hsl(160_84%_39%/0.12)]`}>
        <Check className="w-3.5 h-3.5 text-emerald-500" />
      </div>
    );
  }
  if (status === 'error') {
    return (
      <div className="w-8 h-8 rounded-full bg-red-500/12 border border-red-500/25 flex items-center justify-center flex-shrink-0 shadow-sm">
        <AlertCircle className="w-3.5 h-3.5 text-red-500" />
      </div>
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-muted/50 border border-border flex items-center justify-center flex-shrink-0 shadow-sm">
      <Clock className="w-3.5 h-3.5 text-muted-foreground/50" />
    </div>
  );
}

// ── Agent badge ───────────────────────────────────────────

function AgentBadge({ agent }: { agent?: string | null }) {
  if (!agent) return null;
  const config = getAgentConfig(agent);
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium uppercase tracking-[0.1em] ${config.badgeBg} ${config.text}`}>
      <span className={`w-1 h-1 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

// ── Active agents summary ─────────────────────────────────

function ActiveAgents({ steps }: { steps: AgentStep[] }) {
  const running = steps.filter(s => s.status === 'running');
  if (running.length === 0) return null;

  // Unique agents currently active
  const activeAgents = Array.from(new Set(running.map(s => s.agent).filter(Boolean))) as string[];
  if (activeAgents.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5">
      {activeAgents.map(agent => {
        const config = getAgentConfig(agent);
        const Icon = config.icon;
        return (
          <div
            key={agent}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${config.badgeBg} border ${config.border}`}
          >
            <Icon className={`w-3 h-3 ${config.text}`} />
            <span className={`text-[11px] font-semibold ${config.text}`}>{config.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Main component ────────────────────────────────────────

// Max completed steps to render on mobile to prevent DOM bloat
const MAX_VISIBLE_COMPLETED_MOBILE = 15;

export function AgentSteps({ steps }: AgentStepsProps) {
  const [expanded, setExpanded] = useState(true);
  const [showAllCompleted, setShowAllCompleted] = useState(false);

  if (steps.length === 0) return null;

  const completedSteps = steps.filter(s => s.status === 'completed');
  const runningSteps = steps.filter(s => s.status === 'running');
  const errorSteps = steps.filter(s => s.status === 'error');
  const totalSteps = steps.length;
  const doneCount = completedSteps.length;

  if (doneCount === 0 && runningSteps.length === 0 && errorSteps.length === 0) return null;

  const progress = totalSteps > 0 ? (doneCount / totalSteps) * 100 : 0;

  // On mobile, limit completed steps to prevent DOM bloat and jank
  const visibleCompletedSteps = showAllCompleted
    ? completedSteps
    : completedSteps.slice(-MAX_VISIBLE_COMPLETED_MOBILE);
  const hiddenCount = completedSteps.length - visibleCompletedSteps.length;

  return (
    <div className="mb-8 rounded-2xl border border-border/50 bg-card/50 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-muted/25 transition-colors"
      >
        <div className="flex items-center gap-3.5">
          <div className="flex items-center gap-2">
            {runningSteps.length > 0 && (
              <Loader2 className="w-4 h-4 text-primary animate-spin" />
            )}
            {runningSteps.length === 0 && doneCount > 0 && (
              <Check className="w-4 h-4 text-emerald-500" />
            )}
            <span className="text-[14px] font-semibold text-foreground tracking-[-0.01em]">
              Agent Pipeline
            </span>
          </div>
          <span className="text-[12px] text-muted-foreground/60 font-medium">
            {doneCount}/{totalSteps} steps
          </span>
          {/* Active agents badges */}
          <ActiveAgents steps={steps} />
          {runningSteps.length > 1 && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20">
              <Zap className="w-3 h-3 text-primary" />
              <span className="text-[10px] font-semibold text-primary">{runningSteps.length} parallel</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Progress bar */}
          <div className="w-28 h-2 bg-muted/50 rounded-full overflow-hidden hidden sm:block">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
          {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </div>
      </button>

      {/* Steps timeline */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="px-6 pb-5 pt-1">
              <div className="relative">
                {/* Vertical timeline line */}
                <div className="absolute left-[15px] top-2 bottom-2 w-px bg-gradient-to-b from-primary/20 via-border to-border/40" />

                <div className="space-y-1">
                  {/* Running steps first */}
                  {runningSteps.map((step, index) => {
                    const config = getAgentConfig(step.agent);
                    const stepIdx = steps.indexOf(step);
                    return (
                      <motion.div
                        key={`running-${stepIdx}-${step.tool}`}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className={`relative flex items-center gap-3 py-2.5 pl-0 pr-2 rounded-xl ${config.bg} border ${config.border} -mx-2 px-2`}
                      >
                        <StepIcon status="running" agent={step.agent} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-[13px] font-semibold ${config.text}`}>
                              {getToolLabel(step.tool)}
                            </span>
                            <AgentBadge agent={step.agent} />
                          </div>
                          {step.agent && (
                            <span className="text-[10px] text-muted-foreground/60">
                              {config.role}
                            </span>
                          )}
                        </div>
                        <div className="flex-shrink-0">
                          <Loader2 className={`w-3.5 h-3.5 ${config.text} animate-spin`} />
                        </div>
                      </motion.div>
                    );
                  })}

                  {/* Error steps */}
                  {errorSteps.map((step, index) => {
                    const stepIdx = steps.indexOf(step);
                    return (
                    <motion.div
                      key={`error-${stepIdx}-${step.tool}`}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="relative flex items-center gap-3 py-2 pl-0 -mx-2 px-2 rounded-xl bg-red-500/5 border border-red-500/15"
                    >
                      <StepIcon status="error" agent={step.agent} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-medium text-red-600 dark:text-red-400">
                            {getToolLabel(step.tool)}
                          </span>
                          <AgentBadge agent={step.agent} />
                        </div>
                        {step.error && (
                          <span className="text-[10px] text-red-500/70 truncate block">
                            {step.error}
                          </span>
                        )}
                      </div>
                    </motion.div>
                    );
                  })}

                  {/* Hidden completed steps indicator */}
                  {hiddenCount > 0 && (
                    <button
                      onClick={() => setShowAllCompleted(true)}
                      className="text-[11px] text-muted-foreground/60 hover:text-muted-foreground py-1.5 pl-11 transition-colors"
                    >
                      + {hiddenCount} earlier steps...
                    </button>
                  )}

                  {/* Completed steps */}
                  {visibleCompletedSteps.map((step, index) => {
                    const stepIdx = steps.indexOf(step);
                    return (
                    <motion.div
                      key={`done-${stepIdx}-${step.tool}`}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.02 }}
                      className="relative flex items-center gap-3 py-1.5 pl-0"
                    >
                      <StepIcon status="completed" agent={step.agent} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-medium text-muted-foreground">
                            {getToolLabel(step.tool)}
                          </span>
                          <AgentBadge agent={step.agent} />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {step.duration != null && (
                          <span className="text-[10px] font-mono text-muted-foreground/50">
                            {step.duration < 1000 ? `${step.duration}ms` : `${(step.duration / 1000).toFixed(1)}s`}
                          </span>
                        )}
                        {step.parallel && (
                          <span className="text-[9px] font-mono text-muted-foreground/40 px-1.5 py-0.5 rounded-full bg-muted/50">||</span>
                        )}
                      </div>
                    </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
