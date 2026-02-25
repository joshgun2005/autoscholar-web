import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzleNode } from 'drizzle-orm/node-postgres';
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import { Pool as PgPool } from 'pg';
import Database from 'better-sqlite3';
import ws from "ws";
import * as schemaPg from "@shared/schema";
import * as schemaSqlite from "@shared/schema-sqlite";
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const databaseUrl = process.env.DATABASE_URL || 'sqlite://local.db';

// Determine database type
const isSqlite = databaseUrl.startsWith('sqlite://');
const isLocalDb = databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1');

let pool: any;
let db: any;
let schema: any;

if (isSqlite) {
  // Use SQLite for local development
  const dbPath = databaseUrl.replace('sqlite://', '');
  const fullPath = path.isAbsolute(dbPath) ? dbPath : path.join(process.cwd(), dbPath);

  const sqlite = new Database(fullPath);
  sqlite.pragma('journal_mode = WAL');

  db = drizzleSqlite(sqlite, { schema: schemaSqlite });
  pool = sqlite; // For session store compatibility
  schema = schemaSqlite;

  console.log(`Using SQLite database at: ${fullPath}`);
} else if (isLocalDb) {
  // Use standard PostgreSQL driver for local database
  pool = new PgPool({ connectionString: databaseUrl });
  db = drizzleNode(pool, { schema: schemaPg });
  schema = schemaPg;
} else {
  // Use Neon serverless driver for cloud database
  neonConfig.webSocketConstructor = ws;
  pool = new NeonPool({ connectionString: databaseUrl });
  db = drizzleNeon({ client: pool, schema: schemaPg });
  schema = schemaPg;
}

export { pool, db, schema };
