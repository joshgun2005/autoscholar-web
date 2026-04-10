// ─── Live Paper Room — Real SSE Hook ──────────────────────────
// Connects to /api/sessions/:sessionId/stream and maps real SSE
// events into the same LivePaperState shape that the UI expects.

import { useState, useEffect, useRef } from "react";
import type { LivePaperState, LiveEvent, PaperStatus, PaperSection, PaperFigure } from "./types";
import { getBaseUrl } from "@/config";

/** Agent metadata mapping (matches server agent names) */
const AGENT_META: Record<string, { role: string; color: string; icon: string }> = {
  Newton:  { role: "Data Collection & Financial APIs",   color: "blue",    icon: "database" },
  Fisher:  { role: "Statistical Analysis & Modeling",    color: "violet",  icon: "bar-chart-2" },
  Turing:  { role: "Python Execution & Web Scraping",   color: "emerald", icon: "code" },
  Gauss:   { role: "Literature & Gap Analysis",          color: "amber",   icon: "book-open" },
  Euler:   { role: "Paper Writing & LaTeX Compilation",  color: "rose",    icon: "file-text" },
};

/** Standard paper section definitions */
const DEFAULT_SECTIONS: Array<{ id: string; title: string }> = [
  { id: "introduction",      title: "Introduction" },
  { id: "literature_review",  title: "Literature Review" },
  { id: "data",              title: "Data" },
  { id: "methodology",       title: "Methodology" },
  { id: "results",           title: "Results" },
  { id: "discussion",        title: "Discussion" },
  { id: "conclusion",        title: "Conclusion" },
  { id: "appendix",          title: "Appendix" },
];

/** Map section_type from server to a display title */
const SECTION_TITLE_MAP: Record<string, string> = {
  introduction: "Introduction",
  literature_review: "Literature Review",
  methodology: "Methodology",
  data: "Data",
  results: "Results",
  discussion: "Discussion",
  conclusion: "Conclusion",
  appendix: "Appendix",
  economic_environment: "Economic Environment",
  equilibrium: "Equilibrium",
  computational_method: "Computational Method",
  quantitative_results: "Quantitative Results",
  extensions: "Extensions",
};

function createInitialLiveState(sessionId: string): LivePaperState {
  return {
    id: sessionId,
    title: "Research in Progress",
    subtitle: "Connecting to live session...",
    status: "researching",
    progress: 0,
    startedAt: Date.now(),
    elapsedSeconds: 0,
    activeAgentId: null,
    sections: DEFAULT_SECTIONS.map(s => ({
      id: s.id,
      title: s.title,
      status: "pending" as const,
      content: "",
      wordCount: 0,
      updatedAt: 0,
      recentChanges: [],
    })),
    figures: [],
    references: [],
    agents: Object.entries(AGENT_META).map(([name, meta]) => ({
      id: name.toLowerCase(),
      name,
      role: meta.role,
      status: "idle" as const,
      currentTask: null,
      lastAction: null,
      lastActionAt: null,
      color: meta.color,
      icon: meta.icon,
      toolCalls: 0,
    })),
    events: [],
    totalToolCalls: 0,
    totalTokens: 0,
  };
}

/** Canonical ordering — status can only advance, never regress */
const STATUS_ORDER: Record<PaperStatus, number> = {
  researching: 0, writing: 1, validating: 2, compiling: 3, recovery: 2, completed: 4,
};

/** Advance status only if the candidate is strictly ahead of current */
function advanceStatus(current: PaperStatus, candidate: PaperStatus): PaperStatus {
  if (current === "completed") return "completed";
  return STATUS_ORDER[candidate] > STATUS_ORDER[current] ? candidate : current;
}

/** Infer pipeline status from tool names — only advances forward */
function inferStatus(toolName: string, currentStatus: PaperStatus): PaperStatus {
  if (currentStatus === "completed") return "completed";
  if (toolName.includes("compile") || toolName.includes("recompile")) return advanceStatus(currentStatus, "compiling");
  if (toolName.includes("write_paper") || toolName.includes("generate_research")) return advanceStatus(currentStatus, "writing");
  if (toolName.includes("peer_review") || toolName.includes("validate")) return advanceStatus(currentStatus, "validating");
  if (toolName.includes("patch_latex") || toolName.includes("inspect_latex")) return advanceStatus(currentStatus, "compiling");
  return currentStatus;
}

function inferStatusFromMessage(message: string, current: PaperStatus): PaperStatus {
  if (current === "completed") return "completed";
  const lower = message.toLowerCase();
  if (lower.includes("compil") || lower.includes("latex") || lower.includes("pdf")) return advanceStatus(current, "compiling");
  if (lower.includes("writing") || lower.includes("generating paper") || lower.includes("drafting")) return advanceStatus(current, "writing");
  if (lower.includes("validat") || lower.includes("review")) return advanceStatus(current, "validating");
  // "researching" is stage 0 — never advance TO it from a later stage
  if (STATUS_ORDER[current] === 0 && (lower.includes("research") || lower.includes("analys") || lower.includes("search") || lower.includes("fetching"))) return current;
  return current;
}

/** Estimate progress: count completed sections + tool calls */
function estimateProgress(state: LivePaperState): number {
  if (state.status === "completed") return 100;

  const completedSections = state.sections.filter(s => s.status === "completed").length;
  const totalSections = Math.max(state.sections.length, 1);
  const writingSections = state.sections.filter(s => s.status === "writing").length;

  // Section-based progress (0-80%)
  const sectionProgress = ((completedSections + writingSections * 0.5) / totalSections) * 80;

  // Status-based minimum floor
  const statusFloor: Record<PaperStatus, number> = {
    researching: 5, writing: 30, validating: 75, compiling: 85, recovery: 60, completed: 100,
  };
  const floor = statusFloor[state.status] ?? 0;

  // Tool-call bonus (max 15%)
  const toolBonus = Math.min(state.totalToolCalls * 1.5, 15);

  // Figure bonus
  const figBonus = state.figures.length * 2;

  return Math.min(Math.max(sectionProgress + toolBonus + figBonus, floor), 95);
}

/** Map pipeline stage to the primary agent responsible */
function getStageAgent(status: PaperStatus): string | null {
  switch (status) {
    case "writing":    return "euler";
    case "compiling":  return "euler";
    case "validating": return "euler";
    case "researching": return null; // multiple agents possible
    default: return null;
  }
}

/** Strip LaTeX commands to get readable text preview */
function latexToPlainText(latex: string): string {
  if (!latex) return "";
  return latex
    // Remove comments
    .replace(/%.*$/gm, "")
    // Remove \section, \subsection headers (keep the title text)
    .replace(/\\(sub)*section\*?\{([^}]*)\}/g, "$2\n\n")
    // Remove common environments
    .replace(/\\begin\{[^}]+\}(\[[^\]]*\])*/g, "")
    .replace(/\\end\{[^}]+\}/g, "")
    // Remove \label, \ref, \cite
    .replace(/\\(label|ref|cite|citep|citet|eqref|autoref)\{[^}]*\}/g, "")
    // Remove formatting commands but keep text
    .replace(/\\(textbf|textit|emph|underline|texttt)\{([^}]*)\}/g, "$2")
    // Remove \item
    .replace(/\\item\s*/g, "- ")
    // Remove remaining simple commands
    .replace(/\\[a-zA-Z]+\*?/g, "")
    // Clean up braces
    .replace(/[{}]/g, "")
    // Clean up multiple newlines
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function useLiveSession(sessionId: string | null) {
  const [state, setState] = useState<LivePaperState | null>(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const startTimeRef = useRef(Date.now());
  const eventSourceRef = useRef<EventSource | null>(null);
  // Track which section is currently being written (from tool_start)
  const activeSectionRef = useRef<string | null>(null);
  // Accumulate streaming text
  const textBufferRef = useRef("");

  // Elapsed time ticker
  useEffect(() => {
    if (!state || state.status === "completed") return;
    const interval = setInterval(() => {
      setState(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          elapsedSeconds: Math.floor((Date.now() - startTimeRef.current) / 1000),
        };
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [state?.status]);

  // SSE connection
  useEffect(() => {
    if (!sessionId) return;

    setState(createInitialLiveState(sessionId));
    startTimeRef.current = Date.now();
    activeSectionRef.current = null;
    textBufferRef.current = "";
    setError(null);

    const url = `${getBaseUrl()}/api/sessions/${sessionId}/stream`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onopen = () => setConnected(true);

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setState(prev => {
          if (!prev) return prev;
          return processSSEEvent(prev, data, activeSectionRef, textBufferRef);
        });
      } catch {
        // Non-JSON event, ignore
      }
    };

    es.onerror = () => {
      setConnected(false);
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
      setConnected(false);
    };
  }, [sessionId]);

  return { state, connected, error };
}

/** Process a single SSE event and return updated state */
function processSSEEvent(
  prev: LivePaperState,
  data: any,
  activeSectionRef: React.MutableRefObject<string | null>,
  textBufferRef: React.MutableRefObject<string>,
): LivePaperState {
  const next = { ...prev };

  switch (data.type) {
    case "session_start": {
      next.subtitle = "Session connected — agent pipeline starting...";
      next.events = [createEvent("system", "Session Started", "Connected to live research pipeline", null, "success"), ...prev.events].slice(0, 150);
      break;
    }

    case "status": {
      const msg = data.message || "";
      next.subtitle = msg.replace(/^[^\w]*/, ""); // strip leading emoji
      next.status = inferStatusFromMessage(msg, prev.status);
      next.progress = estimateProgress(next);

      next.events = [createEvent("system", "Status Update", msg, null, "info"), ...prev.events].slice(0, 150);
      break;
    }

    case "text": {
      // Accumulate text for the response
      const chunk = data.content || "";
      textBufferRef.current += chunk;

      // If we're still in "researching" and have tools done, switch to writing
      if (prev.status === "researching" && prev.totalToolCalls > 0) {
        next.status = "writing";
      }

      // Try to extract title from accumulated text
      if (next.title === "Research in Progress" && textBufferRef.current.length > 100) {
        const titleMatch = textBufferRef.current.match(/^#\s+(.+)/m)
          || textBufferRef.current.match(/^##\s+(.+)/m)
          || textBufferRef.current.match(/\*\*(.{10,80})\*\*/);
        if (titleMatch) {
          next.title = titleMatch[1].replace(/\*\*/g, "").trim().substring(0, 120);
        }
      }

      next.progress = estimateProgress(next);
      break;
    }

    case "tools": {
      const tools = data.tools || [];
      next.events = [
        createEvent("system", "Tools Dispatched", `${tools.length} tool(s): ${tools.map((t: any) => t.name).join(", ")}`, null, "info"),
        ...prev.events,
      ].slice(0, 150);
      break;
    }

    case "tool_start": {
      const agentName = data.agent || null;
      const agentId = agentName?.toLowerCase() || null;
      const toolName = data.tool || "unknown";
      const description = data.input?.description || toolName;

      next.totalToolCalls = prev.totalToolCalls + 1;
      next.status = inferStatus(toolName, prev.status);

      // Track which section is being written
      if (toolName === "write_paper_section" && data.input?.section_type) {
        const sectionType = data.input.section_type;
        activeSectionRef.current = sectionType;

        // Mark section as "writing"
        const sectionIdx = next.sections.findIndex(s => s.id === sectionType);
        if (sectionIdx >= 0) {
          next.sections = [...prev.sections];
          next.sections[sectionIdx] = {
            ...next.sections[sectionIdx],
            status: "writing",
            updatedAt: Date.now(),
            recentChanges: ["Writing in progress..."],
          };
        } else {
          // Section type not in default list — add it dynamically
          next.sections = [...prev.sections, {
            id: sectionType,
            title: SECTION_TITLE_MAP[sectionType] || sectionType.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
            status: "writing" as const,
            content: "",
            wordCount: 0,
            updatedAt: Date.now(),
            recentChanges: ["Writing in progress..."],
          }];
        }
      }

      // Update agent status
      if (agentId) {
        next.agents = prev.agents.map(a => {
          if (a.id === agentId) {
            return {
              ...a,
              status: "active" as const,
              currentTask: description,
              lastAction: `Running ${toolName}`,
              lastActionAt: Date.now(),
              toolCalls: a.toolCalls + 1,
            };
          }
          return a;
        });

        // activeAgentId = pick the agent most relevant to the current pipeline stage
        // Priority: stage-matching agent > most recently started agent
        const stageAgent = getStageAgent(next.status);
        const stageAgentIsActive = stageAgent && next.agents.find(a => a.id === stageAgent)?.status === "active";
        next.activeAgentId = stageAgentIsActive ? stageAgent : agentId;
      }

      // Determine event type
      const eventType = toolName.includes("search") || toolName.includes("literature") ? "research"
        : toolName.includes("python") || toolName.includes("script") ? "analysis"
        : toolName.includes("paper") || toolName.includes("latex") ? "writing"
        : toolName.includes("get_") || toolName.includes("fmp") ? "data"
        : toolName.includes("compile") || toolName.includes("recompile") ? "compilation"
        : "system";

      next.events = [
        createEvent(eventType as any, `${agentName || "Agent"}: ${toolName}`, description, agentId, "info"),
        ...prev.events,
      ].slice(0, 150);

      next.progress = estimateProgress(next);
      break;
    }

    case "tool_complete": {
      const duration = data.duration ? `${(data.duration / 1000).toFixed(1)}s` : "";
      const toolName = data.tool || "";
      const completedToolId = data.toolId || "";

      // Estimate tokens from duration
      const estimatedTokens = data.duration ? Math.floor(data.duration / 2) + 500 : 2000;
      next.totalTokens = prev.totalTokens + estimatedTokens;

      // Mark the agent that was running this tool as idle (if it was active on this tool)
      next.agents = prev.agents.map(a => {
        if (a.status === "active" && a.lastAction === `Running ${toolName}`) {
          return {
            ...a,
            status: "idle" as const,
            currentTask: null,
            lastAction: `Completed ${toolName}`,
            lastActionAt: Date.now(),
          };
        }
        return a;
      });

      // Update activeAgentId — pick the still-active agent most relevant to stage
      const stillActive = next.agents.filter(a => a.status === "active");
      if (stillActive.length > 0) {
        const stageAgent = getStageAgent(next.status);
        const stageMatch = stillActive.find(a => a.id === stageAgent);
        next.activeAgentId = stageMatch?.id || stillActive[0].id;
      } else {
        next.activeAgentId = null;
      }

      next.events = [
        createEvent("system", `${toolName} completed`, `Finished in ${duration}`, null, "success"),
        ...prev.events,
      ].slice(0, 150);

      next.progress = estimateProgress(next);
      break;
    }

    case "tool_result": {
      const toolName = data.tool || "";
      const result = data.result || {};

      // Handle write_paper_section results — mark section as completed with content
      if (toolName === "write_paper_section" && result.success) {
        const sectionType = result.section_type;
        const contentLength = result.content_length || 0;
        const storedSections = result.stored_sections || [];

        // Update this section to completed
        const sectionIdx = next.sections.findIndex(s => s.id === sectionType);
        if (sectionIdx >= 0) {
          next.sections = [...prev.sections];
          const wordCount = Math.round(contentLength / 6); // rough LaTeX chars to words
          next.sections[sectionIdx] = {
            ...next.sections[sectionIdx],
            status: "completed",
            wordCount,
            updatedAt: Date.now(),
            content: next.sections[sectionIdx].content || `Section completed (${wordCount.toLocaleString()} words, ${contentLength.toLocaleString()} characters of LaTeX content)`,
            recentChanges: [
              `${wordCount.toLocaleString()} words written`,
              ...(result.warning ? ["Quality review notes available"] : []),
              ...(result.bibtex_keys?.length ? [`${result.bibtex_keys.length} citations`] : []),
              ...(result.figure_ids?.length ? [`${result.figure_ids.length} figure(s)`] : []),
            ],
          };
        } else {
          // Add dynamically
          const wordCount = Math.round(contentLength / 6);
          next.sections = [...prev.sections, {
            id: sectionType,
            title: SECTION_TITLE_MAP[sectionType] || sectionType.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
            status: "completed" as const,
            content: `Section completed (${wordCount.toLocaleString()} words, ${contentLength.toLocaleString()} characters of LaTeX content)`,
            wordCount,
            updatedAt: Date.now(),
            recentChanges: [`${wordCount.toLocaleString()} words written`],
          }];
        }

        // Update progress display
        const completedCount = next.sections.filter(s => s.status === "completed").length;
        next.subtitle = `${completedCount}/${next.sections.length} sections written`;

        // Add event
        next.events = [
          createEvent("writing", `Section: ${SECTION_TITLE_MAP[sectionType] || sectionType}`,
            `Completed — ${contentLength.toLocaleString()} chars (${storedSections.length} total sections stored)`,
            "euler", "success"),
          ...prev.events,
        ].slice(0, 150);

        activeSectionRef.current = null;
      }

      // Handle compile_research_paper results
      if (toolName === "compile_research_paper" || toolName === "generate_research_paper") {
        if (result.success || result.download_url) {
          next.status = "completed";
          next.progress = 100;
          next.subtitle = "Paper compiled successfully";
          next.events = [
            createEvent("compilation", "Paper Compiled",
              result.download_url ? `PDF ready: ${result.download_url}` : "Compilation complete",
              "euler", "success"),
            ...prev.events,
          ].slice(0, 150);
        } else if (result.error) {
          next.status = "recovery";
          next.events = [
            createEvent("compilation", "Compilation Failed", result.error, "euler", "warning"),
            ...prev.events,
          ].slice(0, 150);
        }
      }

      // Handle academic search results — extract as references
      if ((toolName.includes("search") || toolName.includes("literature") || toolName === "crossref_lookup") && result.results) {
        const searchResults = Array.isArray(result.results) ? result.results : [];
        if (searchResults.length > 0) {
          const newRefs = searchResults.slice(0, 8).map((r: any, i: number) => ({
            id: `ref-${Date.now()}-${i}`,
            authors: r.authors || r.author || r.source || "Unknown",
            title: r.title || "Untitled",
            year: r.year || r.publicationYear || new Date().getFullYear(),
            journal: r.journal || r.venue || r.source || "",
            addedAt: Date.now(),
          }));
          next.references = [...prev.references, ...newRefs];
        }
      }

      next.progress = estimateProgress(next);
      break;
    }

    case "tool_error": {
      next.events = [
        createEvent("system", `${data.tool} failed`, data.error || "Unknown error", null, "warning"),
        ...prev.events,
      ].slice(0, 150);
      break;
    }

    case "custom_python_figures": {
      // Figures generated by Python execution
      const figureUrls = data.figureUrls || data.figures || [];
      const description = data.description || "Generated Figure";
      const figureId = data.figureId || `fig-${Date.now()}`;

      const newFigures: PaperFigure[] = figureUrls.map((url: string, idx: number) => ({
        id: `${figureId}-${idx}`,
        title: `Figure ${prev.figures.length + idx + 1}`,
        caption: description,
        status: "completed" as const,
        previewUrl: url.startsWith("/") ? url : (url.startsWith("data:") ? url : `/figures/${url}`),
        sectionId: activeSectionRef.current || "results",
      }));

      next.figures = [...prev.figures, ...newFigures];

      next.events = [
        createEvent("analysis", "Figures Generated",
          `${newFigures.length} figure(s): ${description}`,
          "turing", "success"),
        ...prev.events,
      ].slice(0, 150);

      next.progress = estimateProgress(next);
      break;
    }

    case "sources": {
      const count = Array.isArray(data.sources) ? data.sources.length : 0;
      if (count > 0) {
        next.references = [
          ...prev.references,
          ...data.sources.slice(0, 10).map((s: any, i: number) => ({
            id: `ref-${Date.now()}-${i}`,
            authors: s.author || s.source || "Unknown",
            title: s.title || s.url || "Source",
            year: s.year || new Date().getFullYear(),
            journal: s.source || s.publisher || "",
            addedAt: Date.now(),
          })),
        ];
        next.events = [
          createEvent("research", "Sources Added", `${count} source(s) collected`, null, "success"),
          ...prev.events,
        ].slice(0, 150);
      }
      break;
    }

    case "python_code": {
      // Python code being executed — show as analysis event
      next.events = [
        createEvent("analysis", "Python Script", "Executing analysis code...", "turing", "info"),
        ...prev.events,
      ].slice(0, 150);
      break;
    }

    case "done": {
      next.status = "completed";
      next.progress = 100;
      next.subtitle = "Research completed";
      next.agents = prev.agents.map(a => ({
        ...a,
        status: "completed" as const,
        currentTask: null,
      }));
      next.events = [
        createEvent("system", "Session Complete", "All agents have finished", null, "success"),
        ...prev.events,
      ].slice(0, 150);
      break;
    }

    case "session_ended": {
      next.status = "completed";
      next.progress = 100;
      next.subtitle = data.reason === "max_age" ? "Session timed out" : "Session ended";
      break;
    }

    case "error": {
      next.events = [
        createEvent("system", "Error", data.error || "An error occurred", null, "warning"),
        ...prev.events,
      ].slice(0, 150);
      break;
    }

    case "share": {
      // Shared report created
      next.events = [
        createEvent("system", "Report Shared", `Share ID: ${data.shareId}`, null, "success"),
        ...prev.events,
      ].slice(0, 150);
      break;
    }

    case "retry": {
      next.events = [
        createEvent("system", "Retrying", "Retrying Claude API call...", null, "warning"),
        ...prev.events,
      ].slice(0, 150);
      break;
    }

    default:
      break;
  }

  return next;
}

let eventCounter = 0;
function createEvent(
  type: LiveEvent["type"],
  title: string,
  message: string,
  agentId: string | null,
  severity: LiveEvent["severity"],
): LiveEvent {
  return {
    id: `live-${Date.now()}-${++eventCounter}`,
    timestamp: Date.now(),
    type,
    title,
    message,
    agentId,
    severity,
  };
}
