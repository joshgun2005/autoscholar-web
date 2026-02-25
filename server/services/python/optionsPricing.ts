import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Determine Python executable path - use venv if available
const PYTHON_PATH = process.env.PYTHON_PATH ||
                    path.join(process.cwd(), '.venv', 'bin', 'python') ||
                    'python3';


export interface OptionsPricingInput {
  symbol?: string;  // NEW: Automatically fetch data from FMP API
  stock_price?: number;  // ALTERNATIVE: Manual mode
  strike_price: number;
  time_to_maturity: number;  // in years
  risk_free_rate?: number;   // default 0.05 (5%)
  volatility?: number;        // annualized volatility (e.g., 0.3 for 30%)
  option_type?: 'call' | 'put';
}

export interface OptionGreeks {
  delta: number;
  gamma: number;
  theta: number;
  vega: number;
  rho: number;
}

export interface OptionResult {
  price: number;
  intrinsic_value: number;
  time_value: number;
  greeks: OptionGreeks;
  moneyness: string;
}

export interface OptionsPricingResult {
  success: boolean;
  error?: string;
  parameters?: {
    stock_price: number;
    strike_price: number;
    time_to_maturity: number;
    risk_free_rate: number;
    volatility: number;
    option_type: string;
  };
  call_option?: OptionResult;
  put_option?: OptionResult;
  parity_check?: {
    call_minus_put: number;
    stock_minus_pv_strike: number;
    parity_holds: boolean;
  };
}

export interface OptionsPricingExecutionResult {
  success: boolean;
  result?: OptionsPricingResult;
  code: string;
  error?: string;
}

/**
 * Validate options pricing input
 */
function validateOptionInput(input: OptionsPricingInput): { valid: boolean; error?: string } {
  // Check if either symbol or stock_price is provided
  if (!input.symbol && !input.stock_price) {
    return { valid: false, error: 'Either symbol or stock_price must be provided' };
  }

  // If stock_price provided, validate it
  if (input.stock_price !== undefined && (typeof input.stock_price !== 'number' || input.stock_price <= 0)) {
    return { valid: false, error: 'stock_price must be a positive number' };
  }

  // If symbol provided, validate it
  if (input.symbol && typeof input.symbol !== 'string') {
    return { valid: false, error: 'symbol must be a string' };
  }

  if (typeof input.strike_price !== 'number' || input.strike_price <= 0) {
    return { valid: false, error: 'strike_price must be a positive number' };
  }

  if (typeof input.time_to_maturity !== 'number' || input.time_to_maturity <= 0) {
    return { valid: false, error: 'time_to_maturity must be a positive number (in years)' };
  }

  if (input.risk_free_rate !== undefined && (typeof input.risk_free_rate !== 'number' || input.risk_free_rate < 0)) {
    return { valid: false, error: 'risk_free_rate must be a non-negative number' };
  }

  if (input.volatility !== undefined && (typeof input.volatility !== 'number' || input.volatility <= 0)) {
    return { valid: false, error: 'volatility must be a positive number' };
  }

  if (input.option_type && !['call', 'put'].includes(input.option_type)) {
    return { valid: false, error: 'option_type must be "call" or "put"' };
  }

  return { valid: true };
}

/**
 * Execute Black-Scholes options pricing calculation
 */
export async function executeOptionsPricing(
  input: OptionsPricingInput
): Promise<OptionsPricingExecutionResult> {
  try {
    // Validate input
    const validation = validateOptionInput(input);
    if (!validation.valid) {
      return {
        success: false,
        code: generateOptionsPricingCode(input),
        error: validation.error
      };
    }

    const pythonScriptPath = path.join(__dirname, 'optionsPricingService.py');
    const inputJson = JSON.stringify(input);

    return new Promise((resolve) => {
      const pythonProcess = spawn(PYTHON_PATH, [pythonScriptPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: process.env
      });

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0 || (stderr && !stdout)) {
          resolve({
            success: false,
            code: generateOptionsPricingCode(input),
            error: stderr || `Python process exited with code ${code}`
          });
          return;
        }

        try {
          const result = JSON.parse(stdout) as OptionsPricingResult;
          resolve({
            success: result.success,
            result,
            code: generateOptionsPricingCode(input),
            error: result.error
          });
        } catch (parseError) {
          resolve({
            success: false,
            code: generateOptionsPricingCode(input),
            error: 'Failed to parse Python output: ' + (parseError instanceof Error ? parseError.message : 'Unknown error')
          });
        }
      });

      pythonProcess.on('error', (error) => {
        resolve({
          success: false,
          code: generateOptionsPricingCode(input),
          error: 'Failed to start Python process: ' + error.message
        });
      });

      pythonProcess.stdin.write(inputJson);
      pythonProcess.stdin.end();
    });
  } catch (error) {
    return {
      success: false,
      code: generateOptionsPricingCode(input),
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Generate readable Python code for display
 */
function generateOptionsPricingCode(input: OptionsPricingInput): string {
  const K = input.strike_price;
  const T = input.time_to_maturity;
  const r = input.risk_free_rate || 0.05;
  const optionType = input.option_type || 'call';

  if (input.symbol) {
    // Generate code for symbol-based mode
    const sigmaCode = input.volatility
      ? `sigma = ${input.volatility}  # Provided volatility`
      : `# Calculate 30-day historical volatility
recent_prices = closing_prices[-30:] if len(closing_prices) >= 30 else closing_prices
sigma = calculate_historical_volatility(recent_prices, annualize=True)
print(f"Calculated 30-day historical volatility: {sigma*100:.2f}%")`;

    return `import math
from scipy import stats
from fmpClient import get_historical_prices, get_stock_quote, calculate_historical_volatility

# Fetch market data for ${input.symbol}
symbol = '${input.symbol}'
print(f"Fetching market data for {symbol}...")

# Get current stock price
quote = get_stock_quote(symbol)
S = quote['price']
print(f"Current stock price: $\\{S:.2f}")

# Get historical prices
hist_data = get_historical_prices(symbol)
closing_prices = [h['close'] for h in reversed(hist_data['historical'])]

# Calculate or use provided volatility
${sigmaCode}

# Black-Scholes Option Pricing Parameters
K = ${K}  # Strike price
T = ${T}  # Time to maturity (years)
r = ${r}  # Risk-free rate

# Calculate d1 and d2
d1 = (math.log(S / K) + (r + 0.5 * sigma ** 2) * T) / (sigma * math.sqrt(T))
d2 = d1 - sigma * math.sqrt(T)

# Calculate Call Option Price
call_price = S * stats.norm.cdf(d1) - K * math.exp(-r * T) * stats.norm.cdf(d2)

# Calculate Put Option Price
put_price = K * math.exp(-r * T) * stats.norm.cdf(-d2) - S * stats.norm.cdf(-d1)

# Calculate Greeks
# Delta
call_delta = stats.norm.cdf(d1)
put_delta = call_delta - 1

# Gamma (same for call and put)
gamma = stats.norm.pdf(d1) / (S * sigma * math.sqrt(T))

# Vega (same for call and put)
vega = S * stats.norm.pdf(d1) * math.sqrt(T) / 100

# Theta
call_theta = (-(S * stats.norm.pdf(d1) * sigma) / (2 * math.sqrt(T))
              - r * K * math.exp(-r * T) * stats.norm.cdf(d2)) / 365

put_theta = (-(S * stats.norm.pdf(d1) * sigma) / (2 * math.sqrt(T))
             + r * K * math.exp(-r * T) * stats.norm.cdf(-d2)) / 365

# Rho
call_rho = K * T * math.exp(-r * T) * stats.norm.cdf(d2) / 100
put_rho = -K * T * math.exp(-r * T) * stats.norm.cdf(-d2) / 100

print(f"Call Option Price: $\\{call_price:.4f}")
print(f"Put Option Price: $\\{put_price:.4f}")
print(f"\\nCall Greeks:")
print(f"  Delta: \\{call_delta:.4f}")
print(f"  Gamma: \\{gamma:.4f}")
print(f"  Theta: \\{call_theta:.4f}")
print(f"  Vega: \\{vega:.4f}")
print(f"  Rho: \\{call_rho:.4f}")
print(f"\\nPut Greeks:")
print(f"  Delta: \\{put_delta:.4f}")
print(f"  Gamma: \\{gamma:.4f}")
print(f"  Theta: \\{put_theta:.4f}")
print(f"  Vega: \\{vega:.4f}")
print(f"  Rho: \\{put_rho:.4f}")`;
  } else {
    // Generate code for manual mode
    const S = input.stock_price;
    const sigma = input.volatility || 0.3;

    return `import math
from scipy import stats

# Black-Scholes Option Pricing Parameters
S = ${S}  # Current stock price
K = ${K}  # Strike price
T = ${T}  # Time to maturity (years)
r = ${r}  # Risk-free rate
sigma = ${sigma}  # Volatility (annualized)

# Calculate d1 and d2
d1 = (math.log(S / K) + (r + 0.5 * sigma ** 2) * T) / (sigma * math.sqrt(T))
d2 = d1 - sigma * math.sqrt(T)

# Calculate Call Option Price
call_price = S * stats.norm.cdf(d1) - K * math.exp(-r * T) * stats.norm.cdf(d2)

# Calculate Put Option Price
put_price = K * math.exp(-r * T) * stats.norm.cdf(-d2) - S * stats.norm.cdf(-d1)

# Calculate Greeks
# Delta
call_delta = stats.norm.cdf(d1)
put_delta = call_delta - 1

# Gamma (same for call and put)
gamma = stats.norm.pdf(d1) / (S * sigma * math.sqrt(T))

# Vega (same for call and put)
vega = S * stats.norm.pdf(d1) * math.sqrt(T) / 100

# Theta
call_theta = (-(S * stats.norm.pdf(d1) * sigma) / (2 * math.sqrt(T))
              - r * K * math.exp(-r * T) * stats.norm.cdf(d2)) / 365

put_theta = (-(S * stats.norm.pdf(d1) * sigma) / (2 * math.sqrt(T))
             + r * K * math.exp(-r * T) * stats.norm.cdf(-d2)) / 365

# Rho
call_rho = K * T * math.exp(-r * T) * stats.norm.cdf(d2) / 100
put_rho = -K * T * math.exp(-r * T) * stats.norm.cdf(-d2) / 100

print(f"Call Option Price: $\\{call_price:.4f}")
print(f"Put Option Price: $\\{put_price:.4f}")
print(f"\\nCall Greeks:")
print(f"  Delta: \\{call_delta:.4f}")
print(f"  Gamma: \\{gamma:.4f}")
print(f"  Theta: \\{call_theta:.4f}")
print(f"  Vega: \\{vega:.4f}")
print(f"  Rho: \\{call_rho:.4f}")
print(f"\\nPut Greeks:")
print(f"  Delta: \\{put_delta:.4f}")
print(f"  Gamma: \\{gamma:.4f}")
print(f"  Theta: \\{put_theta:.4f}")
print(f"  Vega: \\{vega:.4f}")
print(f"  Rho: \\{put_rho:.4f}")`;
  }
}

// ============================================================================
// GARCH Volatility Model
// ============================================================================

