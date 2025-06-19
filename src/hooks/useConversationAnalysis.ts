
import { useState } from 'react';
import type { Message } from '../types';
import { ConversationAnalysisResult, OpenAISeedGeneratorConfig } from '../types/openAISeedGenerator';

const DEFAULT_CONFIG: Partial<OpenAISeedGeneratorConfig> = {
  model: 'gpt-4.1-2025-04-14',
  temperature: 0.5,
  maxTokens: 200
};

export function useConversationAnalysis() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeConversationForSeeds = async (
    messages: Message[],
    apiKey: string,
    config: Partial<OpenAISeedGeneratorConfig> = {}
  ): Promise<string[]> => {
    if (!apiKey || !apiKey.trim()) return [];

    setIsAnalyzing(true);
    console.log('🔍 Analyzing conversation for missing seeds...');

    const finalConfig = { ...DEFAULT_CONFIG, ...config };

    try {
      const conversationText = extractUserMessages(messages);
      const prompt = buildAnalysisPrompt(conversationText);
      const response = await callOpenAIForAnalysis(prompt, apiKey, finalConfig);

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      try {
        const emotions = JSON.parse(content);
        console.log('✅ Found missing emotions:', emotions);
        return Array.isArray(emotions) ? emotions : [];
      } catch (parseError) {
        console.error('Failed to parse emotions analysis:', parseError);
        return [];
      }

    } catch (error) {
      console.error('🔴 Conversation analysis error:', error);
      return [];
    } finally {
      setIsAnalyzing(false);
    }
  };

  const extractUserMessages = (messages: Message[]): string => {
    return messages
      .filter(m => m.from === 'user')
      .map(m => m.content)
      .slice(-5) // Last 5 messages
      .join('\n');
  };

  const buildAnalysisPrompt = (conversationText: string): string => {
    return `Analyseer deze therapeutische conversatie en identificeer emoties waar nog geen seeds voor bestaan:

Conversatie:
${conversationText}

Geef een JSON array terug met emoties die vaak voorkomen maar mogelijk nog geen seeds hebben:
["emotie1", "emotie2", "emotie3"]

Focus op Nederlandse emoties die therapeutisch relevant zijn.`;
  };

  const callOpenAIForAnalysis = async (
    prompt: string,
    apiKey: string,
    config: Partial<OpenAISeedGeneratorConfig>
  ): Promise<Response> => {
    return fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          {
            role: 'system',
            content: 'Je bent een expert in conversatie analyse voor therapeutische AI. Geef alleen JSON arrays terug.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: config.temperature,
        max_tokens: config.maxTokens,
      }),
    });
  };

  return {
    analyzeConversationForSeeds,
    isAnalyzing
  };
}
