import axios from 'axios';
import { spawn } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

interface BeamerOptions {
  question: string;
  answer: string;
  author: string;
  company?: string;
  figureUrls?: string[];  // e.g. ["/figures/fig-123-0.png", ...]
}

/**
 * Converts analysis to LaTeX Beamer structure using Claude
 */
async function generateBeamerStructure(options: BeamerOptions): Promise<string> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  const today = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const systemPrompt = `Tu es un expert en présentations LaTeX Beamer avec le thème Metropolis. Ton travail est d'analyser un contenu d'analyse financière et de créer des slides modernes, épurées et professionnelles.

RÈGLES CRITIQUES:
1. Retourne UNIQUEMENT le code LaTeX - PAS d'explications, PAS de \\documentclass, PAS de préambule
2. Le thème Metropolis est déjà configuré (aspect ratio 16:8, couleurs EventBlue/EventRed/EventGray)
3. Design ÉPURÉ: une idée par slide, max 4-5 points
4. Échappe TOUS les caractères spéciaux: $ → \\$, % → \\%, & → \\&, _ → \\_
5. Utilise \\alert{} pour nombres et pourcentages importants (couleur rouge EventRed)

STRUCTURE MODERNE METROPOLIS:
• \\section{Nom} - Crée une slide de section automatique (design épuré)
• \\begin{frame}{Titre} ... \\end{frame} - Slide standard
• \\begin{frame}[fragile] si code/verbatim
• \\begin{block}{Titre} ... \\end{block} - Boîte bleue pour info importante
• \\begin{alertblock}{Titre} ... \\end{alertblock} - Boîte rouge pour alertes
• \\begin{itemize} \\item ... \\end{itemize} - Liste à puces (bullets ronds bleus)
• \\begin{enumerate} \\item ... \\end{enumerate} - Liste numérotée
• \\alert{texte} - Highlight rouge pour chiffres/pourcentages

DESIGN ÉPURÉ METROPOLIS:
✓ Utilise des blocks pour structurer (pas de texte brut)
✓ Espace blanc généreux
✓ Titres courts et clairs
✓ Max 4-5 bullets par slide
✓ Privilégie les sections pour diviser le contenu
✗ Évite les slides surchargées
✗ Pas de sous-sous-points complexes
✗ Pas de paragraphes longs

EXEMPLES DE BON STYLE:

EXEMPLE 1 - Slide avec block:
\\begin{frame}{Résumé Exécutif}
\\begin{block}{Points Clés}
\\begin{itemize}
  \\item Rendement annuel: \\alert{+23\\%}
  \\item Volatilité: \\alert{37\\%}
  \\item Ratio Sharpe: \\alert{0.62}
\\end{itemize}
\\end{block}
\\end{frame}

EXEMPLE 2 - Slide avec alertblock:
\\begin{frame}{Risques Identifiés}
\\begin{alertblock}{Attention}
Persistance très faible (\\alert{0.11 jours}) - Les chocs se dissipent rapidement
\\end{alertblock}
\\begin{itemize}
  \\item Impact sur stratégies de hedging
  \\item Ajustements fréquents nécessaires
\\end{itemize}
\\end{frame}

EXEMPLE 3 - Section + contenu:
\\section{Résultats du Modèle}

\\begin{frame}{Paramètres Estimés}
\\begin{block}{Coefficients GJR-GARCH}
\\begin{itemize}
  \\item $\\alpha$ (ARCH): \\alert{0.0016}
  \\item $\\gamma$ (effet levier): \\alert{0.00015}
  \\item $\\beta$ (GARCH): \\alert{0.000009}
\\end{itemize}
\\end{block}
\\end{frame}`;

  // For very long content, extract just the key sections
  let contentToUse = options.answer;
  if (options.answer.length > 20000) {
    console.log('[BeamerSlides] Content is long (',options.answer.length,'chars), extracting key sections...');
    // Extract summary sections (usually contain # headers and key info)
    const sections = options.answer.split(/\n#{1,3}\s+/);
    // Take first 5 sections or 15000 chars, whichever is shorter
    contentToUse = sections.slice(0, 5).join('\n## ').substring(0, 15000);
    console.log('[BeamerSlides] Reduced to',contentToUse.length,'chars');
  }

  // Build figure instructions if figures are available
  const figureCount = options.figureUrls?.length || 0;
  const figureInstructions = figureCount > 0
    ? `\n\n📊 FIGURES DISPONIBLES (${figureCount} images):\nDes figures ont été générées. Pour CHAQUE figure, crée une slide dédiée avec:\n\\begin{frame}{Titre Descriptif de la Figure}\n\\begin{center}\n\\includegraphics[width=0.85\\textwidth]{figure-INDEX.png}\n\\end{center}\n\\end{frame}\n\nLes INDEX disponibles sont: ${Array.from({length: figureCount}, (_, i) => i).join(', ')}\nIntègre ces slides de figures aux endroits logiques dans ta présentation (après l'analyse correspondante).`
    : '';

  const userPrompt = `Crée des slides Beamer LaTeX MODERNES avec le thème Metropolis pour cette analyse.

⚠️ IMPORTANT: Retourne UNIQUEMENT le code LaTeX (PAS de \\documentclass, PAS de préambule, juste les frames)

CONTENU DE L'ANALYSE:
${contentToUse}${figureInstructions}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STRUCTURE DES SLIDES (8-10 slides maximum):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣ TABLE DES MATIÈRES
\\begin{frame}{Plan}
\\tableofcontents
\\end{frame}

2️⃣ RÉSUMÉ EXÉCUTIF (1 slide)
\\section{Résumé}
\\begin{frame}{Résumé Exécutif}
\\begin{block}{Points Clés}
\\begin{itemize}
  \\item Point 1 avec \\alert{chiffre\\%}
  \\item Point 2 avec \\alert{\\$valeur}
  \\item Point 3 avec \\alert{résultat}
\\end{itemize}
\\end{block}
\\end{frame}

3️⃣ CONTENU PRINCIPAL (5-6 slides)
Divise en 2-3 \\section{} logiques, chacune avec 2-3 frames:

\\section{Nom de la Section}

\\begin{frame}{Titre Clair}
\\begin{block}{Sous-titre Descriptif}
\\begin{itemize}
  \\item Point concis (max 1 ligne)
  \\item Chiffre important: \\alert{X\\%}
  \\item Conclusion claire
\\end{itemize}
\\end{block}
\\end{frame}

\\begin{frame}{Points Critiques}
\\begin{alertblock}{⚠️ Attention}
Message d'alerte important avec \\alert{valeur critique}
\\end{alertblock}

\\begin{block}{Implications}
\\begin{itemize}
  \\item Conséquence 1
  \\item Conséquence 2
\\end{itemize}
\\end{block}
\\end{frame}

4️⃣ MÉTRIQUES CLÉS (1-2 slides)
\\section{Métriques}

\\begin{frame}{Indicateurs Financiers}
\\begin{block}{Performance}
\\begin{itemize}
  \\item Métrique 1: \\alert{valeur}
  \\item Métrique 2: \\alert{valeur}
\\end{itemize}
\\end{block}

\\begin{block}{Risque}
\\begin{itemize}
  \\item Indicateur 1: \\alert{valeur}
  \\item Indicateur 2: \\alert{valeur}
\\end{itemize}
\\end{block}
\\end{frame}

5️⃣ CONCLUSION (1 slide)
\\section{Conclusion}

\\begin{frame}{Conclusions}
\\begin{block}{Résultats Principaux}
\\begin{itemize}
  \\item Résultat 1
  \\item Résultat 2
\\end{itemize}
\\end{block}

\\begin{alertblock}{Recommandation Principale}
Action clé à prendre avec \\alert{justification}
\\end{alertblock}
\\end{frame}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RÈGLES DE STYLE METROPOLIS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ TOUJOURS utiliser \\begin{block}{} pour structurer
✓ \\alert{} pour TOUS les chiffres/pourcentages/montants
✓ Titres courts (max 6 mots)
✓ Max 4-5 bullets par slide
✓ Une idée = une slide
✓ Espaces généreux (pas de surcharge)
✓ \\section{} pour diviser le contenu

✗ PAS de texte brut sans block
✗ PAS de paragraphes longs
✗ PAS de sous-sous-points
✗ PAS de slides surchargées

⚠️ ÉCHAPPEMENT OBLIGATOIRE:
$ → \\$  |  % → \\%  |  & → \\&  |  _ → \\_  |  # → \\#`;

  try {
    console.log('[BeamerSlides] Structuring content with Claude...');

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
        timeout: 120000 // 120 seconds for complex analyses
      }
    );

    let latexContent = response.data.content[0].text;

    // Clean up markdown fences if Claude added them
    latexContent = latexContent.replace(/^```latex\n?/gm, '').replace(/^```tex\n?/gm, '').replace(/\n?```$/gm, '').trim();

    console.log('[BeamerSlides] ✓ LaTeX content generated:', latexContent.length, 'chars');
    return latexContent;

  } catch (error) {
    console.error('[BeamerSlides] Error generating structure:', error);
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(`Claude API error: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    }
    throw new Error(`Failed to generate Beamer structure: ${(error as Error).message}`);
  }
}

/**
 * Creates complete Beamer .tex file
 */
function createBeamerDocument(content: string, options: BeamerOptions): string {
  const today = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // Extract title from first markdown heading in answer, or use generic title
  const headingMatch = options.answer.match(/^#{1,2}\s+(.+)$/m);
  const slideTitle = headingMatch ? headingMatch[1].trim() : 'Analyse Financière';
  const escTitle = slideTitle.replace(/\$/g, '\\$').replace(/%/g, '\\%').replace(/_/g, '\\_').replace(/&/g, '\\&').replace(/#/g, '\\#').replace(/\*/g, '');
  const escA = options.author.replace(/&/g, '\\&').replace(/_/g, '\\_');
  const escC = (options.company || 'VQuant').replace(/&/g, '\\&').replace(/_/g, '\\_');

  return `\\documentclass[aspectratio=169,12pt]{beamer}

% =====================================================
% THEME METROPOLIS — MODERN PREMIUM STYLE
% =====================================================
\\usetheme[
  progressbar=frametitle,
  numbering=fraction,
  sectionpage=progressbar,
  subsectionpage=none
]{metropolis}
\\usepackage{appendixnumberbeamer}

% =====================================================
% PACKAGES
% =====================================================
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage[french]{babel}
\\usepackage{amsmath, amsfonts, amssymb}
\\usepackage{booktabs}
\\usepackage{graphicx}
\\usepackage{hyperref}
\\usepackage{tikz}
\\usepackage{xcolor}
\\usepackage{fontawesome5}
\\usepackage{tcolorbox}
\\tcbuselibrary{skins,breakable}
\\usetikzlibrary{arrows.meta, positioning, calc, backgrounds}

% =====================================================
% COULEURS — VIBEQUANT BRAND PALETTE
% =====================================================
\\definecolor{VQTeal}{HTML}{119993}
\\definecolor{VQBlue}{HTML}{2072B2}
\\definecolor{VQPurple}{HTML}{652E89}
\\definecolor{VQOrange}{HTML}{F49422}
\\definecolor{VQRed}{HTML}{EF632B}
\\definecolor{VQGreen}{HTML}{6CBC5A}
\\definecolor{VQDark}{HTML}{1A1A2E}
\\definecolor{VQGray}{HTML}{6B7280}
\\definecolor{VQLightBg}{HTML}{F8FAFC}

% =====================================================
% METROPOLIS OVERRIDES
% =====================================================
\\setbeamercolor{normal text}{fg=VQDark, bg=white}
\\setbeamercolor{alerted text}{fg=VQRed}
\\setbeamercolor{example text}{fg=VQGreen}
\\setbeamercolor{structure}{fg=VQTeal}

\\setbeamercolor{progress bar}{fg=VQTeal, bg=VQTeal!15}
\\setbeamercolor{title separator}{fg=VQTeal}
\\setbeamercolor{frametitle}{fg=VQDark, bg=VQLightBg}

% Blocks — Glassmorphism-inspired
\\setbeamercolor{block title}{fg=white, bg=VQTeal}
\\setbeamercolor{block body}{fg=VQDark, bg=VQTeal!5}
\\setbeamercolor{block title alerted}{fg=white, bg=VQRed}
\\setbeamercolor{block body alerted}{fg=VQDark, bg=VQRed!5}
\\setbeamercolor{block title example}{fg=white, bg=VQGreen!80!black}
\\setbeamercolor{block body example}{fg=VQDark, bg=VQGreen!5}
\\setbeamertemplate{blocks}[rounded][shadow=false]

% Navigation
\\setbeamertemplate{navigation symbols}{}

% Items — Clean circles with gradient feel
\\setbeamertemplate{itemize items}[circle]
\\setbeamercolor{itemize item}{fg=VQTeal}
\\setbeamercolor{itemize subitem}{fg=VQBlue}
\\setbeamercolor{itemize subsubitem}{fg=VQGray}
\\setbeamercolor{enumerate item}{fg=VQTeal}
\\setbeamercolor{enumerate subitem}{fg=VQBlue}

% TOC
\\setbeamercolor{section in toc}{fg=VQDark}
\\setbeamercolor{subsection in toc}{fg=VQGray}
\\setbeamercolor{section number projected}{bg=VQTeal, fg=white}

% Standout
\\setbeamercolor{standout}{fg=white, bg=VQTeal}

% Footer
\\setbeamertemplate{footline}{
  \\hbox{%
    \\begin{beamercolorbox}[wd=\\paperwidth,ht=3ex,dp=1.5ex]{footline}%
      \\hspace{1em}%
      {\\tiny\\color{VQGray}\\textbf{VQuant} \\,|\\, ${today}}%
      \\hfill%
      {\\tiny\\color{VQGray}\\insertframenumber\\,/\\,\\inserttotalframenumber}%
      \\hspace{1em}%
    \\end{beamercolorbox}%
  }
}

% =====================================================
% CUSTOM TCOLORBOXES
% =====================================================
\\newtcolorbox{keyinsight}{
  colback=VQTeal!5, colframe=VQTeal, coltitle=white,
  fonttitle=\\bfseries, title={\\faLightbulb\\hspace{0.5em}Point Clé},
  boxrule=0.5pt, arc=3pt, left=6pt, right=6pt, top=4pt, bottom=4pt
}

\\newtcolorbox{warningbox}{
  colback=VQOrange!5, colframe=VQOrange, coltitle=white,
  fonttitle=\\bfseries, title={\\faExclamationTriangle\\hspace{0.5em}Attention},
  boxrule=0.5pt, arc=3pt, left=6pt, right=6pt, top=4pt, bottom=4pt
}

% =====================================================
% TITLE INFORMATION
% =====================================================
\\title{${escTitle}}
\\subtitle{\\textcolor{VQGray}{Analyse Financière}}
\\author{${escA}}
\\institute{${escC}}
\\date{${today}}

% =====================================================
\\begin{document}

% ---- Custom Title Slide ----
{
\\setbeamercolor{background canvas}{bg=VQDark}
\\begin{frame}[plain,noframenumbering]
  \\begin{tikzpicture}[remember picture,overlay]
    % Gradient accent circles
    \\fill[VQTeal, opacity=0.15] (current page.north west) ++(-1,-2) circle (4cm);
    \\fill[VQBlue, opacity=0.1] (current page.south east) ++(1,2) circle (5cm);
    \\fill[VQPurple, opacity=0.08] (current page.north east) ++(0,-4) circle (3cm);
  \\end{tikzpicture}

  \\vfill
  \\begin{center}
    {\\Large\\color{VQTeal}\\textbf{VQuant}}\\\\[2pt]
    {\\tiny\\color{VQGray}Financial Intelligence Platform}\\\\[20pt]
    {\\LARGE\\color{white}\\textbf{${escTitle}}}\\\\[12pt]
    {\\color{VQTeal}\\rule{60pt}{2pt}}\\\\[12pt]
    {\\normalsize\\color{VQGray}${escA}}\\\\[4pt]
    {\\small\\color{VQGray!70}${escC} \\,|\\, ${today}}
  \\end{center}
  \\vfill
\\end{frame}
}

% Content from Claude
${content}

% ---- Final Slide ----
{
\\setbeamercolor{background canvas}{bg=VQDark}
\\begin{frame}[plain,noframenumbering]
  \\begin{tikzpicture}[remember picture,overlay]
    \\fill[VQTeal, opacity=0.12] (current page.south west) ++(-1,2) circle (4cm);
    \\fill[VQPurple, opacity=0.08] (current page.north east) ++(0,-3) circle (3cm);
  \\end{tikzpicture}

  \\vfill
  \\begin{center}
    {\\Huge\\color{white}\\textbf{Merci}}\\\\[20pt]
    {\\color{VQTeal}\\rule{40pt}{2pt}}\\\\[16pt]
    {\\normalsize\\color{VQGray}Questions \\& Suggestions}\\\\[12pt]
    {\\small\\color{VQTeal}\\faEnvelope\\hspace{0.5em}\\href{mailto:admin@vquant.ai}{admin@vquant.ai}}\\\\[6pt]
    {\\small\\color{VQTeal}\\faGlobe\\hspace{0.5em}\\href{https://www.vquant.ai}{www.vquant.ai}}\\\\[20pt]
    {\\footnotesize\\color{VQGray!60}Généré avec \\textbf{\\color{VQTeal}VQuant AI}}
  \\end{center}
  \\vfill
\\end{frame}
}

\\end{document}`;
}

/**
 * Compiles .tex file to PDF using pdflatex
 */
async function compileToPDF(texContent: string, outputName: string, figureUrls?: string[]): Promise<Buffer> {
  const tempDir = path.join(__dirname, '../../temp');
  const fileName = `slides-${outputName}`;
  const texPath = path.join(tempDir, `${fileName}.tex`);
  const pdfPath = path.join(tempDir, `${fileName}.pdf`);

  try {
    // Create temp directory if doesn't exist
    await fs.mkdir(tempDir, { recursive: true });

    // Copy figures into temp dir so LaTeX can find them
    if (figureUrls && figureUrls.length > 0) {
      const figuresSourceDir = path.join(process.cwd(), 'dist', 'public', 'figures');
      for (let i = 0; i < figureUrls.length; i++) {
        const url = figureUrls[i]; // e.g. "/figures/fig-123-0.png"
        const sourceFilename = url.replace('/figures/', '');
        const sourcePath = path.join(figuresSourceDir, sourceFilename);
        const destPath = path.join(tempDir, `figure-${i}.png`);
        try {
          await fs.copyFile(sourcePath, destPath);
          console.log(`[BeamerSlides] Copied figure ${i}: ${sourceFilename}`);
        } catch (err) {
          console.warn(`[BeamerSlides] Could not copy figure ${sourceFilename}:`, (err as Error).message);
        }
      }
    }

    // Write .tex file
    await fs.writeFile(texPath, texContent, 'utf-8');
    console.log('[BeamerSlides] .tex file written:', texPath);

    // ── Find pdflatex (MacTeX / TeX Live) ───────────────────────────────────
    const texBinCandidates = [
      '/Library/TeX/texbin',
      '/usr/local/texlive/2025/bin/universal-darwin',
      '/usr/local/texlive/2024/bin/universal-darwin',
      '/usr/local/texlive/2025/bin/x86_64-darwin',
      '/usr/local/texlive/2024/bin/x86_64-darwin',
      '/usr/texbin',
    ];

    const pdflatexPath = texBinCandidates
      .map(dir => path.join(dir, 'pdflatex'))
      .find(p => existsSync(p)) || 'pdflatex'; // fallback to PATH

    // Augment PATH so pdflatex can find its own sub-tools (kpsewhich, etc.)
    const texBinDirs = texBinCandidates.filter(d => existsSync(d)).join(':');
    const spawnEnv = {
      ...process.env,
      PATH: `${texBinDirs}:${process.env.PATH || '/usr/bin:/bin'}`,
    };

    console.log('[BeamerSlides] Using pdflatex:', pdflatexPath);

    for (let i = 1; i <= 2; i++) {
      console.log(`[BeamerSlides] Compiling pass ${i}/2...`);

      await new Promise<void>((resolve, reject) => {
        const process = spawn(pdflatexPath, [
          '-interaction=nonstopmode',
          '-output-directory=' + tempDir,
          texPath
        ], {
          cwd: tempDir,
          env: spawnEnv,
        });

        let stdout = '';
        let stderr = '';

        process.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        process.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        process.on('close', async (code) => {
          // pdflatex peut retourner code 1 même si PDF généré (à cause de warnings)
          // Donc on vérifie si le PDF existe au lieu de juste regarder le code de retour
          try {
            const stats = await fs.stat(pdfPath);
            if (stats.size > 0) {
              console.log(`[BeamerSlides] ✓ Pass ${i} completed (PDF exists, ${stats.size} bytes)`);
              resolve();
              return;
            }
          } catch {
            // PDF doesn't exist
          }

          // If we get here, PDF wasn't generated
          if (code !== 0) {
            console.error('[BeamerSlides] pdflatex exit code:', code);
            console.error('[BeamerSlides] pdflatex stderr:', stderr);
            console.error('[BeamerSlides] pdflatex stdout (last 500 chars):', stdout.substring(Math.max(0, stdout.length - 500)));
            reject(new Error(`pdflatex failed with code ${code}`));
          } else {
            resolve();
          }
        });

        process.on('error', (error) => {
          reject(new Error(`Failed to start pdflatex: ${error.message}`));
        });
      });
    }

    // Check if PDF was generated
    try {
      await fs.access(pdfPath);
    } catch {
      throw new Error('PDF file was not generated - compilation may have failed');
    }

    // Read the generated PDF
    const pdfBuffer = await fs.readFile(pdfPath);
    console.log('[BeamerSlides] ✓ PDF generated successfully:', pdfBuffer.length, 'bytes');

    if (pdfBuffer.length === 0) {
      throw new Error('PDF file is empty');
    }

    // Cleanup temp files (but keep for debugging if cleanup fails)
    setTimeout(async () => {
      try {
        await fs.unlink(texPath);
        await fs.unlink(path.join(tempDir, `${fileName}.aux`));
        await fs.unlink(path.join(tempDir, `${fileName}.log`));
        await fs.unlink(path.join(tempDir, `${fileName}.nav`));
        await fs.unlink(path.join(tempDir, `${fileName}.out`));
        await fs.unlink(path.join(tempDir, `${fileName}.snm`));
        await fs.unlink(path.join(tempDir, `${fileName}.toc`));
        console.log('[BeamerSlides] Temp files cleaned up');
      } catch (cleanupError) {
        console.warn('[BeamerSlides] Cleanup failed (files kept for debugging):', (cleanupError as Error).message);
      }
    }, 5000); // Cleanup after 5 seconds to ensure PDF is sent

    // Keep PDF for a bit longer in case of issues
    setTimeout(async () => {
      try {
        await fs.unlink(pdfPath);
        console.log('[BeamerSlides] PDF temp file deleted');
      } catch {
        console.warn('[BeamerSlides] PDF cleanup failed');
      }
    }, 30000); // Delete PDF after 30 seconds

    return pdfBuffer;

  } catch (error) {
    console.error('[BeamerSlides] Compilation error:', error);
    console.error('[BeamerSlides] Error details:', (error as Error).message);

    // Try to read log file for more info
    try {
      const logPath = path.join(tempDir, `${fileName}.log`);
      const logContent = await fs.readFile(logPath, 'utf-8');
      const errorLines = logContent.split('\n').filter(line =>
        line.includes('Error') || line.includes('!')
      ).slice(0, 10);
      if (errorLines.length > 0) {
        console.error('[BeamerSlides] LaTeX errors from log:', errorLines.join('\n'));
      }
    } catch (logError) {
      console.warn('[BeamerSlides] Could not read log file');
    }

    throw error;
  }
}

/**
 * Main function: Convert analysis to Beamer PDF
 */
export async function convertToBeamerPDF(options: BeamerOptions): Promise<Buffer> {
  console.log('[BeamerSlides] Starting Beamer PDF generation...');

  // Step 1: Generate LaTeX content with Claude
  const latexContent = await generateBeamerStructure(options);

  // Step 2: Create complete .tex document
  const fullDocument = createBeamerDocument(latexContent, options);

  // Step 3: Compile to PDF (with figures if available)
  const pdfBuffer = await compileToPDF(fullDocument, Date.now().toString(), options.figureUrls);

  console.log('[BeamerSlides] ✓ Complete! PDF ready:', pdfBuffer.length, 'bytes');
  return pdfBuffer;
}
