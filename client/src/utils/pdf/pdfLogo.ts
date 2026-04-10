import jsPDF from 'jspdf';

// Helper function to draw the AutoScholar logo
export function drawLogo(doc: jsPDF, x: number, y: number, size: number): void {
  // Draw gradient circle background
  doc.setFillColor(139, 92, 246); // Purple
  doc.circle(x, y, size, 'F');

  // Add lighter circle for depth
  doc.setFillColor(168, 85, 247);
  doc.circle(x - size * 0.15, y - size * 0.15, size * 0.6, 'F');

  // Draw "VQ" text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(size * 1.2);
  doc.setFont('helvetica', 'bold');
  const vqText = 'VQ';
  const textWidth = doc.getTextWidth(vqText);
  doc.text(vqText, x - textWidth / 2, y + size * 0.25);

  // Draw small chart lines for visual effect
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.5);
  const chartY = y + size * 0.7;
  const chartPoints = [
    { x: x - size * 0.6, y: chartY },
    { x: x - size * 0.3, y: chartY - size * 0.2 },
    { x: x, y: chartY - size * 0.1 },
    { x: x + size * 0.3, y: chartY - size * 0.3 },
    { x: x + size * 0.6, y: chartY - size * 0.15 }
  ];

  for (let i = 0; i < chartPoints.length - 1; i++) {
    doc.line(
      chartPoints[i].x,
      chartPoints[i].y,
      chartPoints[i + 1].x,
      chartPoints[i + 1].y
    );
    doc.circle(chartPoints[i].x, chartPoints[i].y, 0.5, 'F');
  }
  doc.circle(chartPoints[chartPoints.length - 1].x, chartPoints[chartPoints.length - 1].y, 0.5, 'F');
}
