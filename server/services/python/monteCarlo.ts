import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { PYTHON_PATH, PYTHON_ENV } from './shared';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface MonteCarloInput {
  symbol?: string;  // NEW: Automatically fetch data from FMP API
  historical_prices?: number[];  // ALTERNATIVE: Manual data mode
  num_simulations?: number;
  time_horizon?: number;
  initial_investment?: number;
}

export interface MonteCarloResult {
  success: boolean;
  error?: string;
  parameters?: {
    num_simulations: number;
    time_horizon: number;
    initial_investment: number;
    mean_return: number;
    std_return: number;
  };
  statistics?: {
    mean_final_value: number;
    median_final_value: number;
    std_final_value: number;
    min_final_value: number;
    max_final_value: number;
    percentile_5: number;
    percentile_25: number;
    percentile_75: number;
    percentile_95: number;
    probability_of_profit: number;
  };
  sample_paths?: number[][];
  final_values_distribution?: {
    bins: number[];
    counts: number[];
  };
}

export interface PythonExecutionResult {
  success: boolean;
  result?: MonteCarloResult;
  code: string;
  error?: string;
}

/**
 * Validate Monte Carlo input
 */
function validateInput(input: MonteCarloInput): { valid: boolean; error?: string } {
  // Check if either symbol or historical_prices is provided
  if (!input.symbol && !input.historical_prices) {
    return { valid: false, error: 'Either symbol or historical_prices must be provided' };
  }

  // If historical_prices provided, validate it
  if (input.historical_prices) {
    if (!Array.isArray(input.historical_prices)) {
      return { valid: false, error: 'historical_prices must be an array' };
    }

    if (input.historical_prices.length < 2) {
      return { valid: false, error: 'historical_prices must have at least 2 values' };
    }

    if (!input.historical_prices.every(p => typeof p === 'number' && !isNaN(p))) {
      return { valid: false, error: 'historical_prices must contain only valid numbers' };
    }
  }

  // If symbol provided, validate it
  if (input.symbol && typeof input.symbol !== 'string') {
    return { valid: false, error: 'symbol must be a string' };
  }
  
  if (input.num_simulations !== undefined && (input.num_simulations < 1 || input.num_simulations > 100000)) {
    return { valid: false, error: 'num_simulations must be between 1 and 100000' };
  }
  
  if (input.time_horizon !== undefined && (input.time_horizon < 1 || input.time_horizon > 10000)) {
    return { valid: false, error: 'time_horizon must be between 1 and 10000' };
  }
  
  if (input.initial_investment !== undefined && input.initial_investment <= 0) {
    return { valid: false, error: 'initial_investment must be greater than 0' };
  }
  
  return { valid: true };
}

/**
 * Execute Monte Carlo simulation using Python (secure spawn-based implementation)
 */
export async function executeMonteCarloSimulation(
  input: MonteCarloInput
): Promise<PythonExecutionResult> {
  try {
    // Validate input
    const validation = validateInput(input);
    if (!validation.valid) {
      return {
        success: false,
        code: generatePythonCode(input),
        error: validation.error
      };
    }
    
    const pythonScriptPath = path.join(__dirname, 'monteCarloService.py');
    const inputJson = JSON.stringify(input);
    
    return new Promise((resolve) => {
      // Use spawn without shell to prevent command injection
      const pythonProcess = spawn(PYTHON_PATH, [pythonScriptPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: PYTHON_ENV
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
            code: generatePythonCode(input),
            error: stderr || `Python process exited with code ${code}`
          });
          return;
        }
        
        try {
          const result = JSON.parse(stdout) as MonteCarloResult;
          resolve({
            success: result.success,
            result,
            code: generatePythonCode(input),
            error: result.error
          });
        } catch (parseError) {
          resolve({
            success: false,
            code: generatePythonCode(input),
            error: 'Failed to parse Python output: ' + (parseError instanceof Error ? parseError.message : 'Unknown error')
          });
        }
      });
      
      pythonProcess.on('error', (error) => {
        resolve({
          success: false,
          code: generatePythonCode(input),
          error: 'Failed to start Python process: ' + error.message
        });
      });
      
      // Write JSON to stdin (secure - no shell interpretation)
      pythonProcess.stdin.write(inputJson);
      pythonProcess.stdin.end();
    });
  } catch (error) {
    return {
      success: false,
      code: generatePythonCode(input),
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Generate readable Python code for display
 */
function generatePythonCode(input: MonteCarloInput): string {
  const numSims = input.num_simulations || 10000;
  const timeHorizon = input.time_horizon || 252;
  const initialInv = input.initial_investment || 10000;

  if (input.symbol) {
    // Generate code for symbol-based mode
    return `import numpy as np
from scipy import stats
import pandas as pd
from fmpClient import get_historical_prices

# Fetch historical prices from FMP API
symbol = '${input.symbol}'
print(f"Fetching historical prices for {symbol}...")
hist_data = get_historical_prices(symbol)
historical_prices = np.array([h['close'] for h in reversed(hist_data['historical'])])
print(f"Fetched {len(historical_prices)} historical prices")

# Simulation parameters
num_simulations = ${numSims}
time_horizon = ${timeHorizon}  # days
initial_investment = ${initialInv}

# Calculate daily returns
returns = np.diff(historical_prices) / historical_prices[:-1]
mean_return = np.mean(returns)
std_return = np.std(returns)

# Run Monte Carlo simulations
simulation_results = np.zeros((num_simulations, time_horizon))
final_values = np.zeros(num_simulations)

for i in range(num_simulations):
    # Generate random returns based on historical distribution
    daily_returns = np.random.normal(mean_return, std_return, time_horizon)

    # Calculate price path
    price_path = initial_investment * np.cumprod(1 + daily_returns)
    simulation_results[i] = price_path
    final_values[i] = price_path[-1]

# Calculate statistics
mean_final_value = np.mean(final_values)
median_final_value = np.median(final_values)
std_final_value = np.std(final_values)

# Calculate percentiles
percentile_5 = np.percentile(final_values, 5)
percentile_95 = np.percentile(final_values, 95)

# Calculate probability of profit
prob_profit = np.sum(final_values > initial_investment) / num_simulations * 100

print(f"Mean Final Value: $${'{'}mean_final_value:,.2f{'}'}")
print(f"Median Final Value: $${'{'}median_final_value:,.2f{'}'}")
print(f"5th Percentile: $${'{'}percentile_5:,.2f{'}'}")
print(f"95th Percentile: $${'{'}percentile_95:,.2f{'}'}")
print(f"Probability of Profit: ${'{'}prob_profit:.2f{'}'}%")`;
  } else {
    // Generate code for manual historical_prices mode
    const historicalPrices = input.historical_prices || [];
    return `import numpy as np
from scipy import stats
import pandas as pd

# Historical prices from FMP data
historical_prices = np.array(${JSON.stringify(historicalPrices)})

# Simulation parameters
num_simulations = ${numSims}
time_horizon = ${timeHorizon}  # days
initial_investment = ${initialInv}

# Calculate daily returns
returns = np.diff(historical_prices) / historical_prices[:-1]
mean_return = np.mean(returns)
std_return = np.std(returns)

# Run Monte Carlo simulations
simulation_results = np.zeros((num_simulations, time_horizon))
final_values = np.zeros(num_simulations)

for i in range(num_simulations):
    # Generate random returns based on historical distribution
    daily_returns = np.random.normal(mean_return, std_return, time_horizon)
    
    # Calculate price path
    price_path = initial_investment * np.cumprod(1 + daily_returns)
    simulation_results[i] = price_path
    final_values[i] = price_path[-1]

# Calculate statistics
mean_final_value = np.mean(final_values)
median_final_value = np.median(final_values)
std_final_value = np.std(final_values)

# Calculate percentiles
percentile_5 = np.percentile(final_values, 5)
percentile_95 = np.percentile(final_values, 95)

# Calculate probability of profit
prob_profit = np.sum(final_values > initial_investment) / num_simulations * 100

print(f"Mean Final Value: $${'{'}mean_final_value:,.2f{'}'}")
print(f"Median Final Value: $${'{'}median_final_value:,.2f{'}'}")
print(f"5th Percentile: $${'{'}percentile_5:,.2f{'}'}")
print(f"95th Percentile: $${'{'}percentile_95:,.2f{'}'}")
print(f"Probability of Profit: ${'{'}prob_profit:.2f{'}'}%")`;
  }
}

// ============================================================================
// Options Pricing with Black-Scholes Model
// ============================================================================

