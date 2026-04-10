import html2canvas from 'html2canvas';

// Helper to capture element as image
export async function captureElementAsImage(element: HTMLElement): Promise<string | null> {
  try {
    console.log('captureElementAsImage: Starting capture');
    console.log('Element:', element);
    console.log('Element dimensions:', {
      width: element.scrollWidth,
      height: element.scrollHeight,
      offsetWidth: element.offsetWidth,
      offsetHeight: element.offsetHeight
    });
    console.log('Element innerHTML length:', element.innerHTML.length);

    // Clone the element to avoid modifying the original
    const clone = element.cloneNode(true) as HTMLElement;

    // Remove any animations or transitions that might interfere
    clone.style.animation = 'none';
    clone.style.transition = 'none';

    // Temporarily add to DOM for measurement
    clone.style.position = 'absolute';
    clone.style.left = '-9999px';
    clone.style.visibility = 'hidden';
    clone.style.pointerEvents = 'none';
    clone.style.width = element.scrollWidth + 'px';
    document.body.appendChild(clone);

    // Wait for any images or charts to load
    await new Promise(resolve => setTimeout(resolve, 500));

    const canvas = await html2canvas(clone, {
      scale: 2, // Reduit a 2 pour equilibrer qualite et vitesse
      backgroundColor: '#ffffff',
      logging: true, // Active pour deboguer
      useCORS: true,
      allowTaint: true,
      foreignObjectRendering: true,
      removeContainer: false,
      imageTimeout: 15000,
      // Amelioration de la qualite de rendu
      width: clone.scrollWidth,
      height: clone.scrollHeight,
      windowWidth: clone.scrollWidth,
      windowHeight: clone.scrollHeight,
      onclone: (clonedDoc) => {
        const style = clonedDoc.createElement('style');
        style.textContent = `
          * {
            animation: none !important;
            transition: none !important;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
          }
          /* Ameliorer le rendu des polices */
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
          }
          /* Ensure charts and canvases are visible */
          canvas, svg {
            display: block !important;
            visibility: visible !important;
          }
          /* Fix potential display issues */
          .recharts-wrapper, .recharts-surface {
            display: block !important;
          }
        `;
        clonedDoc.head.appendChild(style);

        // Force render all canvas elements
        const canvases = clonedDoc.querySelectorAll('canvas');
        canvases.forEach((canvas) => {
          canvas.style.display = 'block';
          canvas.style.visibility = 'visible';
        });
      }
    });

    // Clean up
    document.body.removeChild(clone);

    console.log('Canvas created:', {
      width: canvas.width,
      height: canvas.height
    });

    const dataUrl = canvas.toDataURL('image/png', 1.0);
    console.log('DataURL created, length:', dataUrl.length);

    return dataUrl;
  } catch (error) {
    console.error('Error capturing element:', error);
    console.error('Error stack:', error);
    return null;
  }
}
