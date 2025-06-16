
import { useState } from 'react';
import { ChatHistoryItem } from '../types';

export interface EmotionDetection {
  emotion: string;
  confidence: number;
  response: string;
  triggers: string[];
  meta: string;
  label: "Valideren" | "Reflectievraag" | "Suggestie";
  reasoning: string;
}

export function useOpenAI() {
  const [isLoading, setIsLoading] = useState(false);

  const detectEmotion = async (
    message: string, 
    apiKey: string,
    context?: { dislikedLabel?: "Valideren" | "Reflectievraag" | "Suggestie" },
    history: ChatHistoryItem[] = []
  ): Promise<EmotionDetection> => {
    if (!apiKey.trim()) {
      throw new Error('OpenAI API key is vereist. Stel deze in via de instellingen.');
    }

    setIsLoading(true);

    const userMessageContent = context?.dislikedLabel
      ? `The user's original message is: "${message}". My previous response had the label '${context.dislikedLabel}', which the user disliked. Please generate a new, alternative response. Your new response MUST have a different label than '${context.dislikedLabel}'.`
      : message;

    try {
      // Create proper headers
      const headers = new Headers();
      headers.append('Authorization', `Bearer ${apiKey}`);
      headers.append('Content-Type', 'application/json');

      const apiMessages = [
        {
          role: 'system',
          content: `Je bent EvAI, een geavanceerde neurosymbolische AI-assistent die zowel emotionele ondersteuning als praktische hulp biedt. Je doel is om gebruikers te helpen met een balans tussen emotionele validatie en concrete ondersteuning.

**Belangrijke richtlijnen:**
1. **Balans zoeken**: Niet elke uiting heeft een sterke emotionele lading. Soms willen mensen gewoon informatie, hulp of een gesprek.
2. **Context lezen**: Analyseer of de gebruiker emotionele ondersteuning zoekt OF praktische hulp/informatie wil.
3. **Natuurlijk reageren**: Vermijd overmatige focus op emoties als de context dat niet vraagt.

Je respons MOET een van de volgende drie categorieën ('labels') volgen:
- **Valideren**: Gebruik dit voor duidelijke emotionele uitingen. Erken en normaliseer gevoelens. Bv: 'Ik hoor dat je je gestresst voelt, dat is begrijpelijk in deze situatie.'
- **Reflectievraag**: Voor situaties waar dieper nadenken nuttig is. Stel open vragen die inzicht geven. Bv: 'Wat zou je helpen om dit gevoel beter te begrijpen?'
- **Suggestie**: Voor praktische hulp, informatie, of concrete stappen. Bv: 'Je zou kunnen proberen om eerst de belangrijkste taken op een rijtje te zetten.'

**Wanneer welke keuze:**
- Bij duidelijke emoties (angst, verdriet, stress) → **Valideren**
- Bij complexe situaties die reflectie vereisen → **Reflectievraag**  
- Bij praktische vragen, informatie of concrete hulp → **Suggestie**
- Bij neutrale/informatieve berichten → **Suggestie** (tenzij er onderliggende emoties zijn)

Geef ALTIJD een JSON-object terug met de volgende structuur:
{
  "emotion": "De meest dominante emotie indien aanwezig, anders 'neutraal' of specifieke context zoals 'informatie-zoekend'",
  "confidence": 0.8,
  "response": "Een natuurlijke, behulpzame reactie die past bij de context en het gekozen label. Wees empathisch maar niet overdreven emotioneel gericht.",
  "triggers": ["Specifieke woorden of zinsdelen die de keuze voor dit label ondersteunen"],
  "meta": "Korte metadata over de analyse, bijvoorbeeld 'Emotioneel' of 'Praktisch' of 'Informatief'",
  "label": "De gekozen categorie ('Valideren', 'Reflectievraag', of 'Suggestie')",
  "reasoning": "Korte uitleg waarom voor dit label gekozen is, gebaseerd op de context en triggers"
}

Focus op wat de gebruiker werkelijk nodig heeft, niet alleen op emotionele aspecten.`
        },
        ...history,
        {
          role: 'user',
          content: userMessageContent
        }
      ];

      console.log('Making OpenAI API call with proper headers...');

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          model: 'gpt-4.1-2025-04-14',
          messages: apiMessages,
          temperature: 0.4,
          max_tokens: 300,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        let errorMessage = errorData.error?.message || `OpenAI API error: ${response.status}`;
        
        if (response.status === 401) {
          errorMessage = 'Ongeldige of verlopen OpenAI API key. Controleer de key in de instellingen.';
        } else if (response.status === 429) {
          errorMessage = 'API rate limit of quotum overschreden. Wacht even of controleer je OpenAI account.';
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        throw new Error('Geen geldige response van OpenAI ontvangen.');
      }
      
      try {
        const emotionData = JSON.parse(content);
        console.log('OpenAI response parsed successfully:', emotionData);
        return emotionData;
      } catch (e) {
        console.error("Failed to parse OpenAI JSON response:", content);
        throw new Error("Kon het antwoord van de AI niet verwerken. Het was geen geldig JSON-formaat.");
      }

    } catch (err) {
      console.error('OpenAI API call failed:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    detectEmotion,
    isLoading,
  };
}
