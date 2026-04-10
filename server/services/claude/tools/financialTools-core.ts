import type { ClaudeToolDefinition } from './types';

/** Financial tools part 1: Core data (profile, statements, quotes, prices, search, technical, options, macro) */
export const FINANCIAL_TOOLS_PART1: ClaudeToolDefinition[] = [
  {
    name: 'get_company_profile',
    description: 'Gets detailed company profile information including sector, industry, description, employees, CEO, market cap, and more.',
    input_schema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Stock ticker symbol (e.g., "AAPL", "TSLA", "MSFT")',
        },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'get_income_statement',
    description: 'Gets income statement (profit & loss) data showing revenue, expenses, and profitability over time.',
    input_schema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Stock ticker symbol',
        },
        period: {
          type: 'string',
          description: 'Period type: "annual" or "quarter" (default: annual)',
        },
        limit: {
          type: 'number',
          description: 'Number of periods to retrieve (default: 20). Use 40 for comprehensive research papers',
        },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'get_balance_sheet',
    description: 'Gets balance sheet data showing assets, liabilities, and equity.',
    input_schema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Stock ticker symbol',
        },
        period: {
          type: 'string',
          description: 'Period type: "annual" or "quarter" (default: annual)',
        },
        limit: {
          type: 'number',
          description: 'Number of periods to retrieve (default: 20). Use 40 for comprehensive research papers',
        },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'get_cash_flow',
    description: 'Gets cash flow statement showing operating, investing, and financing activities.',
    input_schema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Stock ticker symbol',
        },
        period: {
          type: 'string',
          description: 'Period type: "annual" or "quarter" (default: annual)',
        },
        limit: {
          type: 'number',
          description: 'Number of periods to retrieve (default: 20). Use 40 for comprehensive research papers',
        },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'get_key_metrics',
    description: 'Gets key financial metrics and ratios like P/E ratio, ROE, debt-to-equity, market cap, EV, etc.',
    input_schema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Stock ticker symbol',
        },
        period: {
          type: 'string',
          description: 'Period type: "annual" or "quarter" (default: annual)',
        },
        limit: {
          type: 'number',
          description: 'Number of periods to retrieve (default: 20). Use 40 for comprehensive research papers',
        },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'get_financial_ratios',
    description: 'Gets comprehensive financial ratios including liquidity, profitability, leverage, and efficiency ratios.',
    input_schema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Stock ticker symbol',
        },
        period: {
          type: 'string',
          description: 'Period type: "annual" or "quarter" (default: annual)',
        },
        limit: {
          type: 'number',
          description: 'Number of periods to retrieve (default: 20). Use 40 for comprehensive research papers',
        },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'get_stock_quote',
    description: 'Gets real-time stock quote with current price, volume, market cap, P/E ratio, and daily changes.',
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
    name: 'get_historical_price',
    description: 'Gets historical stock prices (OHLC data) for charting and trend analysis. Returns up to 2 years (504 trading days) of data. IMPORTANT: When the user asks for "derniers N mois/jours", calculate the "from" date by subtracting from TODAY\'S date (use the current date provided in the system prompt). The "to" date defaults to TODAY automatically if not specified. For Monte Carlo simulations, call WITHOUT from/to dates to get maximum historical data.',
    input_schema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Stock ticker symbol',
        },
        from: {
          type: 'string',
          description: 'Start date in YYYY-MM-DD format. When user asks for "last 6 months" or "6 derniers mois", calculate this as TODAY minus 6 months using the current date from system prompt. Optional - omit for maximum data.',
        },
        to: {
          type: 'string',
          description: 'End date in YYYY-MM-DD format (optional - omit for maximum data)',
        },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'search_companies',
    description: 'Searches for companies by name or partial ticker to find the correct stock symbol.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Company name or partial symbol to search for',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results (default: 10)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_stock_peers',
    description: 'Gets comparable companies (peers) in the same sector/industry for comparison analysis.',
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
    name: 'get_financial_news',
    description: 'Gets latest financial news articles for a specific stock or general market news.',
    input_schema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Stock ticker symbol (optional - if not provided, gets general market news)',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of news articles (default: 5, max: 5 to avoid context overflow)',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_rsi',
    description: 'Gets RSI (Relative Strength Index) technical indicator - measures momentum and overbought/oversold conditions. Values above 70 suggest overbought, below 30 suggest oversold.',
    input_schema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Stock ticker symbol',
        },
        period: {
          type: 'number',
          description: 'Period for RSI calculation (default: 14)',
        },
        timePeriod: {
          type: 'string',
          description: 'Time period: "daily", "weekly", "monthly" (default: daily)',
        },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'get_macd',
    description: 'Gets MACD (Moving Average Convergence Divergence) - shows trend direction and momentum. Includes MACD line, signal line, and histogram.',
    input_schema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Stock ticker symbol',
        },
        timePeriod: {
          type: 'string',
          description: 'Time period: "daily", "weekly", "monthly" (default: daily)',
        },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'get_ema',
    description: 'Gets EMA (Exponential Moving Average) - smoothed price trend line that reacts faster to recent price changes.',
    input_schema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Stock ticker symbol',
        },
        period: {
          type: 'number',
          description: 'Period for EMA (default: 50, common: 12, 26, 50, 200)',
        },
        timePeriod: {
          type: 'string',
          description: 'Time period: "daily", "weekly", "monthly" (default: daily)',
        },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'get_sma',
    description: 'Gets SMA (Simple Moving Average) - basic price trend line. Common periods: 20, 50, 200 days.',
    input_schema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Stock ticker symbol',
        },
        period: {
          type: 'number',
          description: 'Period for SMA (default: 50, common: 20, 50, 100, 200)',
        },
        timePeriod: {
          type: 'string',
          description: 'Time period: "daily", "weekly", "monthly" (default: daily)',
        },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'get_adx',
    description: 'Gets ADX (Average Directional Index) - measures trend strength. Above 25 indicates strong trend, below 20 weak trend.',
    input_schema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Stock ticker symbol',
        },
        period: {
          type: 'number',
          description: 'Period for ADX calculation (default: 14)',
        },
        timePeriod: {
          type: 'string',
          description: 'Time period: "daily", "weekly", "monthly" (default: daily)',
        },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'get_williams_r',
    description: 'Gets Williams %R - momentum oscillator showing overbought/oversold levels. Values above -20 suggest overbought, below -80 oversold.',
    input_schema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Stock ticker symbol',
        },
        period: {
          type: 'number',
          description: 'Period for Williams %R (default: 14)',
        },
        timePeriod: {
          type: 'string',
          description: 'Time period: "daily", "weekly", "monthly" (default: daily)',
        },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'get_cci',
    description: 'Gets CCI (Commodity Channel Index) - identifies cyclical trends. Above +100 suggests overbought, below -100 oversold.',
    input_schema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Stock ticker symbol',
        },
        period: {
          type: 'number',
          description: 'Period for CCI (default: 20)',
        },
        timePeriod: {
          type: 'string',
          description: 'Time period: "daily", "weekly", "monthly" (default: daily)',
        },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'get_stochastic',
    description: 'Gets Stochastic Oscillator - compares closing price to price range over time. %K above 80 suggests overbought, below 20 oversold.',
    input_schema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Stock ticker symbol',
        },
        period: {
          type: 'number',
          description: 'Period for Stochastic (default: 14)',
        },
        timePeriod: {
          type: 'string',
          description: 'Time period: "daily", "weekly", "monthly" (default: daily)',
        },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'calculate_options_price',
    description: 'Calculates theoretical option prices using the Black-Scholes model for European options. Returns prices for both call and put options, along with Greeks (Delta, Gamma, Theta, Vega, Rho) and intrinsic/time values. Useful for options valuation, hedging strategies, and understanding option sensitivities. RECOMMENDED: Pass "symbol" parameter to automatically fetch current stock price and calculate historical volatility from FMP API.',
    input_schema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Stock ticker symbol (e.g., "AAPL"). RECOMMENDED: Use this to automatically fetch current stock price and calculate historical volatility from FMP API. Much simpler and uses real market data!',
        },
        stock_price: {
          type: 'number',
          description: 'ALTERNATIVE to symbol: Current stock price (S). Only use if you cannot provide a symbol.',
        },
        strike_price: {
          type: 'number',
          description: 'Option strike price (K)',
        },
        time_to_maturity: {
          type: 'number',
          description: 'Time to expiration in years (T). Example: 0.25 for 3 months, 0.5 for 6 months, 1.0 for 1 year',
        },
        risk_free_rate: {
          type: 'number',
          description: 'Risk-free interest rate as decimal (r). Example: 0.05 for 5%. Default: 0.05',
        },
        volatility: {
          type: 'number',
          description: 'Annualized volatility as decimal (sigma). Example: 0.3 for 30% volatility. If symbol is provided and volatility is not, it will be calculated automatically from 30-day historical data. Otherwise defaults to 30%',
        },
        option_type: {
          type: 'string',
          description: 'Type of option: "call" or "put". This parameter is informational - the tool calculates both types',
        },
      },
      required: ['strike_price', 'time_to_maturity'],
    },
  },
  {
    name: 'get_economic_calendar',
    description: 'Gets upcoming economic events and data releases that impact markets (GDP, inflation, employment, etc.). Includes actual vs expected values and impact ratings.',
    input_schema: {
      type: 'object',
      properties: {
        from: {
          type: 'string',
          description: 'Start date in YYYY-MM-DD format (optional)',
        },
        to: {
          type: 'string',
          description: 'End date in YYYY-MM-DD format (optional)',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_treasury_rates',
    description: 'Gets US Treasury rates for various maturities (1 month to 30 years). Useful for analyzing interest rate environment and yield curve.',
    input_schema: {
      type: 'object',
      properties: {
        from: {
          type: 'string',
          description: 'Start date in YYYY-MM-DD format (optional)',
        },
        to: {
          type: 'string',
          description: 'End date in YYYY-MM-DD format (optional)',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_economic_indicator',
    description: 'Gets specific economic indicator data (GDP, unemployment, inflation, etc.). Useful for macroeconomic analysis.',
    input_schema: {
      type: 'object',
      properties: {
        indicator: {
          type: 'string',
          description: 'Economic indicator name (e.g., "GDP", "unemployment", "inflation", "CPI")',
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
      required: ['indicator'],
    },
  },
  {
    name: 'get_insider_trading',
    description: 'Gets recent insider trading activity (buys/sells by company executives). Helps identify insider sentiment. Can filter by symbol or get all recent trades.',
    input_schema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Stock ticker symbol (optional - if not provided, gets recent insider trades across all companies)',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of trades to retrieve (default: 20, max: 20 to avoid context overflow)',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_insider_trade_statistics',
    description: 'Gets aggregated statistics on insider trading for a company (total trades, buy vs sell ratio, average prices, etc.).',
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
    name: 'get_earnings_calendar',
    description: 'Gets upcoming earnings announcements with expected dates and estimated EPS. Useful for tracking when companies report earnings.',
    input_schema: {
      type: 'object',
      properties: {
        from: {
          type: 'string',
          description: 'Start date in YYYY-MM-DD format (optional)',
        },
        to: {
          type: 'string',
          description: 'End date in YYYY-MM-DD format (optional)',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_earnings_surprises',
    description: 'Gets historical earnings surprises (actual vs estimated EPS) to analyze company\'s track record of beating/missing estimates.',
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
    name: 'get_analyst_estimates',
    description: 'Gets analyst consensus estimates for revenue, earnings, EBITDA, etc. Shows analyst expectations and ranges.',
    input_schema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Stock ticker symbol',
        },
        period: {
          type: 'string',
          description: 'Period type: "annual" or "quarter" (default: annual)',
        },
        limit: {
          type: 'number',
          description: 'Number of periods to retrieve (default: 20). Use 40 for comprehensive research papers',
        },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'get_forex_quote',
    description: 'Gets real-time forex (currency pair) quote with bid/ask prices and daily changes. Useful for analyzing currency movements.',
    input_schema: {
      type: 'object',
      properties: {
        pair: {
          type: 'string',
          description: 'Currency pair (e.g., "EURUSD", "GBPUSD", "USDJPY")',
        },
      },
      required: ['pair'],
    },
  },
  {
    name: 'get_forex_list',
    description: 'Gets list of all available forex currency pairs that can be queried.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_commodity_quotes',
    description: 'Gets real-time quotes for commodities (gold, silver, oil, natural gas, wheat, etc.). Useful for commodity market analysis.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_cot_report',
    description: 'Gets Commitment of Traders (COT) report showing positions of institutional traders in commodities and futures. Useful for sentiment analysis.',
    input_schema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Commodity or futures symbol',
        },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'get_cot_analysis',
    description: 'Gets analyzed COT data with market situation indicators (bullish/bearish positioning).',
    input_schema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Commodity or futures symbol',
        },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'get_press_releases',
    description: 'Gets official company press releases. More detailed than news articles, directly from the company.',
    input_schema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Stock ticker symbol',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of press releases (default: 20)',
        },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'get_dividend_history',
    description: 'Gets historical dividend payments for a stock. Shows dividend amounts, payment dates, and record dates.',
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
    name: 'get_stock_split_history',
    description: 'Gets historical stock splits. Shows split ratios and dates.',
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
    name: 'get_ipo_calendar',
    description: 'Gets upcoming IPOs (Initial Public Offerings) with expected dates, price ranges, and details.',
    input_schema: {
      type: 'object',
      properties: {
        from: {
          type: 'string',
          description: 'Start date in YYYY-MM-DD format (optional)',
        },
        to: {
          type: 'string',
          description: 'End date in YYYY-MM-DD format (optional)',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_intraday_price',
    description: 'Gets intraday stock prices with minute-level data. Available intervals: 1min, 5min, 15min, 30min, 1hour, 4hour. Useful for day trading and short-term analysis.',
    input_schema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Stock ticker symbol',
        },
        interval: {
          type: 'string',
          description: 'Time interval: "1min", "5min", "15min", "30min", "1hour", "4hour" (default: 15min)',
        },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'get_price_target',
    description: 'Gets analyst price targets showing consensus target price, high/low estimates, and number of analysts. Useful for understanding market expectations.',
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
    name: 'get_price_target_summary',
    description: 'Gets summarized analyst price target consensus with average, median, high, low targets.',
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
    name: 'get_upgrades_downgrades',
    description: 'Gets analyst upgrades and downgrades (rating changes like Buy → Sell). Shows analyst firm, old rating, new rating, and date.',
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
    name: 'get_institutional_holders',
    description: 'Gets institutional shareholders (mutual funds, pension funds, hedge funds) and their holdings. Shows ownership percentage and changes.',
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
    name: 'get_esg_score',
    description: 'Gets ESG (Environmental, Social, Governance) scores and ratings. Important for sustainable investing analysis.',
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
    name: 'get_social_sentiment',
    description: 'Gets social media sentiment analysis from Twitter, Reddit, etc. Shows positive/negative sentiment trends.',
    input_schema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Stock ticker symbol',
        },
        limit: {
          type: 'number',
          description: 'Number of sentiment records (default: 10, max: 10 to avoid context overflow)',
        },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'get_congressional_trading',
    description: 'Gets congressional stock trading activity (US Congress members). Useful for tracking political insider activity.',
    input_schema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Stock ticker symbol (optional - if not provided, gets all recent congressional trades)',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_senate_trading',
    description: 'Gets US Senate stock trading activity with detailed disclosure information.',
    input_schema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Stock ticker symbol (optional)',
        },
      },
      required: [],
    },
  },
  {
    name: 'search_by_cik',
    description: 'Search companies by SEC CIK (Central Index Key) number.',
    input_schema: {
      type: 'object',
      properties: {
        cik: {
          type: 'string',
          description: 'SEC CIK number (e.g., "0000320193" for Apple)',
        },
      },
      required: ['cik'],
    },
  },
  {
    name: 'search_by_cusip',
    description: 'Search companies by CUSIP (Committee on Uniform Securities Identification Procedures) identifier.',
    input_schema: {
      type: 'object',
      properties: {
        cusip: {
          type: 'string',
          description: 'CUSIP identifier',
        },
      },
      required: ['cusip'],
    },
  },
  {
    name: 'search_by_isin',
    description: 'Search companies by ISIN (International Securities Identification Number).',
    input_schema: {
      type: 'object',
      properties: {
        isin: {
          type: 'string',
          description: 'ISIN identifier',
        },
      },
      required: ['isin'],
    },
  },
  {
    name: 'get_stock_screener',
    description: 'Screen stocks based on various criteria like market cap, sector, price, volume, beta, etc. Returns list of stocks matching filters.',
    input_schema: {
      type: 'object',
      properties: {
        marketCapMoreThan: {
          type: 'number',
          description: 'Minimum market cap (e.g., 1000000000 for $1B)',
        },
        marketCapLowerThan: {
          type: 'number',
          description: 'Maximum market cap',
        },
        betaMoreThan: {
          type: 'number',
          description: 'Minimum beta',
        },
        betaLowerThan: {
          type: 'number',
          description: 'Maximum beta',
        },
        volumeMoreThan: {
          type: 'number',
          description: 'Minimum volume',
        },
        sector: {
          type: 'string',
          description: 'Sector filter (e.g., "Technology", "Healthcare")',
        },
        industry: {
          type: 'string',
          description: 'Industry filter',
        },
        exchange: {
          type: 'string',
          description: 'Exchange filter (e.g., "NASDAQ", "NYSE")',
        },
        limit: {
          type: 'number',
          description: 'Maximum results (default: 100)',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_market_hours',
    description: 'Gets market trading hours and status (open/closed) for various exchanges.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_etf_holdings',
    description: 'Gets detailed holdings of an ETF including all stocks, weights, and allocations.',
    input_schema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'ETF ticker symbol (e.g., "SPY", "QQQ", "VTI")',
        },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'get_etf_sector_weightings',
    description: 'Gets sector allocation breakdown for an ETF.',
    input_schema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'ETF ticker symbol',
        },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'get_etf_country_weightings',
    description: 'Gets country/geographic allocation breakdown for an ETF.',
    input_schema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'ETF ticker symbol',
        },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'get_financial_growth',
    description: 'Gets year-over-year growth rates for all financial metrics (revenue growth, earnings growth, etc.).',
    input_schema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Stock ticker symbol',
        },
        period: {
          type: 'string',
          description: 'Period type: "annual" or "quarter" (default: annual)',
        },
        limit: {
          type: 'number',
          description: 'Number of periods (default: 20). Use 40 for research papers',
        },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'get_company_outlook',
    description: 'Gets comprehensive company outlook including profile, metrics, ratios, financials, and recent data in one call.',
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
];
