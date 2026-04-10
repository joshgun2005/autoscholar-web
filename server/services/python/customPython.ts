import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import {
  saveScript,
  setLastError,
} from './scriptManager';
import { formatErrorsForClaude } from './structuredLogger';
import { PYTHON_PATH, PYTHON_ENV } from './shared';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
 * Execute custom Python code written by Claude with access to FMP API.
 * Saves the script to disk via ScriptManager so it can be incrementally
 * patched on errors instead of fully rewritten.
 */
export async function executeCustomPython(
  input: CustomPythonInput & { sessionId?: string }
): Promise<{ success: boolean; result?: CustomPythonResult; code: string; error?: string; scriptId?: string; structuredErrors?: string; fabricationWarnings?: string[] }> {
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

    // Save script to disk for incremental repair
    const scriptMeta = saveScript(input.code, input.sessionId);
    console.log('💾 Script saved:', scriptMeta.scriptId, '→', scriptMeta.filePath);

    const execResult = await runPythonScript(input.code, input.context, scriptMeta.scriptId);
    return {
      ...execResult,
      code: input.code,
      scriptId: scriptMeta.scriptId,
    };
  } catch (error) {
    return {
      success: false,
      code: input.code,
      error: 'Failed to execute custom Python: ' + (error instanceof Error ? error.message : 'Unknown error')
    };
  }
}

/**
 * Core Python execution — spawns the customPythonExecutor.py subprocess.
 * Shared by both initial execution and re-runs.
 */
/**
 * Patch deprecated pandas frequency aliases (pandas 2.2+).
 * 'M' → 'ME', 'Q' → 'QE', 'Y'/'A' → 'YE', 'BM' → 'BME'
 * Targets common pandas call patterns: resample(), asfreq(), freq=, Grouper(), date_range(), etc.
 */
function patchDeprecatedPandasFrequencies(code: string): string {
  let patched = code;

  // Map of deprecated → replacement (only exact single-letter freqs inside quotes)
  const freqMap: Record<string, string> = { M: 'ME', Q: 'QE', Y: 'YE', A: 'YE', BM: 'BME' };

  // Functions where M→ME replacement is CORRECT (offset-based frequency)
  // EXCLUDES to_period and PeriodIndex which REQUIRE 'M' not 'ME'
  const offsetFunctions = 'resample|asfreq|Grouper|date_range|bdate_range';

  for (const [old, replacement] of Object.entries(freqMap)) {
    // Only patch offset-based functions — NOT to_period or period_range which need 'M'/'Q'/'Y'
    const pattern = new RegExp(`((?:${offsetFunctions})\\s*\\((?:[^)]*?,\\s*)?['"])${old}(['"])`, 'g');
    patched = patched.replace(pattern, `$1${replacement}$2`);

    // Match freq='M' as keyword argument, but NOT inside to_period() or PeriodIndex()
    // Use negative lookbehind approximation: only match if preceded by common offset contexts
    const freqKw = new RegExp(`(freq\\s*=\\s*['"])${old}(['"])`, 'g');
    // Before applying freq= patches, check it's not inside a to_period/PeriodIndex context
    patched = patched.replace(freqKw, (match, prefix, suffix) => {
      // Get 60 chars before this match to check context
      const idx = patched.indexOf(match);
      const before = patched.substring(Math.max(0, idx - 60), idx);
      if (/to_period|PeriodIndex|period_range/.test(before)) {
        return match; // Don't patch — PeriodIndex needs 'M' not 'ME'
      }
      return `${prefix}${replacement}${suffix}`;
    });
  }

  // REVERSE FIX: Undo any ME/QE/YE that ended up inside to_period() or PeriodIndex()
  // to_period('ME') → to_period('M'), PeriodIndex(freq='QE') → PeriodIndex(freq='Q')
  const periodFixMap: Record<string, string> = { ME: 'M', QE: 'Q', YE: 'Y', BME: 'BM' };
  for (const [wrong, correct] of Object.entries(periodFixMap)) {
    const periodPattern = new RegExp(`((?:to_period|PeriodIndex|period_range)\\s*\\((?:[^)]*?,\\s*)?['"])${wrong}(['"])`, 'g');
    patched = patched.replace(periodPattern, `$1${correct}$2`);
  }

  if (patched !== code) {
    console.log('[Python] Auto-patched deprecated pandas frequency aliases (M→ME, Q→QE, Y→YE; preserved to_period/PeriodIndex)');
  }

  return patched;
}

/**
 * Detect patterns of data fabrication in Python code.
 * Returns warnings for suspicious patterns. Does NOT block Monte Carlo
 * simulations that use real parameters — only flags code that creates
 * data from scratch without any API call.
 */
function detectDataFabrication(code: string): string[] {
  const warnings: string[] = [];

  // Strip comments and strings to reduce false positives
  const codeNoComments = code.replace(/#.*$/gm, '').replace(/'''[\s\S]*?'''/g, '').replace(/"""[\s\S]*?"""/g, '');

  // Check if code has ANY real data source call
  const hasApiCall = /\b(fmp\.|fred\.|eodhd\.|wb\.|imf\.|oecd\.|pd\.read_csv|pd\.read_excel|pd\.read_parquet|pd\.read_json|requests\.get|hfdb\.|optdb\.|sdc_ipo\.|housing\.)/i.test(codeNoComments);

  // Pattern 1: np.random used to generate primary data (not Monte Carlo parameters)
  const hasNpRandom = /np\.random\.(normal|randn|rand|uniform|lognormal|standard_normal)\s*\(/.test(codeNoComments);
  const hasRandomModule = /random\.(gauss|uniform|normalvariate|sample|choices)\s*\(/.test(codeNoComments);

  // Pattern 2: Hardcoded DataFrame with literal arrays of numbers (> 5 elements)
  const hasHardcodedDf = /pd\.DataFrame\s*\(\s*\{[^}]*\[[\d\s,.\-]+(?:,[\d\s,.\-]+){5,}\]/.test(codeNoComments);

  // Pattern 3: Large hardcoded lists of prices/values (> 10 numeric elements)
  const hasHardcodedList = /=\s*\[(?:\s*\d+\.?\d*\s*,\s*){10,}/.test(codeNoComments);

  // If random data generation exists but NO API call → highly suspicious
  if ((hasNpRandom || hasRandomModule) && !hasApiCall) {
    warnings.push(
      '⚠️ DATA FABRICATION DETECTED: This script uses random number generation (np.random / random) ' +
      'but does NOT call any data API (fmp, fred, eodhd, etc.). This likely means data is being ' +
      'SIMULATED instead of fetched from real sources. Use the MANDATORY FALLBACK CHAIN: ' +
      'retry API → try alternate API → use web_dataset_collector → halt and report failure. ' +
      'np.random is ONLY allowed for Monte Carlo/bootstrapping where parameters come from REAL fetched data.'
    );
  }

  // Hardcoded DataFrames with no API call
  if (hasHardcodedDf && !hasApiCall) {
    warnings.push(
      '⚠️ HARDCODED DATA DETECTED: This script creates a DataFrame with hardcoded numeric values ' +
      'but does NOT fetch data from any API. ALL data must come from API calls or database clients. ' +
      'Use the MANDATORY FALLBACK CHAIN: retry API → alternate API → web_dataset_collector → halt.'
    );
  }

  // Large hardcoded numeric lists
  if (hasHardcodedList && !hasApiCall) {
    warnings.push(
      '⚠️ HARDCODED VALUES DETECTED: This script contains large hardcoded numeric arrays ' +
      'without any API data source. Fetch real data instead of typing values manually.'
    );
  }

  return warnings;
}

/**
 * Auto-patch known recurring errors found in 1777+ historical scripts.
 * Each patch targets a specific high-frequency error pattern.
 */
function patchKnownErrors(code: string): string {
  let patched = code;

  // FIX #2: Colorbar RuntimeError (587 errors)
  // matplotlib colorbar layout engine conflict — force constrained_layout=False when using colorbars
  if (/colorbar|plt\.colorbar|fig\.colorbar/.test(patched) && !/layout_engine|constrained_layout\s*=\s*False/.test(patched)) {
    // Replace constrained_layout=True with False if present, or add layout engine reset before colorbar
    patched = patched.replace(
      /plt\.figure\(([^)]*?)constrained_layout\s*=\s*True/g,
      'plt.figure($1constrained_layout=False'
    );
    // If using tight_layout + colorbar, remove tight_layout call (causes conflict)
    patched = patched.replace(
      /plt\.tight_layout\(\)\s*\n(.*colorbar)/g,
      '# plt.tight_layout() removed — conflicts with colorbar\n$1'
    );
  }

  // FIX #5: numpy.trapz removed in NumPy 2.0+ (20 errors) → np.trapezoid
  patched = patched.replace(/np\.trapz\b/g, 'np.trapezoid');
  patched = patched.replace(/numpy\.trapz\b/g, 'numpy.trapezoid');

  // FIX #7a: fillna(method='ffill'/'bfill') deprecated in pandas 2.2+ (8 errors)
  patched = patched.replace(/\.fillna\(\s*method\s*=\s*['"]ffill['"]\s*\)/g, '.ffill()');
  patched = patched.replace(/\.fillna\(\s*method\s*=\s*['"]bfill['"]\s*\)/g, '.bfill()');

  // FIX #7b: TSNE(n_iter=) renamed to max_iter in sklearn 1.6+ (3 errors)
  patched = patched.replace(/(TSNE\s*\([^)]*?)n_iter\s*=/g, '$1max_iter=');

  // FIX: numpy.math removed — use math module instead
  patched = patched.replace(/np\.math\./g, 'math.');
  patched = patched.replace(/numpy\.math\./g, 'math.');
  // Ensure math is imported if we just added it
  if (/\bmath\./.test(patched) && !/^import math/m.test(patched) && !/^from math import/m.test(patched)) {
    patched = 'import math\n' + patched;
  }

  if (patched !== code) {
    console.log('[Python] Auto-patched known recurring errors (colorbar, np.trapz, fillna, TSNE, np.math)');
  }

  return patched;
}

export async function runPythonScript(
  code: string,
  context?: Record<string, any>,
  scriptId?: string,
): Promise<{ success: boolean; result?: CustomPythonResult; error?: string; structuredErrors?: string; fabricationWarnings?: string[] }> {
  const pythonScriptPath = path.join(__dirname, 'customPythonExecutor.py');

  // Detect data fabrication patterns before execution
  const fabricationWarnings = detectDataFabrication(code);
  if (fabricationWarnings.length > 0) {
    console.warn('🚨 DATA FABRICATION WARNING:');
    fabricationWarnings.forEach(w => console.warn(w));
  }

  // Auto-patch deprecated pandas frequencies and known recurring errors before execution
  const freqPatched = patchDeprecatedPandasFrequencies(code);
  const patchedCode = patchKnownErrors(freqPatched);

  const executorInput = {
    code: patchedCode,
    context: context || {},
    fmp_api_key: process.env.FMP_API_KEY,
    fred_api_key: process.env.FRED_API_KEY,
    eodhd_api_key: process.env.EODHD_API_KEY,
    anthropic_api_key: process.env.ANTHROPIC_API_KEY,
    openrouter_api_key: process.env.OPENROUTER_API_KEY,
  };

  const inputJson = JSON.stringify(executorInput);

  return new Promise((resolve) => {
    const texBinPaths = [
      '/Library/TeX/texbin',
      '/usr/local/texlive/2025/bin/universal-darwin',
      '/usr/local/texlive/2024/bin/universal-darwin',
      '/usr/texbin',
    ].join(':');
    const augmentedPath = `${texBinPaths}:${process.env.PATH || '/usr/bin:/bin'}`;

    const pythonProcess = spawn(PYTHON_PATH, [pythonScriptPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...PYTHON_ENV, PATH: augmentedPath },
      timeout: 900000, // 15 minutes — allows heavy econometric analyses on massive datasets (7.7B HF rows, 3.8B options, DCC-GARCH, bootstrapping)
    });

    let stdout = '';
    let stderr = '';

    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    pythonProcess.on('close', (exitCode) => {
      console.log('🏁 Python process completed with exit code:', exitCode);

      if (exitCode !== 0 || (stderr && !stdout)) {
        console.error('❌ Python execution failed');
        console.error('stderr:', stderr);

        // Store structured error if we have a scriptId
        let structuredErrors: string | undefined;
        if (scriptId) {
          const parsed = setLastError(scriptId, stdout, stderr);
          if (parsed) {
            structuredErrors = formatErrorsForClaude(parsed);
          }
        }

        resolve({
          success: false,
          error: stderr || `Python process exited with code ${exitCode}`,
          structuredErrors,
        });
        return;
      }

      try {
        const result = JSON.parse(stdout) as CustomPythonResult;

        console.log('✅ Custom Python execution successful');
        console.log('📤 Output length:', result.output?.length || 0, 'chars');
        console.log('🖼️  Figures generated:', result.figures?.length || 0);

        // If the Python executor itself reports an error (success: false), parse it
        if (!result.success && result.error && scriptId) {
          const parsed = setLastError(scriptId, result.output || '', result.error);
          resolve({
            success: false,
            result,
            error: result.error,
            structuredErrors: parsed ? formatErrorsForClaude(parsed) : undefined,
          });
          return;
        }

        // Inject fabrication warnings into the result output so Claude sees them
        if (fabricationWarnings.length > 0 && result.output) {
          const warningBlock = '\n\n🚨 RUNTIME DATA INTEGRITY WARNINGS:\n' + fabricationWarnings.join('\n') +
            '\n\nYou MUST rewrite this script to fetch real data from APIs or web_dataset_collector. ' +
            'If all data sources fail, HALT and report the failure to the user. Do NOT proceed with fabricated data.\n';
          result.output = warningBlock + result.output;
        }

        resolve({
          success: result.success,
          result,
          error: result.error,
          fabricationWarnings: fabricationWarnings.length > 0 ? fabricationWarnings : undefined,
        });
      } catch (parseError) {
        console.error('❌ Failed to parse Python output');
        console.error('stdout:', stdout.substring(0, 500));

        resolve({
          success: false,
          error: 'Failed to parse Python output: ' + (parseError instanceof Error ? parseError.message : 'Unknown error'),
        });
      }
    });

    pythonProcess.on('error', (error) => {
      console.error('❌ Failed to start Python process:', error.message);

      resolve({
        success: false,
        error: 'Failed to start Python process: ' + error.message,
      });
    });

    pythonProcess.stdin.write(inputJson);
    pythonProcess.stdin.end();
  });
}
