import { useState } from "react";
import { Message, ChatHistoryItem } from "../types";
import { getLabelVisuals } from "../lib/emotion-visuals";
import { useOpenAI } from "./useOpenAI";

export function useOrchestratedAiResponse(
  messages: Message[],
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  apiKey: string
) {
  const [isGenerating, setIsGenerating] = useState(false);
  const { detectEmotion } = useOpenAI();

  const generateAiResponse = async (userMessage: Message) => {
    setIsGenerating(true);
    const history: ChatHistoryItem[] = messages.map(m => ({
      role: m.from === 'user' ? 'user' : 'assistant',
      content: m.content
    }));

    try {
      // Phase 1: analysis
      const analysis = await detectEmotion(userMessage.content, apiKey, {}, history);

      // Phase 2: strategy selection
      const label: "Valideren" | "Reflectievraag" | "Suggestie" =
        analysis.label || "Valideren";

      // Phase 3: prompt generation
      const prompt = `Schrijf een ${label === "Reflectievraag" ? "open vraag" : label === "Suggestie" ? "korte suggestie" : "validerende reactie"} in het Nederlands gebaseerd op emotie "${analysis.emotion}". Antwoord op het bericht zonder verdere uitleg:\n"${userMessage.content}"`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4.1-2025-04-14',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 200
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI error: ${response.status}`);
      }

      const data = await response.json();
      const finalContent = data.choices?.[0]?.message?.content?.trim() || "";

      // Phase 4: packaging
      const aiMessage: Message = {
        id: `ai-orchestrated-${Date.now()}`,
        from: 'ai',
        label,
        accentColor: getLabelVisuals(label).accentColor,
        content: finalContent,
        emotionSeed: analysis.emotion,
        animate: true,
        timestamp: new Date(),
        replyTo: userMessage.id,
        feedback: null,
        meta: JSON.stringify({ analysis }),
        explainText: analysis.reasoning,
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Onbekende fout';
      const errorResponse: Message = {
        id: `ai-orchestrated-error-${Date.now()}`,
        from: 'ai',
        label: 'Fout',
        content: errorMessage,
        emotionSeed: null,
        animate: true,
        timestamp: new Date(),
        accentColor: getLabelVisuals('Fout').accentColor,
        feedback: null
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsGenerating(false);
    }
  };

  return { generateAiResponse, isGenerating };
}
