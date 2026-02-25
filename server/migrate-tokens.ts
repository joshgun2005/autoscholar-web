import Database from "better-sqlite3";
import { existsSync } from "fs";
import path from "path";

/**
 * Migration script to add token tracking and cost columns to conversation_sessions table
 * Run this with: tsx server/migrate-tokens.ts
 */

const DB_PATH = path.join(process.cwd(), "local.db");

if (!existsSync(DB_PATH)) {
  console.error("❌ Database file not found at:", DB_PATH);
  process.exit(1);
}

console.log("🔄 Starting migration to add token tracking columns...");
console.log("📁 Database:", DB_PATH);

const db = new Database(DB_PATH);

try {
  // Check if columns already exist
  const tableInfo = db.pragma("table_info(conversation_sessions)");
  const existingColumns = tableInfo.map((col: any) => col.name);

  console.log("\n📋 Existing columns:", existingColumns.join(", "));

  const columnsToAdd = [
    { name: "input_tokens", sql: "ALTER TABLE conversation_sessions ADD COLUMN input_tokens INTEGER DEFAULT 0" },
    { name: "output_tokens", sql: "ALTER TABLE conversation_sessions ADD COLUMN output_tokens INTEGER DEFAULT 0" },
    { name: "total_cost", sql: "ALTER TABLE conversation_sessions ADD COLUMN total_cost REAL DEFAULT 0" }
  ];

  let addedCount = 0;

  for (const column of columnsToAdd) {
    if (!existingColumns.includes(column.name)) {
      console.log(`\n➕ Adding column: ${column.name}`);
      db.exec(column.sql);
      addedCount++;
      console.log(`✅ Column ${column.name} added successfully`);
    } else {
      console.log(`⏭️  Column ${column.name} already exists, skipping`);
    }
  }

  console.log("\n✨ Migration completed successfully!");
  console.log(`📊 Added ${addedCount} new column${addedCount !== 1 ? 's' : ''}`);

  // Show updated table structure
  const updatedTableInfo = db.pragma("table_info(conversation_sessions)");
  console.log("\n📋 Updated table structure:");
  updatedTableInfo.forEach((col: any) => {
    console.log(`   - ${col.name}: ${col.type}${col.dflt_value ? ` (default: ${col.dflt_value})` : ''}`);
  });

} catch (error) {
  console.error("\n❌ Migration failed:", error);
  process.exit(1);
} finally {
  db.close();
}
