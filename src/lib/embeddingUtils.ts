
export const generateEmbedding = async (text: string, apiKey: string): Promise<number[]> => {
  console.log('🧠 Generating embedding with text-embedding-3-small model...');
  
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small', // Always use text-embedding-3-small for vector embeddings
      input: text.substring(0, 8000), // Limit input length
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI Embedding API error: ${response.statusText}`);
  }

  const data = await response.json();
  console.log('✅ Embedding generated successfully with text-embedding-3-small');
  return data.data[0].embedding;
};
