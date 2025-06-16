
import { useState, useCallback } from "react";
import { Message } from "../types";
import { toast } from "@/hooks/use-toast";

export function useAiResponseSimple(
  addMessage: (message: Message) => void,
  apiKey: string
) {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateResponse = useCallback(async (userMessage: Message) => {
    console.log('AiResponseSimple: Generating response for:', userMessage.content);
    console.log('AiResponseSimple: API key available:', !!apiKey);
    
    setIsGenerating(true);

    // Add user message immediately
    addMessage(userMessage);

    // Check API key first
    if (!apiKey || !apiKey.trim()) {
      console.log('AiResponseSimple: No API key available');
      
      const noKeyResponse: Message = {
        id: `ai-no-key-${Date.now()}`,
        from: "ai",
        label: "Configuratie",
        content: "Geen OpenAI API key gevonden. Ga naar instellingen om je API key in te stellen.",
        emotionSeed: "warning",
        animate: true,
        timestamp: new Date(),
        brilliant: false,
        replyTo: userMessage.id,
        feedback: null,
      };
      
      addMessage(noKeyResponse);
      toast({
        title: "API Key vereist",
        description: "Stel een OpenAI API key in via de instellingen.",
        variant: "destructive",
      });
      setIsGenerating(false);
      return;
    }

    try {
      // Test API connection with a simple call
      console.log('AiResponseSimple: Testing API connection...');
      
      const testResponse = await fetch('https://api.openai.com/v1/chat/completions', {
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
              content: 'Reageer kort en empathisch in het Nederlands.'
            },
            {
              role: 'user',
              content: userMessage.content
            }
          ],
          max_tokens: 150,
          temperature: 0.7,
        }),
      });

      if (!testResponse.ok) {
        let errorMessage = `API Error ${testResponse.status}`;
        
        if (testResponse.status === 401) {
          errorMessage = "Ongeldige API key. Controleer je OpenAI API key in de instellingen.";
        } else if (testResponse.status === 429) {
          errorMessage = "API rate limit bereikt. Probeer het later opnieuw.";
        } else if (testResponse.status === 500) {
          errorMessage = "OpenAI server probleem. Probeer het later opnieuw.";
        }
        
        throw new Error(errorMessage);
      }

      const data = await testResponse.json();
      const aiContent = data.choices[0]?.message?.content || "Ik kan je op dit moment niet goed verstaan.";
      
      console.log('AiResponseSimple: API response received:', aiContent);

      const aiResponse: Message = {
        id: `ai-openai-${Date.now()}`,
        from: "ai",
        label: "OpenAI",
        content: aiContent,
        explainText: "Response van OpenAI GPT-4.1",
        emotionSeed: null,
        animate: true,
        meta: "OpenAI",
        brilliant: true,
        timestamp: new Date(),
        replyTo: userMessage.id,
        feedback: null,
      };

      addMessage(aiResponse);
      
      toast({
        title: "Response ontvangen",
        description: "OpenAI heeft succesvol gereageerd.",
      });

    } catch (error) {
      console.error('AiResponseSimple: Error:', error);
      
      const errorMessage = error instanceof Error ? error.message : "Er ging iets mis bij het verwerken van je bericht.";
      
      const errorResponse: Message = {
        id: `ai-error-${Date.now()}`,
        from: "ai",
        label: "Fout",
        content: errorMessage,
        emotionSeed: "error",
        animate: true,
        timestamp: new Date(),
        brilliant: false,
        replyTo: userMessage.id,
        feedback: null,
      };
      
      addMessage(errorResponse);
      toast({
        title: "API Fout",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  }, [addMessage, apiKey]);

  return {
    generateResponse,
    isGenerating
  };
}
