import type { ClaudeToolDefinition } from './types';

/** Financial tools part 4: Advanced (technical indicators, prediction, crowdfunding, download) */
export const FINANCIAL_TOOLS_PART4: ClaudeToolDefinition[] = [
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
