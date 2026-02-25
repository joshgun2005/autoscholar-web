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


export { PYTHON_PATH };
