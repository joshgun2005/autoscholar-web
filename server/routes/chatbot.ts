/**
 * Chatbot route — /api/chatbot POST endpoint.
 *
 * Lightweight AI assistant powered by Claude Opus 4.6 with RAG
 * over AutoScholar's published papers. Streams responses via SSE.
 */

import type { Express, Request, Response } from "express";
import axios from "axios";
import { storage } from "../storage";
import { logger } from "../utils/logger";
import {
  ANTHROPIC_API_URL,
  ANTHROPIC_API_KEY,
  ANTHROPIC_VERSION,
} from "../services/claude/streamingConfig";

// ── Constants ──────────────────────────────────────────────

const CHATBOT_MODEL = "claude-opus-4-6";
const MAX_PAPERS_CONTEXT = 8;
const MAX_ABSTRACT_LENGTH = 600;

const SYSTEM_PROMPT = `You are the AutoScholar AI assistant — a knowledgeable, articulate research navigator embedded within the AutoScholar platform.

## Your Identity
AutoScholar is an autonomous AI-powered academic research platform that generates complete, publication-quality research papers. It uses a multi-agent pipeline:
- **Euler** (orchestrator) coordinates the full paper lifecycle
- **Gauss** (gap analysis) discovers literature gaps by searching 200M+ academic papers
- **Turing** (data collection) acquires real data from financial APIs, central banks, and public datasets
- **Newton** (dataset preparation) cleans, merges, and prepares datasets with full descriptive statistics
- **Fisher** (empirical analysis) performs rigorous econometric analysis with robustness checks and publication-quality figures

Each paper goes through 6 mandatory steps: gap discovery → data collection → dataset preparation → empirical analysis → journal-quality writing → LaTeX compilation into a 60-90 page PDF.

Papers are assigned an ASID (AutoScholar ID) and optionally peer-reviewed by Popper, an AI reviewer that scores methodology, rigor, and contribution.

## Your Role
- Explain AutoScholar's concept, architecture, and methodology
- Summarize and explain published research papers
- Guide users through the platform (journal, dashboard, paper generation)
- Answer questions about academic results, findings, and insights from papers
- Be helpful about the research process and methodology

## Tone & Style
- Academic but accessible — clear, structured, no fluff
- Concise: answer directly, then elaborate if needed
- Use markdown formatting (headers, lists, bold) for readability
- Reference specific papers by title and ASID when available
- Never invent paper content — only reference what's in context

## Constraints
- If asked about a paper not in the provided context, say so honestly
- Never fabricate citations, data, or findings
- Keep responses focused and under 500 words unless the user asks for detail`;

// ── RAG: Paper Retrieval ───────────────────────────────────

function scorePaperRelevance(
  paper: { title: string; abstract: string | null; keywords: string | null; domain: string | null },
  query: string,
): number {
  const q = query.toLowerCase();
  const words = q.split(/\s+/).filter((w) => w.length > 2);
  let score = 0;

  const title = (paper.title || "").toLowerCase();
  const abstract = (paper.abstract || "").toLowerCase();
  const keywords = (paper.keywords || "").toLowerCase();
  const domain = (paper.domain || "").toLowerCase();

  for (const word of words) {
    if (title.includes(word)) score += 3;
    if (abstract.includes(word)) score += 2;
    if (keywords.includes(word)) score += 2;
    if (domain.includes(word)) score += 1;
  }

  // Boost exact phrase match
  if (title.includes(q)) score += 10;
  if (abstract.includes(q)) score += 5;

  return score;
}

async function retrievePaperContext(query: string): Promise<string> {
  try {
    const papers = await storage.getJournalPapers();
    if (!papers || papers.length === 0) return "";

    const scored = papers
      .map((p) => ({
        paper: p,
        score: scorePaperRelevance(p, query),
      }))
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_PAPERS_CONTEXT);

    if (scored.length === 0) {
      // No keyword match — include most recent papers as general context
      const recent = papers.slice(0, 3);
      if (recent.length === 0) return "";
      const summaries = recent.map((p) => formatPaperSummary(p));
      return `\n\n## AutoScholar Paper Library (${papers.length} papers total)\nMost recent papers:\n\n${summaries.join("\n\n")}`;
    }

    const summaries = scored.map((s) => formatPaperSummary(s.paper));
    return `\n\n## Relevant AutoScholar Papers (${scored.length} of ${papers.length} total)\n\n${summaries.join("\n\n")}`;
  } catch (err) {
    logger.warn(`[Chatbot] RAG retrieval failed: ${(err as Error).message}`);
    return "";
  }
}

function formatPaperSummary(paper: any): string {
  const abstract = paper.abstract
    ? paper.abstract.length > MAX_ABSTRACT_LENGTH
      ? paper.abstract.substring(0, MAX_ABSTRACT_LENGTH) + "..."
      : paper.abstract
    : "No abstract available";

  let keywords = "";
  try {
    const parsed = JSON.parse(paper.keywords || "[]");
    if (Array.isArray(parsed) && parsed.length > 0) {
      keywords = `\n  Keywords: ${parsed.join(", ")}`;
    }
  } catch { /* ignore */ }

  return `**${paper.title}**${paper.asid ? ` (${paper.asid})` : ""}
  Authors: ${paper.authors || "AutoScholar"}
  Domain: ${paper.domain || "General"}${keywords}
  Abstract: ${abstract}
  Stats: ${paper.wordCount ? `~${paper.wordCount.toLocaleString()} words` : ""}${paper.figureCount ? `, ${paper.figureCount} figures` : ""}${paper.sectionCount ? `, ${paper.sectionCount} sections` : ""}
  Published: ${paper.publishedAt ? new Date(paper.publishedAt).toLocaleDateString() : "N/A"}`;
}

// ── Request Schema ─────────────────────────────────────────

interface ChatbotMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatbotRequestBody {
  message: string;
  history?: ChatbotMessage[];
}

// ── Route Registration ─────────────────────────────────────

export function registerChatbotRoute(app: Express) {
  app.post("/api/chatbot", async (req: Request, res: Response) => {
    const { message, history = [] } = req.body as ChatbotRequestBody;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return res.status(400).json({ error: "Message is required" });
    }
    if (message.trim().length > 2000) {
      return res.status(400).json({ error: "Message too long (max 2000 characters)" });
    }

    if (!ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: "AI service not configured" });
    }

    // Set up SSE
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.setHeader("Content-Encoding", "none");
    res.flushHeaders();

    const safeWrite = (data: string) => {
      if (res.writableEnded || res.destroyed) return;
      try {
        res.write(data);
        if ((res as any).flush) (res as any).flush();
      } catch { /* client disconnected */ }
    };

    try {
      // RAG: retrieve relevant paper context
      const paperContext = await retrievePaperContext(message.trim());

      // Build messages
      const messages: ChatbotMessage[] = [
        ...history.slice(-10), // Keep last 10 messages for context
        { role: "user", content: message.trim() },
      ];

      // Stream from Claude
      const response = await axios.post(
        ANTHROPIC_API_URL,
        {
          model: CHATBOT_MODEL,
          max_tokens: 2048,
          system: SYSTEM_PROMPT + paperContext,
          messages,
          stream: true,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "x-api-key": ANTHROPIC_API_KEY,
            "anthropic-version": ANTHROPIC_VERSION,
          },
          responseType: "stream",
          timeout: 60000,
        },
      );

      let fullText = "";
      let buffer = "";

      response.data.on("data", (chunk: Buffer) => {
        buffer += chunk.toString();
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (raw === "[DONE]") continue;

          try {
            const event = JSON.parse(raw);

            if (event.type === "content_block_delta" && event.delta?.type === "text_delta") {
              const text = event.delta.text;
              fullText += text;
              safeWrite(`data: ${JSON.stringify({ type: "text", content: text })}\n\n`);
            }

            if (event.type === "message_stop") {
              safeWrite(`data: ${JSON.stringify({ type: "done" })}\n\n`);
            }

            if (event.type === "error") {
              logger.error(`[Chatbot] Claude stream error: ${JSON.stringify(event.error)}`);
              safeWrite(`data: ${JSON.stringify({ type: "error", message: "An error occurred" })}\n\n`);
            }
          } catch { /* skip malformed lines */ }
        }
      });

      response.data.on("end", () => {
        // Ensure done is sent
        if (!res.writableEnded) {
          safeWrite(`data: ${JSON.stringify({ type: "done" })}\n\n`);
          res.end();
        }
      });

      response.data.on("error", (err: Error) => {
        logger.error(`[Chatbot] Stream error: ${err.message}`);
        safeWrite(`data: ${JSON.stringify({ type: "error", message: "Stream interrupted" })}\n\n`);
        if (!res.writableEnded) res.end();
      });

      // Clean up on client disconnect
      req.on("close", () => {
        response.data.destroy();
      });
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      logger.error(`[Chatbot] Request failed: ${msg}`);

      if (!res.writableEnded) {
        safeWrite(`data: ${JSON.stringify({ type: "error", message: "Failed to get response" })}\n\n`);
        res.end();
      }
    }
  });

  // Paper count endpoint for chatbot context
  app.get("/api/chatbot/papers-summary", async (_req: Request, res: Response) => {
    try {
      const papers = await storage.getJournalPapers();
      const domains = new Set(papers.map((p) => p.domain).filter(Boolean));
      res.json({
        totalPapers: papers.length,
        domains: Array.from(domains),
        recentTitles: papers.slice(0, 5).map((p) => ({ title: p.title, asid: p.asid })),
      });
    } catch {
      res.json({ totalPapers: 0, domains: [], recentTitles: [] });
    }
  });
}
