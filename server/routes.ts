import type { Express } from "express";
import { createServer, type Server } from "http";
import { cleanupStaleCompilations } from "./services/latex/latexPatchManager";
import { registerChatRoute } from "./routes/chat";
import { registerAdminRoutes } from "./routes/admin";
import { registerAnalyticsRoutes } from "./routes/analytics";
import { registerFmpRoutes } from "./routes/fmp";
import { registerReportRoutes } from "./routes/reports";
import { registerPromptRoutes } from "./routes/prompts";
import { registerPublicApiRoutes } from "./routes/api";
import { registerChatbotRoute } from "./routes/chatbot";

export async function registerRoutes(app: Express): Promise<Server> {

  // Periodic cleanup of stale LaTeX compilations (every 30 minutes, removes workDirs > 1 hour old)
  setInterval(() => {
    const cleaned = cleanupStaleCompilations();
    if (cleaned > 0) console.log(`🧹 Cleaned up ${cleaned} stale LaTeX compilation(s)`);
  }, 30 * 60 * 1000);

  // ─── Register route modules ─────────────────────────
  registerChatRoute(app);       // /api/chat, /api/speech-to-text
  registerAdminRoutes(app);
  registerAnalyticsRoutes(app);
  registerFmpRoutes(app);
  registerReportRoutes(app);
  registerPromptRoutes(app);
  registerPublicApiRoutes(app); // /api/v1/* — public research API
  registerChatbotRoute(app);    // /api/chatbot — AI assistant chatbot

  const httpServer = createServer(app);
  return httpServer;
}
