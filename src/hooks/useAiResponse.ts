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
    
    // Verbeterde API key controle
    const apiConfig = getApiConfiguration();
    const hasOpenAI = apiKey && apiKey.trim().length > 0 && apiKey.startsWith('sk-');
    
    if (!hasOpenAI) {
      console.error('❌ Geen geldige OpenAI API key gevonden');
      const errorResponse = createErrorResponse(
        userMessage, 
        "OpenAI API key ontbreekt of is ongeldig. Stel een geldige API key in via de instellingen (moet beginnen met 'sk-')."
      );
      setMessages((prev) => [...prev, errorResponse]);
      toast({
        title: "❌ API Key Problem",
        description: "Stel een geldige OpenAI API key in",
        variant: "destructive",
      });
      setIsProcessing(false);
      return;
    }
    
    console.log('🚀 EvAI ENHANCED NEUROSYMBOLIC MODE WITH IMPROVED ERROR HANDLING');
    console.log('🔑 API Configuration:', { 
      hasOpenAI: true, 
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

      // Check reflection trigger
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

      // Enhanced workflow met betere foutafhandeling
      if (hasOpenAI && apiConfig.hasVectorAPI) {
        console.log('🧠 FULL NEUROSYMBOLIC WORKFLOW WITH IMPROVED ERROR HANDLING');
        
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

          console.log('✅ ENHANCED NEUROSYMBOLIC SUCCESS:');
          console.log(`  🎯 Response Type: ${neurosymbolicResult.responseType}`);
          console.log(`  📊 Confidence: ${(neurosymbolicResult.confidence * 100).toFixed(1)}%`);

          // Store conversation embedding in background
          setTimeout(() => {
            storeConversationEmbedding(
              [...messages, userMessage],
              apiConfig.vectorApiKey!,
              `conv-${Date.now()}`
            ).catch(err => console.warn('⚠️ Background embedding storage failed:', err));
          }, 1000);

          setSeedConfetti(true);

          let label: "Valideren" | "Reflectievraag" | "Suggestie";
          if (neurosymbolicResult.seed?.label === "Reflectievraag") {
            label = "Reflectievraag";
          } else if (neurosymbolicResult.seed?.label === "Suggestie") {
            label = "Suggestie";
          } else {
            label = "Valideren";
          }

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
            content: neurosymbolicResult.response,
            explainText: `${neurosymbolicResult.reasoning} | Enhanced workflow met verbeterde foutafhandeling (${confidence}% confidence)`,
            emotionSeed: neurosymbolicResult.seed?.emotion || null,
            animate: true,
            meta: `Enhanced API: ${confidence}% confidence`,
            brilliant: true,
            timestamp: new Date(),
            replyTo: userMessage.id,
            feedback: null,
            symbolicInferences: [
              `🧠 Enhanced Neurosymbolic Engine: ${neurosymbolicResult.responseType}`,
              `🤝 API Status: ${apiStatusText}`,
              `🌱 Seed: ${apiStatus?.seedGenerated ? '✅ Nieuw gegenereerd' : '⚡ Bestaand gebruikt'}`,
              `🤔 Reflecties: ${pendingReflections.length} gereed`,
              `⚖️ Confidence: ${confidence}%`,
              `⚡ Verwerking: ${neurosymbolicResult.processingTime}ms`,
              `🎯 Redenering: ${neurosymbolicResult.reasoning}`
            ].filter(Boolean)
          };

          aiResp = enhanceRegularResponse(aiResp, pendingReflections.length > 0, pendingReflections.length);

          setMessages((prev) => [...prev, aiResp]);
          
          toast({
            title: `🚀 ENHANCED API (${confidence}%)`,
            description: `${apiStatusText}`,
          });

          return;
        } catch (neurosymbolicError) {
          console.error('🔴 Enhanced neurosymbolic workflow failed:', neurosymbolicError);
          
          toast({
            title: "⚠️ Enhanced Neurosymbolic Fallback",
            description: "Schakeling naar verbeterde fallback mode",
            variant: "destructive"
          });
        }
      }

      // Verbeterde fallback met betere foutafhandeling
      console.log('🔄 ENHANCED FALLBACK MODE WITH BETTER ERROR HANDLING...');

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
          secondaryInsights = ['Secundaire analyse gefaald - controleer API key 2'];
        }
      }

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

      const extendedContext: ExtendedContext = { 
        ...context, 
        secondaryInsights, 
        collaborationStatus 
      };

      console.log('🔍 Running enhanced seed matching with better error handling...');
      
      try {
        const matchedResult = await checkInput(
          userMessage.content,
          apiKey,
          extendedContext,
          history
        );

        let aiResp: Message;

        if (matchedResult && "confidence" in matchedResult) {
          setSeedConfetti(true);
          
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
          const collaborationNote = generateMissingApisNote(collaborationStatus);
          
          aiResp = createLimitedFunctionalityResponse(
            userMessage,
            collaborationStatus,
            availableApis,
            collaborationNote
          );
        }

        aiResp = enhanceRegularResponse(aiResp, pendingReflections.length > 0, pendingReflections.length);
        setMessages((prev) => [...prev, aiResp]);
        
      } catch (seedError) {
        console.error('🔴 Seed matching failed:', seedError);
        
        // Fallback naar basis respons
        const basicResponse: Message = {
          id: `ai-basic-${Date.now()}`,
          from: "ai",
          label: "Valideren",
          accentColor: getLabelVisuals("Valideren").accentColor,
          content: "Ik begrijp dat je iets wilt delen. Helaas lukt het me nu niet om je bericht volledig te verwerken. Zou je het opnieuw kunnen proberen?",
          explainText: "Basis fallback mode - er zijn technische problemen opgetreden",
          emotionSeed: null,
          animate: true,
          meta: "Basis fallback",
          brilliant: false,
          timestamp: new Date(),
          replyTo: userMessage.id,
          feedback: null,
          symbolicInferences: [
            "⚠️ Technische problemen gedetecteerd",
            "🔄 Basis fallback mode actief",
            "🔧 Controleer API keys in instellingen",
            "📋 Probeer opnieuw of herformuleer je vraag"
          ]
        };
        
        setMessages((prev) => [...prev, basicResponse]);
        
        toast({
          title: "⚠️ Technische Problemen",
          description: "Basis respons geactiveerd - controleer je instellingen",
          variant: "destructive",
        });
      }
      
    } catch (err) {
      console.error("Critical EvAI error:", err);
      const errorMessage = err instanceof Error ? err.message : "Er ging iets mis bij de verwerking.";
      const errorResponse = createErrorResponse(userMessage, errorMessage);
      setMessages((prev) => [...prev, errorResponse]);
      toast({
        title: "❌ Kritieke Fout",
        description: "Herstart de applicatie of controleer je instellingen",
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
