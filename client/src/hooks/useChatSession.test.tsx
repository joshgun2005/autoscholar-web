import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useChatSession } from "./useChatSession";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
}

describe("useChatSession", () => {
  it("returns initial state", () => {
    const { result } = renderHook(() => useChatSession(), {
      wrapper: createWrapper(),
    });

    expect(result.current.currentUser).toBeNull();
    expect(result.current.currentSessionId).toBeNull();
    expect(result.current.conversationHistory).toEqual([]);
    expect(result.current.currentQuestion).toBe("");
    expect(result.current.streamingAnswer).toBe("");
    expect(result.current.sources).toEqual([]);
    expect(result.current.searchQueries).toEqual([]);
    expect(result.current.toolResults).toEqual([]);
    expect(result.current.agentSteps).toEqual([]);
    expect(result.current.pythonCode).toBe("");
    expect(result.current.monteCarloResults).toBeNull();
    expect(result.current.optionsPricingResults).toBeNull();
    expect(result.current.customPythonFigures).toEqual([]);
    expect(result.current.figureUrls).toEqual([]);
    expect(result.current.hasSearched).toBe(false);
    expect(result.current.historyOpen).toBe(false);
  });

  it("handleNewConversation resets all state", () => {
    const { result } = renderHook(() => useChatSession(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.handleNewConversation();
    });

    expect(result.current.currentSessionId).toBeNull();
    expect(result.current.conversationHistory).toEqual([]);
    expect(result.current.currentQuestion).toBe("");
    expect(result.current.streamingAnswer).toBe("");
    expect(result.current.sources).toEqual([]);
    expect(result.current.hasSearched).toBe(false);
  });

  it("setHistoryOpen toggles history panel", () => {
    const { result } = renderHook(() => useChatSession(), {
      wrapper: createWrapper(),
    });

    expect(result.current.historyOpen).toBe(false);

    act(() => {
      result.current.setHistoryOpen(true);
    });

    expect(result.current.historyOpen).toBe(true);
  });

  it("exposes chatMutation with expected shape", () => {
    const { result } = renderHook(() => useChatSession(), {
      wrapper: createWrapper(),
    });

    expect(result.current.chatMutation).toBeDefined();
    expect(typeof result.current.chatMutation.mutate).toBe("function");
    expect(typeof result.current.chatMutation.reset).toBe("function");
    expect(result.current.chatMutation.isPending).toBe(false);
    expect(result.current.chatMutation.isError).toBe(false);
  });

  it("exposes all action handlers as functions", () => {
    const { result } = renderHook(() => useChatSession(), {
      wrapper: createWrapper(),
    });

    expect(typeof result.current.handleSearch).toBe("function");
    expect(typeof result.current.handleRetry).toBe("function");
    expect(typeof result.current.handleNewConversation).toBe("function");
    expect(typeof result.current.handleLogout).toBe("function");
    expect(typeof result.current.handleLoadSession).toBe("function");
  });

  it("resultsRef is a valid ref object", () => {
    const { result } = renderHook(() => useChatSession(), {
      wrapper: createWrapper(),
    });

    expect(result.current.resultsRef).toBeDefined();
    expect(result.current.resultsRef.current).toBeNull();
  });
});
