import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzleNode } from 'drizzle-orm/node-postgres';
import { drizzle as drizzleSqlite, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { NeonDatabase } from 'drizzle-orm/neon-serverless';
import { Pool as PgPool } from 'pg';
import Database from 'better-sqlite3';
import ws from "ws";
import * as schemaPg from "@shared/schema";
import * as schemaSqlite from "@shared/schema-sqlite";
import path from 'path';
import { logger } from './utils/logger';

const databaseUrl = process.env.DATABASE_URL || 'sqlite://local.db';

const isSqlite = databaseUrl.startsWith('sqlite://');
const isLocalDb = databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1');

// Both schemas export the same table names and structure.
// We use the SQLite schema as the canonical type since it's the superset.
type AppSchema = typeof schemaSqlite;
type AppDb = BetterSQLite3Database<AppSchema> | NodePgDatabase<typeof schemaPg> | NeonDatabase<typeof schemaPg>;
type AppPool = Database.Database | PgPool | NeonPool;

let pool: AppPool;
let db: AppDb;
let schema: AppSchema;

if (isSqlite) {
  const dbPath = databaseUrl.replace('sqlite://', '');
  const fullPath = path.isAbsolute(dbPath) ? dbPath : path.join(process.cwd(), dbPath);

  const sqlite = new Database(fullPath);
  sqlite.pragma('journal_mode = WAL');

  // Auto-add missing columns to published_papers (safe: ALTER TABLE ADD COLUMN is idempotent-ish in SQLite)
  const safeAlter = (sql: string) => { try { sqlite.exec(sql); } catch { /* column likely already exists */ } };
  safeAlter('ALTER TABLE published_papers ADD COLUMN latex_content TEXT');
  safeAlter('ALTER TABLE published_papers ADD COLUMN bibtex_entries TEXT');
  safeAlter('ALTER TABLE published_papers ADD COLUMN session_id TEXT');
  safeAlter('ALTER TABLE published_papers ADD COLUMN user_id TEXT');
  safeAlter('ALTER TABLE published_papers ADD COLUMN author_name TEXT');
  safeAlter('ALTER TABLE published_papers ADD COLUMN show_in_journal INTEGER NOT NULL DEFAULT 1');

  // DOI → ASID migration: rename doi column to asid, rename doi_counters table
  safeAlter('ALTER TABLE published_papers RENAME COLUMN doi TO asid');
  try { sqlite.exec('ALTER TABLE doi_counters RENAME TO asid_counters'); } catch { /* already renamed or doesn't exist */ }

  // Backfill author_name from conversation_sessions → users for existing papers
  try {
    sqlite.exec(`
      UPDATE published_papers
      SET user_id = (
        SELECT cs.user_id FROM conversation_sessions cs WHERE cs.session_id = published_papers.session_id LIMIT 1
      )
      WHERE user_id IS NULL AND session_id IS NOT NULL;
    `);
    sqlite.exec(`
      UPDATE published_papers
      SET author_name = COALESCE(
        (SELECT up.display_name FROM user_profiles up WHERE up.id = published_papers.user_id LIMIT 1),
        (SELECT u.display_name FROM users u WHERE u.id = published_papers.user_id LIMIT 1)
      )
      WHERE author_name IS NULL AND user_id IS NOT NULL;
    `);
  } catch { /* tables may not exist yet on first run */ }

  // Create saved_prompts table if it doesn't exist
  sqlite.exec(`CREATE TABLE IF NOT EXISTS saved_prompts (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    author_name TEXT,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`);
  safeAlter('ALTER TABLE saved_prompts ADD COLUMN author_name TEXT');

  // Profile enhancement columns
  safeAlter('ALTER TABLE users ADD COLUMN title TEXT');
  safeAlter('ALTER TABLE users ADD COLUMN profile_photo TEXT');
  safeAlter('ALTER TABLE users ADD COLUMN google_scholar TEXT');
  safeAlter('ALTER TABLE users ADD COLUMN research_gate TEXT');
  safeAlter('ALTER TABLE users ADD COLUMN linkedin TEXT');
  safeAlter('ALTER TABLE user_profiles ADD COLUMN title TEXT');
  safeAlter('ALTER TABLE user_profiles ADD COLUMN profile_photo TEXT');
  safeAlter('ALTER TABLE user_profiles ADD COLUMN google_scholar TEXT');
  safeAlter('ALTER TABLE user_profiles ADD COLUMN research_gate TEXT');
  safeAlter('ALTER TABLE user_profiles ADD COLUMN linkedin TEXT');

  // Auth: add is_verified column + token tables
  safeAlter('ALTER TABLE users ADD COLUMN is_verified INTEGER NOT NULL DEFAULT 0');

  sqlite.exec(`CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  )`);

  sqlite.exec(`CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    used INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  )`);

  // Create paper_runs table if it doesn't exist
  sqlite.exec(`CREATE TABLE IF NOT EXISTS paper_runs (
    id TEXT PRIMARY KEY,
    status TEXT NOT NULL DEFAULT 'queued',
    domain TEXT,
    method TEXT,
    prompt TEXT,
    session_id TEXT,
    paper_id TEXT,
    popper_score INTEGER,
    popper_recommendation TEXT,
    popper_review_id TEXT,
    error_message TEXT,
    started_at INTEGER,
    completed_at INTEGER,
    created_at INTEGER NOT NULL
  )`);

  // Add heartbeat tracking + governor state to paper_runs
  safeAlter('ALTER TABLE paper_runs ADD COLUMN last_heartbeat INTEGER');
  safeAlter('ALTER TABLE paper_runs ADD COLUMN governor_state TEXT');

  // Create governor_decisions table
  sqlite.exec(`CREATE TABLE IF NOT EXISTS governor_decisions (
    id TEXT PRIMARY KEY,
    run_id TEXT NOT NULL,
    timestamp INTEGER NOT NULL,
    stage TEXT NOT NULL,
    trigger TEXT NOT NULL,
    action_type TEXT NOT NULL,
    action_payload TEXT,
    reasoning TEXT NOT NULL,
    profile_before TEXT NOT NULL,
    profile_after TEXT NOT NULL,
    confidence_before REAL NOT NULL,
    confidence_after REAL NOT NULL,
    created_at INTEGER NOT NULL
  )`);

  // Add run_id to published_papers
  safeAlter('ALTER TABLE published_papers ADD COLUMN run_id TEXT');

  // Site config + donations tables
  sqlite.exec(`CREATE TABLE IF NOT EXISTS site_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at INTEGER NOT NULL
  )`);

  sqlite.exec(`CREATE TABLE IF NOT EXISTS donations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    amount REAL NOT NULL,
    currency TEXT NOT NULL DEFAULT 'BTC',
    message TEXT,
    tx_hash TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    show_on_wall INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL
  )`);

  // Migrate donations table for crypto support
  safeAlter("ALTER TABLE donations ADD COLUMN currency TEXT NOT NULL DEFAULT 'BTC'");
  safeAlter('ALTER TABLE donations ADD COLUMN tx_hash TEXT');
  safeAlter('ALTER TABLE donations ADD COLUMN show_on_wall INTEGER NOT NULL DEFAULT 1');

  // Seed initial anonymous fiat donations (idempotent — uses fixed IDs)
  sqlite.exec(`INSERT OR IGNORE INTO donations (id, name, email, amount, currency, message, tx_hash, status, show_on_wall, created_at)
    VALUES ('seed-donation-anon-1', 'Anonymous', NULL, 10221.71, 'USD', NULL, NULL, 'confirmed', 1, ${Math.floor(new Date('2026-03-30').getTime() / 1000)})`);
  sqlite.exec(`INSERT OR IGNORE INTO donations (id, name, email, amount, currency, message, tx_hash, status, show_on_wall, created_at)
    VALUES ('seed-donation-anon-2', 'Anonymous', NULL, 14025.72, 'USD', NULL, NULL, 'confirmed', 1, ${Math.floor(new Date('2026-03-30').getTime() / 1000)})`);

  // Create api_keys table for public research API
  sqlite.exec(`CREATE TABLE IF NOT EXISTS api_keys (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    key_hash TEXT NOT NULL UNIQUE,
    key_prefix TEXT NOT NULL,
    scopes TEXT NOT NULL DEFAULT 'read',
    rate_limit INTEGER NOT NULL DEFAULT 100,
    total_requests INTEGER NOT NULL DEFAULT 0,
    last_used_at INTEGER,
    expires_at INTEGER,
    revoked INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  )`);

  // Create peer_reviews table if it doesn't exist
  sqlite.exec(`CREATE TABLE IF NOT EXISTS peer_reviews (
    id TEXT PRIMARY KEY,
    paper_id TEXT NOT NULL REFERENCES published_papers(id) ON DELETE CASCADE,
    overall_score INTEGER NOT NULL,
    summary TEXT NOT NULL,
    strengths TEXT NOT NULL,
    weaknesses TEXT NOT NULL,
    detailed_scores TEXT NOT NULL,
    section_reviews TEXT NOT NULL,
    recommendation TEXT NOT NULL,
    full_report TEXT NOT NULL,
    created_at INTEGER NOT NULL
  )`);

  // ── GME (Global Memory Engine) tables ──
  sqlite.exec(`CREATE TABLE IF NOT EXISTS papers_memory (
    id TEXT PRIMARY KEY,
    asid TEXT,
    title TEXT NOT NULL,
    abstract TEXT,
    domain TEXT,
    methods_used TEXT,
    datasets_used TEXT,
    contributions TEXT,
    limitations TEXT,
    popper_score REAL,
    abstract_embedding TEXT,
    contribution_embedding TEXT,
    methodology_embedding TEXT,
    run_id TEXT,
    created_at INTEGER NOT NULL
  )`);

  sqlite.exec(`CREATE TABLE IF NOT EXISTS methods_memory (
    id TEXT PRIMARY KEY,
    domain TEXT NOT NULL,
    method TEXT NOT NULL,
    usage_count INTEGER NOT NULL DEFAULT 0,
    avg_popper_score REAL,
    failure_count INTEGER NOT NULL DEFAULT 0,
    success_rate REAL,
    notes TEXT,
    last_used INTEGER
  )`);

  sqlite.exec(`CREATE TABLE IF NOT EXISTS datasets_memory (
    id TEXT PRIMARY KEY,
    source TEXT NOT NULL,
    endpoint TEXT,
    parameters TEXT,
    schema TEXT,
    row_count INTEGER,
    reliability_score REAL,
    usage_count INTEGER NOT NULL DEFAULT 0,
    dataset_embedding TEXT,
    last_used INTEGER
  )`);

  sqlite.exec(`CREATE TABLE IF NOT EXISTS errors_memory (
    id TEXT PRIMARY KEY,
    stage TEXT NOT NULL,
    error_type TEXT NOT NULL,
    error_message TEXT NOT NULL,
    context TEXT,
    solution TEXT,
    success_rate REAL,
    occurrence_count INTEGER NOT NULL DEFAULT 1,
    error_embedding TEXT,
    solution_embedding TEXT,
    last_seen INTEGER NOT NULL
  )`);

  sqlite.exec(`CREATE TABLE IF NOT EXISTS quality_memory (
    id TEXT PRIMARY KEY,
    domain TEXT NOT NULL,
    method TEXT NOT NULL,
    avg_score REAL,
    common_weaknesses TEXT,
    common_strengths TEXT,
    writing_issues TEXT,
    review_patterns TEXT,
    sample_count INTEGER NOT NULL DEFAULT 0,
    updated_at INTEGER NOT NULL
  )`);

  // Extended profile columns on users table
  safeAlter('ALTER TABLE users ADD COLUMN location TEXT');
  safeAlter('ALTER TABLE users ADD COLUMN long_bio TEXT');
  safeAlter('ALTER TABLE users ADD COLUMN research_interests TEXT');
  safeAlter('ALTER TABLE users ADD COLUMN banner_image TEXT');
  safeAlter('ALTER TABLE users ADD COLUMN profile_theme TEXT');

  // Extended profile tables
  sqlite.exec(`CREATE TABLE IF NOT EXISTS user_publications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    authors TEXT,
    year INTEGER,
    journal TEXT,
    publication_type TEXT,
    abstract TEXT,
    doi TEXT,
    url TEXT,
    pdf_url TEXT,
    status TEXT NOT NULL DEFAULT 'published',
    citation TEXT,
    featured INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`);

  sqlite.exec(`CREATE TABLE IF NOT EXISTS user_working_papers (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    coauthors TEXT,
    year INTEGER,
    series TEXT,
    abstract TEXT,
    ssrn_url TEXT,
    pdf_url TEXT,
    doi TEXT,
    status TEXT NOT NULL DEFAULT 'working_paper',
    featured INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`);

  sqlite.exec(`CREATE TABLE IF NOT EXISTS user_positions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    institution TEXT NOT NULL,
    department TEXT,
    start_date TEXT,
    end_date TEXT,
    is_current INTEGER NOT NULL DEFAULT 0,
    location TEXT,
    description TEXT,
    position_type TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  )`);

  sqlite.exec(`CREATE TABLE IF NOT EXISTS user_external_links (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform TEXT NOT NULL,
    label TEXT NOT NULL,
    url TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL
  )`);

  sqlite.exec(`CREATE TABLE IF NOT EXISTS research_requests (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    topic TEXT,
    research_question TEXT,
    abstract TEXT,
    field TEXT,
    methodology TEXT,
    orientation TEXT,
    hypotheses TEXT,
    data_sources TEXT,
    keywords TEXT,
    instructions TEXT,
    show_on_profile INTEGER NOT NULL DEFAULT 1,
    coauthor_context TEXT,
    target_venue TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    run_id TEXT,
    paper_id TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  )`);

  db = drizzleSqlite(sqlite, { schema: schemaSqlite });
  pool = sqlite;
  schema = schemaSqlite;

  logger.info(`Using SQLite database at: ${fullPath}`);
} else if (isLocalDb) {
  const pgPool = new PgPool({ connectionString: databaseUrl });
  db = drizzleNode(pgPool, { schema: schemaPg });
  pool = pgPool;
  schema = schemaPg as unknown as AppSchema;

  logger.info('Using local PostgreSQL database');
} else {
  neonConfig.webSocketConstructor = ws;
  const neonPool = new NeonPool({ connectionString: databaseUrl });
  db = drizzleNeon({ client: neonPool, schema: schemaPg });
  pool = neonPool;
  schema = schemaPg as unknown as AppSchema;

  logger.info('Using Neon serverless PostgreSQL database');
}

// rawDb = the underlying driver (better-sqlite3 Database | PgPool | NeonPool)
export { pool, pool as rawDb, db, schema, isSqlite };
export type { AppDb, AppPool, AppSchema };
