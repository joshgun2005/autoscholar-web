/**
 * Literature Gap Finder Service — AutoScholar
 *
 * Advanced sub-agent for discovering research gaps using a 7-step pipeline:
 *   1. Query Planning — decompose topic into diverse search angles
 *   2. Multi-source Literature Discovery — parallel search via OpenAlex, arXiv, CrossRef
 *   3. Citation Network Expansion — follow references via OpenAlex + CrossRef
 *   4. Scientific Structure Extraction — extract methods, datasets, limitations
 *   5. Thematic Clustering & Synthesis — group papers and synthesize landscape
 *   6. Gap Detection Engines — method, dataset, temporal, contradiction, limitation
 *   7. Gap Validation & Scoring — verify gaps aren't already covered
 */

import axios from 'axios';
import {
  multiSourceAcademicSearch,
  getOpenAlexReferences,
  getOpenAlexCitations,
  getCrossRefReferences,
  type AcademicPaper,
} from './academicSearchService';

// ── Constants ────────────────────────────────────────────────────
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';
const ANALYSIS_MODEL = 'claude-opus-4-6';

// ── Interfaces ───────────────────────────────────────────────────

export interface GapFinderInput {
  topic: string;
  focusAreas?: string[];
  dateRange?: string;
  paperLimit?: number;
  sources?: Array<'openalex' | 'arxiv' | 'crossref' | 'google_scholar'>;
  arxivCategory?: string;
}

export interface IdentifiedGap {
  title: string;
  description: string;
  evidence: string[];
  novelty: number; // 0-1 score
  feasibility: number; // 0-1 score
  citationPotential: number; // 0-1 score
  overallScore: number; // weighted combination
  gapType: 'method' | 'dataset' | 'temporal' | 'contradiction' | 'limitation' | 'cross_disciplinary';
  suggestedApproach: string;
  relevantPapers: string[];
  validationStatus: 'validated' | 'partially_explored' | 'uncertain';
}

export interface GapFinderResult {
  success: boolean;
  topic: string;
  totalPapersAnalyzed: number;
  sourcesUsed: string[];
  sourcesFailed: string[];
  gaps: IdentifiedGap[];
  recommendedGap: IdentifiedGap | null;
  suggestedTitle: string;
  suggestedAbstract: string;
  suggestedContributions: string[];
  literatureSynthesis: string;
  thematicClusters: Array<{ theme: string; papers: string[]; keyFindings: string }>;
  scientificLandscape: {
    dominantMethods: string[];
    commonDatasets: string[];
    sharedLimitations: string[];
    futureDirections: string[];
  };
  bibtexBlock: string;
  papers: Array<{
    citeKey: string;
    title: string;
    authors: string;
    year: number | null;
    citations: number;
    venue: string;
    abstractPreview: string;
  }>;
  error?: string;
}

// ── LLM Helper ──────────────────────────────────────────────────

async function callLLM(
  system: string,
  userMessage: string,
  maxTokens: number = 8192
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

  const response = await axios.post(
    ANTHROPIC_API_URL,
    {
      model: ANALYSIS_MODEL,
      max_tokens: maxTokens,
      temperature: 0.2,
      stream: false,
      system,
      messages: [{ role: 'user', content: userMessage }],
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      timeout: 300000,
    }
  );

  const text = response.data?.content?.[0]?.text;
  if (!text) throw new Error('Empty response from LLM');
  return text;
}

function parseJsonResponse(text: string): any {
  // Strategy 1: Extract from code fence
  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (fenceMatch) {
    try {
      return JSON.parse(fenceMatch[1].trim());
    } catch {
      // fence content wasn't valid JSON, continue to other strategies
    }
  }

  // Strategy 2: Find the outermost { ... } or [ ... ] in the text
  let jsonStr = '';
  const firstBrace = text.indexOf('{');
  const firstBracket = text.indexOf('[');

  if (firstBrace === -1 && firstBracket === -1) {
    throw new Error(`No JSON object or array found in response: ${text.substring(0, 200)}`);
  }

  const startChar = (firstBracket >= 0 && (firstBrace < 0 || firstBracket < firstBrace)) ? '[' : '{';
  const endChar = startChar === '{' ? '}' : ']';
  const startIdx = startChar === '{' ? firstBrace : firstBracket;

  // Find matching closing brace/bracket by counting depth
  let depth = 0;
  let inString = false;
  let escape = false;
  let endIdx = -1;

  for (let i = startIdx; i < text.length; i++) {
    const ch = text[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\') { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === startChar) depth++;
    if (ch === endChar) {
      depth--;
      if (depth === 0) { endIdx = i; break; }
    }
  }

  if (endIdx === -1) {
    // Truncated JSON — try to repair by closing open braces/brackets
    jsonStr = text.substring(startIdx);
    // Remove trailing comma
    jsonStr = jsonStr.replace(/,\s*$/, '');
    // Close any open structures
    const openBraces = (jsonStr.match(/{/g) || []).length - (jsonStr.match(/}/g) || []).length;
    const openBrackets = (jsonStr.match(/\[/g) || []).length - (jsonStr.match(/\]/g) || []).length;
    for (let i = 0; i < openBrackets; i++) jsonStr += ']';
    for (let i = 0; i < openBraces; i++) jsonStr += '}';
  } else {
    jsonStr = text.substring(startIdx, endIdx + 1);
  }

  // Strategy 3: Clean common LLM JSON issues before parsing
  // Remove trailing commas before } or ]
  jsonStr = jsonStr.replace(/,\s*([}\]])/g, '$1');
  // Remove single-line comments
  jsonStr = jsonStr.replace(/\/\/[^\n]*/g, '');

  try {
    return JSON.parse(jsonStr);
  } catch (e) {
    // Strategy 4: Aggressively fix common LLM JSON issues
    let fixed = jsonStr;

    // 4a. Replace unescaped newlines/tabs inside string values
    fixed = fixed.replace(/(?<=":?\s*"[^"]*)\n/g, '\\n');
    fixed = fixed.replace(/(?<=":?\s*"[^"]*)\t/g, '\\t');

    // 4b. Fix unescaped quotes inside string values (common in academic text)
    // Match strings and escape internal quotes: "value with "quotes" inside" → "value with \"quotes\" inside"
    fixed = fixed.replace(/"([^"]*?)"/g, (match, content) => {
      // Don't touch short strings or key names
      if (content.length < 50) return match;
      // Escape internal unescaped quotes
      const escaped = content.replace(/(?<!\\)"/g, '\\"');
      return `"${escaped}"`;
    });

    try {
      return JSON.parse(fixed);
    } catch {
      // Strategy 5: Try to extract just the top-level keys we need
      // For synthesis step: extract "synthesis" and "clusters" fields individually
      try {
        const synthMatch = fixed.match(/"synthesis"\s*:\s*"([\s\S]*?)"\s*,\s*"clusters"/);
        const clustersMatch = fixed.match(/"clusters"\s*:\s*(\[[\s\S]*\])\s*\}?\s*$/);
        if (synthMatch) {
          const synthesis = synthMatch[1].replace(/\\"/g, '"').replace(/\\n/g, ' ').substring(0, 5000);
          let clusters: any[] = [];
          if (clustersMatch) {
            try { clusters = JSON.parse(clustersMatch[1]); } catch { clusters = []; }
          }
          console.warn(`⚠️ [parseLLMJson] Recovered via field extraction (synthesis: ${synthesis.length} chars, clusters: ${clusters.length})`);
          return { synthesis, clusters };
        }
      } catch {}

      // Strategy 6: Last resort — return a minimal valid object with whatever text we can salvage
      const textContent = jsonStr.replace(/[{}[\]",:]/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 3000);
      console.warn(`⚠️ [parseLLMJson] All parsing strategies failed. Salvaging raw text (${textContent.length} chars)`);
      throw new Error(`Failed to parse JSON from LLM response. Error: ${(e as Error).message}. First 300 chars: ${jsonStr.substring(0, 300)}`);
    }
  }
}

/** Sanitize text for safe embedding inside JSON prompt strings */
function sanitize(text: string): string {
  return (text || '')
    .replace(/[\x00-\x1f]/g, ' ')  // remove control characters
    .replace(/\\/g, '\\\\')         // escape backslashes
    .replace(/"/g, "'")             // replace double quotes with single
    .replace(/\s+/g, ' ')          // collapse whitespace
    .trim();
}

/** Safely stringify papers for prompt embedding */
function papersToPromptString(papers: AcademicPaper[], limit: number, abstractLen: number): string {
  const safe = papers
    .sort((a, b) => (b.citationCount || 0) - (a.citationCount || 0))
    .slice(0, limit)
    .map(p => ({
      key: p.citeKey,
      title: sanitize(p.title),
      authors: p.authors.slice(0, 2).join(', ') + (p.authors.length > 2 ? ' et al.' : ''),
      year: p.year,
      citations: p.citationCount || 0,
      venue: sanitize(p.venue || ''),
      abstract: sanitize((p.abstract || '').substring(0, abstractLen)),
    }));
  return JSON.stringify(safe, null, 1);
}

// ── Main Pipeline ────────────────────────────────────────────────

export async function findLiteratureGaps(
  input: GapFinderInput
): Promise<GapFinderResult> {
  const startTime = Date.now();
  const paperLimit = input.paperLimit || 15;
  const sources = input.sources || ['openalex', 'arxiv', 'crossref'];

  console.log(`🔬 [Gauss] Starting 7-step pipeline for: "${input.topic.substring(0, 80)}..."`);

  try {
    // ═══ STEP 1: Plan Search Strategy ═══
    console.log('🔬 [Gauss] Step 1/7: Planning search strategy...');
    const searchPlan = await planSearchStrategy(input);
    console.log(`🔬 [Gauss] Generated ${searchPlan.queries.length} queries across ${searchPlan.angles.length} angles`);

    // ═══ STEP 2: Execute Multi-Source Searches ═══
    console.log('🔬 [Gauss] Step 2/7: Searching academic databases...');
    const searchResults = await executeSearches(searchPlan.queries, paperLimit, sources, input.arxivCategory);
    console.log(`🔬 [Gauss] Found ${searchResults.allPapers.length} unique papers from [${searchResults.sourcesUsed.join(', ')}]`);

    if (searchResults.allPapers.length < 3) {
      return emptyResult(input, searchResults, `Only ${searchResults.allPapers.length} papers found. Need at least 3. Try broadening the topic.`);
    }

    // ═══ STEP 3: Citation Network Expansion ═══
    console.log('🔬 [Gauss] Step 3/7: Expanding via citation network...');
    const expandedPapers = await expandCitationNetwork(searchResults);
    console.log(`🔬 [Gauss] Expanded to ${expandedPapers.allPapers.length} papers (+${expandedPapers.allPapers.length - searchResults.allPapers.length} from references)`);

    // ═══ STEP 4: Scientific Structure Extraction ═══
    console.log('🔬 [Gauss] Step 4/7: Extracting scientific structure...');
    let landscape: ScientificLandscape;
    try {
      landscape = await extractScientificStructure(expandedPapers.allPapers, input);
      console.log(`🔬 [Gauss] Extracted: ${landscape.dominantMethods.length} methods, ${landscape.commonDatasets.length} datasets, ${landscape.sharedLimitations.length} limitations`);
    } catch (err: any) {
      console.warn(`🔬 [Gauss] Step 4 parsing failed: ${err?.message}. Using empty landscape.`);
      landscape = { dominantMethods: [], commonDatasets: [], sharedLimitations: [], futureDirections: [] };
    }

    // ═══ STEP 5: Thematic Clustering & Synthesis ═══
    console.log('🔬 [Gauss] Step 5/7: Synthesizing literature & clustering...');
    let synthesis: LiteratureSynthesis;
    try {
      synthesis = await synthesizeLiterature(expandedPapers.allPapers, landscape, input);
    } catch (err: any) {
      console.warn(`🔬 [Gauss] Step 5 parsing failed: ${err?.message}. Using fallback synthesis.`);
      synthesis = { synthesis: 'Literature synthesis could not be generated due to a parsing error.', clusters: [] };
    }

    // ═══ STEP 6: Gap Detection ═══
    console.log('🔬 [Gauss] Step 6/7: Running gap detection engines...');
    let rawGaps: RawGapAnalysis;
    try {
      rawGaps = await detectGaps(expandedPapers.allPapers, synthesis, landscape, input);
    } catch (err: any) {
      console.warn(`🔬 [Gauss] Step 6 parsing failed: ${err?.message}. Retrying with simpler prompt...`);
      rawGaps = await detectGapsSimple(expandedPapers.allPapers, input);
    }

    // ═══ STEP 7: Gap Validation & Scoring ═══
    console.log('🔬 [Gauss] Step 7/7: Validating and scoring gaps...');
    const validatedGaps = await validateGaps(rawGaps, sources, input.arxivCategory);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ [Gauss] Complete: ${validatedGaps.gaps.length} validated gaps in ${elapsed}s`);

    // Format papers for output
    const papersOutput = expandedPapers.allPapers
      .sort((a, b) => (b.citationCount || 0) - (a.citationCount || 0))
      .slice(0, 50)
      .map(p => ({
        citeKey: p.citeKey,
        title: p.title,
        authors: p.authors.slice(0, 3).join(', ') + (p.authors.length > 3 ? ' et al.' : ''),
        year: p.year,
        citations: p.citationCount || 0,
        venue: p.venue || '',
        abstractPreview: (p.abstract || '').substring(0, 200),
      }));

    return {
      success: true,
      topic: input.topic,
      totalPapersAnalyzed: expandedPapers.allPapers.length,
      sourcesUsed: expandedPapers.sourcesUsed,
      sourcesFailed: expandedPapers.sourcesFailed,
      gaps: validatedGaps.gaps,
      recommendedGap: validatedGaps.recommendedGap,
      suggestedTitle: validatedGaps.suggestedTitle,
      suggestedAbstract: validatedGaps.suggestedAbstract,
      suggestedContributions: validatedGaps.suggestedContributions,
      literatureSynthesis: synthesis.synthesis,
      thematicClusters: synthesis.clusters,
      scientificLandscape: landscape,
      bibtexBlock: expandedPapers.bibtexBlock,
      papers: papersOutput,
    };
  } catch (error: any) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.error(`❌ [Gauss] Failed after ${elapsed}s:`, error?.message || error);
    return emptyResult(input, { sourcesUsed: [], sourcesFailed: [], allPapers: [], bibtexBlock: '' }, error?.message || 'Unknown error');
  }
}

function emptyResult(input: GapFinderInput, sr: any, error: string): GapFinderResult {
  return {
    success: false, topic: input.topic, totalPapersAnalyzed: sr.allPapers?.length || 0,
    sourcesUsed: sr.sourcesUsed || [], sourcesFailed: sr.sourcesFailed || [],
    gaps: [], recommendedGap: null, suggestedTitle: '', suggestedAbstract: '', suggestedContributions: [],
    literatureSynthesis: '', thematicClusters: [],
    scientificLandscape: { dominantMethods: [], commonDatasets: [], sharedLimitations: [], futureDirections: [] },
    bibtexBlock: sr.bibtexBlock || '', papers: [], error,
  };
}

// ── Step 1: Plan Search Strategy ─────────────────────────────────

interface SearchPlan {
  queries: string[];
  angles: string[];
}

async function planSearchStrategy(input: GapFinderInput): Promise<SearchPlan> {
  const focusHint = input.focusAreas?.length ? `\nFocus areas: ${input.focusAreas.join(', ')}` : '';
  const dateHint = input.dateRange ? `\nDate range: ${input.dateRange}` : '';

  const response = await callLLM(
    `You are an academic research strategist. Generate diverse search queries to cover the full landscape of a research topic. Output ONLY valid JSON.`,
    `Topic: ${input.topic}${focusHint}${dateHint}

Generate 7 search queries from DIFFERENT angles:
1. Core theoretical/foundational (seminal works)
2. Methodological approaches (how this is studied empirically)
3. Recent advances (2022+ findings)
4. Contradictions/debates (conflicting evidence)
5. Adjacent field (cross-disciplinary connections)
6. Applied/practical (real-world applications)
7. Data/measurement (how variables are proxied/measured)

Output: {"queries": ["q1", ...], "angles": ["angle1", ...]}`
  );

  return parseJsonResponse(response);
}

// ── Step 2: Execute Searches ─────────────────────────────────────

interface SearchResults {
  allPapers: AcademicPaper[];
  bibtexBlock: string;
  sourcesUsed: string[];
  sourcesFailed: string[];
}

async function executeSearches(
  queries: string[],
  limitPerQuery: number,
  sources: Array<'openalex' | 'arxiv' | 'crossref' | 'google_scholar'>,
  arxivCategory?: string
): Promise<SearchResults> {
  const allPapersMap = new Map<string, AcademicPaper>();
  const allBibtex: string[] = [];
  const sourcesUsedSet = new Set<string>();
  const sourcesFailedSet = new Set<string>();

  // Use ALL queries (up to 7)
  const searchPromises = queries.slice(0, 7).map(query =>
    multiSourceAcademicSearch(query, limitPerQuery, sources, arxivCategory)
      .catch(err => {
        console.warn(`🔬 [Gauss] Search failed for "${query}": ${err?.message}`);
        return null;
      })
  );

  const results = await Promise.all(searchPromises);

  for (const result of results) {
    if (!result) continue;
    for (const src of result.sources_used) sourcesUsedSet.add(src);
    for (const src of result.sources_failed) sourcesFailedSet.add(src);

    for (const paper of result.papers) {
      const key = paper.doi || paper.arxivId || paper.title.substring(0, 60).toLowerCase();
      if (!allPapersMap.has(key)) {
        allPapersMap.set(key, paper);
      }
    }

    if (result.bibtex_block) allBibtex.push(result.bibtex_block);
  }

  // Deduplicate bibtex
  const bibtexEntries = new Map<string, string>();
  const fullBibtex = allBibtex.join('\n\n');
  const entries = fullBibtex.split(/(?=@(?:article|misc|inproceedings|book)\{)/i);
  for (const entry of entries) {
    const keyMatch = entry.match(/@\w+\{([^,]+),/);
    if (keyMatch && keyMatch[1] && !bibtexEntries.has(keyMatch[1])) {
      bibtexEntries.set(keyMatch[1], entry.trim());
    }
  }

  return {
    allPapers: Array.from(allPapersMap.values()),
    bibtexBlock: Array.from(bibtexEntries.values()).join('\n\n'),
    sourcesUsed: Array.from(sourcesUsedSet),
    sourcesFailed: Array.from(sourcesFailedSet).filter(s => !sourcesUsedSet.has(s)),
  };
}

// ── Step 3: Citation Network Expansion (multi-source) ────────────

async function expandCitationNetwork(sr: SearchResults): Promise<SearchResults> {
  // Take top 8 most-cited papers and fetch their references via multiple APIs
  const topPapers = [...sr.allPapers]
    .sort((a, b) => (b.citationCount || 0) - (a.citationCount || 0))
    .slice(0, 8)
    .filter(p => p.doi); // Need DOI for cross-API lookups

  const existingKeys = new Set(sr.allPapers.map(p => p.doi || p.title.substring(0, 60).toLowerCase()));
  const newPapers: AcademicPaper[] = [];

  console.log(`🔬 [Gauss] Expanding citations for ${topPapers.length} top papers via OpenAlex + CrossRef...`);

  const refPromises = topPapers.map(async (paper) => {
    const paperRefs: AcademicPaper[] = [];

    // Use OpenAlex (primary) and CrossRef (secondary) for reference expansion
    const [oaRefs, crRefs] = await Promise.all([
      paper.doi ? getOpenAlexReferences(paper.doi, 15).catch(() => [] as AcademicPaper[]) : Promise.resolve([]),
      paper.doi ? getCrossRefReferences(paper.doi, 10).catch(() => [] as AcademicPaper[]) : Promise.resolve([]),
    ]);

    paperRefs.push(...oaRefs, ...crRefs);

    // Deduplicate and add new papers
    for (const ref of paperRefs) {
      const key = ref.doi || ref.title.substring(0, 60).toLowerCase();
      if (!existingKeys.has(key)) {
        existingKeys.add(key);
        newPapers.push(ref);
      }
    }
  });

  await Promise.all(refPromises);

  // Also get citing papers (forward citations) for the top 3 papers via OpenAlex
  const topForCitations = topPapers.slice(0, 3).filter(p => p.doi);
  const citationPromises = topForCitations.map(async (paper) => {
    try {
      const citations = await getOpenAlexCitations(paper.doi!, 8);
      for (const cite of citations) {
        const key = cite.doi || cite.title.substring(0, 60).toLowerCase();
        if (!existingKeys.has(key)) {
          existingKeys.add(key);
          newPapers.push(cite);
        }
      }
    } catch {}
  });

  await Promise.all(citationPromises);

  console.log(`🔬 [Gauss] Citation expansion: found ${newPapers.length} new papers (total: ${sr.allPapers.length + newPapers.length})`);

  // Merge bibtex for new papers
  const newBibtex = newPapers.filter(p => p.bibtex).map(p => p.bibtex).join('\n\n');
  const combinedBibtex = sr.bibtexBlock + (newBibtex ? '\n\n' + newBibtex : '');

  return {
    allPapers: [...sr.allPapers, ...newPapers],
    bibtexBlock: combinedBibtex,
    sourcesUsed: sr.sourcesUsed,
    sourcesFailed: sr.sourcesFailed,
  };
}

// ── Step 4: Scientific Structure Extraction ──────────────────────

interface ScientificLandscape {
  dominantMethods: string[];
  commonDatasets: string[];
  sharedLimitations: string[];
  futureDirections: string[];
}

async function extractScientificStructure(
  papers: AcademicPaper[],
  input: GapFinderInput
): Promise<ScientificLandscape> {
  const response = await callLLM(
    `You are a research methodology analyst. Extract the scientific structure from a body of literature. You MUST respond with ONLY a JSON object — no text before or after.`,
    `Topic: ${sanitize(input.topic)}
${input.focusAreas?.length ? `Focus areas: ${input.focusAreas.join(', ')}` : ''}

Papers (top ${Math.min(papers.length, 40)} by citations):
${papersToPromptString(papers, 40, 300)}

Analyze these papers and extract:
{
  "dominantMethods": ["method1", "method2", ...],
  "commonDatasets": ["dataset1", "dataset2", ...],
  "sharedLimitations": ["limitation1", "limitation2", ...],
  "futureDirections": ["direction1", "direction2", ...],
  "methodPaperMap": {"method": ["citeKey1", ...]},
  "datasetPaperMap": {"dataset": ["citeKey1", ...]}
}

Be specific. List actual econometric methods (GARCH, VAR, OLS, DCC, etc.), actual data sources (CRSP, FRED, Bloomberg, etc.), and concrete limitations.`,
    8192
  );

  const parsed = parseJsonResponse(response);
  return {
    dominantMethods: parsed.dominantMethods || [],
    commonDatasets: parsed.commonDatasets || [],
    sharedLimitations: parsed.sharedLimitations || [],
    futureDirections: parsed.futureDirections || [],
  };
}

// ── Step 5: Synthesize Literature ────────────────────────────────

interface LiteratureSynthesis {
  synthesis: string;
  clusters: Array<{ theme: string; papers: string[]; keyFindings: string }>;
}

async function synthesizeLiterature(
  papers: AcademicPaper[],
  landscape: ScientificLandscape,
  input: GapFinderInput
): Promise<LiteratureSynthesis> {
  const response = await callLLM(
    `You are a senior academic researcher performing a literature synthesis. You MUST respond with ONLY a JSON object — no text before or after.`,
    `Topic: ${sanitize(input.topic)}
${input.focusAreas?.length ? `Focus areas: ${input.focusAreas.join(', ')}` : ''}

Known methods in field: ${landscape.dominantMethods.join(', ')}
Known datasets: ${landscape.commonDatasets.join(', ')}
Known limitations: ${landscape.sharedLimitations.join(', ')}

Papers (top ${Math.min(papers.length, 45)} by citations):
${papersToPromptString(papers, 45, 300)}

Output:
{
  "synthesis": "A 4-5 paragraph synthesis. Describe main research streams, key debates, dominant methodologies, data sources, and field evolution. Use \\\\cite{key} to reference papers. Be scholarly and specific.",
  "clusters": [
    {
      "theme": "Theme name",
      "papers": ["citeKey1", "citeKey2"],
      "keyFindings": "3-4 sentence summary of contributions and consensus/disagreements"
    }
  ]
}

Create 5-7 thematic clusters. The synthesis must be substantive enough for a literature review section.`,
    8192
  );

  return parseJsonResponse(response);
}

// ── Step 6: Gap Detection ────────────────────────────────────────

interface RawGapAnalysis {
  gaps: IdentifiedGap[];
  recommendedGap: IdentifiedGap | null;
  suggestedTitle: string;
  suggestedAbstract: string;
  suggestedContributions: string[];
}

async function detectGaps(
  papers: AcademicPaper[],
  synthesis: LiteratureSynthesis,
  landscape: ScientificLandscape,
  input: GapFinderInput
): Promise<RawGapAnalysis> {
  const response = await callLLM(
    `You are a PhD advisor and research gap detection engine. You must identify genuine, publishable research gaps using multiple detection strategies.

GAP DETECTION ENGINES to apply:

1. METHOD GAP — Methods used in adjacent fields but absent in target field
2. DATASET GAP — Available datasets rarely used in the literature
3. TEMPORAL GAP — Under-studied time periods or events
4. CONTRADICTION — Claims with conflicting results across papers
5. LIMITATION AGGREGATOR — Repeated limitations that signal innovation opportunities
6. CROSS-DISCIPLINARY — Bridge between research clusters that rarely cite each other

RULES:
- A gap is NOT "more data" or "different country" — it must involve genuine innovation
- Each gap MUST have concrete evidence from the literature
- Score each dimension 0.0-1.0 (not high/medium/low)
- Sort by overall_score = 0.4*novelty + 0.3*feasibility + 0.3*citation_potential

You MUST respond with ONLY a JSON object — no text before or after.`,
    `Topic: ${sanitize(input.topic)}
${input.focusAreas?.length ? `Focus areas: ${input.focusAreas.join(', ')}` : ''}

SCIENTIFIC LANDSCAPE:
- Methods used: ${landscape.dominantMethods.join(', ')}
- Datasets used: ${landscape.commonDatasets.join(', ')}
- Shared limitations: ${landscape.sharedLimitations.join(', ')}
- Suggested future directions: ${landscape.futureDirections.join(', ')}

LITERATURE SYNTHESIS:
${sanitize(synthesis.synthesis)}

THEMATIC CLUSTERS:
${JSON.stringify(synthesis.clusters?.map(c => ({ theme: c.theme, papers: c.papers, keyFindings: sanitize(c.keyFindings) })) || [], null, 1)}

PAPERS (top ${Math.min(papers.length, 40)} by citations):
${papersToPromptString(papers, 40, 250)}

Identify 4-6 research gaps and output:
{
  "gaps": [
    {
      "title": "Concise gap title",
      "description": "4-5 sentences: what is missing, why it matters, what evidence points to this gap",
      "evidence": ["Specific evidence: 'Smith2023 shows X but ignores Y'", ...],
      "novelty": 0.85,
      "feasibility": 0.78,
      "citationPotential": 0.82,
      "overallScore": 0.82,
      "gapType": "method|dataset|temporal|contradiction|limitation|cross_disciplinary",
      "suggestedApproach": "Specific methodology: models, data, techniques",
      "relevantPapers": ["citeKey1", "citeKey2"],
      "validationStatus": "uncertain"
    }
  ],
  "recommendedGapIndex": 0,
  "suggestedTitle": "Academic paper title for best gap",
  "suggestedAbstract": "200-word abstract: motivation, gap, methodology, expected contribution",
  "suggestedContributions": ["First contribution", "Second contribution", "Third contribution"]
}`,
    8192
  );

  const parsed = parseJsonResponse(response);
  const recIdx = parsed.recommendedGapIndex ?? 0;
  const recommendedGap = parsed.gaps?.[recIdx] || parsed.gaps?.[0] || null;

  return {
    gaps: parsed.gaps || [],
    recommendedGap,
    suggestedTitle: parsed.suggestedTitle || '',
    suggestedAbstract: parsed.suggestedAbstract || '',
    suggestedContributions: parsed.suggestedContributions || [],
  };
}

// ── Step 6 Fallback: Simplified Gap Detection ───────────────────

async function detectGapsSimple(
  papers: AcademicPaper[],
  input: GapFinderInput
): Promise<RawGapAnalysis> {
  console.log('🔬 [Gauss] Running simplified gap detection (fallback)...');

  const response = await callLLM(
    `You are a research gap detector. Given paper titles, identify 3 research gaps. Respond with ONLY a JSON object.`,
    `Topic: ${sanitize(input.topic)}

Paper titles:
${papers.slice(0, 25).map(p => `- ${sanitize(p.title)} (${p.year || 'n.d.'}, ${p.citationCount || 0} cites)`).join('\n')}

Output:
{
  "gaps": [{"title": "gap1", "description": "desc", "evidence": ["evidence1"], "novelty": 0.7, "feasibility": 0.7, "citationPotential": 0.7, "overallScore": 0.7, "gapType": "method", "suggestedApproach": "approach", "relevantPapers": [], "validationStatus": "uncertain"}],
  "recommendedGapIndex": 0,
  "suggestedTitle": "title",
  "suggestedAbstract": "abstract",
  "suggestedContributions": ["contribution1"]
}`,
    4096
  );

  const parsed = parseJsonResponse(response);
  const recIdx = parsed.recommendedGapIndex ?? 0;
  return {
    gaps: parsed.gaps || [],
    recommendedGap: parsed.gaps?.[recIdx] || null,
    suggestedTitle: parsed.suggestedTitle || '',
    suggestedAbstract: parsed.suggestedAbstract || '',
    suggestedContributions: parsed.suggestedContributions || [],
  };
}

// ── Step 7: Gap Validation ───────────────────────────────────────

async function validateGaps(
  analysis: RawGapAnalysis,
  sources: Array<'openalex' | 'arxiv' | 'crossref' | 'google_scholar'>,
  arxivCategory?: string
): Promise<RawGapAnalysis> {
  if (analysis.gaps.length === 0) return analysis;

  // For top 3 gaps, run targeted searches to check if they're already covered
  const topGaps = analysis.gaps.slice(0, 3);

  const validationPromises = topGaps.map(async (gap) => {
    try {
      // Search specifically for the gap topic
      const result = await multiSourceAcademicSearch(
        gap.title,
        5,
        sources.filter(s => s !== 'google_scholar'), // avoid SerpAPI cost
        arxivCategory
      );

      // If we find papers that directly address the gap, downgrade it
      const directMatches = result.papers.filter(p => {
        const combined = (p.title + ' ' + p.abstract).toLowerCase();
        const gapWords = gap.title.toLowerCase().split(/\s+/).filter(w => w.length > 4);
        const matchCount = gapWords.filter(w => combined.includes(w)).length;
        return matchCount >= gapWords.length * 0.6;
      });

      if (directMatches.length >= 3) {
        gap.validationStatus = 'partially_explored';
        gap.novelty = Math.max(0.2, gap.novelty - 0.3);
        gap.overallScore = 0.4 * gap.novelty + 0.3 * gap.feasibility + 0.3 * gap.citationPotential;
      } else {
        gap.validationStatus = 'validated';
      }
    } catch (err: any) {
      console.warn(`🔬 [Gauss] Validation search failed for "${gap.title}": ${err?.message}`);
      gap.validationStatus = 'uncertain';
    }
  });

  await Promise.all(validationPromises);

  // Re-sort by overall score after validation adjustments
  analysis.gaps.sort((a, b) => (b.overallScore || 0) - (a.overallScore || 0));

  // Update recommended gap to best validated one
  const bestValidated = analysis.gaps.find(g => g.validationStatus === 'validated') || analysis.gaps[0];
  if (bestValidated) {
    analysis.recommendedGap = bestValidated;
  }

  return analysis;
}
