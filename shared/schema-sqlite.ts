import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Re-export shared API types
export type { SearchResult, ClaudeMessage, ClaudeToolCall, ClaudeToolResult, ChatRequest, ChatResponse, ConversationMessage } from "./types";

// Users table with token-based authentication
export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  displayName: text("display_name").notNull(),
  token: text("token").notNull().unique(),
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

export type ConversationSession = typeof conversationSessions.$inferSelect;
export type InsertConversationSession = z.infer<typeof insertConversationSessionSchema>;

export type ActiveUser = typeof activeUsers.$inferSelect;
export type InsertActiveUser = z.infer<typeof insertActiveUserSchema>;

export type AnalyticsMetric = typeof analyticsMetrics.$inferSelect;
export type InsertAnalyticsMetric = z.infer<typeof insertAnalyticsMetricSchema>;

export type RequestLog = typeof requestLogs.$inferSelect;
export type InsertRequestLog = z.infer<typeof insertRequestLogSchema>;

