# API Reference

Complete reference for all VibeQuant API endpoints.

Base URL: `http://localhost:5000` (development) or `https://www.vquant.ai` (production)

---

## Chat (SSE Streaming)

### `POST /api/chat`

Main AI chat endpoint with real-time streaming via Server-Sent Events.

**Request Body** (validated with Zod):

```json
{
  "query": "Analyze AAPL stock",              // required, 1-10000 chars
  "history": [                                 // optional, default []
    { "question": "Previous Q", "answer": "Previous A" }
  ],
  "sessionId": "uuid-string",                 // optional, auto-generated
  "imageData": "base64-encoded-image",         // optional
  "imageMimeType": "image/png"                 // optional
}
```

**Response**: SSE stream with events:

| Event Type | Payload | Description |
|------------|---------|-------------|
| `text` | `{ content: string }` | Incremental answer token |
| `sources` | `{ sources: SearchResult[] }` | Web search results |
| `status` | `{ message: string }` | Status update |
| `search_queries` | `{ queries: string[], message: string }` | Search queries planned |
| `search_progress` | `{ index, total, query }` | Search execution progress |
| `search_result` | `{ index, results }` | Individual search result |
| `tool_start` | `{ tool: string, input: object }` | Tool execution started |
| `tool_complete` | `{ tool: string, duration: number }` | Tool execution completed |
| `tool_error` | `{ tool: string, error: string }` | Tool execution failed |
| `tool_result` | `{ tool: string, result: object }` | Tool result data |
| `python_code` | `{ code: string }` | Python code executed |
| `custom_python_figures` | `{ figureId, figures[], figureUrls[], output, description }` | Generated charts |
| `done` | `{ sessionId: string }` | Stream complete |
| `error` | `{ error: string }` | Fatal error |

### `POST /api/speech-to-text`

Transcribe audio to text using ElevenLabs Scribe v2.

**Request**: `multipart/form-data` with `audio` file field (max 25MB)

**Response**:
```json
{
  "text": "transcribed text content"
}
```

---

## Authentication

### `POST /api/auth/register`

Create a new user account.

**Request Body**:
```json
{
  "name": "Alice"   // min 2 characters
}
```

**Response** `200`:
```json
{
  "user": { "id": "uuid", "displayName": "Alice" },
  "token": "vquant-abc1234"
}
```

### `POST /api/auth/login`

Authenticate with token.

**Request Body**:
```json
{
  "token": "vquant-abc1234"
}
```

**Response** `200`:
```json
{
  "user": { "id": "uuid", "displayName": "Alice" }
}
```

**Response** `401`:
```json
{ "error": "Token invalide" }
```

### `POST /api/auth/logout`

End the current session.

**Response** `200`:
```json
{ "success": true }
```

### `GET /api/auth/me`

Get current authenticated user.

**Response** `200`:
```json
{
  "user": { "id": "uuid", "displayName": "Alice" }
}
// or
{
  "user": null
}
```

---

## Shared Reports

### `GET /api/shared-reports`

List all shared reports (for showcase/explore page).

**Response** `200`: Array of reports with truncated answers (500 chars).

### `POST /api/share`

Create a shareable report.

**Request Body**:
```json
{
  "question": "Analyze AAPL",
  "answer": "Apple Inc is...",
  "toolResults": [...],             // optional
  "sources": [...],                 // optional
  "customPythonFigures": [...]      // optional
}
```

**Response** `200`:
```json
{ "shareId": "a1b2c3d4" }
```

### `GET /api/share/:shareId`

Get a shared report by its ID.

**Response** `200`:
```json
{
  "question": "...",
  "answer": "...",
  "toolResults": [],
  "sources": [],
  "customPythonFigures": null,
  "createdAt": "2026-02-25T..."
}
```

---

## Sessions

### `GET /api/sessions`

List all conversation sessions for the current user.

**Response** `200`: Array of `{ sessionId, title, createdAt, updatedAt }`.

### `GET /api/sessions/:sessionId`

Get a specific session with full message history.

**Response** `200`:
```json
{
  "sessionId": "...",
  "title": "...",
  "messages": "[{\"question\":\"...\",\"answer\":\"...\"}]",
  "createdAt": "...",
  "updatedAt": "..."
}
```

---

## Document Generation

### `POST /api/generate-pdf`

Generate a PDF report from markdown.

**Request Body**: `{ "question": "...", "answer": "..." }`

**Response**: Binary PDF file (`application/pdf`).

### `POST /api/generate-docx`

Generate a DOCX document from markdown.

**Request Body**: `{ "question": "...", "answer": "..." }`

**Response**: Binary DOCX file.

### `POST /api/convert-to-slides`

Generate a Beamer LaTeX PDF presentation.

**Request Body**:
```json
{
  "question": "...",
  "answer": "...",
  "author": "Simon-Pierre Boucher",
  "company": "VibeQuant",              // optional, default "VibeQuant"
  "figureUrls": ["url1", "url2"]       // optional
}
```

**Response**: Binary PDF file.

### `GET /api/download/:filename`

Download a generated data file (CSV, XLSX, JSON, TXT).

**Security**: Only alphanumeric characters, dots, underscores, and hyphens allowed in filename.

---

## Financial Data (FMP)

All FMP endpoints are `GET` requests. Symbol is passed as a URL parameter.

### Market Overview

| Endpoint | Description |
|----------|-------------|
| `GET /api/fmp/market-hours` | Current market hours |
| `GET /api/fmp/gainers` | Top gaining stocks |
| `GET /api/fmp/losers` | Top losing stocks |
| `GET /api/fmp/actives` | Most active stocks |

### Quotes & Prices

| Endpoint | Query Params | Description |
|----------|-------------|-------------|
| `GET /api/fmp/quote/:symbol` | | Real-time quote |
| `GET /api/fmp/stock-quote/:symbol` | | Stock quote (alias) |
| `GET /api/fmp/company-profile/:symbol` | | Full company profile |
| `GET /api/fmp/historical-price/:symbol` | | Historical daily prices |
| `GET /api/fmp/intraday/:symbol` | `interval=5min` | Intraday prices |

### Financial Statements

| Endpoint | Query Params | Description |
|----------|-------------|-------------|
| `GET /api/fmp/income-statement/:symbol` | `period=annual\|quarter`, `limit=5` | Income statement |
| `GET /api/fmp/balance-sheet/:symbol` | `period`, `limit` | Balance sheet |
| `GET /api/fmp/cash-flow/:symbol` | `period`, `limit` | Cash flow statement |
| `GET /api/fmp/key-metrics/:symbol` | `period`, `limit` | Key financial metrics |
| `GET /api/fmp/financial-ratios/:symbol` | `period`, `limit` | Financial ratios |

### Analysis

| Endpoint | Description |
|----------|-------------|
| `GET /api/fmp/analyst-estimates/:symbol` | Analyst estimates |
| `GET /api/fmp/price-target/:symbol` | Price targets |
| `GET /api/fmp/price-target-summary/:symbol` | Price target summary |
| `GET /api/fmp/upgrades-downgrades/:symbol` | Analyst upgrades/downgrades |
| `GET /api/fmp/earnings-surprises/:symbol` | Earnings surprises |
| `GET /api/fmp/esg-score/:symbol` | ESG score |

### Other Data

| Endpoint | Description |
|----------|-------------|
| `GET /api/fmp/dividend-history/:symbol` | Dividend history |
| `GET /api/fmp/institutional-holders/:symbol` | Top institutional holders |
| `GET /api/fmp/financial-news/:symbol` | Recent financial news |
| `GET /api/fmp/insider-trading/:symbol` | Insider trades |

### Chart Data

| Endpoint | Query Params | Description |
|----------|-------------|-------------|
| `GET /api/fmp/chart/light/:symbol` | `from`, `to` | Lightweight OHLCV |
| `GET /api/fmp/chart/full/:symbol` | `from`, `to` | Full OHLCV + indicators |
| `GET /api/fmp/chart/intraday/:symbol` | `interval`, `from`, `to`, `nonadjusted` | Intraday OHLCV |

---

## Analytics

### `POST /api/analytics/heartbeat`

Update user activity tracking.

**Request Body**:
```json
{
  "sessionId": "browser-session-id",
  "status": "idle|generating|error",
  "currentQuery": "Current question...",
  "userId": "user-id-if-logged-in"
}
```

### `GET /api/analytics/real-time-stats`

Public endpoint for real-time platform statistics.

**Response** `200`:
```json
{
  "activeUsers": { "total": 5, "generating": 2 },
  "sessions": { "total": 150, "today": 12 },
  "tokens": { "total": 5000000, "input": 3000000, "output": 2000000 },
  "cost": { "total": 45.50, "today": 3.20 },
  "errors": { "lastHour": 1, "rate": 0.5 }
}
```

### `GET /api/analytics/active-users` (admin)

Detailed active user list with status and queries.

### `GET /api/analytics/metrics` (admin)

Historical metrics with time range filtering.

**Query Params**: `periodType=minute|hour|day`, `limit=60`

---

## Admin

All admin endpoints require the `requireAdmin` middleware.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/admin/login` | Set admin session |
| `GET` | `/api/admin/database` | Full database dump with metrics |
| `DELETE` | `/api/admin/users/:id` | Delete user + their sessions |
| `DELETE` | `/api/admin/sessions/:id` | Delete conversation session |
| `DELETE` | `/api/admin/reports/:id` | Delete shared report |
