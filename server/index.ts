import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import SqliteStore from "better-sqlite3-session-store";
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { pool } from "./db";
import { logger } from "./utils/logger";

// ES module compatibility for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const databaseUrl = process.env.DATABASE_URL || 'sqlite://local.db';
const isSqlite = databaseUrl.startsWith('sqlite://');

const app = express();

// ==================== CORS CONFIGURATION ====================
const allowedOrigins = [
  'http://localhost:3001',
  'http://localhost:5000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:5000',
  'https://www.vquant.ai',
  'https://vquant.ai',
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400, // 24 hours
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: false, limit: '50mb' }));

// Session configuration
let sessionStore;
if (isSqlite) {
  const SqliteSessionStore = SqliteStore(session);
  sessionStore = new SqliteSessionStore({
    client: pool,
    expired: {
      clear: true,
      intervalMs: 900000 // 15 minutes
    }
  });
} else {
  const PgSession = connectPgSimple(session);
  sessionStore = new PgSession({
    pool: pool as any,
    tableName: "session",
    createTableIfMissing: true,
  });
}

app.use(
  session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || "vibequant-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    },
  })
);

// Serve static files from public directory (for plot images and figures)
app.use('/plots', express.static(path.join(__dirname, '..', 'public', 'plots')));
app.use('/figures', express.static(path.join(__dirname, '..', 'dist', 'public', 'figures')));

// Return proper 404 for missing plot/figure files (prevents Vite catch-all from returning HTML)
app.use('/plots', (_req, res) => res.status(404).send(''));
app.use('/figures', (_req, res) => res.status(404).send(''));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  // Log incoming requests
  if (path.startsWith("/api")) {
    const bodyPreview = req.body ? JSON.stringify(req.body).substring(0, 100) : '';
    log(`\n${'='.repeat(80)}`);
    log(`📥 INCOMING REQUEST: ${req.method} ${path}`);
    log(`   Time: ${new Date().toISOString()}`);
    if (req.body && Object.keys(req.body).length > 0) {
      log(`   Body preview: ${bodyPreview}${bodyPreview.length >= 100 ? '...' : ''}`);
    }
    if (req.query && Object.keys(req.query).length > 0) {
      log(`   Query params: ${JSON.stringify(req.query)}`);
    }
    log(`${'='.repeat(80)}`);
  }

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      log(`\n${'─'.repeat(80)}`);
      log(`📤 RESPONSE: ${req.method} ${path}`);
      log(`   Status: ${res.statusCode}`);
      log(`   Duration: ${duration}ms`);
      if (capturedJsonResponse) {
        const preview = JSON.stringify(capturedJsonResponse).substring(0, 200);
        log(`   Response preview: ${preview}${preview.length >= 200 ? '...' : ''}`);
      }
      log(`${'─'.repeat(80)}\n`);
    }
  });

  next();
});

(async () => {
  logger.banner('SERVER STARTING', 'VibeQuant Financial Intelligence Platform');

  logger.section('Configuration');
  logger.kv('Environment', process.env.NODE_ENV || 'development');
  logger.kv('Database', databaseUrl);
  logger.kv('Database type', isSqlite ? 'SQLite' : 'PostgreSQL');
  logger.kv('Port', process.env.PORT || '5000');

  logger.server('Registering routes...');
  const server = await registerRoutes(app);
  logger.success('Routes registered');

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    logger.error(`Error handler caught: ${status} - ${message}`);
    logger.debug(`Stack: ${err.stack}`);
    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    logger.server('Setting up Vite development server...');
    await setupVite(app, server);
    logger.success('Vite development server ready');
  } else {
    logger.server('Setting up static file serving...');
    serveStatic(app);
    logger.success('Static file serving ready');
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen(port, "0.0.0.0", () => {
    logger.banner('SERVER READY', `Listening on http://0.0.0.0:${port}`);
    logger.success(`Server is now accepting requests on port ${port}`);
  });
})();
