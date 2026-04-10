import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { PYTHON_PATH, PYTHON_ENV } from './shared';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
