import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, real, vector } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Re-export shared API types
export type { SearchResult, ClaudeMessage, ClaudeToolCall, ClaudeToolResult, ChatRequest, ChatResponse, ConversationMessage } from "./types";

// Users table with token-based authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  displayName: text("display_name").notNull(),
  token: text("token").notNull().unique(),
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

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertCrawledPageSchema = createInsertSchema(crawledPages).omit({ id: true, crawledAt: true });
export const insertEmbeddingSchema = createInsertSchema(embeddings).omit({ id: true, createdAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, createdAt: true });
export const insertSharedReportSchema = createInsertSchema(sharedReports).omit({ id: true, createdAt: true });
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

export type ConversationSession = typeof conversationSessions.$inferSelect;
export type InsertConversationSession = z.infer<typeof insertConversationSessionSchema>;

export type ActiveUser = typeof activeUsers.$inferSelect;
export type InsertActiveUser = z.infer<typeof insertActiveUserSchema>;

export type AnalyticsMetric = typeof analyticsMetrics.$inferSelect;
export type InsertAnalyticsMetric = z.infer<typeof insertAnalyticsMetricSchema>;

export type RequestLog = typeof requestLogs.$inferSelect;
export type InsertRequestLog = z.infer<typeof insertRequestLogSchema>;
