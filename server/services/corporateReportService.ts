import axios from 'axios';
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';
import { marked } from 'marked';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

export interface CorporateReportOptions {
  question: string;
  answer: string;
  author: string;
  company?: string;
  figureUrls?: string[];
}

interface KeyMetric {
  label: string;
  value: string;
  trend?: 'up' | 'down' | 'neutral';
}

interface ReportMeta {
  title: string;
  executive_summary: string;
  key_metrics: KeyMetric[];
  conclusion: string;
}

// ─── 1. Load figures as base64 ────────────────────────────────────────────────

function loadFiguresAsBase64(figureUrls?: string[]): string[] {
  if (!figureUrls || figureUrls.length === 0) return [];

  const figuresDir = path.join(process.cwd(), 'dist', 'public', 'figures');
  const altFiguresDir = path.join(process.cwd(), 'public', 'figures');

  return figureUrls.map((url, i) => {
    if (url.startsWith('data:image')) return url;
    if (url.length > 200 && !url.startsWith('/') && !url.startsWith('http')) {
      return `data:image/png;base64,${url}`;
    }
    const filename = url.replace(/^\/figures\//, '').replace(/^\/plots\//, '');
    const candidates = [
      path.join(figuresDir, filename),
      path.join(altFiguresDir, filename),
      path.join(process.cwd(), 'dist', 'public', url.startsWith('/') ? url.slice(1) : url),
    ];
    for (const filePath of candidates) {
      try {
        if (fs.existsSync(filePath)) {
          const buffer = fs.readFileSync(filePath);
          if (buffer.length > 0) return `data:image/png;base64,${buffer.toString('base64')}`;
        }
      } catch { /* continue */ }
    }
    console.warn(`[Report] Figure ${i} not found: ${url.substring(0, 80)}`);
    return '';
  });
}

// ─── 2. Claude: extract report metadata ──────────────────────────────────────

async function extractReportMeta(options: CorporateReportOptions): Promise<ReportMeta> {
  if (!ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY not configured');

  let content = options.answer;
  if (content.length > 18000) {
    content = content.substring(0, 18000) + '\n\n[contenu tronqué]';
  }

  const systemPrompt = `Tu es analyste financier senior (style institutionnel Goldman Sachs / McKinsey).
À partir d'une analyse, génère les métadonnées d'un rapport corporatif en JSON strict.

RÈGLES ABSOLUES:
- Retourne UNIQUEMENT du JSON valide, aucun texte avant ou après
- Ton professionnel et institutionnel
- Extrais les vraies valeurs numériques présentes dans l'analyse
- 4 à 8 métriques clés maximum
- trend: "up" (positif/hausse), "down" (négatif/baisse), "neutral" (stable)

Structure JSON exacte:
{
  "title": "Titre court et précis (max 12 mots)",
  "executive_summary": "Résumé exécutif en 3-5 phrases. Synthèse des conclusions principales et implications pour l'investisseur.",
  "key_metrics": [
    { "label": "Nom métrique", "value": "Valeur avec unité", "trend": "up" }
  ],
  "conclusion": "Paragraphe de conclusion et recommandations en 3-4 phrases. Perspectives et risques clés."
}`;

  const userPrompt = `QUESTION: ${options.question}\n\nANALYSE:\n${content}\n\nRetourne le JSON.`;

  try {
    console.log('[Report] Extracting metadata with Claude...');
    const response = await axios.post(
      ANTHROPIC_API_URL,
      {
        model: 'claude-opus-4-6',
        max_tokens: 2500,
        temperature: 0.1,
        messages: [{ role: 'user', content: userPrompt }],
        system: systemPrompt,
      },
      {
        headers: {
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        timeout: 90000,
      }
    );

    let jsonText = response.data.content[0].text;
    jsonText = jsonText.replace(/^```json\n?/gm, '').replace(/^```\n?/gm, '').replace(/\n?```$/gm, '').trim();
    const meta = JSON.parse(jsonText) as ReportMeta;
    console.log('[Report] ✓ Metadata extracted, title:', meta.title);
    return meta;
  } catch (error) {
    console.error('[Report] Error extracting meta:', error);
    const headingMatch = options.answer.match(/^#{1,2}\s+(.+)$/m);
    return {
      title: headingMatch ? headingMatch[1].trim() : 'Rapport d\'Analyse Financière',
      executive_summary: options.answer.substring(0, 500).replace(/[#*_`]/g, '').trim(),
      key_metrics: [],
      conclusion: 'Veuillez consulter le rapport complet pour l\'ensemble des détails et conclusions de cette analyse.',
    };
  }
}

// ─── 3. Render HTML ───────────────────────────────────────────────────────────

function renderReportHTML(
  meta: ReportMeta,
  question: string,
  answer: string,
  figureDataURIs: string[],
  author: string,
  company: string,
): string {
  const today = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  function esc(t: string): string {
    return (t || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function renderMarkdown(md: string): string {
    let processed = md;
    const mathBlocks: string[] = [];
    const currencyPlaceholders: string[] = [];

    processed = processed.replace(/\$(\d[\d,]*\.?\d*)/g, (_m, amt) => {
      const idx = currencyPlaceholders.length;
      currencyPlaceholders.push(amt);
      return `%%CURRENCY${idx}%%`;
    });
    processed = processed.replace(/\$\$([\s\S]+?)\$\$/g, (_m, expr) => {
      const idx = mathBlocks.length; mathBlocks.push(expr);
      return `%%DISPLAYMATH${idx}%%`;
    });
    processed = processed.replace(/\$([^\$\n*_]+?)\$/g, (_m, expr) => {
      if (/^\s*[\d.,]+\s*$/.test(expr)) return _m;
      const idx = mathBlocks.length; mathBlocks.push(expr);
      return `%%INLINEMATH${idx}%%`;
    });
    processed = processed.replace(/%%CURRENCY(\d+)%%/g, (_m, idx) => `$${currencyPlaceholders[parseInt(idx)]}`);

    let html = marked.parse(processed) as string;
    html = html.replace(/%%DISPLAYMATH(\d+)%%/g, (_m, idx) => `<span class="math-display">\\[${mathBlocks[parseInt(idx)]}\\]</span>`);
    html = html.replace(/%%INLINEMATH(\d+)%%/g, (_m, idx) => `<span class="math-inline">\\(${mathBlocks[parseInt(idx)]}\\)</span>`);
    html = html.replace(/<table>/g, '<div class="table-wrapper"><table>');
    html = html.replace(/<\/table>/g, '</table></div>');
    return html;
  }

  const validFigures = figureDataURIs.filter(Boolean);

  const metricsHTML = meta.key_metrics.length > 0 ? `
    <div class="metrics-section">
      <div class="section-label">Métriques Clés</div>
      <div class="metrics-grid">
        ${meta.key_metrics.map(m => {
          const cardClass = m.trend === 'up' ? 'metric-card-up' : m.trend === 'down' ? 'metric-card-down' : '';
          const valClass = m.trend === 'up' ? 'metric-up' : m.trend === 'down' ? 'metric-down' : 'metric-neutral';
          const icon = m.trend === 'up' ? '▲' : m.trend === 'down' ? '▼' : '—';
          return `<div class="metric-card ${cardClass}">
            <div class="metric-value ${valClass}"><span class="metric-icon">${icon}</span>${esc(m.value)}</div>
            <div class="metric-label">${esc(m.label)}</div>
          </div>`;
        }).join('\n')}
      </div>
    </div>` : '';

  const figuresHTML = validFigures.length > 0 ? `
    <div class="figures-section">
      <h2 class="section-heading">Graphiques &amp; Visualisations</h2>
      <div class="figures-grid">
        ${validFigures.map((uri, i) => `
          <div class="figure-box">
            <img src="${uri}" class="figure-img" alt="Figure ${i + 1}" />
            <div class="figure-caption">Figure ${i + 1}</div>
          </div>`).join('\n')}
      </div>
    </div>` : '';

  const shortTitle = meta.title.length > 55 ? meta.title.substring(0, 52) + '...' : meta.title;
  const shortQuestion = (question || '').length > 120 ? question.substring(0, 117) + '...' : (question || '');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css">
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js"
  onload="renderMathInElement(document.body,{delimiters:[{left:'\\\\[',right:'\\\\]',display:true},{left:'\\\\(',right:'\\\\)',display:false}],throwOnError:false});"></script>
<style>
@import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Inter:wght@300;400;500;600;700;800&family=Source+Code+Pro:wght@400;500&display=swap');

:root {
  --teal:        #119993;
  --teal-light:  #E6F4F3;
  --teal-mid:    #0D7A75;
  --navy:        #1A2B4A;
  --navy-light:  #243452;
  --blue:        #2072B2;
  --purple:      #652E89;
  --green:       #1D6A35;
  --red:         #B91C1C;
  --gray-900:    #111827;
  --gray-700:    #374151;
  --gray-600:    #4B5563;
  --gray-500:    #6B7280;
  --gray-300:    #D1D5DB;
  --gray-200:    #E5E7EB;
  --gray-100:    #F3F4F6;
  --gray-50:     #F9FAFB;
}

*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: 'Crimson Pro', 'Georgia', serif;
  font-size: 11.5pt;
  line-height: 1.72;
  color: var(--gray-700);
  background: white;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

/* ═══════════════════════════════════════════════════
   COVER PAGE
   ═══════════════════════════════════════════════════ */
.cover-page {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  page-break-after: always;
  background: white;
  position: relative;
}
.cover-top-bar {
  height: 9px;
  background: linear-gradient(90deg, var(--teal) 0%, var(--blue) 50%, var(--purple) 100%);
  flex-shrink: 0;
}
.cover-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 52px 64px 48px;
}
.cover-brand-row {
  display: flex;
  align-items: baseline;
  gap: 14px;
  margin-bottom: 72px;
}
.cover-brand-name {
  font-family: 'Inter', sans-serif;
  font-size: 28px;
  font-weight: 800;
  color: var(--teal);
  letter-spacing: -0.5px;
}
.cover-brand-tagline {
  font-family: 'Inter', sans-serif;
  font-size: 10px;
  font-weight: 500;
  color: var(--gray-500);
  letter-spacing: 2px;
  text-transform: uppercase;
}
.cover-type-tag {
  display: inline-block;
  font-family: 'Inter', sans-serif;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 2.5px;
  text-transform: uppercase;
  color: var(--teal);
  padding: 5px 14px;
  border: 1.5px solid var(--teal);
  border-radius: 3px;
  margin-bottom: 26px;
}
.cover-title {
  font-family: 'Inter', sans-serif;
  font-size: 34px;
  font-weight: 800;
  color: var(--navy);
  line-height: 1.2;
  max-width: 500px;
  margin-bottom: 18px;
  letter-spacing: -0.5px;
}
.cover-question {
  font-family: 'Crimson Pro', serif;
  font-size: 13.5pt;
  font-style: italic;
  color: var(--gray-500);
  max-width: 500px;
  line-height: 1.55;
  margin-bottom: 52px;
}
.cover-divider {
  width: 64px;
  height: 3px;
  background: linear-gradient(90deg, var(--teal), var(--blue));
  margin-bottom: 0;
  border-radius: 2px;
  flex-shrink: 0;
}
.cover-meta {
  margin-top: auto;
  padding-top: 26px;
  border-top: 1px solid var(--gray-300);
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}
.cover-author-label {
  font-family: 'Inter', sans-serif;
  font-size: 8px;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: var(--gray-500);
  margin-bottom: 4px;
}
.cover-author-name {
  font-family: 'Inter', sans-serif;
  font-size: 15px;
  font-weight: 700;
  color: var(--navy);
}
.cover-company {
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  color: var(--gray-500);
  margin-top: 2px;
}
.cover-date-block {
  text-align: right;
  font-family: 'Inter', sans-serif;
  font-size: 12px;
  color: var(--gray-500);
}
.cover-bottom-bar {
  height: 4px;
  background: linear-gradient(90deg, var(--teal) 0%, var(--blue) 50%, var(--purple) 100%);
  opacity: 0.25;
  flex-shrink: 0;
}

/* ═══════════════════════════════════════════════════
   DOCUMENT BODY
   ═══════════════════════════════════════════════════ */
.document-body {
  padding-bottom: 24px;
}

/* ─── Section label (small caps above blocks) ─── */
.section-label {
  font-family: 'Inter', sans-serif;
  font-size: 8.5px;
  font-weight: 700;
  letter-spacing: 2.5px;
  text-transform: uppercase;
  color: var(--teal);
  margin-bottom: 10px;
}

/* ─── Executive Summary ─── */
.executive-summary {
  background: var(--teal-light);
  border-left: 4px solid var(--teal);
  border-radius: 0 8px 8px 0;
  padding: 22px 26px;
  margin-bottom: 26px;
  page-break-inside: avoid;
}
.executive-text {
  font-family: 'Crimson Pro', serif;
  font-size: 12pt;
  font-style: italic;
  color: var(--gray-700);
  line-height: 1.68;
}

/* ─── Key Metrics ─── */
.metrics-section {
  margin-bottom: 28px;
  page-break-inside: avoid;
}
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(110px, 1fr));
  gap: 10px;
  margin-top: 10px;
}
.metric-card {
  background: white;
  border: 1px solid var(--gray-200);
  border-top: 3px solid var(--teal);
  border-radius: 6px;
  padding: 14px 12px 12px;
  text-align: center;
}
.metric-card-up   { border-top-color: var(--green); }
.metric-card-down { border-top-color: var(--red); }
.metric-value {
  font-family: 'Inter', sans-serif;
  font-size: 18px;
  font-weight: 800;
  line-height: 1.1;
  margin-bottom: 5px;
}
.metric-up      { color: var(--green); }
.metric-down    { color: var(--red); }
.metric-neutral { color: var(--navy); }
.metric-icon {
  font-size: 10px;
  margin-right: 2px;
  vertical-align: middle;
}
.metric-label {
  font-family: 'Inter', sans-serif;
  font-size: 8px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--gray-500);
}

/* ─── Divider ─── */
.content-divider {
  height: 1px;
  background: var(--gray-200);
  margin: 26px 0;
}

/* ═══════════════════════════════════════════════════
   MAIN CONTENT (markdown rendered)
   ═══════════════════════════════════════════════════ */
.main-content h1 {
  font-family: 'Inter', sans-serif;
  font-size: 17pt;
  font-weight: 700;
  color: var(--navy);
  margin-top: 34px;
  margin-bottom: 12px;
  padding-bottom: 9px;
  border-bottom: 2px solid var(--teal);
  page-break-after: avoid;
}
.main-content h2 {
  font-family: 'Inter', sans-serif;
  font-size: 13.5pt;
  font-weight: 700;
  color: var(--navy);
  margin-top: 26px;
  margin-bottom: 9px;
  padding-left: 12px;
  border-left: 3px solid var(--teal);
  page-break-after: avoid;
}
.main-content h3 {
  font-family: 'Inter', sans-serif;
  font-size: 11.5pt;
  font-weight: 600;
  color: var(--gray-600);
  margin-top: 20px;
  margin-bottom: 7px;
  page-break-after: avoid;
}
.main-content h4,
.main-content h5,
.main-content h6 {
  font-family: 'Inter', sans-serif;
  font-size: 10.5pt;
  font-weight: 600;
  color: var(--gray-600);
  margin-top: 14px;
  margin-bottom: 5px;
  page-break-after: avoid;
}
.main-content p {
  margin-bottom: 10px;
  text-align: justify;
  hyphens: auto;
}
.main-content ul,
.main-content ol {
  margin: 0 0 12px 22px;
}
.main-content li {
  margin-bottom: 4px;
}
.main-content ul li::marker {
  color: var(--teal);
}
.main-content strong {
  font-weight: 700;
  color: var(--gray-900);
}
.main-content em {
  font-style: italic;
}
.main-content code {
  font-family: 'Source Code Pro', 'Courier New', monospace;
  font-size: 9pt;
  background: var(--gray-100);
  padding: 1px 5px;
  border-radius: 3px;
  color: var(--navy);
}
.main-content pre {
  background: var(--gray-900);
  color: #E5E7EB;
  padding: 14px 16px;
  border-radius: 6px;
  font-family: 'Source Code Pro', monospace;
  font-size: 9pt;
  margin: 12px 0;
  page-break-inside: avoid;
}
.main-content pre code {
  background: none;
  color: #E5E7EB;
  padding: 0;
}
.main-content blockquote {
  border-left: 4px solid var(--teal);
  background: var(--gray-50);
  padding: 12px 16px;
  margin: 14px 0;
  border-radius: 0 6px 6px 0;
  font-style: italic;
  color: var(--gray-500);
  page-break-inside: avoid;
}
.main-content img {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 12px auto;
  border-radius: 4px;
}

/* ─── Tables ─── */
.table-wrapper {
  width: 100%;
  overflow-x: auto;
  margin: 14px 0;
  page-break-inside: avoid;
}
.main-content table {
  width: 100%;
  border-collapse: collapse;
  font-family: 'Inter', sans-serif;
  font-size: 9pt;
}
.main-content thead {
  display: table-header-group;
}
.main-content tr {
  page-break-inside: avoid;
}
.main-content th {
  background: var(--navy);
  color: white;
  padding: 8px 10px;
  text-align: left;
  font-weight: 600;
  font-size: 8.5pt;
  letter-spacing: 0.3px;
  white-space: nowrap;
}
.main-content td {
  padding: 6px 10px;
  border-bottom: 1px solid var(--gray-200);
  color: var(--gray-700);
  word-wrap: break-word;
  max-width: 200px;
}
.main-content tbody tr:nth-child(even) td {
  background: var(--gray-50);
}

/* ═══════════════════════════════════════════════════
   FIGURES SECTION
   ═══════════════════════════════════════════════════ */
.figures-section {
  margin-top: 30px;
  page-break-inside: avoid;
}
.section-heading {
  font-family: 'Inter', sans-serif;
  font-size: 13.5pt;
  font-weight: 700;
  color: var(--navy);
  margin-bottom: 14px;
  padding-left: 12px;
  border-left: 3px solid var(--teal);
}
.figures-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 16px;
  margin-top: 14px;
}
.figure-box {
  border: 1px solid var(--gray-200);
  border-radius: 8px;
  overflow: hidden;
  page-break-inside: avoid;
  background: var(--gray-50);
}
.figure-img {
  width: 100%;
  height: auto;
  display: block;
  max-height: 300px;
  object-fit: contain;
  background: white;
  padding: 10px;
}
.figure-caption {
  font-family: 'Inter', sans-serif;
  font-size: 8.5pt;
  color: var(--gray-500);
  padding: 7px 12px;
  border-top: 1px solid var(--gray-200);
  font-style: italic;
  text-align: center;
}

/* ═══════════════════════════════════════════════════
   CONCLUSION
   ═══════════════════════════════════════════════════ */
.conclusion-section {
  margin-top: 32px;
  page-break-inside: avoid;
}
.conclusion-box {
  background: var(--navy);
  color: white;
  padding: 26px 30px;
  border-radius: 8px;
}
.conclusion-box .section-label {
  color: var(--teal);
  margin-bottom: 12px;
}
.conclusion-text {
  font-family: 'Crimson Pro', serif;
  font-size: 12pt;
  line-height: 1.7;
  color: rgba(255, 255, 255, 0.88);
}

/* ─── Print ─── */
@media print {
  .cover-page { page-break-after: always; }
  body { margin: 0; }
}
</style>
</head>
<body>

<!-- COVER PAGE -->
<div class="cover-page">
  <div class="cover-top-bar"></div>
  <div class="cover-content">
    <div class="cover-brand-row">
      <span class="cover-brand-name">VQuant</span>
      <span class="cover-brand-tagline">Financial Intelligence Platform</span>
    </div>
    <div class="cover-type-tag">Rapport de Recherche Financière</div>
    <h1 class="cover-title">${esc(meta.title)}</h1>
    <p class="cover-question">${esc(shortQuestion)}</p>
    <div class="cover-divider"></div>
    <div class="cover-meta">
      <div>
        <div class="cover-author-label">Préparé par</div>
        <div class="cover-author-name">${esc(author)}</div>
        <div class="cover-company">${esc(company)}</div>
      </div>
      <div class="cover-date-block">${today}</div>
    </div>
  </div>
  <div class="cover-bottom-bar"></div>
</div>

<!-- DOCUMENT BODY -->
<div class="document-body">

  <!-- Executive Summary -->
  <div class="executive-summary">
    <div class="section-label">Résumé Exécutif</div>
    <p class="executive-text">${esc(meta.executive_summary)}</p>
  </div>

  <!-- Key Metrics -->
  ${metricsHTML}

  <div class="content-divider"></div>

  <!-- Main Analysis Content -->
  <div class="main-content">
    ${renderMarkdown(answer)}
  </div>

  <!-- Figures Gallery -->
  ${figuresHTML}

  <!-- Conclusion -->
  <div class="conclusion-section">
    <div class="conclusion-box">
      <div class="section-label">Conclusion &amp; Perspectives</div>
      <p class="conclusion-text">${esc(meta.conclusion)}</p>
    </div>
  </div>

</div>

<script>
document.querySelectorAll('table').forEach(function(table) {
  var wrapper = table.parentElement;
  if (!wrapper) return;
  var containerW = wrapper.parentElement ? wrapper.parentElement.clientWidth : document.body.clientWidth;
  var tableW = table.scrollWidth;
  if (tableW > containerW) {
    var scale = Math.max(0.58, containerW / tableW);
    table.style.fontSize = (scale * 100) + '%';
  }
  var cols = table.querySelectorAll('thead th');
  if (cols.length > 6) {
    table.querySelectorAll('th, td').forEach(function(cell) {
      cell.style.padding = '4px 6px';
    });
  }
});
</script>
</body>
</html>`;
}

// ─── 4. Render PDF with Puppeteer ─────────────────────────────────────────────

async function renderReportPDF(html: string, meta: ReportMeta): Promise<Buffer> {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    await page.evaluateHandle('document.fonts.ready');
    await page.waitForFunction(
      () => !document.querySelector('.math-inline, .math-display') || document.querySelector('.katex') !== null,
      { timeout: 5000 },
    ).catch(() => {});

    const shortTitle = meta.title.length > 50 ? meta.title.substring(0, 47) + '...' : meta.title;
    const todayShort = new Date().toLocaleDateString('fr-FR');

    const pdfData = await page.pdf({
      format: 'A4',
      margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: `
        <div style="width:100%;display:flex;align-items:center;justify-content:space-between;
          padding:0 20mm 4px;font-size:8px;font-family:'Inter',sans-serif;color:#6B7280;
          border-bottom:1px solid #E5E7EB;">
          <span style="color:#119993;font-weight:700;font-size:9px;">VQuant</span>
          <span style="max-width:320px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
            ${shortTitle}
          </span>
          <span>Page <span class="pageNumber"></span> / <span class="totalPages"></span></span>
        </div>`,
      footerTemplate: `
        <div style="width:100%;display:flex;align-items:center;justify-content:space-between;
          padding:4px 20mm 0;font-size:8px;font-family:'Inter',sans-serif;color:#9CA3AF;
          border-top:1px solid #E5E7EB;">
          <span>Document Confidentiel</span>
          <span style="color:#119993;font-weight:600;">VQuant Financial Intelligence</span>
          <span>${todayShort}</span>
        </div>`,
    });

    await browser.close();
    const buffer = Buffer.isBuffer(pdfData) ? pdfData : Buffer.from(pdfData);
    console.log('[Report] ✓ PDF rendered:', buffer.length, 'bytes');
    return buffer;
  } catch (error) {
    if (browser) await browser.close();
    throw new Error(`Failed to render report PDF: ${(error as Error).message}`);
  }
}

// ─── 5. Main export ───────────────────────────────────────────────────────────

export async function generateCorporateReport(options: CorporateReportOptions): Promise<Buffer> {
  console.log('[Report] Starting corporate report generation...');
  console.log('[Report] figureUrls received:', options.figureUrls?.length || 0);

  const figureDataURIs = loadFiguresAsBase64(options.figureUrls);
  const availableCount = figureDataURIs.filter(Boolean).length;
  console.log('[Report] Figures loaded:', availableCount);

  const meta = await extractReportMeta(options);

  const html = renderReportHTML(
    meta,
    options.question,
    options.answer,
    figureDataURIs,
    options.author,
    options.company || 'VQuant',
  );
  console.log('[Report] HTML rendered:', html.length, 'chars');

  const pdfBuffer = await renderReportPDF(html, meta);
  console.log('[Report] ✓ Complete! PDF ready:', pdfBuffer.length, 'bytes');
  return pdfBuffer;
}
