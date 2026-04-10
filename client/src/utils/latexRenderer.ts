import katex from "katex";
import "katex/dist/katex.min.css";

// ── Types used by the LaTeX renderer ────────────────────────────

export interface ParsedReference {
  key: string;
  authors: string;
  title: string;
  journal: string;
  year: string;
  doi?: string;
}

export interface ParsedSection {
  id: string;
  type: string;
  title: string;
  content: string;
  subsections: { id: string; title: string; content: string }[];
}

// ── Section type to readable title mapping ──────────────────────

const SECTION_TITLES: Record<string, string> = {
  introduction: "Introduction",
  literature_review: "Literature Review",
  methodology: "Methodology",
  data: "Data",
  data_description: "Data Description",
  results: "Results",
  empirical_results: "Empirical Results",
  discussion: "Discussion",
  conclusion: "Conclusion",
  appendix: "Appendix",
  abstract: "Abstract",
  robustness: "Robustness Checks",
  robustness_checks: "Robustness Checks",
  theoretical_framework: "Theoretical Framework",
  model: "Model",
};

function getSectionTitle(type: string): string {
  return SECTION_TITLES[type] || type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// ── KaTeX rendering helper ──────────────────────────────────────

function renderKatex(tex: string, displayMode: boolean): string {
  try {
    // Clean up common LaTeX that KaTeX doesn't handle
    let cleaned = tex.trim();
    // Remove alignment markers
    cleaned = cleaned.replace(/&/g, ' ');
    // Remove \\ line breaks for align environments
    cleaned = cleaned.replace(/\\\\\s*/g, ' \\newline ');
    // Remove \text{} wrapping issues
    cleaned = cleaned.replace(/\\text\{([^}]*)\}/g, '\\textrm{$1}');
    // Remove \label
    cleaned = cleaned.replace(/\\label\{[^}]*\}/g, '');
    // Handle \bm as \mathbf
    cleaned = cleaned.replace(/\\bm\{([^}]*)\}/g, '\\mathbf{$1}');

    return katex.renderToString(cleaned, {
      displayMode,
      throwOnError: false,
      trust: true,
      strict: false,
      macros: {
        '\\R': '\\mathbb{R}',
        '\\E': '\\mathbb{E}',
        '\\P': '\\mathbb{P}',
        '\\Var': '\\text{Var}',
        '\\Cov': '\\text{Cov}',
        '\\Corr': '\\text{Corr}',
      },
    });
  } catch {
    // Fallback: show raw LaTeX in a styled code block
    const cls = displayMode
      ? 'math-display my-4 py-3 px-4 bg-muted/30 rounded-xl border border-border/40 overflow-x-auto font-mono text-sm'
      : 'math-inline font-mono text-[0.9em] px-1 text-foreground/90 bg-muted/20 rounded';
    return `<span class="${cls}">${tex.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span>`;
  }
}

// ── LaTeX to HTML converter ─────────────────────────────────────

export function latexToHtml(latex: string, references: ParsedReference[], figureUrls: string[]): string {
  let html = latex;

  // Remove LaTeX preamble commands
  html = html.replace(/\\label\{[^}]*\}/g, '');
  html = html.replace(/\\FloatBarrier/g, '');
  html = html.replace(/\\clearpage/g, '');
  html = html.replace(/\\newpage/g, '');
  html = html.replace(/\\noindent\s*/g, '');
  html = html.replace(/\\vspace\*?\{[^}]*\}/g, '');
  html = html.replace(/\\hspace\*?\{[^}]*\}/g, '');
  html = html.replace(/\\bigskip/g, '');
  html = html.replace(/\\medskip/g, '');
  html = html.replace(/\\smallskip/g, '');
  html = html.replace(/\\centering/g, '');

  // Section headers
  html = html.replace(/\\section\*?\{([^}]*)\}/g, '<h2 class="text-2xl font-serif font-bold text-foreground mt-10 mb-4 pb-2 border-b border-border/40">$1</h2>');
  html = html.replace(/\\subsection\*?\{([^}]*)\}/g, '<h3 class="text-xl font-serif font-semibold text-foreground mt-8 mb-3">$1</h3>');
  html = html.replace(/\\subsubsection\*?\{([^}]*)\}/g, '<h4 class="text-lg font-semibold text-foreground/90 mt-6 mb-2 italic">$1</h4>');

  // Text formatting (BEFORE math processing to avoid conflicts)
  html = html.replace(/\\textbf\{([^}]*)\}/g, '<strong>$1</strong>');
  html = html.replace(/\\textit\{([^}]*)\}/g, '<em>$1</em>');
  html = html.replace(/\\emph\{([^}]*)\}/g, '<em>$1</em>');
  html = html.replace(/\\underline\{([^}]*)\}/g, '<u>$1</u>');
  html = html.replace(/\\texttt\{([^}]*)\}/g, '<code class="px-1.5 py-0.5 rounded bg-muted text-sm font-mono">$1</code>');
  html = html.replace(/\\textrm\{([^}]*)\}/g, '$1');
  html = html.replace(/\\textsf\{([^}]*)\}/g, '$1');
  html = html.replace(/\\textsc\{([^}]*)\}/g, '<span class="uppercase text-[0.85em] tracking-wider">$1</span>');

  // Citations → interactive links
  html = html.replace(/\\cite[tp]?\{([^}]*)\}/g, (_match, keys: string) => {
    const citeKeys = keys.split(',').map((k: string) => k.trim());
    const links = citeKeys.map((key: string) => {
      const ref = references.find(r => r.key === key);
      const displayName = ref ? `${ref.authors.split(',')[0].split(' and ')[0].trim()}, ${ref.year}` : key;
      return `<a href="#ref-${key}" class="text-primary hover:text-primary/80 hover:underline transition-colors cursor-pointer" title="${ref?.title || key}">${displayName}</a>`;
    });
    return `<span class="citation">(${links.join('; ')})</span>`;
  });

  // Footnotes
  html = html.replace(/\\footnote\{([^}]*)\}/g, '<sup class="text-primary cursor-help" title="$1">[*]</sup>');

  // ── Math rendering with KaTeX ──

  // Display math: \[ ... \]
  html = html.replace(/\\\[([\s\S]*?)\\\]/g, (_m, tex) => {
    return `<div class="katex-display-wrapper my-6">${renderKatex(tex, true)}</div>`;
  });

  // Display math: $$ ... $$
  html = html.replace(/\$\$([\s\S]*?)\$\$/g, (_m, tex) => {
    return `<div class="katex-display-wrapper my-6">${renderKatex(tex, true)}</div>`;
  });

  // Equation environments
  html = html.replace(/\\begin\{equation\*?\}([\s\S]*?)\\end\{equation\*?\}/g, (_m, tex) => {
    return `<div class="katex-display-wrapper my-6">${renderKatex(tex, true)}</div>`;
  });

  // Align environments
  html = html.replace(/\\begin\{align\*?\}([\s\S]*?)\\end\{align\*?\}/g, (_m, tex) => {
    const lines = tex.split(/\\\\/).map((l: string) => l.trim()).filter(Boolean);
    const rendered = lines.map((line: string) => {
      const cleanLine = line.replace(/&/g, ' ').trim();
      return cleanLine ? renderKatex(cleanLine, true) : '';
    }).filter(Boolean).join('');
    return `<div class="katex-display-wrapper my-6 space-y-2">${rendered}</div>`;
  });

  // Gather/multline/split environments
  html = html.replace(/\\begin\{(?:gather|multline|split)\*?\}([\s\S]*?)\\end\{(?:gather|multline|split)\*?\}/g, (_m, tex) => {
    const lines = tex.split(/\\\\/).map((l: string) => l.trim()).filter(Boolean);
    const rendered = lines.map((line: string) => {
      const cleanLine = line.replace(/&/g, ' ').trim();
      return cleanLine ? renderKatex(cleanLine, true) : '';
    }).filter(Boolean).join('');
    return `<div class="katex-display-wrapper my-6 space-y-2">${rendered}</div>`;
  });

  // Inline math: $...$  (careful not to match escaped \$ or $$)
  html = html.replace(/(?<![\\$])\$([^$\n]+?)\$(?!\$)/g, (_m, tex) => {
    return renderKatex(tex, false);
  });

  // Lists
  html = html.replace(/\\begin\{itemize\}/g, '<ul class="list-disc list-inside space-y-1.5 my-4 ml-4">');
  html = html.replace(/\\end\{itemize\}/g, '</ul>');
  html = html.replace(/\\begin\{enumerate\}/g, '<ol class="list-decimal list-inside space-y-1.5 my-4 ml-4">');
  html = html.replace(/\\end\{enumerate\}/g, '</ol>');
  html = html.replace(/\\item\s*/g, '<li class="text-muted-foreground leading-relaxed">');

  // Tables
  html = html.replace(/\\begin\{table\}\[?[htbp!]*\]?([\s\S]*?)\\end\{table\}/g, (_match, content) => {
    return `<div class="my-8 overflow-x-auto">${convertTableContent(content)}</div>`;
  });
  html = html.replace(/\\begin\{tabular\}\{([^}]*)\}([\s\S]*?)\\end\{tabular\}/g, (_match, _cols, content) => {
    return convertTabularToHtml(content);
  });

  // Figure environments → show actual figures from ZIP
  let figCounter = 0;
  html = html.replace(/\\begin\{figure\}\[?[htbp!]*\]?([\s\S]*?)\\end\{figure\}/g, (_match, content) => {
    const caption = content.match(/\\caption\{([^}]*)\}/)?.[1] || '';
    const cleanCaption = latexClean(caption);

    // Check if this figure has an includegraphics with a known figure file
    const graphicsMatch = content.match(/\\includegraphics(?:\[.*?\])?\{([^}]*)\}/);
    const figName = graphicsMatch?.[1] || '';

    // Try to find matching figure URL
    let figUrl = '';
    if (figureUrls.length > 0) {
      // Match by figure name or use sequential index
      if (figName) {
        const baseName = figName.replace(/^.*\//, '').replace(/\.[^.]+$/, '');
        const matchIdx = figureUrls.findIndex(u => u.includes(baseName));
        if (matchIdx >= 0) {
          figUrl = figureUrls[matchIdx];
        }
      }
      if (!figUrl && figCounter < figureUrls.length) {
        figUrl = figureUrls[figCounter];
      }
    }
    figCounter++;

    if (figUrl) {
      return `<figure class="my-8 rounded-xl border border-border/40 overflow-hidden bg-card">
        <div class="p-2 bg-background">
          <img src="${figUrl}" alt="${cleanCaption}" class="w-full rounded-lg" loading="lazy" />
        </div>
        ${cleanCaption ? `<figcaption class="px-4 py-3 text-sm text-muted-foreground italic border-t border-border/30 bg-muted/10">${cleanCaption}</figcaption>` : ''}
      </figure>`;
    }

    return `<figure class="my-8 p-6 rounded-xl bg-muted/10 border border-border/40 text-center">
      <div class="py-8 px-4 rounded-lg bg-muted/20 border border-dashed border-border/50 mb-3">
        <svg class="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>
        <p class="text-xs text-muted-foreground/50">See PDF for figure</p>
      </div>
      ${cleanCaption ? `<figcaption class="text-sm text-muted-foreground italic">${cleanCaption}</figcaption>` : ''}
    </figure>`;
  });

  // FIG placeholders → show figures from ZIP
  html = html.replace(/\{\{FIG:(\w+)\}\}/g, (_match, figId) => {
    const idx = parseInt(figId);
    if (!isNaN(idx) && idx < figureUrls.length) {
      return `<figure class="my-8 rounded-xl border border-border/40 overflow-hidden bg-card">
        <div class="p-2 bg-background">
          <img src="${figureUrls[idx]}" alt="Figure ${idx}" class="w-full rounded-lg" loading="lazy" />
        </div>
      </figure>`;
    }
    return `<div class="my-6 p-4 rounded-xl bg-muted/10 border border-dashed border-border/40 text-center text-sm text-muted-foreground/50 italic">Figure ${figId} — see PDF</div>`;
  });

  // Special characters
  html = html.replace(/\\&/g, '&amp;');
  html = html.replace(/\\%/g, '%');
  html = html.replace(/\\\$/g, '$');
  html = html.replace(/\\#/g, '#');
  html = html.replace(/~(?!=)/g, '&nbsp;');
  html = html.replace(/---/g, '\u2014');
  html = html.replace(/--/g, '\u2013');
  html = html.replace(/``/g, '\u201C');
  html = html.replace(/''/g, '\u201D');

  // Clean remaining unknown LaTeX commands (keep content)
  html = html.replace(/\\[a-zA-Z]+\*?\{([^}]*)\}/g, '$1');
  html = html.replace(/\\[a-zA-Z]+/g, '');

  // Paragraphs: double newlines → paragraph breaks
  html = html.replace(/\n{2,}/g, '</p><p class="text-muted-foreground leading-[1.8] mb-4">');
  html = `<p class="text-muted-foreground leading-[1.8] mb-4">${html}</p>`;

  // Clean empty paragraphs
  html = html.replace(/<p[^>]*>\s*<\/p>/g, '');

  return html;
}

export function latexClean(s: string): string {
  return s.replace(/\\textbf\{([^}]*)\}/g, '$1')
    .replace(/\\textit\{([^}]*)\}/g, '$1')
    .replace(/\\emph\{([^}]*)\}/g, '$1')
    .replace(/\\\\/g, '')
    .replace(/\\[a-zA-Z]+\{([^}]*)\}/g, '$1')
    .replace(/\\[a-zA-Z]+/g, '')
    .replace(/[{}]/g, '');
}

function convertTableContent(content: string): string {
  // Extract caption
  const caption = content.match(/\\caption\{([^}]*)\}/)?.[1] || '';
  // Find tabular
  const tabMatch = content.match(/\\begin\{tabular\}\{([^}]*)\}([\s\S]*?)\\end\{tabular\}/);
  if (!tabMatch) return `<p class="text-sm text-muted-foreground italic">[Table: ${latexClean(caption)}]</p>`;
  const tableHtml = convertTabularToHtml(tabMatch[2]);
  return `<div class="space-y-2">${tableHtml}${caption ? `<p class="text-sm text-muted-foreground italic text-center">${latexClean(caption)}</p>` : ''}</div>`;
}

function convertTabularToHtml(content: string): string {
  const rows = content.split('\\\\').map(r => r.trim()).filter(r => r && !r.match(/^\\(?:hline|toprule|midrule|bottomrule|cmidrule)/));
  if (rows.length === 0) return '';

  let html = '<table class="w-full text-sm border-collapse">';
  rows.forEach((row, i) => {
    // Skip rule commands
    const cleanRow = row.replace(/\\(?:hline|toprule|midrule|bottomrule|cmidrule\([^)]*\)\{[^}]*\})/g, '').trim();
    if (!cleanRow) return;
    const cells = cleanRow.split('&').map(c => c.trim());
    const tag = i === 0 ? 'th' : 'td';
    const cls = i === 0
      ? 'class="text-left font-semibold text-foreground/80 py-2.5 px-3 border-b-2 border-border/60 bg-muted/30 text-xs uppercase tracking-wide"'
      : 'class="text-left py-2 px-3 border-b border-border/30 text-muted-foreground"';
    html += `<tr>${cells.map(c => `<${tag} ${cls}>${latexClean(c)}</${tag}>`).join('')}</tr>`;
  });
  html += '</table>';
  return `<div class="rounded-xl border border-border/40 overflow-hidden">${html}</div>`;
}

// ── Parse LaTeX sections ────────────────────────────────────────

export function parseSections(latexContent: string | null): ParsedSection[] {
  if (!latexContent) return [];
  try {
    const sections: { type: string; latex_content: string }[] = JSON.parse(latexContent);
    return sections.map((s, i) => {
      const content = s.latex_content;
      // Extract subsections
      const subsections: { id: string; title: string; content: string }[] = [];
      const subParts = content.split(/\\subsection\*?\{([^}]*)\}/);

      let mainContent = subParts[0] || '';
      for (let j = 1; j < subParts.length; j += 2) {
        const subTitle = subParts[j];
        const subContent = subParts[j + 1] || '';
        subsections.push({
          id: `sec-${i}-sub-${Math.floor(j/2)}`,
          title: latexClean(subTitle),
          content: subContent,
        });
      }

      return {
        id: `section-${i}`,
        type: s.type,
        title: getSectionTitle(s.type),
        content: mainContent,
        subsections,
      };
    });
  } catch {
    return [];
  }
}
