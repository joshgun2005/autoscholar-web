import type { ClaudeToolDefinition } from './types';

export const MACRO_DATA_TOOLS: ClaudeToolDefinition[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // WORLD BANK API — Development Data (16,000+ indicators, 200+ countries)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'get_wb_indicator_data',
    description: 'Gets World Bank indicator time-series data for one or more countries. Returns development data such as GDP, population, poverty rates, CO2 emissions, literacy rates, etc. Supports 16,000+ indicators across 200+ countries. No API key needed. Common indicators: SP.POP.TOTL (population), NY.GDP.MKTP.CD (GDP current US$), NY.GNP.PCAP.CD (GNI per capita), SI.POV.DDAY (poverty $1.90/day), FP.CPI.TOTL.ZG (inflation %), SL.UEM.TOTL.ZS (unemployment %), EN.ATM.CO2E.PC (CO2 per capita), SE.ADT.LITR.ZS (literacy rate).',
    input_schema: {
      type: 'object',
      properties: {
        country_code: {
          type: 'string',
          description: 'ISO2/ISO3 country code(s), semicolon-separated (e.g., "US;FR;CN"), or "all" for all countries. Also accepts aggregate codes: WLD (World), EAP (East Asia), ECA (Europe & Central Asia), LAC (Latin America), MNA (Middle East & N. Africa), NAC (North America), SAS (South Asia), SSA (Sub-Saharan Africa).',
        },
        indicator_code: {
          type: 'string',
          description: 'World Bank indicator code (e.g., "SP.POP.TOTL", "NY.GDP.MKTP.CD"). Use search_wb_indicators to find codes.',
        },
        date_range: {
          type: 'string',
          description: 'Year or year range (e.g., "2020", "2010:2023"). Optional.',
        },
        mrv: {
          type: 'number',
          description: 'Most Recent Values — returns the last N data points. Optional.',
        },
        mrnev: {
          type: 'number',
          description: 'Most Recent Non-Empty Values — returns the last N non-null data points. Optional.',
        },
        frequency: {
          type: 'string',
          description: 'Data frequency: "Y" (yearly), "Q" (quarterly), "M" (monthly). Default: yearly.',
        },
        source: {
          type: 'number',
          description: 'Source database ID (e.g., 2 = World Development Indicators). Optional.',
        },
      },
      required: ['country_code', 'indicator_code'],
    },
  },
  {
    name: 'get_wb_countries',
    description: 'Gets World Bank country metadata including region, income level, lending type, capital city, and coordinates. Can filter by income level or region.',
    input_schema: {
      type: 'object',
      properties: {
        country_code: {
          type: 'string',
          description: 'ISO2/ISO3 country code(s), semicolon-separated (e.g., "US;FR;BR"). Optional — omit for all countries.',
        },
        income_level: {
          type: 'string',
          description: 'Filter by income level: HIC (high), UMC (upper middle), LMC (lower middle), LIC (low). Optional.',
        },
        region: {
          type: 'string',
          description: 'Filter by region code (e.g., EAP, LCN, ECA, SSA). Optional.',
        },
      },
      required: [],
    },
  },
  {
    name: 'search_wb_indicators',
    description: 'Searches World Bank indicators by keyword to find indicator codes. Returns indicator ID, name, source, and description. Use this to discover indicator codes before calling get_wb_indicator_data.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search keyword (e.g., "GDP", "population", "CO2 emissions", "poverty", "literacy", "inflation")',
        },
        topic_id: {
          type: 'number',
          description: 'Filter by topic ID: 1=Agriculture, 3=Economy & Growth, 4=Education, 5=Energy, 6=Environment, 7=Financial Sector, 8=Health, 11=Poverty, 13=Public Sector, 14=Science & Technology, 19=Climate Change, 21=Trade. Optional.',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_wb_topics',
    description: 'Gets the list of all 21 World Bank thematic topics under which indicators are organized (Agriculture, Economy & Growth, Education, Health, Climate Change, etc.).',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_wb_regions',
    description: 'Gets the list of all World Bank regions with their codes.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_wb_income_levels',
    description: 'Gets the list of World Bank income level classifications (High income, Upper middle income, Lower middle income, Low income).',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_wb_sources',
    description: 'Gets the list of all World Bank data sources/databases (World Development Indicators, International Debt Statistics, Gender Statistics, etc.).',
    input_schema: {
      type: 'object',
      properties: {
        source_id: {
          type: 'number',
          description: 'Specific source ID to get details. Common: 2=WDI, 6=Intl Debt Stats, 12=Education Stats, 14=Gender Stats, 16=Health Stats. Optional.',
        },
      },
      required: [],
    },
  },
  // ═══════════════════════════════════════════════════════════════════════════
  // IMF API — International Monetary Fund (WEO, IFS, BOP, CPI, etc.)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'get_imf_indicator_data',
    description: 'Gets IMF DataMapper indicator data for one or more countries. Returns macroeconomic data from the World Economic Outlook (WEO) and other IMF databases. Common indicators: NGDP_RPCH (real GDP growth %), PCPIPCH (inflation avg %), LUR (unemployment %), BCA_NGDPD (current account % GDP), GGXWDG_NGDP (govt gross debt % GDP), NGDPD (GDP current $B), NGDPDPC (GDP per capita $), PPPPC (GDP per capita PPP), PPPSH (share of world GDP PPP), LP (population millions). No API key needed.',
    input_schema: {
      type: 'object',
      properties: {
        indicator_id: {
          type: 'string',
          description: 'IMF indicator code (e.g., "NGDP_RPCH" for real GDP growth, "PCPIPCH" for inflation). Use get_imf_indicators to discover codes.',
        },
        countries: {
          type: 'string',
          description: 'ISO3 country code(s), slash-separated (e.g., "USA", "USA/CHN/DEU"). Omit for all countries.',
        },
        periods: {
          type: 'string',
          description: 'Comma-separated years (e.g., "2020,2021,2022,2023,2024"). Optional.',
        },
      },
      required: ['indicator_id'],
    },
  },
  {
    name: 'get_imf_indicators',
    description: 'Lists all available IMF DataMapper indicators with their codes, labels, descriptions, and units. Use this to discover indicator codes for get_imf_indicator_data.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_imf_countries',
    description: 'Lists all countries available in the IMF DataMapper with their 3-letter codes.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    name: 'get_imf_dataflows',
    description: 'Lists available IMF SDMX datasets (dataflows) like CPI, IFS, BOP, DOT, etc. Use for discovering datasets available via the advanced SDMX 3.0 API.',
    input_schema: {
      type: 'object',
      properties: {
        dataflow_id: {
          type: 'string',
          description: 'Specific dataflow ID (e.g., "CPI", "IFS", "BOP"). Omit for all dataflows.',
        },
      },
      required: [],
    },
  },
  {
    name: 'get_imf_sdmx_data',
    description: 'Gets IMF data via the SDMX 3.0 API for advanced multi-dimensional queries (CPI, IFS, BOP, etc.). Requires constructing a dimension key. Returns CSV data. Example: dataflow "CPI", key "BRA.CPI._T.IX.M" returns Brazil monthly CPI index. Use get_imf_dataflows and get_imf_data_structure to discover the key format.',
    input_schema: {
      type: 'object',
      properties: {
        dataflow_id: {
          type: 'string',
          description: 'Dataset ID (e.g., "CPI", "IFS", "BOP", "DOT")',
        },
        key: {
          type: 'string',
          description: 'Dimension key with dots separating values (e.g., "BRA.CPI._T.IX.M"). Use + for multiple values in a dimension (e.g., "BRA+CHL"). Leave blank between dots for wildcard.',
        },
        time_period_filter: {
          type: 'string',
          description: 'Time filter (e.g., "ge:2020-M01" for >= Jan 2020, "ge:2020" for >= 2020). Optional.',
        },
      },
      required: ['dataflow_id', 'key'],
    },
  },
  {
    name: 'get_imf_data_structure',
    description: 'Gets the dimension structure of an IMF SDMX dataset. Returns the ordered list of dimensions needed to construct a data query key. Use this to understand what dimensions a dataset requires before calling get_imf_sdmx_data.',
    input_schema: {
      type: 'object',
      properties: {
        datastructure_id: {
          type: 'string',
          description: 'DataStructure ID (e.g., "DSD_CPI" for CPI, "DSD_IFS" for IFS). Usually "DSD_" + dataflow ID.',
        },
      },
      required: ['datastructure_id'],
    },
  },
  {
    name: 'get_imf_codelist',
    description: 'Gets valid codes for a specific dimension of an IMF SDMX dataset. Use after get_imf_data_structure to find valid values for each dimension (e.g., country codes, frequency codes).',
    input_schema: {
      type: 'object',
      properties: {
        codelist_id: {
          type: 'string',
          description: 'Codelist ID from the DataStructure response (e.g., "CL_COUNTRY_CPI", "CL_FREQ").',
        },
      },
      required: ['codelist_id'],
    },
  },
  // ═══════════════════════════════════════════════════════════════════════════
  // OECD API — SDMX (1,475+ dataflows: economics, health, education, environment)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    name: 'get_oecd_data',
    description: 'Gets OECD statistical data via SDMX API. Returns CSV with labels. Requires agency ID, dataflow ID, and a dot-separated dimension filter. Key datasets: CLI (Composite Leading Indicators) = OECD.SDD.STES / DSD_STES@DF_CLI, GDP National Accounts = OECD.SDD.NAD / DSD_NAAG@DF_NAAG_I. Use search_oecd_dataflows to discover datasets and get_oecd_dataflow_structure to understand dimension order before querying. No API key needed.',
    input_schema: {
      type: 'object',
      properties: {
        agency_id: {
          type: 'string',
          description: 'Agency ID (e.g., "OECD.SDD.STES", "OECD.SDD.NAD", "OECD.ENV.EPI", "OECD.ELS.HD")',
        },
        dataflow_id: {
          type: 'string',
          description: 'Dataflow ID (e.g., "DSD_STES@DF_CLI", "DSD_NAAG@DF_NAAG_I")',
        },
        filter: {
          type: 'string',
          description: 'Dot-separated dimension filter in DSD order (e.g., "FRA.M.LI...AA...H" for France monthly CLI). Use + for multiple values (e.g., "FRA+DEU"). Leave segments empty for wildcard. Use "all" for everything.',
        },
        start_period: {
          type: 'string',
          description: 'Start period inclusive (e.g., "2020", "2020-Q1", "2020-M01"). Optional.',
        },
        end_period: {
          type: 'string',
          description: 'End period inclusive. Optional.',
        },
        last_n_observations: {
          type: 'number',
          description: 'Return only the last N observations per series. Optional.',
        },
        version: {
          type: 'string',
          description: 'Dataflow version (e.g., "1.0"). Optional — defaults to latest.',
        },
      },
      required: ['agency_id', 'dataflow_id', 'filter'],
    },
  },
  {
    name: 'search_oecd_dataflows',
    description: 'Searches OECD dataflows (datasets) by keyword. Returns matching dataset IDs, agency IDs, and names. Use this to discover available datasets before querying data.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search keyword (e.g., "GDP", "health", "education", "tax", "trade", "inflation", "employment", "climate")',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_oecd_dataflow_structure',
    description: 'Gets the structure (dimensions, codelists, attributes) of an OECD dataset. Returns the ordered list of dimensions needed to construct a data filter, plus valid codes for each dimension. Essential step before calling get_oecd_data.',
    input_schema: {
      type: 'object',
      properties: {
        agency_id: {
          type: 'string',
          description: 'Agency ID (e.g., "OECD.SDD.STES")',
        },
        dataflow_id: {
          type: 'string',
          description: 'Dataflow ID (e.g., "DSD_STES@DF_CLI")',
        },
        version: {
          type: 'string',
          description: 'Version (e.g., "1.0"). Optional.',
        },
      },
      required: ['agency_id', 'dataflow_id'],
    },
  },
  {
    name: 'get_oecd_dataflows',
    description: 'Lists all available OECD dataflows (1,475+ datasets). Returns simplified list with ID, agency, version, and name.',
    input_schema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
];
