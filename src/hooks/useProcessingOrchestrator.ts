import { useState, useCallback } from 'react';
import { ProcessingContext, UnifiedResponse } from '@/types/core';
import { useUnifiedDecisionCore, DecisionResult } from './useUnifiedDecisionCore';
import { testOpenAIApiKey } from '@/utils/apiKeyTester';
import { supabase } from '@/integrations/supabase/client';
import { OPENAI_MODEL } from '../openaiConfig';
import { useOpenAISecondary } from './useOpenAISecondary';
import { checkPromptSafety } from '@/lib/safetyGuard';
import { toast } from 'sonner';

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
  const { createStrategicBriefing, isAnalyzing } = useOpenAISecondary();

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
    apiKey?: string
  ): Promise<UnifiedResponse> => {
    console.log('🎼 Production orchestration starting...');
    console.log('📝 User input:', userInput.substring(0, 50) + '...');
    console.log('📚 Conversation history length:', conversationHistory?.length || 0);
    console.log('📊 Current stats:', stats);
    console.log('🧠 Knowledge stats:', knowledgeStats);
    
    const startTime = Date.now();
    
    try {
      // 🛡️ VEILIGHEIDSLAG: Pre-response harm detection
      console.log('🛡️ Safety check: Analyzing user input...');
      const safetyResult = await checkPromptSafety(userInput);
      
      if (safetyResult.decision === 'block') {
        console.warn('🚫 Safety check BLOCKED input:', safetyResult.flags);
        toast.error('Input geblokkeerd om veiligheidsredenen', {
          description: 'Je bericht bevat mogelijk schadelijke inhoud. Probeer het anders te formuleren.'
        });
        throw new Error('Input geblokkeerd vanwege veiligheidsredenen');
      }
      
      if (safetyResult.decision === 'review') {
        console.warn('⚠️ Safety check flagged for REVIEW:', safetyResult.flags);
        toast.warning('Let op: gevoelige inhoud gedetecteerd', {
          description: 'We verwerken je bericht, maar houd rekening met gevoeligheid.'
        });
      } else {
        console.log('✅ Safety check PASSED');
      }

      // Optional API key validation: if provided, ensure it's valid; else rely on server-side keys via Edge Functions
      if (apiKey && !validateApiKey(apiKey)) {
        throw new Error('OpenAI API key ongeldig. Verwijder of vervang in instellingen.');
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

      // 🎭 STAP 1: Creëer Strategic Briefing (Regisseur)
      let strategicBriefing = null;
      if (conversationHistory.length >= 2) {
        console.log('🎭 Regisseur: Creating Strategic Briefing...');
        try {
          strategicBriefing = await createStrategicBriefing(
            userInput,
            [],
            null,
            apiKey || ''
          );
          if (strategicBriefing) {
            console.log('✅ Strategic Briefing:', strategicBriefing.goal);
            console.log('📝 Key points:', strategicBriefing.keyPoints);
          }
        } catch (briefingError) {
          console.warn('⚠️ Strategic briefing failed, continuing without:', briefingError);
        }
      }

      // 🧠 STAP 2: Neurosymbolisch v3.0 - Direct naar Unified Decision Core
      const vectorApiKey = apiKey;
      const googleApiKey = '';
      
      console.log('🧠 NEUROSYMBOLISCH: Direct naar Unified Decision Core v3.0...');
      console.log('📊 Knowledge base status:', knowledgeStats.total > 0 ? 'Active' : 'Initializing');
      if (strategicBriefing) {
        console.log('🎯 Strategic goal:', strategicBriefing.goal);
      }
      
      const decisionResult: DecisionResult | null = await makeUnifiedDecision(
        userInput,
        apiKey,
        validateApiKey(vectorApiKey) ? vectorApiKey : apiKey,
        googleApiKey,
        strategicBriefing,
        conversationHistory
      );

      if (!decisionResult) {
        console.warn('⚠️ Geen kennis-match gevonden — val terug op OpenAI via Edge Function');
        try {
          // Neem laatste 6 berichten uit conversation history voor context
          const recentHistory = (conversationHistory || [])
            .slice(-6)
            .map(h => ({
              role: h.role,
              content: h.content
            }));

          const messages = [
            { 
              role: 'system', 
              content: `Je bent een warm, empathische gesprekspartner die mensen helpt hun gevoelens te verkennen.

GESPREKSFLOW:
- Stel 1-2 open, nieuwsgierige vragen om dieper te gaan
- Valideer gevoelens authentiek ("Dat klinkt zwaar" i.p.v. formele analyses)  
- Bied concrete handvatten alleen als iemand vastloopt
- Volg de energie van het gesprek - dwing geen richting

TONE:
- Gebruik "je" en korte zinnen
- Wees nieuwsgierig, niet instructief
- Reflecteer emoties zonder ze te herhalen

OUTPUT (JSON):
{
  "emotion": "primaire emotie (verdriet/angst/woede/vreugde/stress/onzekerheid/hoop/eenzaamheid/schuld)",
  "confidence": 0.0-1.0,
  "response": "natuurlijk, warm antwoord met 1-2 vragen",
  "reasoning": "korte onderbouwing van emotie",
  "label": "Valideren/Reflectievraag/Suggestie/Interventie",
  "triggers": ["keyword1", "keyword2"]
}` 
            },
            ...recentHistory,
            { role: 'user', content: userInput }
          ];

          const { data, error } = await supabase.functions.invoke('evai-core', {
            body: {
              operation: 'chat',
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
          const reasoning = parsed?.reasoning || 'OpenAI Fallback (geen knowledge match)';
          const symbolicInferences = [
            `🤖 OpenAI Fallback (GPT-4o-mini)`,
            `📚 Knowledge Base: geen match gevonden`,
            strategicBriefing ? `🎭 Regisseur actief: ${strategicBriefing.goal}` : null,
            `🎯 Emotie: ${emotion}`,
            `📊 Vertrouwen: ${Math.round(confidence * 100)}%`
          ].filter(Boolean) as string[];

      const processingTime = Date.now() - startTime;
      console.log(`✅ Fallback completed in ${processingTime}ms`);

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
            content: responseText,
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
              fallback: true,
              apiCollaboration: {
                api1Used: !!apiKey,
                api2Used: false,
                vectorApiUsed: false,
                googleApiUsed: false,
                seedGenerated: false,
                secondaryAnalysis: !!strategicBriefing
              }
            }
          } as UnifiedResponse;
        } catch (fbErr) {
          console.error('🔴 Fallback ook mislukt:', fbErr);
          
          // Log error naar database
          try {
            await supabase.rpc('log_evai_workflow', {
              p_conversation_id: sessionStorage.getItem('evai-current-session-id') || 'unknown',
              p_workflow_type: 'orchestrate-fallback-failed',
              p_api_collaboration: {
                api1Used: false,
                api2Used: false,
                vectorApiUsed: false,
                googleApiUsed: false,
                seedGenerated: false,
                secondaryAnalysis: false
              },
              p_rubrics_data: null,
              p_processing_time: Date.now() - startTime,
              p_success: false,
              p_error_details: {
                error: fbErr instanceof Error ? fbErr.message : 'Unknown error',
                stack: fbErr instanceof Error ? fbErr.stack : undefined,
                timestamp: new Date().toISOString()
              }
            });
          } catch (logError) {
            console.error('Failed to log error to database:', logError);
          }
          
          throw new Error(
            fbErr instanceof Error
              ? fbErr.message
              : 'Geen resultaat en fallback mislukt.'
          );
        }
      }

      const processingTime = Date.now() - startTime;
      console.log(`✅ Processing completed in ${processingTime}ms`);

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
        content: decisionResult.response,
        emotion: decisionResult.emotion,
        confidence: decisionResult.confidence,
        label: decisionResult.label,
        reasoning: decisionResult.reasoning,
        symbolicInferences: decisionResult.symbolicInferences,
        metadata: {
          processingPath: 'hybrid',
          totalProcessingTime: processingTime,
          componentsUsed: [
            `🧠 Neurosymbolisch v3.0`,
            `Unified Core (${decisionResult.sources.length} sources)`,
            `Knowledge Base: ${knowledgeStats.total} items`,
            `Browser ML Engine (WebGPU/WASM)`,
            'Edge Functions'
          ],
          fallback: false,
          apiCollaboration: {
            api1Used: !!apiKey,
            api2Used: false, // Removed - no longer exists
            vectorApiUsed: !!vectorApiKey && validateApiKey(vectorApiKey),
            googleApiUsed: false,
            seedGenerated: false,
            secondaryAnalysis: !!strategicBriefing
          }
        }
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      console.error('🔴 Production orchestration error:', error);
      console.error('   Processing time before error:', processingTime + 'ms');
      console.error('   Error type:', error instanceof Error ? error.constructor.name : typeof error);

      // Log error naar database
      try {
        await supabase.rpc('log_evai_workflow', {
          p_conversation_id: sessionStorage.getItem('evai-current-session-id') || 'unknown',
          p_workflow_type: 'orchestrate-error',
          p_api_collaboration: {
            api1Used: false,
            api2Used: false,
            vectorApiUsed: false,
            googleApiUsed: false,
            seedGenerated: false,
            secondaryAnalysis: false
          },
          p_rubrics_data: null,
          p_processing_time: processingTime,
          p_success: false,
          p_error_details: {
            error: errorMessage,
            stack: error instanceof Error ? error.stack : undefined,
            timestamp: new Date().toISOString()
          }
        });
      } catch (logError) {
        console.error('Failed to log error to database:', logError);
      }

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
