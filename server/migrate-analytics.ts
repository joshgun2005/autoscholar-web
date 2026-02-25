import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'local.db');
const db = new Database(dbPath);

console.log('🔄 Adding analytics tables to database...');

try {
  // Create active_users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS active_users (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL UNIQUE,
      user_id TEXT,
      status TEXT NOT NULL DEFAULT 'idle',
      current_query TEXT,
      last_heartbeat INTEGER NOT NULL,
      user_agent TEXT,
      ip_address TEXT,
      created_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
  console.log('✅ Created active_users table');

  // Create analytics_metrics table
  db.exec(`
    CREATE TABLE IF NOT EXISTS analytics_metrics (
      id TEXT PRIMARY KEY,
      timestamp INTEGER NOT NULL,
      total_requests INTEGER DEFAULT 0,
      successful_requests INTEGER DEFAULT 0,
      failed_requests INTEGER DEFAULT 0,
      active_users INTEGER DEFAULT 0,
      unique_visitors INTEGER DEFAULT 0,
      average_response_time REAL DEFAULT 0,
      peak_response_time REAL DEFAULT 0,
      tokens_generated INTEGER DEFAULT 0,
      estimated_cost REAL DEFAULT 0,
      tool_calls_count INTEGER DEFAULT 0,
      python_executions INTEGER DEFAULT 0,
      search_queries INTEGER DEFAULT 0,
      error_count INTEGER DEFAULT 0,
      error_rate REAL DEFAULT 0,
      period_type TEXT NOT NULL DEFAULT 'minute'
    );
  `);
  console.log('✅ Created analytics_metrics table');

  // Create request_logs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS request_logs (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      user_id TEXT,
      query TEXT NOT NULL,
      response_time REAL,
      input_tokens INTEGER DEFAULT 0,
      output_tokens INTEGER DEFAULT 0,
      total_cost REAL DEFAULT 0,
      tools_called TEXT,
      status TEXT NOT NULL,
      error_message TEXT,
      timestamp INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);
  console.log('✅ Created request_logs table');

  // Create indexes for better performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_active_users_session ON active_users(session_id);
    CREATE INDEX IF NOT EXISTS idx_active_users_heartbeat ON active_users(last_heartbeat);
    CREATE INDEX IF NOT EXISTS idx_analytics_timestamp ON analytics_metrics(timestamp);
    CREATE INDEX IF NOT EXISTS idx_analytics_period ON analytics_metrics(period_type);
    CREATE INDEX IF NOT EXISTS idx_request_logs_timestamp ON request_logs(timestamp);
    CREATE INDEX IF NOT EXISTS idx_request_logs_status ON request_logs(status);
  `);
  console.log('✅ Created indexes');

  console.log('\n🎉 Analytics tables migration completed successfully!');
} catch (error) {
  console.error('❌ Migration failed:', error);
  process.exit(1);
} finally {
  db.close();
}
