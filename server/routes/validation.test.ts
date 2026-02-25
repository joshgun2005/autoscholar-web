import { describe, it, expect } from "vitest";
import {
  chatBodySchema,
  registerBodySchema,
  loginBodySchema,
  heartbeatBodySchema,
  shareBodySchema,
} from "./validation";

describe("chatBodySchema", () => {
  it("accepts valid chat request", () => {
    const result = chatBodySchema.safeParse({
      query: "Analyze AAPL stock",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.query).toBe("Analyze AAPL stock");
      expect(result.data.history).toEqual([]);
    }
  });

  it("accepts request with history", () => {
    const result = chatBodySchema.safeParse({
      query: "Follow up question",
      history: [{ question: "Previous Q", answer: "Previous A" }],
      sessionId: "abc-123",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.history).toHaveLength(1);
      expect(result.data.sessionId).toBe("abc-123");
    }
  });

  it("rejects empty query", () => {
    const result = chatBodySchema.safeParse({ query: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing query", () => {
    const result = chatBodySchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects query exceeding max length", () => {
    const result = chatBodySchema.safeParse({ query: "x".repeat(10001) });
    expect(result.success).toBe(false);
  });
});

describe("registerBodySchema", () => {
  it("accepts valid name", () => {
    const result = registerBodySchema.safeParse({ name: "Alice" });
    expect(result.success).toBe(true);
  });

  it("rejects name shorter than 2 chars", () => {
    const result = registerBodySchema.safeParse({ name: "A" });
    expect(result.success).toBe(false);
  });

  it("rejects missing name", () => {
    const result = registerBodySchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("loginBodySchema", () => {
  it("accepts valid token", () => {
    const result = loginBodySchema.safeParse({ token: "vquant-abc1234" });
    expect(result.success).toBe(true);
  });

  it("rejects empty token", () => {
    const result = loginBodySchema.safeParse({ token: "" });
    expect(result.success).toBe(false);
  });
});

describe("heartbeatBodySchema", () => {
  it("accepts valid heartbeat", () => {
    const result = heartbeatBodySchema.safeParse({
      sessionId: "sess-123",
      status: "generating",
      currentQuery: "Analyzing NVDA",
    });
    expect(result.success).toBe(true);
  });

  it("accepts minimal heartbeat (sessionId only)", () => {
    const result = heartbeatBodySchema.safeParse({ sessionId: "sess-123" });
    expect(result.success).toBe(true);
  });

  it("rejects missing sessionId", () => {
    const result = heartbeatBodySchema.safeParse({ status: "idle" });
    expect(result.success).toBe(false);
  });
});

describe("shareBodySchema", () => {
  it("accepts valid share request", () => {
    const result = shareBodySchema.safeParse({
      question: "What is AAPL?",
      answer: "Apple Inc. is...",
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing question", () => {
    const result = shareBodySchema.safeParse({ answer: "Some answer" });
    expect(result.success).toBe(false);
  });

  it("rejects missing answer", () => {
    const result = shareBodySchema.safeParse({ question: "Some question" });
    expect(result.success).toBe(false);
  });
});
