// Minimal stub for content summarization
// Returns content as-is without summarization

export function shouldSummarize(content: string, maxLength: number = 10000): boolean {
  return false; // Disable summarization
}

export async function summarizeContent(
  content: string,
  type: string = 'document',
  options?: any
): Promise<{ summary: string; [key: string]: any }> {
  // Return content as-is without summarization
  return {
    summary: content,
    original_length: content.length,
    summarized: false
  };
}
