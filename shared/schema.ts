import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, vector } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

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
  embedding: vector("embedding", { dimensions: 3072 }), // text-embedding-3-large dimensions
  tokenCount: integer("token_count").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Chat messages table - stores conversation history
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull(),
  role: text("role").notNull(), // 'user' or 'assistant'
  content: text("content").notNull(),
  sources: text("sources").array(), // URLs of sources used
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Shared reports table - stores crystallized reports with unique links
export const sharedReports = pgTable("shared_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  shareId: varchar("share_id").notNull().unique(), // Unique short ID for the share link
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  toolResults: text("tool_results"), // JSON string of tool results
  sources: text("sources"), // JSON string of complete SearchResult objects
  customPythonFigures: text("custom_python_figures"), // JSON string of Python figures batches
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Conversation sessions table - stores complete conversation sessions with all data
export const conversationSessions = pgTable("conversation_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().unique(), // Session identifier
  userId: varchar("user_id").references(() => users.id, { onDelete: "cascade" }), // Owner of the session (null for anonymous)
  title: text("title").notNull(), // First question or custom title
  messages: text("messages").notNull(), // JSON array of { question, answer, toolResults, sources, searchQueries, pythonCode, monteCarloResults }
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
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

// Additional types for API responses
export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  favicon?: string;
  rank: number;
}

export interface ClaudeMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ClaudeToolCall {
  name: string;
  input: Record<string, any>;
}

export interface ClaudeToolResult {
  tool_use_id: string;
  content: string;
}

export interface ChatRequest {
  query: string;
  sessionId?: string;
}

export interface ChatResponse {
  answer: string;
  sources: SearchResult[];
  sessionId: string;
}
