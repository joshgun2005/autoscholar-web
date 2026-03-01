import axios from 'axios';
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

interface BeamerOptions {
  question: string;
  answer: string;
  author: string;
  company?: string;
  figureUrls?: string[];  // e.g. ["/figures/fig-123-0.png", ...] or data URIs
}

interface SlideStructure {
  title: string;
  subtitle: string;
  sections: SectionDef[];
}

interface SectionDef {
  sectionTitle: string;
  slides: SlideDef[];
}

type SlideDef =
  | { type: 'toc'; items: string[] }
  | { type: 'content'; title: string; bullets: string[] }
  | { type: 'stats'; title: string; stats: { label: string; value: string; trend?: 'up' | 'down' | 'neutral' }[] }
  | { type: 'figure'; title: string; figureIndex: number; caption?: string }
  | { type: 'two-column'; title: string; left: string[]; right: string[] }
  | { type: 'conclusion'; title: string; bullets: string[] };

// ─── 1. Load figures as base64 data URIs ────────────────────────────────────

function loadFiguresAsBase64(figureUrls?: string[]): string[] {
  if (!figureUrls || figureUrls.length === 0) {
    console.log('[Slides] No figureUrls provided');
    return [];
  }

  console.log('[Slides] Processing', figureUrls.length, 'figure URLs');

  const figuresDir = path.join(process.cwd(), 'dist', 'public', 'figures');
  const altFiguresDir = path.join(process.cwd(), 'public', 'figures');

  return figureUrls.map((url, i) => {
    // Already a data URI — use directly
    if (url.startsWith('data:image')) {
      console.log(`[Slides] ✓ Figure ${i}: already data URI (${url.length} chars)`);
      return url;
    }

    // Already a raw base64 string (no prefix, no path) — wrap it
    if (url.length > 200 && !url.startsWith('/') && !url.startsWith('http')) {
      console.log(`[Slides] ✓ Figure ${i}: raw base64 (${url.length} chars)`);
      return `data:image/png;base64,${url}`;
    }

    // File path: /figures/xxx.png — try multiple locations
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
          if (buffer.length > 0) {
            console.log(`[Slides] ✓ Figure ${i} loaded from ${filePath} (${buffer.length} bytes)`);
            return `data:image/png;base64,${buffer.toString('base64')}`;
          }
        }
      } catch (err) {
        // continue to next candidate
      }
    }

    console.warn(`[Slides] ✗ Figure ${i} not found for URL: ${url.substring(0, 80)}`);
    return '';
  });
}

// ─── 2. Generate slide structure with Claude ─────────────────────────────────

async function generateSlideStructure(options: BeamerOptions, availableFigureCount: number): Promise<SlideStructure> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  // Only tell Claude about figures that actually loaded
  const figureNote = availableFigureCount > 0
    ? `\n\nFIGURES DISPONIBLES: ${availableFigureCount} images (indices 0 à ${availableFigureCount - 1}). Crée des slides "figure" UNIQUEMENT pour les indices existants (0 à ${availableFigureCount - 1}). Ne dépasse PAS l'indice ${availableFigureCount - 1}.`
    : '\n\nAUCUNE FIGURE disponible. Ne crée PAS de slides de type "figure".';

  let contentToUse = options.answer;
  if (contentToUse.length > 20000) {
    console.log('[Slides] Content is long (' + contentToUse.length + ' chars), truncating...');
    const sections = contentToUse.split(/\n#{1,3}\s+/);
    contentToUse = sections.slice(0, 5).join('\n## ').substring(0, 15000);
  }

  const systemPrompt = `Tu es un expert en présentations financières. Tu analyses un contenu et tu retournes UNIQUEMENT un JSON structuré pour des slides.

RÈGLES STRICTES:
- Retourne UNIQUEMENT du JSON valide, pas de texte avant ou après
- 8-12 slides maximum
- Max 5 bullets par slide
- Max 15 mots par bullet
- Extrais les chiffres clés pour les slides "stats"
- Une idée = une slide
- Ne crée des slides "figure" que si des figures sont disponibles

Le JSON doit suivre cette structure exacte:
{
  "title": "Titre principal",
  "subtitle": "Sous-titre court",
  "sections": [
    {
      "sectionTitle": "Nom de section",
      "slides": [
        {"type": "toc", "items": ["Section 1", "Section 2", "Section 3"]},
        {"type": "content", "title": "Titre", "bullets": ["Point 1", "Point 2"]},
        {"type": "stats", "title": "Métriques", "stats": [{"label": "Rendement", "value": "+23%", "trend": "up"}]},
        {"type": "figure", "title": "Graphique", "figureIndex": 0, "caption": "Description"},
        {"type": "two-column", "title": "Comparaison", "left": ["A1", "A2"], "right": ["B1", "B2"]},
        {"type": "conclusion", "title": "Conclusion", "bullets": ["Résumé 1"]}
      ]
    }
  ]
}

Types disponibles: toc, content, stats, figure, two-column, conclusion
Pour "trend" dans stats: "up", "down", ou "neutral"`;

  const userPrompt = `Crée la structure JSON de slides pour cette analyse financière.
${figureNote}

QUESTION: ${options.question}

ANALYSE:
${contentToUse}

Retourne UNIQUEMENT le JSON.`;

  try {
    console.log('[Slides] Structuring content with Claude...');

    const response = await axios.post(
      ANTHROPIC_API_URL,
      {
        model: 'claude-opus-4-6',
        max_tokens: 8000,
        temperature: 0.2,
        messages: [{ role: 'user', content: userPrompt }],
        system: systemPrompt
      },
      {
        headers: {
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        timeout: 120000
      }
    );

    let jsonText = response.data.content[0].text;
    jsonText = jsonText.replace(/^```json\n?/gm, '').replace(/^```\n?/gm, '').replace(/\n?```$/gm, '').trim();

    const structure = JSON.parse(jsonText) as SlideStructure;

    // Strip out figure slides that reference non-existent figures
    for (const section of structure.sections) {
      section.slides = section.slides.filter(slide => {
        if (slide.type === 'figure') {
          if (slide.figureIndex >= availableFigureCount || slide.figureIndex < 0) {
            console.log(`[Slides] Removed figure slide with out-of-range index ${slide.figureIndex} (only ${availableFigureCount} available)`);
            return false;
          }
        }
        return true;
      });
    }

    const totalSlides = structure.sections.reduce((sum, s) => sum + s.slides.length, 0);
    console.log('[Slides] ✓ Structure created:', totalSlides, 'slides in', structure.sections.length, 'sections');
    return structure;

  } catch (error) {
    console.error('[Slides] Error generating structure:', error);

    // Fallback: minimal 3-slide structure
    console.log('[Slides] Using fallback minimal structure');
    const headingMatch = options.answer.match(/^#{1,2}\s+(.+)$/m);
    return {
      title: headingMatch ? headingMatch[1].trim() : 'Analyse Financière',
      subtitle: options.question.substring(0, 80),
      sections: [{
        sectionTitle: 'Analyse',
        slides: [
          { type: 'toc', items: ['Analyse', 'Conclusion'] },
          { type: 'content', title: 'Points Clés', bullets: options.answer.split('\n').filter(l => l.startsWith('- ') || l.startsWith('* ')).slice(0, 5).map(l => l.replace(/^[-*]\s+/, '').substring(0, 60)) || ['Voir le rapport complet pour les détails'] },
          { type: 'conclusion', title: 'Conclusion', bullets: ['Consultez le rapport complet pour tous les détails'] }
        ]
      }]
    };
  }
}

// ─── 3. Render slide HTML ────────────────────────────────────────────────────

function renderSlideHTML(structure: SlideStructure, figureDataURIs: string[], author: string, company: string): string {
  const today = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Collect all slides flat for numbering
  const allSlides: { section: string; slide: SlideDef }[] = [];
  for (const section of structure.sections) {
    for (const slide of section.slides) {
      allSlides.push({ section: section.sectionTitle, slide });
    }
  }
  // +2 for cover and closing
  const totalPages = allSlides.length + 2;

  function esc(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function progressBar(pageNum: number): string {
    const pct = (pageNum / totalPages) * 100;
    return `<div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>`;
  }

  function footer(pageNum: number): string {
    return `<div class="slide-footer">
      <span class="footer-left">VQuant | ${today}</span>
      <span class="footer-right">Page ${pageNum} / ${totalPages}</span>
    </div>`;
  }

  // Build slide HTML pages
  const slidePages: string[] = [];

  // ── Cover slide ──
  slidePages.push(`<div class="slide slide-cover">
    ${progressBar(1)}
    <div class="cover-circles">
      <div class="circle circle-teal"></div>
      <div class="circle circle-blue"></div>
      <div class="circle circle-purple"></div>
    </div>
    <div class="cover-content">
      <div class="cover-logo">VQuant</div>
      <div class="cover-tagline">Financial Intelligence Platform</div>
      <h1 class="cover-title">${esc(structure.title)}</h1>
      <div class="cover-separator"></div>
      <div class="cover-subtitle">${esc(structure.subtitle || '')}</div>
      <div class="cover-author">${esc(author)}</div>
      <div class="cover-meta">${esc(company)} | ${today}</div>
    </div>
    ${footer(1)}
  </div>`);

  // ── Content slides ──
  allSlides.forEach(({ slide }, idx) => {
    const pageNum = idx + 2;
    let inner = '';

    switch (slide.type) {
      case 'toc':
        inner = `<div class="slide slide-toc">
          ${progressBar(pageNum)}
          <div class="slide-body">
            <h2 class="slide-title">Plan</h2>
            <div class="slide-main">
              <div class="toc-list">
                ${slide.items.map((item, i) => `<div class="toc-item"><span class="toc-number">${i + 1}</span><span class="toc-text">${esc(item)}</span></div>`).join('\n')}
              </div>
            </div>
          </div>
          ${footer(pageNum)}
        </div>`;
        break;

      case 'content':
        inner = `<div class="slide slide-content">
          ${progressBar(pageNum)}
          <div class="slide-body">
            <h2 class="slide-title">${esc(slide.title)}</h2>
            <div class="slide-main">
              <ul class="bullet-list">
                ${slide.bullets.map(b => `<li><span class="bullet-dot"></span><span>${esc(b)}</span></li>`).join('\n')}
              </ul>
            </div>
          </div>
          ${footer(pageNum)}
        </div>`;
        break;

      case 'stats':
        inner = `<div class="slide slide-stats">
          ${progressBar(pageNum)}
          <div class="slide-body">
            <h2 class="slide-title">${esc(slide.title)}</h2>
            <div class="slide-main">
              <div class="stats-grid">
                ${slide.stats.map(s => {
                  const trendClass = s.trend === 'up' ? 'trend-up' : s.trend === 'down' ? 'trend-down' : 'trend-neutral';
                  const trendIcon = s.trend === 'up' ? '↑' : s.trend === 'down' ? '↓' : '→';
                  return `<div class="stat-card">
                    <div class="stat-trend ${trendClass}">${trendIcon}</div>
                    <div class="stat-value ${trendClass}">${esc(s.value)}</div>
                    <div class="stat-label">${esc(s.label)}</div>
                  </div>`;
                }).join('\n')}
              </div>
            </div>
          </div>
          ${footer(pageNum)}
        </div>`;
        break;

      case 'figure': {
        const dataUri = figureDataURIs[slide.figureIndex] || '';
        inner = `<div class="slide slide-figure">
          ${progressBar(pageNum)}
          <div class="slide-body">
            <h2 class="slide-title">${esc(slide.title)}</h2>
            <div class="slide-main">
              <div class="figure-container">
                ${dataUri ? `<img src="${dataUri}" class="figure-img" />` : '<div class="figure-placeholder">Figure non disponible</div>'}
              </div>
              ${slide.caption ? `<div class="figure-caption">${esc(slide.caption)}</div>` : ''}
            </div>
          </div>
          ${footer(pageNum)}
        </div>`;
        break;
      }

      case 'two-column':
        inner = `<div class="slide slide-two-column">
          ${progressBar(pageNum)}
          <div class="slide-body">
            <h2 class="slide-title">${esc(slide.title)}</h2>
            <div class="slide-main">
              <div class="columns-grid">
                <div class="column column-left">
                  <ul class="bullet-list">
                    ${slide.left.map(b => `<li><span class="bullet-dot"></span><span>${esc(b)}</span></li>`).join('\n')}
                  </ul>
                </div>
                <div class="column column-right">
                  <ul class="bullet-list">
                    ${slide.right.map(b => `<li><span class="bullet-dot dot-blue"></span><span>${esc(b)}</span></li>`).join('\n')}
                  </ul>
                </div>
              </div>
            </div>
          </div>
          ${footer(pageNum)}
        </div>`;
        break;

      case 'conclusion':
        inner = `<div class="slide slide-conclusion">
          ${progressBar(pageNum)}
          <div class="slide-body">
            <h2 class="slide-title">${esc(slide.title)}</h2>
            <div class="slide-main">
              <div class="conclusion-box">
                <ul class="bullet-list">
                  ${slide.bullets.map(b => `<li><span class="bullet-dot"></span><span>${esc(b)}</span></li>`).join('\n')}
                </ul>
              </div>
            </div>
          </div>
          ${footer(pageNum)}
        </div>`;
        break;

      default:
        inner = `<div class="slide slide-content">
          ${progressBar(pageNum)}
          <div class="slide-body">
            <h2 class="slide-title">Slide</h2>
            <div class="slide-main"></div>
          </div>
          ${footer(pageNum)}
        </div>`;
    }

    slidePages.push(inner);
  });

  // ── Closing slide ──
  slidePages.push(`<div class="slide slide-closing">
    ${progressBar(totalPages)}
    <div class="cover-circles">
      <div class="circle circle-teal" style="bottom:-60px;left:-40px;top:auto;"></div>
      <div class="circle circle-purple" style="top:60px;right:-30px;left:auto;"></div>
    </div>
    <div class="closing-content">
      <h1 class="closing-title">Merci</h1>
      <div class="cover-separator"></div>
      <div class="closing-subtitle">Questions &amp; Suggestions</div>
      <div class="closing-contact">admin@vquant.ai</div>
      <div class="closing-contact">www.vquant.ai</div>
      <div class="closing-generated">Généré avec <strong>VQuant AI</strong></div>
    </div>
    ${footer(totalPages)}
  </div>`);

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=1280">
<style>
/* ─── Reset & Base ─── */
*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

:root {
  --teal: #119993;
  --blue: #2072B2;
  --purple: #652E89;
  --orange: #F49422;
  --red: #EF632B;
  --green: #6CBC5A;
  --dark: #1A1A2E;
  --gray: #6B7280;
  --light-bg: #F8FAFC;
}

body {
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  background: white;
  color: var(--dark);
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

/* ─── Slide Container ─── */
.slide {
  width: 1280px;
  height: 720px;
  position: relative;
  overflow: hidden;
  page-break-after: always;
  background: white;
}

/* ─── Slide Body — fills space between progress bar and footer ─── */
.slide-body {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding-top: 4px;   /* progress bar */
  padding-bottom: 36px; /* footer */
}

.slide-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

/* ─── Progress Bar ─── */
.progress-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: #E5E7EB;
  z-index: 10;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--teal), var(--blue), var(--purple));
}

/* ─── Footer ─── */
.slide-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 40px;
  font-size: 11px;
  color: var(--gray);
  border-top: 1px solid #E5E7EB;
  background: rgba(248, 250, 252, 0.9);
}
.footer-left { font-weight: 500; }

/* ─── Common Title ─── */
.slide-title {
  font-size: 30px;
  font-weight: 700;
  color: var(--dark);
  margin: 36px 60px 0;
  padding-bottom: 14px;
  border-bottom: 3px solid var(--teal);
  flex-shrink: 0;
}

/* ═══════════════════════════════════════════════════
   COVER SLIDE
   ═══════════════════════════════════════════════════ */
.slide-cover {
  background: var(--dark);
  display: flex;
  align-items: center;
  justify-content: center;
}
.cover-circles { position: absolute; inset: 0; pointer-events: none; }
.circle { position: absolute; border-radius: 50%; }
.circle-teal {
  width: 300px; height: 300px;
  background: var(--teal); opacity: 0.12;
  top: -80px; left: -60px;
}
.circle-blue {
  width: 400px; height: 400px;
  background: var(--blue); opacity: 0.08;
  bottom: -120px; right: -80px;
}
.circle-purple {
  width: 220px; height: 220px;
  background: var(--purple); opacity: 0.07;
  top: 120px; right: -40px;
}
.cover-content {
  text-align: center;
  z-index: 2;
  position: relative;
}
.cover-logo {
  font-size: 28px;
  font-weight: 800;
  color: var(--teal);
  margin-bottom: 4px;
}
.cover-tagline {
  font-size: 12px;
  color: var(--gray);
  letter-spacing: 1.5px;
  text-transform: uppercase;
  margin-bottom: 40px;
}
.cover-title {
  font-size: 44px;
  font-weight: 800;
  color: white;
  max-width: 960px;
  line-height: 1.2;
  margin-bottom: 24px;
}
.cover-separator {
  width: 60px; height: 3px;
  background: var(--teal);
  margin: 0 auto 20px;
}
.cover-subtitle {
  font-size: 18px;
  color: var(--gray);
  margin-bottom: 28px;
  max-width: 700px;
}
.cover-author {
  font-size: 16px;
  color: #D1D5DB;
  margin-bottom: 6px;
}
.cover-meta {
  font-size: 13px;
  color: rgba(107, 114, 128, 0.7);
}
.slide-cover .slide-footer {
  background: transparent;
  border-top-color: rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.3);
}

/* ═══════════════════════════════════════════════════
   TOC SLIDE
   ═══════════════════════════════════════════════════ */
.toc-list {
  padding: 0 100px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.toc-item {
  display: flex;
  align-items: center;
  gap: 24px;
  font-size: 22px;
  font-weight: 500;
}
.toc-number {
  width: 52px; height: 52px;
  border-radius: 50%;
  background: var(--teal);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 22px;
  flex-shrink: 0;
}

/* ═══════════════════════════════════════════════════
   CONTENT / BULLET SLIDE
   ═══════════════════════════════════════════════════ */
.bullet-list {
  list-style: none;
  padding: 0 100px;
}
.bullet-list li {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  font-size: 24px;
  line-height: 1.6;
  margin-bottom: 24px;
  color: #374151;
}
.bullet-dot {
  width: 12px; height: 12px;
  border-radius: 50%;
  background: var(--teal);
  flex-shrink: 0;
  margin-top: 10px;
}
.bullet-dot.dot-blue { background: var(--blue); }

/* ═══════════════════════════════════════════════════
   STATS SLIDE
   ═══════════════════════════════════════════════════ */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 28px;
  padding: 0 80px;
  align-content: center;
}
.stat-card {
  background: var(--light-bg);
  border: 1px solid #E5E7EB;
  border-radius: 16px;
  padding: 40px 24px 36px;
  text-align: center;
  position: relative;
}
.stat-value {
  font-size: 44px;
  font-weight: 800;
  margin-bottom: 12px;
}
.stat-label {
  font-size: 14px;
  color: var(--gray);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.stat-trend {
  position: absolute;
  top: 14px;
  right: 18px;
  font-size: 20px;
  font-weight: 700;
}
.trend-up { color: var(--green); }
.trend-down { color: var(--red); }
.trend-neutral { color: var(--gray); }
.stat-value.trend-up { color: var(--green); }
.stat-value.trend-down { color: var(--red); }
.stat-value.trend-neutral { color: var(--dark); }

/* ═══════════════════════════════════════════════════
   FIGURE SLIDE
   ═══════════════════════════════════════════════════ */
.slide-figure .slide-main {
  justify-content: center;
  align-items: center;
}
.figure-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 60px;
  flex: 1;
  max-height: 520px;
}
.figure-img {
  max-width: 100%;
  max-height: 500px;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.12);
}
.figure-placeholder {
  width: 500px; height: 340px;
  background: var(--light-bg);
  border: 2px dashed #D1D5DB;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--gray);
  font-size: 18px;
}
.figure-caption {
  text-align: center;
  font-size: 14px;
  color: var(--gray);
  font-style: italic;
  padding: 8px 80px 0;
  flex-shrink: 0;
}

/* ═══════════════════════════════════════════════════
   TWO-COLUMN SLIDE
   ═══════════════════════════════════════════════════ */
.columns-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 40px;
  padding: 0 60px;
  align-content: center;
}
.column {
  border-radius: 12px;
  padding: 28px 20px;
  background: rgba(248, 250, 252, 0.6);
}
.column-left { border-left: 4px solid var(--teal); }
.column-right { border-left: 4px solid var(--blue); }
.column .bullet-list { padding: 0 16px; }
.column .bullet-list li { font-size: 21px; margin-bottom: 20px; }

/* ═══════════════════════════════════════════════════
   CONCLUSION SLIDE
   ═══════════════════════════════════════════════════ */
.conclusion-box {
  margin: 0 80px;
  background: linear-gradient(135deg, rgba(17,153,147,0.08), rgba(32,114,178,0.08));
  border: 1px solid rgba(17,153,147,0.25);
  border-radius: 20px;
  padding: 40px 32px;
}
.conclusion-box .bullet-list { padding: 0 24px; }

/* ═══════════════════════════════════════════════════
   CLOSING SLIDE
   ═══════════════════════════════════════════════════ */
.slide-closing {
  background: var(--dark);
  display: flex;
  align-items: center;
  justify-content: center;
}
.closing-content {
  text-align: center;
  z-index: 2;
  position: relative;
}
.closing-title {
  font-size: 60px;
  font-weight: 800;
  color: white;
  margin-bottom: 28px;
}
.closing-subtitle {
  font-size: 22px;
  color: var(--gray);
  margin-bottom: 32px;
}
.closing-contact {
  font-size: 16px;
  color: var(--teal);
  margin-bottom: 10px;
}
.closing-generated {
  margin-top: 36px;
  font-size: 13px;
  color: rgba(107,114,128,0.5);
}
.closing-generated strong { color: var(--teal); }
.slide-closing .slide-footer {
  background: transparent;
  border-top-color: rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.3);
}

/* ─── Print ─── */
@media print {
  .slide { page-break-after: always; }
  body { margin: 0; }
}
</style>
</head>
<body>
${slidePages.join('\n')}
</body>
</html>`;
}

// ─── 4. Render PDF with Puppeteer ────────────────────────────────────────────

async function renderSlidePDF(html: string): Promise<Buffer> {
  let browser;
  try {
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
    await page.setViewport({ width: 1280, height: 720 });
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // Wait for fonts to load
    await page.evaluateHandle('document.fonts.ready');

    const pdfData = await page.pdf({
      width: '1280px',
      height: '720px',
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
      printBackground: true,
    });

    await browser.close();

    const pdfBuffer = Buffer.isBuffer(pdfData) ? pdfData : Buffer.from(pdfData);
    console.log('[Slides] ✓ PDF rendered:', pdfBuffer.length, 'bytes');
    return pdfBuffer;

  } catch (error) {
    if (browser) {
      await browser.close();
    }
    console.error('[Slides] PDF render error:', error);
    throw new Error(`Failed to render slide PDF: ${(error as Error).message}`);
  }
}

// ─── 5. Main export — same signature as before ───────────────────────────────

export async function convertToBeamerPDF(options: BeamerOptions): Promise<Buffer> {
  console.log('[Slides] Starting HTML/CSS slide generation...');
  console.log('[Slides] figureUrls received:', options.figureUrls?.length || 0);

  // Step 1: Load figures as base64
  const figureDataURIs = loadFiguresAsBase64(options.figureUrls);
  const availableCount = figureDataURIs.filter(Boolean).length;
  console.log('[Slides] Figures loaded:', availableCount, '/', (options.figureUrls?.length || 0));

  // Step 2: Generate slide structure with Claude (pass actual available count)
  const structure = await generateSlideStructure(options, availableCount);

  // Step 3: Render HTML
  const html = renderSlideHTML(structure, figureDataURIs, options.author, options.company || 'VQuant');
  console.log('[Slides] HTML rendered:', html.length, 'chars');

  // Step 4: Convert to PDF with Puppeteer
  const pdfBuffer = await renderSlidePDF(html);

  console.log('[Slides] ✓ Complete! PDF ready:', pdfBuffer.length, 'bytes');
  return pdfBuffer;
}
