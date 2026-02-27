export interface ClaudeToolDefinition {
  name: string;
  description: string;
  input_schema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}
const AVAILABLE_TOOLS: ClaudeToolDefinition[] = [
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
          description: 'Number of periods to retrieve (default: 5)',
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
          description: 'Number of periods to retrieve (default: 5)',
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
          description: 'Number of periods to retrieve (default: 5)',
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
          description: 'Number of periods to retrieve (default: 5)',
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
          description: 'Number of periods to retrieve (default: 5)',
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
          description: 'Number of periods to retrieve (default: 5)',
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
          description: 'Number of periods (default: 5)',
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
    name: 'web_search_exa',
    description: 'Search the web using Exa\'s semantic search engine for high-quality, relevant content. Use this to find information from websites, articles, news, research papers, and other web sources. Excellent for finding recent news, industry trends, company information not in financial databases, product details, market analysis from various sources, etc.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Natural language search query (e.g., "recent AI developments", "electric vehicle market trends")',
        },
        numResults: {
          type: 'number',
          description: 'Number of results to return (1-20, default: 10)',
        },
        type: {
          type: 'string',
          description: 'Search type: "auto" (default), "neural" (semantic), or "keyword" (exact match)',
        },
        category: {
          type: 'string',
          description: 'Filter by content type: "company", "research_paper", "news_article", "tweet", "github", "pdf"',
        },
        includeDomains: {
          type: 'array',
          items: { type: 'string' },
          description: 'Only search within these domains (e.g., ["techcrunch.com", "reuters.com"])',
        },
        excludeDomains: {
          type: 'array',
          items: { type: 'string' },
          description: 'Exclude these domains from search',
        },
        startPublishedDate: {
          type: 'string',
          description: 'Filter results published after this date (ISO 8601 format: YYYY-MM-DD)',
        },
        endPublishedDate: {
          type: 'string',
          description: 'Filter results published before this date (ISO 8601 format: YYYY-MM-DD)',
        },
        includeText: {
          type: 'boolean',
          description: 'Include page text content in results (default: true)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_contents_exa',
    description: 'Get full content from specific URLs using Exa\'s web crawler. Use this after finding interesting URLs with web_search_exa to extract complete text, highlights, and summaries. Perfect for deep-diving into specific articles, research papers, or web pages to extract detailed information.',
    input_schema: {
      type: 'object',
      properties: {
        urls: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of URLs to crawl and extract content from (max 5 URLs)',
        },
        includeText: {
          type: 'boolean',
          description: 'Include full page text content (default: true)',
        },
        maxCharacters: {
          type: 'number',
          description: 'Maximum characters to extract per page (default: 3000)',
        },
        includeHighlights: {
          type: 'boolean',
          description: 'Extract key sentences as highlights (default: false)',
        },
        highlightsQuery: {
          type: 'string',
          description: 'Query to focus highlights on specific topics',
        },
        numSentences: {
          type: 'number',
          description: 'Number of highlight sentences per URL (default: 3)',
        },
        includeSummary: {
          type: 'boolean',
          description: 'Generate AI summary of the content (default: false)',
        },
        summaryQuery: {
          type: 'string',
          description: 'Query to focus summary on specific aspects',
        },
      },
      required: ['urls'],
    },
  },
  {
    name: 'execute_custom_python_analysis',
    description: `Execute custom Python code for financial analysis. Access to: numpy, pandas, matplotlib, scipy, sklearn, statsmodels, yfinance, cvxpy, and FMP API via fmp object.

🚀 CRITICAL RULE - DO EVERYTHING IN ONE CALL:
NEVER make multiple tool calls to execute_custom_python_analysis. Do EVERYTHING in a SINGLE Python script: data fetching + analysis + figures. Do NOT make separate calls for "fetch data" then "run analysis". That's SLOW!

❌ WRONG (SLOW - multiple calls):
Call 1: "Fetch NVDA data" → fmp.get_historical_prices("NVDA")
Call 2: "Run Monte Carlo" → uses the data

✅ CORRECT (FAST - one call does everything):
Single call: Fetch data + Run Monte Carlo + Create figures all in one script

⚠️ NEVER HARDCODE DATA:
NEVER write hardcoded arrays of data (dates, prices, etc.) in your code. ALWAYS fetch data dynamically using fmp API methods like fmp.get_historical_prices(). Writing hardcoded data is SLOW and takes forever to stream to the user. Instead, fetch data with 1-2 lines of API calls.

❌ WRONG (SLOW - takes forever to write):
dates = ['2024-01-01', '2024-01-02', ...] # hundreds of lines
prices = [150.23, 151.45, ...] # takes forever to stream

✅ CORRECT (FAST):
data = fmp.get_historical_prices("AAPL")
df = pd.DataFrame(data["historical"])

📊 FIGURE CREATION RULES - ALWAYS CREATE SEPARATE FIGURES:
NEVER use plt.subplots() with multiple rows/columns (like 2x2, 3x1, 4x4 grids).
ALWAYS create INDIVIDUAL SEPARATE figures using plt.figure() for each visualization.
This allows each figure to be displayed and commented individually in the response.

❌ WRONG (combined figures - hard to comment individually):
fig, axes = plt.subplots(2, 2, figsize=(12, 10))
axes[0,0].plot(...)
axes[0,1].hist(...)
axes[1,0].plot(...)
axes[1,1].scatter(...)

✅ CORRECT (separate figures - each can be commented):
plt.figure(figsize=(12, 6))
plt.plot(df["date"], df["close"])
plt.title("Price Evolution")
plt.tight_layout()

plt.figure(figsize=(12, 6))
plt.hist(df["returns"], bins=50, alpha=0.7)
plt.title("Return Distribution")
plt.tight_layout()

plt.figure(figsize=(12, 6))
plt.plot(df["date"], df["volume"], color="green")
plt.title("Volume Analysis")
plt.tight_layout()

📥 EXCEL FILE GENERATION:
save_excel() generates professionally styled Excel files with title row, teal headers, zebra striping, auto-column-width, freeze panes, auto number formatting, REAL Excel formulas (SUM, AVERAGE, MIN, MAX, COUNT), and conditional formatting.

Every Excel file automatically includes:
- Professional title row (merged, teal 14pt bold) + generated date subtitle
- Summary formulas at the bottom of each numeric column (SUM, AVERAGE, MIN, MAX, COUNT) — these are REAL Excel formulas, not static values
- Conditional formatting: green/red color scales for return columns, teal data bars for volume columns, teal gradients for price/value columns
- Freeze panes on the first data row (A5)

Single sheet:
save_excel(df, "AAPL_prices.xlsx")

Multi-sheet workbook (PREFERRED when you have multiple DataFrames):
save_excel({
    "Summary": summary_df,
    "Details": details_df,
    "Raw Data": raw_df
}, "full_report.xlsx")

Custom title:
save_excel(df, "report.xlsx", title="Revenue Analysis Q4 2025")

Calculated formula columns (PREFERRED over pre-calculating values in Python):
save_excel(df, "report.xlsx", formulas=[
    {"col": "Margin", "formula": "=D{row}/B{row}", "format": "0.00%"},
    {"col": "Total", "formula": "=B{row}+C{row}", "format": "#,##0.00"}
])
{row} is replaced by the actual Excel row number. The user sees the formula logic in the formula bar.

Opt-out of auto features:
save_excel(df, "report.xlsx", summary=False, conditional_formatting=False)
save_excel(df, "report.xlsx", summary=['sum', 'average'])  # Only selected stats

⚠️ ALWAYS use multi-sheet format when you have multiple DataFrames — do NOT call save_excel() multiple times to create separate files. One workbook with multiple sheets is cleaner and more professional.
⚠️ PREFER using formulas= for calculated columns instead of computing values in Python — this lets the user see and modify the calculation logic directly in Excel.

📝 WORD DOCUMENT GENERATION:
save_word() generates branded VQuant Word documents (.docx) with professional styling.

From markdown string:
save_word("# Portfolio Analysis\\n\\n## Summary\\n\\nThe portfolio returned **12.5%**...\\n\\n- Strong performance in tech\\n- Underweight in energy", "portfolio_report.docx")

From structured dict (for including tables):
save_word({
    "title": "Portfolio Analysis",
    "sections": [
        {"heading": "Performance Summary", "body": "The portfolio returned **12.5%** annualized."},
        {"heading": "Holdings", "table": holdings_df},
        {"heading": "Risk Metrics", "body": "VaR (95%): -2.3%\\nMax Drawdown: -15.2%", "table": risk_df}
    ]
}, "portfolio_report.docx")

📄 LATEX PDF REPORT GENERATION:
save_latex() compiles LaTeX to a professional PDF using pdflatex. The PDF includes a branded VQuant title page, table of contents, and professional formatting.

Basic usage (body wrapped in VQuant template):
save_latex(r"""
\section{Executive Summary}
Strong performance driven by tech sector allocation.

\section{Price Analysis}
{{FIG:0}}
The chart above shows the price evolution.

\section{Key Statistics}
""" + df_to_latex(summary_df, caption="Summary Statistics") + r"""

\section{Conclusion}
Positive outlook based on fundamental analysis.
""", "AAPL_Analysis.pdf")

Figure embedding: create matplotlib figures first, then use {{FIG:0}}, {{FIG:1}}, etc. placeholders. Figures are saved at 300dpi for print quality. figures='auto' (default) captures all open figures; figures='none' skips figure embedding.

df_to_latex(df, caption="Title", label="tab:summary") converts a DataFrame to a professional booktabs table with teal headers and zebra striping.

Raw LaTeX mode: if the content starts with \documentclass, it is compiled as-is (no template wrapping). Use this for fully custom documents.

Template options: template='financial' (default) includes title page, TOC, fancyhdr, tcolorbox callouts; template='minimal' is a clean document with just geometry and basic packages.

Branding parameters (optional):
- author="Name" — adds "Prepared by Name" on the title page and sets PDF metadata
- company="Company" — replaces "VQuant" in the title page heading and page headers
- logo="https://..." — fetches a PNG/JPG logo image and places it above the company name on the title page (graceful fallback if URL fails)
- title="Custom Title" — sets the subtitle on the title page (default: "Financial Intelligence Report")
Example: save_latex(content, "report.pdf", author="Marie Dupont", company="Desjardins", logo="https://logo.clearbit.com/desjardins.com", title="Apple Financial Analysis")

Available LaTeX environments in the financial template:
- \begin{keyinsight}...\end{keyinsight} — teal callout box for key findings
- \begin{warningbox}...\end{warningbox} — red callout box for warnings/risks
- \begin{summarybox}[Title]...\end{summarybox} — teal-tinted summary box (default title: "Executive Summary")
- Standard \section, \subsection, \subsubsection with sans-serif teal styling and underline rules
- amsmath for equations, booktabs for tables, float for [H] placement
- Professional typography: Times body (newtxtext), Source Sans Pro headings, microtype kerning, 1.15x line spacing, "Page X / Y" footer

The download links for Excel, Word, and LaTeX PDF files will be automatically included in the tool result.

DISPLAYING FIGURES - CRITICAL:
When your code creates matplotlib figures, they are saved as PNG files and you will receive markdown image references in the tool result output.

⚠️ YOU MUST INCLUDE EVERY ![Figure X](url) IMAGE IN YOUR RESPONSE!
Do NOT skip or omit the figure references - they MUST appear in your markdown response.

For each figure, include it with your analysis like this:

"Voici l'évolution des prix:

![Figure 1](/figures/fig-12345-0.png)

Le graphique montre une tendance haussière sur la période...

Analysons maintenant la distribution des rendements:

![Figure 2](/figures/fig-12345-1.png)

La distribution présente une légère asymétrie..."`,
    input_schema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'Python code. ⚠️ NEVER HARDCODE DATA ARRAYS! Always fetch with fmp API. CRITICAL: fmp.get_historical_prices() returns dict with "historical" key! ALWAYS use: df = pd.DataFrame(data["historical"]). Convert dates: df["date"] = pd.to_datetime(df["date"]). Always .dropna(). ⚠️ ALWAYS CREATE SEPARATE FIGURES with plt.figure() - NEVER use plt.subplots(2,2) or grids! CORRECT PATTERN:\n```python\n# ✅ CORRECT: Fetch data with API (FAST)\ndata = fmp.get_historical_prices("AAPL")\ndf = pd.DataFrame(data["historical"])  # ← MUST use ["historical"]\ndf["date"] = pd.to_datetime(df["date"])\ndf = df.sort_values("date").dropna()\ndf["returns"] = df["close"].pct_change()\nprint(f"Latest: ${df[\'close\'].iloc[-1]:.2f}")\n\n# Figure 1 - Price\nplt.figure(figsize=(12,6))\nplt.plot(df["date"], df["close"])\nplt.title("Price Evolution")\nplt.tight_layout()\n\n# Figure 2 - Returns\nplt.figure(figsize=(12,6))\nplt.hist(df["returns"].dropna(), bins=50)\nplt.title("Return Distribution")\nplt.tight_layout()\n```\n❌ WRONG: plt.subplots(2,2) or dates = [\'2024-01-01\', ...] # No grids! No hardcoded data!\nLIBS: np, pd, plt, sns, scipy, sklearn, statsmodels, ta, cvxpy, numba, networkx, sympy, arch',
        },
        description: {
          type: 'string',
          description: 'Brief description of what this analysis does (shown to user, e.g., "Custom correlation analysis between tech stocks")',
        },
        context: {
          type: 'object',
          description: 'Optional context variables to inject into the Python environment as global variables. Example: {"symbols": ["AAPL", "MSFT"], "threshold": 0.5}',
        },
      },
      required: ['code'],
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
  // ==================== FIRECRAWL WEB NAVIGATION & EXTRACTION TOOLS ====================
  {
    name: 'firecrawl_scrape',
    description: 'Extract complete content from a single URL. Supports HTML pages, PDFs, Word docs, and more. Perfect for extracting financial reports, company filings, research papers, and documentation. Returns clean markdown with automatic PDF summarization for long documents.',
    input_schema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'URL to scrape (HTTP/HTTPS). Supports PDFs, HTML, Word docs, etc.',
        },
        formats: {
          type: 'array',
          items: { type: 'string' },
          description: 'Output formats: ["markdown", "html", "rawHtml", "links", "screenshot"]. Default: ["markdown"]',
        },
        onlyMainContent: {
          type: 'boolean',
          description: 'Extract only main content, removing navigation/ads/footers. Default: true',
        },
        parsers: {
          type: 'array',
          items: { type: 'string' },
          description: 'Parsers to enable. Default: ["pdf"] for PDF extraction',
        },
        includeTags: {
          type: 'array',
          items: { type: 'string' },
          description: 'HTML tags to include (e.g., ["article", "main"])',
        },
        excludeTags: {
          type: 'array',
          items: { type: 'string' },
          description: 'HTML tags to exclude (e.g., ["nav", "footer", "aside"])',
        },
        waitFor: {
          type: 'number',
          description: 'Wait milliseconds before scraping (for dynamic content). Default: 0',
        },
        mobile: {
          type: 'boolean',
          description: 'Emulate mobile device. Default: false',
        },
        blockAds: {
          type: 'boolean',
          description: 'Block ads and cookie popups. Default: true',
        },
        timeout: {
          type: 'number',
          description: 'Request timeout in milliseconds. Default: 30000',
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'firecrawl_search',
    description: 'Search the web and automatically scrape matching results. Perfect for finding recent news, research papers (PDFs), financial reports, or specific information across multiple sources. Can filter by categories (github, research, pdf) and sources (web, images, news).',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query (e.g., "NVDA Q4 2024 earnings report PDF", "climate change research papers")',
        },
        limit: {
          type: 'number',
          description: 'Number of results to return (1-50). Default: 20',
        },
        sources: {
          type: 'array',
          items: { type: 'string', enum: ['web', 'images', 'news'] },
          description: 'Sources to search. Default: ["web"]. Options: "web", "images", "news"',
        },
        categories: {
          type: 'array',
          items: { type: 'string', enum: ['github', 'research', 'pdf'] },
          description: 'Categories to filter results. Options: "github" (repos), "research" (papers), "pdf" (documents)',
        },
        country: {
          type: 'string',
          description: 'Country code for geo-targeting (e.g., "US", "FR", "UK"). Default: "US"',
        },
        tbs: {
          type: 'string',
          description: 'Time-based search parameter (e.g., "qdr:d" = past day, "qdr:w" = past week, "qdr:m" = past month)',
        },
        onlyMainContent: {
          type: 'boolean',
          description: 'Extract only main content from scraped results. Default: false',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'firecrawl_crawl',
    description: 'Crawl and extract content from multiple pages of a website. Follows internal links to map entire documentation sites, corporate websites, or knowledge bases. Can use natural language prompts to guide crawling or use regex patterns for precise control.',
    input_schema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'Root URL to start crawling (e.g., "https://example.com/docs")',
        },
        prompt: {
          type: 'string',
          description: 'Natural language prompt to guide what to crawl (e.g., "crawl all product documentation pages")',
        },
        limit: {
          type: 'number',
          description: 'Maximum pages to crawl (1-20). Default: 10',
        },
        includePaths: {
          type: 'array',
          items: { type: 'string' },
          description: 'Regex patterns for URLs to include (e.g., ["/docs/.*", "/blog/.*"])',
        },
        excludePaths: {
          type: 'array',
          items: { type: 'string' },
          description: 'Regex patterns for URLs to exclude (e.g., ["/admin/.*", "/login"])',
        },
        maxDiscoveryDepth: {
          type: 'number',
          description: 'Maximum link depth to follow from root URL',
        },
        sitemap: {
          type: 'string',
          enum: ['skip', 'include'],
          description: 'Sitemap handling. Default: "include"',
        },
        crawlEntireDomain: {
          type: 'boolean',
          description: 'Allow crawling parent/sibling URLs. Default: false',
        },
        allowSubdomains: {
          type: 'boolean',
          description: 'Allow following subdomain links. Default: false',
        },
        ignoreQueryParameters: {
          type: 'boolean',
          description: 'Treat URLs with different query params as same page. Default: false',
        },
        onlyMainContent: {
          type: 'boolean',
          description: 'Extract only main content from each page. Default: false',
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'firecrawl_extract',
    description: 'Extract structured data from websites using AI. Define a schema and let Firecrawl intelligently extract matching data across multiple pages. Perfect for extracting product catalogs, company directories, financial metrics, or any structured information from websites.',
    input_schema: {
      type: 'object',
      properties: {
        urls: {
          type: 'array',
          items: { type: 'string' },
          description: 'URLs to extract data from (1-10 URLs recommended)',
        },
        prompt: {
          type: 'string',
          description: 'Prompt describing what data to extract (e.g., "Extract all product names, prices, and descriptions")',
        },
        schema: {
          type: 'object',
          description: 'JSON schema defining the structure of data to extract. Example: {type: "object", properties: {products: {type: "array", items: {type: "object", properties: {name: {type: "string"}, price: {type: "number"}}}}}}',
        },
        enableWebSearch: {
          type: 'boolean',
          description: 'Use web search to find additional data. Default: false',
        },
        includeSubdomains: {
          type: 'boolean',
          description: 'Also extract from subdomains. Default: true',
        },
        showSources: {
          type: 'boolean',
          description: 'Include source URLs in response. Default: false',
        },
      },
      required: ['urls'],
    },
  },
  {
    name: 'firecrawl_map',
    description: 'Map all URLs from a website without crawling content. Fast way to discover site structure, find all pages, or generate a sitemap. Can filter by search relevance and handle sitemaps intelligently.',
    input_schema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'Website URL to map',
        },
        search: {
          type: 'string',
          description: 'Search query to rank results by relevance (e.g., "pricing" to find pricing pages)',
        },
        sitemap: {
          type: 'string',
          enum: ['skip', 'include', 'only'],
          description: 'Sitemap mode. "only" = only sitemap URLs, "include" = sitemap + discovered, "skip" = no sitemap. Default: "include"',
        },
        includeSubdomains: {
          type: 'boolean',
          description: 'Include subdomain URLs. Default: true',
        },
        ignoreQueryParameters: {
          type: 'boolean',
          description: 'Ignore query parameters in URLs. Default: true',
        },
        limit: {
          type: 'number',
          description: 'Maximum links to return. Default: 5000',
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'firecrawl_agent',
    description: 'Autonomous AI agent for complex data extraction tasks. Give it a natural language prompt and optional URLs, and it will intelligently navigate, search, and extract the data you need. Uses advanced reasoning to understand your requirements and gather comprehensive information.',
    input_schema: {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description: 'Detailed prompt describing what data to extract (e.g., "Find and extract all executive compensation data from the latest 10-K filings of FAANG companies")',
        },
        urls: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional: Constrain agent to specific URLs (agent will only visit these)',
        },
        schema: {
          type: 'object',
          description: 'Optional: JSON schema to structure extracted data',
        },
        maxCredits: {
          type: 'number',
          description: 'Maximum credits to spend on this task',
        },
        strictConstrainToURLs: {
          type: 'boolean',
          description: 'If true, agent only visits provided URLs. Default: false',
        },
        model: {
          type: 'string',
          enum: ['spark-1-mini', 'spark-1-pro'],
          description: 'Agent model: "spark-1-mini" (fast, cheap) or "spark-1-pro" (powerful, accurate). Default: "spark-1-mini"',
        },
      },
      required: ['prompt'],
    },
  },
  {
    name: 'firecrawl_batch_scrape',
    description: 'Scrape multiple URLs in batch with high concurrency. Perfect for efficiently extracting content from many pages simultaneously (e.g., scraping multiple financial reports, news articles, or product pages at once).',
    input_schema: {
      type: 'object',
      properties: {
        urls: {
          type: 'array',
          items: { type: 'string' },
          description: 'URLs to scrape in batch (recommended: 5-50 URLs)',
        },
        maxConcurrency: {
          type: 'number',
          description: 'Number of simultaneous scrapes. Default: system optimized',
        },
        onlyMainContent: {
          type: 'boolean',
          description: 'Extract only main content. Default: true',
        },
        parsers: {
          type: 'array',
          items: { type: 'string' },
          description: 'Parsers to enable (e.g., ["pdf"]). Default: ["pdf"]',
        },
        formats: {
          type: 'array',
          items: { type: 'string' },
          description: 'Output formats. Default: ["markdown"]',
        },
        timeout: {
          type: 'number',
          description: 'Timeout per URL in milliseconds. Default: 30000',
        },
        blockAds: {
          type: 'boolean',
          description: 'Block ads and popups. Default: true',
        },
      },
      required: ['urls'],
    },
  },
  // ==================== TAVILY WEB RESEARCH & SEARCH TOOLS ====================
  {
    name: 'tavily_search',
    description: 'Advanced web search using Tavily AI. Perfect for real-time research with AI-generated answers, time-filtered results, and topic-specific searches (general, news, finance). Supports advanced search depth for more comprehensive results and can include images, raw content, and more.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search query (e.g., "latest developments in quantum computing", "NVDA earnings analysis")',
        },
        search_depth: {
          type: 'string',
          enum: ['advanced', 'basic', 'fast', 'ultra-fast'],
          description: 'Search depth. "advanced" = most comprehensive (slower), "ultra-fast" = quickest. Default: "basic"',
        },
        max_results: {
          type: 'number',
          description: 'Maximum number of results to return (1-20). Default: 5',
        },
        topic: {
          type: 'string',
          enum: ['general', 'news', 'finance'],
          description: 'Search topic category. "finance" optimizes for financial content. Default: "general"',
        },
        time_range: {
          type: 'string',
          enum: ['day', 'week', 'month', 'year', 'd', 'w', 'm', 'y'],
          description: 'Filter by time range. "day" = last 24h, "week" = last 7 days, "month" = last 30 days, "year" = last 12 months',
        },
        start_date: {
          type: 'string',
          description: 'Filter results from this date onwards (YYYY-MM-DD format)',
        },
        end_date: {
          type: 'string',
          description: 'Filter results up to this date (YYYY-MM-DD format)',
        },
        include_answer: {
          description: 'Include AI-generated answer. true/"basic" = quick answer, "advanced" = comprehensive answer. Default: false',
        },
        include_raw_content: {
          description: 'Include full page content. true/"text" = plain text, "markdown" = formatted. Default: false',
        },
        include_images: {
          type: 'boolean',
          description: 'Include image results. Default: false',
        },
        include_domains: {
          type: 'array',
          items: { type: 'string' },
          description: 'Only search these domains (e.g., ["reuters.com", "bloomberg.com"])',
        },
        exclude_domains: {
          type: 'array',
          items: { type: 'string' },
          description: 'Exclude these domains from search',
        },
        country: {
          type: 'string',
          description: 'Boost results from specific country (e.g., "US", "FR", "UK")',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'tavily_extract',
    description: 'Extract and rank content from specific URLs. Uses AI to find the most relevant chunks based on optional query. Perfect for extracting key information from known URLs like financial reports, articles, or documentation.',
    input_schema: {
      type: 'object',
      properties: {
        urls: {
          description: 'URL or array of URLs to extract from (1-10 URLs recommended)',
        },
        query: {
          type: 'string',
          description: 'Query to rank/filter extracted content chunks (e.g., "revenue growth" to find relevant sections)',
        },
        chunks_per_source: {
          type: 'number',
          description: 'Max relevant chunks per URL. Default: 3',
        },
        extract_depth: {
          type: 'string',
          enum: ['basic', 'advanced'],
          description: 'Extraction depth. "advanced" = more thorough. Default: "basic"',
        },
        include_images: {
          type: 'boolean',
          description: 'Include images from pages. Default: false',
        },
        format: {
          type: 'string',
          enum: ['markdown', 'text'],
          description: 'Content format. Default: "markdown"',
        },
        timeout: {
          type: 'number',
          description: 'Timeout in seconds per URL. Default: system optimized',
        },
      },
      required: ['urls'],
    },
  },
  {
    name: 'tavily_crawl',
    description: 'Graph-based intelligent website crawling with content extraction. Explores multiple paths in parallel using AI-guided discovery. Perfect for extracting comprehensive data from documentation sites, blogs, or knowledge bases.',
    input_schema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'Root URL to start crawling',
        },
        instructions: {
          type: 'string',
          description: 'Natural language instructions to guide the crawl (e.g., "focus on product documentation pages")',
        },
        max_depth: {
          type: 'number',
          description: 'Maximum link depth from root. Default: 1',
        },
        max_breadth: {
          type: 'number',
          description: 'Max links to follow per level. Default: 20',
        },
        limit: {
          type: 'number',
          description: 'Total URLs to process before stopping. Default: 50',
        },
        select_paths: {
          type: 'array',
          items: { type: 'string' },
          description: 'Regex patterns for URLs to include (e.g., ["/docs/.*", "/api/.*"])',
        },
        exclude_paths: {
          type: 'array',
          items: { type: 'string' },
          description: 'Regex patterns for URLs to exclude',
        },
        select_domains: {
          type: 'array',
          items: { type: 'string' },
          description: 'Regex patterns for domains to include',
        },
        exclude_domains: {
          type: 'array',
          items: { type: 'string' },
          description: 'Regex patterns for domains to exclude',
        },
        allow_external: {
          type: 'boolean',
          description: 'Allow external domain links in results. Default: true',
        },
        extract_depth: {
          type: 'string',
          enum: ['basic', 'advanced'],
          description: 'Content extraction depth. Default: "basic"',
        },
        format: {
          type: 'string',
          enum: ['markdown', 'text'],
          description: 'Content format. Default: "markdown"',
        },
        timeout: {
          type: 'number',
          description: 'Total timeout in seconds. Default: 150',
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'tavily_map',
    description: 'Fast site mapping to discover all URLs without extracting content. Explores website structure in parallel using graph traversal. Perfect for discovering site architecture, finding specific page patterns, or generating sitemaps.',
    input_schema: {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'Website URL to map',
        },
        instructions: {
          type: 'string',
          description: 'Natural language instructions for mapping (e.g., "find all product pages")',
        },
        max_depth: {
          type: 'number',
          description: 'Maximum depth to traverse. Default: 1',
        },
        max_breadth: {
          type: 'number',
          description: 'Max links per level. Default: 20',
        },
        limit: {
          type: 'number',
          description: 'Total links to process. Default: 50',
        },
        select_paths: {
          type: 'array',
          items: { type: 'string' },
          description: 'Regex patterns for paths to include',
        },
        exclude_paths: {
          type: 'array',
          items: { type: 'string' },
          description: 'Regex patterns for paths to exclude',
        },
        allow_external: {
          type: 'boolean',
          description: 'Include external links. Default: true',
        },
        timeout: {
          type: 'number',
          description: 'Timeout in seconds. Default: 150',
        },
      },
      required: ['url'],
    },
  },
  {
    name: 'tavily_research',
    description: 'Autonomous AI research agent that conducts comprehensive research on any topic. Performs multiple searches, analyzes sources, synthesizes information, and generates a detailed research report with citations. Perfect for in-depth research tasks, competitive analysis, market research, or academic inquiries.',
    input_schema: {
      type: 'object',
      properties: {
        input: {
          type: 'string',
          description: 'Research question or topic (e.g., "What are the latest trends in renewable energy investment?", "Comprehensive analysis of AI chip market")',
        },
        model: {
          type: 'string',
          enum: ['mini', 'pro', 'auto'],
          description: 'Research model. "mini" = fast & cost-effective, "pro" = most thorough, "auto" = adaptive. Default: "auto"',
        },
        output_schema: {
          type: 'object',
          description: 'JSON schema to structure research output (e.g., {type: "object", properties: {summary: {type: "string"}, key_findings: {type: "array"}}})',
        },
        citation_format: {
          type: 'string',
          enum: ['numbered', 'mla', 'apa', 'chicago'],
          description: 'Citation format for sources. Default: "numbered"',
        },
      },
      required: ['input'],
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
  {
    name: 'get_income_statement_ttm',
    description: 'Get trailing twelve months (TTM) income statement data.',
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
    name: 'get_balance_sheet_ttm',
    description: 'Get TTM balance sheet data.',
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
    name: 'get_cashflow_statement_ttm',
    description: 'Get TTM cash flow statement data.',
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
    name: 'get_key_metrics_ttm',
    description: 'Get TTM key financial metrics.',
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
    name: 'get_ratios_ttm',
    description: 'Get TTM financial ratios.',
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
    name: 'get_financial_scores',
    description: 'Get financial health scores including Altman Z-Score and Piotroski Score.',
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
    name: 'get_owner_earnings',
    description: 'Get owner earnings (cash available to shareholders after capital expenditures).',
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
    name: 'get_enterprise_values',
    description: 'Get enterprise value (market cap + debt - cash) for valuation.',
    input_schema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Stock ticker symbol',
        },
        period: {
          type: 'string',
          description: 'Period: "annual" or "quarter" (default: annual)',
        },
        limit: {
          type: 'number',
          description: 'Number of periods (default: 5)',
        },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'get_revenue_product_segmentation',
    description: 'Get revenue breakdown by product lines.',
    input_schema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Stock ticker symbol',
        },
        period: {
          type: 'string',
          description: 'Period: "annual" or "quarter" (default: annual)',
        },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'get_revenue_geographic_segmentation',
    description: 'Get revenue breakdown by geographic regions.',
    input_schema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Stock ticker symbol',
        },
        period: {
          type: 'string',
          description: 'Period: "annual" or "quarter" (default: annual)',
        },
      },
      required: ['symbol'],
    },
  },
  // ==================== ECONOMIC & DIVIDEND TOOLS ====================
  {
    name: 'get_market_risk_premium',
    description: 'Get market risk premium for different countries for investment analysis.',
    input_schema: {
      type: 'object',
      properties: {
        country: {
          type: 'string',
          description: 'Country name (optional - gets all if not specified)',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_dividends_company',
    description: 'Get complete dividend history for a company.',
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
    name: 'get_dividends_calendar',
    description: 'Get upcoming dividend payment calendar across all stocks.',
    input_schema: {
      type: 'object',
      properties: {
        from: {
          type: 'string',
          description: 'Start date (YYYY-MM-DD) - optional',
        },
        to: {
          type: 'string',
          description: 'End date (YYYY-MM-DD) - optional',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_earnings_report',
    description: 'Get earnings report data with EPS and revenue for a company.',
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
    name: 'get_ipo_disclosures',
    description: 'Get IPO disclosure filings and dates.',
    input_schema: {
      type: 'object',
      properties: {
        from: {
          type: 'string',
          description: 'Start date (YYYY-MM-DD) - optional',
        },
        to: {
          type: 'string',
          description: 'End date (YYYY-MM-DD) - optional',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_ipo_prospectus',
    description: 'Get IPO prospectus data with offering prices and proceeds.',
    input_schema: {
      type: 'object',
      properties: {
        from: {
          type: 'string',
          description: 'Start date (YYYY-MM-DD) - optional',
        },
        to: {
          type: 'string',
          description: 'End date (YYYY-MM-DD) - optional',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_splits',
    description: 'Get stock split history for a company.',
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
    name: 'get_splits_calendar',
    description: 'Get upcoming stock splits calendar.',
    input_schema: {
      type: 'object',
      properties: {
        from: {
          type: 'string',
          description: 'Start date (YYYY-MM-DD) - optional',
        },
        to: {
          type: 'string',
          description: 'End date (YYYY-MM-DD) - optional',
        },
      },
      required: [],
    },
  },
  // ==================== NEWS & TRANSCRIPTS TOOLS ====================
  {
    name: 'get_latest_earning_transcripts',
    description: 'Get list of latest available earning call transcripts.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_earning_call_transcript_dates',
    description: 'Get available dates for earning call transcripts for a specific company.',
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
    name: 'get_fmp_articles',
    description: 'Get latest articles from Financial Modeling Prep.',
    input_schema: {
      type: 'object',
      properties: {
        page: {
          type: 'number',
          description: 'Page number (default: 0)',
        },
        limit: {
          type: 'number',
          description: 'Results per page (default: 20)',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_general_news',
    description: 'Get latest general financial news from various sources.',
    input_schema: {
      type: 'object',
      properties: {
        page: {
          type: 'number',
          description: 'Page number (default: 0)',
        },
        limit: {
          type: 'number',
          description: 'Results per page (default: 20)',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_press_releases_latest',
    description: 'Get latest press releases from companies.',
    input_schema: {
      type: 'object',
      properties: {
        page: {
          type: 'number',
          description: 'Page number (default: 0)',
        },
        limit: {
          type: 'number',
          description: 'Results per page (default: 20)',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_stock_news_latest',
    description: 'Get latest stock-specific news articles.',
    input_schema: {
      type: 'object',
      properties: {
        page: {
          type: 'number',
          description: 'Page number (default: 0)',
        },
        limit: {
          type: 'number',
          description: 'Results per page (default: 20)',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_crypto_news',
    description: 'Get latest cryptocurrency news.',
    input_schema: {
      type: 'object',
      properties: {
        page: {
          type: 'number',
          description: 'Page number (default: 0)',
        },
        limit: {
          type: 'number',
          description: 'Results per page (default: 20)',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_forex_news',
    description: 'Get latest forex market news.',
    input_schema: {
      type: 'object',
      properties: {
        page: {
          type: 'number',
          description: 'Page number (default: 0)',
        },
        limit: {
          type: 'number',
          description: 'Results per page (default: 20)',
        },
      },
      required: [],
    },
  },
  {
    name: 'search_press_releases_new',
    description: 'Search press releases by stock symbols.',
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
    name: 'search_stock_news',
    description: 'Search stock news by symbols.',
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
    name: 'search_crypto_news',
    description: 'Search crypto news by symbols.',
    input_schema: {
      type: 'object',
      properties: {
        symbols: {
          type: 'string',
          description: 'Crypto symbols',
        },
      },
      required: ['symbols'],
    },
  },
  {
    name: 'search_forex_news',
    description: 'Search forex news by currency pairs.',
    input_schema: {
      type: 'object',
      properties: {
        symbols: {
          type: 'string',
          description: 'Currency pairs',
        },
      },
      required: ['symbols'],
    },
  },
  // ==================== FORM 13F & INSTITUTIONAL OWNERSHIP ====================
  {
    name: 'get_institutional_ownership_filings',
    description: 'Get latest Form 13F institutional ownership filings.',
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
    name: 'extract_sec_filings',
    description: 'Extract detailed data from SEC 13F filings by CIK and period.',
    input_schema: {
      type: 'object',
      properties: {
        cik: {
          type: 'string',
          description: 'SEC CIK number',
        },
        year: {
          type: 'number',
          description: 'Year',
        },
        quarter: {
          type: 'number',
          description: 'Quarter (1-4)',
        },
      },
      required: ['cik', 'year', 'quarter'],
    },
  },
  {
    name: 'get_form_13f_filings_dates',
    description: 'Get available Form 13F filing dates for an institutional holder.',
    input_schema: {
      type: 'object',
      properties: {
        cik: {
          type: 'string',
          description: 'SEC CIK number',
        },
      },
      required: ['cik'],
    },
  },
  {
    name: 'get_filings_extract_with_analytics',
    description: 'Get 13F filings with analytical insights for a specific stock.',
    input_schema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Stock ticker symbol',
        },
        year: {
          type: 'number',
          description: 'Year',
        },
        quarter: {
          type: 'number',
          description: 'Quarter (1-4)',
        },
        page: {
          type: 'number',
          description: 'Page number (default: 0)',
        },
        limit: {
          type: 'number',
          description: 'Results per page (default: 10)',
        },
      },
      required: ['symbol', 'year', 'quarter'],
    },
  },
  {
    name: 'get_holder_performance_summary',
    description: 'Get performance summary for institutional holders.',
    input_schema: {
      type: 'object',
      properties: {
        cik: {
          type: 'string',
          description: 'SEC CIK number',
        },
        page: {
          type: 'number',
          description: 'Page number (default: 0)',
        },
      },
      required: ['cik'],
    },
  },
  {
    name: 'get_holders_industry_breakdown',
    description: 'Get industry breakdown of institutional holder portfolios.',
    input_schema: {
      type: 'object',
      properties: {
        cik: {
          type: 'string',
          description: 'SEC CIK number',
        },
        year: {
          type: 'number',
          description: 'Year',
        },
        quarter: {
          type: 'number',
          description: 'Quarter (1-4)',
        },
      },
      required: ['cik', 'year', 'quarter'],
    },
  },
  {
    name: 'get_positions_summary',
    description: 'Get summary of institutional positions for a specific stock.',
    input_schema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Stock ticker symbol',
        },
        year: {
          type: 'number',
          description: 'Year',
        },
        quarter: {
          type: 'number',
          description: 'Quarter (1-4)',
        },
      },
      required: ['symbol', 'year', 'quarter'],
    },
  },
  {
    name: 'get_industry_performance_summary',
    description: 'Get performance summary by industry sector.',
    input_schema: {
      type: 'object',
      properties: {
        year: {
          type: 'number',
          description: 'Year',
        },
        quarter: {
          type: 'number',
          description: 'Quarter (1-4)',
        },
      },
      required: ['year', 'quarter'],
    },
  },
  // ==================== ANALYST RATINGS & ESTIMATES ====================
  {
    name: 'get_ratings_snapshot',
    description: 'Get current analyst ratings and scores snapshot.',
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
    name: 'get_historical_ratings',
    description: 'Get historical analyst ratings and rating changes.',
    input_schema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Stock ticker symbol',
        },
        limit: {
          type: 'number',
          description: 'Number of records (default: 100)',
        },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'get_price_target_consensus',
    description: 'Get consensus price target (high, low, median, consensus).',
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
    name: 'get_grades',
    description: 'Get analyst grades (Buy, Hold, Sell ratings) for a stock.',
    input_schema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Stock ticker symbol',
        },
        limit: {
          type: 'number',
          description: 'Number of grades (default: 100)',
        },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'get_historical_grades',
    description: 'Get historical analyst grade changes.',
    input_schema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Stock ticker symbol',
        },
        limit: {
          type: 'number',
          description: 'Number of records (default: 100)',
        },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'get_grades_summary',
    description: 'Get summary of analyst grades (count by rating type).',
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
  // ==================== MARKET PERFORMANCE & SECTORS ====================
  {
    name: 'get_market_sector_performance_snapshot',
    description: 'Get current performance snapshot across all market sectors.',
    input_schema: {
      type: 'object',
      properties: {
        date: {
          type: 'string',
          description: 'Date (YYYY-MM-DD) - optional',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_industry_performance_snapshot',
    description: 'Get current performance snapshot across all industries.',
    input_schema: {
      type: 'object',
      properties: {
        date: {
          type: 'string',
          description: 'Date (YYYY-MM-DD) - optional',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_historical_sector_performance',
    description: 'Get historical performance data for a sector.',
    input_schema: {
      type: 'object',
      properties: {
        sector: {
          type: 'string',
          description: 'Sector name',
        },
        limit: {
          type: 'number',
          description: 'Number of records (default: 100)',
        },
      },
      required: ['sector'],
    },
  },
  {
    name: 'get_historical_industry_performance',
    description: 'Get historical performance data for an industry.',
    input_schema: {
      type: 'object',
      properties: {
        industry: {
          type: 'string',
          description: 'Industry name',
        },
        limit: {
          type: 'number',
          description: 'Number of records (default: 100)',
        },
      },
      required: ['industry'],
    },
  },
  {
    name: 'get_sector_pe_snapshot',
    description: 'Get P/E ratio snapshot for all sectors.',
    input_schema: {
      type: 'object',
      properties: {
        date: {
          type: 'string',
          description: 'Date (YYYY-MM-DD) - optional',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_industry_pe_snapshot',
    description: 'Get P/E ratio snapshot for all industries.',
    input_schema: {
      type: 'object',
      properties: {
        date: {
          type: 'string',
          description: 'Date (YYYY-MM-DD) - optional',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_historical_sector_pe',
    description: 'Get historical P/E ratios for a sector.',
    input_schema: {
      type: 'object',
      properties: {
        sector: {
          type: 'string',
          description: 'Sector name',
        },
        limit: {
          type: 'number',
          description: 'Number of records (default: 100)',
        },
      },
      required: ['sector'],
    },
  },
  {
    name: 'get_historical_industry_pe',
    description: 'Get historical P/E ratios for an industry.',
    input_schema: {
      type: 'object',
      properties: {
        industry: {
          type: 'string',
          description: 'Industry name',
        },
        limit: {
          type: 'number',
          description: 'Number of records (default: 100)',
        },
      },
      required: ['industry'],
    },
  },
  // ==================== ADDITIONAL TECHNICAL INDICATORS ====================
  {
    name: 'get_wma',
    description: 'Get Weighted Moving Average (WMA) - weighted average giving more importance to recent prices.',
    input_schema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Stock ticker symbol',
        },
        periodLength: {
          type: 'number',
          description: 'Period length (default: 10)',
        },
        timeframe: {
          type: 'string',
          description: 'Timeframe: "1day", "1week", "1month" (default: 1day)',
        },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'get_dema',
    description: 'Get Double Exponential Moving Average (DEMA) - reduces lag of traditional moving averages.',
    input_schema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Stock ticker symbol',
        },
        periodLength: {
          type: 'number',
          description: 'Period length (default: 10)',
        },
        timeframe: {
          type: 'string',
          description: 'Timeframe: "1day", "1week", "1month" (default: 1day)',
        },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'get_tema',
    description: 'Get Triple Exponential Moving Average (TEMA) - minimizes lag even further than DEMA.',
    input_schema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Stock ticker symbol',
        },
        periodLength: {
          type: 'number',
          description: 'Period length (default: 10)',
        },
        timeframe: {
          type: 'string',
          description: 'Timeframe: "1day", "1week", "1month" (default: 1day)',
        },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'get_standard_deviation',
    description: 'Get Standard Deviation - measures volatility and price dispersion.',
    input_schema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Stock ticker symbol',
        },
        periodLength: {
          type: 'number',
          description: 'Period length (default: 10)',
        },
        timeframe: {
          type: 'string',
          description: 'Timeframe: "1day", "1week", "1month" (default: 1day)',
        },
      },
      required: ['symbol'],
    },
  },
  // ==================== ETF & MUTUAL FUNDS ====================
  {
    name: 'get_etf_asset_exposure',
    description: 'Get which ETFs hold a specific stock and their exposure.',
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
    name: 'get_mutual_fund_disclosure_latest',
    description: 'Get latest mutual fund disclosure filings.',
    input_schema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Fund symbol',
        },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'get_mutual_fund_disclosure',
    description: 'Get specific mutual fund disclosure by period.',
    input_schema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Fund symbol',
        },
        year: {
          type: 'number',
          description: 'Year',
        },
        quarter: {
          type: 'number',
          description: 'Quarter (1-4)',
        },
      },
      required: ['symbol', 'year', 'quarter'],
    },
  },
  {
    name: 'get_mutual_fund_disclosure_search',
    description: 'Search mutual fund disclosures by name.',
    input_schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Fund name to search',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'get_mutual_fund_disclosure_dates',
    description: 'Get available disclosure dates for a mutual fund.',
    input_schema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Fund symbol',
        },
      },
      required: ['symbol'],
    },
  },
  // ==================== SEC FILINGS - ADVANCED ====================
  {
    name: 'get_latest_8k_sec_filings',
    description: 'Get latest 8-K SEC filings (material corporate events).',
    input_schema: {
      type: 'object',
      properties: {
        from: {
          type: 'string',
          description: 'Start date (YYYY-MM-DD)',
        },
        to: {
          type: 'string',
          description: 'End date (YYYY-MM-DD)',
        },
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
    name: 'get_latest_sec_filings',
    description: 'Get latest SEC financial filings (10-K, 10-Q, etc.).',
    input_schema: {
      type: 'object',
      properties: {
        from: {
          type: 'string',
          description: 'Start date (YYYY-MM-DD)',
        },
        to: {
          type: 'string',
          description: 'End date (YYYY-MM-DD)',
        },
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
    name: 'get_sec_filings_by_form_type',
    description: 'Search SEC filings by form type (10-K, 10-Q, 8-K, etc.).',
    input_schema: {
      type: 'object',
      properties: {
        formType: {
          type: 'string',
          description: 'Form type (e.g., "10-K", "10-Q", "8-K")',
        },
        from: {
          type: 'string',
          description: 'Start date (YYYY-MM-DD)',
        },
        to: {
          type: 'string',
          description: 'End date (YYYY-MM-DD)',
        },
        page: {
          type: 'number',
          description: 'Page number (default: 0)',
        },
        limit: {
          type: 'number',
          description: 'Results per page (default: 100)',
        },
      },
      required: ['formType'],
    },
  },
  {
    name: 'get_sec_filings_by_symbol',
    description: 'Get all SEC filings for a specific company.',
    input_schema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Stock ticker symbol',
        },
        from: {
          type: 'string',
          description: 'Start date (YYYY-MM-DD)',
        },
        to: {
          type: 'string',
          description: 'End date (YYYY-MM-DD)',
        },
        page: {
          type: 'number',
          description: 'Page number (default: 0)',
        },
        limit: {
          type: 'number',
          description: 'Results per page (default: 100)',
        },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'get_sec_filings_by_cik',
    description: 'Get SEC filings by CIK number.',
    input_schema: {
      type: 'object',
      properties: {
        cik: {
          type: 'string',
          description: 'SEC CIK number',
        },
        from: {
          type: 'string',
          description: 'Start date (YYYY-MM-DD)',
        },
        to: {
          type: 'string',
          description: 'End date (YYYY-MM-DD)',
        },
        page: {
          type: 'number',
          description: 'Page number (default: 0)',
        },
        limit: {
          type: 'number',
          description: 'Results per page (default: 100)',
        },
      },
      required: ['cik'],
    },
  },
  {
    name: 'get_sec_filings_by_name',
    description: 'Search companies by name for SEC filings.',
    input_schema: {
      type: 'object',
      properties: {
        company: {
          type: 'string',
          description: 'Company name',
        },
      },
      required: ['company'],
    },
  },
  {
    name: 'get_sec_filings_company_search_by_symbol',
    description: 'Find company SEC filing information by ticker symbol.',
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
    name: 'get_sec_filings_company_search_by_cik',
    description: 'Find company information by CIK for SEC filings.',
    input_schema: {
      type: 'object',
      properties: {
        cik: {
          type: 'string',
          description: 'SEC CIK number',
        },
      },
      required: ['cik'],
    },
  },
  {
    name: 'get_sec_company_full_profile',
    description: 'Get comprehensive SEC company profile with all details.',
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
    name: 'get_industry_classification_list',
    description: 'Get list of SIC (Standard Industrial Classification) codes.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'search_industry_classification',
    description: 'Search industry classifications by title or SIC code.',
    input_schema: {
      type: 'object',
      properties: {
        industryTitle: {
          type: 'string',
          description: 'Industry title to search',
        },
        sicCode: {
          type: 'string',
          description: 'SIC code to search',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_all_industry_classification',
    description: 'Get complete industry classification data.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  // ==================== INSIDER TRADES - ADVANCED ====================
  {
    name: 'get_latest_insider_trading',
    description: 'Get latest insider trading transactions across all companies.',
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
    name: 'search_insider_trades',
    description: 'Search insider trades by symbol, company name, or reporting name.',
    input_schema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Stock ticker symbol',
        },
        companyName: {
          type: 'string',
          description: 'Company name',
        },
        reportingName: {
          type: 'string',
          description: 'Insider name',
        },
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
    name: 'search_insider_trades_by_name',
    description: 'Search insider trades by specific reporting person name.',
    input_schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Reporting person name',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'get_all_insider_transaction_types',
    description: 'Get list of all insider transaction types with descriptions.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_acquisition_of_beneficial_ownership',
    description: 'Get beneficial ownership acquisitions and changes for a stock.',
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
  // ==================== INDEXES ====================
  {
    name: 'get_index_list',
    description: 'Get list of all stock market indexes.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_sp500_constituent',
    description: 'Get current S&P 500 constituent companies.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_nasdaq_constituent',
    description: 'Get current NASDAQ composite constituent companies.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_dow_jones_constituent',
    description: 'Get current Dow Jones Industrial Average constituent companies.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_historical_sp500_constituent',
    description: 'Get historical S&P 500 constituent changes (additions/removals).',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_historical_nasdaq_constituent',
    description: 'Get historical NASDAQ constituent changes.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_historical_dow_jones_constituent',
    description: 'Get historical Dow Jones constituent changes.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_exchange_market_hours',
    description: 'Get trading hours for a specific exchange.',
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
    name: 'get_holidays_by_exchange',
    description: 'Get holiday schedule for an exchange.',
    input_schema: {
      type: 'object',
      properties: {
        exchange: {
          type: 'string',
          description: 'Exchange name',
        },
      },
      required: ['exchange'],
    },
  },
  {
    name: 'get_all_exchange_market_hours',
    description: 'Get trading hours for all exchanges.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  // ==================== COMMODITIES ====================
  {
    name: 'get_commodities_list',
    description: 'Get list of all available commodities.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  // ==================== DCF VALUATION ====================
  {
    name: 'get_dcf_valuation',
    description: 'Get Discounted Cash Flow (DCF) valuation for a stock.',
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
    name: 'get_levered_dcf',
    description: 'Get Levered DCF valuation (accounts for debt).',
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
    name: 'get_custom_dcf',
    description: 'Get custom DCF valuation with user-defined parameters.',
    input_schema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Stock ticker symbol',
        },
        years: {
          type: 'number',
          description: 'Projection years',
        },
        growthRate: {
          type: 'number',
          description: 'Growth rate',
        },
        discountRate: {
          type: 'number',
          description: 'Discount rate',
        },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'get_custom_levered_dcf',
    description: 'Get custom levered DCF with user-defined parameters.',
    input_schema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Stock ticker symbol',
        },
        years: {
          type: 'number',
          description: 'Projection years',
        },
        growthRate: {
          type: 'number',
          description: 'Growth rate',
        },
        discountRate: {
          type: 'number',
          description: 'Discount rate',
        },
      },
      required: ['symbol'],
    },
  },
  // ==================== FOREX ====================
  {
    name: 'get_forex_currency_pairs',
    description: 'Get list of all available forex currency pairs.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  // ==================== SENATE & HOUSE TRADING ====================
  {
    name: 'get_latest_senate_disclosures',
    description: 'Get latest US Senate stock trading disclosures.',
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
    name: 'get_latest_house_disclosures',
    description: 'Get latest US House of Representatives stock trading disclosures.',
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
    name: 'get_senate_trades_symbol',
    description: 'Get Senate trading activity for a specific stock.',
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
    name: 'get_senate_trades_by_name',
    description: 'Get Senate trading activity by senator name.',
    input_schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Senator name',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'get_house_trades_symbol',
    description: 'Get House trading activity for a specific stock.',
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
    name: 'get_house_trades_by_name',
    description: 'Get House trading activity by representative name.',
    input_schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Representative name',
        },
      },
      required: ['name'],
    },
  },
  // ==================== ESG ====================
  {
    name: 'get_esg_disclosures',
    description: 'Get ESG disclosures and detailed ESG data.',
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
    name: 'get_esg_ratings',
    description: 'Get ESG ratings (Environmental, Social, Governance scores).',
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
    name: 'get_esg_benchmark',
    description: 'Get ESG benchmark data for comparison.',
    input_schema: {
      type: 'object',
      properties: {
        year: {
          type: 'number',
          description: 'Year for benchmark',
        },
      },
      required: [],
    },
  },
  // ==================== COT ====================
  {
    name: 'get_cot_list',
    description: 'Get list of available Commitment of Traders (COT) reports.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  // ==================== CROWDFUNDING & EQUITY OFFERINGS ====================
  {
    name: 'get_latest_crowdfunding_campaigns',
    description: 'Get latest crowdfunding campaigns and offerings.',
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
    name: 'search_crowdfunding_campaigns',
    description: 'Search crowdfunding campaigns by name.',
    input_schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Campaign name to search',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'get_crowdfunding_by_cik',
    description: 'Get crowdfunding campaigns by company CIK.',
    input_schema: {
      type: 'object',
      properties: {
        cik: {
          type: 'string',
          description: 'SEC CIK number',
        },
      },
      required: ['cik'],
    },
  },
  {
    name: 'get_equity_offering_updates',
    description: 'Get latest equity offering updates.',
    input_schema: {
      type: 'object',
      properties: {
        page: {
          type: 'number',
          description: 'Page number (default: 0)',
        },
        limit: {
          type: 'number',
          description: 'Results per page (default: 10)',
        },
      },
      required: [],
    },
  },
  {
    name: 'search_equity_offerings',
    description: 'Search equity offerings by company name.',
    input_schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Company name',
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'get_company_equity_offerings_by_cik',
    description: 'Get equity offerings by company CIK.',
    input_schema: {
      type: 'object',
      properties: {
        cik: {
          type: 'string',
          description: 'SEC CIK number',
        },
      },
      required: ['cik'],
    },
  },
  // ==================== BULK APIs (for large-scale data) ====================
  {
    name: 'get_gainers',
    description: 'Get biggest stock price gainers of the day.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_losers',
    description: 'Get biggest stock price losers of the day.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_actives',
    description: 'Get most actively traded stocks by volume.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
];

export { AVAILABLE_TOOLS };
