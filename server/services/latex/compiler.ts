/**
 * Compiler — assembles individually-written sections and delegates to generateResearchPaper.
 *
 * Exports compileResearchPaper() which sorts sections into canonical academic order
 * and passes them to the full LaTeX compilation pipeline.
 */
import { generateResearchPaper } from './paperGenerator';
import { ResearchPaperResult } from './sanitizer';

export interface CompileResearchPaperInput {
  sections: { type: string; latex_content: string }[];
  bibtex_entries?: string;
  title: string;
  authors?: string;
  abstract?: string;
  keywords?: string[];
  template?: 'article' | 'working_paper' | 'econometrica';
  figures?: { id: string; base64: string }[];
  filename?: string;
}

/**
 * Canonical section ordering for research papers.
 * Supports both empirical and theoretical paper structures.
 * Theoretical sections (economic_environment, equilibrium, etc.) map to the same
 * canonical positions as their empirical counterparts so both types sort correctly.
 */
const SECTION_ORDER: Record<string, number> = {
  // Empirical paper sections
  introduction: 1,
  literature_review: 2,
  methodology: 3,
  data: 4,
  results: 5,
  discussion: 6,
  conclusion: 7,
  // Theoretical paper sections (mapped to equivalent positions)
  economic_environment: 3,   // replaces methodology
  equilibrium: 4,            // replaces data
  computational_method: 4.5, // between equilibrium and results
  quantitative_results: 5,   // replaces results
  extensions: 5.5,           // after quantitative results, before discussion
  // Appendix — always last (after conclusion, before \end{document})
  appendix: 8,
};

/**
 * Assemble individually-written sections into a complete research paper PDF.
 *
 * Sections are sorted into canonical academic order, concatenated, and passed
 * to the existing `generateResearchPaper()` pipeline for LaTeX compilation.
 */
export async function compileResearchPaper(input: CompileResearchPaperInput): Promise<ResearchPaperResult> {
  if (!input.sections || input.sections.length === 0) {
    return { success: false, error: 'No sections provided for compilation.' };
  }

  // Sort sections by canonical order (unknown types go at the end)
  const sorted = [...input.sections].sort((a, b) => {
    const orderA = SECTION_ORDER[a.type] ?? 99;
    const orderB = SECTION_ORDER[b.type] ?? 99;
    return orderA - orderB;
  });

  // Concatenate LaTeX content with spacing.
  // Insert \appendix command before appendix sections so LaTeX switches to lettered numbering (A, B, C...).
  const latex_content = sorted
    .map(s => {
      if (s.type === 'appendix') {
        // Ensure \appendix command is present before appendix content
        const hasAppendixCmd = s.latex_content.trimStart().startsWith('\\appendix');
        return hasAppendixCmd ? s.latex_content : `\\appendix\n\\newpage\n${s.latex_content}`;
      }
      return s.latex_content;
    })
    .join('\n\n');

  // Delegate to existing compilation pipeline
  return generateResearchPaper({
    latex_content,
    bibtex_entries: input.bibtex_entries,
    title: input.title,
    authors: input.authors,
    abstract: input.abstract,
    keywords: input.keywords,
    template: input.template,
    figures: input.figures,
    filename: input.filename,
  });
}
