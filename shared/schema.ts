import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, real, vector, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Re-export shared API types
export type { SearchResult, ClaudeMessage, ClaudeToolCall, ClaudeToolResult, ChatRequest, ChatResponse, ConversationMessage } from "./types";

// Users table with username/password authentication (legacy — kept for migration)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: varchar("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name").notNull(),
  email: text("email"),
  institution: text("institution"),
  department: text("department"),
  orcid: text("orcid"),
  website: text("website"),
  bio: text("bio"),
  title: text("title"), // e.g. "Professor", "PhD Candidate", "Research Scientist"
  profilePhoto: text("profile_photo"), // base64 data URL
  googleScholar: text("google_scholar"), // Google Scholar profile URL
  researchGate: text("research_gate"), // ResearchGate profile URL
  linkedin: text("linkedin"), // LinkedIn profile URL
  anthropicApiKey: text("anthropic_api_key"), // encrypted user API key
  isVerified: boolean("is_verified").notNull().default(false),
  token: text("token").notNull().unique(), // legacy compat — auto-generated
  location: text("location"),
  longBio: text("long_bio"),
  researchInterests: text("research_interests"), // JSON array of interest tags
  bannerImage: text("banner_image"),
  profileTheme: text("profile_theme"), // JSON: accent color, font, layout, card style, hero, bg pattern
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Email verification tokens
export const emailVerificationTokens = pgTable("email_verification_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Password reset tokens
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// User profiles — linked to Supabase auth.users by ID
export const userProfiles = pgTable("user_profiles", {
  id: text("id").primaryKey(), // Supabase auth.users.id (UUID)
  displayName: text("display_name").notNull(),
  email: text("email"),
  institution: text("institution"),
  department: text("department"),
  orcid: text("orcid"),
  website: text("website"),
  bio: text("bio"),
  title: text("title"),
  profilePhoto: text("profile_photo"),
  googleScholar: text("google_scholar"),
  researchGate: text("research_gate"),
  linkedin: text("linkedin"),
  anthropicApiKey: text("anthropic_api_key"), // encrypted user API key
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Crawled pages table - stores web content
export const crawledPages = pgTable("crawled_pages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  url: text("url").notNull().unique(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  snippet: text("snippet"),
  favicon: text("favicon"),
  crawledAt: timestamp("crawled_at").notNull().defaultNow(),
});

// Embeddings table - stores vector embeddings for semantic search
export const embeddings = pgTable("embeddings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pageId: varchar("page_id").notNull().unique().references(() => crawledPages.id, { onDelete: "cascade" }),
  embedding: vector("embedding", { dimensions: 3072 }),
  tokenCount: integer("token_count").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Chat messages table - stores conversation history
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  sources: text("sources").array(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Shared reports table
export const sharedReports = pgTable("shared_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  shareId: varchar("share_id").notNull().unique(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  toolResults: text("tool_results"),
  sources: text("sources"),
  customPythonFigures: text("custom_python_figures"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Published research papers — AutoScholar Journal
export const publishedPapers = pgTable("published_papers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  asid: text("asid").unique(), // AutoScholar ID, e.g. ASID-2026-0001
  title: text("title").notNull(),
  abstract: text("abstract"),
  authors: text("authors"),
  keywords: text("keywords"), // JSON array
  template: text("template"), // article, working_paper, econometrica
  domain: text("domain"), // auto-detected research domain
  filename: text("filename").notNull(), // PDF filename in downloads/
  downloadUrl: text("download_url").notNull(), // /api/download/...
  projectZipUrl: text("project_zip_url"), // /api/download/..._project.zip
  latexContent: text("latex_content"), // JSON array of {type, latex_content} sections
  bibtexEntries: text("bibtex_entries"), // Raw BibTeX string
  wordCount: integer("word_count"),
  sectionCount: integer("section_count"),
  figureCount: integer("figure_count"),
  sessionId: text("session_id"), // conversation session that generated this paper
  userId: text("user_id"), // authenticated user who generated this paper
  authorName: text("author_name"), // display name at time of generation
  showInJournal: integer("show_in_journal").notNull().default(1), // 1 = visible in public journal, 0 = hidden
  runId: text("run_id"), // links back to paperRuns.id
  publishedAt: timestamp("published_at").notNull().defaultNow(),
});

// Saved prompts — public prompt library (persistent, server-side)
export const savedPrompts = pgTable("saved_prompts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  authorName: text("author_name"), // display name at time of creation (or "Anonymous")
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Peer reviews — AI-generated academic peer review reports
export const peerReviews = pgTable("peer_reviews", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  paperId: varchar("paper_id").notNull().references(() => publishedPapers.id, { onDelete: "cascade" }),
  overallScore: integer("overall_score").notNull(), // 0-100
  summary: text("summary").notNull(),
  strengths: text("strengths").notNull(), // JSON array
  weaknesses: text("weaknesses").notNull(), // JSON array
  detailedScores: text("detailed_scores").notNull(), // JSON
  sectionReviews: text("section_reviews").notNull(), // JSON array
  recommendation: text("recommendation").notNull(),
  fullReport: text("full_report").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ASID sequence counters — one row per year for atomic increment
export const asidCounters = pgTable("asid_counters", {
  year: integer("year").primaryKey(),
  nextSequence: integer("next_sequence").notNull().default(1),
});

// Legacy alias
export const doiCounters = asidCounters;

// Pipeline runs — tracks autonomous paper generation lifecycle
export const paperRuns = pgTable("paper_runs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  status: text("status").notNull().default("queued"),
  domain: text("domain"),
  method: text("method"),
  prompt: text("prompt"),
  sessionId: text("session_id"),
  paperId: text("paper_id"),
  popperScore: integer("popper_score"),
  popperRecommendation: text("popper_recommendation"),
  popperReviewId: text("popper_review_id"),
  errorMessage: text("error_message"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  lastHeartbeat: timestamp("last_heartbeat"),
  governorState: text("governor_state"),   // JSON: AppState from governor
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Governor decision audit trail
export const governorDecisions = pgTable("governor_decisions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  runId: varchar("run_id").notNull(),
  timestamp: timestamp("timestamp").notNull(),
  stage: text("stage").notNull(),
  trigger: text("trigger").notNull(),
  actionType: text("action_type").notNull(),
  actionPayload: text("action_payload"),
  reasoning: text("reasoning").notNull(),
  profileBefore: text("profile_before").notNull(),
  profileAfter: text("profile_after").notNull(),
  confidenceBefore: real("confidence_before").notNull(),
  confidenceAfter: real("confidence_after").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Site configuration — key-value store for admin-managed settings
export const siteConfig = pgTable("site_config", {
  key: varchar("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Donations — crypto donation pledges from visitors
export const donations = pgTable("donations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email"),
  amount: real("amount").notNull(),
  currency: text("currency").notNull().default("BTC"), // BTC | ETH | USDC
  message: text("message"),
  txHash: text("tx_hash"), // on-chain transaction hash (optional, user-provided)
  status: text("status").notNull().default("pending"), // pending | confirmed | displayed
  showOnWall: integer("show_on_wall").notNull().default(1), // 1 = show on donor wall
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Conversation sessions table
export const conversationSessions = pgTable("conversation_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().unique(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  messages: text("messages").notNull(),
  inputTokens: integer("input_tokens").default(0),
  outputTokens: integer("output_tokens").default(0),
  totalCost: real("total_cost").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Active users tracking
export const activeUsers = pgTable("active_users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().unique(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("idle"),
  currentQuery: text("current_query"),
  lastHeartbeat: timestamp("last_heartbeat").notNull().defaultNow(),
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Analytics metrics
export const analyticsMetrics = pgTable("analytics_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  totalRequests: integer("total_requests").default(0),
  successfulRequests: integer("successful_requests").default(0),
  failedRequests: integer("failed_requests").default(0),
  activeUsers: integer("active_users").default(0),
  uniqueVisitors: integer("unique_visitors").default(0),
  averageResponseTime: real("average_response_time").default(0),
  peakResponseTime: real("peak_response_time").default(0),
  tokensGenerated: integer("tokens_generated").default(0),
  estimatedCost: real("estimated_cost").default(0),
  toolCallsCount: integer("tool_calls_count").default(0),
  pythonExecutions: integer("python_executions").default(0),
  searchQueries: integer("search_queries").default(0),
  errorCount: integer("error_count").default(0),
  errorRate: real("error_rate").default(0),
  periodType: text("period_type").notNull().default("minute"),
});

// Request logs
export const requestLogs = pgTable("request_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }),
  query: text("query").notNull(),
  responseTime: real("response_time"),
  inputTokens: integer("input_tokens").default(0),
  outputTokens: integer("output_tokens").default(0),
  totalCost: real("total_cost").default(0),
  toolsCalled: text("tools_called"),
  status: text("status").notNull(),
  errorMessage: text("error_message"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

// ═══════════════════════════════════════════════════════════════════════
// GLOBAL MEMORY ENGINE (GME) — 5 memory tables for cumulative learning
// ═══════════════════════════════════════════════════════════════════════

export const papersMemory = pgTable("papers_memory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  asid: text("asid"),
  title: text("title").notNull(),
  abstract: text("abstract"),
  domain: text("domain"),
  methodsUsed: text("methods_used"),
  datasetsUsed: text("datasets_used"),
  contributions: text("contributions"),
  limitations: text("limitations"),
  popperScore: real("popper_score"),
  abstractEmbedding: vector("abstract_embedding", { dimensions: 1536 }),
  contributionEmbedding: vector("contribution_embedding", { dimensions: 1536 }),
  methodologyEmbedding: vector("methodology_embedding", { dimensions: 1536 }),
  runId: text("run_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const methodsMemory = pgTable("methods_memory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  domain: text("domain").notNull(),
  method: text("method").notNull(),
  usageCount: integer("usage_count").notNull().default(0),
  avgPopperScore: real("avg_popper_score"),
  failureCount: integer("failure_count").notNull().default(0),
  successRate: real("success_rate"),
  notes: text("notes"),
  lastUsed: timestamp("last_used"),
});

export const datasetsMemory = pgTable("datasets_memory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  source: text("source").notNull(),
  endpoint: text("endpoint"),
  parameters: text("parameters"),
  schema: text("schema"),
  rowCount: integer("row_count"),
  reliabilityScore: real("reliability_score"),
  usageCount: integer("usage_count").notNull().default(0),
  datasetEmbedding: vector("dataset_embedding", { dimensions: 1536 }),
  lastUsed: timestamp("last_used"),
});

export const errorsMemory = pgTable("errors_memory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  stage: text("stage").notNull(),
  errorType: text("error_type").notNull(),
  errorMessage: text("error_message").notNull(),
  context: text("context"),
  solution: text("solution"),
  successRate: real("success_rate"),
  occurrenceCount: integer("occurrence_count").notNull().default(1),
  errorEmbedding: vector("error_embedding", { dimensions: 1536 }),
  solutionEmbedding: vector("solution_embedding", { dimensions: 1536 }),
  lastSeen: timestamp("last_seen").notNull().defaultNow(),
});

export const qualityMemory = pgTable("quality_memory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  domain: text("domain").notNull(),
  method: text("method").notNull(),
  avgScore: real("avg_score"),
  commonWeaknesses: text("common_weaknesses"),
  commonStrengths: text("common_strengths"),
  writingIssues: text("writing_issues"),
  reviewPatterns: text("review_patterns"),
  sampleCount: integer("sample_count").notNull().default(0),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ═══════════════════════════════════════════════════════════════════════
// EXTENDED PROFILE SYSTEM — publications, working papers, positions, links
// ═══════════════════════════════════════════════════════════════════════

export const userPublications = pgTable("user_publications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  authors: text("authors"),
  year: integer("year"),
  journal: text("journal"),
  publicationType: text("publication_type"),
  abstract: text("abstract"),
  doi: text("doi"),
  url: text("url"),
  pdfUrl: text("pdf_url"),
  status: text("status").notNull().default("published"),
  citation: text("citation"),
  featured: boolean("featured").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const userWorkingPapers = pgTable("user_working_papers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  coauthors: text("coauthors"),
  year: integer("year"),
  series: text("series"),
  abstract: text("abstract"),
  ssrnUrl: text("ssrn_url"),
  pdfUrl: text("pdf_url"),
  doi: text("doi"),
  status: text("status").notNull().default("working_paper"),
  featured: boolean("featured").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const userPositions = pgTable("user_positions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  institution: text("institution").notNull(),
  department: text("department"),
  startDate: text("start_date"),
  endDate: text("end_date"),
  isCurrent: boolean("is_current").notNull().default(false),
  location: text("location"),
  description: text("description"),
  positionType: text("position_type"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const userExternalLinks = pgTable("user_external_links", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  platform: text("platform").notNull(),
  label: text("label").notNull(),
  url: text("url").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const researchRequests = pgTable("research_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  topic: text("topic"),
  researchQuestion: text("research_question"),
  abstract: text("abstract"),
  field: text("field"),
  methodology: text("methodology"),
  orientation: text("orientation"),
  hypotheses: text("hypotheses"),
  dataSources: text("data_sources"),
  keywords: text("keywords"),
  instructions: text("instructions"),
  showOnProfile: boolean("show_on_profile").notNull().default(true),
  coauthorContext: text("coauthor_context"),
  targetVenue: text("target_venue"),
  notes: text("notes"),
  status: text("status").notNull().default("pending"),
  runId: text("run_id"),
  paperId: text("paper_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertCrawledPageSchema = createInsertSchema(crawledPages).omit({ id: true, crawledAt: true });
export const insertEmbeddingSchema = createInsertSchema(embeddings).omit({ id: true, createdAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });
export const insertSharedReportSchema = createInsertSchema(sharedReports).omit({ id: true, createdAt: true });
export const insertPublishedPaperSchema = createInsertSchema(publishedPapers).omit({ id: true, publishedAt: true });
export const insertSavedPromptSchema = createInsertSchema(savedPrompts).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPeerReviewSchema = createInsertSchema(peerReviews).omit({ id: true, createdAt: true });
export const insertPaperRunSchema = createInsertSchema(paperRuns).omit({ id: true, createdAt: true });
export const insertConversationSessionSchema = createInsertSchema(conversationSessions).omit({ id: true, createdAt: true, updatedAt: true });
export const insertActiveUserSchema = createInsertSchema(activeUsers).omit({ id: true, createdAt: true });
export const insertAnalyticsMetricSchema = createInsertSchema(analyticsMetrics).omit({ id: true, timestamp: true });
export const insertRequestLogSchema = createInsertSchema(requestLogs).omit({ id: true, timestamp: true });

// TypeScript types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type CrawledPage = typeof crawledPages.$inferSelect;
export type InsertCrawledPage = z.infer<typeof insertCrawledPageSchema>;

export type Embedding = typeof embeddings.$inferSelect;
export type InsertEmbedding = z.infer<typeof insertEmbeddingSchema>;

export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;

export type SharedReport = typeof sharedReports.$inferSelect;
export type InsertSharedReport = z.infer<typeof insertSharedReportSchema>;

export type PublishedPaper = typeof publishedPapers.$inferSelect;
export type InsertPublishedPaper = z.infer<typeof insertPublishedPaperSchema>;

export type ConversationSession = typeof conversationSessions.$inferSelect;
export type InsertConversationSession = z.infer<typeof insertConversationSessionSchema>;

export type ActiveUser = typeof activeUsers.$inferSelect;
export type InsertActiveUser = z.infer<typeof insertActiveUserSchema>;

export type AnalyticsMetric = typeof analyticsMetrics.$inferSelect;
export type InsertAnalyticsMetric = z.infer<typeof insertAnalyticsMetricSchema>;

export type RequestLog = typeof requestLogs.$inferSelect;
export type InsertRequestLog = z.infer<typeof insertRequestLogSchema>;

export type SavedPrompt = typeof savedPrompts.$inferSelect;
export type InsertSavedPrompt = z.infer<typeof insertSavedPromptSchema>;

export type PeerReview = typeof peerReviews.$inferSelect;
export type InsertPeerReview = z.infer<typeof insertPeerReviewSchema>;

export type PaperRun = typeof paperRuns.$inferSelect;
export type InsertPaperRun = z.infer<typeof insertPaperRunSchema>;

// ── GME Zod schemas & types ──────────────────────────────────────────

export const insertPapersMemorySchema = createInsertSchema(papersMemory).omit({ id: true, createdAt: true });
export type PapersMemoryRow = typeof papersMemory.$inferSelect;
export type InsertPapersMemory = z.infer<typeof insertPapersMemorySchema>;

export const insertMethodsMemorySchema = createInsertSchema(methodsMemory).omit({ id: true });
export type MethodsMemoryRow = typeof methodsMemory.$inferSelect;
export type InsertMethodsMemory = z.infer<typeof insertMethodsMemorySchema>;

export const insertDatasetsMemorySchema = createInsertSchema(datasetsMemory).omit({ id: true });
export type DatasetsMemoryRow = typeof datasetsMemory.$inferSelect;
export type InsertDatasetsMemory = z.infer<typeof insertDatasetsMemorySchema>;

export const insertErrorsMemorySchema = createInsertSchema(errorsMemory).omit({ id: true });
export type ErrorsMemoryRow = typeof errorsMemory.$inferSelect;
export type InsertErrorsMemory = z.infer<typeof insertErrorsMemorySchema>;

export const insertQualityMemorySchema = createInsertSchema(qualityMemory).omit({ id: true });
export type QualityMemoryRow = typeof qualityMemory.$inferSelect;
export type InsertQualityMemory = z.infer<typeof insertQualityMemorySchema>;

export const insertGovernorDecisionSchema = createInsertSchema(governorDecisions).omit({ id: true, createdAt: true });
export type GovernorDecisionRow = typeof governorDecisions.$inferSelect;
export type InsertGovernorDecision = z.infer<typeof insertGovernorDecisionSchema>;

export type SiteConfig = typeof siteConfig.$inferSelect;
export type Donation = typeof donations.$inferSelect;
export type InsertDonation = Omit<Donation, "id" | "createdAt">;

// ── Extended Profile Zod schemas & types ────────────────────────────

export const insertUserPublicationSchema = createInsertSchema(userPublications).omit({ id: true, createdAt: true, updatedAt: true });
export type UserPublication = typeof userPublications.$inferSelect;
export type InsertUserPublication = z.infer<typeof insertUserPublicationSchema>;

export const insertUserWorkingPaperSchema = createInsertSchema(userWorkingPapers).omit({ id: true, createdAt: true, updatedAt: true });
export type UserWorkingPaper = typeof userWorkingPapers.$inferSelect;
export type InsertUserWorkingPaper = z.infer<typeof insertUserWorkingPaperSchema>;

export const insertUserPositionSchema = createInsertSchema(userPositions).omit({ id: true, createdAt: true });
export type UserPosition = typeof userPositions.$inferSelect;
export type InsertUserPosition = z.infer<typeof insertUserPositionSchema>;

export const insertUserExternalLinkSchema = createInsertSchema(userExternalLinks).omit({ id: true, createdAt: true });
export type UserExternalLink = typeof userExternalLinks.$inferSelect;
export type InsertUserExternalLink = z.infer<typeof insertUserExternalLinkSchema>;

export const insertResearchRequestSchema = createInsertSchema(researchRequests).omit({ id: true, createdAt: true, updatedAt: true });
export type ResearchRequest = typeof researchRequests.$inferSelect;
export type InsertResearchRequest = z.infer<typeof insertResearchRequestSchema>;
