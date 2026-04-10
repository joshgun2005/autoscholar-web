/**
 * Chat route — /api/chat POST endpoint and /api/speech-to-text.
 *
 * Extracted from server/routes.ts as a structural refactor (no logic changes).
 */

import type { Express, Request, Response } from "express";
import { storage } from "../storage";
import { callClaudeStreamingWithRetry, isResearchPaperRequest, upgradeResearchPrompt } from "../services/claudeService";
import { randomUUID } from "crypto";
import type { SearchResult } from "@shared/types";
import { logger } from "../utils/logger";
import multer from "multer";
import path from "path";
import FormData from "form-data";
import axios from "axios";
import { executeToolCall, type ToolExecutorContext } from "./toolExecutor";
import { chatBodySchema } from "./validation";
import { sessionBroadcaster } from "../services/sessionBroadcaster";
import { getUserId } from "./auth";

/** Safe JSON.stringify that handles circular refs, NaN, Infinity, and huge payloads */
function safeJsonStringify(obj: unknown, maxLen = 0): string {
  const seen = new WeakSet();
  try {
    const raw = JSON.stringify(obj, (_key, value) => {
      if (typeof value === 'number' && !Number.isFinite(value)) return null;
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) return '[Circular]';
        seen.add(value);
      }
      return value;
    });
    if (maxLen > 0 && raw.length > maxLen) {
      return raw.substring(0, maxLen) + '…[truncated]';
    }
    return raw;
  } catch {
    return JSON.stringify({ error: 'Serialization failed' });
  }
}

export function registerChatRoute(app: Express): void {

  // Multer setup for audio file uploads (speech-to-text)
  const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

  // Speech-to-Text endpoint using ElevenLabs Scribe v2
  app.post("/api/speech-to-text", upload.single("audio"), async (req: Request, res: Response) => {
    try {
      const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
      if (!ELEVENLABS_API_KEY) {
        logger.error('ELEVENLABS_API_KEY not set in environment');
        return res.status(500).json({ error: "ElevenLabs API key not configured" });
      }

      const file = (req as any).file;
      if (!file) {
        logger.error('No audio file in request');
        return res.status(400).json({ error: "Audio file is required" });
      }

      logger.section('SPEECH-TO-TEXT');
      logger.kv('File size', `${(file.size / 1024).toFixed(1)} KB`);
      logger.kv('MIME type', file.mimetype);
      logger.kv('Original name', file.originalname);

      // Determine file extension from mimetype
      let ext = "webm";
      if (file.mimetype.includes("ogg")) ext = "ogg";
      else if (file.mimetype.includes("mp4")) ext = "mp4";
      else if (file.mimetype.includes("mpeg")) ext = "mp3";

      const formData = new FormData();
      formData.append("file", file.buffer, {
        filename: `audio.${ext}`,
        contentType: file.mimetype || "audio/webm",
      });
      formData.append("model_id", "scribe_v2");

      logger.info('Sending audio to ElevenLabs STT API...');

      const response = await axios.post(
        "https://api.elevenlabs.io/v1/speech-to-text",
        formData,
        {
          headers: {
            "xi-api-key": ELEVENLABS_API_KEY,
            ...formData.getHeaders(),
          },
          timeout: 60000,
        }
      );

      const text = response.data?.text || "";
      logger.success(`Transcription (${text.length} chars): "${text.substring(0, 150)}"`);

      return res.json({ text, language_code: response.data?.language_code });
    } catch (error: any) {
      const detail = error.response?.data ? JSON.stringify(error.response.data) : error.message;
      logger.error(`Speech-to-text error: ${detail}`);
      return res.status(error.response?.status || 500).json({
        error: error.response?.data?.detail || error.message || "Speech-to-text failed",
      });
    }
  });

  // ── Data file upload endpoint ──────────────────────────────────
  // Accepts CSV, Excel, Parquet, TSV files. Stores them in downloads/ and returns metadata.
  const dataUpload = multer({
    storage: multer.diskStorage({
      destination: (_req, _file, cb) => {
        const dir = path.join(process.cwd(), 'downloads');
        import('fs').then(fs => { fs.mkdirSync(dir, { recursive: true }); cb(null, dir); });
      },
      filename: (_req, file, cb) => {
        const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
        cb(null, `${Date.now()}_upload_${safe}`);
      },
    }),
    limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB
    fileFilter: (_req: any, file: any, cb: any) => {
      const allowed = ['.csv', '.tsv', '.xlsx', '.xls', '.parquet', '.json', '.txt'];
      const ext = path.extname(file.originalname).toLowerCase();
      if (allowed.includes(ext)) cb(null, true);
      else cb(new Error(`File type ${ext} not supported. Allowed: ${allowed.join(', ')}`));
    },
  });

  app.post("/api/upload-data", dataUpload.array("files", 10), async (req: Request, res: Response) => {
    try {
      const files = (req as any).files as Express.Multer.File[];
      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }

      logger.section('DATA UPLOAD');
      const uploadedFiles = files.map(f => {
        const ext = path.extname(f.originalname).toLowerCase();
        logger.kv('File', `${f.originalname} (${(f.size / 1024).toFixed(1)} KB)`);
        return {
          originalName: f.originalname,
          storedName: f.filename,
          filepath: f.path,
          size: f.size,
          ext,
        };
      });
      logger.success(`${files.length} file(s) uploaded`);

      return res.json({ success: true, files: uploadedFiles });
    } catch (error: any) {
      logger.error(`Upload failed: ${error.message}`);
      return res.status(500).json({ error: error.message || "Upload failed" });
    }
  });

  // Chat endpoint - AI chat with streaming using Claude Opus 4.6 via HTTP
  app.post("/api/chat", async (req: Request, res: Response) => {
    let sseStarted = false;

    // Track sessionId for broadcaster cleanup on error
    let broadcastSessionId: string | null = null;

    // Declare accumulation variables outside try so the catch handler can save progress
    let fullAnswer = '';
    let sources: SearchResult[] = [];
    let allToolResults: Array<{ tool: string; result: any }> = [];
    let allSearchQueries: Array<{ query: string; results?: SearchResult[] }> = [];
    let pythonCodeUsed: string = '';
    let monteCarloData: any = null;
    let customPythonFiguresData: Array<{ id: string; scriptId?: string; figures: string[]; figureUrls?: string[]; output?: string; description?: string }> = [];
    let pythonCodeEntries: Array<{ id: string; code: string; description: string; agent?: string; timestamp: number; status: string; error?: string; duration?: number }> = [];
    let paperSectionsStore: Array<{ type: string; latex_content: string; bibtex_keys?: string[]; figure_ids?: string[] }> = [];
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalCost = 0;

    // Safe write helper: skip writes to dead/finished connections
    // Also broadcasts to all reconnected subscribers via sessionBroadcaster
    const safeWrite = (data: string) => {
      // Always broadcast to subscribers (even if original connection died)
      if (broadcastSessionId) {
        try {
          const jsonStr = data.replace(/^data: /, "").replace(/\n+$/, "");
          sessionBroadcaster.broadcast(broadcastSessionId, jsonStr);
        } catch (err) {
          logger.warn(`Broadcast failed: ${(err as Error).message}`);
        }
      }

      if (res.writableEnded || res.destroyed) return;
      try {
        res.write(data);
        // @ts-ignore - flush may not be in types but exists at runtime
        if (res.flush) res.flush();
      } catch (err) {
        logger.warn(`Write failed (client likely disconnected): ${(err as Error).message}`);
      }
    };

    try {
      // ── Authentication (bypass for auto-paper scheduler sessions) ──
      // Check cookie auth first, then fall back to internal pipeline headers
      const currentUserId = getUserId(req) || (req.headers['x-internal-user-id'] as string) || null;

      const parsed = chatBodySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.issues[0].message });
      }
      let { query } = parsed.data;
      const { history, sessionId: reqSessionId, imageData, imageMimeType, authorProfile, uploadedFiles, restoreFromSessionId } = parsed.data;
      const sessionId = reqSessionId || randomUUID();

      // Resolve user's Anthropic API key and display name
      let userApiKey: string | undefined;
      let currentUserDisplayName: string | null = (req.headers['x-internal-author-name'] as string) || null;
      if (currentUserId) {
        try {
          const currentUser = await storage.getUser(currentUserId);
          if (currentUser?.displayName) {
            currentUserDisplayName = currentUser.displayName;
          }
          if (currentUser?.anthropicApiKey) {
            const { deobfuscateKey } = await import("./auth");
            const decoded = deobfuscateKey(currentUser.anthropicApiKey);
            // Only use the key if it looks like a valid Anthropic API key
            if (decoded && decoded.startsWith('sk-ant-')) {
              userApiKey = decoded;
            } else {
              logger.warn(`User ${currentUserId} has invalid API key (doesn't start with sk-ant-), using env key`);
            }
          }
        } catch { /* fallback to env key */ }
      }

      // ── Implicit Prompt Upgrading ──
      // When the user asks to generate a research paper (especially "surprise"),
      // upgrade the prompt with Opus to produce a richer research specification.
      let promptWasUpgraded = false;
      if (isResearchPaperRequest(query)) {
        try {
          const upgradeResult = await upgradeResearchPrompt(query, userApiKey);
          if (upgradeResult.wasUpgraded) {
            query = upgradeResult.upgraded;
            promptWasUpgraded = true;
          }
        } catch (err) {
          // Non-fatal — proceed with original query
          console.warn(`⚠️ Prompt upgrade failed: ${(err as Error).message}`);
        }
      }

      logger.section('CHAT REQUEST');
      logger.request('POST', '/api/chat');
      logger.kv('Session ID', sessionId);
      if (userApiKey) logger.kv('API Key', 'User-provided');
      if (promptWasUpgraded) logger.kv('Prompt Upgraded', '✅ by Opus');
      logger.kv('Query', query.substring(0, 100) + (query.length > 100 ? '...' : ''));
      logger.kv('History length', history.length);

      // Set up SSE (Server-Sent Events) for streaming
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
      res.setHeader('Content-Encoding', 'none'); // Disable compression
      res.flushHeaders(); // Send headers immediately
      sseStarted = true;
      logger.success('SSE streaming initialized');

      // These variables are declared in the outer scope so the catch handler can save progress
      // Reset them here (they are shared with the error handler)
      fullAnswer = '';
      sources = [];
      let messages: any[] = [];
      allToolResults = [];
      allSearchQueries = [];
      pythonCodeUsed = '';
      monteCarloData = null;
      customPythonFiguresData = [];
      paperSectionsStore = [];
      pythonCodeEntries = [];
      let sessionDataFiles: Array<{ filename: string; filepath: string; data_type?: string }> = []; // Track CSV/Parquet/Excel files from Python for ZIP inclusion
      let sessionMetadata: Array<{ filename: string; metadata: any }> = []; // Track provenance metadata for reproducibility

      // ── Restore full state from prior session (checkpoint resume) ──
      // When the scheduler resumes a failed run, it passes restoreFromSessionId
      // so we can reload figures, tool results, sections, and data from the
      // original run. Without this, compile_research_paper would have empty
      // figures/sections and all {{FIG:N}} placeholders would be lost.
      const restoreSourceId = restoreFromSessionId || (sessionId.startsWith('auto-paper-') || sessionId.startsWith('admin-paper-') ? sessionId : null);
      if (restoreSourceId) {
        try {
          const priorSession = await storage.getConversationSession(restoreSourceId);
          if (priorSession) {
            const savedMessages = JSON.parse(priorSession.messages || '[]');
            for (const msg of savedMessages) {
              // Restore figures
              if (msg.customPythonFigures && Array.isArray(msg.customPythonFigures)) {
                for (const fig of msg.customPythonFigures) {
                  if (!customPythonFiguresData.some((f: any) => f.id === fig.id)) {
                    customPythonFiguresData.push(fig);
                  }
                }
              }
              // Restore tool results (so compile_research_paper sees prior work)
              if (msg.toolResults && Array.isArray(msg.toolResults)) {
                for (const tr of msg.toolResults) {
                  if (!allToolResults.some((r: any) => r.tool === tr.tool && JSON.stringify(r.result) === JSON.stringify(tr.result))) {
                    allToolResults.push(tr);
                  }
                }
              }
              // Restore python code entries
              if (msg.pythonCodeEntries && Array.isArray(msg.pythonCodeEntries)) {
                for (const entry of msg.pythonCodeEntries) {
                  if (!pythonCodeEntries.some((e: any) => e.id === entry.id)) {
                    pythonCodeEntries.push(entry);
                  }
                }
              }
              // Restore search queries
              if (msg.searchQueries && Array.isArray(msg.searchQueries)) {
                for (const sq of msg.searchQueries) {
                  allSearchQueries.push(sq);
                }
              }
              // Restore paper sections (critical for compile_research_paper)
              if (msg.paperSections && Array.isArray(msg.paperSections)) {
                for (const sec of msg.paperSections) {
                  if (sec.type && sec.latex_content) {
                    const existingIdx = paperSectionsStore.findIndex((s: any) => s.type === sec.type);
                    if (existingIdx >= 0) {
                      paperSectionsStore[existingIdx] = sec;
                    } else {
                      paperSectionsStore.push(sec);
                    }
                  }
                }
              }
            }
            const restored = [];
            if (customPythonFiguresData.length > 0) restored.push(`${customPythonFiguresData.length} figure(s)`);
            if (allToolResults.length > 0) restored.push(`${allToolResults.length} tool result(s)`);
            if (pythonCodeEntries.length > 0) restored.push(`${pythonCodeEntries.length} code entry(ies)`);
            if (paperSectionsStore.length > 0) restored.push(`${paperSectionsStore.length} section(s)`);
            if (restored.length > 0) {
              logger.info(`📊 Restored from session ${restoreSourceId.slice(0, 8)}: ${restored.join(', ')}`);
            }
          }
        } catch {
          // Best effort — don't block the pipeline if parsing fails
        }
      }

      // ── Handle user-uploaded data files ──────────────────────
      if (uploadedFiles && uploadedFiles.length > 0) {
        const fileDescriptions: string[] = [];
        for (const uf of uploadedFiles) {
          sessionDataFiles.push({ filename: uf.originalName, filepath: uf.filepath, data_type: 'raw/user' });
          sessionMetadata.push({
            filename: uf.originalName,
            metadata: { source: 'user_upload', method: 'upload', timestamp: new Date().toISOString(), filename: uf.originalName, size: uf.size },
          });
          fileDescriptions.push(`- "${uf.originalName}" (${uf.ext}, ${(uf.size / 1024).toFixed(0)} KB) → absolute path: "${uf.filepath}"`);
          logger.kv('User file', `${uf.originalName} → ${uf.filepath}`);
        }
        // Prepend file context to the query so Claude knows about them
        const fileContext = `\n\n[USER-UPLOADED DATA FILES — available for analysis]\nThe user has uploaded ${uploadedFiles.length} data file(s):\n${fileDescriptions.join('\n')}\n\nTo load these files in Python, use pd.read_csv(filepath) or pd.read_excel(filepath) with the absolute paths above. These files are ALREADY saved on disk — do NOT ask the user to upload again. Treat them as raw data from the user and proceed with analysis.\n\n`;
        query = query + fileContext;
      }
      let lastCompilationId: string | null = null; // Track last failed LaTeX compilation for repair loop
      totalInputTokens = 0;
      totalOutputTokens = 0;
      totalCost = 0;

      // Build the shared context for tool execution
      const toolCtx: ToolExecutorContext = {
        safeWrite,
        sessionId,
        userId: currentUserId,
        authorName: currentUserDisplayName,
        customPythonFiguresData,
        paperSectionsStore,
        pythonCodeEntries,
        sessionDataFiles,
        sessionMetadata,
        refs: {
          get lastCompilationId() { return lastCompilationId; },
          set lastCompilationId(v) { lastCompilationId = v; },
          get pythonCodeUsed() { return pythonCodeUsed; },
          set pythonCodeUsed(v) { pythonCodeUsed = v; },
          get monteCarloData() { return monteCarloData; },
          set monteCarloData(v) { monteCarloData = v; },
        },
      };

      // Save user message
      logger.database('Saving user message to database...');
      await storage.createMessage({
        sessionId,
        role: 'user',
        content: query,
        sources: null,
      });
      logger.success('User message saved');

      // Create session in DB immediately so the dashboard can list it
      const userId = getUserId(req);
      try {
        const existingSession = await storage.getConversationSession(sessionId);
        if (!existingSession) {
          logger.database('Creating initial conversation session (in-progress)...');
          await storage.createConversationSession({
            sessionId,
            userId: userId || null,
            title: query.length > 60 ? query.substring(0, 60) + '...' : query,
            messages: JSON.stringify([]),
            inputTokens: 0,
            outputTokens: 0,
            totalCost: 0,
          });
          logger.success('Initial session created — visible in dashboard');
        }
      } catch (sessionErr) {
        logger.warn(`Could not create initial session: ${(sessionErr as Error).message}`);
      }

      // Register session in broadcaster so other clients can reconnect
      broadcastSessionId = sessionId;
      sessionBroadcaster.startSession(sessionId);

      // Send session ID to client immediately so dashboard can track it
      safeWrite(`data: ${JSON.stringify({ type: 'session_start', sessionId })}\n\n`);

      // Send status message
      logger.info('Sending status update to client');
      if (promptWasUpgraded) {
        safeWrite(`data: ${JSON.stringify({ type: 'status', message: '🔬 Research prompt enhanced by Opus — starting pipeline...' })}\n\n`);
      } else {
        safeWrite(`data: ${JSON.stringify({ type: 'status', message: '📊 Financial analysis in progress...' })}\n\n`);
      }

      // Build messages array with conversation history
      // Add previous conversation messages (only question and answer text)
      for (const msg of history) {
        messages.push({
          role: 'user',
          content: msg.question,
        });
        messages.push({
          role: 'assistant',
          content: msg.answer,
        });
      }

      // Add current user message (multimodal if image attached)
      if (imageData && imageMimeType) {
        logger.kv('Image attached', imageMimeType);
        messages.push({
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: imageMimeType,
                data: imageData,
              },
            },
            {
              type: 'text',
              text: query,
            },
          ],
        });
      } else {
        messages.push({
          role: 'user',
          content: query,
        });
      }

      // Function to handle Claude streaming and tool execution
      let isFirstChunkAfterTools = false;
      let recursionDepth = 0;
      // Auto-paper pipeline sessions need much higher limits (full pipeline: gap → data → analysis → write → compile)
      const isAutoPaperSession = sessionId.startsWith('auto-paper-') || sessionId.startsWith('admin-paper-') || sessionId.startsWith('user-paper-');
      const MAX_RECURSION_DEPTH = isAutoPaperSession ? 180 : 45; // Safety guard against infinite recursion
      const MAX_EMPTY_RETRIES = 4;    // Retry empty responses up to 4 times
      let consecutiveToolErrors = 0;  // Track consecutive tool failures
      const MAX_CONSECUTIVE_ERRORS = isAutoPaperSession ? 10 : 6; // Force finalization after this many consecutive errors
      const MAX_ELAPSED_MS = isAutoPaperSession ? 60 * 60 * 1000 : 10 * 60 * 1000; // 60 min for auto-paper, 10 min otherwise
      const requestStartTime = Date.now();


      // ─── Periodic intermediate save (so dashboard Data tab works during generation) ───
      let lastIntermediateSave = Date.now();
      const INTERMEDIATE_SAVE_INTERVAL = 8000; // Save every 8 seconds
      const saveIntermediateProgress = async () => {
        const now = Date.now();
        if (now - lastIntermediateSave < INTERMEDIATE_SAVE_INTERVAL) return;
        lastIntermediateSave = now;
        try {
          const existing = await storage.getConversationSession(sessionId);
          if (!existing) return;
          const intermediateMessages = [{
            question: query,
            answer: fullAnswer,
            toolResults: allToolResults,
            sources: sources,
            searchQueries: allSearchQueries,
            pythonCode: pythonCodeUsed || null,
            monteCarloResults: monteCarloData || null,
            customPythonFigures: customPythonFiguresData.length > 0 ? customPythonFiguresData : null,
            pythonCodeEntries: pythonCodeEntries.length > 0 ? pythonCodeEntries : null,
            paperSections: paperSectionsStore.length > 0 ? paperSectionsStore : null,
          }];
          await storage.updateConversationSession(sessionId, {
            messages: JSON.stringify(intermediateMessages),
            inputTokens: totalInputTokens,
            outputTokens: totalOutputTokens,
            totalCost: totalCost,
          });
        } catch (err) {
          logger.warn(`Intermediate save failed: ${(err as Error).message}`);
        }
      };

      // Helper: finalize the response (save to DB, send done to client)
      const finalizeResponse = async (reason?: string) => {
        logger.section('Finalizing Response');
        if (reason) logger.warn(`Finalization reason: ${reason}`);
        logger.kv('Answer length', `${fullAnswer.length} characters`);
        logger.kv('Tools used', allToolResults.length);

        // If we have no answer at all, provide a fallback message
        if (fullAnswer.trim().length === 0) {
          const fallbackMsg = '\n\n⚠️ The analysis could not be completed within the allowed processing depth. Please try a simpler or more focused query.';
          fullAnswer += fallbackMsg;
          safeWrite(`data: ${JSON.stringify({ type: 'text', content: fallbackMsg })}\n\n`);
        }

        // Save assistant message
        logger.database('Saving assistant message to database...');
        await storage.createMessage({
          sessionId,
          role: 'assistant',
          content: fullAnswer,
          sources: JSON.stringify(sources.map(s => s.url)),
        });
        logger.success('Assistant message saved');

        // Save complete conversation session
        try {
          logger.database('Saving conversation session...');
          logger.kv('FINAL totalInputTokens', totalInputTokens);
          logger.kv('FINAL totalOutputTokens', totalOutputTokens);
          logger.kv('FINAL totalCost', `$${totalCost.toFixed(6)}`);
          const existingSession = await storage.getConversationSession(sessionId);
          const sessionMessages = existingSession ? JSON.parse(existingSession.messages) : [];

          sessionMessages.push({
            question: query,
            answer: fullAnswer,
            toolResults: allToolResults,
            sources: sources,
            searchQueries: allSearchQueries,
            pythonCode: pythonCodeUsed || null,
            monteCarloResults: monteCarloData || null,
            customPythonFigures: customPythonFiguresData.length > 0 ? customPythonFiguresData : null,
            pythonCodeEntries: pythonCodeEntries.length > 0 ? pythonCodeEntries : null,
            paperSections: paperSectionsStore.length > 0 ? paperSectionsStore : null,
          });

          if (existingSession) {
            logger.info('Updating existing session');
            await storage.updateConversationSession(sessionId, {
              messages: JSON.stringify(sessionMessages),
              inputTokens: (existingSession.inputTokens || 0) + totalInputTokens,
              outputTokens: (existingSession.outputTokens || 0) + totalOutputTokens,
              totalCost: (existingSession.totalCost || 0) + totalCost,
            });
          } else {
            const userId = getUserId(req);
            logger.info(`Creating new session for user: ${userId || 'anonymous'}`);
            await storage.createConversationSession({
              sessionId,
              userId: userId || null,
              title: query.length > 60 ? query.substring(0, 60) + '...' : query,
              messages: JSON.stringify(sessionMessages),
              inputTokens: totalInputTokens,
              outputTokens: totalOutputTokens,
              totalCost: totalCost,
            });
          }
          logger.success('Conversation session saved');
          logger.kv('Total tokens (session)', `${totalInputTokens + totalOutputTokens}`);
          logger.kv('Total cost (this request)', `$${totalCost.toFixed(6)}`);
        } catch (sessionError) {
          logger.error(`Error saving conversation session: ${(sessionError as Error).message}`);
        }

        // Automatically create a shared report ONLY for anonymous users
        const currentUserId = getUserId(req);
        if (!currentUserId) {
          try {
            logger.database('Creating shared report (anonymous user)...');
            const shareId = randomUUID().replace(/-/g, '').substring(0, 8);
            await storage.createSharedReport({
              shareId,
              question: query,
              answer: fullAnswer,
              toolResults: allToolResults.length > 0 ? JSON.stringify(allToolResults) : null,
              sources: sources.length > 0 ? JSON.stringify(sources) : null,
              customPythonFigures: customPythonFiguresData.length > 0 ? JSON.stringify(customPythonFiguresData) : null,
            });
            logger.success(`Shared report created with ID: ${shareId}`);
            safeWrite(`data: ${JSON.stringify({ type: 'share', shareId })}\n\n`);
          } catch (shareError) {
            logger.error(`Error creating shared report: ${(shareError as Error).message}`);
          }
        } else {
          logger.info('Skipping shared report creation (logged-in user - private history)');
        }

        // Send sources and completion
        logger.info('Sending final response to client');
        safeWrite(`data: ${JSON.stringify({ type: 'sources', sources })}\n\n`);
        safeWrite(`data: ${JSON.stringify({ type: 'done', sessionId })}\n\n`);

        // End the broadcast session — notifies all reconnected subscribers
        sessionBroadcaster.endSession(sessionId);

        if (!res.writableEnded && !res.destroyed) try { res.end(); } catch { /* noop */ }
        logger.success('CHAT REQUEST COMPLETED');
      };

      const processClaudeResponse = async (): Promise<boolean> => {
        recursionDepth++;

        // Hard time limit — force finalize so requests don't run forever
        const elapsedMs = Date.now() - requestStartTime;
        if (elapsedMs > MAX_ELAPSED_MS) {
          logger.warn(`Time limit (${MAX_ELAPSED_MS / 1000}s) exceeded after ${Math.round(elapsedMs / 1000)}s. Forcing finalization.`);
          safeWrite(`data: ${JSON.stringify({
            type: 'status',
            message: '⚠️ Maximum processing time reached. Finalizing with available results.'
          })}\n\n`);
          await finalizeResponse('Time limit exceeded');
          return true;
        }

        // Hard limit reached — force finalize with whatever we have
        if (recursionDepth > MAX_RECURSION_DEPTH) {
          logger.warn(`Max recursion depth (${MAX_RECURSION_DEPTH}) reached. Forcing finalization.`);
          safeWrite(`data: ${JSON.stringify({
            type: 'status',
            message: '⚠️ Maximum analysis depth reached. Finalizing with available results.'
          })}\n\n`);
          await finalizeResponse('Max recursion depth reached');
          return true; // signals that finalization already happened
        }

        // Too many consecutive tool errors — force finalize
        if (consecutiveToolErrors >= MAX_CONSECUTIVE_ERRORS) {
          logger.warn(`${consecutiveToolErrors} consecutive tool errors. Forcing finalization.`);
          safeWrite(`data: ${JSON.stringify({
            type: 'status',
            message: '⚠️ Multiple tool errors encountered. Finalizing with available results.'
          })}\n\n`);
          await finalizeResponse('Too many consecutive tool errors');
          return true;
        }

        // When approaching the limit (depth or time), instruct Claude to wrap up (no more tools)
        const isApproachingTimeLimit = (Date.now() - requestStartTime) > (MAX_ELAPSED_MS * 0.85);
        const isApproachingLimit = recursionDepth >= MAX_RECURSION_DEPTH - 2 || isApproachingTimeLimit;
        if (isApproachingLimit) {
          logger.warn(`Approaching recursion limit (${recursionDepth}/${MAX_RECURSION_DEPTH}). Instructing Claude to finalize.`);
          const lastMsg = messages[messages.length - 1];
          const wrapUpInstruction = isAutoPaperSession
            ? '⚠️ CRITICAL SYSTEM INSTRUCTION: You are approaching the maximum analysis depth. If you have NOT yet called compile_research_paper, you MUST call it NOW with whatever sections have been written so far. This is your LAST chance to produce the paper. Call compile_research_paper immediately.'
            : '⚠️ CRITICAL SYSTEM INSTRUCTION: You are at the maximum analysis depth. You MUST now provide your FINAL comprehensive text response synthesizing ALL results gathered so far. Do NOT call any more tools — write your complete answer NOW with all figures, tables, and analysis included.';
          if (lastMsg && lastMsg.role === 'user' && Array.isArray(lastMsg.content)) {
            lastMsg.content.push({ type: 'text', text: wrapUpInstruction });
          } else {
            // Add as a separate user message if needed
            messages.push({ role: 'user', content: wrapUpInstruction });
          }
        }
        logger.section('Claude API Call');
        logger.kv('Messages in context', messages.length);
        logger.kv('Recursion depth', `${recursionDepth}/${MAX_RECURSION_DEPTH}`);
        // Track text length before this call to allow rollback on retry
        const answerLengthBeforeCall = fullAnswer.length;

        let result: { answer: string; toolCalls: any[]; usage: { inputTokens: number; outputTokens: number; cost: number } };
        let emptyRetries = 0;

        // Retry loop for empty/zero-token responses (API returned nothing useful)
        while (true) {
          result = await callClaudeStreamingWithRetry(
            query,
            (chunk) => {
              // Filter out leaked XML function call blocks from text output
              // (Claude sometimes emits tool calls as raw text instead of structured tool_use)
              if (/<\/?function_calls>|<\/?function_invoke|<\/?parameter\s/.test(chunk)) {
                fullAnswer += chunk;
                return;
              }

              // Strip raw HTML that Claude sometimes outputs instead of markdown
              const cleanChunk = chunk
                .replace(/<\/?(div|details|summary|table|thead|tbody|tr|td|th|center|span)(\s[^>]*)?\s*\/?>/gi, '')
                .replace(/(<br\s*\/?\s*>[\s]*){2,}/gi, '\n');

              // Skip chunks that are ONLY whitespace or <br> (nothing useful to display)
              if (!cleanChunk.trim() || /^(<br\s*\/?\s*>\s*)+$/i.test(cleanChunk.trim())) {
                fullAnswer += chunk; // keep in full answer for context
                return;
              }

              // Add line break before first chunk if coming after tool execution
              if (isFirstChunkAfterTools) {
                const lineBreak = '\n\n';
                fullAnswer += lineBreak + chunk;
                safeWrite(`data: ${JSON.stringify({ type: 'text', content: lineBreak + cleanChunk })}\n\n`);
                isFirstChunkAfterTools = false;
              } else {
                fullAnswer += chunk;
                safeWrite(`data: ${JSON.stringify({ type: 'text', content: cleanChunk })}\n\n`);
              }
            },
            messages,
            () => {
              // onRetry: discard partial text from the failed attempt
              const partialText = fullAnswer.substring(answerLengthBeforeCall);
              if (partialText.length > 0) {
                fullAnswer = fullAnswer.substring(0, answerLengthBeforeCall);
                // Tell client to replace the partial text
                safeWrite(`data: ${JSON.stringify({ type: 'retry', discardLength: partialText.length })}\n\n`);
                logger.warn(`Discarded ${partialText.length} chars of partial text from failed attempt`);
              }
            },
            authorProfile,
            userApiKey,
          );

          // Detect empty response (0 output tokens, no text, no tools)
          const newText = fullAnswer.substring(answerLengthBeforeCall).trim();
          const hasTools = result.toolCalls && result.toolCalls.length > 0;
          const hasContent = newText.length > 0 || hasTools;

          if (!hasContent && emptyRetries < MAX_EMPTY_RETRIES) {
            emptyRetries++;
            logger.warn(`⚠ Empty response detected (0 output tokens, no tools). Retry ${emptyRetries}/${MAX_EMPTY_RETRIES}...`);
            // Reset any partial content
            fullAnswer = fullAnswer.substring(0, answerLengthBeforeCall);
            // Small delay before retry
            await new Promise(r => setTimeout(r, 2000 * emptyRetries));
            continue;
          }

          if (!hasContent && emptyRetries >= MAX_EMPTY_RETRIES) {
            logger.warn(`Empty response after ${MAX_EMPTY_RETRIES} retries. Sending error to client.`);
            safeWrite(`data: ${JSON.stringify({
              type: 'status',
              message: '⚠️ The AI response was interrupted. The analysis may be incomplete.'
            })}\n\n`);
          }

          break;
        }

        const { answer, toolCalls, usage } = result;
        logger.success('Claude API response received');

        // Accumulate token usage
        totalInputTokens += usage.inputTokens;
        totalOutputTokens += usage.outputTokens;
        totalCost += usage.cost;
        logger.kv('Tokens (input/output)', `${usage.inputTokens}/${usage.outputTokens}`);
        logger.kv('Total accumulated (in/out)', `${totalInputTokens}/${totalOutputTokens}`);
        logger.kv('Cost for this call', `$${usage.cost.toFixed(6)}`);

        // If Claude wants to use tools
        if (toolCalls && toolCalls.length > 0) {
          logger.section('Tools Requested by Claude');
          logger.kv('Number of tools', toolCalls.length);

          // ==================== PARALLEL EXECUTION ENGINE ====================
          // Classify tools into parallel-safe vs sequential groups, then execute
          const allToolResultsForClaude: any[] = [];

          // Tools that MUST run sequentially (depend on previous results or mutate state)
          const SEQUENTIAL_TOOLS = new Set([
            'compile_research_paper',  // needs all write_paper_section results
            'run_python_script',       // needs script_id from previous execution
            'apply_patch',             // needs script_id from previous execution
            'inspect_python_logs',     // needs script_id
            'read_latex_source',       // needs compilation_id
            'inspect_latex_errors',    // needs compilation_id
            'patch_latex',             // needs compilation_id
            'recompile_latex',         // needs compilation_id
          ]);

          // Classify tool calls into ordered groups: parallel or sequential
          const classifyToolDependencies = (tools: any[]): { tools: any[]; parallel: boolean }[] => {
            const groups: { tools: any[]; parallel: boolean }[] = [];
            let currentParallel: any[] = [];

            for (const tool of tools) {
              if (SEQUENTIAL_TOOLS.has(tool.name)) {
                // Flush any accumulated parallel tools first
                if (currentParallel.length > 0) {
                  groups.push({ tools: currentParallel, parallel: true });
                  currentParallel = [];
                }
                groups.push({ tools: [tool], parallel: false });
              } else {
                currentParallel.push(tool);
              }
            }
            // Flush remaining parallel tools
            if (currentParallel.length > 0) {
              groups.push({ tools: currentParallel, parallel: currentParallel.length > 1 });
            }
            return groups;
          };

          // Concurrency-limited executor (semaphore pattern, max 5 concurrent)
          const MAX_CONCURRENT = 8;
          const executeWithConcurrencyLimit = async (
            tasks: (() => Promise<void>)[],
          ): Promise<void> => {
            let nextIndex = 0;
            const worker = async () => {
              while (nextIndex < tasks.length) {
                const idx = nextIndex++;
                await tasks[idx]();
              }
            };
            const workers = Array.from(
              { length: Math.min(MAX_CONCURRENT, tasks.length) },
              () => worker(),
            );
            await Promise.all(workers);
          };

          const toolGroups = classifyToolDependencies(toolCalls);
          const totalGroups = toolGroups.length;
          const parallelCount = toolGroups.filter(g => g.parallel).reduce((sum, g) => sum + g.tools.length, 0);

          if (parallelCount > 1) {
            logger.info(`Parallel execution: ${parallelCount} tools in parallel groups, ${totalGroups} total groups`);
          }

          safeWrite(`data: ${JSON.stringify({ type: 'tools', tools: toolCalls })}\n\n`);

          // Add ALL assistant's tool use to messages at once
          messages.push({
            role: 'assistant',
            content: toolCalls.map((tc: any) => ({
              type: 'tool_use',
              id: tc.id,
              name: tc.name,
              input: tc.input,
            })),
          });

          // Execute each group
          for (let groupIdx = 0; groupIdx < toolGroups.length; groupIdx++) {
            const group = toolGroups[groupIdx];

            if (group.parallel && group.tools.length > 1) {
              logger.info(`Executing ${group.tools.length} tools in parallel (group ${groupIdx + 1}/${totalGroups})`);
              safeWrite(`data: ${JSON.stringify({
                type: 'status',
                message: `⚡ Running ${group.tools.length} tools in parallel: ${group.tools.map((t: any) => t.name).join(', ')}...`
              })}\n\n`);
            }

            // executeSingleTool: wraps the tool executor for one tool call
            const executeSingleTool = async (toolCall: any) => {
              logger.startTimer(toolCall.id);
              logger.tool(toolCall.name, `Executing... (ID: ${toolCall.id})`);
              const toolStartTime = Date.now();

              // Detect which agent is responsible for this tool
              const agentName = (() => {
                const desc = (toolCall.input?.description || '').toUpperCase();
                if (toolCall.name === 'literature_gap_finder') return 'Gauss';
                if (toolCall.name === 'write_paper_section' || toolCall.name === 'compile_research_paper' || toolCall.name === 'generate_research_paper' || toolCall.name === 'read_latex_source' || toolCall.name === 'inspect_latex_errors' || toolCall.name === 'patch_latex' || toolCall.name === 'recompile_latex') return 'Euler';
                // Match both formats: "NEWTON:" prefix or "[Newton]" bracket prefix
                if (/^NEWTON\s*:/i.test(desc) || desc.startsWith('[NEWTON]')) return 'Newton';
                if (/^FISHER\s*:/i.test(desc) || desc.startsWith('[FISHER]')) return 'Fisher';
                if (/^TURING\s*:/i.test(desc) || desc.startsWith('[TURING]')) return 'Turing';
                if (toolCall.name === 'execute_custom_python_analysis' || toolCall.name === 'run_python_script') return 'Turing';
                if (toolCall.name.startsWith('get_') || toolCall.name.startsWith('search_') || toolCall.name.includes('firecrawl') || toolCall.name.includes('tavily')) return 'Turing';
                return null; // generic tool
              })();

              // Strip agent prefix from description before sending to client
              // Handles both "NEWTON: ..." and "[Newton] ..." formats
              if (toolCall.input?.description) {
                toolCall.input.description = toolCall.input.description
                  .replace(/^(NEWTON|FISHER|TURING|GAUSS|EULER)\s*:\s*/i, '')
                  .replace(/^\[(Newton|Fisher|Turing|Gauss|Euler)\]\s*/i, '');
              }

              // Notify client that tool execution is starting
              safeWrite(`data: ${JSON.stringify({
                type: 'tool_start',
                tool: toolCall.name,
                toolId: toolCall.id,
                input: toolCall.input,
                parallel: group.parallel && group.tools.length > 1,
                ...(agentName ? { agent: agentName } : {}),
              })}\n\n`);

              try {
                const result = await executeToolCall(toolCall, toolCtx);

                const toolDuration = Date.now() - toolStartTime;
                logger.endTimer(toolCall.id, `Tool ${toolCall.name} completed`);

                // Stringify and truncate result to prevent context overflow
                const resultString = safeJsonStringify(result);

                // Higher limit for content extraction tools (Firecrawl, Exa) since they're meant to extract full content
                // ALSO higher limit for custom Python analysis which includes figure references in output
                const isContentExtractionTool = [
                  'firecrawl_search',
                  'firecrawl_scrape',
                  'firecrawl_crawl',
                  'firecrawl_extract',
                  'firecrawl_map',
                  'firecrawl_agent',
                  'firecrawl_batch_scrape',
                  'web_dataset_collector',
                  'tavily_search',
                  'tavily_extract',
                  'tavily_crawl',
                  'tavily_map',
                  'tavily_research',
                  'get_contents_exa',
                  'execute_custom_python_analysis',  // CRITICAL: Must not truncate figure references!
                  'read_python_script',
                  'run_python_script',
                  'inspect_python_logs',
                  'academic_search',
                  'academic_literature_review',
                  'literature_gap_finder',
                  'openalex_search',
                  'arxiv_search',
                  'crossref_lookup',
                  'academic_search_multi',
                  'generate_research_paper',
                  'write_paper_section',
                  'compile_research_paper',
                  'read_latex_source',
                  'inspect_latex_errors',
                  'patch_latex',
                  'recompile_latex',
                ].includes(toolCall.name);
                const isPythonAnalysis = ['execute_custom_python_analysis', 'run_python_script'].includes(toolCall.name);
                const isLiteratureReview = toolCall.name === 'academic_literature_review';
                const isLatexRead = toolCall.name === 'read_latex_source';
                const MAX_TOOL_RESULT_LENGTH = isPythonAnalysis ? 50000 : isLatexRead ? 60000 : isLiteratureReview ? 25000 : isContentExtractionTool ? 15000 : 3000;

                const truncatedResult = resultString.length > MAX_TOOL_RESULT_LENGTH
                  ? resultString.substring(0, MAX_TOOL_RESULT_LENGTH) + `\n\n[... truncated, original length: ${resultString.length} chars]`
                  : resultString;

                // Add to results for Claude
                allToolResultsForClaude.push({
                  type: 'tool_result',
                  tool_use_id: toolCall.id,
                  content: truncatedResult,
                });

                // Also store for session saving
                allToolResults.push({ tool: toolCall.name, result });

                const resultPreview = safeJsonStringify(result, 100);
                logger.debug(`Result preview: ${resultPreview}...`);

                // Notify client that tool completed
                safeWrite(`data: ${safeJsonStringify({
                  type: 'tool_complete',
                  tool: toolCall.name,
                  toolId: toolCall.id,
                  duration: toolDuration
                })}\n\n`);

                safeWrite(`data: ${safeJsonStringify({
                  type: 'tool_result',
                  tool: toolCall.name,
                  result: result
                })}\n\n`);

                // Save intermediate progress periodically so Data tab works during generation
                await saveIntermediateProgress();
              } catch (toolError) {
              logger.error(`Error executing tool ${toolCall.name}: ${(toolError as Error).message}`);

              // Notify client of tool error
              safeWrite(`data: ${JSON.stringify({
                type: 'tool_error',
                tool: toolCall.name,
                toolId: toolCall.id,
                error: (toolError as Error).message
              })}\n\n`);

              allToolResultsForClaude.push({
                type: 'tool_result',
                tool_use_id: toolCall.id,
                content: `Error: ${(toolError as Error).message}`,
                is_error: true,
              });
            }
            }; // end executeSingleTool

            // Execute this group either in parallel or sequentially
            if (group.parallel && group.tools.length > 1) {
              // Parallel execution with concurrency limit
              await executeWithConcurrencyLimit(
                group.tools.map((tc: any) => () => executeSingleTool(tc)),
              );
            } else {
              // Sequential execution (single tool or sequential dependency)
              for (const tc of group.tools) {
                await executeSingleTool(tc);
              }
            }

          // Small delay between groups to avoid API rate limits
          if (groupIdx < toolGroups.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }

        logger.success(`All ${toolCalls.length} tools executed across ${totalGroups} group(s)`);

        // Track consecutive errors for early termination
        const errorCount = allToolResultsForClaude.filter((r: any) => r.is_error).length;
        if (errorCount === allToolResultsForClaude.length && allToolResultsForClaude.length > 0) {
          consecutiveToolErrors++;
          logger.warn(`All ${errorCount} tool(s) failed. Consecutive error streak: ${consecutiveToolErrors}/${MAX_CONSECUTIVE_ERRORS}`);
        } else {
          consecutiveToolErrors = 0; // Reset on any success
        }

        // Now send ALL tool results to Claude at once
        logger.info(`Sending all ${allToolResultsForClaude.length} tool results to Claude for final analysis`);

        if (totalGroups > 1 || parallelCount > 1) {
          safeWrite(`data: ${JSON.stringify({
            type: 'status',
            message: `🤖 All ${allToolResultsForClaude.length} tools completed. Generating comprehensive analysis...`
          })}\n\n`);
        }

        messages.push({
          role: 'user',
          content: allToolResultsForClaude,
        });

        // Set flag to add line break before next response
        isFirstChunkAfterTools = true;

        // Recursively process Claude's response with ALL tool results
        logger.info('Recursively processing Claude response with all tool results...');
        const alreadyFinalized = await processClaudeResponse();
        if (!alreadyFinalized) {
          // processClaudeResponse returned without finalizing (shouldn't normally happen)
          // but handle gracefully just in case
          await finalizeResponse('Recursive call returned without finalization');
        }
        return true;
        } else {
          // No more tools needed, finalize
          await finalizeResponse();
          return true;
        }
      };

      // Start the process
      logger.server('Starting Claude response processing...');
      await processClaudeResponse();

    } catch (error) {
      const msg = (error as Error).message || '';

      // Save intermediate progress to DB so data is not lost on error
      if (broadcastSessionId) {
        try {
          const existing = await storage.getConversationSession(broadcastSessionId);
          if (existing) {
            await storage.updateConversationSession(broadcastSessionId, {
              messages: JSON.stringify([{
                question: req.body?.query || '',
                answer: fullAnswer || '',
                toolResults: allToolResults,
                sources: sources,
                searchQueries: allSearchQueries,
                pythonCode: pythonCodeUsed || null,
                monteCarloResults: monteCarloData || null,
                customPythonFigures: customPythonFiguresData.length > 0 ? customPythonFiguresData : null,
                pythonCodeEntries: pythonCodeEntries.length > 0 ? pythonCodeEntries : null,
                paperSections: paperSectionsStore.length > 0 ? paperSectionsStore : null,
              }]),
              inputTokens: totalInputTokens,
              outputTokens: totalOutputTokens,
              totalCost: totalCost,
            });
            logger.info('Intermediate progress saved before error cleanup');
          }
        } catch (saveErr) {
          logger.warn(`Failed to save intermediate progress on error: ${(saveErr as Error).message}`);
        }
        sessionBroadcaster.endSession(broadcastSessionId);
      }

      // Connection errors (client disconnected) — just log and clean up
      if (msg.includes('aborted') || msg.includes('ECONNRESET') || res.destroyed) {
        logger.warn(`Chat interrupted (${msg}) — intermediate progress saved to DB`);
        if (!res.writableEnded) try { res.end(); } catch { /* noop */ }
        return;
      }
      logger.error(`CHAT ERROR: ${msg}`);
      logger.debug(`Stack: ${(error as Error).stack}`);
      if (sseStarted && !res.writableEnded && !res.destroyed) {
        safeWrite(`data: ${JSON.stringify({ type: 'error', error: 'Failed to process chat' })}\n\n`);
        safeWrite(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
        try { res.end(); } catch { /* noop */ }
      } else if (!sseStarted && !res.headersSent) {
        res.status(500).json({ error: 'Failed to process chat' });
      }
    }
  });
}
