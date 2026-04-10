import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { drawLogo } from './pdf/pdfLogo';
import { addTitlePage } from './pdf/pdfTitlePage';
import { captureElementAsImage } from './pdf/htmlCapture';

interface PDFOptions {
  title: string;
  content: string;
  includeCharts?: boolean;
}

interface AdvancedPDFOptions {
  title: string;
  contentElement: HTMLElement;
  includeAllVisuals?: boolean;
}

// New function to generate PDF from full HTML content
export async function generateAdvancedPDF(options: AdvancedPDFOptions): Promise<void> {
  const { title, contentElement, includeAllVisuals = true } = options;

  console.log('generateAdvancedPDF: Starting PDF generation');
  console.log('Title:', title);
  console.log('Content element:', contentElement);
  console.log('Include visuals:', includeAllVisuals);

  // Create new PDF document
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);

  console.log('PDF page dimensions:', { pageWidth, pageHeight, margin, contentWidth });

  // Add title page first
  console.log('Adding title page...');
  addTitlePage(pdf, title);

  let yPosition = margin;

  // Add AutoScholar header with logo - amélioré
  // Dégradé simulé pour l'en-tête
  pdf.setFillColor(139, 92, 246);
  pdf.rect(0, 0, pageWidth, 40, 'F');
  pdf.setFillColor(119, 72, 226, 0.9);
  pdf.rect(0, 38, pageWidth, 2, 'F');

  // Draw small logo in header
  drawLogo(pdf, 20, 20, 9);

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(22);
  pdf.setFont('helvetica', 'bold');
  pdf.text('AutoScholar', 34, 18);

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(240, 240, 255);
  pdf.text('Financial Intelligence Platform', 34, 27);

  // Add date in header - style amélioré
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'italic');
  pdf.setTextColor(240, 240, 255);
  const date = new Date().toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  pdf.text(date, pageWidth - margin - 40, 22);

  yPosition = 52;

  // Add title avec meilleur style
  pdf.setTextColor(15, 23, 42);
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  const titleLines = pdf.splitTextToSize(title, contentWidth);
  pdf.text(titleLines, margin, yPosition);
  yPosition += (titleLines.length * 8) + 10;

  // Add horizontal line - plus élégante
  pdf.setDrawColor(139, 92, 246);
  pdf.setLineWidth(0.8);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 12;

  try {
    // Capture the entire content element directly
    console.log('Starting PDF capture...');
    const imgData = await captureElementAsImage(contentElement);

    if (!imgData) {
      console.error('Failed to capture content - imgData is null');
      throw new Error('Failed to capture content');
    }

    console.log('Content captured successfully');
    const img = new Image();
    img.src = imgData;
    await new Promise((resolve) => { img.onload = resolve; });

    const imgWidth = contentWidth;
    const imgHeight = (img.height * imgWidth) / img.width;

    console.log(`Image dimensions: ${imgWidth}x${imgHeight}`);

    // Split into multiple pages if needed
    const pageContentHeight = pageHeight - yPosition - 15;
    let currentHeight = 0;

    while (currentHeight < imgHeight) {
      const heightToAdd = Math.min(imgHeight - currentHeight, pageContentHeight);

      if (currentHeight > 0) {
        pdf.addPage();
        yPosition = margin;
      }

      pdf.addImage(
        imgData,
        'PNG',
        margin,
        yPosition - currentHeight,
        imgWidth,
        imgHeight,
        undefined,
        'FAST'
      );

      currentHeight += pageContentHeight;

      if (currentHeight < imgHeight) {
        yPosition = margin;
      }
    }
  } catch (error) {
    console.error('Error capturing content:', error);

    // Fallback: Add error message with details
    pdf.setFontSize(11);
    pdf.setTextColor(255, 0, 0);
    pdf.text('Error: Could not capture content for PDF', margin, yPosition);
    yPosition += 10;

    pdf.setFontSize(9);
    pdf.setTextColor(100, 100, 100);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    const errorLines = pdf.splitTextToSize(`Details: ${errorMsg}`, contentWidth);
    pdf.text(errorLines, margin, yPosition);

    throw error; // Re-throw to be caught by caller
  }

  // Add footer on each page - amélioré
  const pageCount = pdf.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);

    // Footer line avec dégradé
    pdf.setDrawColor(203, 213, 225);
    pdf.setLineWidth(0.5);
    pdf.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

    // Footer dots décoratifs
    pdf.setFillColor(139, 92, 246);
    pdf.circle(margin + 2, pageHeight - 15, 0.8, 'F');
    pdf.circle(pageWidth - margin - 2, pageHeight - 15, 0.8, 'F');

    // Footer text - meilleur style
    pdf.setFontSize(7.5);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 116, 139);
    pdf.text('Généré par AutoScholar • autoscholar.ai', margin, pageHeight - 9);

    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(99, 102, 241);
    pdf.text(`Page ${i} / ${pageCount}`, pageWidth - margin - 18, pageHeight - 9);
  }

  // Save PDF
  const filename = `AutoScholar_Report_${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(filename);
}

export async function generatePDF(options: PDFOptions): Promise<void> {
  const { title, content, includeCharts = true } = options;

  // Create new PDF document
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);

  // Add title page first
  addTitlePage(pdf, title);

  let yPosition = margin;

  // Add AutoScholar header with logo
  pdf.setFillColor(59, 130, 246); // Blue
  pdf.rect(0, 0, pageWidth, 30, 'F');

  // Draw small logo in header
  drawLogo(pdf, 25, 15, 7);

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(24);
  pdf.setFont('helvetica', 'bold');
  pdf.text('AutoScholar', 35, 15);

  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Financial Intelligence Platform', 35, 23);

  yPosition = 40;

  // Add title
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  const titleLines = pdf.splitTextToSize(title, contentWidth);
  pdf.text(titleLines, margin, yPosition);
  yPosition += (titleLines.length * 8) + 10;

  // Add date
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 100, 100);
  const date = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  pdf.text(`Generated on ${date}`, margin, yPosition);
  yPosition += 15;

  // Add horizontal line
  pdf.setDrawColor(200, 200, 200);
  pdf.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  // Process and add content
  pdf.setFontSize(11);
  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'normal');

  // Split content into lines for sequential processing
  const contentLines = content.split('\n');
  let i = 0;

  while (i < contentLines.length) {
    const line = contentLines[i];

    // Skip empty lines
    if (!line.trim()) {
      yPosition += 3;
      i++;
      continue;
    }

    // Detect markdown table: line starts with | and contains at least 2 |
    if (line.trim().startsWith('|') && (line.match(/\|/g) || []).length >= 2) {
      // Collect all table lines
      const tableLines: string[] = [];
      while (i < contentLines.length && contentLines[i].trim().startsWith('|')) {
        tableLines.push(contentLines[i].trim());
        i++;
      }

      // Parse the table
      if (tableLines.length >= 2) {
        // Extract header row
        const headerCells = tableLines[0].split('|').filter(c => c.trim() !== '').map(c => c.trim());
        // Skip separator row (line with ---), data starts after it
        const dataStartIdx = tableLines[1].includes('---') ? 2 : 1;
        const dataRows: string[][] = [];
        for (let r = dataStartIdx; r < tableLines.length; r++) {
          dataRows.push(tableLines[r].split('|').filter(c => c.trim() !== '').map(c => c.trim()));
        }

        const numCols = headerCells.length;
        if (numCols === 0) continue;

        // Calculate column widths — distribute evenly but adapt to content
        const colWidth = contentWidth / numCols;
        const rowHeight = 7;
        const headerHeight = 8;
        const cellPadding = 2;
        const tableFontSize = numCols > 5 ? 7 : numCols > 3 ? 8.5 : 9.5;

        // Check if table fits on current page; if not, start new page
        const totalTableHeight = headerHeight + (dataRows.length * rowHeight) + 6;
        if (yPosition + totalTableHeight > pageHeight - 30) {
          pdf.addPage();
          yPosition = margin;
        }

        const tableX = margin;
        const tableWidth = contentWidth;

        // Draw header background
        pdf.setFillColor(243, 244, 246);
        pdf.rect(tableX, yPosition - 1, tableWidth, headerHeight, 'F');

        // Draw header border
        pdf.setDrawColor(209, 213, 219);
        pdf.setLineWidth(0.3);
        pdf.rect(tableX, yPosition - 1, tableWidth, headerHeight, 'S');

        // Draw header text
        pdf.setFontSize(tableFontSize);
        pdf.setFont('helvetica', 'bold');
        pdf.setTextColor(55, 65, 81);
        for (let c = 0; c < numCols; c++) {
          const cellX = tableX + (c * colWidth) + cellPadding;
          const text = headerCells[c] || '';
          const truncated = pdf.splitTextToSize(text, colWidth - (cellPadding * 2))[0] || '';
          pdf.text(truncated, cellX, yPosition + 4);
          // Column dividers
          if (c > 0) {
            pdf.line(tableX + (c * colWidth), yPosition - 1, tableX + (c * colWidth), yPosition + headerHeight - 1);
          }
        }
        yPosition += headerHeight;

        // Draw header bottom border (thicker)
        pdf.setLineWidth(0.5);
        pdf.line(tableX, yPosition - 1, tableX + tableWidth, yPosition - 1);
        pdf.setLineWidth(0.3);

        // Draw data rows
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(75, 85, 99);
        for (let r = 0; r < dataRows.length; r++) {
          // Check page break
          if (yPosition + rowHeight > pageHeight - 30) {
            pdf.addPage();
            yPosition = margin;

            // Re-draw header on new page
            pdf.setFillColor(243, 244, 246);
            pdf.rect(tableX, yPosition - 1, tableWidth, headerHeight, 'F');
            pdf.setDrawColor(209, 213, 219);
            pdf.rect(tableX, yPosition - 1, tableWidth, headerHeight, 'S');
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(55, 65, 81);
            for (let c = 0; c < numCols; c++) {
              const cellX = tableX + (c * colWidth) + cellPadding;
              const text = headerCells[c] || '';
              const truncated = pdf.splitTextToSize(text, colWidth - (cellPadding * 2))[0] || '';
              pdf.text(truncated, cellX, yPosition + 4);
              if (c > 0) {
                pdf.line(tableX + (c * colWidth), yPosition - 1, tableX + (c * colWidth), yPosition + headerHeight - 1);
              }
            }
            yPosition += headerHeight;
            pdf.setLineWidth(0.5);
            pdf.line(tableX, yPosition - 1, tableX + tableWidth, yPosition - 1);
            pdf.setLineWidth(0.3);
            pdf.setFont('helvetica', 'normal');
            pdf.setTextColor(75, 85, 99);
          }

          // Alternating row background
          if (r % 2 === 1) {
            pdf.setFillColor(249, 250, 251);
            pdf.rect(tableX, yPosition - 1, tableWidth, rowHeight, 'F');
          }

          // Row border
          pdf.setDrawColor(229, 231, 235);
          pdf.rect(tableX, yPosition - 1, tableWidth, rowHeight, 'S');

          const row = dataRows[r];
          for (let c = 0; c < numCols; c++) {
            const cellX = tableX + (c * colWidth) + cellPadding;
            const text = (row[c] || '').replace(/\*\*/g, '').replace(/\*/g, '');
            const truncated = pdf.splitTextToSize(text, colWidth - (cellPadding * 2))[0] || '';
            pdf.text(truncated, cellX, yPosition + 4);
            // Column dividers
            if (c > 0) {
              pdf.line(tableX + (c * colWidth), yPosition - 1, tableX + (c * colWidth), yPosition + rowHeight - 1);
            }
          }
          yPosition += rowHeight;
        }

        yPosition += 6; // Space after table
        pdf.setFontSize(11);
        pdf.setTextColor(0, 0, 0);
      }
      continue;
    }

    // Check if line is a heading (starts with #)
    if (line.trim().startsWith('#')) {
      const heading = line.trim().replace(/^#+\s*/, '');

      // Check if new page needed
      if (yPosition > pageHeight - 30) {
        pdf.addPage();
        yPosition = margin;
      }

      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(59, 130, 246);
      const headingLines = pdf.splitTextToSize(heading, contentWidth);
      pdf.text(headingLines, margin, yPosition);
      yPosition += (headingLines.length * 7) + 5;

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(0, 0, 0);
      i++;
      continue;
    }

    // Regular paragraph — collect consecutive non-empty, non-special lines
    let paragraphText = '';
    while (i < contentLines.length && contentLines[i].trim() && !contentLines[i].trim().startsWith('#') && !contentLines[i].trim().startsWith('|')) {
      paragraphText += (paragraphText ? ' ' : '') + contentLines[i].trim();
      i++;
    }

    if (paragraphText) {
      const wrappedLines = pdf.splitTextToSize(paragraphText, contentWidth);
      for (const wl of wrappedLines) {
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = margin;
        }
        pdf.text(wl, margin, yPosition);
        yPosition += 6;
      }
      yPosition += 4;
    }
  }

  // Capture charts if requested
  if (includeCharts) {
    try {
      // Find all chart containers
      const chartElements = document.querySelectorAll('[data-chart]');

      for (let i = 0; i < chartElements.length; i++) {
        const element = chartElements[i] as HTMLElement;

        // Add new page for chart
        pdf.addPage();
        yPosition = margin;

        // Add chart title if available
        const chartTitle = element.getAttribute('data-chart-title');
        if (chartTitle) {
          pdf.setFontSize(14);
          pdf.setFont('helvetica', 'bold');
          pdf.text(chartTitle, margin, yPosition);
          yPosition += 10;
        }

        // Capture chart as image
        const canvas = await html2canvas(element, {
          scale: 2,
          backgroundColor: '#ffffff',
          logging: false,
        });

        const imgData = canvas.toDataURL('image/png');
        const imgWidth = contentWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        // Check if image fits on current page
        if (yPosition + imgHeight > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
        }

        pdf.addImage(imgData, 'PNG', margin, yPosition, imgWidth, imgHeight);
        yPosition += imgHeight + 10;
      }
    } catch (error) {
      console.error('Error capturing charts:', error);
    }
  }

  // Add footer on each page
  const pageCount = pdf.internal.pages.length - 1; // Subtract 1 for the internal page array
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i);

    // Footer line
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

    // Footer text
    pdf.setFontSize(9);
    pdf.setTextColor(100, 100, 100);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Generated by AutoScholar', margin, pageHeight - 10);
    pdf.text(`Page ${i} of ${pageCount}`, pageWidth - margin - 20, pageHeight - 10);
  }

  // Save PDF
  const filename = `AutoScholar_Analysis_${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(filename);
}

// Helper function to clean markdown formatting for PDF
export function cleanMarkdownForPDF(markdown: string): string {
  return markdown
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, '')
    // Remove inline code
    .replace(/`([^`]+)`/g, '$1')
    // Remove bold/italic
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    // Remove links but keep text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Clean up extra whitespace
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
