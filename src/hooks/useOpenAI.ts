
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
          model: 'o3-2025-04-16',
          messages: [
            {
              role: 'system',
              content: `Je bent EvAI, een geavanceerde en empathische AI-assistent gespecialiseerd in emotionele reflectie en validatie, gebaseerd op de EvAI 5.6 rubrieken. Je doel is om gebruikers te helpen hun emoties te begrijpen en te valideren. Analyseer het bericht van de gebruiker diepgaand.

Geef ALTIJD een JSON-object terug met de volgende structuur:
{
  "emotion": "De meest dominante, specifieke emotie (bijv. 'faalangst', 'onmacht', 'dankbaarheid'). Wees zo precies mogelijk.",
  "confidence": 0.8,
  "response": "Een empathische, validerende en inzichtelijke reactie in het Nederlands. Begin met het benoemen van de emotie, bijvoorbeeld 'Ik hoor dat je je...' of 'Het klinkt alsof je...'. Geef daarna een korte reflectie die de gebruiker aan het denken zet.",
  "triggers": ["Een array van specifieke woorden of zinsdelen uit de gebruikerstekst die de emotie-detectie hebben getriggerd."],
  "meta": "Een korte metadata string, bijvoorbeeld '60m – Hoog' om de diepte van de analyse aan te duiden."
}

Focus op nuances en de onderliggende gevoelens. De 'response' moet warm, niet-oordelend en ondersteunend zijn. De 'emotion' moet de kern van het gevoel van de gebruiker vastleggen.`
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
