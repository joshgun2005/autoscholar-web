/**
 * AutoScholar Public Research API — v1
 *
 * Registration hub for all /api/v1/* route modules.
 */

import type { Express } from "express";
import { registerKeyRoutes } from "./v1/keys";
import { registerPaperRoutes } from "./v1/papers";
import { registerReviewRoutes } from "./v1/reviews";
import { registerReportRoutes } from "./v1/reports";
import { registerStatsRoutes } from "./v1/stats";
import { registerPipelineRoutes } from "./v1/pipeline";
import { registerSearchRoutes } from "./v1/search";
import { registerPromptApiRoutes } from "./v1/prompts";
import { registerSessionApiRoutes } from "./v1/sessions";

export function registerPublicApiRoutes(app: Express) {
  // API key management (no auth required to create keys)
  registerKeyRoutes(app);

  // Authenticated endpoints (all require valid API key)
  registerPaperRoutes(app);
  registerReviewRoutes(app);
  registerReportRoutes(app);
  registerStatsRoutes(app);
  registerPipelineRoutes(app);
  registerSearchRoutes(app);
  registerPromptApiRoutes(app);
  registerSessionApiRoutes(app);
}
