# Database Schema

VibeQuant supports both SQLite (development) and PostgreSQL (production) via Drizzle ORM. Both schemas are kept in parity.

## Configuration

```bash
# SQLite (default for development)
DATABASE_URL=sqlite://local.db

# PostgreSQL (production)
DATABASE_URL=postgresql://user:pass@host:5432/dbname
```

## Tables

### `users`

User accounts with token-based authentication.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | text | PK, UUID | Unique user ID |
| `displayName` | text | NOT NULL | Display name |
| `token` | text | NOT NULL, UNIQUE | Authentication token (vquant-XXXXXXX) |
| `createdAt` | timestamp | NOT NULL | Account creation date |

### `messages`

Individual chat messages (user and assistant).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | text | PK, UUID | Message ID |
| `sessionId` | text | NOT NULL | Session this message belongs to |
| `role` | text | NOT NULL | "user" or "assistant" |
| `content` | text | NOT NULL | Message content |
| `sources` | text | | JSON string of source URLs |
| `createdAt` | timestamp | NOT NULL | Message timestamp |

### `conversationSessions`

Complete conversation sessions with token tracking.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | text | PK, UUID | Session record ID |
| `sessionId` | text | NOT NULL, UNIQUE | Session identifier |
| `userId` | text | FK -> users.id | Owner (null for anonymous) |
| `title` | text | NOT NULL | First question or custom title |
| `messages` | text | NOT NULL | JSON array of {question, answer, toolResults, sources} |
| `inputTokens` | integer | DEFAULT 0 | Total input tokens consumed |
| `outputTokens` | integer | DEFAULT 0 | Total output tokens consumed |
| `totalCost` | real | DEFAULT 0 | Estimated cost in USD |
| `createdAt` | timestamp | NOT NULL | Session creation |
| `updatedAt` | timestamp | NOT NULL | Last activity |

### `sharedReports`

Shareable analysis reports with unique URLs.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | text | PK, UUID | Report record ID |
| `shareId` | text | NOT NULL, UNIQUE | Short URL ID (8 chars) |
| `question` | text | NOT NULL | Original question |
| `answer` | text | NOT NULL | Full answer |
| `toolResults` | text | | JSON string of tool results |
| `sources` | text | | JSON string of search results |
| `customPythonFigures` | text | | JSON string of figure data |
| `createdAt` | timestamp | NOT NULL | Report creation |

### `activeUsers`

Real-time user activity tracking.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | text | PK, UUID | Record ID |
| `sessionId` | text | NOT NULL, UNIQUE | Browser session ID |
| `userId` | text | FK -> users.id | Logged-in user (or null) |
| `status` | text | NOT NULL, DEFAULT "idle" | idle / generating / error |
| `currentQuery` | text | | Query being processed |
| `lastHeartbeat` | timestamp | NOT NULL | Last activity ping |
| `userAgent` | text | | Browser user agent |
| `ipAddress` | text | | Client IP address |
| `createdAt` | timestamp | NOT NULL | First seen |

### `analyticsMetrics`

Aggregated platform metrics over time.

| Column | Type | Default | Description |
|--------|------|---------|-------------|
| `id` | text | PK | Record ID |
| `timestamp` | timestamp | | Metric timestamp |
| `totalRequests` | integer | 0 | Total API requests |
| `successfulRequests` | integer | 0 | Successful requests |
| `failedRequests` | integer | 0 | Failed requests |
| `activeUsers` | integer | 0 | Active user count |
| `uniqueVisitors` | integer | 0 | Unique visitors |
| `averageResponseTime` | real | 0 | Avg response time (ms) |
| `peakResponseTime` | real | 0 | Peak response time (ms) |
| `tokensGenerated` | integer | 0 | Tokens generated |
| `estimatedCost` | real | 0 | Estimated cost (USD) |
| `toolCallsCount` | integer | 0 | Tool calls made |
| `pythonExecutions` | integer | 0 | Python scripts run |
| `searchQueries` | integer | 0 | Web searches performed |
| `errorCount` | integer | 0 | Errors occurred |
| `errorRate` | real | 0 | Error rate (%) |
| `periodType` | text | "minute" | minute / hour / day |

### `requestLogs`

Detailed per-request logging.

| Column | Type | Description |
|--------|------|-------------|
| `id` | text | Record ID |
| `sessionId` | text | Browser session |
| `userId` | text | User (FK) |
| `query` | text | User query |
| `responseTime` | real | Response time (ms) |
| `inputTokens` | integer | Input tokens |
| `outputTokens` | integer | Output tokens |
| `totalCost` | real | Request cost (USD) |
| `toolsCalled` | text | JSON array of tool names |
| `status` | text | success / error / timeout |
| `errorMessage` | text | Error details |
| `timestamp` | timestamp | Request timestamp |

### `crawledPages`

Cached web content from Firecrawl/Tavily.

| Column | Type | Description |
|--------|------|-------------|
| `id` | text | Record ID |
| `url` | text | Page URL (UNIQUE) |
| `title` | text | Page title |
| `content` | text | Full page content |
| `snippet` | text | Short excerpt |
| `favicon` | text | Favicon URL |
| `crawledAt` | timestamp | Crawl timestamp |

### `embeddings`

Vector embeddings for semantic search (PostgreSQL only).

| Column | Type | Description |
|--------|------|-------------|
| `id` | text | Record ID |
| `pageId` | text | FK -> crawledPages.id |
| `embedding` | vector(3072) / text | Embedding vector |
| `tokenCount` | integer | Token count |
| `createdAt` | timestamp | Creation timestamp |
