import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { PYTHON_PATH, PYTHON_ENV } from './shared';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


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
