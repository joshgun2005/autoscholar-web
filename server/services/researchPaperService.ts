/**
 * Research Paper Service — thin re-export barrel.
 *
 * All implementation has been split into the latex/ subdirectory:
 *   - latex/sanitizer.ts      — LaTeX escaping, Unicode conversion, table auto-fitting
 *   - latex/paperGenerator.ts — template builders + generateResearchPaper()
 *   - latex/compiler.ts       — compileResearchPaper() (section assembly)
 *   - latex/packaging.ts      — createProjectZip()
 */
export { generateResearchPaper } from './latex/paperGenerator';
export { compileResearchPaper } from './latex/compiler';
export type { CompileResearchPaperInput } from './latex/compiler';
export { createProjectZip } from './latex/packaging';
