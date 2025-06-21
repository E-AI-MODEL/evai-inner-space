import { useState } from "react";
import { useSeedEngine } from "./useSeedEngine";
import { useOpenAISecondary } from "./useOpenAISecondary";
import { useNeurosymbolicWorkflow } from "./useNeurosymbolicWorkflow";
import { useEvAI56Rubrics } from "./useEvAI56Rubrics";
import { toast } from "@/hooks/use-toast";
import { getLabelVisuals } from "../lib/emotion-visuals";
import { Message, ChatHistoryItem } from "../types";
import { useApiStatusManager } from "./useApiStatusManager";
import { useSecondaryAnalysisRunner } from "./useSecondaryAnalysisRunner";
import { useEmotionDetector } from "./useEmotionDetector";
import { useAiResponseCore } from "./useAiResponseCore";
import { useBackgroundReflectionTrigger } from "./useBackgroundReflectionTrigger";
import { useEnhancedApiCollaborationResponseGenerator } from "./useEnhancedApiCollaborationResponseGenerator";

interface ExtendedContext {
  dislikedLabel?: "Valideren" | "Reflectievraag" | "Suggestie";
  secondaryInsights?: string[];
  collaborationStatus?: any;
}

export function useAiResponse(
  messages: Message[],
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  apiKey: string,
  setSeedConfetti: (show: boolean) => void
) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { checkInput, isLoading: isSeedEngineLoading } = useSeedEngine();
  const { analyzeNeurosymbolic, isAnalyzing } = useOpenAISecondary();
  const { assessMessage, calculateOverallRisk, evai56Rubrics } = useEvAI56Rubrics();
  const { processInput: processNeurosymbolic, storeConversationEmbedding } = useNeurosymbolicWorkflow();
  
  const { 
    getApiConfiguration, 
    createCollaborationStatus, 
    generateApiStatusText, 
    generateCollaborationNote, 
    generateMissingApisNote 
  } = useApiStatusManager();
  
  const { runSecondaryAnalysis } = useSecondaryAnalysisRunner();
  const { detectAllEmotions } = useEmotionDetector();
  const { 
    createSuccessfulAiResponse, 
    createLimitedFunctionalityResponse, 
    createErrorResponse 
  } = useAiResponseCore();

  // ENHANCED: Background reflection system integration
  const {
    pendingReflections,
    isProcessing: isReflectionProcessing,
    consumePendingReflection,
    getNextPendingReflection
  } = useBackgroundReflectionTrigger(messages, apiKey);

  const {
    generateReflectionResponse,
    enhanceRegularResponse,
    shouldTriggerReflection
  } = useEnhancedApiCollaborationResponseGenerator();

  const generateAiResponse = async (
    userMessage: Message,
    context?: { dislikedLabel?: "Valideren" | "Reflectievraag" | "Suggestie" }
  ) => {
    setIsProcessing(true);
    
    const apiConfig = getApiConfiguration();
    const hasOpenAI = apiKey && apiKey.trim().length > 0;
    
    console.log('🚀 EvAI ENHANCED NEUROSYMBOLIC MODE WITH REFLECTION SYSTEM');
    console.log('🔑 API Configuration:', { 
      hasOpenAI, 
      hasOpenAi2: apiConfig.hasOpenAi2, 
      hasVectorAPI: apiConfig.hasVectorAPI,
      autonomous: apiConfig.isAutonomousEnabled,
      pendingReflections: pendingReflections.length 
    });

    try {
      const messageIndex = messages.findIndex(m => m.id === userMessage.id);
      const history: ChatHistoryItem[] = messages
        .slice(0, messageIndex >= 0 ? messageIndex : messages.length)
        .map(msg => ({
          role: msg.from === 'user' ? 'user' : 'assistant',
          content: msg.content
        }));

      const collaborationStatus = createCollaborationStatus(hasOpenAI, apiConfig.hasOpenAi2, apiConfig.hasVectorAPI);
      const availableApis = Object.entries(collaborationStatus).filter(([_, available]) => available).length;

      // ENHANCED: Check if we should trigger a reflection question
      // Replace findLastIndex with a compatible alternative
      let lastReflectionIndex = -1;
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].label === "Reflectievraag") {
          lastReflectionIndex = i;
          break;
        }
      }
      
      const shouldReflect = shouldTriggerReflection(
        pendingReflections,
        messages.length,
        lastReflectionIndex
      );

      if (shouldReflect && hasOpenAI) {
        console.log('🤔 TRIGGERING REFLECTION QUESTION VIA ENHANCED API COLLABORATION');
        
        const nextReflection = getNextPendingReflection();
        if (nextReflection) {
          const reflectionResponse = generateReflectionResponse(
            nextReflection,
            userMessage,
            collaborationStatus,
            availableApis
          );
          
          // Consume the reflection question
          consumePendingReflection(nextReflection.id);
          
          setMessages((prev) => [...prev, reflectionResponse]);
          
          toast({
            title: `🤔 Reflectievraag: ${nextReflection.emotion}`,
            description: `Automatisch gegenereerd na ${nextReflection.batchInfo.seedCount} verlopende seeds`,
          });

          setIsProcessing(false);
          return;
        }
      }

      // ENHANCED: Use complete neurosymbolic workflow if all keys available
      if (hasOpenAI && apiConfig.hasVectorAPI) {
        console.log('🧠 FULL NEUROSYMBOLIC WORKFLOW ACTIVATED WITH REFLECTION INTEGRATION');
        
        try {
          const neurosymbolicResult = await processNeurosymbolic(
            userMessage.content,
            apiKey,
            apiConfig.vectorApiKey!,
            {
              messages: messages,
              userId: 'current-user',
              conversationId: `conv-${Date.now()}`,
              secondaryApiKey: apiConfig.hasOpenAi2 ? apiConfig.openAiKey2 : undefined,
            }
          );

          console.log('✅ ENHANCED NEUROSYMBOLIC SUCCESS WITH REFLECTION CONTEXT:');
          console.log(`  🎯 Response Type: ${neurosymbolicResult.responseType}`);
          console.log(`  📊 Confidence: ${(neurosymbolicResult.confidence * 100).toFixed(1)}%`);
          console.log(`  🤝 API Collaboration:`, neurosymbolicResult.apiCollaboration);
          console.log(`  🤔 Pending Reflections: ${pendingReflections.length}`);

          // Store conversation embedding for future learning
          setTimeout(() => {
            storeConversationEmbedding(
              [...messages, userMessage],
              apiConfig.vectorApiKey!,
              `conv-${Date.now()}`
            ).catch(err => console.warn('⚠️ Background embedding storage failed:', err));
          }, 1000);

          setSeedConfetti(true);

          // Map response type to label with better logic
          let label: "Valideren" | "Reflectievraag" | "Suggestie";
          if (neurosymbolicResult.seed?.label === "Reflectievraag") {
            label = "Reflectievraag";
          } else if (neurosymbolicResult.seed?.label === "Suggestie") {
            label = "Suggestie";
          } else {
            label = "Valideren";
          }

          // Enhanced result display with reflection context
          const confidence = Math.round(neurosymbolicResult.confidence * 100);
          const apiStatus = neurosymbolicResult.apiCollaboration;
          
          const apiStatusText = [
            `API-1: ${apiStatus?.api1Used ? '✅' : '❌'}`,
            `API-2: ${apiStatus?.api2Used ? '✅' : '❌'}`,
            `Vector: ${apiConfig.hasVectorAPI ? '✅' : '❌'}`,
            apiStatus?.seedGenerated ? 'Nieuwe seed' : 'Bestaande seed'
          ].join(' | ');

          let aiResp: Message = {
            id: `ai-enhanced-${Date.now()}`,
            from: "ai",
            label: label,
            accentColor: getLabelVisuals(label).accentColor,
            content: neurosymbolicResult.response, // REMOVED: inline collaboration note
            explainText: `${neurosymbolicResult.reasoning} | Enhanced workflow met reflectie-integratie (${confidence}% confidence)`,
            emotionSeed: neurosymbolicResult.seed?.emotion || null,
            animate: true,
            meta: `Enhanced API + Reflectie: ${confidence}% confidence`,
            brilliant: true,
            timestamp: new Date(),
            replyTo: userMessage.id,
            feedback: null,
            symbolicInferences: [
              `🧠 Enhanced Neurosymbolic + Reflectie Engine: ${neurosymbolicResult.responseType}`,
              `🤝 API 1 (Neural): ${apiStatus?.api1Used ? '✅ Actief' : '❌ Niet gebruikt'}`,
              `🤝 API 2 (Secondary): ${apiStatus?.api2Used ? '✅ Gebruikt voor analyse' : '❌ Niet beschikbaar'}`,
              `🧬 Vector API: ✅ Actief voor embeddings`,
              `🌱 Seed Status: ${apiStatus?.seedGenerated ? '✅ Nieuwe seed gegenereerd' : '⚡ Bestaande seed gebruikt'}`,
              neurosymbolicResult.seedInjectionUsed ? '💉 Seed injectie toegepast' : '',
              `🤔 Reflectie Systeem: ${pendingReflections.length} vraag${pendingReflections.length === 1 ? '' : 'en'} gereed`,
              `⚖️ Confidence: ${confidence}% (${neurosymbolicResult.confidence > 0.8 ? 'Hoog' : neurosymbolicResult.confidence > 0.6 ? 'Gemiddeld' : 'Laag'})`,
              `⚡ Verwerking: ${neurosymbolicResult.processingTime}ms`,
              `🎯 Redenering: ${neurosymbolicResult.reasoning}`,
              // Add API status as technical detail instead of inline
              `🤝 API SAMENWERKING + REFLECTIE: ${apiStatusText} |${confidence}% confidence${neurosymbolicResult.seedInjectionUsed ? ' + Seed injectie' : ''}${pendingReflections.length > 0 ? ` | ${pendingReflections.length} reflectievragen gereed` : ''}`
            ].filter(Boolean)
          };

          // ENHANCED: Add pending reflection context to regular responses
          aiResp = enhanceRegularResponse(aiResp, pendingReflections.length > 0, pendingReflections.length);

          setMessages((prev) => [...prev, aiResp]);
          
          toast({
            title: `🚀 ENHANCED API + REFLECTIE (${confidence}%)`,
            description: `${apiStatusText} - ${pendingReflections.length} reflectievragen gereed`,
          });

          return;
        } catch (neurosymbolicError) {
          console.error('🔴 Enhanced neurosymbolic workflow failed:', neurosymbolicError);
          
          toast({
            title: "⚠️ Enhanced Neurosymbolic + Reflectie Fallback",
            description: "Schakel over naar verbeterde fallback mode",
            variant: "destructive"
          });
        }
      }

      // ENHANCED FALLBACK: Better partial API collaboration with reflection context
      console.log('🔄 ENHANCED PARTIAL API COLLABORATION WITH REFLECTION...');

      // ... keep existing code (enhanced secondary insights)
      let secondaryInsights: string[] = [];
      if (apiConfig.hasOpenAi2) {
        try {
          console.log('🧠 Running enhanced secondary analysis...');
          const contextString = history.map(h => `${h.role}: ${h.content}`).join('\n');
          const preAnalysis = await analyzeNeurosymbolic(
            userMessage.content,
            contextString,
            apiConfig.openAiKey2!
          );
          if (preAnalysis) {
            secondaryInsights = preAnalysis.insights;
            console.log(`✅ Secondary insights generated: ${secondaryInsights.length} insights`);
          }
        } catch (preErr) {
          console.error('🔴 Enhanced secondary analysis failed:', preErr);
        }
      }

      // ... keep existing code (Enhanced EvAI 5.6 Rubrics Analysis)
      console.log('📊 Enhanced EvAI 5.6 Rubrics analysis...');
      const rubricsAssessments = assessMessage(userMessage.content);
      const overallRisk = calculateOverallRisk(rubricsAssessments);
      
      let rubricInsights: string[] = [];
      const cotRubricGuidance: string[] = [];
      
      if (rubricsAssessments.length > 0) {
        rubricInsights = rubricsAssessments.map(assessment => {
          const rubricData = evai56Rubrics.find(r => r.id === assessment.rubricId);
          
          if (rubricData && assessment.riskScore > 1) {
            const intervention = rubricData.interventions[0];
            cotRubricGuidance.push(`${rubricData.name}: ${intervention}`);
          }
          
          return `${assessment.rubricId}: Risk ${assessment.riskScore.toFixed(1)}, Protective ${assessment.protectiveScore.toFixed(1)}`;
        });
        
        console.log(`🎯 Enhanced EvAI detected ${rubricsAssessments.length} areas, overall risk: ${overallRisk.toFixed(1)}%`);
      }

      // Enhanced seed matching with improved context including reflection state
      const extendedContext: ExtendedContext = { 
        ...context, 
        secondaryInsights, 
        collaborationStatus 
      };

      console.log('🔍 Running enhanced seed matching with reflection context...');
      const matchedResult = await checkInput(
        userMessage.content,
        apiKey,
        extendedContext,
        history
      );

      let aiResp: Message;

      if (matchedResult && "confidence" in matchedResult) {
        setSeedConfetti(true);
        
        // Fixed function call - now passing 8 arguments as expected
        aiResp = createSuccessfulAiResponse(
          matchedResult,
          userMessage,
          collaborationStatus,
          availableApis,
          rubricInsights,
          cotRubricGuidance,
          secondaryInsights,
          overallRisk
        );

      } else {
        // Enhanced fallback with better messaging
        const collaborationNote = generateMissingApisNote(collaborationStatus);
        
        aiResp = createLimitedFunctionalityResponse(
          userMessage,
          collaborationStatus,
          availableApis,
          collaborationNote
        );
      }

      // ENHANCED: Add reflection context to all responses
      aiResp = enhanceRegularResponse(aiResp, pendingReflections.length > 0, pendingReflections.length);

      setMessages((prev) => [...prev, aiResp]);
      
    } catch (err) {
      console.error("Enhanced EvAI API collaboration with reflection error:", err);
      const errorMessage = err instanceof Error ? err.message : "Er ging iets mis bij de enhanced API samenwerking met reflectie.";
      const errorResponse = createErrorResponse(userMessage, errorMessage);
      setMessages((prev) => [...prev, errorResponse]);
      toast({
        title: "❌ Enhanced API + Reflectie Error",
        description: "Controleer je API keys en netwerkverbinding",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return { 
    generateAiResponse, 
    isGenerating: isProcessing || isSeedEngineLoading || isAnalyzing || isReflectionProcessing
  };
}
