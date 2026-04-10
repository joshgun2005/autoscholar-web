import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { PYTHON_PATH, PYTHON_ENV } from './shared';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
