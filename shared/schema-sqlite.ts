import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Re-export shared API types
export type { SearchResult, ClaudeMessage, ClaudeToolCall, ClaudeToolResult, ChatRequest, ChatResponse, ConversationMessage } from "./types";

// Users table with username/password authentication (legacy — kept for migration)
export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name").notNull(),
  email: text("email"),
  institution: text("institution"),
  department: text("department"),
  orcid: text("orcid"), // ORCID identifier (e.g. 0000-0002-1234-5678)
  website: text("website"),
  bio: text("bio"),
  title: text("title"), // e.g. "Professor", "PhD Candidate", "Research Scientist"
  profilePhoto: text("profile_photo"), // base64 data URL
  googleScholar: text("google_scholar"), // Google Scholar profile URL
  researchGate: text("research_gate"), // ResearchGate profile URL
  linkedin: text("linkedin"), // LinkedIn profile URL
  anthropicApiKey: text("anthropic_api_key"), // encrypted user API key
  isVerified: integer("is_verified", { mode: "boolean" }).notNull().default(false),
  token: text("token").notNull().unique(), // legacy compat — auto-generated
  location: text("location"), // optional location
  longBio: text("long_bio"), // extended about section
  researchInterests: text("research_interests"), // JSON array of interest tags
  bannerImage: text("banner_image"), // optional banner/cover image (base64)
  profileTheme: text("profile_theme"), // JSON: accent color, font, layout, card style, hero, bg pattern
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Email verification tokens
export const emailVerificationTokens = sqliteTable("email_verification_tokens", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull(),
  expiresAt: integer("expires_at", { mode: 'timestamp' }).notNull(),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Password reset tokens
export const passwordResetTokens = sqliteTable("password_reset_tokens", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull(),
  expiresAt: integer("expires_at", { mode: 'timestamp' }).notNull(),
  used: integer("used", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// User profiles — linked to Supabase auth.users by ID
export const userProfiles = sqliteTable("user_profiles", {
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
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Crawled pages table - stores web content
export const crawledPages = sqliteTable("crawled_pages", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  url: text("url").notNull().unique(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  snippet: text("snippet"),
  favicon: text("favicon"),
  crawledAt: integer("crawled_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Embeddings table - stores vector embeddings for semantic search
// Note: SQLite doesn't have native vector support, we'll store as JSON text
export const embeddings = sqliteTable("embeddings", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  pageId: text("page_id").notNull().unique().references(() => crawledPages.id, { onDelete: "cascade" }),
  embedding: text("embedding"), // JSON string of vector array
  tokenCount: integer("token_count").notNull(),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Chat messages table - stores conversation history
export const messages = sqliteTable("messages", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  sessionId: text("session_id").notNull(),
  role: text("role").notNull(), // 'user' or 'assistant'
  content: text("content").notNull(),
  sources: text("sources"), // JSON array of URLs
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Shared reports table - stores crystallized reports with unique links
export const sharedReports = sqliteTable("shared_reports", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  shareId: text("share_id").notNull().unique(), // Unique short ID for the share link
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  toolResults: text("tool_results"),
  sources: text("sources"),
  customPythonFigures: text("custom_python_figures"),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Published research papers — AutoScholar Journal
export const publishedPapers = sqliteTable("published_papers", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
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
  publishedAt: integer("published_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Saved prompts — public prompt library (persistent, server-side)
export const savedPrompts = sqliteTable("saved_prompts", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  authorName: text("author_name"), // display name at time of creation (or "Anonymous")
  title: text("title").notNull(),
  content: text("content").notNull(),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Peer reviews — AI-generated academic peer review reports
export const peerReviews = sqliteTable("peer_reviews", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  paperId: text("paper_id").notNull().references(() => publishedPapers.id, { onDelete: "cascade" }),
  overallScore: integer("overall_score").notNull(), // 0-100
  summary: text("summary").notNull(), // executive summary of the review
  strengths: text("strengths").notNull(), // JSON array of strings
  weaknesses: text("weaknesses").notNull(), // JSON array of strings
  detailedScores: text("detailed_scores").notNull(), // JSON: { originality, methodology, results, writing, references, reproducibility }
  sectionReviews: text("section_reviews").notNull(), // JSON array of { section, score, comments }
  recommendation: text("recommendation").notNull(), // "accept", "minor_revision", "major_revision", "reject"
  fullReport: text("full_report").notNull(), // full markdown peer review report
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ASID sequence counters — one row per year for atomic increment
export const asidCounters = sqliteTable("asid_counters", {
  year: integer("year").primaryKey(),
  nextSequence: integer("next_sequence").notNull().default(1),
});

// Legacy alias
export const doiCounters = asidCounters;

// Pipeline runs — tracks autonomous paper generation lifecycle
export const paperRuns = sqliteTable("paper_runs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  status: text("status").notNull().default("queued"),
    // queued | researching | analyzing | drafting | validating | published | rejected | failed
  domain: text("domain"),
  method: text("method"),
  prompt: text("prompt"),
  sessionId: text("session_id"),
  paperId: text("paper_id"),
  popperScore: integer("popper_score"),
  popperRecommendation: text("popper_recommendation"),
  popperReviewId: text("popper_review_id"),
  errorMessage: text("error_message"),
  startedAt: integer("started_at", { mode: 'timestamp' }),
  completedAt: integer("completed_at", { mode: 'timestamp' }),
  lastHeartbeat: integer("last_heartbeat", { mode: 'timestamp' }),
  governorState: text("governor_state"),   // JSON: AppState from governor
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Governor decision audit trail — one row per governor decision during a pipeline run
export const governorDecisions = sqliteTable("governor_decisions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  runId: text("run_id").notNull(),
  timestamp: integer("timestamp", { mode: 'timestamp' }).notNull(),
  stage: text("stage").notNull(),
  trigger: text("trigger").notNull(),
  actionType: text("action_type").notNull(),
  actionPayload: text("action_payload"),    // JSON
  reasoning: text("reasoning").notNull(),
  profileBefore: text("profile_before").notNull(),
  profileAfter: text("profile_after").notNull(),
  confidenceBefore: real("confidence_before").notNull(),
  confidenceAfter: real("confidence_after").notNull(),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Site configuration — key-value store for admin-managed settings
export const siteConfig = sqliteTable("site_config", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Donations — crypto donation pledges from visitors
export const donations = sqliteTable("donations", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  email: text("email"),
  amount: real("amount").notNull(),
  currency: text("currency").notNull().default("BTC"), // BTC | ETH | USDC
  message: text("message"),
  txHash: text("tx_hash"), // on-chain transaction hash (optional)
  status: text("status").notNull().default("pending"), // pending | confirmed | displayed
  showOnWall: integer("show_on_wall").notNull().default(1), // 1 = show on donor wall
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Conversation sessions table - stores complete conversation sessions with all data
export const conversationSessions = sqliteTable("conversation_sessions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  sessionId: text("session_id").notNull().unique(), // Session identifier
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }), // Owner of the session (null for anonymous)
  title: text("title").notNull(), // First question or custom title
  messages: text("messages").notNull(), // JSON array of { question, answer, toolResults, sources, searchQueries, pythonCode, monteCarloResults }
  inputTokens: integer("input_tokens").default(0), // Total input tokens used in this session
  outputTokens: integer("output_tokens").default(0), // Total output tokens used in this session
  totalCost: real("total_cost").default(0), // Total cost in USD (calculated as $3/$15 per million tokens)
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Active users tracking - tracks who is currently generating content
export const activeUsers = sqliteTable("active_users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  sessionId: text("session_id").notNull().unique(), // Browser session ID (not conversation session)
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }), // User ID if logged in
  status: text("status").notNull().default("idle"), // idle, generating, error
  currentQuery: text("current_query"), // Current question being processed
  lastHeartbeat: integer("last_heartbeat", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Analytics metrics - stores aggregated metrics over time
export const analyticsMetrics = sqliteTable("analytics_metrics", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  timestamp: integer("timestamp", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),

  // Request metrics
  totalRequests: integer("total_requests").default(0),
  successfulRequests: integer("successful_requests").default(0),
  failedRequests: integer("failed_requests").default(0),

  // User metrics
  activeUsers: integer("active_users").default(0), // Count of users actively generating
  uniqueVisitors: integer("unique_visitors").default(0), // Unique sessions in this period

  // Performance metrics
  averageResponseTime: real("average_response_time").default(0), // In milliseconds
  peakResponseTime: real("peak_response_time").default(0),

  // Token metrics
  tokensGenerated: integer("tokens_generated").default(0),
  estimatedCost: real("estimated_cost").default(0),

  // Tool usage
  toolCallsCount: integer("tool_calls_count").default(0),
  pythonExecutions: integer("python_executions").default(0),
  searchQueries: integer("search_queries").default(0),

  // Error tracking
  errorCount: integer("error_count").default(0),
  errorRate: real("error_rate").default(0), // Percentage

  // Period type (for aggregation)
  periodType: text("period_type").notNull().default("minute"), // minute, hour, day
});

// Request logs - detailed logs for each request
export const requestLogs = sqliteTable("request_logs", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  sessionId: text("session_id").notNull(),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),

  query: text("query").notNull(),
  responseTime: real("response_time"), // In milliseconds

  inputTokens: integer("input_tokens").default(0),
  outputTokens: integer("output_tokens").default(0),
  totalCost: real("total_cost").default(0),

  toolsCalled: text("tools_called"), // JSON array of tool names

  status: text("status").notNull(), // success, error, timeout
  errorMessage: text("error_message"),

  timestamp: integer("timestamp", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ═══════════════════════════════════════════════════════════════════════
// GLOBAL MEMORY ENGINE (GME) — 5 memory tables for cumulative learning
// ═══════════════════════════════════════════════════════════════════════

// Papers memory — tracks all generated papers for deduplication & learning
export const papersMemory = sqliteTable("papers_memory", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  asid: text("asid"),
  title: text("title").notNull(),
  abstract: text("abstract"),
  domain: text("domain"),
  methodsUsed: text("methods_used"),        // JSON array of methods
  datasetsUsed: text("datasets_used"),      // JSON array of dataset refs
  contributions: text("contributions"),
  limitations: text("limitations"),
  popperScore: real("popper_score"),
  // Embeddings stored as JSON float arrays (SQLite has no native vector)
  abstractEmbedding: text("abstract_embedding"),
  contributionEmbedding: text("contribution_embedding"),
  methodologyEmbedding: text("methodology_embedding"),
  runId: text("run_id"),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Methods memory — tracks method performance across domains
export const methodsMemory = sqliteTable("methods_memory", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  domain: text("domain").notNull(),
  method: text("method").notNull(),
  usageCount: integer("usage_count").notNull().default(0),
  avgPopperScore: real("avg_popper_score"),
  failureCount: integer("failure_count").notNull().default(0),
  successRate: real("success_rate"),
  notes: text("notes"),
  lastUsed: integer("last_used", { mode: 'timestamp' }),
});

// Datasets memory — tracks data sources for reuse & reliability
export const datasetsMemory = sqliteTable("datasets_memory", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  source: text("source").notNull(),          // e.g. "FRED", "FMP", "Yahoo Finance"
  endpoint: text("endpoint"),                // API endpoint or ticker
  parameters: text("parameters"),            // JSON: query parameters used
  schema: text("schema"),                    // JSON: column names & types
  rowCount: integer("row_count"),
  reliabilityScore: real("reliability_score"),
  usageCount: integer("usage_count").notNull().default(0),
  datasetEmbedding: text("dataset_embedding"), // JSON float array
  lastUsed: integer("last_used", { mode: 'timestamp' }),
});

// Errors memory — tracks pipeline errors for failure avoidance
export const errorsMemory = sqliteTable("errors_memory", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  stage: text("stage").notNull(),            // turing | newton | fisher | euler_write | euler_compile
  errorType: text("error_type").notNull(),
  errorMessage: text("error_message").notNull(),
  context: text("context"),                  // what was being attempted
  solution: text("solution"),                // how it was resolved
  successRate: real("success_rate"),          // how often the solution works
  occurrenceCount: integer("occurrence_count").notNull().default(1),
  errorEmbedding: text("error_embedding"),   // JSON float array
  solutionEmbedding: text("solution_embedding"), // JSON float array
  lastSeen: integer("last_seen", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Quality memory — tracks writing & review patterns per domain/method
export const qualityMemory = sqliteTable("quality_memory", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  domain: text("domain").notNull(),
  method: text("method").notNull(),
  avgScore: real("avg_score"),
  commonWeaknesses: text("common_weaknesses"),   // JSON array
  commonStrengths: text("common_strengths"),     // JSON array
  writingIssues: text("writing_issues"),         // JSON array
  reviewPatterns: text("review_patterns"),       // JSON array
  sampleCount: integer("sample_count").notNull().default(0),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ═══════════════════════════════════════════════════════════════════════
// EXTENDED PROFILE SYSTEM — publications, working papers, positions, links
// ═══════════════════════════════════════════════════════════════════════

// User publications — manually entered academic publications
export const userPublications = sqliteTable("user_publications", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  authors: text("authors"), // coauthor list
  year: integer("year"),
  journal: text("journal"), // journal or venue name
  publicationType: text("publication_type"), // journal_article, conference_paper, book_chapter, report, thesis, other
  abstract: text("abstract"),
  doi: text("doi"),
  url: text("url"),
  pdfUrl: text("pdf_url"),
  status: text("status").notNull().default("published"), // published, accepted, forthcoming, revise_and_resubmit
  citation: text("citation"), // optional full citation string
  featured: integer("featured", { mode: "boolean" }).notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// User working papers — separate from published papers
export const userWorkingPapers = sqliteTable("user_working_papers", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  coauthors: text("coauthors"),
  year: integer("year"),
  series: text("series"), // working paper series / institution
  abstract: text("abstract"),
  ssrnUrl: text("ssrn_url"),
  pdfUrl: text("pdf_url"),
  doi: text("doi"),
  status: text("status").notNull().default("working_paper"), // working_paper, draft, under_review, submitted, revision
  featured: integer("featured", { mode: "boolean" }).notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// User positions / employment history
export const userPositions = sqliteTable("user_positions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // title / position name
  institution: text("institution").notNull(),
  department: text("department"),
  startDate: text("start_date"), // ISO date string (YYYY-MM)
  endDate: text("end_date"), // ISO date string or null if current
  isCurrent: integer("is_current", { mode: "boolean" }).notNull().default(false),
  location: text("location"),
  description: text("description"),
  positionType: text("position_type"), // academic, industry, research_assistantship, teaching, internship, postdoc, administrative, other
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// User external links — structured academic/professional links
export const userExternalLinks = sqliteTable("user_external_links", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  platform: text("platform").notNull(), // google_scholar, ssrn, orcid, github, linkedin, researchgate, twitter, arxiv, semantic_scholar, personal_website, university, substack, other
  label: text("label").notNull(), // display label
  url: text("url").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Research requests — user-submitted paper generation requests
export const researchRequests = sqliteTable("research_requests", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(), // paper title or tentative title
  topic: text("topic"), // research topic
  researchQuestion: text("research_question"),
  abstract: text("abstract"), // abstract / motivation
  field: text("field"), // discipline
  methodology: text("methodology"), // methodology preferences
  orientation: text("orientation"), // empirical, theoretical, mixed
  hypotheses: text("hypotheses"), // key hypotheses
  dataSources: text("data_sources"), // desired data sources
  keywords: text("keywords"), // JSON array of keywords
  instructions: text("instructions"), // special instructions
  showOnProfile: integer("show_on_profile", { mode: "boolean" }).notNull().default(true),
  coauthorContext: text("coauthor_context"),
  targetVenue: text("target_venue"),
  notes: text("notes"), // notes to AutoScholar
  status: text("status").notNull().default("pending"), // pending, approved, generating, completed, rejected
  runId: text("run_id"), // links to paperRuns.id when generating
  paperId: text("paper_id"), // links to published_papers.id when completed
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// API keys — public research API authentication
export const apiKeys = sqliteTable("api_keys", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // human-readable label, e.g. "My Research Script"
  keyHash: text("key_hash").notNull().unique(), // SHA-256 hash of the actual key (prefix stored separately)
  keyPrefix: text("key_prefix").notNull(), // first 8 chars for identification, e.g. "ask_a1b2..."
  scopes: text("scopes").notNull().default("read"), // comma-separated: read, search, download, write
  rateLimit: integer("rate_limit").notNull().default(100), // requests per hour
  totalRequests: integer("total_requests").notNull().default(0),
  lastUsedAt: integer("last_used_at", { mode: 'timestamp' }),
  expiresAt: integer("expires_at", { mode: 'timestamp' }), // null = never expires
  revoked: integer("revoked", { mode: "boolean" }).notNull().default(false),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertCrawledPageSchema = createInsertSchema(crawledPages).omit({
  id: true,
  crawledAt: true,
});

export const insertEmbeddingSchema = createInsertSchema(embeddings).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertSharedReportSchema = createInsertSchema(sharedReports).omit({
  id: true,
  createdAt: true,
});

export const insertPublishedPaperSchema = createInsertSchema(publishedPapers).omit({
  id: true,
  publishedAt: true,
});

export const insertSavedPromptSchema = createInsertSchema(savedPrompts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPeerReviewSchema = createInsertSchema(peerReviews).omit({
  id: true,
  createdAt: true,
});

export const insertPaperRunSchema = createInsertSchema(paperRuns).omit({
  id: true,
  createdAt: true,
});

export const insertConversationSessionSchema = createInsertSchema(conversationSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertActiveUserSchema = createInsertSchema(activeUsers).omit({
  id: true,
  createdAt: true,
});

export const insertAnalyticsMetricSchema = createInsertSchema(analyticsMetrics).omit({
  id: true,
  timestamp: true,
});

export const insertRequestLogSchema = createInsertSchema(requestLogs).omit({
  id: true,
  timestamp: true,
});

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

export const insertGovernorDecisionSchema = createInsertSchema(governorDecisions).omit({
  id: true,
  createdAt: true,
});
export type GovernorDecisionRow = typeof governorDecisions.$inferSelect;
export type InsertGovernorDecision = z.infer<typeof insertGovernorDecisionSchema>;

export type SiteConfig = typeof siteConfig.$inferSelect;
export type Donation = typeof donations.$inferSelect;
export type InsertDonation = Omit<Donation, "id" | "createdAt">;

export const insertApiKeySchema = createInsertSchema(apiKeys).omit({
  id: true,
  createdAt: true,
});
export type ApiKey = typeof apiKeys.$inferSelect;
export type InsertApiKey = z.infer<typeof insertApiKeySchema>;

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

