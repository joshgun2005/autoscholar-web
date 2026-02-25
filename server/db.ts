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

export { pool, db, schema, isSqlite };
export type { AppDb, AppPool, AppSchema };
