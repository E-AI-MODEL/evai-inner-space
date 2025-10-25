
import { useState, useCallback } from 'react';
import { ProcessingContext, UnifiedResponse } from '@/types/core';
import { useUnifiedDecisionCore, DecisionResult } from './useUnifiedDecisionCore';
import { testOpenAIApiKey } from '@/utils/apiKeyTester';
import { supabase } from '@/integrations/supabase/client';
import { OPENAI_MODEL } from '../openaiConfig';

interface ProcessingStats {
  totalRequests: number;
  averageProcessingTime: number;
  successRate: number;
  lastProcessingTime: number;
  errorCount: number;
  lastError?: string;
}

export function useProcessingOrchestrator() {
  const [stats, setStats] = useState<ProcessingStats>({
    totalRequests: 0,
    averageProcessingTime: 0,
    successRate: 100,
    lastProcessingTime: 0,
    errorCount: 0
  });

  const { makeUnifiedDecision, isProcessing, knowledgeStats } = useUnifiedDecisionCore();

  const validateApiKey = (apiKey: string): boolean => {
    if (!apiKey || !apiKey.trim()) return false;
    if (!apiKey.startsWith('sk-')) return false;
    if (apiKey.includes('demo') || apiKey.includes('test') || apiKey.includes('mock') || apiKey.includes('dev')) {
      return false;
    }
    return true;
  };

  const orchestrateProcessing = useCallback(async (
    userInput: string,
    conversationHistory: any[],
    apiKey?: string,
    apiKey2?: string
  ): Promise<UnifiedResponse> => {
    console.log('🎼 Production orchestration starting...');
    console.log('📝 User input:', userInput.substring(0, 50) + '...');
    console.log('📚 Conversation history length:', conversationHistory?.length || 0);
    console.log('📊 Current stats:', stats);
    console.log('🧠 Knowledge stats:', knowledgeStats);
    
    const startTime = Date.now();
    
    try {
      // Optional API key validation: if provided, ensure it's valid; else rely on server-side keys via Edge Functions
      if (apiKey && !validateApiKey(apiKey)) {
        throw new Error('OpenAI API key ongeldig. Verwijder of vervang in instellingen.');
      }

      if (apiKey2 && !validateApiKey(apiKey2)) {
        console.warn('⚠️ Secondary API key is invalid, continuing without it');
      }

      if (apiKey) {
        // Pre-flight API key validation
        console.log('🧪 Validating API key functionality...');
        const keyTest = await testOpenAIApiKey(apiKey);
        if (!keyTest.isValid) {
          console.error('❌ API Key validation failed:', keyTest.error);
          throw new Error(`API Key validatie mislukt: ${keyTest.error}`);
        }
        console.log('✅ API Key validation passed');
      } else {
        console.log('🔐 No client API key provided — using server-side keys via Edge Functions');
      }

      // Vector and Google API keys are server-side only (via Edge Functions)
      // No client-side keys needed anymore
      const vectorApiKey = apiKey; // Fallback for legacy compatibility
      const googleApiKey = ''; // Not used anymore
      
      console.log('🚀 Calling evai-orchestrate first...');
      try {
        const hist = (conversationHistory || []).map((m: any) => ({ role: m.role || m.from || 'user', content: String(m.content || '') }));
        const { data: orchData, error: orchErr } = await supabase.functions.invoke('evai-orchestrate', {
          body: { userInput, history: hist.slice(-10) }
        });

        if (!orchErr && (orchData as any)?.ok && (orchData as any)?.response) {
          const payload: any = orchData;
          const res = payload.response;
          const processingTime = payload?.meta?.processingTime || (Date.now() - startTime);

          setStats(prev => ({
            totalRequests: prev.totalRequests + 1,
            averageProcessingTime: (prev.averageProcessingTime * prev.totalRequests + processingTime) / (prev.totalRequests + 1),
            successRate: ((prev.successRate * prev.totalRequests + 100) / (prev.totalRequests + 1)),
            lastProcessingTime: processingTime,
            errorCount: prev.errorCount,
            lastError: undefined
          }));

          return {
            content: String(res.content || ''),
            emotion: String(res.emotion || 'neutral'),
            confidence: Math.max(0.1, Math.min(1, Number(res.confidence ?? 0.6))),
            label: (res.label || 'Valideren') as any,
            reasoning: String(res.reasoning || 'Neural orchestration'),
            symbolicInferences: Array.isArray(res.symbolicInferences) ? res.symbolicInferences : [],
            metadata: {
              processingPath: 'neural',
              totalProcessingTime: processingTime,
              componentsUsed: Array.isArray(payload?.meta?.componentsUsed) ? payload.meta.componentsUsed : ['orchestrate'],
              fallback: false,
              apiCollaboration: {
                api1Used: true,
                api2Used: false,
                vectorApiUsed: (payload?.meta?.componentsUsed || []).includes('embedding'),
                googleApiUsed: false,
                seedGenerated: false,
                secondaryAnalysis: false
              }
            }
          } as UnifiedResponse;
        }
        if (orchErr) {
          console.warn('orchestrate edge error, falling back to unified core', orchErr);
        }
      } catch (e) {
        console.warn('orchestrate call failed, continuing with unified core', e);
      }

      console.log('🧠 Calling Unified Decision Core with validated keys...');
      console.log('📊 Knowledge base status:', knowledgeStats.total > 0 ? 'Active' : 'Initializing');
      
      const decisionResult: DecisionResult | null = await makeUnifiedDecision(
        userInput,
        apiKey,
        validateApiKey(vectorApiKey) ? vectorApiKey : apiKey,
        googleApiKey,
        undefined,
        conversationHistory
      );

      if (!decisionResult) {
        console.warn('⚠️ Geen kennis-match gevonden — val terug op OpenAI via Edge Function');
        try {
          const messages = [
            { role: 'system', content: 'Je bent een empathische therapeutische AI in het Nederlands. Geef antwoord als JSON met velden: emotion, confidence, response, reasoning, label, triggers (array).' },
            { role: 'user', content: userInput }
          ];

          const { data, error } = await supabase.functions.invoke('openai-chat', {
            body: {
              model: OPENAI_MODEL,
              messages,
              temperature: 0.7,
              max_tokens: 400,
              response_format: { type: 'json_object' },
              use_secondary: false
            }
          });

          if (error) {
            console.error('❌ OpenAI fallback edge error:', error);
            throw new Error(error.message || 'OpenAI fallback mislukt');
          }

          const payload: any = data;
          if (!payload?.ok) {
            console.error('❌ OpenAI payload not ok:', payload);
            const status = payload?.status;
            const err = payload?.error || 'Onbekende fout';
            if (String(err).toLowerCase().includes('insufficient_quota')) {
              throw new Error('OpenAI-tegoed mogelijk op. Controleer je account/keys.');
            }
            throw new Error(`OpenAI fout: ${err}${status ? ` (status ${status})` : ''}`);
          }

          const content = payload.content as string;
          let parsed: any = null;
          try {
            const match = content.match(/\{[\s\S]*\}/);
            parsed = match ? JSON.parse(match[0]) : JSON.parse(content);
          } catch {
            parsed = null;
          }

          const responseText = parsed?.response || content;
          const emotion = parsed?.emotion || 'neutral';
          const confidence = Math.max(0.1, Math.min(1, parsed?.confidence ?? 0.6));
          const label = parsed?.label || 'Valideren';
          const reasoning = parsed?.reasoning || 'Neural fallback';
          const symbolicInferences = [
            `🧠 Neural fallback`,
            `🎯 Emotie: ${emotion}`,
            `📊 Vertrouwen: ${Math.round(confidence * 100)}%`
          ];

      const processingTime = Date.now() - startTime;
      console.log(`✅ Fallback completed in ${processingTime}ms`);

      // Bouw een korte grounding op basis van gesprekshistorie zodat het menselijker voelt
      const groundingNote = (() => {
        try {
          const userMsgs = (conversationHistory || [])
            .filter((h: any) => h.role === 'user')
            .map((h: any) => String(h.content))
            .filter(Boolean);
          if (userMsgs.length < 2) return '';
          const first = userMsgs[0].slice(0, 100);
          const prev = userMsgs[userMsgs.length - 2]?.slice(0, 100);
          if (!prev) return `Eerder noemde je: "${first}". Als dat nog speelt, neem ik dat mee.`;
          if (first === prev) return `Ik houd rekening met wat je eerder aangaf: "${first}".`;
          return `Eerder noemde je: "${first}" en later ook: "${prev}". Ik sluit daar graag op aan.`;
        } catch {
          return '';
        }
      })();

      // Update success stats (fallback)
      setStats(prev => ({
            totalRequests: prev.totalRequests + 1,
            averageProcessingTime: (prev.averageProcessingTime * prev.totalRequests + processingTime) / (prev.totalRequests + 1),
            successRate: ((prev.successRate * prev.totalRequests + 100) / (prev.totalRequests + 1)),
            lastProcessingTime: processingTime,
            errorCount: prev.errorCount,
            lastError: undefined
          }));

          return {
            content: responseText + (groundingNote ? `\n\n${groundingNote}` : ''),
            emotion,
            confidence,
            label,
            reasoning,
            symbolicInferences,
            metadata: {
              processingPath: 'neural',
              totalProcessingTime: processingTime,
              componentsUsed: [
                'OpenAI via Edge Functions'
              ],
              fallback: true
            }
          } as UnifiedResponse;
        } catch (fbErr) {
          console.error('🔴 Fallback ook mislukt:', fbErr);
          throw new Error(
            fbErr instanceof Error
              ? fbErr.message
              : 'Geen resultaat en fallback mislukt.'
          );
        }
      }

      const processingTime = Date.now() - startTime;
      console.log(`✅ Processing completed in ${processingTime}ms`);

      // Bouw een korte grounding op basis van gesprekshistorie zodat het menselijker voelt
      const groundingNote = (() => {
        try {
          const userMsgs = (conversationHistory || [])
            .filter((h: any) => h.role === 'user')
            .map((h: any) => String(h.content))
            .filter(Boolean);
          if (userMsgs.length < 2) return '';
          const first = userMsgs[0].slice(0, 100);
          const prev = userMsgs[userMsgs.length - 2]?.slice(0, 100);
          if (!prev) return `Eerder noemde je: "${first}". Als dat nog speelt, neem ik dat mee.`;
          if (first === prev) return `Ik houd rekening met wat je eerder aangaf: "${first}".`;
          return `Eerder noemde je: "${first}" en later ook: "${prev}". Ik sluit daar graag op aan.`;
        } catch {
          return '';
        }
      })();

      // Update success stats
      setStats(prev => ({
        totalRequests: prev.totalRequests + 1,
        averageProcessingTime: (prev.averageProcessingTime * prev.totalRequests + processingTime) / (prev.totalRequests + 1),
        successRate: ((prev.successRate * prev.totalRequests + 100) / (prev.totalRequests + 1)),
        lastProcessingTime: processingTime,
        errorCount: prev.errorCount,
        lastError: undefined
      }));

      return {
        content: decisionResult.response + (groundingNote ? `\n\n${groundingNote}` : ''),
        emotion: decisionResult.emotion,
        confidence: decisionResult.confidence,
        label: decisionResult.label,
        reasoning: decisionResult.reasoning,
        symbolicInferences: decisionResult.symbolicInferences,
        metadata: {
          processingPath: 'hybrid',
          totalProcessingTime: processingTime,
          componentsUsed: [
            `Unified Core (${decisionResult.sources.length} sources)`,
            `Knowledge Base: ${knowledgeStats.total} items`,
            'OpenAI via Edge Functions'
          ],
          fallback: false,
          apiCollaboration: {
            api1Used: !!apiKey,
            api2Used: !!apiKey2 && validateApiKey(apiKey2),
            vectorApiUsed: !!vectorApiKey && validateApiKey(vectorApiKey),
            googleApiUsed: !!googleApiKey,
            seedGenerated: false,
            secondaryAnalysis: false
          }
        }
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      console.error('🔴 Production orchestration error:', error);
      console.error('   Processing time before error:', processingTime + 'ms');
      console.error('   Error type:', error instanceof Error ? error.constructor.name : typeof error);

      // Update error stats
      setStats(prev => ({
        totalRequests: prev.totalRequests + 1,
        averageProcessingTime: (prev.averageProcessingTime * prev.totalRequests + processingTime) / (prev.totalRequests + 1),
        successRate: ((prev.successRate * prev.totalRequests + 0) / (prev.totalRequests + 1)),
        lastProcessingTime: processingTime,
        errorCount: prev.errorCount + 1,
        lastError: errorMessage
      }));

      // Enhanced error handling for production
      if (errorMessage.includes('API key') || errorMessage.includes('401')) {
        throw new Error('API key probleem gedetecteerd. Controleer je OpenAI API key in de instellingen en zorg dat het een echte (geen mock) key is.');
      } else if (errorMessage.includes('rate limit') || errorMessage.includes('429')) {
        throw new Error('API limiet bereikt. Probeer het over een paar minuten opnieuw.');
      } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
        throw new Error('Netwerkfout. Controleer je internetverbinding en probeer opnieuw.');
      } else {
        throw new Error(`Er ging iets mis tijdens de verwerking: ${errorMessage}`);
      }
    }
  }, [makeUnifiedDecision, knowledgeStats]);

  return {
    orchestrateProcessing,
    isProcessing,
    stats,
    knowledgeStats
  };
}
