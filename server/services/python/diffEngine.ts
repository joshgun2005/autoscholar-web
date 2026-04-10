/**
 * Code Patch Engine — Unified Diff + Search-Replace Fallback
 *
 * Two patch strategies in order of attempt:
 *   1. Unified diff (@@ -x,y +x,y @@) — standard format with fuzzy matching
 *   2. Search-Replace blocks (<<<< SEARCH / ==== / >>>> REPLACE) — simpler, more LLM-friendly
 *
 * The search-replace fallback is critical because LLMs frequently generate
 * diffs with incorrect line numbers or mismatched context. The search-replace
 * format only requires matching the actual code text, not line numbers.
 */

// ── Types ──────────────────────────────────────────────────────────

export interface HunkHeader {
  oldStart: number;
  oldCount: number;
  newStart: number;
  newCount: number;
}

export interface DiffHunk {
  header: HunkHeader;
  lines: string[];          // raw lines including prefix (+, -, space)
}

export interface PatchResult {
  success: boolean;
  patched: string;           // full file content after patch (empty on failure)
  hunksApplied: number;
  hunksTotal: number;
  method?: 'unified_diff' | 'search_replace';  // which strategy succeeded
  error?: string;
}

// ── Unified Diff Parsing ──────────────────────────────────────────

const HUNK_HEADER_RE = /^@@\s+-(\d+)(?:,(\d+))?\s+\+(\d+)(?:,(\d+))?\s+@@/;

export function parseUnifiedDiff(diff: string): DiffHunk[] {
  const hunks: DiffHunk[] = [];
  const rawLines = diff.split('\n');

  let i = 0;

  // Skip file-level headers (---, +++)
  while (i < rawLines.length) {
    if (rawLines[i].startsWith('---') || rawLines[i].startsWith('+++')) {
      i++;
      continue;
    }
    if (HUNK_HEADER_RE.test(rawLines[i])) break;
    i++;
  }

  while (i < rawLines.length) {
    const headerMatch = rawLines[i].match(HUNK_HEADER_RE);
    if (!headerMatch) {
      i++;
      continue;
    }

    const header: HunkHeader = {
      oldStart: parseInt(headerMatch[1], 10),
      oldCount: headerMatch[2] !== undefined ? parseInt(headerMatch[2], 10) : 1,
      newStart: parseInt(headerMatch[3], 10),
      newCount: headerMatch[4] !== undefined ? parseInt(headerMatch[4], 10) : 1,
    };

    i++;
    const hunkLines: string[] = [];

    while (i < rawLines.length && !HUNK_HEADER_RE.test(rawLines[i])) {
      const line = rawLines[i];
      if (
        line.startsWith('+') ||
        line.startsWith('-') ||
        line.startsWith(' ') ||
        line === ''
      ) {
        hunkLines.push(line);
      } else {
        break;
      }
      i++;
    }

    hunks.push({ header, lines: hunkLines });
  }

  return hunks;
}

// ── Unified Diff Application ──────────────────────────────────────

function applyHunk(
  fileLines: string[],
  hunk: DiffHunk,
  offsetDelta: number,
): { lines: string[]; delta: number } | null {
  const oldSide: string[] = [];
  const newSide: string[] = [];

  for (const line of hunk.lines) {
    if (line.startsWith('-')) {
      oldSide.push(line.slice(1));
    } else if (line.startsWith('+')) {
      newSide.push(line.slice(1));
    } else {
      const ctx = line.startsWith(' ') ? line.slice(1) : line;
      oldSide.push(ctx);
      newSide.push(ctx);
    }
  }

  const nominalStart = hunk.header.oldStart - 1 + offsetDelta;
  const FUZZ_RANGE = 50; // increased from 30

  const tryApplyAt = (start: number): string[] | null => {
    if (start < 0 || start + oldSide.length > fileLines.length) return null;

    for (let j = 0; j < oldSide.length; j++) {
      if (fileLines[start + j].trimEnd() !== oldSide[j].trimEnd()) {
        return null;
      }
    }

    return [
      ...fileLines.slice(0, start),
      ...newSide,
      ...fileLines.slice(start + oldSide.length),
    ];
  };

  // Exact position
  const exact = tryApplyAt(nominalStart);
  if (exact) return { lines: exact, delta: newSide.length - oldSide.length };

  // Fuzzy search
  for (let offset = 1; offset <= FUZZ_RANGE; offset++) {
    const up = tryApplyAt(nominalStart - offset);
    if (up) return { lines: up, delta: newSide.length - oldSide.length };
    const down = tryApplyAt(nominalStart + offset);
    if (down) return { lines: down, delta: newSide.length - oldSide.length };
  }

  return null;
}

function applyUnifiedDiffInternal(original: string, diff: string): PatchResult {
  const hunks = parseUnifiedDiff(diff);

  if (hunks.length === 0) {
    return { success: false, patched: '', hunksApplied: 0, hunksTotal: 0, error: 'No valid hunks found.' };
  }

  let fileLines = original.split('\n');
  let cumulativeDelta = 0;
  let applied = 0;

  for (const hunk of hunks) {
    const result = applyHunk(fileLines, hunk, cumulativeDelta);
    if (result) {
      fileLines = result.lines;
      cumulativeDelta += result.delta;
      applied++;
    } else {
      // Instead of failing immediately, try remaining hunks (partial success)
      // Skip this hunk but continue
      continue;
    }
  }

  if (applied === 0) {
    return {
      success: false,
      patched: '',
      hunksApplied: 0,
      hunksTotal: hunks.length,
      error: `All ${hunks.length} hunk(s) failed to apply. Context mismatch.`,
    };
  }

  return {
    success: true,
    patched: fileLines.join('\n'),
    hunksApplied: applied,
    hunksTotal: hunks.length,
    method: 'unified_diff',
  };
}

// ── Search-Replace Parsing ────────────────────────────────────────

interface SearchReplaceBlock {
  search: string;
  replace: string;
}

/**
 * Parse search-replace blocks from various LLM-friendly formats:
 *
 * Format 1 (markers):
 *   <<<< SEARCH
 *   old code
 *   ====
 *   new code
 *   >>>> REPLACE
 *
 * Format 2 (labeled):
 *   SEARCH:
 *   ```
 *   old code
 *   ```
 *   REPLACE:
 *   ```
 *   new code
 *   ```
 *
 * Format 3 (inline arrow):
 *   `old code` → `new code`
 */
function parseSearchReplaceBlocks(diff: string): SearchReplaceBlock[] {
  const blocks: SearchReplaceBlock[] = [];

  // Format 1: <<<< SEARCH ... ==== ... >>>> REPLACE
  const markerRe = /<<<+\s*SEARCH\s*\n([\s\S]*?)\n={3,}\s*\n([\s\S]*?)\n>>>+\s*REPLACE/g;
  let match;
  while ((match = markerRe.exec(diff)) !== null) {
    blocks.push({ search: match[1], replace: match[2] });
  }

  if (blocks.length > 0) return blocks;

  // Format 2: SEARCH:\n```\n...\n```\nREPLACE:\n```\n...\n```
  const labeledRe = /SEARCH:\s*\n```[^\n]*\n([\s\S]*?)\n```\s*\nREPLACE:\s*\n```[^\n]*\n([\s\S]*?)\n```/gi;
  while ((match = labeledRe.exec(diff)) !== null) {
    blocks.push({ search: match[1], replace: match[2] });
  }

  if (blocks.length > 0) return blocks;

  // Format 3: Try to extract from - / + lines without @@ headers (broken diff)
  // This handles when the LLM generates diff-like content without proper headers
  const lines = diff.split('\n');
  let searchLines: string[] = [];
  let replaceLines: string[] = [];
  let inSearch = false;
  let inReplace = false;

  for (const line of lines) {
    if (line.startsWith('-') && !line.startsWith('---')) {
      if (inReplace && searchLines.length > 0) {
        // New block starting
        blocks.push({ search: searchLines.join('\n'), replace: replaceLines.join('\n') });
        searchLines = [];
        replaceLines = [];
      }
      searchLines.push(line.slice(1));
      inSearch = true;
      inReplace = false;
    } else if (line.startsWith('+') && !line.startsWith('+++')) {
      replaceLines.push(line.slice(1));
      inSearch = false;
      inReplace = true;
    } else if (inSearch || inReplace) {
      // Context line or end of block
      if (searchLines.length > 0 && replaceLines.length > 0) {
        blocks.push({ search: searchLines.join('\n'), replace: replaceLines.join('\n') });
        searchLines = [];
        replaceLines = [];
      }
      inSearch = false;
      inReplace = false;
    }
  }
  // Flush last block
  if (searchLines.length > 0 && replaceLines.length > 0) {
    blocks.push({ search: searchLines.join('\n'), replace: replaceLines.join('\n') });
  }

  return blocks;
}

// ── Search-Replace Application ────────────────────────────────────

function applySearchReplace(original: string, blocks: SearchReplaceBlock[]): PatchResult {
  let content = original;
  let applied = 0;

  for (const block of blocks) {
    // Try exact match first
    if (content.includes(block.search)) {
      content = content.replace(block.search, block.replace);
      applied++;
      continue;
    }

    // Try trimmed match (normalize whitespace at line ends)
    const searchTrimmed = block.search.split('\n').map(l => l.trimEnd()).join('\n');
    const contentLines = content.split('\n');
    const contentTrimmed = contentLines.map(l => l.trimEnd()).join('\n');

    if (contentTrimmed.includes(searchTrimmed)) {
      // Find the position in the trimmed version and apply
      const idx = contentTrimmed.indexOf(searchTrimmed);
      // Map back to original content by counting lines
      const beforeLines = contentTrimmed.substring(0, idx).split('\n').length - 1;
      const searchLineCount = searchTrimmed.split('\n').length;

      const before = contentLines.slice(0, beforeLines).join('\n');
      const after = contentLines.slice(beforeLines + searchLineCount).join('\n');
      content = before + (before ? '\n' : '') + block.replace + (after ? '\n' : '') + after;
      applied++;
      continue;
    }

    // Try with leading/trailing whitespace stripped per line
    const searchStripped = block.search.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    if (searchStripped.length >= 2) {
      // Find consecutive lines that match when stripped
      for (let i = 0; i <= contentLines.length - searchStripped.length; i++) {
        let matches = true;
        for (let j = 0; j < searchStripped.length; j++) {
          if (contentLines[i + j].trim() !== searchStripped[j]) {
            matches = false;
            break;
          }
        }
        if (matches) {
          const before = contentLines.slice(0, i);
          const after = contentLines.slice(i + searchStripped.length);
          content = [...before, block.replace, ...after].join('\n');
          applied++;
          break;
        }
      }
    }
  }

  if (applied === 0) {
    return {
      success: false,
      patched: '',
      hunksApplied: 0,
      hunksTotal: blocks.length,
      error: `Search-replace: none of ${blocks.length} block(s) matched the source code.`,
    };
  }

  return {
    success: true,
    patched: content,
    hunksApplied: applied,
    hunksTotal: blocks.length,
    method: 'search_replace',
  };
}

// ── Main Entry Point ──────────────────────────────────────────────

/**
 * Apply a patch to source code, trying multiple strategies:
 *   1. Unified diff (@@ format) with fuzzy matching
 *   2. Search-replace blocks (<<<< SEARCH / ==== / >>>> REPLACE)
 *   3. Raw -/+ line extraction as search-replace fallback
 *
 * @param original — full file content
 * @param diff — patch in any supported format
 */
export function applyUnifiedDiff(original: string, diff: string): PatchResult {
  // Strategy 1: Try standard unified diff
  const unifiedResult = applyUnifiedDiffInternal(original, diff);
  if (unifiedResult.success) {
    return unifiedResult;
  }

  // Strategy 2: Try search-replace format
  const srBlocks = parseSearchReplaceBlocks(diff);
  if (srBlocks.length > 0) {
    const srResult = applySearchReplace(original, srBlocks);
    if (srResult.success) {
      return srResult;
    }
  }

  // Strategy 3: If we had partial unified diff success, accept it
  // (applyUnifiedDiffInternal now allows partial success)

  // All strategies failed
  const totalAttempts = (unifiedResult.hunksTotal || 0) + srBlocks.length;
  return {
    success: false,
    patched: '',
    hunksApplied: 0,
    hunksTotal: totalAttempts,
    error: `Patch failed with all strategies. Unified diff: ${unifiedResult.error || 'no hunks'}. Search-replace: ${srBlocks.length} block(s) tried. Consider using a full rewrite via execute_custom_python_analysis instead.`,
  };
}
