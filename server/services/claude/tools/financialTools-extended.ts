import type { ClaudeToolDefinition } from './types';

/** Financial tools part 3: Extended API (financial data variants, bulk, advanced search) */
export const FINANCIAL_TOOLS_PART3: ClaudeToolDefinition[] = [
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
          description: 'Number of periods (default: 20). Use 40 for research papers',
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
];
