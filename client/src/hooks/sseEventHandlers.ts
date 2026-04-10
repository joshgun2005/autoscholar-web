import type { Dispatch, SetStateAction } from "react";
import type { SearchResult } from "@shared/types";
import type { AgentStep } from "@/components/chat/agent-steps";
import type { SearchQuery, ToolResult, FigureBatch, PythonCodeEntry } from "./chatSessionTypes";
import { FMP_TOOLS } from "./chatSessionTypes";

export interface SSEEventSetters {
  setStreamingAnswer: Dispatch<SetStateAction<string>>;
  setSources: Dispatch<SetStateAction<SearchResult[]>>;
  setSearchQueries: Dispatch<SetStateAction<SearchQuery[]>>;
  setToolResults: Dispatch<SetStateAction<ToolResult[]>>;
  setAgentSteps: Dispatch<SetStateAction<AgentStep[]>>;
  setStatusMessage: Dispatch<SetStateAction<string>>;
  setCurrentSearchIndex: Dispatch<SetStateAction<number>>;
  setPythonCode: Dispatch<SetStateAction<string>>;
  setMonteCarloResults: Dispatch<SetStateAction<any>>;
  setOptionsPricingResults: Dispatch<SetStateAction<any>>;
  setCustomPythonFigures: Dispatch<SetStateAction<FigureBatch[]>>;
  setFigureRegistry: Dispatch<SetStateAction<Map<string, string>>>;
  setFigureUrls: Dispatch<SetStateAction<string[]>>;
  setPythonCodeHistory: Dispatch<SetStateAction<PythonCodeEntry[]>>;
  currentSessionId: string | null;
  setCurrentSessionId: Dispatch<SetStateAction<string | null>>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createSSEEventHandler(setters: SSEEventSetters) {
  const {
    setStreamingAnswer,
    setSources,
    setSearchQueries,
    setToolResults,
    setAgentSteps,
    setStatusMessage,
    setCurrentSearchIndex,
    setPythonCode,
    setMonteCarloResults,
    setOptionsPricingResults,
    setCustomPythonFigures,
    setFigureRegistry,
    setFigureUrls,
    setPythonCodeHistory,
    currentSessionId,
    setCurrentSessionId,
  } = setters;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (event: any) => {
    switch (event.type) {
      case 'text':
        setStreamingAnswer(prev => prev + event.content);
        break;
      case 'retry':
        // Server is retrying after ECONNRESET — discard partial text from failed attempt
        if (event.discardLength > 0) {
          setStreamingAnswer(prev => prev.substring(0, prev.length - event.discardLength));
        }
        break;
      case 'sources':
        setSources(event.sources);
        break;
      case 'session_start':
        // Set session ID immediately so the dashboard can track it
        if (event.sessionId) {
          setCurrentSessionId(event.sessionId);
        }
        break;
      case 'done':
        if (event.sessionId && !currentSessionId) {
          setCurrentSessionId(event.sessionId);
        }
        break;
      case 'status':
        setStatusMessage(event.message);
        break;
      case 'search_queries':
        setSearchQueries(event.queries.map((q: string) => ({ query: q })));
        setStatusMessage(event.message);
        break;
      case 'search_progress':
        setCurrentSearchIndex(event.index);
        setStatusMessage(`Search ${event.index}/${event.total}: ${event.query}`);
        break;
      case 'search_result':
        setSearchQueries(prev => {
          const updated = [...prev];
          if (updated[event.index - 1]) {
            updated[event.index - 1].results = event.results;
          }
          return updated;
        });
        break;
      case 'tool_start':
        setAgentSteps(prev => [...prev, {
          tool: event.tool,
          status: 'running',
          input: event.input,
          parallel: event.parallel || false,
          agent: event.agent || null,
        }]);
        break;
      case 'tool_complete':
        setAgentSteps(prev => prev.map(step =>
          step.tool === event.tool && step.status === 'running'
            ? { ...step, status: 'completed', duration: event.duration }
            : step,
        ));
        // Update Python code entry status
        if (event.tool === 'execute_custom_python_analysis' || event.tool === 'run_python_script') {
          setPythonCodeHistory(prev => {
            const updated = [...prev];
            for (let i = updated.length - 1; i >= 0; i--) {
              if (updated[i].status === 'running') {
                updated[i] = { ...updated[i], status: 'completed', duration: event.duration };
                break;
              }
            }
            return updated;
          });
        }
        break;
      case 'tool_error':
        setAgentSteps(prev => prev.map(step =>
          step.tool === event.tool && step.status === 'running'
            ? { ...step, status: 'error', error: event.error }
            : step,
        ));
        if (event.tool === 'execute_custom_python_analysis' || event.tool === 'run_python_script') {
          setPythonCodeHistory(prev => {
            const updated = [...prev];
            for (let i = updated.length - 1; i >= 0; i--) {
              if (updated[i].status === 'running') {
                updated[i] = { ...updated[i], status: 'error', error: event.error };
                break;
              }
            }
            return updated;
          });
        }
        break;
      case 'python_code':
        setPythonCode(event.code);
        break;
      case 'python_code_entry':
        // Dedicated event for Code History panel
        setPythonCodeHistory(prev => [...prev, {
          id: event.toolId || `py-${Date.now()}`,
          code: event.code || '',
          description: event.description || 'Python analysis',
          timestamp: Date.now(),
          status: 'running',
        }]);
        break;
      case 'custom_python_figures': {
        const figId = event.figureId || `fig-${Date.now()}`;
        const isPlotTool = figId.startsWith('plot-');

        if (!isPlotTool) {
          const rawFigs = event.figures || [];
          const safeFigs = rawFigs.filter((f: unknown): f is string => typeof f === 'string' && f.length > 0);
          setCustomPythonFigures(prev => [...prev, {
            id: figId,
            figures: safeFigs,
            output: event.output,
            description: event.description,
          }]);
        }

        const rawUrls = event.figureUrls || event.figures || [];
        const urls = rawUrls.filter((u: unknown): u is string => typeof u === 'string' && u.length > 0);
        if (urls.length > 0) {
          setFigureRegistry(prev => {
            const next = new Map(prev);
            urls.forEach((url: string, idx: number) => next.set(`${figId}-${idx}`, url));
            return next;
          });
          setFigureUrls(prev => [...prev, ...urls]);
        }
        break;
      }
      case 'tool_result':
        if (event.tool === 'run_monte_carlo_simulation') {
          setMonteCarloResults(event.result);
        } else if (event.tool === 'calculate_options_price') {
          setOptionsPricingResults(event.result);
        } else if (FMP_TOOLS.includes(event.tool)) {
          setToolResults(prev => [...prev, { tool: event.tool, result: event.result }]);
        }
        break;
    }
  };
}
