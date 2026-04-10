import { schema } from "../db";

// Infer types from the active schema
export type User = typeof schema.users.$inferSelect;
export type InsertUser = Omit<User, "id" | "createdAt">;

export type Message = typeof schema.messages.$inferSelect;
export type InsertMessage = Omit<Message, "id" | "createdAt">;

export type SharedReport = typeof schema.sharedReports.$inferSelect;
export type InsertSharedReport = Omit<SharedReport, "id" | "createdAt">;

export type ConversationSession = typeof schema.conversationSessions.$inferSelect;
export type InsertConversationSession = Omit<ConversationSession, "id" | "createdAt" | "updatedAt">;

export type ActiveUser = typeof schema.activeUsers.$inferSelect;
export type InsertActiveUser = Omit<ActiveUser, "id" | "createdAt">;

export type AnalyticsMetric = typeof schema.analyticsMetrics.$inferSelect;
export type InsertAnalyticsMetric = Omit<AnalyticsMetric, "id" | "timestamp">;

export type RequestLog = typeof schema.requestLogs.$inferSelect;
export type InsertRequestLog = Omit<RequestLog, "id" | "timestamp">;

export type PublishedPaper = typeof schema.publishedPapers.$inferSelect;
export type InsertPublishedPaper = Omit<PublishedPaper, "id" | "publishedAt">;

export type SavedPrompt = typeof schema.savedPrompts.$inferSelect;
export type InsertSavedPrompt = Omit<SavedPrompt, "id" | "createdAt" | "updatedAt">;

export type PeerReview = typeof schema.peerReviews.$inferSelect;
export type InsertPeerReview = Omit<PeerReview, "id" | "createdAt">;

export type PaperRun = typeof schema.paperRuns.$inferSelect;
export type InsertPaperRun = Omit<PaperRun, "id" | "createdAt">;

export type GovernorDecisionRow = typeof schema.governorDecisions.$inferSelect;
export type InsertGovernorDecision = Omit<GovernorDecisionRow, "id" | "createdAt">;

export type SiteConfig = typeof schema.siteConfig.$inferSelect;
export type Donation = typeof schema.donations.$inferSelect;
export type InsertDonation = Omit<Donation, "id" | "createdAt">;

export type ApiKey = typeof schema.apiKeys.$inferSelect;
export type InsertApiKey = Omit<ApiKey, "id" | "createdAt">;

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByToken(token: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<{ displayName: string; email: string | null; institution: string | null; department: string | null; orcid: string | null; website: string | null; bio: string | null; title: string | null; profilePhoto: string | null; googleScholar: string | null; researchGate: string | null; linkedin: string | null; anthropicApiKey: string | null; passwordHash: string; location: string | null; longBio: string | null; researchInterests: string | null; bannerImage: string | null }>): Promise<User>;
  getAllUsers(): Promise<User[]>;
  deleteUser(id: string): Promise<void>;

  // Messages
  getMessagesBySession(sessionId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;

  // Shared Reports
  getSharedReportByShareId(shareId: string): Promise<SharedReport | undefined>;
  createSharedReport(report: InsertSharedReport): Promise<SharedReport>;
  getAllSharedReports(): Promise<SharedReport[]>;
  deleteSharedReport(id: string): Promise<void>;

  // Conversation Sessions
  getConversationSessions(userId?: string): Promise<ConversationSession[]>;
  getConversationSession(sessionId: string): Promise<ConversationSession | undefined>;
  getConversationSessionByUserAndSessionId(sessionId: string, userId: string): Promise<ConversationSession | undefined>;
  createConversationSession(session: InsertConversationSession): Promise<ConversationSession>;
  updateConversationSession(sessionId: string, updates: Partial<InsertConversationSession>): Promise<ConversationSession>;
  getAllConversationSessions(): Promise<ConversationSession[]>;
  deleteConversationSessionById(id: string): Promise<void>;

  // Active Users
  getActiveUserBySessionId(sessionId: string): Promise<ActiveUser | undefined>;
  upsertActiveUser(user: InsertActiveUser): Promise<ActiveUser>;
  updateActiveUserHeartbeat(sessionId: string, status: string, currentQuery?: string): Promise<void>;
  getActiveUsers(): Promise<ActiveUser[]>;
  cleanupStaleUsers(timeoutMinutes?: number): Promise<void>;

  // Analytics Metrics
  createAnalyticsMetric(metric: InsertAnalyticsMetric): Promise<AnalyticsMetric>;
  getLatestMetrics(periodType: string, limit?: number): Promise<AnalyticsMetric[]>;
  getMetricsInTimeRange(startTime: Date, endTime: Date): Promise<AnalyticsMetric[]>;

  // Request Logs
  createRequestLog(log: InsertRequestLog): Promise<RequestLog>;
  getRecentRequestLogs(limit?: number): Promise<RequestLog[]>;
  getRequestLogsByStatus(status: string, limit?: number): Promise<RequestLog[]>;

  // Published Papers
  getAllPublishedPapers(): Promise<PublishedPaper[]>;
  getJournalPapers(): Promise<PublishedPaper[]>;
  getJournalPaperCosts(): Promise<Array<{ paperId: string; inputTokens: number; outputTokens: number; totalCost: number }>>;
  getPublishedPaperById(id: string): Promise<PublishedPaper | undefined>;
  getPublishedPaperByAsid(asid: string): Promise<PublishedPaper | undefined>;
  createPublishedPaper(paper: InsertPublishedPaper): Promise<PublishedPaper>;
  deletePublishedPaper(id: string): Promise<boolean>;
  updatePaperVisibility(id: string, showInJournal: number): Promise<void>;
  updatePaperDomain(id: string, domain: string): Promise<void>;
  updatePaperLatexContent(id: string, latexContent: string, bibtexEntries: string | null): Promise<void>;

  // Saved Prompts (public library)
  getAllSavedPrompts(): Promise<SavedPrompt[]>;
  createSavedPrompt(prompt: InsertSavedPrompt): Promise<SavedPrompt>;

  // Peer Reviews
  getPeerReviewByPaperId(paperId: string): Promise<PeerReview | undefined>;
  createPeerReview(review: InsertPeerReview): Promise<PeerReview>;
  getAllPeerReviews(): Promise<PeerReview[]>;

  // Site Config
  getSiteConfig(key: string): Promise<string | undefined>;
  setSiteConfig(key: string, value: string): Promise<void>;

  // Donations
  createDonation(donation: InsertDonation): Promise<Donation>;
  getAllDonations(): Promise<Donation[]>;
  updateDonationStatus(id: string, status: string): Promise<void>;

  // Paper Runs (pipeline lifecycle tracking)
  createPaperRun(run: InsertPaperRun): Promise<PaperRun>;
  getPaperRunById(id: string): Promise<PaperRun | undefined>;
  updatePaperRunStatus(id: string, status: string, extras?: Partial<InsertPaperRun>): Promise<PaperRun>;
  getAllPaperRuns(limit?: number): Promise<PaperRun[]>;
  getActivePaperRun(): Promise<PaperRun | undefined>;
  getPaperRunStats(): Promise<{ total: number; published: number; rejected: number; failed: number; active: PaperRun | null }>;
  deletePaperRun(id: string): Promise<void>;
  cleanupStalePaperRuns(timeoutMinutes?: number): Promise<number>;
  forceFailAllActiveRuns(): Promise<number>;
  getAllActivePaperRuns(): Promise<PaperRun[]>;
  heartbeatPaperRun(id: string): Promise<void>;

  // Governor State & Decisions
  getGovernorState(runId: string): Promise<any | null>;
  saveGovernorState(runId: string, state: any): Promise<void>;
  createGovernorDecision(decision: InsertGovernorDecision): Promise<GovernorDecisionRow>;
  getGovernorDecisions(runId: string): Promise<GovernorDecisionRow[]>;

  // API Keys
  createApiKey(key: InsertApiKey): Promise<ApiKey>;
  getApiKeyByHash(keyHash: string): Promise<ApiKey | undefined>;
  getApiKeysByUserId(userId: string): Promise<ApiKey[]>;
  incrementApiKeyUsage(id: string): Promise<void>;
  revokeApiKey(id: string): Promise<void>;
  deleteApiKey(id: string): Promise<void>;
}
