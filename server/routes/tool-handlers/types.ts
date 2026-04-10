/**
 * Types and helpers for the tool executor.
 * Extracted from toolExecutor.ts for modularity.
 */

export interface ToolExecutorContext {
  safeWrite: (data: string) => void;
  sessionId: string;
  userId: string | null;
  authorName: string | null;
  customPythonFiguresData: Array<{ id: string; scriptId?: string; figures: string[]; figureUrls?: string[]; output?: string; description?: string }>;
  paperSectionsStore: Array<{ type: string; latex_content: string; bibtex_keys?: string[]; figure_ids?: string[] }>;
  pythonCodeEntries: Array<{ id: string; code: string; description: string; agent?: string; timestamp: number; status: string; error?: string; duration?: number }>;
  sessionDataFiles: Array<{ filename: string; filepath: string; data_type?: string }>;
  sessionMetadata: Array<{ filename: string; metadata: any }>;
  refs: {
    lastCompilationId: string | null;
    pythonCodeUsed: string;
    monteCarloData: any;
  };
}

/** Extract agent prefix (TURING/NEWTON/FISHER) from Python script description */
export function parseAgentPrefix(description: string): { agent: string; cleanDescription: string } {
  const match = description.match(/^(TURING|NEWTON|FISHER):\s*(.*)/i);
  if (match) return { agent: match[1].toLowerCase(), cleanDescription: match[2] };
  return { agent: 'unknown', cleanDescription: description };
}

/** Map agent to pipeline step number and base filename */
export const AGENT_PIPELINE_MAP: Record<string, { prefix: string; basename: string }> = {
  turing: { prefix: '01', basename: 'data_collection' },
  newton: { prefix: '02', basename: 'data_cleaning' },
  fisher: { prefix: '03', basename: 'analysis' },
  unknown: { prefix: '09', basename: 'misc' },
};

/** Build pipeline-ordered script list from pythonCodeEntries */
export function buildPipelineScripts(
  entries: Array<{ code: string; description: string; agent?: string; status: string }>
): { filename: string; code: string }[] {
  const completed = entries.filter(e => e.status === 'completed' || e.status === 'success');
  const agentGroups: Record<string, typeof completed> = {};

  for (const entry of completed) {
    const agent = entry.agent || parseAgentPrefix(entry.description).agent;
    if (!agentGroups[agent]) agentGroups[agent] = [];
    agentGroups[agent].push(entry);
  }

  const result: { filename: string; code: string }[] = [];

  for (const agent of ['turing', 'newton', 'fisher', 'unknown']) {
    const group = agentGroups[agent];
    if (!group || group.length === 0) continue;
    const { prefix, basename } = AGENT_PIPELINE_MAP[agent];

    if (group.length === 1) {
      result.push({ filename: `${prefix}_${basename}.py`, code: group[0].code });
    } else {
      const suffixes = ['', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
      for (let i = 0; i < group.length; i++) {
        const suffix = i < suffixes.length ? suffixes[i] : `_${i + 1}`;
        result.push({ filename: `${prefix}${suffix}_${basename}.py`, code: group[i].code });
      }
    }
  }

  return result;
}
