# Deployment Guide

## Production Build

```bash
# Build client (Vite) + server (esbuild)
npm run build

# Output:
# dist/public/   → Client assets (HTML, CSS, JS)
# dist/index.js  → Server bundle
```

## Running in Production

```bash
NODE_ENV=production node dist/index.js
```

Or using npm:
```bash
npm start
```

## Environment Variables

### Required

| Variable | Example | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Must be "production" |
| `PORT` | `5000` | Server port |
| `SESSION_SECRET` | `a-strong-64-char-random-string` | Session encryption key (**required in production**, will exit if missing) |
| `ANTHROPIC_API_KEY` | `sk-ant-api03-...` | Claude AI API key |
| `FMP_API_KEY` | `oCml7...` | Financial Modeling Prep key |

### Database

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `sqlite://local.db` | Database connection string |

**SQLite** (single-file, zero config):
```bash
DATABASE_URL=sqlite://local.db
```

**PostgreSQL** (recommended for production):
```bash
DATABASE_URL=postgresql://user:password@host:5432/vibequant
```

**Neon Serverless** (cloud PostgreSQL):
```bash
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/vibequant?sslmode=require
```

### Optional API Keys

| Variable | Description |
|----------|-------------|
| `FIRECRAWL_API_KEY` | Web/PDF extraction |
| `TAVILY_API_KEY` | AI-powered search |
| `EXA_API_KEY` | Semantic search |
| `SERPAPI_API_KEY` | Google search |
| `ELEVENLABS_API_KEY` | Speech-to-text |

## CORS Configuration

The server allows these origins by default:

```
http://localhost:3001
http://localhost:5000
http://127.0.0.1:3001
http://127.0.0.1:5000
https://www.vquant.ai
https://vquant.ai
```

To add custom origins, edit `server/index.ts`.

## Security Checklist

- [ ] Set a strong `SESSION_SECRET` (at least 64 characters)
- [ ] Never commit `.env` (it's in `.gitignore`)
- [ ] Use HTTPS in production (secure cookies are enforced)
- [ ] Set up a reverse proxy (nginx/Caddy) for TLS termination
- [ ] Review CORS origins for your domain
- [ ] Consider rate limiting on `/api/chat` and `/api/analytics/heartbeat`
- [ ] Database backups if using PostgreSQL

## Docker (Example)

```dockerfile
FROM node:20-slim

WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps --production
COPY dist/ ./dist/

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000
CMD ["node", "dist/index.js"]
```

```bash
docker build -t vibequant .
docker run -p 5000:5000 --env-file .env vibequant
```

## Health Check

The server logs a banner on startup:
```
══════════ SERVER READY ══════════
Listening on http://0.0.0.0:5000
```

You can verify with:
```bash
curl http://localhost:5000/api/auth/me
# Should return: {"user":null}
```
