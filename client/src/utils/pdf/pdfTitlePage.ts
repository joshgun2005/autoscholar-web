import jsPDF from 'jspdf';
import { drawLogo } from './pdfLogo';

// Helper function to add a professional title page
export function addTitlePage(doc: jsPDF, title: string): void {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - (margin * 2);

  // Background gradient effect - plus subtil
  doc.setFillColor(250, 251, 255); // Ultra light indigo
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Top decorative bar avec degrade simule
  doc.setFillColor(99, 102, 241);
  doc.rect(0, 0, pageWidth, 10, 'F');
  doc.setFillColor(79, 82, 221, 0.8);
  doc.rect(0, 8, pageWidth, 2, 'F');

  // Draw large logo in center - position amelioree
  const logoSize = 28;
  const logoX = pageWidth / 2;
  const logoY = 75;
  drawLogo(doc, logoX, logoY, logoSize);

  // Main title avec meilleur espacement
  doc.setTextColor(55, 48, 163); // Indigo-700
  doc.setFontSize(42);
  doc.setFont('helvetica', 'bold');
  const mainTitle = 'AutoScholar';
  const titleWidth = doc.getTextWidth(mainTitle);
  doc.text(mainTitle, (pageWidth - titleWidth) / 2, 125);

  // Subtitle avec meilleure taille
  doc.setFontSize(13);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(99, 102, 241);
  const subtitle = 'Analyse Financi\u00e8re par Intelligence Artificielle';
  const subtitleWidth = doc.getTextWidth(subtitle);
  doc.text(subtitle, (pageWidth - subtitleWidth) / 2, 137);

  // Decorative line plus elegante
  doc.setDrawColor(139, 92, 246);
  doc.setLineWidth(0.8);
  const lineWidth = 70;
  doc.line((pageWidth - lineWidth) / 2, 148, (pageWidth + lineWidth) / 2, 148);

  // Report title
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(71, 85, 105);
  doc.text('RAPPORT D\'ANALYSE', pageWidth / 2, 165, { align: 'center' });

  // Title box avec shadow effect
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  const titleLines = doc.splitTextToSize(title, maxWidth - 30);
  const boxHeight = titleLines.length * 8 + 16;
  const boxY = 175;

  // Shadow
  doc.setFillColor(226, 232, 240);
  doc.roundedRect((pageWidth - maxWidth + 28) / 2 + 1, boxY + 1, maxWidth - 26, boxHeight, 4, 4, 'F');

  // Box principal
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.roundedRect((pageWidth - maxWidth + 28) / 2, boxY, maxWidth - 26, boxHeight, 4, 4, 'FD');

  let textY = boxY + 10;
  titleLines.forEach((line: string) => {
    doc.text(line, pageWidth / 2, textY, { align: 'center' });
    textY += 8;
  });

  // Date and metadata avec meilleur style
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 116, 139);
  const dateStr = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  doc.text(`G\u00e9n\u00e9r\u00e9 le ${dateStr}`, pageWidth / 2, pageHeight - 45, { align: 'center' });

  // Footer decorative line
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.line(40, pageHeight - 30, pageWidth - 40, pageHeight - 30);

  // Footer decorative elements - plus elegants
  doc.setFillColor(139, 92, 246);
  doc.circle(35, pageHeight - 20, 1.5, 'F');
  doc.circle(pageWidth - 35, pageHeight - 20, 1.5, 'F');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);
  doc.text('autoscholar.ai', pageWidth / 2, pageHeight - 18, { align: 'center' });

  // Watermark subtil
  doc.setFontSize(8);
  doc.setTextColor(203, 213, 225);
  doc.text('Confidentiel', pageWidth / 2, pageHeight - 10, { align: 'center' });

  // Add new page for content
  doc.addPage();
}
