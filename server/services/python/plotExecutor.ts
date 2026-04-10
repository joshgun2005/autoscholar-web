import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { PYTHON_PATH, PYTHON_ENV } from './shared';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
