import html2canvas from 'html2canvas';

/**
 * Capture un élément spécifique (graphique, tableau, etc.) en PNG
 */
export async function captureChartToPNG(element: HTMLElement): Promise<string | null> {
  try {
    console.log('Capturing chart:', element.className);

    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false,
      useCORS: true,
      allowTaint: true,
      imageTimeout: 15000,
    });

    const dataUrl = canvas.toDataURL('image/png', 0.95);
    console.log('Chart captured successfully, size:', canvas.width, 'x', canvas.height);

    return dataUrl;
  } catch (error) {
    console.error('Error capturing chart:', error);
    return null;
  }
}

/**
 * Trouve et capture tous les graphiques dans le contenu
 */
export async function captureAllCharts(contentElement: HTMLElement): Promise<{ element: HTMLElement; imageData: string }[]> {
  const results: { element: HTMLElement; imageData: string }[] = [];

  // Sélecteurs pour les différents types de graphiques
  const chartSelectors = [
    '.recharts-wrapper',           // Graphiques Recharts
    '[data-chart]',                // Éléments marqués avec data-chart
    '.financial-chart',            // Charts financiers custom
    'canvas',                      // Canvas directs
    'svg.recharts-surface',        // SVG Recharts
  ];

  for (const selector of chartSelectors) {
    const charts = contentElement.querySelectorAll(selector);
    console.log(`Found ${charts.length} charts for selector: ${selector}`);

    for (const chart of charts) {
      const chartElement = chart as HTMLElement;

      // Skip si déjà capturé (pour éviter les doublons)
      if (results.some(r => r.element === chartElement)) {
        continue;
      }

      // Capturer le parent si c'est juste un SVG ou Canvas
      let elementToCapture = chartElement;
      if (chart.tagName.toLowerCase() === 'svg' || chart.tagName.toLowerCase() === 'canvas') {
        const parent = chartElement.parentElement;
        if (parent && parent.classList.contains('recharts-wrapper')) {
          elementToCapture = parent;
        }
      }

      const imageData = await captureChartToPNG(elementToCapture);
      if (imageData) {
        results.push({
          element: elementToCapture,
          imageData
        });
      }
    }
  }

  console.log(`Total charts captured: ${results.length}`);
  return results;
}
