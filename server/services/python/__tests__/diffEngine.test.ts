/**
 * Test suite for the diff engine and structured logger.
 *
 * Validates patch-based correction for common Python error scenarios:
 * 1. Syntax error
 * 2. Missing import
 * 3. Attribute error
 * 4. DataFrame key error
 * 5. Division by zero
 *
 * Run: npx vitest run server/services/python/__tests__/diffEngine.test.ts
 */

import { describe, it, expect } from 'vitest';
import { applyUnifiedDiff, parseUnifiedDiff } from '../diffEngine';
import { parsePythonError, parseExecutionOutput } from '../structuredLogger';

// ── Diff Engine Tests ──────────────────────────────────────────────

describe('parseUnifiedDiff', () => {
  it('parses a single hunk with additions and deletions', () => {
    const diff = `@@ -1,3 +1,4 @@
 import pandas as pd
 import numpy as np
+import scipy.stats as stats
 df = pd.read_csv("data.csv")`;

    const hunks = parseUnifiedDiff(diff);
    expect(hunks).toHaveLength(1);
    expect(hunks[0].header).toEqual({
      oldStart: 1, oldCount: 3, newStart: 1, newCount: 4,
    });
    expect(hunks[0].lines).toHaveLength(4);
  });

  it('parses multiple hunks', () => {
    const diff = `@@ -1,2 +1,3 @@
 import pandas as pd
+import numpy as np
 x = 1
@@ -10,3 +11,3 @@
 a = 1
-b = 2
+b = 3
 c = 4`;

    const hunks = parseUnifiedDiff(diff);
    expect(hunks).toHaveLength(2);
  });

  it('handles --- and +++ headers', () => {
    const diff = `--- a/script.py
+++ b/script.py
@@ -5,3 +5,3 @@
 x = 1
-y = 2
+y = 3
 z = 4`;

    const hunks = parseUnifiedDiff(diff);
    expect(hunks).toHaveLength(1);
    expect(hunks[0].header.oldStart).toBe(5);
  });
});

describe('applyUnifiedDiff', () => {
  // Scenario 1: Fix a syntax error (missing colon)
  it('fixes a syntax error', () => {
    const original = `def calculate(x)
    return x * 2

result = calculate(5)
print(result)`;

    const diff = `@@ -1,2 +1,2 @@
-def calculate(x)
+def calculate(x):
     return x * 2`;

    const result = applyUnifiedDiff(original, diff);
    expect(result.success).toBe(true);
    expect(result.hunksApplied).toBe(1);
    expect(result.patched).toContain('def calculate(x):');
    expect(result.patched).not.toContain('def calculate(x)\n');
  });

  // Scenario 2: Fix a missing import
  it('adds a missing import', () => {
    const original = `import pandas as pd
import numpy as np

data = pd.DataFrame({"x": [1, 2, 3]})
result = stats.zscore(data["x"])
print(result)`;

    const diff = `@@ -1,3 +1,4 @@
 import pandas as pd
 import numpy as np
+import scipy.stats as stats
`;

    const result = applyUnifiedDiff(original, diff);
    expect(result.success).toBe(true);
    expect(result.patched).toContain('import scipy.stats as stats');
    // Verify ordering preserved
    const lines = result.patched.split('\n');
    const scipyIdx = lines.findIndex(l => l.includes('scipy'));
    const numpyIdx = lines.findIndex(l => l.includes('numpy'));
    expect(scipyIdx).toBeGreaterThan(numpyIdx);
  });

  // Scenario 3: Fix an attribute error
  it('fixes an attribute error (wrong method name)', () => {
    const original = `import pandas as pd

df = pd.DataFrame({"a": [1, 2, 3], "b": [4, 5, 6]})
result = df.sort("a")
print(result)`;

    const diff = `@@ -3,3 +3,3 @@
 df = pd.DataFrame({"a": [1, 2, 3], "b": [4, 5, 6]})
-result = df.sort("a")
+result = df.sort_values("a")
 print(result)`;

    const result = applyUnifiedDiff(original, diff);
    expect(result.success).toBe(true);
    expect(result.patched).toContain('df.sort_values("a")');
  });

  // Scenario 4: Fix a DataFrame key error
  it('fixes a DataFrame key error', () => {
    const original = `import pandas as pd

data = {"historical": [{"date": "2024-01-01", "close": 150.0}]}
df = pd.DataFrame(data["historical"])
returns = df["return"].pct_change()
print(returns.describe())`;

    const diff = `@@ -4,3 +4,3 @@
 df = pd.DataFrame(data["historical"])
-returns = df["return"].pct_change()
+returns = df["close"].pct_change()
 print(returns.describe())`;

    const result = applyUnifiedDiff(original, diff);
    expect(result.success).toBe(true);
    expect(result.patched).toContain('df["close"]');
    expect(result.patched).not.toContain('df["return"]');
  });

  // Scenario 5: Fix division by zero
  it('fixes a division by zero', () => {
    const original = `import numpy as np

values = np.array([10, 20, 0, 40])
weights = np.array([0.25, 0.25, 0.25, 0.25])

for i in range(len(values)):
    ratio = weights[i] / values[i]
    print(f"Ratio {i}: {ratio}")`;

    const diff = `@@ -6,3 +6,5 @@
 for i in range(len(values)):
-    ratio = weights[i] / values[i]
-    print(f"Ratio {i}: {ratio}")
+    if values[i] != 0:
+        ratio = weights[i] / values[i]
+    else:
+        ratio = float('inf')
+    print(f"Ratio {i}: {ratio}")`;

    const result = applyUnifiedDiff(original, diff);
    expect(result.success).toBe(true);
    expect(result.patched).toContain('if values[i] != 0:');
    expect(result.patched).toContain("float('inf')");
  });

  // Edge case: empty diff
  it('returns error for empty diff', () => {
    const result = applyUnifiedDiff('hello world', '');
    expect(result.success).toBe(false);
    expect(result.error).toContain('No valid hunks');
  });

  // Edge case: context mismatch
  it('fails gracefully on context mismatch', () => {
    const original = `line 1
line 2
line 3`;

    const diff = `@@ -1,3 +1,3 @@
 line A
-line B
+line Z
 line C`;

    const result = applyUnifiedDiff(original, diff);
    expect(result.success).toBe(false);
    expect(result.error).toContain('failed to apply');
  });

  // Multi-hunk application
  it('applies multiple hunks correctly', () => {
    const original = `import pandas as pd

df = pd.read_csv("data.csv")
print(df.head())

x = df["price"]
y = df["volume"]
ratio = x / y
print(ratio)`;

    const diff = `@@ -1,2 +1,3 @@
 import pandas as pd
+import numpy as np

@@ -6,4 +7,5 @@
 x = df["price"]
 y = df["volume"]
-ratio = x / y
+ratio = np.where(y != 0, x / y, 0)
 print(ratio)`;

    const result = applyUnifiedDiff(original, diff);
    expect(result.success).toBe(true);
    expect(result.hunksApplied).toBe(2);
    expect(result.patched).toContain('import numpy as np');
    expect(result.patched).toContain('np.where(y != 0, x / y, 0)');
  });
});

// ── Structured Logger Tests ────────────────────────────────────────

describe('parsePythonError', () => {
  it('parses a SyntaxError', () => {
    const raw = `  File "<string>", line 1
    def calculate(x)
                   ^
SyntaxError: expected ':'`;

    const err = parsePythonError(raw);
    expect(err.error_type).toBe('SyntaxError');
    expect(err.line).toBe(1);
    expect(err.message).toBe("expected ':'");
  });

  it('parses a KeyError with traceback', () => {
    const raw = `Traceback (most recent call last):
  File "<string>", line 15, in <module>
KeyError: 'return'`;

    const err = parsePythonError(raw);
    expect(err.error_type).toBe('KeyError');
    expect(err.line).toBe(15);
    expect(err.message).toBe("'return'");
    expect(err.file).toBe('<string>');
  });

  it('parses an ImportError', () => {
    const raw = `Traceback (most recent call last):
  File "<string>", line 3, in <module>
ImportError: No module named 'nonexistent'`;

    const err = parsePythonError(raw);
    expect(err.error_type).toBe('ImportError');
    expect(err.line).toBe(3);
    expect(err.message).toBe("No module named 'nonexistent'");
  });

  it('parses an AttributeError', () => {
    const raw = `Traceback (most recent call last):
  File "<string>", line 7, in <module>
AttributeError: 'DataFrame' object has no attribute 'sort'`;

    const err = parsePythonError(raw);
    expect(err.error_type).toBe('AttributeError');
    expect(err.line).toBe(7);
    expect(err.message).toBe("'DataFrame' object has no attribute 'sort'");
  });

  it('parses a ZeroDivisionError', () => {
    const raw = `Traceback (most recent call last):
  File "<string>", line 12, in <module>
ZeroDivisionError: division by zero`;

    const err = parsePythonError(raw);
    expect(err.error_type).toBe('ZeroDivisionError');
    expect(err.line).toBe(12);
    expect(err.message).toBe('division by zero');
  });
});

describe('parseExecutionOutput', () => {
  it('separates warnings from errors', () => {
    const stderr = `DeprecationWarning: some warning here
Traceback (most recent call last):
  File "<string>", line 5, in <module>
ValueError: bad value`;

    const result = parseExecutionOutput('partial output', stderr);
    expect(result.warnings).toHaveLength(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].error_type).toBe('ValueError');
    expect(result.stdout).toBe('partial output');
  });

  it('handles clean stderr (no errors)', () => {
    const result = parseExecutionOutput('all good', '');
    expect(result.errors).toHaveLength(0);
    expect(result.stdout).toBe('all good');
  });
});
