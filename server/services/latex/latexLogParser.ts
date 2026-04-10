/**
 * LaTeX Log Parser — Structured error extraction from pdflatex logs
 *
 * Parses paper.log into structured errors/warnings for Claude to inspect
 * and fix via the patch-based repair loop.
 */

// ── Types ──────────────────────────────────────────────────────────

export interface LatexError {
  error_type: 'error' | 'fatal' | 'undefined_control_sequence' | 'missing_char' | 'unicode' | 'environment' | 'math' | 'package' | 'other';
  line: number | null;
  offending_command: string | null;
  message: string;
  context: string;      // surrounding lines from the log
}

export interface LatexLogResult {
  errors: LatexError[];
  warnings: string[];
  overfull_count: number;
  underfull_count: number;
}

// ── Error type detection ───────────────────────────────────────────

function classifyError(errorLine: string): LatexError['error_type'] {
  if (/Undefined control sequence/.test(errorLine)) return 'undefined_control_sequence';
  if (/Missing \$ inserted|Display math/.test(errorLine)) return 'math';
  if (/Unicode character/.test(errorLine)) return 'unicode';
  if (/Environment .* undefined|\\begin\{.*\} .* \\end\{/.test(errorLine)) return 'environment';
  if (/Package .* Error/.test(errorLine)) return 'package';
  if (/Fatal error|Emergency stop/.test(errorLine)) return 'fatal';
  if (/Missing .* inserted|Extra .* or forgotten/.test(errorLine)) return 'missing_char';
  return 'other';
}

function extractOffendingCommand(errorLine: string, contextLines: string[]): string | null {
  // "Undefined control sequence" — next line often shows l.N \badcommand
  const ucsMatch = contextLines.join('\n').match(/\\([a-zA-Z@]+)\s*$/m);
  if (ucsMatch) return `\\${ucsMatch[1]}`;

  // Package error with command
  const pkgMatch = errorLine.match(/\\([a-zA-Z]+)/);
  if (pkgMatch) return `\\${pkgMatch[1]}`;

  return null;
}

// ── Main parser ────────────────────────────────────────────────────

export function parseLatexLog(logContent: string): LatexLogResult {
  const lines = logContent.split('\n');
  const errors: LatexError[] = [];
  const warnings: string[] = [];
  let overfull_count = 0;
  let underfull_count = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Count overfull/underfull boxes
    if (/^Overfull \\[hv]box/.test(line)) {
      overfull_count++;
      continue;
    }
    if (/^Underfull \\[hv]box/.test(line)) {
      underfull_count++;
      continue;
    }

    // Collect warnings (but not overfull/underfull)
    if (/^LaTeX Warning:/.test(line) || /^Package \w+ Warning:/.test(line)) {
      warnings.push(line.trim());
      continue;
    }

    // Detect errors: lines starting with "!"
    if (line.startsWith('!')) {
      const errorMessage = line.substring(2).trim();
      const errorType = classifyError(errorMessage);

      // Gather context: look ahead for "l.<N>" line number marker
      const contextLines: string[] = [];
      let errorLineNum: number | null = null;

      for (let j = i + 1; j < Math.min(i + 8, lines.length); j++) {
        contextLines.push(lines[j]);
        const lineMatch = lines[j].match(/^l\.(\d+)\s*(.*)/);
        if (lineMatch) {
          errorLineNum = parseInt(lineMatch[1], 10);
          break;
        }
      }

      const offending = extractOffendingCommand(errorMessage, contextLines);

      errors.push({
        error_type: errorType,
        line: errorLineNum,
        offending_command: offending,
        message: errorMessage,
        context: contextLines.join('\n').substring(0, 300),
      });
    }
  }

  return { errors, warnings, overfull_count, underfull_count };
}

// ── Formatter for Claude ───────────────────────────────────────────

export function formatLatexErrorsForClaude(result: LatexLogResult): string {
  const parts: string[] = [];

  if (result.errors.length === 0) {
    parts.push('No LaTeX errors found in the log.');
  } else {
    parts.push(`Found ${result.errors.length} LaTeX error(s):\n`);
    for (let i = 0; i < result.errors.length; i++) {
      const e = result.errors[i];
      parts.push(`ERROR ${i + 1} [${e.error_type}]${e.line ? ` at line ${e.line}` : ''}:`);
      parts.push(`  Message: ${e.message}`);
      if (e.offending_command) parts.push(`  Command: ${e.offending_command}`);
      if (e.context) parts.push(`  Context:\n    ${e.context.split('\n').join('\n    ')}`);
      parts.push('');
    }
  }

  if (result.warnings.length > 0) {
    parts.push(`\n${result.warnings.length} warning(s):`);
    for (const w of result.warnings.slice(0, 10)) {
      parts.push(`  - ${w}`);
    }
    if (result.warnings.length > 10) {
      parts.push(`  ... and ${result.warnings.length - 10} more`);
    }
  }

  if (result.overfull_count > 0 || result.underfull_count > 0) {
    parts.push(`\nBox issues: ${result.overfull_count} overfull, ${result.underfull_count} underfull`);
  }

  return parts.join('\n');
}
