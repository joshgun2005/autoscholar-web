/**
 * DOCX generation from markdown using Pandoc CLI.
 */
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import type { MarkdownPDFOptions } from './markdownToHtml';

const execAsync = promisify(exec);

export async function generateDOCXFromMarkdown(options: MarkdownPDFOptions): Promise<Buffer> {
  const { question, answer } = options;

  // Create temp directory if it doesn't exist
  const tempDir = path.join(process.cwd(), 'temp');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  // Generate unique filenames
  const timestamp = Date.now();
  const mdPath = path.join(tempDir, `report-${timestamp}.md`);
  const docxPath = path.join(tempDir, `report-${timestamp}.docx`);

  try {
    // Use answer only — no question in DOCX
    const markdown = answer;

    // Write markdown to temp file
    fs.writeFileSync(mdPath, markdown, 'utf-8');

    // Generate DOCX using Pandoc
    await execAsync(`pandoc "${mdPath}" -f markdown -t docx -o "${docxPath}"`);

    // Read the generated DOCX file
    const docxBuffer = fs.readFileSync(docxPath);

    // Clean up temp files
    fs.unlinkSync(mdPath);
    fs.unlinkSync(docxPath);

    return docxBuffer;
  } catch (error) {
    // Clean up files on error
    if (fs.existsSync(mdPath)) fs.unlinkSync(mdPath);
    if (fs.existsSync(docxPath)) fs.unlinkSync(docxPath);
    throw new Error(`Failed to generate DOCX: ${(error as Error).message}`);
  }
}
