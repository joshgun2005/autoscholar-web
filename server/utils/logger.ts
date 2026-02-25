/**
 * VibeSurf Logger - Colorful terminal logging utility
 *
 * Provides colored console output with VibeSurf branding
 * Also saves all logs to a text file
 */

import { appendFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',

  // Text colors
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',

  // Background colors
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m',

  // Bright text colors
  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m',
  brightMagenta: '\x1b[95m',
  brightCyan: '\x1b[96m',
  brightWhite: '\x1b[97m',
};

/**
 * Format timestamp
 */
function getTimestamp(): string {
  const now = new Date();
  return now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

/**
 * Format full timestamp with date for file logging
 */
function getFullTimestamp(): string {
  const now = new Date();
  return now.toISOString().replace('T', ' ').substring(0, 19);
}

/**
 * Get log file path for current date
 */
function getLogFilePath(): string {
  const logsDir = join(process.cwd(), 'logs');

  // Create logs directory if it doesn't exist
  if (!existsSync(logsDir)) {
    mkdirSync(logsDir, { recursive: true });
  }

  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return join(logsDir, `vibesurf-${date}.log`);
}

/**
 * Strip ANSI color codes from text
 */
function stripColors(text: string): string {
  return text.replace(/\x1b\[[0-9;]*m/g, '');
}

/**
 * Write log to file
 */
function writeToFile(message: string) {
  try {
    const logFile = getLogFilePath();
    const timestamp = getFullTimestamp();
    const cleanMessage = stripColors(message);
    const logEntry = `${timestamp} ${cleanMessage}\n`;
    appendFileSync(logFile, logEntry, 'utf8');
  } catch (error) {
    // Fail silently to avoid breaking the application
    console.error('Failed to write to log file:', error);
  }
}

/**
 * Create VibeSurf branded prefix
 */
function vibeSurfPrefix(color: string = colors.brightCyan): string {
  return `${color}${colors.bright}[VibeSurf]${colors.reset}`;
}

/**
 * Logger class with colorful output
 */
class VibeSurfLogger {
  private enabled: boolean = true;

  /**
   * Enable/disable logging
   */
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  /**
   * General info log - Cyan
   */
  info(message: string, ...args: any[]) {
    if (!this.enabled) return;
    const timestamp = `${colors.dim}${getTimestamp()}${colors.reset}`;
    const prefix = vibeSurfPrefix(colors.brightCyan);
    const logMessage = `${timestamp} ${prefix} ${colors.cyan}${message}${colors.reset}`;
    console.log(logMessage, ...args);
    writeToFile(`[VibeSurf] INFO: ${message} ${args.length > 0 ? JSON.stringify(args) : ''}`);
  }

  /**
   * Success log - Green
   */
  success(message: string, ...args: any[]) {
    if (!this.enabled) return;
    const timestamp = `${colors.dim}${getTimestamp()}${colors.reset}`;
    const prefix = vibeSurfPrefix(colors.brightGreen);
    const logMessage = `${timestamp} ${prefix} ${colors.green}✓${colors.reset} ${colors.brightGreen}${message}${colors.reset}`;
    console.log(logMessage, ...args);
    writeToFile(`[VibeSurf] SUCCESS: ${message} ${args.length > 0 ? JSON.stringify(args) : ''}`);
  }

  /**
   * Error log - Red
   */
  error(message: string, ...args: any[]) {
    if (!this.enabled) return;
    const timestamp = `${colors.dim}${getTimestamp()}${colors.reset}`;
    const prefix = vibeSurfPrefix(colors.brightRed);
    const logMessage = `${timestamp} ${prefix} ${colors.red}✗${colors.reset} ${colors.brightRed}${message}${colors.reset}`;
    console.error(logMessage, ...args);
    writeToFile(`[VibeSurf] ERROR: ${message} ${args.length > 0 ? JSON.stringify(args) : ''}`);
  }

  /**
   * Warning log - Yellow
   */
  warn(message: string, ...args: any[]) {
    if (!this.enabled) return;
    const timestamp = `${colors.dim}${getTimestamp()}${colors.reset}`;
    const prefix = vibeSurfPrefix(colors.brightYellow);
    const logMessage = `${timestamp} ${prefix} ${colors.yellow}⚠${colors.reset} ${colors.brightYellow}${message}${colors.reset}`;
    console.warn(logMessage, ...args);
    writeToFile(`[VibeSurf] WARN: ${message} ${args.length > 0 ? JSON.stringify(args) : ''}`);
  }

  /**
   * Debug log - Magenta
   */
  debug(message: string, ...args: any[]) {
    if (!this.enabled) return;
    const timestamp = `${colors.dim}${getTimestamp()}${colors.reset}`;
    const prefix = vibeSurfPrefix(colors.brightMagenta);
    const logMessage = `${timestamp} ${prefix} ${colors.magenta}◆${colors.reset} ${colors.brightMagenta}${message}${colors.reset}`;
    console.log(logMessage, ...args);
    writeToFile(`[VibeSurf] DEBUG: ${message} ${args.length > 0 ? JSON.stringify(args) : ''}`);
  }

  /**
   * Server/System log - Blue
   */
  server(message: string, ...args: any[]) {
    if (!this.enabled) return;
    const timestamp = `${colors.dim}${getTimestamp()}${colors.reset}`;
    const prefix = vibeSurfPrefix(colors.brightBlue);
    const logMessage = `${timestamp} ${prefix} ${colors.blue}▸${colors.reset} ${colors.brightBlue}${message}${colors.reset}`;
    console.log(logMessage, ...args);
    writeToFile(`[VibeSurf] SERVER: ${message} ${args.length > 0 ? JSON.stringify(args) : ''}`);
  }

  /**
   * API/Request log - Cyan with special formatting
   */
  request(method: string, path: string, status?: number) {
    if (!this.enabled) return;
    const timestamp = `${colors.dim}${getTimestamp()}${colors.reset}`;
    const prefix = vibeSurfPrefix(colors.brightCyan);
    const methodColor = method === 'GET' ? colors.green :
                        method === 'POST' ? colors.blue :
                        method === 'PUT' ? colors.yellow :
                        method === 'DELETE' ? colors.red : colors.white;

    let statusStr = '';
    let statusText = '';
    if (status) {
      const statusColor = status < 300 ? colors.green :
                         status < 400 ? colors.cyan :
                         status < 500 ? colors.yellow : colors.red;
      statusStr = ` ${statusColor}[${status}]${colors.reset}`;
      statusText = ` [${status}]`;
    }

    console.log(`${timestamp} ${prefix} ${methodColor}${method}${colors.reset} ${colors.white}${path}${colors.reset}${statusStr}`);
    writeToFile(`[VibeSurf] REQUEST: ${method} ${path}${statusText}`);
  }

  /**
   * Tool execution log - Magenta with tool name
   */
  tool(toolName: string, message: string, ...args: any[]) {
    if (!this.enabled) return;
    const timestamp = `${colors.dim}${getTimestamp()}${colors.reset}`;
    const prefix = vibeSurfPrefix(colors.brightMagenta);
    console.log(`${timestamp} ${prefix} ${colors.magenta}🔧${colors.reset} ${colors.bright}${toolName}${colors.reset} ${colors.white}${message}${colors.reset}`, ...args);
    writeToFile(`[VibeSurf] TOOL: ${toolName} - ${message} ${args.length > 0 ? JSON.stringify(args) : ''}`);
  }

  /**
   * Database log - Green
   */
  database(message: string, ...args: any[]) {
    if (!this.enabled) return;
    const timestamp = `${colors.dim}${getTimestamp()}${colors.reset}`;
    const prefix = vibeSurfPrefix(colors.brightGreen);
    console.log(`${timestamp} ${prefix} ${colors.green}💾${colors.reset} ${colors.brightGreen}${message}${colors.reset}`, ...args);
    writeToFile(`[VibeSurf] DATABASE: ${message} ${args.length > 0 ? JSON.stringify(args) : ''}`);
  }

  /**
   * Banner - Large colorful header
   */
  banner(title: string, subtitle?: string) {
    if (!this.enabled) return;
    const line = '═'.repeat(60);
    console.log(`\n${colors.brightCyan}${line}${colors.reset}`);
    console.log(`${colors.brightCyan}${colors.bright}  🌊 VibeSurf - ${title}${colors.reset}`);
    if (subtitle) {
      console.log(`${colors.cyan}  ${subtitle}${colors.reset}`);
    }
    console.log(`${colors.brightCyan}${line}${colors.reset}\n`);
    writeToFile(`\n${'='.repeat(60)}`);
    writeToFile(`[VibeSurf] BANNER: ${title}${subtitle ? ' - ' + subtitle : ''}`);
    writeToFile(`${'='.repeat(60)}\n`);
  }

  /**
   * Section header - Medium colored header
   */
  section(title: string) {
    if (!this.enabled) return;
    console.log(`\n${colors.brightCyan}${colors.bright}▶ ${title}${colors.reset}`);
    writeToFile(`\n[VibeSurf] SECTION: ${title}`);
  }

  /**
   * Key-value pair log
   */
  kv(key: string, value: any) {
    if (!this.enabled) return;
    const timestamp = `${colors.dim}${getTimestamp()}${colors.reset}`;
    const prefix = vibeSurfPrefix(colors.brightCyan);
    console.log(`${timestamp} ${prefix} ${colors.bright}${key}:${colors.reset} ${colors.white}${value}${colors.reset}`);
    writeToFile(`[VibeSurf] ${key}: ${value}`);
  }

  /**
   * Timer start
   */
  private timers: Map<string, number> = new Map();

  startTimer(label: string) {
    this.timers.set(label, Date.now());
  }

  /**
   * Timer end - shows elapsed time
   */
  endTimer(label: string, message?: string) {
    if (!this.enabled) return;
    const start = this.timers.get(label);
    if (!start) {
      this.warn(`Timer '${label}' was not started`);
      return;
    }

    const elapsed = Date.now() - start;
    const timestamp = `${colors.dim}${getTimestamp()}${colors.reset}`;
    const prefix = vibeSurfPrefix(colors.brightYellow);
    const msg = message || label;
    console.log(`${timestamp} ${prefix} ${colors.yellow}⏱${colors.reset} ${colors.white}${msg}${colors.reset} ${colors.dim}(${elapsed}ms)${colors.reset}`);
    writeToFile(`[VibeSurf] TIMER: ${msg} (${elapsed}ms)`);

    this.timers.delete(label);
  }
}

// Export singleton instance
export const logger = new VibeSurfLogger();

// Export colors for custom formatting
export { colors };
