import type { ClaudeToolDefinition } from './types';

export const POLYMARKET_TOOLS: ClaudeToolDefinition[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // POLYMARKET API — Prediction Markets (events, markets, prices, order books)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'get_polymarket_events',
    description: 'Gets Polymarket prediction market events. Events group related markets (e.g., "2024 US Presidential Election"). Returns title, description, volume, liquidity, and nested markets with outcome prices. No API key needed.',
    input_schema: {
      type: 'object',
      properties: {
        active: {
          type: 'boolean',
          description: 'Filter active events only (default: true)',
        },
        closed: {
          type: 'boolean',
          description: 'Filter closed events only',
        },
        tag_slug: {
          type: 'string',
          description: 'Filter by tag slug (e.g., "politics", "sports", "finance", "crypto")',
        },
        order: {
          type: 'string',
          description: 'Sort field (e.g., "volume_24hr", "startDate", "volume", "liquidity")',
        },
        ascending: {
          type: 'boolean',
          description: 'Sort ascending (default: false = descending)',
        },
        limit: {
          type: 'number',
          description: 'Max results (default: 100)',
        },
        offset: {
          type: 'number',
          description: 'Pagination offset',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_polymarket_markets',
    description: 'Gets Polymarket individual prediction markets. Each market is a question with binary or multi-choice outcomes and real-time prices reflecting implied probabilities. Returns question, outcomes, outcomePrices, volume, liquidity, token IDs.',
    input_schema: {
      type: 'object',
      properties: {
        active: {
          type: 'boolean',
          description: 'Filter active markets only',
        },
        closed: {
          type: 'boolean',
          description: 'Filter closed markets only',
        },
        tag_id: {
          type: 'number',
          description: 'Filter by tag ID',
        },
        order: {
          type: 'string',
          description: 'Sort field',
        },
        limit: {
          type: 'number',
          description: 'Max results (default: 100)',
        },
        offset: {
          type: 'number',
          description: 'Pagination offset',
        },
        id: {
          type: 'string',
          description: 'Specific market conditionId',
        },
        slug: {
          type: 'string',
          description: 'Market slug',
        },
      },
      required: [],
    },
  },
  {
    name: 'search_polymarket',
    description: 'Searches Polymarket for events, markets, and profiles by keyword. Use this to find prediction markets on any topic.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query (e.g., "bitcoin price", "election", "fed rate", "AI")',
        },
        limit: {
          type: 'number',
          description: 'Max results',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_polymarket_price_history',
    description: 'Gets historical price data for a Polymarket token. Prices represent implied probabilities (0-1). Useful for charting prediction market sentiment over time.',
    input_schema: {
      type: 'object',
      properties: {
        token_id: {
          type: 'string',
          description: 'The token ID (found in market data under tokens[].token_id)',
        },
        interval: {
          type: 'string',
          description: 'Relative time interval: "1m", "1h", "6h", "1d", "1w", "1M". Exclusive with startTs/endTs.',
        },
        start_ts: {
          type: 'number',
          description: 'Unix timestamp start (exclusive with interval)',
        },
        end_ts: {
          type: 'number',
          description: 'Unix timestamp end (exclusive with interval)',
        },
        fidelity: {
          type: 'number',
          description: 'Resolution in minutes between data points',
        },
      },
      required: ['token_id'],
    },
  },
  {
    name: 'get_polymarket_order_book',
    description: 'Gets the full order book (bids and asks) for a Polymarket token. Shows market depth and liquidity at each price level.',
    input_schema: {
      type: 'object',
      properties: {
        token_id: {
          type: 'string',
          description: 'The token ID',
        },
      },
      required: ['token_id'],
    },
  },
  {
    name: 'get_polymarket_tags',
    description: 'Gets all available Polymarket tags/categories (politics, sports, finance, crypto, etc.).',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_polymarket_trades',
    description: 'Gets recent trades on Polymarket, optionally filtered by market or user. Shows trade side, size, price, timestamp.',
    input_schema: {
      type: 'object',
      properties: {
        market: {
          type: 'string',
          description: 'Market conditionId to filter trades',
        },
        user: {
          type: 'string',
          description: 'User wallet address to filter trades',
        },
        limit: {
          type: 'number',
          description: 'Max results (default: 100, max: 500)',
        },
        offset: {
          type: 'number',
          description: 'Pagination offset',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_polymarket_leaderboard',
    description: 'Gets the Polymarket trader leaderboard showing top traders by volume and profit.',
    input_schema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Max results',
        },
        offset: {
          type: 'number',
          description: 'Pagination offset',
        },
      },
      required: [],
    },
  },
];
