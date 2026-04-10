import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { PYTHON_PATH, PYTHON_ENV } from './shared';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


export interface GarchInput {
  symbol: string;
  p?: number;  // GARCH p parameter (default: 1)
  q?: number;  // GARCH q parameter (default: 1)
  forecast_horizon?: number;  // Number of days to forecast (default: 30)
  data_period?: number;  // Historical data period in days (default: 504)
}

export interface GarchParameters {
  all_params: Record<string, number>;
  omega: number;
  alpha: number[];
  beta: number[];
  persistence: number;
  mean: number;
}

export interface GarchVolatilityStats {
  current_volatility: number;
  average_volatility: number;
  min_volatility: number;
  max_volatility: number;
  std_volatility: number;
}

export interface GarchHistoricalVolatility {
  dates: string[];
  values: number[];
}

export interface GarchForecast {
  dates: string[];
  values: number[];
  horizon: number;
}

export interface GarchInterpretation {
  is_mean_reverting: boolean;
  persistence_level: string;
  shock_impact: string;
  volatility_clustering: string;
}

export interface GarchResult {
  success: boolean;
  error?: string;
  symbol?: string;
  model_specification?: {
    type: string;
    p: number;
    q: number;
    mean_model: string;
    distribution: string;
  };
  parameters?: GarchParameters;
  model_fit?: {
    aic: number;
    bic: number;
    log_likelihood: number;
    num_observations: number;
  };
  volatility_statistics?: GarchVolatilityStats;
  historical_volatility?: GarchHistoricalVolatility;
  volatility_forecast?: GarchForecast;
  interpretation?: GarchInterpretation;
}

export interface GarchExecutionResult {
  success: boolean;
  result?: GarchResult;
  code: string;
  error?: string;
}

/**
 * Validate GARCH input
 */
function validateGarchInput(input: GarchInput): { valid: boolean; error?: string } {
  if (!input.symbol || typeof input.symbol !== 'string') {
    return { valid: false, error: 'symbol must be a string' };
  }

  if (input.p !== undefined && (input.p < 1 || input.p > 5)) {
    return { valid: false, error: 'p must be between 1 and 5' };
  }

  if (input.q !== undefined && (input.q < 1 || input.q > 5)) {
    return { valid: false, error: 'q must be between 1 and 5' };
  }

  if (input.forecast_horizon !== undefined && (input.forecast_horizon < 1 || input.forecast_horizon > 252)) {
    return { valid: false, error: 'forecast_horizon must be between 1 and 252' };
  }

  if (input.data_period !== undefined && (input.data_period < 30 || input.data_period > 2520)) {
    return { valid: false, error: 'data_period must be between 30 and 2520' };
  }

  return { valid: true };
}

/**
 * Execute GARCH volatility model using Python
 */
export async function executeGarchModel(
  input: GarchInput
): Promise<GarchExecutionResult> {
  try {
    // Validate input
    const validation = validateGarchInput(input);
    if (!validation.valid) {
      return {
        success: false,
        code: generateGarchCode(input),
        error: validation.error
      };
    }

    const pythonScriptPath = path.join(__dirname, 'garchService.py');
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
            code: generateGarchCode(input),
            error: stderr || `Python process exited with code ${code}`
          });
          return;
        }

        try {
          const result = JSON.parse(stdout) as GarchResult;
          resolve({
            success: result.success,
            result,
            code: generateGarchCode(input),
            error: result.error
          });
        } catch (parseError) {
          resolve({
            success: false,
            code: generateGarchCode(input),
            error: 'Failed to parse Python output: ' + (parseError instanceof Error ? parseError.message : 'Unknown error')
          });
        }
      });

      pythonProcess.on('error', (error) => {
        resolve({
          success: false,
          code: generateGarchCode(input),
          error: 'Failed to start Python process: ' + error.message
        });
      });

      pythonProcess.stdin.write(inputJson);
      pythonProcess.stdin.end();
    });
  } catch (error) {
    return {
      success: false,
      code: generateGarchCode(input),
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Generate readable Python code for display
 */
function generateGarchCode(input: GarchInput): string {
  const p = input.p || 1;
  const q = input.q || 1;
  const horizon = input.forecast_horizon || 30;
  const period = input.data_period || 504;

  return `import numpy as np
import pandas as pd
from arch import arch_model
from fmpClient import get_historical_prices

# Fetch historical prices for ${input.symbol}
symbol = '${input.symbol}'
print(f"Fetching historical prices for {symbol}...")
hist_data = get_historical_prices(symbol)

# Extract closing prices
prices = [h['close'] for h in reversed(hist_data['historical'])]
dates = [h['date'] for h in reversed(hist_data['historical'])]

# Limit to ${period} most recent days
if len(prices) > ${period}:
    prices = prices[-${period}:]
    dates = dates[-${period}:]

# Convert to pandas Series
price_series = pd.Series(prices, index=pd.to_datetime(dates))

# Calculate percentage returns
returns = 100 * price_series.pct_change().dropna()

# Fit GARCH(${p},${q}) model
print(f"Fitting GARCH(${p},${q}) model...")
model = arch_model(
    returns,
    vol='Garch',
    p=${p},
    q=${q},
    mean='constant',
    dist='normal'
)

model_fit = model.fit(disp='off')

# Display model parameters
print("\\nModel Parameters:")
print(model_fit.params)

# Extract GARCH parameters
omega = model_fit.params['omega']
alpha = [model_fit.params[f'alpha[{i+1}]'] for i in range(${q})]
beta = [model_fit.params[f'beta[{i+1}]'] for i in range(${p})]

# Calculate persistence
persistence = sum(alpha) + sum(beta)
print(f"\\nPersistence: {persistence:.4f}")
print(f"Mean reverting: {persistence < 1}")

# Get conditional volatility (annualized)
conditional_vol = model_fit.conditional_volatility * np.sqrt(252) / 100
current_volatility = conditional_vol.iloc[-1]
print(f"\\nCurrent Volatility: {current_volatility*100:.2f}%")

# Forecast volatility
print(f"\\nForecasting volatility for ${horizon} days...")
forecasts = model_fit.forecast(horizon=${horizon})
forecast_variance = forecasts.variance.values[-1, :]
forecast_volatility = np.sqrt(forecast_variance) * np.sqrt(252) / 100

print(f"\\nForecast Mean Volatility: {np.mean(forecast_volatility)*100:.2f}%")
print(f"Forecast Min Volatility: {np.min(forecast_volatility)*100:.2f}%")
print(f"Forecast Max Volatility: {np.max(forecast_volatility)*100:.2f}%")

# Model fit statistics
print(f"\\nModel Fit:")
print(f"  AIC: {model_fit.aic:.2f}")
print(f"  BIC: {model_fit.bic:.2f}")
print(f"  Log-Likelihood: {model_fit.loglikelihood:.2f}")`;
}
