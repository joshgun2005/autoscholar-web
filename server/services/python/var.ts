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


export interface VarInput {
  symbol: string;
  portfolio_value?: number;
  confidence_levels?: number[];
  time_horizon?: number;
  num_simulations?: number;
  data_period?: number;
}

export interface VarByConfidence {
  confidence_level: number;
  historical: {
    var_percentage: number;
    var_dollar: number;
  };
  parametric: {
    var_percentage: number;
    var_dollar: number;
  };
  monte_carlo: {
    var_percentage: number;
    var_dollar: number;
  };
  conditional_var: {
    cvar_percentage: number;
    cvar_dollar: number;
  };
}

export interface VarResult {
  success: boolean;
  error?: string;
  symbol?: string;
  parameters?: {
    portfolio_value: number;
    time_horizon: number;
    time_horizon_description: string;
    num_simulations: number;
    data_points: number;
    data_period_days: number;
  };
  var_by_confidence?: Record<string, VarByConfidence>;
  distribution_statistics?: {
    mean_daily_return: number;
    std_daily_return: number;
    annual_return: number;
    annual_volatility: number;
    skewness: number;
    kurtosis: number;
    is_normally_distributed: boolean;
    jarque_bera_pvalue: number;
  };
  extreme_values?: {
    worst_daily_loss_pct: number;
    worst_daily_loss_dollar: number;
    best_daily_gain_pct: number;
    best_daily_gain_dollar: number;
  };
  interpretation?: {
    distribution_type: string;
    tail_risk: string;
    recommended_method: string;
    notes: string[];
  };
}

export interface VarExecutionResult {
  success: boolean;
  result?: VarResult;
  code: string;
  error?: string;
}

function validateVarInput(input: VarInput): { valid: boolean; error?: string } {
  if (!input.symbol || typeof input.symbol !== 'string') {
    return { valid: false, error: 'symbol must be a string' };
  }

  if (input.portfolio_value !== undefined && input.portfolio_value <= 0) {
    return { valid: false, error: 'portfolio_value must be positive' };
  }

  if (input.time_horizon !== undefined && (input.time_horizon < 1 || input.time_horizon > 252)) {
    return { valid: false, error: 'time_horizon must be between 1 and 252' };
  }

  if (input.num_simulations !== undefined && (input.num_simulations < 1000 || input.num_simulations > 100000)) {
    return { valid: false, error: 'num_simulations must be between 1000 and 100000' };
  }

  return { valid: true };
}

export async function executeVarCalculation(
  input: VarInput
): Promise<VarExecutionResult> {
  try {
    const validation = validateVarInput(input);
    if (!validation.valid) {
      return {
        success: false,
        code: generateVarCode(input),
        error: validation.error
      };
    }

    const pythonScriptPath = path.join(__dirname, 'varService.py');
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
            code: generateVarCode(input),
            error: stderr || `Python process exited with code ${code}`
          });
          return;
        }

        try {
          const result = JSON.parse(stdout) as VarResult;
          resolve({
            success: result.success,
            result,
            code: generateVarCode(input),
            error: result.error
          });
        } catch (parseError) {
          resolve({
            success: false,
            code: generateVarCode(input),
            error: 'Failed to parse Python output: ' + (parseError instanceof Error ? parseError.message : 'Unknown error')
          });
        }
      });

      pythonProcess.on('error', (error) => {
        resolve({
          success: false,
          code: generateVarCode(input),
          error: 'Failed to start Python process: ' + error.message
        });
      });

      pythonProcess.stdin.write(inputJson);
      pythonProcess.stdin.end();
    });
  } catch (error) {
    return {
      success: false,
      code: generateVarCode(input),
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

function generateVarCode(input: VarInput): string {
  const portfolioValue = input.portfolio_value || 100000;
  const confidenceLevels = input.confidence_levels || [0.90, 0.95, 0.99];
  const timeHorizon = input.time_horizon || 1;
  const numSims = input.num_simulations || 10000;

  return `import numpy as np
from scipy import stats
from fmpClient import get_historical_prices

# Fetch historical data for ${input.symbol}
symbol = '${input.symbol}'
print(f"Fetching historical prices for {symbol}...")
hist_data = get_historical_prices(symbol)
prices = np.array([h['close'] for h in reversed(hist_data['historical'])])

# Calculate daily returns
returns = np.diff(prices) / prices[:-1]

# Portfolio parameters
portfolio_value = ${portfolioValue}
confidence_levels = ${JSON.stringify(confidenceLevels)}
time_horizon = ${timeHorizon}  # days

# Scale returns for time horizon
if time_horizon > 1:
    returns_scaled = returns * np.sqrt(time_horizon)
else:
    returns_scaled = returns

# Calculate VaR using different methods
for conf_level in confidence_levels:
    # Historical VaR
    hist_var = -np.percentile(returns_scaled, (1 - conf_level) * 100)
    hist_var_dollar = hist_var * portfolio_value

    # Parametric VaR (assumes normal distribution)
    mean = np.mean(returns_scaled)
    std = np.std(returns_scaled)
    z_score = stats.norm.ppf(1 - conf_level)
    param_var = -(mean + z_score * std)
    param_var_dollar = param_var * portfolio_value

    # Monte Carlo VaR
    simulated = np.random.normal(mean, std, ${numSims})
    mc_var = -np.percentile(simulated, (1 - conf_level) * 100)
    mc_var_dollar = mc_var * portfolio_value

    # Conditional VaR (CVaR)
    var_threshold = -hist_var
    tail_losses = returns_scaled[returns_scaled <= var_threshold]
    cvar = -np.mean(tail_losses) if len(tail_losses) > 0 else hist_var
    cvar_dollar = cvar * portfolio_value

    print(f"\\n{int(conf_level*100)}% Confidence Level:")
    print(f"  Historical VaR: {hist_var*100:.2f}% ($\{hist_var_dollar:,.2f})")
    print(f"  Parametric VaR: {param_var*100:.2f}% ($\{param_var_dollar:,.2f})")
    print(f"  Monte Carlo VaR: {mc_var*100:.2f}% ($\{mc_var_dollar:,.2f})")
    print(f"  CVaR (Expected Shortfall): {cvar*100:.2f}% ($\{cvar_dollar:,.2f})")`;
}

// ============================================================================
// Portfolio Optimizer
// ============================================================================

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

// ============================================================================
// Risk Metrics Analyzer
// ============================================================================

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

// ============================================================================
// Plot Service - Customizable Data Visualization
// ============================================================================

export interface PlotInput {
  plot_type: 'line' | 'bar' | 'scatter' | 'histogram' | 'candlestick' | 'area' | 'pie' | 'heatmap';
  data: any; // Can be dict with x/y, multi-series, or symbol string
  title?: string;
  xlabel?: string;
  ylabel?: string;
  color?: string | string[];
  figsize?: [number, number];
  grid?: boolean;
  legend?: boolean;
  style?: '-' | '--' | '-.' | ':';
  marker?: 'o' | 's' | '^' | 'v' | 'D' | '*' | '+' | 'x';
  alpha?: number;
  theme?: 'default' | 'dark' | 'colorful';
}

export interface PlotResult {
  success: boolean;
  error?: string;
  plot_type?: string;
  image?: string; // Base64-encoded PNG
  format?: string;
  title?: string;
}

export interface PlotExecutionResult {
  success: boolean;
  result?: PlotResult;
  code: string;
  error?: string;
}

/**
 * Validate plot input
 */
function validatePlotInput(input: PlotInput): { valid: boolean; error?: string } {
  if (!input.plot_type) {
    return { valid: false, error: 'plot_type is required' };
  }

  const validPlotTypes = ['line', 'bar', 'scatter', 'histogram', 'candlestick', 'area', 'pie', 'heatmap'];
  if (!validPlotTypes.includes(input.plot_type)) {
    return { valid: false, error: `plot_type must be one of: ${validPlotTypes.join(', ')}` };
  }

  if (!input.data) {
    return { valid: false, error: 'data is required' };
  }

  if (input.alpha !== undefined && (input.alpha < 0 || input.alpha > 1)) {
    return { valid: false, error: 'alpha must be between 0 and 1' };
  }

  return { valid: true };
}

/**
 * Execute plot generation using Python
 */
export async function executePlot(
  input: PlotInput
): Promise<PlotExecutionResult> {
  try {
    // Validate input
    const validation = validatePlotInput(input);
    if (!validation.valid) {
      return {
        success: false,
        code: generatePlotCode(input),
        error: validation.error
      };
    }

    const pythonScriptPath = path.join(__dirname, 'plotService.py');
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
            code: generatePlotCode(input),
            error: stderr || `Python process exited with code ${code}`
          });
          return;
        }

        try {
          const result = JSON.parse(stdout) as PlotResult;
          resolve({
            success: result.success,
            result,
            code: generatePlotCode(input),
            error: result.error
          });
        } catch (parseError) {
          resolve({
            success: false,
            code: generatePlotCode(input),
            error: 'Failed to parse Python output: ' + (parseError instanceof Error ? parseError.message : 'Unknown error')
          });
        }
      });

      pythonProcess.on('error', (error) => {
        resolve({
          success: false,
          code: generatePlotCode(input),
          error: 'Failed to start Python process: ' + error.message
        });
      });

      pythonProcess.stdin.write(inputJson);
      pythonProcess.stdin.end();
    });
  } catch (error) {
    return {
      success: false,
      code: generatePlotCode(input),
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Generate readable Python code for display
 */
function generatePlotCode(input: PlotInput): string {
  const plotType = input.plot_type;
  const title = input.title || 'Financial Chart';
  const xlabel = input.xlabel || '';
  const ylabel = input.ylabel || '';
  const figsize = input.figsize || [12, 6];
  const showGrid = input.grid !== false;
  const alpha = input.alpha || 0.8;
  const theme = input.theme || 'default';

  // Check if data is a symbol (string) or actual data
  const isSymbol = typeof input.data === 'string';

  let dataSetupCode = '';
  let plotCode = '';

  if (isSymbol) {
    // Symbol-based plotting
    const symbol = input.data;
    dataSetupCode = `# Fetch historical data from FMP API
symbol = '${symbol}'
hist_data = get_historical_prices(symbol)
historical = hist_data['historical']

# Extract data for plotting
dates = [h['date'] for h in reversed(historical)]
closes = [h['close'] for h in reversed(historical)]
volumes = [h['volume'] for h in reversed(historical)]`;

    plotCode = `# Plot closing prices
plt.plot(dates, closes, linewidth=2, color='#2563eb', label='Close Price')`;

  } else {
    // Custom data plotting
    dataSetupCode = `# Custom data
data = ${JSON.stringify(input.data, null, 2)}

# Extract x and y values
if 'x' in data and 'y' in data:
    x_data = data['x']
    y_data = data['y']
elif 'x' in data:
    # Multi-series with shared x-axis
    x_data = data['x']
    series = {k: v for k, v in data.items() if k != 'x'}`;

    if (plotType === 'line') {
      plotCode = `# Plot line chart
for label, y_values in series.items():
    plt.plot(x_data, y_values, linewidth=2, label=label, alpha=${alpha})`;
    } else if (plotType === 'bar') {
      plotCode = `# Plot bar chart
plt.bar(x_data, y_data, alpha=${alpha}, color='#2563eb')`;
    } else if (plotType === 'scatter') {
      plotCode = `# Plot scatter chart
plt.scatter(x_data, y_data, alpha=${alpha}, s=100, color='#2563eb')`;
    } else if (plotType === 'area') {
      plotCode = `# Plot area chart
plt.fill_between(x_data, y_data, alpha=${alpha * 0.6}, color='#2563eb')
plt.plot(x_data, y_data, linewidth=2, color='#2563eb')`;
    } else if (plotType === 'histogram') {
      plotCode = `# Plot histogram
plt.hist(y_data, bins=30, alpha=${alpha}, color='#2563eb', edgecolor='black')`;
    } else if (plotType === 'pie') {
      plotCode = `# Plot pie chart
plt.pie(y_data, labels=x_data, autopct='%1.1f%%', startangle=90)
plt.axis('equal')`;
    }
  }

  return `import matplotlib.pyplot as plt
import numpy as np
${isSymbol ? 'from fmpClient import get_historical_prices' : ''}
${theme === 'dark' ? "plt.style.use('dark_background')" : ''}

${dataSetupCode}

# Create figure
fig, ax = plt.subplots(figsize=(${figsize[0]}, ${figsize[1]}))

${plotCode}

# Customize plot
ax.set_title('${title}', fontsize=16, fontweight='bold')
${xlabel ? `ax.set_xlabel('${xlabel}', fontsize=12)` : ''}
${ylabel ? `ax.set_ylabel('${ylabel}', fontsize=12)` : ''}
${showGrid ? "ax.grid(True, alpha=0.3, linestyle='--')" : ''}
${input.legend !== false ? "ax.legend(loc='best', framealpha=0.9)" : ''}

plt.tight_layout()
plt.show()`;
}

// ==================== Volatility Surface Interfaces ====================

export interface VolatilitySurfaceInput {
  symbol: string;
  title?: string;
  figsize?: [number, number];
  color_map?: string;
}

export interface VolatilitySurfaceResult {
  success: boolean;
  image_url?: string;
  format?: string;
  title?: string;
  error?: string;
  stats?: {
    total_contracts: number;
    min_iv: number;
    max_iv: number;
    avg_iv: number;
    strike_range: [number, number];
    expiration_range_days: [number, number];
  };
}

export interface VolatilitySurfaceExecutionResult {
  success: boolean;
  result?: VolatilitySurfaceResult;
  code: string;
  error?: string;
}

/**
 * Validate volatility surface input
 */
function validateVolatilitySurfaceInput(input: VolatilitySurfaceInput): { valid: boolean; error?: string } {
  if (!input.symbol || typeof input.symbol !== 'string' || input.symbol.trim().length === 0) {
    return { valid: false, error: 'Symbol is required and must be a non-empty string' };
  }

  if (input.figsize && (!Array.isArray(input.figsize) || input.figsize.length !== 2)) {
    return { valid: false, error: 'figsize must be an array of two numbers [width, height]' };
  }

  return { valid: true };
}

/**
 * Execute volatility surface generation using Python
 */
export async function executeVolatilitySurface(
  input: VolatilitySurfaceInput
): Promise<VolatilitySurfaceExecutionResult> {
  try {
    // Validate input
    const validation = validateVolatilitySurfaceInput(input);
    if (!validation.valid) {
      return {
        success: false,
        code: `# Volatility Surface for ${input.symbol}`,
        error: validation.error
      };
    }

    const pythonScriptPath = path.join(__dirname, 'volatilitySurfaceService.py');
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
            code: `# Volatility Surface for ${input.symbol}`,
            error: stderr || `Python process exited with code ${code}`
          });
          return;
        }

        try {
          const result = JSON.parse(stdout) as VolatilitySurfaceResult;
          resolve({
            success: result.success,
            result,
            code: `# Generated 3D Volatility Surface for ${input.symbol}`,
            error: result.error
          });
        } catch (parseError) {
          resolve({
            success: false,
            code: `# Volatility Surface for ${input.symbol}`,
            error: 'Failed to parse Python output: ' + (parseError instanceof Error ? parseError.message : 'Unknown error')
          });
        }
      });

      pythonProcess.on('error', (error) => {
        resolve({
          success: false,
          code: `# Volatility Surface for ${input.symbol}`,
          error: 'Failed to start Python process: ' + error.message
        });
      });

      pythonProcess.stdin.write(inputJson);
      pythonProcess.stdin.end();
    });
  } catch (error) {
    return {
      success: false,
      code: `# Volatility Surface for ${input.symbol}`,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// ============================================================================
// Data Download Service - Export FMP data to various formats
// ============================================================================

export interface DataDownloadInput {
  data_type: string;
  symbol?: string;
  format: 'csv' | 'xlsx' | 'json' | 'txt';
  period?: 'annual' | 'quarter';
  limit?: number;
  from_date?: string;
  to_date?: string;
  indicator_period?: number;
  time_period?: string;
  interval?: string;
  news_limit?: number;
  pair?: string;
}

export interface DataDownloadResult {
  success: boolean;
  error?: string;
  filename?: string;
  filepath?: string;
  format?: string;
  file_size?: number;
  metadata?: {
    data_type: string;
    symbol?: string;
    fetched_at: string;
    params: any;
    description: string;
    record_count: number;
  };
}

export interface DataDownloadExecutionResult {
  success: boolean;
  result?: DataDownloadResult;
  error?: string;
}

/**
 * Validate data download input
 */
function validateDataDownloadInput(input: DataDownloadInput): { valid: boolean; error?: string } {
  if (!input.data_type || typeof input.data_type !== 'string') {
    return { valid: false, error: 'data_type is required and must be a string' };
  }

  const validFormats = ['csv', 'xlsx', 'json', 'txt'];
  if (!input.format || !validFormats.includes(input.format)) {
    return { valid: false, error: `format must be one of: ${validFormats.join(', ')}` };
  }

  // Data types that require a symbol
  const symbolRequiredTypes = [
    'company_profile', 'income_statement', 'balance_sheet', 'cash_flow',
    'key_metrics', 'financial_ratios', 'financial_growth', 'stock_quote',
    'historical_price', 'intraday_price', 'rsi', 'macd', 'ema', 'sma',
    'adx', 'williams_r', 'cci', 'stochastic', 'financial_news',
    'earnings_surprises', 'analyst_estimates', 'price_target',
    'upgrades_downgrades', 'dividend_history', 'stock_splits',
    'insider_trading', 'institutional_holders', 'esg_score'
  ];

  if (symbolRequiredTypes.includes(input.data_type) && !input.symbol) {
    return { valid: false, error: `symbol is required for data_type: ${input.data_type}` };
  }

  return { valid: true };
}

/**
 * Execute data download and export to file
 */
export async function executeDataDownload(
  input: DataDownloadInput
): Promise<DataDownloadExecutionResult> {
  try {
    // Validate input
    const validation = validateDataDownloadInput(input);
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error
      };
    }

    const pythonScriptPath = path.join(__dirname, 'dataDownloadService.py');
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
            error: stderr || `Python process exited with code ${code}`
          });
          return;
        }

        try {
          const result = JSON.parse(stdout) as DataDownloadResult;
          resolve({
            success: result.success,
            result,
            error: result.error
          });
        } catch (parseError) {
          resolve({
            success: false,
            error: 'Failed to parse Python output: ' + (parseError instanceof Error ? parseError.message : 'Unknown error')
          });
        }
      });

      pythonProcess.on('error', (error) => {
        resolve({
          success: false,
          error: 'Failed to start Python process: ' + error.message
        });
      });

      pythonProcess.stdin.write(inputJson);
      pythonProcess.stdin.end();
    });
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

// ==================== CUSTOM PYTHON EXECUTOR (FREE-FORM) ====================

export interface CustomPythonInput {
  code: string;
  context?: Record<string, any>;
  description?: string;
}

export interface CustomPythonResult {
  success: boolean;
  output?: string;
  result?: any;
  figures?: string[]; // Base64 encoded images
  files?: Array<{ filename: string; filepath: string }>; // Generated files (Excel, etc.)
  error?: string;
  code?: string;
}

/**
 * Execute custom Python code written by Claude with access to FMP API
 * This is a "free-form" tool that allows Claude to write any Python analysis
 * that doesn't fit into the predefined tools
 */
export async function executeCustomPython(
  input: CustomPythonInput
): Promise<{ success: boolean; result?: CustomPythonResult; code: string; error?: string }> {
  try {
    if (!input.code) {
      return {
        success: false,
        code: '',
        error: 'No Python code provided'
      };
    }

    console.log('\n🐍 ========== CUSTOM PYTHON EXECUTION ==========');
    console.log('📝 Description:', input.description || 'Custom analysis');
    console.log('📊 Code length:', input.code.length, 'chars');
    console.log('🔧 Context vars:', Object.keys(input.context || {}).join(', ') || 'none');

    const pythonScriptPath = path.join(__dirname, 'customPythonExecutor.py');

    // Prepare input with API keys
    const executorInput = {
      code: input.code,
      context: input.context || {},
      fmp_api_key: process.env.FMP_API_KEY,
      fred_api_key: process.env.FRED_API_KEY,
      eodhd_api_key: process.env.EODHD_API_KEY
    };

    const inputJson = JSON.stringify(executorInput);

    return new Promise((resolve) => {
      // Augment PATH so pdflatex (MacTeX) is accessible inside the Python subprocess
      const texBinPaths = [
        '/Library/TeX/texbin',
        '/usr/local/texlive/2025/bin/universal-darwin',
        '/usr/local/texlive/2024/bin/universal-darwin',
        '/usr/texbin',
      ].join(':');
      const augmentedPath = `${texBinPaths}:${process.env.PATH || '/usr/bin:/bin'}`;

      const pythonProcess = spawn(PYTHON_PATH, [pythonScriptPath], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, PYTHONUNBUFFERED: '1', PATH: augmentedPath },
        timeout: 90000 // 90 second timeout for custom code
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
        console.log('🏁 Python process completed with exit code:', code);

        if (code !== 0 || (stderr && !stdout)) {
          console.error('❌ Python execution failed');
          console.error('stderr:', stderr);

          resolve({
            success: false,
            code: input.code,
            error: stderr || `Python process exited with code ${code}`
          });
          return;
        }

        try {
          const result = JSON.parse(stdout) as CustomPythonResult;

          console.log('✅ Custom Python execution successful');
          console.log('📤 Output length:', result.output?.length || 0, 'chars');
          console.log('🖼️  Figures generated:', result.figures?.length || 0);

          resolve({
            success: result.success,
            result,
            code: input.code,
            error: result.error
          });
        } catch (parseError) {
          console.error('❌ Failed to parse Python output');
          console.error('stdout:', stdout.substring(0, 500));

          resolve({
            success: false,
            code: input.code,
            error: 'Failed to parse Python output: ' + (parseError instanceof Error ? parseError.message : 'Unknown error')
          });
        }
      });

      pythonProcess.on('error', (error) => {
        console.error('❌ Failed to start Python process:', error.message);

        resolve({
          success: false,
          code: input.code,
          error: 'Failed to start Python process: ' + error.message
        });
      });

      // Send input to Python process
      pythonProcess.stdin.write(inputJson);
      pythonProcess.stdin.end();
    });
  } catch (error) {
    return {
      success: false,
      code: input.code,
      error: 'Failed to execute custom Python: ' + (error instanceof Error ? error.message : 'Unknown error')
    };
  }
}
