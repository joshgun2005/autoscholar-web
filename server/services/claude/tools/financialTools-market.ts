import type { ClaudeToolDefinition } from './types';

/** Financial tools part 2: Market data (ETF, SEC, news, screening, indices, sector) */
export const FINANCIAL_TOOLS_PART2: ClaudeToolDefinition[] = [
  {
    name: 'get_stock_news_sentiment',
    description: 'Gets news articles with AI-generated sentiment scores (bullish/bearish).',
    input_schema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Stock ticker symbol',
        },
        limit: {
          type: 'number',
          description: 'Number of articles (default: 5, max: 5 to avoid context overflow)',
        },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'get_crypto_quote',
    description: 'Gets real-time cryptocurrency price quotes. Supports major cryptocurrencies.',
    input_schema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Crypto symbol (e.g., "BTCUSD", "ETHUSD", "SOLUSD")',
        },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'get_crypto_list',
    description: 'Gets list of all available cryptocurrencies that can be queried.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_forex_historical',
    description: 'Gets historical forex price data for currency pairs.',
    input_schema: {
      type: 'object',
      properties: {
        pair: {
          type: 'string',
          description: 'Currency pair (e.g., "EURUSD", "GBPUSD")',
        },
        from: {
          type: 'string',
          description: 'Start date in YYYY-MM-DD format (optional)',
        },
        to: {
          type: 'string',
          description: 'End date in YYYY-MM-DD format (optional)',
        },
      },
      required: ['pair'],
    },
  },
  {
    name: 'get_sec_filings',
    description: 'Gets SEC filings (10-K, 10-Q, 8-K, etc.) for a company with filing links and dates.',
    input_schema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Stock ticker symbol',
        },
        type: {
          type: 'string',
          description: 'Filing type filter (e.g., "10-K", "10-Q", "8-K") - optional',
        },
        limit: {
          type: 'number',
          description: 'Number of filings (default: 20, max: 20 to avoid context overflow)',
        },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'get_company_notes',
    description: 'Gets company notes and debt obligations with details on issued bonds and notes.',
    input_schema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Stock ticker symbol',
        },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'get_earnings_call_transcript',
    description: 'Gets earnings call transcript text and Q&A for a specific quarter.',
    input_schema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Stock ticker symbol',
        },
        year: {
          type: 'number',
          description: 'Year (e.g., 2024)',
        },
        quarter: {
          type: 'number',
          description: 'Quarter (1, 2, 3, or 4)',
        },
      },
      required: ['symbol', 'year', 'quarter'],
    },
  },
  {
    name: 'get_option_chain',
    description: 'Gets the complete option chain for a stock symbol, returning all available option contracts (both calls and puts) with their identifiers, strikes, and expiration dates. This is the starting point for options analysis - use this first to find available contracts, then use get_option_prices or get_option_greeks for detailed information on specific contracts.',
    input_schema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Stock ticker symbol (e.g., "AAPL", "MSFT", "TSLA"). The option chain will show all available option contracts for this underlying stock.',
        },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'get_option_prices',
    description: 'Gets detailed pricing information for a specific option contract including last price, bid/ask spread, volume, open interest, implied volatility, intrinsic value, and time value. Use this after getting the option chain to analyze specific contracts. The identifier is obtained from get_option_chain results.',
    input_schema: {
      type: 'object',
      properties: {
        identifier: {
          type: 'string',
          description: 'Option contract identifier from the option chain (e.g., "MSFT250417C00400000"). Format: SYMBOL + YYMMDD (expiration) + C/P (call/put) + Strike price * 1000 padded to 8 digits. Example: MSFT250417C00400000 = MSFT call expiring April 17, 2025 with $400 strike.',
        },
      },
      required: ['identifier'],
    },
  },
  {
    name: 'get_option_greeks',
    description: 'Gets option Greeks (Delta, Gamma, Theta, Vega, Rho) for a specific option contract. Greeks measure different dimensions of risk and price sensitivity in options trading. Delta: price sensitivity to underlying, Gamma: delta sensitivity, Theta: time decay, Vega: volatility sensitivity, Rho: interest rate sensitivity. Essential for options risk management and hedging strategies.',
    input_schema: {
      type: 'object',
      properties: {
        identifier: {
          type: 'string',
          description: 'Option contract identifier from the option chain (e.g., "MSFT250417C00400000"). Same format as get_option_prices.',
        },
      },
      required: ['identifier'],
    },
  },
  {
    name: 'download_fmp_data',
    description: 'Downloads financial data from FMP API and exports it to a file in the specified format (CSV, XLSX, JSON, or TXT). This tool allows users to obtain complete datasets from any available FMP data type and provides a download link. Use this when users want to export data for their own analysis, save data locally, or work with data in Excel/spreadsheet applications. Available data types include: company_profile, income_statement, balance_sheet, cash_flow, key_metrics, financial_ratios, financial_growth, stock_quote, historical_price, intraday_price, technical indicators (rsi, macd, ema, sma, adx, williams_r, cci, stochastic), financial_news, earnings_calendar, earnings_surprises, analyst_estimates, price_target, upgrades_downgrades, dividend_history, stock_splits, insider_trading, institutional_holders, congressional_trading, esg_score, treasury_rates, economic_calendar, forex_quote, commodity_quotes, and more.',
    input_schema: {
      type: 'object',
      properties: {
        data_type: {
          type: 'string',
          description: 'Type of data to download. Examples: "company_profile", "income_statement", "balance_sheet", "cash_flow", "key_metrics", "financial_ratios", "financial_growth", "stock_quote", "historical_price", "intraday_price", "rsi", "macd", "ema", "sma", "adx", "williams_r", "cci", "stochastic", "financial_news", "earnings_calendar", "earnings_surprises", "analyst_estimates", "price_target", "upgrades_downgrades", "dividend_history", "stock_splits", "insider_trading", "institutional_holders", "congressional_trading", "esg_score", "treasury_rates", "economic_calendar", "forex_quote", "commodity_quotes"',
        },
        symbol: {
          type: 'string',
          description: 'Stock ticker symbol (required for most data types, e.g., "AAPL", "MSFT", "TSLA")',
        },
        format: {
          type: 'string',
          description: 'Output file format: "csv" (Comma-Separated Values - best for Excel and data analysis), "xlsx" (Excel format), "json" (JSON format - best for programmatic access), or "txt" (Plain text table format)',
          enum: ['csv', 'xlsx', 'json', 'txt']
        },
        period: {
          type: 'string',
          description: 'Period type for financial statements: "annual" or "quarter". Default: "annual"',
          enum: ['annual', 'quarter']
        },
        limit: {
          type: 'number',
          description: 'Number of records to retrieve. Default: 10',
        },
        from_date: {
          type: 'string',
          description: 'Start date for historical data in YYYY-MM-DD format (e.g., "2023-01-01")',
        },
        to_date: {
          type: 'string',
          description: 'End date for historical data in YYYY-MM-DD format (e.g., "2024-01-01")',
        },
        indicator_period: {
          type: 'number',
          description: 'Period for technical indicators (e.g., 14 for RSI, 50 for moving averages)',
        },
        time_period: {
          type: 'string',
          description: 'Time period for technical indicators: "daily", "weekly", or "monthly". Default: "daily"',
        },
        interval: {
          type: 'string',
          description: 'Interval for intraday data: "1min", "5min", "15min", "30min", "1hour", "4hour". Default: "15min"',
        },
        news_limit: {
          type: 'number',
          description: 'Number of news articles to retrieve. Default: 20',
        },
        pair: {
          type: 'string',
          description: 'Forex pair for forex data (e.g., "EURUSD", "GBPUSD")',
        },
      },
      required: ['data_type', 'format'],
    },
  },
  // ==================== EODHD API TOOLS ====================
  {
    name: 'get_eodhd_eod',
    description: 'Fetches end-of-day (daily/weekly/monthly) historical OHLCV prices from EODHD. PREFERRED over get_historical_price (FMP) for daily time-series because EODHD covers US stocks from their IPO date (e.g. Ford from 1972, Apple from 1980) and non-US stocks from Jan 2000, while FMP is limited to ~5 years. Returns: date, open, high, low, close, adjusted_close (split+dividend adjusted), volume. Use this for any request involving long historical price series, backtesting, Monte Carlo simulations, multi-year trend analysis, or comparisons over more than 2 years. Ticker is auto-normalized: "AAPL" becomes "AAPL.US".',
    input_schema: {
      type: 'object',
      properties: {
        ticker: {
          type: 'string',
          description: 'Stock ticker — auto-normalized to EODHD format. US stocks: just "AAPL" or "AAPL.US". Non-US: "VOD.LSE", "SAP.XETRA".',
        },
        from_date: {
          type: 'string',
          description: 'Start date in YYYY-MM-DD format. Optional — omit for maximum historical depth (back to IPO for US stocks).',
        },
        to_date: {
          type: 'string',
          description: 'End date in YYYY-MM-DD format. Optional — defaults to today.',
        },
        period: {
          type: 'string',
          enum: ['d', 'w', 'm'],
          description: 'Price period: "d" for daily (default), "w" for weekly, "m" for monthly.',
        },
      },
      required: ['ticker'],
    },
  },
  {
    name: 'get_eodhd_intraday',
    description: 'Fetches intraday OHLCV price bars from EODHD API. Covers US and global exchanges with pre-market and after-hours data. Available intervals: 1m (1-minute, US since 2004), 5m (5-minute), 1h (1-hour). Ticker is auto-normalized: "AAPL" becomes "AAPL.US". The from/to params accept YYYY-MM-DD dates (converted to Unix timestamps internally). Prefer this over FMP for intraday when higher granularity or premarket/afterhours coverage is needed.',
    input_schema: {
      type: 'object',
      properties: {
        ticker: {
          type: 'string',
          description: 'Stock ticker — auto-normalized to EODHD format. US stocks: just "AAPL" or "AAPL.US". Non-US: "VOD.LSE", "SAP.XETRA".',
        },
        interval: {
          type: 'string',
          enum: ['1m', '5m', '1h'],
          description: 'Bar interval: "1m" (1-minute), "5m" (5-minute, default), "1h" (1-hour).',
        },
        from_date: {
          type: 'string',
          description: 'Start date in YYYY-MM-DD format.',
        },
        to_date: {
          type: 'string',
          description: 'End date in YYYY-MM-DD format.',
        },
      },
      required: ['ticker'],
    },
  },
  {
    name: 'get_eodhd_options',
    description: 'Fetches the US options chain with end-of-day Greeks and market data from EODHD. Covers 6,000+ top-traded US stocks. Returns data organized by expiration date with CALL and PUT contracts. Each contract includes: contractName, contractSize, type (Call/Put), strike, expirationDate, lastTradeDateTime, lastTradePrice, bid, ask, volume, openInterest, impliedVolatility (may be null for illiquid contracts), delta, gamma, theta, vega (may be null). Ticker is auto-normalized: "AAPL" becomes "AAPL.US".',
    input_schema: {
      type: 'object',
      properties: {
        ticker: {
          type: 'string',
          description: 'US stock ticker — auto-normalized. Just "AAPL" or "AAPL.US" both work.',
        },
        from_date: {
          type: 'string',
          description: 'Start trade date filter (YYYY-MM-DD).',
        },
        to_date: {
          type: 'string',
          description: 'End trade date filter (YYYY-MM-DD).',
        },
        expiration_date_from: {
          type: 'string',
          description: 'Filter contracts expiring on or after this date (YYYY-MM-DD).',
        },
        expiration_date_to: {
          type: 'string',
          description: 'Filter contracts expiring on or before this date (YYYY-MM-DD).',
        },
        contract_name: {
          type: 'string',
          description: 'Fetch a single specific contract by its OCC name, e.g. "AAPL230616C00150000".',
        },
      },
      required: ['ticker'],
    },
  },
  // ==================== NEW SEARCH & DISCOVERY TOOLS ====================
  {
    name: 'search_symbol',
    description: 'Search for stock ticker symbols across multiple exchanges using FMP Stock Symbol Search API.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Symbol to search for (e.g., "AAPL", "MSFT")',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'search_name',
    description: 'Search for companies by name to find their ticker symbols. Useful when you know the company name but not the symbol.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Company name to search for (e.g., "Apple", "Microsoft")',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'search_exchange_variants',
    description: 'Find all exchanges where a stock symbol is listed (e.g., Apple on NASDAQ, European exchanges, etc.).',
    input_schema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Stock ticker symbol',
        },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'get_stock_list',
    description: 'Get comprehensive list of all available stocks across all exchanges.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_financial_statement_symbol_list',
    description: 'Get list of companies with available financial statements.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_cik_list',
    description: 'Get list of SEC CIK (Central Index Key) numbers for all registered entities.',
    input_schema: {
      type: 'object',
      properties: {
        page: {
          type: 'number',
          description: 'Page number for pagination (default: 0)',
        },
        limit: {
          type: 'number',
          description: 'Number of results per page (default: 1000)',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_symbol_change',
    description: 'Track stock symbol changes due to mergers, acquisitions, or rebranding.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_etf_list',
    description: 'Get complete list of all Exchange Traded Funds (ETFs).',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_actively_trading_list',
    description: 'Get list of all actively trading companies and instruments.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_earnings_transcript_list',
    description: 'Get list of companies with available earnings call transcripts.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_available_exchanges',
    description: 'Get list of all supported stock exchanges worldwide.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_available_sectors',
    description: 'Get list of all industry sectors for stock categorization.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_available_industries',
    description: 'Get list of all industries where stock symbols are available.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_available_countries',
    description: 'Get list of all countries where stock symbols are available.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  // ==================== ADVANCED COMPANY DATA TOOLS ====================
  {
    name: 'get_profile_by_cik',
    description: 'Get company profile using SEC CIK (Central Index Key) number instead of ticker symbol.',
    input_schema: {
      type: 'object',
      properties: {
        cik: {
          type: 'string',
          description: 'SEC CIK number (e.g., "320193" for Apple)',
        },
      },
      required: ['cik'],
    },
  },
  {
    name: 'get_delisted_companies',
    description: 'Get list of companies that have been delisted from exchanges.',
    input_schema: {
      type: 'object',
      properties: {
        page: {
          type: 'number',
          description: 'Page number (default: 0)',
        },
        limit: {
          type: 'number',
          description: 'Results per page (default: 100)',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_employee_count',
    description: 'Get current employee count for a company from SEC filings.',
    input_schema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Stock ticker symbol',
        },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'get_historical_employee_count',
    description: 'Get historical employee count data to track workforce changes over time.',
    input_schema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Stock ticker symbol',
        },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'get_market_capitalization',
    description: 'Get current market capitalization for a company.',
    input_schema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Stock ticker symbol',
        },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'get_batch_market_capitalization',
    description: 'Get market cap for multiple companies at once for comparison.',
    input_schema: {
      type: 'object',
      properties: {
        symbols: {
          type: 'string',
          description: 'Comma-separated list of symbols (e.g., "AAPL,MSFT,GOOGL")',
        },
      },
      required: ['symbols'],
    },
  },
  {
    name: 'get_historical_market_capitalization',
    description: 'Get historical market cap data to track company valuation changes.',
    input_schema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Stock ticker symbol',
        },
        limit: {
          type: 'number',
          description: 'Number of historical records (default: 100)',
        },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'get_shares_float',
    description: 'Get share float data (publicly traded shares) for liquidity analysis.',
    input_schema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Stock ticker symbol',
        },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'get_all_shares_float',
    description: 'Get share float data for all companies for comprehensive screening.',
    input_schema: {
      type: 'object',
      properties: {
        page: {
          type: 'number',
          description: 'Page number (default: 0)',
        },
        limit: {
          type: 'number',
          description: 'Results per page (default: 1000)',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_latest_mergers_acquisitions',
    description: 'Get latest merger and acquisition activity across all companies.',
    input_schema: {
      type: 'object',
      properties: {
        page: {
          type: 'number',
          description: 'Page number (default: 0)',
        },
        limit: {
          type: 'number',
          description: 'Results per page (default: 100)',
        },
      },
      required: [],
    },
  },
  {
    name: 'search_mergers_acquisitions',
    description: 'Search for specific M&A activity by company name.',
    input_schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Company name to search for',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'get_key_executives',
    description: 'Get information about company executives including names, titles, and compensation.',
    input_schema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Stock ticker symbol',
        },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'get_executive_compensation',
    description: 'Get detailed executive compensation data including salaries, stock awards, and total comp.',
    input_schema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Stock ticker symbol',
        },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'get_executive_compensation_benchmark',
    description: 'Get average executive compensation benchmarks by industry for comparison.',
    input_schema: {
      type: 'object',
      properties: {
        year: {
          type: 'number',
          description: 'Year for benchmark data (optional)',
        },
      },
      required: [],
    },
  },
  // ==================== QUOTES & MARKET DATA TOOLS ====================
  {
    name: 'get_quote_short',
    description: 'Get quick snapshot of stock quote with only essential data (price, volume).',
    input_schema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Stock ticker symbol',
        },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'get_aftermarket_trade',
    description: 'Get after-hours trading activity with prices and sizes.',
    input_schema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Stock ticker symbol',
        },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'get_aftermarket_quote',
    description: 'Get after-hours bid/ask quotes for extended trading analysis.',
    input_schema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Stock ticker symbol',
        },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'get_stock_price_change',
    description: 'Get stock price changes across multiple timeframes (1D, 5D, 1M, 3M, 6M, YTD, 1Y, 3Y, 5Y, 10Y, max).',
    input_schema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Stock ticker symbol',
        },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'get_batch_quote',
    description: 'Get real-time quotes for multiple stocks in a single request.',
    input_schema: {
      type: 'object',
      properties: {
        symbols: {
          type: 'string',
          description: 'Comma-separated symbols (e.g., "AAPL,MSFT,GOOGL")',
        },
      },
      required: ['symbols'],
    },
  },
  {
    name: 'get_batch_quote_short',
    description: 'Get quick quotes for multiple stocks with essential data only.',
    input_schema: {
      type: 'object',
      properties: {
        symbols: {
          type: 'string',
          description: 'Comma-separated symbols',
        },
      },
      required: ['symbols'],
    },
  },
  {
    name: 'get_batch_exchange_quote',
    description: 'Get quotes for all stocks trading on a specific exchange.',
    input_schema: {
      type: 'object',
      properties: {
        exchange: {
          type: 'string',
          description: 'Exchange name (e.g., "NASDAQ", "NYSE")',
        },
      },
      required: ['exchange'],
    },
  },
  {
    name: 'get_batch_mutualfund_quotes',
    description: 'Get quotes for all mutual funds.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_batch_etf_quotes',
    description: 'Get quotes for all ETFs.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_batch_commodity_quotes',
    description: 'Get quotes for all commodities (gold, silver, oil, etc.).',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_batch_crypto_quotes',
    description: 'Get quotes for all cryptocurrencies.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_batch_forex_quotes',
    description: 'Get quotes for all forex currency pairs.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_batch_index_quotes',
    description: 'Get quotes for all major market indices.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  // ==================== FINANCIAL STATEMENTS - ADVANCED TOOLS ====================
  {
    name: 'get_latest_financial_statements',
    description: 'Get list of companies with latest financial statement updates.',
    input_schema: {
      type: 'object',
      properties: {
        page: {
          type: 'number',
          description: 'Page number (default: 0)',
        },
        limit: {
          type: 'number',
          description: 'Results per page (default: 250)',
        },
      },
      required: [],
    },
  },
];
