import axios from 'axios';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_VERSION = '2023-06-01';
const VISION_MODEL = 'claude-haiku-4-5-20251001';

const FIGURE_ANALYSIS_PROMPT = `Analyze this chart/figure concisely. Describe:
1. Chart type (line, bar, scatter, etc.)
2. What data is displayed (axes, variables)
3. Key trends or patterns
4. Notable values or outliers

Respond in 2-4 sentences. Be specific with numbers and values visible in the chart.`;

interface FigureAnalysisResult {
  index: number;
  description: string;
  success: boolean;
}

export async function analyzeFigure(
  base64: string,
  index: number,
  context?: string
): Promise<FigureAnalysisResult> {
  try {
    const systemPrompt = context
      ? `${FIGURE_ANALYSIS_PROMPT}\n\nContext: this figure was generated for the following analysis: ${context}`
      : FIGURE_ANALYSIS_PROMPT;

    const response = await axios.post(
      ANTHROPIC_API_URL,
      {
        model: VISION_MODEL,
        max_tokens: 300,
        temperature: 0,
        stream: false,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/png',
                  data: base64,
                },
              },
              {
                type: 'text',
                text: 'Describe this figure.',
              },
            ],
          },
        ],
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY!,
          'anthropic-version': ANTHROPIC_VERSION,
        },
        timeout: 15000,
      }
    );

    const description = response.data.content[0].text;
    return { index, description, success: true };
  } catch (error: any) {
    const message = error?.message || 'Unknown error';
    console.error(`❌ Figure ${index + 1} analysis failed: ${message}`);
    return { index, description: '', success: false };
  }
}

export async function analyzeFigures(
  figures: string[],
  context?: string
): Promise<FigureAnalysisResult[]> {
  const results = await Promise.all(
    figures.map((base64, idx) => analyzeFigure(base64, idx, context))
  );
  return results;
}
