import { useState, useCallback } from 'react';
import { ProcessingContext, UnifiedResponse } from '@/types/core';
import { useUnifiedDecisionCore, DecisionResult } from './useUnifiedDecisionCore';
import { testOpenAIApiKey } from '@/utils/apiKeyTester';
import { supabase } from '@/integrations/supabase/client';
import { OPENAI_MODEL } from '../openaiConfig';
import { useEnhancedEvAI56Rubrics } from './useEnhancedEvAI56Rubrics';
import { runConditionalSecondaryAnalysis } from './useSecondaryAnalysisRunner';
import { useBriefingCache } from './useBriefingCache';
import { checkPromptSafety } from '@/lib/safetyGuard';
import { toast } from 'sonner';
import { orchestrate, OrchestrationContext } from '@/orchestrator/hybrid';
import { getGraphStats } from '@/semantics/graph';

interface ProcessingStats {
  totalRequests: number;
  averageProcessingTime: number;
  successRate: number;
  lastProcessingTime: number;
  errorCount: number;
  lastError?: string;
  neurosymbolicRate: number; // % of requests that used true neurosymbolic reasoning (not fallback)
  successfulKnowledgeMatches: number;
}

export function useProcessingOrchestrator() {
  const [stats, setStats] = useState<ProcessingStats>({
    totalRequests: 0,
    averageProcessingTime: 0,
    successRate: 100,
    lastProcessingTime: 0,
    errorCount: 0,
    neurosymbolicRate: 0,
    successfulKnowledgeMatches: 0
  });
  const [lastConfidence, setLastConfidence] = useState<number>(1.0);

  const { makeUnifiedDecision, isProcessing, knowledgeStats } = useUnifiedDecisionCore();
  const { performEnhancedAssessment } = useEnhancedEvAI56Rubrics();
  const { getCached, setCached } = useBriefingCache();

  const validateApiKey = (apiKey: string): boolean => {
    if (!apiKey || !apiKey.trim()) return false;
    if (!apiKey.startsWith('sk-')) return false;
    if (apiKey.includes('demo') || apiKey.includes('test') || apiKey.includes('mock') || apiKey.includes('dev')) {
      return false;
    }
    return true;
  };

  console.log('🧠 EvAI v16 NEUROSYMBOLISCH initialized');
  console.log('📊 Semantic Graph Stats:', getGraphStats());

  const orchestrateProcessing = useCallback(async (
    userInput: string,
    conversationHistory: any[],
    apiKey?: string
  ): Promise<UnifiedResponse> => {
    console.log('🎼 Orchestrator v16 NEUROSYMBOLISCH: Policy + Semantic + Validation');
    console.log('📝 User input:', userInput.substring(0, 50) + '...');
    console.log('📚 Conversation history length:', conversationHistory?.length || 0);
    
    const startTime = Date.now();
    
    try {
      // 🛡️ VEILIGHEIDSLAG: Pre-response harm detection (altijd doen)
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

      // 🎯 REGISSEUR BESLISSING 1: Is dit een simpele greeting? -> Fast-path! (VÓÓr rubrics!)
      const isSimpleGreeting = /^(hi|hallo|hey|hoi|dag|hello|yo|hé|hee|sup|hiya|ok|oké|ja|nee|hmm)[\s!?.]*$/i.test(userInput.trim());
      
      if (isSimpleGreeting) {
        console.log('⚡ FAST-PATH: Simpele greeting, skip Rubrics + hele pipeline');
        const fastGreetings = [
          'Hoi! Hoe kan ik je helpen?',
          'Hey! Vertel, waar loop je tegenaan?',
          'Hallo! Fijn dat je er bent. Wat wil je delen?'
        ];
        const response = fastGreetings[Math.floor(Math.random() * fastGreetings.length)];
        
        const processingTime = Date.now() - startTime;
        
        setStats(prev => ({
          totalRequests: prev.totalRequests + 1,
          averageProcessingTime: (prev.averageProcessingTime * prev.totalRequests + processingTime) / (prev.totalRequests + 1),
          successRate: ((prev.successRate * prev.totalRequests + 100) / (prev.totalRequests + 1)),
          lastProcessingTime: processingTime,
          errorCount: prev.errorCount,
          neurosymbolicRate: ((prev.neurosymbolicRate * prev.totalRequests + 100) / (prev.totalRequests + 1)),
          successfulKnowledgeMatches: prev.successfulKnowledgeMatches
        }));

        return {
          content: response,
          emotion: 'neutraal',
          confidence: 0.95,
          label: 'Valideren',
          reasoning: 'Fast-path: Skip Rubrics Assessment voor simpele greeting',
          symbolicInferences: ['⚡ Fast-path', '✅ Bypassed: Rubrics, Orchestrator, Knowledge matching'],
          metadata: {
            processingPath: 'symbolic',
            totalProcessingTime: processingTime,
            componentsUsed: ['Fast-path greeting detector'],
            apiCollaboration: {
              api1Used: false,
              api2Used: false,
              vectorApiUsed: false,
              googleApiUsed: false,
              seedGenerated: false,
              secondaryAnalysis: false
            }
          }
        };
      }

      // 📊 RUBRICS ASSESSMENT (EvAI 5.6) - Alleen voor niet-greetings
      console.log('📊 Rubrics Assessment: Analyzing conversation context...');
      const sessionId = sessionStorage.getItem('evai-current-session-id') || 'unknown';
      const rubricResult = await performEnhancedAssessment(
        userInput,
        sessionId,
        'balanced'
      );
      
      console.log('📊 Rubrics result:', {
        risk: rubricResult.overallRisk,
        protective: rubricResult.overallProtective,
        pattern: rubricResult.dominantPattern
      });
      
      // 🎯 REGISSEUR BESLISSING 2: Is dit gesprek complex genoeg voor Strategic Briefing?
      const inputComplexity = userInput.trim().length;
      const conversationDepth = conversationHistory?.length || 0;
      const needsDeepAnalysis = inputComplexity > 20 || conversationDepth > 3 || rubricResult.overallRisk > 40;
      
      console.log('🎭 Regisseur evaluatie:', {
        complexity: inputComplexity,
        depth: conversationDepth,
        risk: rubricResult.overallRisk,
        needsDeepAnalysis
      });

      // 🎯 CONDITIONAL STRATEGIC BRIEFING - alleen bij complexe gesprekken
      let briefing = null;
      if (needsDeepAnalysis) {
        const cachedBriefing = getCached(sessionId);
        briefing = cachedBriefing;
        
        if (!cachedBriefing) {
          console.log('🎯 Regisseur besluit: Strategic Briefing nodig voor complex gesprek');
          briefing = await runConditionalSecondaryAnalysis(
            userInput,
            conversationHistory,
            rubricResult,
            lastConfidence
          );
          
          if (briefing) {
            setCached(sessionId, briefing);
            console.log('✅ Strategic Briefing created and cached');
          }
        }
      } else {
        console.log('⏭️ Regisseur besluit: Simpel gesprek, Strategic Briefing overgeslagen');
      }

      // 🧠 Neurosymbolisch v16 - Hybrid Orchestrator (Policy + Semantic + Validation)
      const vectorApiKey = apiKey;
      
      console.log('🧠 NEUROSYMBOLISCH v16: Starting Hybrid Orchestrator...');
      console.log('📊 Knowledge base status:', knowledgeStats.total > 0 ? 'Active' : 'Initializing');
      
      // First, try unified decision for seed matching
      const decisionResult: DecisionResult | null = await makeUnifiedDecision(
        userInput,
        apiKey,
        validateApiKey(vectorApiKey) ? vectorApiKey : apiKey,
        briefing, // Strategic briefing (conditionally created)
        conversationHistory
      );

      // 🎯 V16: If high confidence match, route through hybrid orchestrator for validation
      let finalResult: UnifiedResponse | null = null;
      
      if (decisionResult && decisionResult.confidence > 0.70) {
        console.log('✅ High confidence decision (>70%), routing through Hybrid Orchestrator v16...');
        
        try {
          console.log('🎯 High confidence decision, invoking hybrid orchestrator...');
          console.log('📊 Decision details:', {
            emotion: decisionResult.emotion,
            confidence: decisionResult.confidence,
            sources: decisionResult.sources?.length || 0,
            firstSourceId: decisionResult.sources[0]?.id
          });
          
          const orchestrationCtx: OrchestrationContext = {
            userInput,
            rubric: {
              crisis: rubricResult?.overallRisk || 0,
              distress: rubricResult?.overallRisk || 0,
              support: rubricResult?.overallProtective || 0,
              coping: 100 - (rubricResult?.overallRisk || 0),
              overallRisk: rubricResult?.overallRisk || 0,
              overallProtective: rubricResult?.overallProtective || 0,
              dominantPattern: rubricResult?.dominantPattern || 'unknown'
            },
            seed: {
              matchScore: decisionResult.confidence,
              templateId: decisionResult.sources[0]?.id,
              emotion: decisionResult.emotion,
              response: decisionResult.response
            },
            consent: true,
            conversationHistory,
            topEmotion: decisionResult.emotion
          };

          console.log('🎼 Calling orchestrate with seed:', {
            templateId: orchestrationCtx.seed.templateId,
            hasResponse: !!orchestrationCtx.seed.response
          });

          const hybridResult = await orchestrate(orchestrationCtx);
          
          console.log('✅ Orchestrate completed:', {
            validated: hybridResult.metadata.validated,
            constraintsOK: hybridResult.metadata.constraintsOK,
            processingPath: hybridResult.metadata.processingPath,
            hasAnswer: !!hybridResult.answer
          });
          
          // Only use hybrid result if validation passed
          if (hybridResult.metadata.validated && hybridResult.metadata.constraintsOK) {
            console.log('✅ Hybrid orchestration VALIDATED and PASSED constraints');
            
            finalResult = {
              content: hybridResult.answer,
              emotion: hybridResult.emotion,
              confidence: hybridResult.confidence,
              label: hybridResult.label as any,
              reasoning: hybridResult.reasoning,
              symbolicInferences: [
                `🧠 EvAI v16 NEUROSYMBOLISCH`,
                `📋 Policy: ${hybridResult.metadata.policyDecision}`,
                `🎯 Rule: ${hybridResult.metadata.ruleId}`,
                `💡 Semantic Interventions: ${hybridResult.metadata.semanticInterventions.join(', ')}`,
                `✅ Validation: PASSED`,
                `🛡️ Constraints: OK`,
                ...decisionResult.symbolicInferences.slice(0, 3)
              ],
              secondaryInsights: hybridResult.metadata.auditLog.slice(0, 5),
              metadata: {
                processingPath: 'hybrid',
                totalProcessingTime: Date.now() - startTime,
                componentsUsed: [
                  '🎯 Policy Engine v16',
                  '💡 Semantic Graph',
                  '🛡️ Validation Layer',
                  `Knowledge Base (${knowledgeStats.total} items)`,
                  ...(briefing ? ['Strategic Briefing'] : [])
                ],
                fallback: false,
                apiCollaboration: {
                  api1Used: true,
                  api2Used: !!briefing,
                  vectorApiUsed: !!vectorApiKey,
                  googleApiUsed: false,
                  seedGenerated: false,
                  secondaryAnalysis: !!briefing
                }
              }
            };
          } else {
            console.warn('⚠️ Hybrid orchestration validation FAILED, falling back to unified decision');
            console.warn('  Validated:', hybridResult.metadata.validated);
            console.warn('  Constraints OK:', hybridResult.metadata.constraintsOK);
            console.warn('  Audit log:', hybridResult.metadata.auditLog.slice(-3));
          }
        } catch (hybridError) {
          console.error('❌ HYBRID ORCHESTRATION ERROR - falling back to unified decision');
          console.error('  Error type:', hybridError instanceof Error ? 'Error' : typeof hybridError);
          console.error('  Message:', hybridError instanceof Error ? hybridError.message : String(hybridError));
          console.error('  Stack:', hybridError instanceof Error ? hybridError.stack : 'No stack trace');
        }
      } else {
        console.log('⏭️ Low confidence or no decision, skipping hybrid orchestrator');
        console.log('  Confidence:', decisionResult?.confidence || 0);
      }

      // If hybrid orchestrator produced a result, use it
      if (finalResult) {
        const processingTime = Date.now() - startTime;
        console.log(`✅ Hybrid orchestration completed in ${processingTime}ms`);
        
        setLastConfidence(finalResult.confidence);
        setStats(prev => {
          const newTotalRequests = prev.totalRequests + 1;
          const newSuccessfulMatches = prev.successfulKnowledgeMatches + 1;
          return {
            totalRequests: newTotalRequests,
            averageProcessingTime: (prev.averageProcessingTime * prev.totalRequests + processingTime) / newTotalRequests,
            successRate: ((prev.successRate * prev.totalRequests + 100) / newTotalRequests),
            lastProcessingTime: processingTime,
            errorCount: prev.errorCount,
            lastError: undefined,
            successfulKnowledgeMatches: newSuccessfulMatches,
            neurosymbolicRate: (newSuccessfulMatches / newTotalRequests) * 100
          };
        });
        
        return finalResult;
      }

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
              content: `Je bent een empathische gesprekspartner. Geef KORTE (max 2 zinnen), to-the-point responses.

BELANGRIJKSTE REGELS:
- Max 2 korte zinnen
- GEEN lange uitleg of vragen
- Valideer het gevoel simpel en direct
- Gebruik "je" en natuurlijke taal

OUTPUT (JSON):
{
  "emotion": "primaire emotie (verdriet/angst/woede/blijdschap/stress/onzekerheid/hoop/eenzaamheid)",
  "confidence": 0.0-1.0,
  "response": "korte, directe validatie (MAX 2 zinnen!)",
  "reasoning": "korte emotie detectie",
  "label": "Valideren/Reflectievraag/Suggestie",
  "triggers": ["keyword1", "keyword2"]
}

VOORBEELDEN GOEDE RESPONSES:
- "Dat klinkt zwaar. Ik begrijp dat je je zo voelt."
- "Ik hoor frustratie. Wat vervelend voor je."
- "Dat is fijn om te horen! Geniet ervan."` 
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
            `⚠️ FALLBACK MODUS: Knowledge Base ${knowledgeStats.total === 0 ? 'leeg' : 'geen match'}`,
            `🤖 Direct OpenAI call (GPT-4o-mini)`,
            `📚 Unified Knowledge: ${knowledgeStats.total} items (0 matches)`,
            `❌ Geen neurosymbolic reasoning toegepast`,
            `🎯 Emotie: ${emotion}`,
            `📊 Vertrouwen: ${Math.round(confidence * 100)}%`
          ].filter(Boolean) as string[];

      const processingTime = Date.now() - startTime;
      console.log(`✅ Fallback completed in ${processingTime}ms`);

      // Update success stats (fallback)
      setStats(prev => {
        const newTotalRequests = prev.totalRequests + 1;
        return {
          totalRequests: newTotalRequests,
          averageProcessingTime: (prev.averageProcessingTime * prev.totalRequests + processingTime) / newTotalRequests,
          successRate: ((prev.successRate * prev.totalRequests + 100) / newTotalRequests),
          lastProcessingTime: processingTime,
          errorCount: prev.errorCount,
          lastError: undefined,
          successfulKnowledgeMatches: prev.successfulKnowledgeMatches, // No match in fallback
          neurosymbolicRate: (prev.successfulKnowledgeMatches / newTotalRequests) * 100
        };
      });

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
                seedGenerated: false,
                secondaryAnalysis: false
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

      // Store confidence for next iteration
      setLastConfidence(decisionResult.confidence);

      // Update success stats (neurosymbolic match!)
      setStats(prev => {
        const newTotalRequests = prev.totalRequests + 1;
        const newSuccessfulMatches = prev.successfulKnowledgeMatches + 1;
        return {
          totalRequests: newTotalRequests,
          averageProcessingTime: (prev.averageProcessingTime * prev.totalRequests + processingTime) / newTotalRequests,
          successRate: ((prev.successRate * prev.totalRequests + 100) / newTotalRequests),
          lastProcessingTime: processingTime,
          errorCount: prev.errorCount,
          lastError: undefined,
          successfulKnowledgeMatches: newSuccessfulMatches,
          neurosymbolicRate: (newSuccessfulMatches / newTotalRequests) * 100
        };
      });

      return {
        content: decisionResult.response,
        emotion: decisionResult.emotion,
        confidence: decisionResult.confidence,
        label: decisionResult.label,
        reasoning: decisionResult.reasoning,
        symbolicInferences: [
          ...decisionResult.symbolicInferences,
          ...(briefing ? [`🎯 Strategic Briefing: ${briefing.goal}`] : []),
          `📊 Rubrics Risk: ${rubricResult.overallRisk}%`,
          `🛡️ Rubrics Protection: ${rubricResult.overallProtective}%`,
          `🎭 Dominant Pattern: ${rubricResult.dominantPattern}`
        ],
        metadata: {
          processingPath: 'hybrid',
          totalProcessingTime: processingTime,
              componentsUsed: [
                `🧠 Neurosymbolisch v3.0`,
                `Unified Core (${decisionResult.sources.length} sources)`,
                `Knowledge Base: ${knowledgeStats.total} items`,
                `Browser ML Engine (WebGPU/WASM)`,
                ...(briefing ? ['🎯 Strategic Briefing (conditional)'] : []),
                `📊 Rubrics Assessment (EvAI 5.6)`,
                'Edge Functions'
              ],
              fallback: false,
              apiCollaboration: {
                api1Used: !!apiKey,
                api2Used: !!briefing,
                vectorApiUsed: !!vectorApiKey && validateApiKey(vectorApiKey),
                googleApiUsed: false,
                seedGenerated: false,
                secondaryAnalysis: !!briefing
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
      setStats(prev => {
        const newTotalRequests = prev.totalRequests + 1;
        return {
          totalRequests: newTotalRequests,
          averageProcessingTime: (prev.averageProcessingTime * prev.totalRequests + processingTime) / newTotalRequests,
          successRate: ((prev.successRate * prev.totalRequests + 0) / newTotalRequests),
          lastProcessingTime: processingTime,
          errorCount: prev.errorCount + 1,
          lastError: errorMessage,
          successfulKnowledgeMatches: prev.successfulKnowledgeMatches,
          neurosymbolicRate: (prev.successfulKnowledgeMatches / newTotalRequests) * 100
        };
      });

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
