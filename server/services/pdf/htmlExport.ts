/**
 * Standalone HTML export from markdown content.
 */
import { markdownToHTML, type MarkdownPDFOptions } from './markdownToHtml';

export function generateHTMLFromMarkdown(options: MarkdownPDFOptions): string {
  const { question, answer } = options;
  return markdownToHTML(answer, question);
}
