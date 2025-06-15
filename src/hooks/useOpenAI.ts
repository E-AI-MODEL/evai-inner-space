import { useState } from 'react';

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
    context?: { dislikedLabel?: "Valideren" | "Reflectievraag" | "Suggestie" }
  ): Promise<EmotionDetection> => {
    if (!apiKey.trim()) {
      throw new Error('OpenAI API key is vereist. Stel deze in via de instellingen.');
    }

    setIsLoading(true);

    const userMessageContent = context?.dislikedLabel
      ? `The user's original message is: "${message}". My previous response had the label '${context.dislikedLabel}', which the user disliked. Please generate a new, alternative response. Your new response MUST have a different label than '${context.dislikedLabel}'.`
      : message;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4.1-2025-04-14',
          messages: [
            {
              role: 'system',
              content: `Je bent EvAI, een geavanceerde en empathische AI-assistent gespecialiseerd in emotionele reflectie en validatie, gebaseerd op de EvAI 5.6 rubrieken. Je doel is om gebruikers te helpen hun emoties te begrijpen en te valideren. Analyseer het bericht van de gebruiker diepgaand.

Je respons MOET een van de volgende drie categorieën ('labels') volgen:
- **Valideren**: Gebruik dit label om de emoties van de gebruiker te erkennen en te normaliseren. De 'response' moet direct de genoemde gevoelens spiegelen. Bv: 'Ik hoor dat je je X voelt, en dat is een heel begrijpelijke reactie.'
- **Reflectievraag**: Gebruik dit om de gebruiker uit te nodigen tot dieper nadenken over hun gevoelens, zonder een oplossing op te dringen. Stel een open, niet-sturende vraag. Bv: 'Wat gebeurt er precies als je die onzekerheid voelt opkomen?'
- **Suggestie**: Gebruik dit spaarzaam, en alleen als de gebruiker duidelijk vastzit. Geef een zachte, concrete tip of een ander perspectief. Bv: 'Misschien kan het helpen om de grote taak op te delen in kleinere, behapbare stapjes.'

Kies de meest passende categorie op basis van de gebruikerstekst.

Geef ALTIJD een JSON-object terug met de volgende structuur:
{
  "emotion": "De meest dominante, specifieke emotie (bijv. 'faalangst', 'onmacht', 'dankbaarheid'). Wees zo precies mogelijk.",
  "confidence": 0.8,
  "response": "Een empathische, validerende en inzichtelijke reactie in het Nederlands, passend bij het gekozen label. Geef daarna een korte reflectie die de gebruiker aan het denken zet.",
  "triggers": ["Een array van specifieke woorden of zinsdelen uit de gebruikerstekst die de emotie-detectie hebben getriggerd."],
  "meta": "Een korte metadata string, bijvoorbeeld '60m – Hoog' om de diepte van de analyse aan te duiden.",
  "label": "De gekozen categorie van de reactie ('Valideren', 'Reflectievraag', of 'Suggestie').",
  "reasoning": "Een korte, heldere uitleg waarom voor dit label en deze respons is gekozen, gebaseerd op de 'triggers'. Bijvoorbeeld: 'De gebruiker noemt 'paniek' en 'te veel', wat duidt op stress. Daarom is een validerende aanpak gekozen om dit gevoel eerst te erkennen.'"
}

Focus op nuances en de onderliggende gevoelens. De 'response' moet warm, niet-oordelend en ondersteunend zijn. De 'emotion' moet de kern van het gevoel van de gebruiker vastleggen.`
            },
            {
              role: 'user',
              content: userMessageContent
            }
          ],
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
        return emotionData;
      } catch (e) {
        console.error("Failed to parse OpenAI JSON response:", content);
        throw new Error("Kon het antwoord van de AI niet verwerken. Het was geen geldig JSON-formaat.");
      }

    } catch (err) {
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
