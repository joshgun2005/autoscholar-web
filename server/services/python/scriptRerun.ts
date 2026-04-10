import { readScript } from './scriptManager';
import { runPythonScript, CustomPythonResult } from './customPython';

/**
 * Re-run an already-saved (and possibly patched) script by its ID.
 */
export async function rerunScript(
  scriptId: string,
  context?: Record<string, any>,
): Promise<{ success: boolean; result?: CustomPythonResult; code: string; error?: string; scriptId: string; structuredErrors?: string; fabricationWarnings?: string[] }> {
  const readResult = readScript(scriptId);
  if (!readResult.success || !readResult.content) {
    return {
      success: false,
      code: '',
      error: readResult.error || 'Failed to read script.',
      scriptId,
    };
  }

  const execResult = await runPythonScript(readResult.content, context, scriptId);
  return {
    ...execResult,
    code: readResult.content,
    scriptId,
  };
}
