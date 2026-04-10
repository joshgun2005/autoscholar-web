/**
 * Financial tool definitions — combined from 4 domain-specific parts.
 *
 * Part 1 (core):     Profile, statements, quotes, prices, search, technical, options, macro
 * Part 2 (market):   ETF, SEC, news, screening, indices, sector analysis
 * Part 3 (extended): Financial data variants, bulk endpoints, advanced search
 * Part 4 (advanced): Additional technical, prediction, crowdfunding, download
 *
 * Each part is ~800-1000 lines for AI-friendly editing.
 */

import type { ClaudeToolDefinition } from './types';
import { FINANCIAL_TOOLS_PART1 } from './financialTools-core';
import { FINANCIAL_TOOLS_PART2 } from './financialTools-market';
import { FINANCIAL_TOOLS_PART3 } from './financialTools-extended';
import { FINANCIAL_TOOLS_PART4 } from './financialTools-advanced';

export const FINANCIAL_TOOLS: ClaudeToolDefinition[] = [
  ...FINANCIAL_TOOLS_PART1,
  ...FINANCIAL_TOOLS_PART2,
  ...FINANCIAL_TOOLS_PART3,
  ...FINANCIAL_TOOLS_PART4,
];
