import axios from 'axios';
import { logger } from '../utils/logger';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_VERSION = '2023-06-01';
const MODEL = 'claude-opus-4-6';

interface PaperForReview {
  title: string;
  abstract: string | null;
  authors: string | null;
  keywords: string | null;
  domain: string | null;
  wordCount: number | null;
  sectionCount: number | null;
  figureCount: number | null;
  latexContent: string | null;
  bibtexEntries: string | null;
}

interface DetailedScores {
  originality: number;
  methodology: number;
  results: number;
  writing: number;
  references: number;
  reproducibility: number;
}

interface SectionReview {
  section: string;
  score: number;
  comments: string;
}

export interface PeerReviewResult {
  overallScore: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  detailedScores: DetailedScores;
  sectionReviews: SectionReview[];
  recommendation: 'accept' | 'minor_revision' | 'major_revision' | 'reject';
  fullReport: string;
}

const SYSTEM_PROMPT = `You are an expert academic peer reviewer for a top-tier finance and economics journal. You review research papers with the same rigor and standards as reviewers at journals like the Journal of Finance, Review of Financial Studies, Econometrica, or the Journal of Financial Economics.

Your task is to produce a comprehensive, structured peer review report. You must be:
- HONEST and CRITICAL — do not inflate scores. A mediocre paper should get 40-60/100, not 80.
- CONSTRUCTIVE — every criticism should suggest how to improve
- SPECIFIC — cite exact sections, equations, tables, or paragraphs when making points
- FAIR — acknowledge genuine strengths before discussing weaknesses

SCORING RUBRIC (0-100 for each dimension):
  - 90-100: Exceptional — publishable in a top-5 journal as-is
  - 75-89: Strong — minor revisions needed, solid contribution
  - 60-74: Adequate — has merit but significant gaps need addressing
  - 40-59: Below average — fundamental issues with methodology or contribution
  - 20-39: Weak — major revision needed, questionable research design
  - 0-19: Unacceptable — should be rejected

DIMENSIONS TO EVALUATE:
1. **Originality** (0-100): Is the research question novel? Does it fill a genuine gap in the literature? Is the contribution clearly articulated?
2. **Methodology** (0-100): Is the econometric/statistical approach appropriate? Are model assumptions justified? Are equations well-specified? Is the identification strategy convincing?
3. **Results** (0-100): Are results presented clearly? Is the interpretation correct? Are robustness checks adequate? Are economic magnitudes discussed? Are tables/figures well-designed?
4. **Writing Quality** (0-100): Is the paper well-structured? Is the prose clear and concise? Is the LaTeX formatting professional? Are there grammatical errors?
5. **References** (0-100): Is the literature review comprehensive? Are key papers cited? Are citations used appropriately to support claims?
6. **Reproducibility** (0-100): Is there enough detail to replicate the study? Are data sources clearly described? Is code/methodology transparent?

SECTION-BY-SECTION REVIEW:
For each section (introduction, literature review, methodology, data, results, discussion, conclusion), provide:
- A score (0-100)
- Specific comments (2-4 sentences minimum per section)

OVERALL RECOMMENDATION:
- "accept": Score ≥ 80, paper is ready for publication
- "minor_revision": Score 65-79, good paper with minor issues to fix
- "major_revision": Score 45-64, has potential but needs substantial work
- "reject": Score < 45, fundamental flaws that cannot be easily fixed

You MUST respond with valid JSON in this exact format:
{
  "overallScore": <number 0-100>,
  "summary": "<2-3 paragraph executive summary of the review>",
  "strengths": ["<strength 1>", "<strength 2>", ...],
  "weaknesses": ["<weakness 1>", "<weakness 2>", ...],
  "detailedScores": {
    "originality": <number>,
    "methodology": <number>,
    "results": <number>,
    "writing": <number>,
    "references": <number>,
    "reproducibility": <number>
  },
  "sectionReviews": [
    {"section": "Introduction", "score": <number>, "comments": "<specific feedback>"},
    {"section": "Literature Review", "score": <number>, "comments": "<specific feedback>"},
    {"section": "Methodology", "score": <number>, "comments": "<specific feedback>"},
    {"section": "Data", "score": <number>, "comments": "<specific feedback>"},
    {"section": "Results", "score": <number>, "comments": "<specific feedback>"},
    {"section": "Discussion", "score": <number>, "comments": "<specific feedback>"},
    {"section": "Conclusion", "score": <number>, "comments": "<specific feedback>"}
  ],
  "recommendation": "<accept|minor_revision|major_revision|reject>",
  "fullReport": "<complete markdown peer review report, 1500-3000 words, structured with ## headers>"
}

Respond ONLY with the JSON object. No preamble, no code fences, no explanation outside the JSON.`;

function buildPaperContent(paper: PaperForReview): string {
  const parts: string[] = [];

  parts.push(`# ${paper.title}`);
  if (paper.authors) parts.push(`Authors: ${paper.authors}`);
  if (paper.domain) parts.push(`Domain: ${paper.domain}`);
  if (paper.keywords) {
    try {
      const kw = JSON.parse(paper.keywords);
      if (Array.isArray(kw)) parts.push(`Keywords: ${kw.join(', ')}`);
    } catch { /* noop */ }
  }
  if (paper.abstract) parts.push(`\n## Abstract\n${paper.abstract}`);

  parts.push(`\nMetadata: ${paper.wordCount || '?'} words, ${paper.sectionCount || '?'} sections, ${paper.figureCount || '?'} figures`);

  // Parse LaTeX sections
  if (paper.latexContent) {
    try {
      const sections = JSON.parse(paper.latexContent);
      if (Array.isArray(sections)) {
        for (const sec of sections) {
          parts.push(`\n## Section: ${sec.type}\n${sec.latex_content || ''}`);
        }
      }
    } catch { /* noop */ }
  }

  // Add references info
  if (paper.bibtexEntries) {
    const refCount = (paper.bibtexEntries.match(/@\w+\{/g) || []).length;
    parts.push(`\n## References\n${refCount} BibTeX entries provided.`);
    // Include first ~3000 chars of bibtex for reference quality assessment
    parts.push(paper.bibtexEntries.slice(0, 3000));
  }

  return parts.join('\n');
}

export async function generatePeerReview(paper: PaperForReview): Promise<PeerReviewResult> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  const paperContent = buildPaperContent(paper);
  logger.info(`Generating peer review for: ${paper.title} (${paperContent.length} chars)`);

  const response = await axios.post(
    ANTHROPIC_API_URL,
    {
      model: MODEL,
      max_tokens: 16000,
      temperature: 0.3, // Lower temperature for more consistent evaluation
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Please conduct a thorough peer review of the following research paper. Evaluate it as if you were reviewing for a top-tier finance journal.\n\n${paperContent}`,
        },
      ],
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      timeout: 300000,
    },
  );

  const textBlock = response.data?.content?.find((b: any) => b.type === 'text');
  if (!textBlock?.text) {
    throw new Error('No text response from Claude');
  }

  // Parse JSON response — strip any accidental markdown fences
  let jsonText = textBlock.text.trim();
  if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
  }

  const result = JSON.parse(jsonText) as PeerReviewResult;

  // Validate scores
  if (typeof result.overallScore !== 'number' || result.overallScore < 0 || result.overallScore > 100) {
    throw new Error('Invalid overall score');
  }

  logger.info(`Peer review complete: ${result.overallScore}/100 — ${result.recommendation}`);
  return result;
}
