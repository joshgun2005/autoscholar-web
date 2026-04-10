import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Determine Python executable path - use venv if available
const PYTHON_PATH = process.env.PYTHON_PATH ||
                    path.join(process.cwd(), '.venv', 'bin', 'python') ||
                    'python3';

// Resolve Homebrew expat lib path to fix Python 3.14 / macOS libexpat symbol mismatch.
// Python 3.14 (Homebrew) is compiled against a newer expat that exports
// _XML_SetAllocTrackerActivationThreshold, but macOS's system libexpat lacks it.
let _homebrewExpatLib = '';
try {
  _homebrewExpatLib = execSync('brew --prefix expat 2>/dev/null', { encoding: 'utf-8' }).trim() + '/lib';
} catch { /* expat not installed via Homebrew — no override needed */ }

/** Env vars that every Python subprocess should inherit. */
const PYTHON_ENV: Record<string, string | undefined> = {
  ...process.env,
  PYTHONUNBUFFERED: '1',
  ...(_homebrewExpatLib ? { DYLD_LIBRARY_PATH: `${_homebrewExpatLib}:${process.env.DYLD_LIBRARY_PATH || ''}` } : {}),
};

export { PYTHON_PATH, PYTHON_ENV };
