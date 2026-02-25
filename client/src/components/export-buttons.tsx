import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { useTheme } from "./theme-provider";

interface ExportButtonsProps {
  contentRef: React.RefObject<HTMLElement>;
}

export function ExportButtons({ contentRef }: ExportButtonsProps) {
  const { theme } = useTheme();

  const handlePrintPDF = () => {
    if (contentRef.current) {
      const printWindow = window.open('', '', 'width=800,height=600');
      if (printWindow) {
        const isDark = theme === 'dark';

        const logoSvg = `
          <svg width="120" height="120" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style="stop-color:#8b5cf6;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#a855f7;stop-opacity:1" />
              </linearGradient>
            </defs>
            <circle cx="100" cy="100" r="90" fill="url(#grad1)"/>
            <text x="100" y="130" font-family="Arial, sans-serif" font-size="80" font-weight="bold" fill="white" text-anchor="middle">VQ</text>
            <path d="M 40 140 L 55 125 L 70 135 L 85 115" stroke="white" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.4"/>
            <path d="M 115 115 L 130 125 L 145 110 L 160 120" stroke="white" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.4"/>
            <circle cx="40" cy="140" r="3" fill="white" opacity="0.6"/>
            <circle cx="55" cy="125" r="3" fill="white" opacity="0.6"/>
            <circle cx="70" cy="135" r="3" fill="white" opacity="0.6"/>
            <circle cx="85" cy="115" r="3" fill="white" opacity="0.6"/>
            <circle cx="115" cy="115" r="3" fill="white" opacity="0.6"/>
            <circle cx="130" cy="125" r="3" fill="white" opacity="0.6"/>
            <circle cx="145" cy="110" r="3" fill="white" opacity="0.6"/>
            <circle cx="160" cy="120" r="3" fill="white" opacity="0.6"/>
          </svg>
        `;

        const styles = `
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }

            body {
              font-family: 'Inter', system-ui, -apple-system, sans-serif;
              line-height: 1.6;
              color: ${isDark ? '#e5e7eb' : '#1f2937'};
              background: ${isDark ? '#0f172a' : '#ffffff'};
              padding: 0;
            }

            .title-page {
              min-height: 100vh;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              background: linear-gradient(135deg, #eef2ff 0%, #f5f3ff 100%);
              page-break-after: always;
              padding: 3rem;
              text-align: center;
            }

            .title-page-header {
              width: 100%;
              height: 8px;
              background: linear-gradient(90deg, #6366f1, #8b5cf6, #a855f7);
              position: absolute;
              top: 0;
              left: 0;
            }

            .title-page-logo {
              margin-bottom: 2rem;
            }

            .title-page h1 {
              font-size: 3rem;
              font-weight: 700;
              color: #4338ca;
              margin-bottom: 1rem;
            }

            .title-page h2 {
              font-size: 1.25rem;
              font-weight: 400;
              color: #6366f1;
              margin-bottom: 3rem;
            }

            .title-page-divider {
              width: 100px;
              height: 2px;
              background: linear-gradient(90deg, transparent, #8b5cf6, transparent);
              margin: 2rem auto;
            }

            .title-page-report-title {
              font-size: 1rem;
              font-weight: 600;
              color: #334155;
              text-transform: uppercase;
              letter-spacing: 0.1em;
              margin-bottom: 1rem;
            }

            .title-page-question {
              max-width: 600px;
              padding: 1.5rem;
              background: white;
              border-radius: 8px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              margin: 0 auto 3rem;
              font-size: 1.1rem;
              color: #1e293b;
            }

            .title-page-date {
              font-size: 0.9rem;
              color: #64748b;
              margin-top: 3rem;
            }

            .title-page-footer {
              position: absolute;
              bottom: 2rem;
              font-size: 0.85rem;
              color: #94a3b8;
            }

            .content-page {
              padding: 2rem;
            }

            h1, h2, h3, h4, h5, h6 {
              font-weight: 600;
              margin-top: 1.5rem;
              margin-bottom: 0.75rem;
            }

            h1 { font-size: 2rem; }
            h2 { font-size: 1.5rem; }
            h3 { font-size: 1.25rem; }

            p {
              margin-bottom: 1rem;
            }

            ul, ol {
              margin-left: 1.5rem;
              margin-bottom: 1rem;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin: 1rem 0;
            }

            th, td {
              border: 1px solid ${isDark ? '#374151' : '#e5e7eb'};
              padding: 0.5rem;
              text-align: left;
            }

            th {
              background: ${isDark ? '#1f2937' : '#f3f4f6'};
              font-weight: 600;
            }

            .card {
              background: ${isDark ? '#1e293b' : '#f9fafb'};
              border: 1px solid ${isDark ? '#334155' : '#e5e7eb'};
              border-radius: 0.5rem;
              padding: 1.5rem;
              margin-bottom: 1rem;
            }

            .header {
              display: flex;
              align-items: center;
              gap: 1rem;
              margin-bottom: 2rem;
              padding-bottom: 1rem;
              border-bottom: 2px solid ${isDark ? '#334155' : '#e5e7eb'};
            }

            .header-logo {
              width: 50px;
              height: 50px;
            }

            .logo-text {
              font-size: 1.5rem;
              font-weight: 600;
              background: linear-gradient(135deg, #8b5cf6, #a855f7);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
            }

            code {
              background: ${isDark ? '#1f2937' : '#f3f4f6'};
              padding: 0.125rem 0.25rem;
              border-radius: 0.25rem;
              font-family: 'JetBrains Mono', monospace;
              font-size: 0.875rem;
            }

            pre {
              background: ${isDark ? '#1f2937' : '#f3f4f6'};
              padding: 1rem;
              border-radius: 0.5rem;
              overflow-x: auto;
              margin: 1rem 0;
            }

            @media print {
              body {
                padding: 0;
              }

              .title-page {
                page-break-after: always;
              }

              .card {
                page-break-inside: avoid;
              }

              h1, h2, h3 {
                page-break-after: avoid;
              }
            }
          </style>
        `;

        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="UTF-8">
              <title>VibeQuant - Rapport d'Analyse Financière</title>
              ${styles}
            </head>
            <body>
              <div class="title-page">
                <div class="title-page-header"></div>
                <div class="title-page-logo">
                  ${logoSvg}
                </div>
                <h1>VibeQuant</h1>
                <h2>Analyse Financière par Intelligence Artificielle</h2>
                <div class="title-page-divider"></div>
                <div class="title-page-report-title">Rapport d'Analyse</div>
                <div class="title-page-date">
                  Généré le ${new Date().toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
                <div class="title-page-footer">www.vibequant.com</div>
              </div>

              <div class="content-page">
                <div class="header">
                  <svg class="header-logo" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style="stop-color:#8b5cf6;stop-opacity:1" />
                        <stop offset="100%" style="stop-color:#a855f7;stop-opacity:1" />
                      </linearGradient>
                    </defs>
                    <circle cx="100" cy="100" r="90" fill="url(#grad2)"/>
                    <text x="100" y="130" font-family="Arial, sans-serif" font-size="80" font-weight="bold" fill="white" text-anchor="middle">VQ</text>
                  </svg>
                  <div>
                    <div class="logo-text">VibeQuant</div>
                    <p style="color: ${isDark ? '#9ca3af' : '#6b7280'}; font-size: 0.875rem; margin-top: 0.25rem;">
                      Analyse Financière par IA
                    </p>
                  </div>
                </div>
                ${contentRef.current.innerHTML}
              </div>
            </body>
          </html>
        `);

        printWindow.document.close();

        setTimeout(() => {
          printWindow.focus();
          printWindow.print();
          printWindow.close();
        }, 250);
      }
    }
  };

  const handleDownloadHTML = () => {
    if (contentRef.current) {
      const isDark = theme === 'dark';

      const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VibeQuant - Rapport d'Analyse Financière</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      line-height: 1.6;
      color: ${isDark ? '#e5e7eb' : '#1f2937'};
      background: ${isDark ? '#0f172a' : '#ffffff'};
      padding: 0;
    }

    .title-page {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #eef2ff 0%, #f5f3ff 100%);
      padding: 3rem;
      text-align: center;
      position: relative;
    }

    .title-page-header {
      width: 100%;
      height: 8px;
      background: linear-gradient(90deg, #6366f1, #8b5cf6, #a855f7);
      position: absolute;
      top: 0;
      left: 0;
    }

    .title-page-logo {
      margin-bottom: 2rem;
    }

    .title-page h1 {
      font-size: 3rem;
      font-weight: 700;
      color: #4338ca;
      margin-bottom: 1rem;
    }

    .title-page h2 {
      font-size: 1.25rem;
      font-weight: 400;
      color: #6366f1;
      margin-bottom: 3rem;
    }

    .title-page-divider {
      width: 100px;
      height: 2px;
      background: linear-gradient(90deg, transparent, #8b5cf6, transparent);
      margin: 2rem auto;
    }

    .title-page-report-title {
      font-size: 1rem;
      font-weight: 600;
      color: #334155;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 1rem;
    }

    .title-page-date {
      font-size: 0.9rem;
      color: #64748b;
      margin-top: 3rem;
    }

    .title-page-footer {
      position: absolute;
      bottom: 2rem;
      font-size: 0.85rem;
      color: #94a3b8;
    }

    .content-page {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    h1, h2, h3, h4, h5, h6 {
      font-weight: 600;
      margin-top: 1.5rem;
      margin-bottom: 0.75rem;
    }

    h1 { font-size: 2rem; }
    h2 { font-size: 1.5rem; }
    h3 { font-size: 1.25rem; }

    p {
      margin-bottom: 1rem;
    }

    ul, ol {
      margin-left: 1.5rem;
      margin-bottom: 1rem;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 1rem 0;
    }

    th, td {
      border: 1px solid ${isDark ? '#374151' : '#e5e7eb'};
      padding: 0.5rem;
      text-align: left;
    }

    th {
      background: ${isDark ? '#1f2937' : '#f3f4f6'};
      font-weight: 600;
    }

    .card {
      background: ${isDark ? '#1e293b' : '#f9fafb'};
      border: 1px solid ${isDark ? '#334155' : '#e5e7eb'};
      border-radius: 0.5rem;
      padding: 1.5rem;
      margin-bottom: 1rem;
    }

    .header {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid ${isDark ? '#334155' : '#e5e7eb'};
    }

    .header-logo {
      width: 50px;
      height: 50px;
    }

    .logo-text {
      font-size: 1.5rem;
      font-weight: 600;
      background: linear-gradient(135deg, #8b5cf6, #a855f7);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    code {
      background: ${isDark ? '#1f2937' : '#f3f4f6'};
      padding: 0.125rem 0.25rem;
      border-radius: 0.25rem;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.875rem;
    }

    pre {
      background: ${isDark ? '#1f2937' : '#f3f4f6'};
      padding: 1rem;
      border-radius: 0.5rem;
      overflow-x: auto;
      margin: 1rem 0;
    }

    @media print {
      .title-page {
        page-break-after: always;
      }

      .card {
        page-break-inside: avoid;
      }

      h1, h2, h3 {
        page-break-after: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="title-page">
    <div class="title-page-header"></div>
    <div class="title-page-logo">
      <svg width="120" height="120" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#8b5cf6;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#a855f7;stop-opacity:1" />
          </linearGradient>
        </defs>
        <circle cx="100" cy="100" r="90" fill="url(#grad1)"/>
        <text x="100" y="130" font-family="Arial, sans-serif" font-size="80" font-weight="bold" fill="white" text-anchor="middle">VQ</text>
        <path d="M 40 140 L 55 125 L 70 135 L 85 115" stroke="white" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.4"/>
        <path d="M 115 115 L 130 125 L 145 110 L 160 120" stroke="white" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.4"/>
        <circle cx="40" cy="140" r="3" fill="white" opacity="0.6"/>
        <circle cx="55" cy="125" r="3" fill="white" opacity="0.6"/>
        <circle cx="70" cy="135" r="3" fill="white" opacity="0.6"/>
        <circle cx="85" cy="115" r="3" fill="white" opacity="0.6"/>
        <circle cx="115" cy="115" r="3" fill="white" opacity="0.6"/>
        <circle cx="130" cy="125" r="3" fill="white" opacity="0.6"/>
        <circle cx="145" cy="110" r="3" fill="white" opacity="0.6"/>
        <circle cx="160" cy="120" r="3" fill="white" opacity="0.6"/>
      </svg>
    </div>
    <h1>VibeQuant</h1>
    <h2>Analyse Financière par Intelligence Artificielle</h2>
    <div class="title-page-divider"></div>
    <div class="title-page-report-title">Rapport d'Analyse</div>
    <div class="title-page-date">
      Généré le ${new Date().toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}
    </div>
    <div class="title-page-footer">www.vibequant.com</div>
  </div>

  <div class="content-page">
    <div class="header">
      <svg class="header-logo" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#8b5cf6;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#a855f7;stop-opacity:1" />
          </linearGradient>
        </defs>
        <circle cx="100" cy="100" r="90" fill="url(#grad2)"/>
        <text x="100" y="130" font-family="Arial, sans-serif" font-size="80" font-weight="bold" fill="white" text-anchor="middle">VQ</text>
      </svg>
      <div>
        <div class="logo-text">VibeQuant</div>
        <p style="color: ${isDark ? '#9ca3af' : '#6b7280'}; font-size: 0.875rem; margin-top: 0.25rem;">
          Analyse Financière par IA
        </p>
      </div>
    </div>
    ${contentRef.current.innerHTML}
  </div>
</body>
</html>`;

      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `financial-report-${new Date().toISOString().split('T')[0]}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handlePrintPDF}
        data-testid="button-print-pdf"
        className="hover-elevate active-elevate-2"
      >
        <FileText className="w-4 h-4 mr-2" />
        Imprimer PDF
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleDownloadHTML}
        data-testid="button-download-html"
        className="hover-elevate active-elevate-2"
      >
        <Download className="w-4 h-4 mr-2" />
        Télécharger HTML
      </Button>
    </div>
  );
}
