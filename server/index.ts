import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import SqliteStore from "better-sqlite3-session-store";
import path from 'path';
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { pool, isSqlite } from "./db";
import { logger } from "./utils/logger";

const app = express();

// ─── CORS ─────────────────────────────────────────────────
const port = parseInt(process.env.PORT || '5000', 10);
const allowedOrigins = [
  `http://localhost:${port}`,
  `http://127.0.0.1:${port}`,
  'http://localhost:3001',
  'http://localhost:5000',
  'http://127.0.0.1:3001',
  'http://127.0.0.1:5000',
  'https://www.vquant.ai',
  'https://vquant.ai',
];

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// ─── Session ──────────────────────────────────────────────
let sessionStore: session.Store;
if (isSqlite) {
  const SqliteSessionStore = SqliteStore(session);
  sessionStore = new SqliteSessionStore({
    client: pool,
    expired: { clear: true, intervalMs: 900_000 },
  });
} else {
  const PgSession = connectPgSimple(session);
  sessionStore = new PgSession({
    pool: pool as unknown as connectPgSimple.PGStoreOptions["pool"],
    tableName: "session",
    createTableIfMissing: true,
  });
}

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret && process.env.NODE_ENV === "production") {
  logger.error("SESSION_SECRET is required in production!");
  process.exit(1);
}

app.use(
  session({
    store: sessionStore,
    secret: sessionSecret || "dev-only-secret-do-not-use-in-prod",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    },
  }),
);

// ─── Static files for generated assets ────────────────────
const rootDir = path.resolve(import.meta.dirname, '..');
app.use('/plots', express.static(path.join(rootDir, 'public', 'plots')));
app.use('/figures', express.static(path.join(rootDir, 'dist', 'public', 'figures')));
app.use('/plots', (_req, res) => res.status(404).send(''));
app.use('/figures', (_req, res) => res.status(404).send(''));

// ─── Request logging middleware ───────────────────────────
app.use((req, res, next) => {
  const start = Date.now();
  const reqPath = req.path;

  if (reqPath.startsWith("/api")) {
    logger.info(`${req.method} ${reqPath}`);
  }

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (reqPath.startsWith("/api")) {
      log(`${req.method} ${reqPath} ${res.statusCode} ${duration}ms`);
    }
  });

  next();
});

// ─── Bootstrap ────────────────────────────────────────────
(async () => {
  logger.banner('SERVER STARTING', 'VibeQuant Financial Intelligence Platform');

  logger.section('Configuration');
  logger.kv('Environment', process.env.NODE_ENV || 'development');
  logger.kv('Database type', isSqlite ? 'SQLite' : 'PostgreSQL');
  logger.kv('Port', process.env.PORT || '5000');

  logger.server('Registering routes...');
  const server = await registerRoutes(app);
  logger.success('Routes registered');

  // Global error handler
  app.use((err: Error & { status?: number; statusCode?: number }, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    logger.error(`${status} - ${message}`);
    if (!res.headersSent) {
      res.status(status).json({ message });
    }
  });

  if (app.get("env") === "development") {
    logger.server('Setting up Vite development server...');
    await setupVite(app, server);
    logger.success('Vite development server ready');
  } else {
    serveStatic(app);
    logger.success('Static file serving ready');
  }

  server.listen(port, "0.0.0.0", () => {
    logger.banner('SERVER READY', `Listening on http://0.0.0.0:${port}`);
  });
})();
