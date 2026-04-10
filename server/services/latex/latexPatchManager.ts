/**
 * LaTeX Patch Manager — Registry of failed compilations + repair lifecycle
 *
 * Mirrors the Python repair loop (read → patch → recompile) for LaTeX.
 * Reuses the generic diffEngine for patch application.
 */

import fs from 'fs';
import path from 'path';
import { randomBytes } from 'crypto';
import { exec } from 'child_process';
import { promisify } from 'util';
import { applyUnifiedDiff, type PatchResult } from '../python/diffEngine';
import { parseLatexLog, formatLatexErrorsForClaude, type LatexLogResult } from './latexLogParser';

const execAsync = promisify(exec);

// ── Types ──────────────────────────────────────────────────────────

export interface LatexCompilationMeta {
  compilationId: string;
  workDir: string;
  texPath: string;
  logPath: string;
  repairAttempts: number;
  patchedLines: number[];
  lastError: string | null;
  hasBib: boolean;
  template: string;
}

export const MAX_LATEX_REPAIR_ATTEMPTS = 8;

// ── Registry ───────────────────────────────────────────────────────

const compilationRegistry = new Map<string, LatexCompilationMeta>();

// ── Helper: find TeX binaries ──────────────────────────────────────

function getTexPath(): string {
  const texBinPaths = [
    '/Library/TeX/texbin',
    '/usr/local/texlive/2025/bin/universal-darwin',
    '/usr/local/texlive/2024/bin/universal-darwin',
    '/usr/texbin',
  ];
  return `${texBinPaths.join(':')}:${process.env.PATH || '/usr/bin:/bin'}`;
}

function findBin(name: string, augmentedPath: string): string | null {
  const candidates = [
    `/Library/TeX/texbin/${name}`,
    `/usr/local/texlive/2025/bin/universal-darwin/${name}`,
    `/usr/local/texlive/2024/bin/universal-darwin/${name}`,
    `/usr/local/texlive/2025/bin/x86_64-darwin/${name}`,
    `/usr/local/texlive/2024/bin/x86_64-darwin/${name}`,
    `/usr/texbin/${name}`,
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  for (const dir of augmentedPath.split(':')) {
    const p = path.join(dir, name);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

// ── Public API ─────────────────────────────────────────────────────

/**
 * Register a failed compilation so it can be repaired.
 */
export function registerCompilation(
  workDir: string,
  hasBib: boolean,
  template: string,
): LatexCompilationMeta {
  const compilationId = `latex_${randomBytes(6).toString('hex')}`;
  const meta: LatexCompilationMeta = {
    compilationId,
    workDir,
    texPath: path.join(workDir, 'paper.tex'),
    logPath: path.join(workDir, 'paper.log'),
    repairAttempts: 0,
    patchedLines: [],
    lastError: null,
    hasBib,
    template,
  };
  compilationRegistry.set(compilationId, meta);
  return meta;
}

/**
 * Read the assembled LaTeX source.
 */
export function readLatexSource(compilationId: string): { success: boolean; content?: string; error?: string; line_count?: number } {
  const meta = compilationRegistry.get(compilationId);
  if (!meta) return { success: false, error: `Unknown compilation_id: ${compilationId}` };

  if (!fs.existsSync(meta.texPath)) {
    return { success: false, error: `paper.tex not found in work directory` };
  }

  const content = fs.readFileSync(meta.texPath, 'utf-8');
  return {
    success: true,
    content,
    line_count: content.split('\n').length,
  };
}

/**
 * Parse the log and return structured errors.
 */
export function inspectLatexErrors(compilationId: string): {
  success: boolean;
  compilation_id: string;
  errors?: LatexLogResult;
  formatted?: string;
  error?: string;
  repair_attempts: number;
  max_repairs: number;
} {
  const meta = compilationRegistry.get(compilationId);
  if (!meta) {
    return {
      success: false,
      compilation_id: compilationId,
      error: `Unknown compilation_id: ${compilationId}`,
      repair_attempts: 0,
      max_repairs: MAX_LATEX_REPAIR_ATTEMPTS,
    };
  }

  if (!fs.existsSync(meta.logPath)) {
    return {
      success: false,
      compilation_id: compilationId,
      error: 'paper.log not found — compilation may not have run',
      repair_attempts: meta.repairAttempts,
      max_repairs: MAX_LATEX_REPAIR_ATTEMPTS,
    };
  }

  const logContent = fs.readFileSync(meta.logPath, 'utf-8');
  const errors = parseLatexLog(logContent);
  const formatted = formatLatexErrorsForClaude(errors);

  return {
    success: true,
    compilation_id: compilationId,
    errors,
    formatted,
    repair_attempts: meta.repairAttempts,
    max_repairs: MAX_LATEX_REPAIR_ATTEMPTS,
  };
}

/**
 * Apply a diff/patch to paper.tex using the shared diffEngine.
 */
export function patchLatex(compilationId: string, diff: string): {
  success: boolean;
  compilation_id: string;
  patch_result?: PatchResult;
  error?: string;
  repair_attempts: number;
  max_repairs: number;
} {
  const meta = compilationRegistry.get(compilationId);
  if (!meta) {
    return {
      success: false,
      compilation_id: compilationId,
      error: `Unknown compilation_id: ${compilationId}`,
      repair_attempts: 0,
      max_repairs: MAX_LATEX_REPAIR_ATTEMPTS,
    };
  }

  if (meta.repairAttempts >= MAX_LATEX_REPAIR_ATTEMPTS) {
    return {
      success: false,
      compilation_id: compilationId,
      error: `Max repair attempts (${MAX_LATEX_REPAIR_ATTEMPTS}) reached. Consider rewriting the problematic sections via write_paper_section and re-calling compile_research_paper.`,
      repair_attempts: meta.repairAttempts,
      max_repairs: MAX_LATEX_REPAIR_ATTEMPTS,
    };
  }

  if (!fs.existsSync(meta.texPath)) {
    return {
      success: false,
      compilation_id: compilationId,
      error: 'paper.tex not found in work directory',
      repair_attempts: meta.repairAttempts,
      max_repairs: MAX_LATEX_REPAIR_ATTEMPTS,
    };
  }

  const original = fs.readFileSync(meta.texPath, 'utf-8');
  const patchResult = applyUnifiedDiff(original, diff);

  if (patchResult.success) {
    fs.writeFileSync(meta.texPath, patchResult.patched, 'utf-8');
    meta.repairAttempts++;
    meta.lastError = null;
  } else {
    meta.lastError = patchResult.error || 'Patch failed to apply';
  }

  return {
    success: patchResult.success,
    compilation_id: compilationId,
    patch_result: patchResult,
    repair_attempts: meta.repairAttempts,
    max_repairs: MAX_LATEX_REPAIR_ATTEMPTS,
  };
}

/**
 * Recompile LaTeX from the preserved workDir — no auto-fallbacks.
 * Returns success/failure + path to PDF if successful.
 */
export async function recompileLatex(compilationId: string, filename?: string): Promise<{
  success: boolean;
  compilation_id: string;
  filepath?: string;
  filename?: string;
  workDir?: string;
  error?: string;
  repair_attempts: number;
  max_repairs: number;
}> {
  const meta = compilationRegistry.get(compilationId);
  if (!meta) {
    return {
      success: false,
      compilation_id: compilationId,
      error: `Unknown compilation_id: ${compilationId}`,
      repair_attempts: 0,
      max_repairs: MAX_LATEX_REPAIR_ATTEMPTS,
    };
  }

  const augmentedPath = getTexPath();
  const pdflatex = findBin('pdflatex', augmentedPath);
  if (!pdflatex) {
    return {
      success: false,
      compilation_id: compilationId,
      error: 'pdflatex not found on system',
      repair_attempts: meta.repairAttempts,
      max_repairs: MAX_LATEX_REPAIR_ATTEMPTS,
    };
  }

  const env = { ...process.env, PATH: augmentedPath };
  const pdflatexCmd = `"${pdflatex}" -interaction=nonstopmode "paper.tex"`;

  const runPass = async (cmd: string, label: string, timeout = 60000) => {
    try {
      await execAsync(cmd, { cwd: meta.workDir, env, timeout });
    } catch (err: any) {
      // pdflatex returns non-zero on warnings — log but don't throw
      const msg = err?.stderr || err?.message || '';
      console.warn(`⚠️ [recompileLatex/${label}] ${msg.substring(0, 300)}`);
    }
  };

  // Run compilation passes (no auto-fallbacks — Claude fixes manually)
  if (meta.hasBib) {
    const bibtex = findBin('bibtex', augmentedPath);
    if (bibtex) {
      await runPass(pdflatexCmd, 'pdflatex pass 1');
      await runPass(`"${bibtex}" paper`, 'bibtex', 30000);
      await runPass(pdflatexCmd, 'pdflatex pass 2');
      await runPass(pdflatexCmd, 'pdflatex pass 3');
    } else {
      await runPass(pdflatexCmd, 'pdflatex pass 1');
      await runPass(pdflatexCmd, 'pdflatex pass 2');
      await runPass(pdflatexCmd, 'pdflatex pass 3');
    }
  } else {
    await runPass(pdflatexCmd, 'pdflatex pass 1');
    await runPass(pdflatexCmd, 'pdflatex pass 2');
    await runPass(pdflatexCmd, 'pdflatex pass 3');
  }

  const compiledPdf = path.join(meta.workDir, 'paper.pdf');
  if (!fs.existsSync(compiledPdf)) {
    // Parse log for error summary
    let logTail = '';
    if (fs.existsSync(meta.logPath)) {
      const logContent = fs.readFileSync(meta.logPath, 'utf-8');
      const errorLines = logContent.split('\n').filter(l => l.startsWith('!'));
      logTail = errorLines.length > 0
        ? errorLines.slice(0, 10).join('\n')
        : logContent.split('\n').slice(-20).join('\n');
    }

    meta.lastError = `Recompilation failed — no PDF produced.\n${logTail}`;
    return {
      success: false,
      compilation_id: compilationId,
      error: meta.lastError,
      repair_attempts: meta.repairAttempts,
      max_repairs: MAX_LATEX_REPAIR_ATTEMPTS,
    };
  }

  // Copy PDF to temp location
  const os = await import('os');
  const baseName = filename
    ? filename.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\.pdf$/i, '') + '.pdf'
    : 'research_paper.pdf';
  const destPath = path.join(os.tmpdir(), `vq_${Date.now()}_${baseName}`);
  fs.copyFileSync(compiledPdf, destPath);

  return {
    success: true,
    compilation_id: compilationId,
    filepath: destPath,
    filename: baseName,
    workDir: meta.workDir,
    repair_attempts: meta.repairAttempts,
    max_repairs: MAX_LATEX_REPAIR_ATTEMPTS,
  };
}

/**
 * Get metadata for a compilation (for internal use).
 */
export function getCompilationMeta(compilationId: string): LatexCompilationMeta | undefined {
  return compilationRegistry.get(compilationId);
}

/**
 * Clean up stale compilations older than maxAgeMs (default: 1 hour).
 */
export function cleanupStaleCompilations(maxAgeMs: number = 3600000): number {
  let cleaned = 0;
  const now = Date.now();

  for (const [id, meta] of Array.from(compilationRegistry.entries())) {
    // Use the workDir creation time as a proxy for age
    try {
      const stat = fs.statSync(meta.workDir);
      if (now - stat.ctimeMs > maxAgeMs) {
        try {
          fs.rmSync(meta.workDir, { recursive: true, force: true });
        } catch {
          // ignore cleanup failures
        }
        compilationRegistry.delete(id);
        cleaned++;
      }
    } catch {
      // workDir already gone — just remove from registry
      compilationRegistry.delete(id);
      cleaned++;
    }
  }

  return cleaned;
}
