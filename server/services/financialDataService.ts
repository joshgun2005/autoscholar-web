import axios from 'axios';

const FINANCIAL_DATA_API_KEY = process.env.FINANCIAL_DATA_API_KEY || 'a44ec329c25a58c0bff4947cb649eec3';
const FINANCIAL_DATA_BASE_URL = 'https://financialdata.net/api/v1';

// Option Chain Interface
export interface OptionContract {
  identifier: string;
  option_type: string; // 'call' or 'put'
  strike: number;
  expiration_date: string;
  last_price?: number;
  bid?: number;
  ask?: number;
  volume?: number;
  open_interest?: number;
  implied_volatility?: number;
}

export interface OptionChain {
  symbol: string;
  options: OptionContract[];
  timestamp?: string;
}

// Option Prices Interface
export interface OptionPrice {
  identifier: string;
  symbol: string;
  option_type: string;
  strike: number;
  expiration_date: string;
  last_price: number;
  bid: number;
  ask: number;
  bid_size?: number;
  ask_size?: number;
  volume: number;
  open_interest: number;
  implied_volatility: number;
  in_the_money: boolean;
  intrinsic_value: number;
  time_value: number;
  last_trade_date?: string;
  timestamp?: string;
}

// Option Greeks Interface
export interface OptionGreeks {
  identifier: string;
  symbol: string;
  option_type: string;
  strike: number;
  expiration_date: string;
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
  implied_volatility: number;
  theoretical_price?: number;
  timestamp?: string;
}

/**
 * Generic request function for Financial Data API
 */
async function financialDataRequest<T>(endpoint: string, params: Record<string, any> = {}): Promise<T> {
  if (!FINANCIAL_DATA_API_KEY) {
    throw new Error('FINANCIAL_DATA_API_KEY not configured');
  }

  try {
    console.log(`[Financial Data API] Requesting ${endpoint} with params:`, JSON.stringify(params));

    const response = await axios.get(`${FINANCIAL_DATA_BASE_URL}${endpoint}`, {
      params: {
        ...params,
        key: FINANCIAL_DATA_API_KEY,
      },
      timeout: 15000,
    });

    console.log(`[Financial Data API] Response for ${endpoint}:`,
      Array.isArray(response.data) ? `Array with ${response.data.length} items` : typeof response.data
    );

    return response.data;
  } catch (error) {
    console.error(`[Financial Data API] ERROR for ${endpoint}:`, error);
    if (axios.isAxiosError(error) && error.response) {
      console.error(`[Financial Data API] Response status: ${error.response.status}`);
      console.error(`[Financial Data API] Response data:`, JSON.stringify(error.response.data));
      throw new Error(`Financial Data API error: ${error.response.status} - ${error.response.statusText}. Details: ${JSON.stringify(error.response.data)}`);
    }
    throw new Error(`Failed to fetch from Financial Data API: ${(error as Error).message}`);
  }
}

/**
 * Get option chain for a stock symbol
 * Returns all available option contracts (calls and puts) with their identifiers
 *
 * @param symbol - Stock ticker symbol (e.g., "AAPL", "MSFT")
 * @returns Option chain with all available contracts
 */
export async function getOptionChain(symbol: string): Promise<OptionChain> {
  console.log(`[getOptionChain] Fetching option chain for symbol: ${symbol}`);

  const data = await financialDataRequest<any>('/option-chain', { identifier: symbol });

  // Map API response to our interface
  // API returns: contract_name, put_or_call, strike_price, expiration_date
  const rawOptions = data.options || data;

  console.log(`[getOptionChain] Processing ${rawOptions.length} option contracts`);

  const options = rawOptions.map((opt: any, index: number) => {
    // Log first 3 identifiers to understand the format
    if (index < 3) {
      console.log(`[getOptionChain] Sample identifier #${index + 1}:`, opt.contract_name);
    }

    return {
      identifier: opt.contract_name, // Map contract_name to identifier
      option_type: opt.put_or_call?.toLowerCase() || 'call', // Convert "Call"/"Put" to "call"/"put"
      strike: opt.strike_price || 0,
      expiration_date: opt.expiration_date || '',
      // Optional fields that may not be in the chain response
      last_price: opt.last_price,
      bid: opt.bid,
      ask: opt.ask,
      volume: opt.volume,
      open_interest: opt.open_interest,
      implied_volatility: opt.implied_volatility
    };
  });

  console.log(`[getOptionChain] Successfully mapped ${options.length} option contracts`);

  return {
    symbol: symbol,
    options: options,
    timestamp: data.timestamp || new Date().toISOString()
  };
}

/**
 * Get detailed option prices for a specific option contract
 *
 * @param identifier - Option contract identifier (e.g., "MSFT250417C00400000")
 *                     Format: SYMBOL + YYMMDD + C/P + Strike*1000
 * @returns Detailed pricing information for the option
 */
export async function getOptionPrices(identifier: string): Promise<OptionPrice> {
  console.log(`[getOptionPrices] Fetching prices for identifier: ${identifier}`);

  // Validate identifier format before making request
  const match = identifier.match(/^([A-Z]+)(\d{6})([CP])(\d{8})$/);
  if (!match) {
    console.warn(`[getOptionPrices] Invalid identifier format: ${identifier}`);
    console.warn(`[getOptionPrices] Expected format: SYMBOL + YYMMDD + C/P + Strike*1000 (e.g., "AAPL280121C00005000")`);
  }

  const data = await financialDataRequest<any>('/option-prices', { identifier });

  // API returns an array of historical prices, get the most recent one
  let latestData: any;
  if (Array.isArray(data)) {
    console.log(`[getOptionPrices] Received array with ${data.length} items`);
    if (data.length === 0) {
      throw new Error(
        `No price data found for option contract: ${identifier}. ` +
        `This may indicate that the contract identifier is invalid or the option has no recent trading data. ` +
        `Please verify the identifier format and try again.`
      );
    }
    // Sort by date descending and take the most recent
    latestData = data.sort((a: any, b: any) => {
      const dateA = new Date(a.date || 0).getTime();
      const dateB = new Date(b.date || 0).getTime();
      return dateB - dateA; // Descending order (most recent first)
    })[0];
    console.log(`[getOptionPrices] Using most recent data from: ${latestData.date}`);
  } else {
    console.log(`[getOptionPrices] Received single object`);
    latestData = data;
  }

  // Parse identifier to extract symbol, option_type, strike, and expiration
  // Format: SYMBOL + YYMMDD + C/P + Strike*1000 (e.g., "AAPL280121C00005000")
  // Note: match was already computed above during validation
  const symbol = match ? match[1] : identifier.substring(0, 4);
  const optionType = match ? (match[3] === 'C' ? 'call' : 'put') : 'call';
  const strike = match ? parseInt(match[4]) / 1000 : 0;
  const expirationDate = match ? `20${match[2].substring(0, 2)}-${match[2].substring(2, 4)}-${match[2].substring(4, 6)}` : '';

  // Calculate derived fields if not present
  const lastPrice = latestData.close || latestData.last_price || 0;
  const bid = latestData.bid || lastPrice * 0.99; // Estimate if not available
  const ask = latestData.ask || lastPrice * 1.01; // Estimate if not available
  const intrinsicValue = optionType === 'call'
    ? Math.max(0, lastPrice - strike)
    : Math.max(0, strike - lastPrice);
  const timeValue = Math.max(0, lastPrice - intrinsicValue);

  return {
    identifier: latestData.contract_name || identifier,
    symbol: symbol,
    option_type: optionType,
    strike: strike,
    expiration_date: expirationDate,
    last_price: lastPrice,
    bid: bid,
    ask: ask,
    bid_size: latestData.bid_size,
    ask_size: latestData.ask_size,
    volume: latestData.volume || 0,
    open_interest: latestData.open_interest || 0,
    implied_volatility: latestData.implied_volatility || 0,
    in_the_money: (optionType === 'call' && lastPrice > strike) || (optionType === 'put' && lastPrice < strike),
    intrinsic_value: intrinsicValue,
    time_value: timeValue,
    last_trade_date: latestData.date,
    timestamp: latestData.timestamp || new Date().toISOString()
  };
}

/**
 * Get option Greeks for a specific option contract
 * Greeks measure different risk sensitivities of options
 *
 * @param identifier - Option contract identifier (e.g., "MSFT250417C00400000")
 * @returns Greek values (Delta, Gamma, Theta, Vega, Rho) for the option
 */
export async function getOptionGreeks(identifier: string): Promise<OptionGreeks> {
  console.log(`[getOptionGreeks] Fetching Greeks for identifier: ${identifier}`);

  // Validate identifier format before making request
  const match = identifier.match(/^([A-Z]+)(\d{6})([CP])(\d{8})$/);
  if (!match) {
    console.warn(`[getOptionGreeks] Invalid identifier format: ${identifier}`);
    console.warn(`[getOptionGreeks] Expected format: SYMBOL + YYMMDD + C/P + Strike*1000 (e.g., "AAPL280121C00005000")`);
  }

  const data = await financialDataRequest<any>('/option-greeks', { identifier });

  // API returns an array of historical Greeks, get the most recent one
  let latestData: any;
  if (Array.isArray(data)) {
    console.log(`[getOptionGreeks] Received array with ${data.length} items`);
    if (data.length === 0) {
      throw new Error(
        `No Greeks data found for option contract: ${identifier}. ` +
        `This may indicate that the contract identifier is invalid or the option has no recent trading data. ` +
        `Please verify the identifier format and try again.`
      );
    }
    // Sort by date descending and take the most recent
    latestData = data.sort((a: any, b: any) => {
      const dateA = new Date(a.date || 0).getTime();
      const dateB = new Date(b.date || 0).getTime();
      return dateB - dateA; // Descending order (most recent first)
    })[0];
    console.log(`[getOptionGreeks] Using most recent data from: ${latestData.date}`);
  } else {
    console.log(`[getOptionGreeks] Received single object`);
    latestData = data;
  }

  // Parse identifier to extract symbol, option_type, strike, and expiration
  // Format: SYMBOL + YYMMDD + C/P + Strike*1000 (e.g., "AAPL280121C00005000")
  // Note: match was already computed above during validation
  const symbol = match ? match[1] : identifier.substring(0, 4);
  const optionType = match ? (match[3] === 'C' ? 'call' : 'put') : 'call';
  const strike = match ? parseInt(match[4]) / 1000 : 0;
  const expirationDate = match ? `20${match[2].substring(0, 2)}-${match[2].substring(2, 4)}-${match[2].substring(4, 6)}` : '';

  return {
    identifier: latestData.contract_name || identifier,
    symbol: symbol,
    option_type: optionType,
    strike: strike,
    expiration_date: expirationDate,
    delta: latestData.delta || 0,
    gamma: latestData.gamma || 0,
    theta: latestData.theta || 0,
    vega: latestData.vega || 0,
    rho: latestData.rho || 0,
    implied_volatility: latestData.implied_volatility || 0,
    theoretical_price: latestData.theoretical_price,
    timestamp: latestData.date || new Date().toISOString()
  };
}
