
import { useState } from 'react';
import { OPENAI_MODEL } from '../openaiConfig';
import type { StrategicBriefing } from '../types';
import { incrementApiUsage } from '@/utils/apiUsageTracker';
import { supabase } from '@/integrations/supabase/client';

export function useOpenAISecondary() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const createStrategicBriefing = async (
    userInput: string,
    rubricAssessments: string[],
    seedMatch: string | null,
    apiKey: string // kept for compatibility, ignored since we now use backend
  ): Promise<StrategicBriefing | null> => {
    console.log('🎭 createStrategicBriefing CALLED');
    console.log('📝 Input length:', userInput?.length || 0);
    
    if (!userInput?.trim()) {
      console.warn('⚠️ Strategic briefing skipped: empty input');
      return null;
    }

    setIsAnalyzing(true);
    incrementApiUsage('openai2');
    
    try {
      const prompt = `Maak een strategische briefing voor een therapeutische AI op basis van de volgende gegevens:
Gebruiker input: "${userInput}"
Rubric beoordelingen: ${rubricAssessments.length ? rubricAssessments.join(', ') : 'geen'}
Seed match: ${seedMatch || 'geen'}
Geef je antwoord in JSON met de velden goal, context, keyPoints (array) en priority.`;

      console.log('📡 Calling evai-core voor Strategic Briefing...');
      
      const { data, error } = await supabase.functions.invoke('evai-core', {
        body: {
          operation: 'chat',
          model: OPENAI_MODEL,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.4,
          max_tokens: 300,
          response_format: { type: 'json_object' }
        }
      });

      console.log('📡 evai-core response:', { hasData: !!data, hasError: !!error });

      if (error) {
        console.error('🔴 Strategic briefing edge function error:', error);
        return null;
      }

      const payload = data as any;
      console.log('📦 Payload structure:', { 
        ok: payload?.ok, 
        hasContent: !!payload?.content,
        contentLength: payload?.content?.length || 0
      });

      if (!payload?.ok) {
        console.error('🔴 Edge function returned not-ok:', payload?.error || 'unknown error');
        return null;
      }

      const content = payload.content;
      if (!content) {
        console.error('🔴 Geen content ontvangen van edge function');
        return null;
      }

      console.log('📄 Raw content:', content.substring(0, 200));
      
      const briefing = JSON.parse(content) as StrategicBriefing;
      if (!Array.isArray(briefing.keyPoints)) briefing.keyPoints = [];
      
      console.log('✅ Strategic Briefing parsed:', {
        goal: briefing.goal,
        keyPointsCount: briefing.keyPoints.length,
        priority: briefing.priority
      });
      
      return briefing;
    } catch (err) {
      console.error('🔴 Strategic briefing exception:', err);
      if (err instanceof Error) {
        console.error('   Error message:', err.message);
        console.error('   Error stack:', err.stack);
      }
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  };

  return { createStrategicBriefing, isAnalyzing };
}
