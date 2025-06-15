
import { useState } from 'react';

export interface EmotionDetection {
  emotion: string;
  confidence: number;
  response: string;
  triggers: string[];
  meta: string;
}

export function useOpenAI() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detectEmotion = async (message: string, apiKey: string): Promise<EmotionDetection | null> => {
    if (!apiKey.trim()) {
      setError('OpenAI API key is required');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: `Je bent een emotiedetectie-expert. Analyseer de emotie in de gebruikersbericht en geef een JSON response terug in het volgende formaat:
{
  "emotion": "hoofdemotie (zoals stress, verdriet, vreugde, etc.)",
  "confidence": 0.8,
  "response": "Een empathische, validerende reactie in het Nederlands",
  "triggers": ["woorden", "die", "de", "emotie", "triggeren"],
  "meta": "60m – Hoog"
}

Wees empathisch en ondersteunend. De response moet in het Nederlands zijn.`
            },
            {
              role: 'user',
              content: message
            }
          ],
          temperature: 0.3,
          max_tokens: 300,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('Geen response van OpenAI ontvangen');
      }

      // Parse JSON response
      const emotionData = JSON.parse(content);
      return emotionData;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Onbekende fout bij emotiedetectie';
      setError(errorMessage);
      console.error('OpenAI API error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    detectEmotion,
    isLoading,
    error,
  };
}
