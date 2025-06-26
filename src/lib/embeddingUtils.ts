
export async function generateEmbedding(text: string, apiKey: string): Promise<number[]> {
  if (!apiKey?.trim()) {
    throw new Error('API key is required for generating embeddings');
  }

  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text.substring(0, 8000), // Limit input length
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API error: ${response.status} - ${errorData?.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  } catch (error) {
    console.error('❌ Failed to generate embedding:', error);
    throw error;
  }
}
