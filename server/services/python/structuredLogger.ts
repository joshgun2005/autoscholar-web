/**
 * Structured Python error log parser.
 *
 * Converts raw Python tracebacks and stderr into structured JSON
 * suitable for LLM-driven incremental repair.
 */

// ── Types ──────────────────────────────────────────────────────────

export interface StructuredError {
  error_type: string;       // e.g. "SyntaxError", "KeyError", "ImportError"
  file: string;             // file path from traceback (or "<exec>")
  line: number;             // line number (0 if unknown)
  message: string;          // one-line description
  traceback: string;        // full traceback text
}

export interface StructuredLogResult {
  errors: StructuredError[];
  warnings: string[];
  stdout: string;
}

// ── Parsing ────────────────────────────────────────────────────────

/**
 * Regex patterns for common Python error lines.
 *
 * Python tracebacks end with a line like:
 *   ErrorType: message
 *
 * And the most recent file reference looks like:
 *   File "<string>", line 42, in <module>
 */
const ERROR_LINE_RE = /^(\w+(?:Error|Exception))\s*:\s*(.+)$/m;
const FILE_LINE_RE = /File\s+"([^"]+)",\s+line\s+(\d+)/g;
const SYNTAX_LINE_RE = /line\s+(\d+)/i;

/**
 * Parse a raw Python error string (stderr or traceback field) into
 * a structured error object.
 */
export function parsePythonError(raw: string): StructuredError {
  const errorMatch = raw.match(ERROR_LINE_RE);
  const error_type = errorMatch ? errorMatch[1] : 'UnknownError';
  const message = errorMatch ? errorMatch[2].trim() : raw.split('\n').pop()?.trim() || raw.trim();

  // Find the most recent file reference (last match = innermost frame)
  let file = '<exec>';
  let line = 0;

  const fileMatches = Array.from(raw.matchAll(FILE_LINE_RE));
  if (fileMatches.length > 0) {
    const last = fileMatches[fileMatches.length - 1];
    file = last[1];
    line = parseInt(last[2], 10);
  } else {
    // Fallback: try to extract line number from SyntaxError style
    const syntaxMatch = raw.match(SYNTAX_LINE_RE);
    if (syntaxMatch) {
      line = parseInt(syntaxMatch[1], 10);
    }
  }

  return {
    error_type,
    file,
    line,
    message,
    traceback: raw.trim(),
  };
}

/**
 * Parse the full output from a failed Python execution.
 *
 * Splits stderr into individual traceback blocks, extracts warnings,
 * and preserves any stdout content that was captured before the crash.
 */
export function parseExecutionOutput(
  stdout: string,
  stderr: string,
): StructuredLogResult {
  const warnings: string[] = [];
  const errors: StructuredError[] = [];

  // Extract warnings (lines starting with WARNING or DeprecationWarning etc.)
  const WARNING_RE = /^(?:\w+Warning:\s*.+|WARNING:\s*.+)$/gm;
  const warningMatches = stderr.match(WARNING_RE);
  if (warningMatches) {
    warnings.push(...warningMatches);
  }

  // Split on "Traceback (most recent call last):" to find traceback blocks
  const tracebackBlocks = stderr.split(/(?=Traceback \(most recent call last\):)/);

  for (const block of tracebackBlocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith('Traceback')) {
      errors.push(parsePythonError(trimmed));
    } else if (ERROR_LINE_RE.test(trimmed)) {
      // Standalone error line without traceback (e.g. SyntaxError)
      errors.push(parsePythonError(trimmed));
    }
  }

  // If no traceback blocks but stderr has content, create a generic error
  if (errors.length === 0 && stderr.trim()) {
    const cleaned = stderr
      .split('\n')
      .filter(l => !WARNING_RE.test(l))
      .join('\n')
      .trim();

    if (cleaned) {
      errors.push(parsePythonError(cleaned));
    }
  }

  return {
    errors,
    warnings,
    stdout: stdout.trim(),
  };
}

/**
 * Format structured errors into a concise JSON string for Claude tool results.
 */
export function formatErrorsForClaude(logResult: StructuredLogResult): string {
  return JSON.stringify({
    errors: logResult.errors.map(e => ({
      error_type: e.error_type,
      file: e.file,
      line: e.line,
      message: e.message,
      traceback: e.traceback,
    })),
    warnings: logResult.warnings,
    partial_output: logResult.stdout.substring(0, 2000) || null,
  }, null, 2);
}
