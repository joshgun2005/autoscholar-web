import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { PYTHON_PATH, PYTHON_ENV } from './shared';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface PortfolioOptimizerInput {
  symbols: string[];
  risk_free_rate?: number;
  min_weight?: number;
  max_weight?: number;
  data_period?: number;
  generate_frontier?: boolean;
  frontier_points?: number;
}

export interface PortfolioAllocation {
  description: string;
  allocation: Record<string, number>;
  expected_return: number;
  volatility: number;
  sharpe_ratio: number;
  optimization_success?: boolean;
}

export interface PortfolioOptimizerResult {
  success: boolean;
  error?: string;
  symbols?: string[];
  parameters?: {
    num_assets: number;
    risk_free_rate: number;
    min_weight: number;
    max_weight: number;
    data_points: number;
    data_period_days: number;
  };
  asset_statistics?: Record<string, {
    expected_return: number;
    volatility: number;
    sharpe_ratio: number;
  }>;
  correlation_matrix?: Record<string, Record<string, number>>;
  optimal_portfolios?: {
    max_sharpe_ratio: PortfolioAllocation;
    min_volatility: PortfolioAllocation;
    equal_weight: PortfolioAllocation;
  };
  efficient_frontier?: {
    returns: number[];
    volatilities: number[];
    sharpe_ratios: number[];
  };
  interpretation?: {
    diversification_benefit: number;
    notes: string[];
  };
}

export interface PortfolioOptimizerExecutionResult {
  success: boolean;
  result?: PortfolioOptimizerResult;
  code: string;
  error?: string;
}

function validatePortfolioInput(input: PortfolioOptimizerInput): { valid: boolean; error?: string } {
  if (!input.symbols || !Array.isArray(input.symbols) || input.symbols.length < 2) {
    return { valid: false, error: 'At least 2 symbols are required' };
  }

  if (input.risk_free_rate !== undefined && (input.risk_free_rate < 0 || input.risk_free_rate > 1)) {
    return { valid: false, error: 'risk_free_rate must be between 0 and 1' };
  }

  if (input.min_weight !== undefined && (input.min_weight < 0 || input.min_weight > 1)) {
    return { valid: false, error: 'min_weight must be between 0 and 1' };
  }

  if (input.max_weight !== undefined && (input.max_weight < 0 || input.max_weight > 1)) {
    return { valid: false, error: 'max_weight must be between 0 and 1' };
  }

  return { valid: true };
}

export async function executePortfolioOptimization(
  input: PortfolioOptimizerInput
): Promise<PortfolioOptimizerExecutionResult> {
  try {
    const validation = validatePortfolioInput(input);
    if (!validation.valid) {
      return {
        success: false,
        code: generatePortfolioCode(input),
        error: validation.error
      };
    }

    const pythonScriptPath = path.join(__dirname, 'portfolioOptimizer.py');
    const inputJson = JSON.stringify(input);

    return new Promise((resolve) => {
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
            code: generatePortfolioCode(input),
            error: stderr || `Python process exited with code ${code}`
          });
          return;
        }

        try {
          const result = JSON.parse(stdout) as PortfolioOptimizerResult;
          resolve({
            success: result.success,
            result,
            code: generatePortfolioCode(input),
            error: result.error
          });
        } catch (parseError) {
          resolve({
            success: false,
            code: generatePortfolioCode(input),
            error: 'Failed to parse Python output: ' + (parseError instanceof Error ? parseError.message : 'Unknown error')
          });
        }
      });

      pythonProcess.on('error', (error) => {
        resolve({
          success: false,
          code: generatePortfolioCode(input),
          error: 'Failed to start Python process: ' + error.message
        });
      });

      pythonProcess.stdin.write(inputJson);
      pythonProcess.stdin.end();
    });
  } catch (error) {
    return {
      success: false,
      code: generatePortfolioCode(input),
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

function generatePortfolioCode(input: PortfolioOptimizerInput): string {
  const riskFreeRate = input.risk_free_rate || 0.02;
  const symbols = input.symbols || [];

  return `import numpy as np
import pandas as pd
from scipy.optimize import minimize
from fmpClient import get_historical_prices

# Portfolio assets
symbols = ${JSON.stringify(symbols)}
risk_free_rate = ${riskFreeRate}

# Fetch historical data for all symbols
prices_dict = {}
for symbol in symbols:
    print(f"Fetching data for {symbol}...")
    hist_data = get_historical_prices(symbol)
    prices = [h['close'] for h in reversed(hist_data['historical'])]
    dates = [h['date'] for h in reversed(hist_data['historical'])]
    prices_dict[symbol] = pd.Series(prices, index=pd.to_datetime(dates))

# Create DataFrame and calculate returns
prices_df = pd.DataFrame(prices_dict).dropna()
returns_df = prices_df.pct_change().dropna()

# Calculate mean returns (annualized) and covariance matrix
mean_returns = returns_df.mean() * 252
cov_matrix = returns_df.cov() * 252

print("\\nExpected Annual Returns:")
for symbol, ret in mean_returns.items():
    print(f"  {symbol}: {ret*100:.2f}%")

# Portfolio optimization function
def portfolio_stats(weights):
    portfolio_return = np.sum(weights * mean_returns)
    portfolio_std = np.sqrt(np.dot(weights.T, np.dot(cov_matrix, weights)))
    return portfolio_return, portfolio_std

def negative_sharpe(weights):
    ret, std = portfolio_stats(weights)
    return -(ret - risk_free_rate) / std

# Constraints and bounds
constraints = {'type': 'eq', 'fun': lambda x: np.sum(x) - 1}
bounds = tuple((0, 1) for _ in range(len(symbols)))
init_guess = np.array([1/len(symbols)] * len(symbols))

# Optimize for maximum Sharpe ratio
result = minimize(negative_sharpe, init_guess, method='SLSQP',
                 bounds=bounds, constraints=constraints)

optimal_weights = result.x
opt_return, opt_std = portfolio_stats(optimal_weights)
sharpe = (opt_return - risk_free_rate) / opt_std

print("\\nOptimal Portfolio (Maximum Sharpe Ratio):")
for i, symbol in enumerate(symbols):
    print(f"  {symbol}: {optimal_weights[i]*100:.2f}%")
print(f"\\nExpected Return: {opt_return*100:.2f}%")
print(f"Volatility: {opt_std*100:.2f}%")
print(f"Sharpe Ratio: {sharpe:.4f}")`;
}
