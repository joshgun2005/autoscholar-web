/**
 * PDF generation from markdown using Puppeteer headless browser.
 */
import puppeteer from 'puppeteer';
import { markdownToHTML, LOGO_DATA_URI, type MarkdownPDFOptions } from './markdownToHtml';

export async function generatePDFFromMarkdown(options: MarkdownPDFOptions): Promise<Buffer> {
  const { question, answer } = options;

  // Use answer only — no question in PDF
  const markdown = answer;
  const htmlContent = markdownToHTML(markdown, question);

  let browser;
  try {
    // Launch Puppeteer
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });

    const page = await browser.newPage();

    // Set content and wait for KaTeX to render math
    await page.setContent(htmlContent, {
      waitUntil: 'networkidle0'
    });
    // Extra wait for KaTeX auto-render to finish
    await page.waitForFunction(() => {
      return !document.querySelector('.math-inline, .math-display') ||
             document.querySelector('.katex') !== null;
    }, { timeout: 5000 }).catch(() => {});

    // Generate PDF
    const pdfData = await page.pdf({
      format: 'A4',
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      },
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: `<div></div>`,
      footerTemplate: `
        <div style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 9px; color: #999; padding: 8px 0;">
          <img src="${LOGO_DATA_URI}" style="width: 16px; height: 16px;" />
          <span style="color: #119993; font-weight: 600;">AutoScholar</span>
          <span style="margin: 0 6px; color: #ddd;">|</span>
          <span>Page <span class="pageNumber"></span> / <span class="totalPages"></span></span>
          <span style="margin: 0 6px; color: #ddd;">|</span>
          <span>${new Date().toLocaleDateString('fr-FR')}</span>
        </div>
      `
    });

    await browser.close();

    // Ensure we return a proper Buffer
    const pdfBuffer = Buffer.isBuffer(pdfData) ? pdfData : Buffer.from(pdfData);
    return pdfBuffer;
  } catch (error) {
    if (browser) {
      await browser.close();
    }
    console.error('PDF generation error:', error);
    throw new Error(`Failed to generate PDF: ${(error as Error).message}`);
  }
}
