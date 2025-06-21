
import { useState } from "react";
import { useSeedEngine } from "./useSeedEngine";
import { useOpenAISecondary, SecondaryAnalysis } from "./useOpenAISecondary";
import { useOpenAISeedGenerator } from "./useOpenAISeedGenerator";
import { useNeurosymbolicWorkflow } from "./useNeurosymbolicWorkflow";
import { useAutonomousLearning } from "./useAutonomousLearning";
import { v4 as uuidv4 } from "uuid";
import { AdvancedSeed } from "../types/seed";
import { useEvAI56Rubrics, RubricAssessment } from "./useEvAI56Rubrics";
import { useCoTFeedbackAnalyzer } from "./useCoTFeedbackAnalyzer";
import { toast } from "@/hooks/use-toast";
import { getLabelVisuals } from "../lib/emotion-visuals";
import { Message, ChatHistoryItem } from "../types";
import { useSymbolicEngine } from "./useSymbolicEngine";
import { loadAdvancedSeeds } from "../lib/advancedSeedStorage";
import { useSeeds } from "./useSeeds";
import { EmotionDetection } from "./useOpenAI";

interface CollaborationStatus {
  api1: boolean;
  api2: boolean;
  vector: boolean;
}

interface ExtendedContext {
  dislikedLabel?: "Valideren" | "Reflectievraag" | "Suggestie";
  secondaryInsights?: string[];
  collaborationStatus?: CollaborationStatus;
}

export function useAiResponse(
  messages: Message[],
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  apiKey: string,
  setSeedConfetti: (show: boolean) => void
) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { checkInput, isLoading: isSeedEngineLoading } = useSeedEngine();
  const { analyzeNeurosymbolic, generateSeed, isAnalyzing } = useOpenAISecondary();
  const { 
    generateSeed: generateOpenAISeed, 
    analyzeConversationForSeeds, 
    injectSeedToDatabase,
    isGenerating: isOpenAIGenerating 
  } = useOpenAISeedGenerator();
  const { assessMessage, calculateOverallRisk, evai56Rubrics } = useEvAI56Rubrics();
  const { evaluate: evaluateSymbolic } = useSymbolicEngine();
  const { analyzeCoTFeedback, generateCoTImprovements, isAnalyzing: isCoTAnalyzing } = useCoTFeedbackAnalyzer();
  const { refetch: refetchSeeds } = useSeeds();
  const { processInput: processNeurosymbolic, storeConversationEmbedding } = useNeurosymbolicWorkflow();
  const { executeAutonomousLearning } = useAutonomousLearning();

  const runSecondaryAnalysis = async (history: Message[], key: string) => {
    if (!key || !key.trim()) return;
    try {
      const contextString = history.map(h => `${h.from}: ${h.content}`).join('\n');
      const analysis = await analyzeNeurosymbolic(
        history[history.length - 1].content,
        contextString,
        key
      );
      if (analysis?.seedSuggestion) {
        const secondarySeed: AdvancedSeed = {
          id: uuidv4(),
          emotion: analysis.seedSuggestion,
          type: 'validation',
          label: 'Valideren',
          triggers: [analysis.seedSuggestion],
          response: { nl: analysis.insights.join(' ') },
          context: { severity: 'medium', situation: 'therapy' },
          meta: { priority: 1, weight: 1.0, confidence: analysis.confidence || 0.7, usageCount: 0 },
          tags: ['secondary-analysis', 'auto-generated'],
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: 'ai',
          isActive: true,
          version: '1.0.0'
        };
        
        const injected = await injectSeedToDatabase(secondarySeed);
        if (injected) {
          console.log('✅ Secondary analysis seed injected:', analysis.seedSuggestion);
          await refetchSeeds();
        }
      }
    } catch (err) {
      console.error('Secondary analysis failed', err);
    }
  };

  const generateAiResponse = async (
    userMessage: Message,
    context?: { dislikedLabel?: "Valideren" | "Reflectievraag" | "Suggestie" }
  ) => {
    setIsProcessing(true);
    
    const openAiKey2 = localStorage.getItem('openai-api-key-2');
    const vectorApiKey = localStorage.getItem('vector-api-key');
    const hasOpenAI = apiKey && apiKey.trim().length > 0;
    const hasOpenAi2 = openAiKey2 && openAiKey2.trim().length > 0;
    const hasVectorAPI = vectorApiKey && vectorApiKey.trim().length > 0;
    const isAutonomousEnabled = localStorage.getItem('evai-autonomous-mode') === 'true';
    
    console.log('🚀 EvAI ENHANCED NEUROSYMBOLIC MODE - IMPROVED VERSION');
    console.log('🔑 API Configuration:', { 
      hasOpenAI, 
      hasOpenAi2, 
      hasVectorAPI,
      autonomous: isAutonomousEnabled 
    });

    try {
      const messageIndex = messages.findIndex(m => m.id === userMessage.id);
      const history: ChatHistoryItem[] = messages
        .slice(0, messageIndex >= 0 ? messageIndex : messages.length)
        .map(msg => ({
          role: msg.from === 'user' ? 'user' : 'assistant',
          content: msg.content
        }));

      // ENHANCED: Use complete neurosymbolic workflow if all keys available
      if (hasOpenAI && hasVectorAPI) {
        console.log('🧠 FULL NEUROSYMBOLIC WORKFLOW ACTIVATED - ENHANCED VERSION');
        
        try {
          const neurosymbolicResult = await processNeurosymbolic(
            userMessage.content,
            apiKey,
            vectorApiKey,
            {
              messages: messages,
              userId: 'current-user',
              conversationId: `conv-${Date.now()}`,
              secondaryApiKey: hasOpenAi2 ? openAiKey2 : undefined,
            }
          );

          console.log('✅ ENHANCED NEUROSYMBOLIC SUCCESS:');
          console.log(`  🎯 Response Type: ${neurosymbolicResult.responseType}`);
          console.log(`  📊 Confidence: ${(neurosymbolicResult.confidence * 100).toFixed(1)}%`);
          console.log(`  🤝 API Collaboration:`, neurosymbolicResult.apiCollaboration);
          console.log(`  ⚡ Processing Time: ${neurosymbolicResult.processingTime}ms`);

          // Store conversation embedding for future learning
          setTimeout(() => {
            storeConversationEmbedding(
              [...messages, userMessage],
              vectorApiKey,
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

          // Enhanced result display with better formatting
          const confidence = Math.round(neurosymbolicResult.confidence * 100);
          const apiStatus = neurosymbolicResult.apiCollaboration;
          
          const apiStatusText = [
            `API-1: ${apiStatus?.api1Used ? '✅' : '❌'}`,
            `API-2: ${apiStatus?.api2Used ? '✅' : '❌'}`,
            `Vector: ${hasVectorAPI ? '✅' : '❌'}`,
            apiStatus?.seedGenerated ? 'Nieuwe seed' : 'Bestaande seed'
          ].join(' | ');

          const collaborationNote = `\n\n*[🚀 API SAMENWERKING: ${apiStatusText} | ${confidence}% confidence${neurosymbolicResult.seedInjectionUsed ? ' + Seed injectie' : ''}]*`;

          const aiResp: Message = {
            id: `ai-enhanced-${Date.now()}`,
            from: "ai",
            label: label,
            accentColor: getLabelVisuals(label).accentColor,
            content: `${neurosymbolicResult.response}${collaborationNote}`,
            explainText: `${neurosymbolicResult.reasoning} | Enhanced workflow met ${confidence}% confidence`,
            emotionSeed: neurosymbolicResult.seed?.emotion || null,
            animate: true,
            meta: `Enhanced API Collaboration: ${confidence}% confidence`,
            brilliant: true,
            timestamp: new Date(),
            replyTo: userMessage.id,
            feedback: null,
            symbolicInferences: [
              `🧠 Enhanced Neurosymbolic Engine: ${neurosymbolicResult.responseType}`,
              `🤝 API 1 (Neural): ${apiStatus?.api1Used ? '✅ Actief' : '❌ Niet gebruikt'}`,
              `🤝 API 2 (Secondary): ${apiStatus?.api2Used ? '✅ Gebruikt voor analyse' : '❌ Niet beschikbaar'}`,
              `🧬 Vector API: ✅ Actief voor embeddings`,
              `🌱 Seed Status: ${apiStatus?.seedGenerated ? '✅ Nieuwe seed gegenereerd' : '⚡ Bestaande seed gebruikt'}`,
              neurosymbolicResult.seedInjectionUsed ? '💉 Seed injectie toegepast' : '',
              `⚖️ Confidence: ${confidence}% (${neurosymbolicResult.confidence > 0.8 ? 'Hoog' : neurosymbolicResult.confidence > 0.6 ? 'Gemiddeld' : 'Laag'})`,
              `⚡ Verwerking: ${neurosymbolicResult.processingTime}ms`,
              `🎯 Redenering: ${neurosymbolicResult.reasoning}`
            ].filter(Boolean)
          };

          setMessages((prev) => [...prev, aiResp]);
          
          toast({
            title: `🚀 ENHANCED API SAMENWERKING (${confidence}%)`,
            description: `${apiStatusText} - Verwerkt in ${neurosymbolicResult.processingTime}ms`,
          });

          return;
        } catch (neurosymbolicError) {
          console.error('🔴 Enhanced neurosymbolic workflow failed:', neurosymbolicError);
          
          toast({
            title: "⚠️ Enhanced Neurosymbolic Fallback",
            description: "Schakel over naar verbeterde fallback mode",
            variant: "destructive"
          });
        }
      }

      // ENHANCED FALLBACK: Better partial API collaboration
      console.log('🔄 ENHANCED PARTIAL API COLLABORATION...');
      
      let collaborationStatus: CollaborationStatus = {
        api1: hasOpenAI,
        api2: hasOpenAi2,
        vector: hasVectorAPI
      };

      const availableApis = Object.entries(collaborationStatus).filter(([_, available]) => available).length;
      console.log(`📊 Available APIs: ${availableApis}/3`);

      // Enhanced secondary insights
      let secondaryInsights: string[] = [];
      if (hasOpenAi2) {
        try {
          console.log('🧠 Running enhanced secondary analysis...');
          const contextString = history.map(h => `${h.role}: ${h.content}`).join('\n');
          const preAnalysis = await analyzeNeurosymbolic(
            userMessage.content,
            contextString,
            openAiKey2!
          );
          if (preAnalysis) {
            secondaryInsights = preAnalysis.insights;
            console.log(`✅ Secondary insights generated: ${secondaryInsights.length} insights`);
          }
        } catch (preErr) {
          console.error('🔴 Enhanced secondary analysis failed:', preErr);
        }
      }

      // Enhanced EvAI 5.6 Rubrics Analysis
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

      // Enhanced seed matching with improved context
      const extendedContext: ExtendedContext = { 
        ...context, 
        secondaryInsights, 
        collaborationStatus 
      };

      console.log('🔍 Running enhanced seed matching...');
      const matchedResult = await checkInput(
        userMessage.content,
        apiKey,
        extendedContext,
        history
      );

      let aiResp: Message;

      if (matchedResult && "confidence" in matchedResult) {
        setSeedConfetti(true);
        
        const confidence = Math.round(matchedResult.confidence * 100);
        const apiStatusText = `API-1:${collaborationStatus.api1 ? '✅' : '❌'} | API-2:${collaborationStatus.api2 ? '✅' : '❌'} | Vector:${collaborationStatus.vector ? '✅' : '❌'}`;
        const collaborationNote = `\n\n*[🤝 ENHANCED API STATUS: ${apiStatusText} | ${availableApis}/3 APIs active]*`;
        
        // Use 'type' property check to determine if it's an AdvancedSeed or EmotionDetection
        let responseContent: string;
        let label: "Valideren" | "Reflectievraag" | "Suggestie";
        let emotionSeed: string | null;
        let explainText: string;
        
        if ('type' in matchedResult) {
          // This is an AdvancedSeed object from database
          const seed = matchedResult as AdvancedSeed;
          responseContent = seed.response.nl;
          // Filter out "Interventie" label to match Message type
          label = seed.label === "Interventie" ? "Suggestie" : seed.label as "Valideren" | "Reflectievraag" | "Suggestie";
          emotionSeed = seed.emotion;
          explainText = `Gevonden match op basis van triggers: ${seed.triggers.join(', ')}. Context: ${seed.context.severity}. Enhanced API Collaboration: ${confidence}%`;
        } else {
          // This is an EmotionDetection object from OpenAI
          const detection = matchedResult as EmotionDetection;
          responseContent = detection.response;
          label = detection.label || "Valideren";
          emotionSeed = detection.emotion;
          explainText = `${detection.reasoning || 'Enhanced API Collaboration'} | Enhanced API Collaboration: ${confidence}%`;
        }
        
        aiResp = {
          id: `ai-enhanced-collab-${Date.now()}`,
          from: "ai",
          label: label,
          accentColor: getLabelVisuals(label).accentColor,
          content: `${responseContent}${collaborationNote}`,
          explainText: explainText,
          emotionSeed: emotionSeed,
          animate: true,
          meta: `Enhanced API Collaboration: ${confidence}% | ${availableApis}/3 APIs`,
          brilliant: true,
          timestamp: new Date(),
          replyTo: userMessage.id,
          feedback: null,
          symbolicInferences: [
            ...rubricInsights.map(insight => `📊 EvAI Rubric: ${insight}`),
            ...cotRubricGuidance.map(guidance => `🧠 EvAI Guidance: ${guidance}`),
            `🤝 API 1 (OpenAI): ${collaborationStatus.api1 ? '✅ Actief' : '❌ ONTBREEKT - Voeg toe voor betere responses'}`,
            `🤝 API 2 (Secondary): ${collaborationStatus.api2 ? '✅ Actief voor analyse' : '❌ ONTBREEKT - Voeg toe voor diepere analyse'}`,
            `🧬 Vector API: ${collaborationStatus.vector ? '✅ Actief voor embeddings' : '❌ ONTBREEKT - Voeg toe voor neural matching'}`,
            `📊 Match Confidence: ${confidence}% (${matchedResult.confidence > 0.8 ? 'Hoog' : matchedResult.confidence > 0.6 ? 'Gemiddeld' : 'Laag'})`,
            secondaryInsights.length > 0 ? `💡 Secondary insights: ${secondaryInsights.slice(0, 2).join(', ')}` : '',
            `📈 Available APIs: ${availableApis}/3 | Risk Level: ${overallRisk.toFixed(1)}%`
          ].filter(Boolean)
        };

      } else {
        // Enhanced fallback with better messaging
        const missingApis = Object.entries(collaborationStatus)
          .filter(([_, available]) => !available)
          .map(([api]) => api.toUpperCase())
          .join(', ');
        
        const collaborationNote = `\n\n*[⚠️ BEPERKTE FUNCTIONALITEIT: Ontbrekende APIs (${missingApis}) beperken de response kwaliteit. Voeg API keys toe voor volledige functionaliteit.]*`;
        
        aiResp = {
          id: `ai-limited-enhanced-${Date.now()}`,
          from: "ai",
          label: "Valideren",
          accentColor: getLabelVisuals("Valideren").accentColor,
          content: `Ik begrijp je vraag en probeer je te helpen met de beschikbare APIs. Voor betere responses voeg je de ontbrekende API keys toe in de instellingen.${collaborationNote}`,
          explainText: `Limited enhanced API collaboration - ${availableApis}/3 APIs available`,
          emotionSeed: null,
          animate: true,
          meta: `Beperkte Enhanced API samenwerking: ${availableApis}/3`,
          brilliant: false,
          timestamp: new Date(),
          replyTo: userMessage.id,
          feedback: null,
          symbolicInferences: [
            `⚠️ API 1 (OpenAI): ${collaborationStatus.api1 ? '✅ Beschikbaar' : '❌ ONTBREEKT - Voeg toe voor betere neural responses'}`,
            `⚠️ API 2 (Secondary): ${collaborationStatus.api2 ? '✅ Beschikbaar' : '❌ ONTBREEKT - Voeg toe voor enhanced analyse'}`,
            `⚠️ Vector API: ${collaborationStatus.vector ? '✅ Beschikbaar' : '❌ ONTBREEKT - Voeg toe voor neural search functionaliteit'}`,
            `📊 Functionaliteit: ${Math.round((availableApis / 3) * 100)}% van volledige capaciteit beschikbaar`,
            `💡 Verbetering: Voeg ${3 - availableApis} ontbrekende API key${3 - availableApis > 1 ? 's' : ''} toe voor volledige functionaliteit`,
            `🎯 Current Performance: Basis response generation mogelijk`
          ]
        };
      }

      setMessages((prev) => [...prev, aiResp]);
      
    } catch (err) {
      console.error("Enhanced EvAI API collaboration error:", err);
      const errorMessage = err instanceof Error ? err.message : "Er ging iets mis bij de enhanced API samenwerking.";
      const errorResponse: Message = {
        id: `ai-enhanced-error-${Date.now()}`,
        from: "ai",
        label: "Fout",
        content: `${errorMessage}\n\n*[❌ ENHANCED API COLLABORATION ERROR: Controleer je API keys en netwerkverbinding]*`,
        emotionSeed: "error",
        animate: true,
        timestamp: new Date(),
        accentColor: getLabelVisuals("Fout").accentColor,
        brilliant: false,
        replyTo: userMessage.id,
        feedback: null,
        symbolicInferences: [
          `❌ Enhanced Error: ${errorMessage}`,
          `🔧 Troubleshooting: Check alle API keys in instellingen`,
          `🌐 Network: Controleer internetverbinding`,
          `🔄 Retry: Probeer opnieuw na het oplossen van de configuratie`
        ]
      };
      setMessages((prev) => [...prev, errorResponse]);
      toast({
        title: "❌ Enhanced API Collaboration Error",
        description: "Controleer je API keys en netwerkverbinding",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const detectAllEmotions = (content: string, assessments: RubricAssessment[]): string[] => {
    const emotions: string[] = [];
    const lowerContent = content.toLowerCase();
    
    if (lowerContent.includes('bang') || lowerContent.includes('angst') || lowerContent.includes('angstig')) emotions.push('angst');
    if (lowerContent.includes('verdriet') || lowerContent.includes('huil') || lowerContent.includes('triest')) emotions.push('verdriet');
    if (lowerContent.includes('boos') || lowerContent.includes('woede') || lowerContent.includes('kwaad')) emotions.push('woede');
    if (lowerContent.includes('stress') || lowerContent.includes('druk') || lowerContent.includes('gespannen')) emotions.push('stress');
    if (lowerContent.includes('eenzaam') || lowerContent.includes('alleen')) emotions.push('eenzaamheid');
    if (lowerContent.includes('onzeker') || lowerContent.includes('twijfel')) emotions.push('onzekerheid');
    
    if (emotions.length === 0) {
      emotions.push('onzekerheid');
    }
    
    return [...new Set(emotions)].slice(0, 4);
  };

  return { 
    generateAiResponse, 
    isGenerating: isProcessing || isSeedEngineLoading || isAnalyzing || isOpenAIGenerating || isCoTAnalyzing
  };
}
