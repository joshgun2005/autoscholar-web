import type { ClaudeToolDefinition } from './types';
import { FINANCIAL_TOOLS } from './financialTools';
import { WEB_TOOLS } from './webTools';
import { PYTHON_TOOLS } from './pythonTools';
import { ACADEMIC_TOOLS } from './academicTools';
import { RESEARCH_PAPER_TOOLS } from './researchPaperTools';
import { MACRO_DATA_TOOLS } from './macroDataTools';
import { POLYMARKET_TOOLS } from './polymarketTools';

export type { ClaudeToolDefinition };

export const AVAILABLE_TOOLS: ClaudeToolDefinition[] = [
  ...FINANCIAL_TOOLS,
  ...WEB_TOOLS,
  ...PYTHON_TOOLS,
  ...ACADEMIC_TOOLS,
  ...RESEARCH_PAPER_TOOLS,
  ...MACRO_DATA_TOOLS,
  ...POLYMARKET_TOOLS,
];
