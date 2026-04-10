import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { PYTHON_PATH, PYTHON_ENV } from './shared';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface RiskMetricsInput {
  symbol: string;
  benchmark_symbol?: string;
  risk_free_rate?: number;
  data_period?: number;
}

export interface RiskMetricsResult {
  success: boolean;
  error?: string;
  symbol?: string;
  benchmark?: string;
  parameters?: {
    risk_free_rate: number;
    data_points: number;
    data_period_days: number;
    start_date: string;
    end_date: string;
  };
  return_metrics?: {
    annualized_return: number;
    annualized_volatility: number;
    benchmark_return: number;
    benchmark_volatility: number;
    excess_return: number;
  };
  risk_adjusted_metrics?: {
    sharpe_ratio: number;
    sortino_ratio: number;
    calmar_ratio: number;
    information_ratio: number;
    treynor_ratio: number;
  };
  market_metrics?: {
    beta: number;
    alpha_annualized: number;
    correlation: number;
    tracking_error: number;
    r_squared: number;
  };
  drawdown_metrics?: {
    max_drawdown_pct: number;
    max_drawdown_start_idx: number;
    max_drawdown_end_idx: number;
    recovery_days: number;
    currently_in_drawdown: boolean;
    current_drawdown_pct: number;
  };
  capture_ratios?: {
    upside_capture_pct: number;
    downside_capture_pct: number;
    capture_ratio: number;
  };
  trading_statistics?: {
    win_rate_pct: number;
    average_win_pct: number;
    average_loss_pct: number;
    profit_factor: number;
    win_loss_ratio: number;
  };
  interpretation?: {
    risk_rating: string;
    performance_vs_benchmark: string;
    risk_adjusted_performance: string;
    market_sensitivity: string;
    notes: string[];
  };
}

export interface RiskMetricsExecutionResult {
  success: boolean;
  result?: RiskMetricsResult;
  code: string;
  error?: string;
}

function validateRiskMetricsInput(input: RiskMetricsInput): { valid: boolean; error?: string } {
  if (!input.symbol || typeof input.symbol !== 'string') {
    return { valid: false, error: 'symbol must be a string' };
  }

  if (input.risk_free_rate !== undefined && (input.risk_free_rate < 0 || input.risk_free_rate > 1)) {
    return { valid: false, error: 'risk_free_rate must be between 0 and 1' };
  }

  return { valid: true };
}

export async function executeRiskMetricsAnalysis(
  input: RiskMetricsInput
): Promise<RiskMetricsExecutionResult> {
  try {
    const validation = validateRiskMetricsInput(input);
    if (!validation.valid) {
      return {
        success: false,
        code: generateRiskMetricsCode(input),
        error: validation.error
      };
    }

    const pythonScriptPath = path.join(__dirname, 'riskMetrics.py');
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
            code: generateRiskMetricsCode(input),
            error: stderr || `Python process exited with code ${code}`
          });
          return;
        }

        try {
          const result = JSON.parse(stdout) as RiskMetricsResult;
          resolve({
            success: result.success,
            result,
            code: generateRiskMetricsCode(input),
            error: result.error
          });
        } catch (parseError) {
          resolve({
            success: false,
            code: generateRiskMetricsCode(input),
            error: 'Failed to parse Python output: ' + (parseError instanceof Error ? parseError.message : 'Unknown error')
          });
        }
      });

      pythonProcess.on('error', (error) => {
        resolve({
          success: false,
          code: generateRiskMetricsCode(input),
          error: 'Failed to start Python process: ' + error.message
        });
      });

      pythonProcess.stdin.write(inputJson);
      pythonProcess.stdin.end();
    });
  } catch (error) {
    return {
      success: false,
      code: generateRiskMetricsCode(input),
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

function generateRiskMetricsCode(input: RiskMetricsInput): string {
  const benchmarkSymbol = input.benchmark_symbol || 'SPY';
  const riskFreeRate = input.risk_free_rate || 0.02;

  return `import numpy as np
from fmpClient import get_historical_prices

# Fetch asset and benchmark data
asset_symbol = '${input.symbol}'
benchmark_symbol = '${benchmarkSymbol}'
risk_free_rate = ${riskFreeRate}

print(f"Fetching data for {asset_symbol}...")
asset_hist = get_historical_prices(asset_symbol)
asset_prices = np.array([h['close'] for h in reversed(asset_hist['historical'])])
asset_returns = np.diff(asset_prices) / asset_prices[:-1]

print(f"Fetching benchmark data for {benchmark_symbol}...")
benchmark_hist = get_historical_prices(benchmark_symbol)
benchmark_prices = np.array([h['close'] for h in reversed(benchmark_hist['historical'])])
benchmark_returns = np.diff(benchmark_prices) / benchmark_prices[:-1]

# Align returns
min_len = min(len(asset_returns), len(benchmark_returns))
asset_returns = asset_returns[-min_len:]
benchmark_returns = benchmark_returns[-min_len:]

# Calculate return metrics
asset_annual_return = np.mean(asset_returns) * 252
asset_volatility = np.std(asset_returns) * np.sqrt(252)
benchmark_annual_return = np.mean(benchmark_returns) * 252

print(f"\\nAnnualized Return: {asset_annual_return*100:.2f}%")
print(f"Annualized Volatility: {asset_volatility*100:.2f}%")

# Sharpe Ratio
sharpe = (asset_annual_return - risk_free_rate) / asset_volatility
print(f"Sharpe Ratio: {sharpe:.4f}")

# Beta and Alpha
covariance = np.cov(asset_returns, benchmark_returns)[0, 1]
benchmark_variance = np.var(benchmark_returns)
beta = covariance / benchmark_variance
alpha = asset_annual_return - (risk_free_rate + beta * (benchmark_annual_return - risk_free_rate))

print(f"\\nBeta: {beta:.4f}")
print(f"Alpha: {alpha*100:.2f}%")

# Maximum Drawdown
cummax = np.maximum.accumulate(asset_prices)
drawdown = (asset_prices - cummax) / cummax
max_drawdown = np.min(drawdown)

print(f"\\nMaximum Drawdown: {max_drawdown*100:.2f}%")

# Sortino Ratio (downside deviation)
downside_returns = asset_returns[asset_returns < 0]
downside_std = np.std(downside_returns) * np.sqrt(252)
sortino = (asset_annual_return - risk_free_rate) / downside_std if len(downside_returns) > 0 else 0
print(f"Sortino Ratio: {sortino:.4f}")

# Tracking Error
excess_returns = asset_returns - benchmark_returns
tracking_error = np.std(excess_returns) * np.sqrt(252)
print(f"Tracking Error: {tracking_error*100:.2f}%")

# Information Ratio
information_ratio = (np.mean(excess_returns) * 252) / tracking_error if tracking_error > 0 else 0
print(f"Information Ratio: {information_ratio:.4f}")`;
}
