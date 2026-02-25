import axios from 'axios';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

interface SlideConversionOptions {
  question: string;
  answer: string;
  author: string;
  company?: string;
}

export interface SlideStructure {
  title: string;
  subtitle: string;
  author: string;
  company: string;
  date: string;
  slides: Array<{
    type: 'title' | 'content' | 'two-column' | 'stats' | 'conclusion';
    title?: string;
    content?: string[];
    leftColumn?: string[];
    rightColumn?: string[];
    stats?: Array<{ label: string; value: string; trend?: string }>;
    background?: string;
  }>;
}

export async function convertToSlidesStructure(options: SlideConversionOptions): Promise<SlideStructure> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  const today = new Date().toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const systemPrompt = `You are a presentation structure expert. Analyze financial analysis content and extract a clean JSON structure for slides.

YOUR TASK: Return ONLY a JSON object (no explanations) with this structure:
{
  "title": "Main title from question",
  "subtitle": "Brief subtitle",
  "slides": [
    {"type": "content", "title": "Slide title", "content": ["Bullet 1", "Bullet 2"]},
    {"type": "stats", "title": "Key Metrics", "stats": [{"label": "Revenue", "value": "$35.1B", "trend": "+94%"}]},
    {"type": "two-column", "title": "Comparison", "leftColumn": ["Point 1"], "rightColumn": ["Point A"]},
    {"type": "conclusion", "title": "Conclusion", "content": ["Summary point"]}
  ]
}

RULES:
- Max 10 slides total
- Each content slide: max 5 bullets
- Extract key numbers for stats slides
- One main idea per slide
- Use type "stats" for financial metrics
- Use type "two-column" for comparisons
- Last slide must be type "conclusion"`;

  const userPrompt = `Analyze and structure this for slides. Return ONLY JSON:

QUESTION: ${options.question}

ANALYSIS:
${options.answer.substring(0, 40000)}

Extract the main points, key metrics, and insights. Structure into 6-10 slides.`;

  try {
    console.log('[SlidesConverter] Structuring content with Claude...');

    const response = await axios.post(
      ANTHROPIC_API_URL,
      {
        model: 'claude-opus-4-6',
        max_tokens: 8000,
        temperature: 0.1,
        messages: [{ role: 'user', content: userPrompt }],
        system: systemPrompt
      },
      {
        headers: {
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        timeout: 60000
      }
    );

    let jsonText = response.data.content[0].text;
    jsonText = jsonText.replace(/^```json\n?/gm, '').replace(/\n?```$/gm, '').trim();

    const structure = JSON.parse(jsonText) as SlideStructure;

    // Add metadata
    structure.author = options.author;
    structure.company = options.company || 'VibeQuant';
    structure.date = today;

    console.log('[SlidesConverter] ✓ Structure created:', structure.slides.length, 'slides');
    return structure;

  } catch (error) {
    console.error('[SlidesConverter] Error:', error);
    throw new Error(`Failed to structure slides: ${(error as Error).message}`);
  }
}
