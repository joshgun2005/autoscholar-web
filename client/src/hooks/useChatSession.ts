import { useState, useRef, useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useChatMutation } from "./useChatMutation";
import { useAnalytics } from "./useAnalytics";
import type { SearchResult } from "@shared/types";
import type { AgentStep } from "@/components/chat/agent-steps";
import {
  type SearchQuery,
  type ToolResult,
  type ConversationMessage,
  type FigureBatch,
  type PythonCodeEntry,
} from "./chatSessionTypes";
import { createSSEEventHandler } from "./sseEventHandlers";

// Re-export types so existing consumers keep working
export type { SearchQuery, ToolResult, ConversationMessage, FigureBatch, PythonCodeEntry };

const SESSION_STORAGE_KEY = 'autoscholar_active_session';
const CONTINUE_FROM_SHARE_KEY = 'autoscholar_continue_from_share';
const PENDING_PROMPT_KEY = 'autoscholar-pending-prompt';

export function useChatSession() {
  const queryClient = useQueryClient();

  // ─── Session state ──────────────────────────────────────
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(() => {
    // Restore session ID from sessionStorage on mount
    try { return sessionStorage.getItem(SESSION_STORAGE_KEY); } catch { return null; }
  });
  const [historyOpen, setHistoryOpen] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState("");

  // ─── Chat response state ────────────────────────────────
  const [streamingAnswer, setStreamingAnswer] = useState("");
  const [sources, setSources] = useState<SearchResult[]>([]);
  const [searchQueries, setSearchQueries] = useState<SearchQuery[]>([]);
  const [toolResults, setToolResults] = useState<ToolResult[]>([]);
  const [agentSteps, setAgentSteps] = useState<AgentStep[]>([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [pythonCode, setPythonCode] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Python executor returns untyped JSON
  const [monteCarloResults, setMonteCarloResults] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [optionsPricingResults, setOptionsPricingResults] = useState<any>(null);
  const [customPythonFigures, setCustomPythonFigures] = useState<FigureBatch[]>([]);
  const [figureRegistry, setFigureRegistry] = useState<Map<string, string>>(new Map());
  const [figureUrls, setFigureUrls] = useState<string[]>([]);
  const [pythonCodeHistory, setPythonCodeHistory] = useState<PythonCodeEntry[]>([]);
  const resultsRef = useRef<HTMLDivElement>(null);

  // ─── Persist session ID ─────────────────────────────────
  useEffect(() => {
    try {
      if (currentSessionId) {
        sessionStorage.setItem(SESSION_STORAGE_KEY, currentSessionId);
      } else {
        sessionStorage.removeItem(SESSION_STORAGE_KEY);
      }
    } catch { /* sessionStorage unavailable */ }
  }, [currentSessionId]);

  // ─── Load "continue from shared report" context on mount ────
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(CONTINUE_FROM_SHARE_KEY);
      if (raw) {
        sessionStorage.removeItem(CONTINUE_FROM_SHARE_KEY);
        const { question: q, answer: a } = JSON.parse(raw);
        if (q && a) {
          setConversationHistory([{ question: q, answer: a }]);
        }
      }
    } catch { /* noop */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Load pending prompt + optional revision session ────────────
  const pendingPromptRef = useRef<string | null>(null);
  const revisionSessionRef = useRef<string | null>(null);
  useEffect(() => {
    try {
      const pending = sessionStorage.getItem(PENDING_PROMPT_KEY);
      if (pending) {
        sessionStorage.removeItem(PENDING_PROMPT_KEY);
        pendingPromptRef.current = pending;
      }
      // Check if we need to load a specific session first (peer review revision)
      const revSession = sessionStorage.getItem('autoscholar-revision-session');
      if (revSession) {
        sessionStorage.removeItem('autoscholar-revision-session');
        revisionSessionRef.current = revSession;
      }
    } catch { /* noop */ }
  }, []);

  // ─── Auth ───────────────────────────────────────────────
  const { data: authData } = useQuery<{ user: { id: string; displayName: string } | null }>({
    queryKey: ['/api/auth/me'],
  });
  const currentUser = authData?.user ?? null;

  // ─── SSE event handler ──────────────────────────────────
  const chatMutation = useChatMutation(createSSEEventHandler({
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
  }));

  // ─── Analytics ──────────────────────────────────────────
  const analyticsStatus = chatMutation.isPending ? 'generating' : chatMutation.isError ? 'error' : 'idle';
  useAnalytics(analyticsStatus, chatMutation.isPending ? currentQuestion : undefined);

  // ─── Derived state ──────────────────────────────────────
  const hasSearched = streamingAnswer.length > 0 || chatMutation.isPending || chatMutation.isError || searchQueries.length > 0;

  // ─── Actions ────────────────────────────────────────────
  const clearResponseState = useCallback(() => {
    setStreamingAnswer("");
    setSources([]);
    setSearchQueries([]);
    setToolResults([]);
    setAgentSteps([]);
    setStatusMessage("");
    setCurrentSearchIndex(0);
    setPythonCode("");
    setMonteCarloResults(null);
    setOptionsPricingResults(null);
    setCustomPythonFigures([]);
    setFigureRegistry(new Map());
    setFigureUrls([]);
    setPythonCodeHistory([]);
  }, []);

  const handleSearch = useCallback((query: string, imageData?: string, imageMimeType?: string) => {
    if (currentQuestion && streamingAnswer) {
      setConversationHistory(prev => [...prev, {
        question: currentQuestion,
        answer: streamingAnswer,
      }]);
    }

    setCurrentQuestion(query);
    clearResponseState();

    // Read author profile from localStorage
    let authorProfile: { name: string; university: string; department: string; email: string } | undefined;
    try {
      const raw = localStorage.getItem('autoscholar_author_profile');
      if (raw) authorProfile = JSON.parse(raw);
    } catch { /* noop */ }

    chatMutation.mutate({
      query,
      history: currentQuestion && streamingAnswer
        ? [...conversationHistory, { question: currentQuestion, answer: streamingAnswer }]
        : conversationHistory,
      sessionId: currentSessionId || undefined,
      imageData,
      imageMimeType,
      authorProfile,
    });
  }, [currentQuestion, streamingAnswer, conversationHistory, currentSessionId, clearResponseState, chatMutation]);

  // ─── Stable ref to chatMutation so async callbacks always use latest ──
  const chatMutationRef = useRef(chatMutation);
  chatMutationRef.current = chatMutation;

  // ─── Fire pending prompt (+ optional revision session load) ────────
  const pendingFiredRef = useRef(false);
  useEffect(() => {
    if (pendingPromptRef.current && !pendingFiredRef.current) {
      pendingFiredRef.current = true;
      const prompt = pendingPromptRef.current;
      const revSession = revisionSessionRef.current;
      pendingPromptRef.current = null;
      revisionSessionRef.current = null;

      if (revSession) {
        // Load the original conversation session, then fire revision prompt
        (async () => {
          let loadedSessionId: string | null = null;
          let loadedHistory: ConversationMessage[] = [];
          try {
            const response = await fetch(`/api/sessions/${revSession}`);
            if (response.ok) {
              const session = await response.json();
              loadedSessionId = session.sessionId;
              setCurrentSessionId(session.sessionId);
              if (session.messages) {
                const msgs = typeof session.messages === 'string' ? JSON.parse(session.messages) : session.messages;
                loadedHistory = msgs.map((m: { question?: string; answer?: string }) => ({
                  question: m.question || '',
                  answer: m.answer || '',
                }));
                setConversationHistory(loadedHistory);
              }
            }
          } catch (err) {
            console.warn('[useChatSession] Failed to load revision session:', err);
          }

          // Read author profile
          let authorProfile: { name: string; university: string; department: string; email: string } | undefined;
          try {
            const raw = localStorage.getItem('autoscholar_author_profile');
            if (raw) authorProfile = JSON.parse(raw);
          } catch { /* noop */ }

          // Fire mutation directly using ref (always latest instance, never stale)
          setCurrentQuestion(prompt);
          clearResponseState();
          console.log('[useChatSession] Firing revision prompt, sessionId:', loadedSessionId, 'history length:', loadedHistory.length);
          chatMutationRef.current.mutate({
            query: prompt,
            history: loadedHistory,
            sessionId: loadedSessionId || undefined,
            authorProfile,
          });
        })();
      } else {
        // Normal pending prompt (prompt library, etc.) — fire directly
        const timer = setTimeout(() => handleSearch(prompt), 100);
        return () => clearTimeout(timer);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRetry = useCallback(() => {
    chatMutation.reset();
    clearResponseState();
  }, [chatMutation, clearResponseState]);

  const handleNewConversation = useCallback(() => {
    setCurrentSessionId(null);
    setConversationHistory([]);
    setCurrentQuestion("");
    clearResponseState();
    chatMutation.reset();
    try { sessionStorage.removeItem(SESSION_STORAGE_KEY); } catch { /* noop */ }
  }, [clearResponseState, chatMutation]);

  const handleLogout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    queryClient.invalidateQueries({ queryKey: ['/api/sessions'] });
  }, [queryClient]);

  const handleLoadSession = useCallback(async (sessionId: string) => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}`);
      if (!response.ok) return;
      const session = await response.json();
      setCurrentSessionId(session.sessionId);
      if (session.messages) {
        const msgs = typeof session.messages === 'string' ? JSON.parse(session.messages) : session.messages;
        setConversationHistory(msgs.map((m: { question?: string; answer?: string }) => ({
          question: m.question || '',
          answer: m.answer || '',
        })));

        // Restore Python code history from all messages
        const allCodeEntries: PythonCodeEntry[] = [];
        for (const m of msgs) {
          if (m.pythonCodeEntries && Array.isArray(m.pythonCodeEntries)) {
            for (const entry of m.pythonCodeEntries) {
              if (!entry.code) continue;
              allCodeEntries.push({
                id: entry.id || `py-restored-${allCodeEntries.length}`,
                code: entry.code,
                description: entry.description || 'Python analysis',
                timestamp: entry.timestamp || 0,
                status: entry.status === 'error' ? 'error' : 'completed',
                error: entry.error,
                duration: entry.duration,
              });
            }
          }
        }
        setPythonCodeHistory(allCodeEntries);
      }
      setHistoryOpen(false);
    } catch (error) {
      console.error('Failed to load session:', error);
    }
  }, []);

  return {
    // Auth
    currentUser,
    handleLogout,

    // Session
    currentSessionId,
    historyOpen,
    setHistoryOpen,
    handleLoadSession,

    // Chat state
    conversationHistory,
    currentQuestion,
    streamingAnswer,
    sources,
    searchQueries,
    toolResults,
    agentSteps,
    statusMessage,
    currentSearchIndex,
    pythonCode,
    monteCarloResults,
    optionsPricingResults,
    customPythonFigures,
    figureRegistry,
    figureUrls,
    pythonCodeHistory,
    resultsRef,

    // Mutation state
    chatMutation,
    hasSearched,

    // Actions
    handleSearch,
    handleRetry,
    handleNewConversation,
  };
}
