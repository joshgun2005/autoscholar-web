import type { Express } from "express";
import { registerPlatformRoutes } from "./platformStats";
import { registerJournalRoutes } from "./journalPapers";
import { registerDoiRoutes } from "./doiRoutes";
import { registerFigureRoutes } from "./figureRoutes";
import { registerPeerReviewRoutes } from "./peerReviewRoutes";
import { registerSharedReportRoutes } from "./sharedReports";
import { registerSessionRoutes } from "./sessionRoutes";
import { registerDocumentGenerationRoutes } from "./documentGeneration";
import { registerRepositoryRoutes } from "./repositoryRoutes";

export function registerReportRoutes(app: Express) {
  registerPlatformRoutes(app);
  registerJournalRoutes(app);
  registerDoiRoutes(app);
  registerFigureRoutes(app);
  registerPeerReviewRoutes(app);
  registerSharedReportRoutes(app);
  registerSessionRoutes(app);
  registerDocumentGenerationRoutes(app);
  registerRepositoryRoutes(app);
}
