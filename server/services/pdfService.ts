/**
 * PDF/document generation services.
 * Re-exports from modular pdf/ subdirectory for backward compatibility.
 */
export { generateHTMLFromMarkdown } from './pdf/htmlExport';
export { generatePDFFromMarkdown } from './pdf/puppeteerPdf';
export { generateDOCXFromMarkdown } from './pdf/pandocDocx';
export type { MarkdownPDFOptions } from './pdf/markdownToHtml';
