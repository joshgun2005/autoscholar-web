import axios from 'axios';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
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
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('❌ Figure analysis: ANTHROPIC_API_KEY is not set');
    return { index, description: '', success: false };
  }

  try {
    const systemPrompt = context
      ? `${FIGURE_ANALYSIS_PROMPT}\n\nContext: this figure was generated for the following analysis: ${context}`
      : FIGURE_ANALYSIS_PROMPT;

    console.log(`🔍 Figure ${index + 1}: sending ${Math.round(base64.length / 1024)}KB image to ${VISION_MODEL}...`);

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
          'x-api-key': apiKey,
          'anthropic-version': ANTHROPIC_VERSION,
        },
        timeout: 30000,
      }
    );

    const description = response.data?.content?.[0]?.text;
    if (!description) {
      console.error(`❌ Figure ${index + 1}: empty response from vision model`, JSON.stringify(response.data).slice(0, 200));
      return { index, description: '', success: false };
    }

    console.log(`✅ Figure ${index + 1} analysis: "${description.slice(0, 80)}..."`);
    return { index, description, success: true };
  } catch (error: any) {
    // Log full error details for debugging
    if (error?.response) {
      console.error(`❌ Figure ${index + 1} analysis API error:`, {
        status: error.response.status,
        statusText: error.response.statusText,
        data: JSON.stringify(error.response.data).slice(0, 300),
      });
    } else if (error?.code) {
      console.error(`❌ Figure ${index + 1} analysis network error:`, error.code, error.message);
    } else {
      console.error(`❌ Figure ${index + 1} analysis failed:`, error?.message || error);
    }
    return { index, description: '', success: false };
  }
}

export async function analyzeFigures(
  figures: string[],
  context?: string
): Promise<FigureAnalysisResult[]> {
  console.log(`🔍 Starting vision analysis for ${figures.length} figure(s)...`);
  const results = await Promise.all(
    figures.map((base64, idx) => analyzeFigure(base64, idx, context))
  );
  const succeeded = results.filter(r => r.success).length;
  console.log(`✅ Vision analysis complete: ${succeeded}/${figures.length} succeeded`);
  return results;
}
