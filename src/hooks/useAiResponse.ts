
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
    
    console.log('🔥 EvAI-ENHANCED NEUROSYMBOLIC MODE ACTIVATED 🔥');
    console.log('🔑 API Keys:', { hasOpenAI, hasOpenAi2, hasVectorAPI });
    console.log('🤖 Autonomous Mode:', isAutonomousEnabled ? 'ACTIVE' : 'DISABLED');

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
        console.log('🧠 FULL NEUROSYMBOLIC WORKFLOW ACTIVATED');
        console.log('🎯 Processing with API 1 + Vector API + Optional API 2');
        
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

          console.log(`✅ NEUROSYMBOLIC SUCCESS: ${neurosymbolicResult.responseType} (${(neurosymbolicResult.confidence * 100).toFixed(1)}%)`);
          console.log('🤝 API Collaboration:', neurosymbolicResult.apiCollaboration);

          // Store conversation embedding for future learning
          setTimeout(() => {
            storeConversationEmbedding(
              [...messages, userMessage],
              vectorApiKey,
              `conv-${Date.now()}`
            );
          }, 2000);

          setSeedConfetti(true);

          // Map response type to label
          let label: "Valideren" | "Reflectievraag" | "Suggestie";
          if (neurosymbolicResult.seed?.label === "Reflectievraag") {
            label = "Reflectievraag";
          } else if (neurosymbolicResult.seed?.label === "Suggestie") {
            label = "Suggestie";
          } else {
            label = "Valideren";
          }

          // Enhanced result display showing API collaboration
          const apiCollabNote = neurosymbolicResult.apiCollaboration ? 
            `\n\n*[🚀 API SAMENWERKING: API-1 ${neurosymbolicResult.apiCollaboration.api1Used ? '✅' : '❌'} | API-2 ${neurosymbolicResult.apiCollaboration.api2Used ? '✅' : '❌'} | Vector ✅ | Seeds: ${neurosymbolicResult.apiCollaboration.seedGenerated ? '+Nieuw' : 'Bestaand'}${neurosymbolicResult.seedInjectionUsed ? ' + Injectie' : ''}]*` :
            `\n\n*[🧠 NEUROSYMBOLIC: ${neurosymbolicResult.responseType} response actief]*`;

          const aiResp: Message = {
            id: `ai-neurosymbolic-${Date.now()}`,
            from: "ai",
            label: label,
            accentColor: getLabelVisuals(label).accentColor,
            content: `${neurosymbolicResult.response}${apiCollabNote}`,
            explainText: `${neurosymbolicResult.reasoning} | APIs: ${Object.entries(neurosymbolicResult.apiCollaboration || {}).map(([k,v]) => `${k}:${v}`).join(', ')}`,
            emotionSeed: neurosymbolicResult.seed?.emotion || null,
            animate: true,
            meta: `🤝 API Samenwerking: ${(neurosymbolicResult.confidence * 100).toFixed(1)}% confidence`,
            brilliant: true,
            timestamp: new Date(),
            replyTo: userMessage.id,
            feedback: null,
            symbolicInferences: [
              `🧠 Neurosymbolic Engine: ${neurosymbolicResult.responseType}`,
              `🤝 API 1 (Neural): ${neurosymbolicResult.apiCollaboration?.api1Used ? '✅ Gebruikt' : '❌ Niet gebruikt'}`,
              `🤝 API 2 (Secondary): ${neurosymbolicResult.apiCollaboration?.api2Used ? '✅ Gebruikt voor analyse' : '❌ Niet beschikbaar'}`,
              `🧬 Vector API: ✅ Gebruikt voor embeddings`,
              `🌱 Seed Status: ${neurosymbolicResult.apiCollaboration?.seedGenerated ? '✅ Nieuwe seed gegenereerd' : '⚡ Bestaande seed gebruikt'}`,
              `${neurosymbolicResult.seedInjectionUsed ? '💉 Seed injectie toegepast' : ''}`,
              `⚖️ Confidence: ${(neurosymbolicResult.confidence * 100).toFixed(1)}%`,
              `⚡ Processing: ${neurosymbolicResult.processingTime}ms`,
              neurosymbolicResult.reasoning
            ].filter(Boolean)
          };

          setMessages((prev) => [...prev, aiResp]);
          
          toast({
            title: "🚀 VOLLEDIGE API SAMENWERKING",
            description: `API 1${neurosymbolicResult.apiCollaboration?.api1Used ? '✅' : '❌'} + API 2${neurosymbolicResult.apiCollaboration?.api2Used ? '✅' : '❌'} + Vector✅ = ${(neurosymbolicResult.confidence * 100).toFixed(1)}% succes`,
          });

          return;
        } catch (neurosymbolicError) {
          console.error('🔴 Neurosymbolic workflow failed, falling back:', neurosymbolicError);
          
          toast({
            title: "⚠️ Neurosymbolic Fallback",
            description: "API samenwerking deels beschikbaar, schakel over naar enhanced mode",
            variant: "destructive"
          });
        }
      }

      // FALLBACK: Show partial API collaboration
      console.log('🔄 PARTIAL API COLLABORATION...');
      
      let collaborationStatus: CollaborationStatus = {
        api1: hasOpenAI,
        api2: hasOpenAi2,
        vector: hasVectorAPI
      };

      // Continue with existing enhanced workflow but show collaboration status
      
      let secondaryInsights: string[] = [];
      if (hasOpenAi2) {
        try {
          const contextString = history.map(h => `${h.role}: ${h.content}`).join('\n');
          const preAnalysis = await analyzeNeurosymbolic(
            userMessage.content,
            contextString,
            openAiKey2!
          );
          if (preAnalysis) {
            secondaryInsights = preAnalysis.insights;
            console.log('🧠 Secondary insights:', secondaryInsights);
          }
        } catch (preErr) {
          console.error('🔴 Secondary analysis failed:', preErr);
        }
      }

      // EvAI 5.6 Rubrics Analysis
      console.log('📊 EvAI 5.6 Rubrics analysis...');
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
        
        console.log(`🎯 EvAI detected ${rubricsAssessments.length} areas, overall risk: ${overallRisk.toFixed(1)}%`);
      }

      // Enhanced seed matching with collaboration status
      const extendedContext: ExtendedContext = { 
        ...context, 
        secondaryInsights, 
        collaborationStatus 
      };

      const matchedResult = await checkInput(
        userMessage.content,
        apiKey,
        extendedContext,
        history
      );

      let aiResp: Message;

      if (matchedResult && "confidence" in matchedResult) {
        setSeedConfetti(true);
        
        const collaborationNote = `\n\n*[🤝 API STATUS: API-1 ${collaborationStatus.api1 ? '✅' : '❌'} | API-2 ${collaborationStatus.api2 ? '✅' : '❌'} | Vector ${collaborationStatus.vector ? '✅' : '❌'}]*`;
        
        const label = matchedResult.label || "Valideren";
        aiResp = {
          id: `ai-collaboration-${Date.now()}`,
          from: "ai",
          label: label,
          accentColor: getLabelVisuals(label).accentColor,
          content: `${matchedResult.response}${collaborationNote}`,
          explainText: `${matchedResult.reasoning} | API Collaboration: ${Object.entries(collaborationStatus).filter(([k,v]) => v).map(([k]) => k.toUpperCase()).join('+')}`,
          emotionSeed: matchedResult.emotion,
          animate: true,
          meta: `API Collaboration: ${Math.round(matchedResult.confidence * 100)}%`,
          brilliant: true,
          timestamp: new Date(),
          replyTo: userMessage.id,
          feedback: null,
          symbolicInferences: [
            ...rubricInsights,
            ...cotRubricGuidance.map(guidance => `🧠 EvAI: ${guidance}`),
            `🤝 API 1 (OpenAI): ${collaborationStatus.api1 ? '✅ Actief' : '❌ Ontbreekt'}`,
            `🤝 API 2 (Secondary): ${collaborationStatus.api2 ? '✅ Actief voor analyse' : '❌ Ontbreekt'}`,
            `🧬 Vector API: ${collaborationStatus.vector ? '✅ Actief voor embeddings' : '❌ Ontbreekt'}`,
            `🧠 OpenAI confidence: ${Math.round(matchedResult.confidence * 100)}%`,
            secondaryInsights.length > 0 ? `💡 Secondary insights: ${secondaryInsights.join(', ')}` : ''
          ].filter(Boolean)
        };

      } else {
        // Fallback with collaboration status
        const collaborationNote = `\n\n*[⚠️ BEPERKTE API STATUS: Ontbrekende keys beperken de functionaliteit. API-1 ${collaborationStatus.api1 ? '✅' : '❌'} | API-2 ${collaborationStatus.api2 ? '✅' : '❌'} | Vector ${collaborationStatus.vector ? '✅' : '❌'}]*`;
        
        aiResp = {
          id: `ai-limited-collaboration-${Date.now()}`,
          from: "ai",
          label: "Valideren",
          accentColor: getLabelVisuals("Valideren").accentColor,
          content: `Ik begrijp je vraag en probeer je te helpen met de beschikbare API's.${collaborationNote}`,
          explainText: `Limited API collaboration - some features unavailable`,
          emotionSeed: null,
          animate: true,
          meta: `Beperkte API samenwerking`,
          brilliant: false,
          timestamp: new Date(),
          replyTo: userMessage.id,
          feedback: null,
          symbolicInferences: [
            `⚠️ API 1 (OpenAI): ${collaborationStatus.api1 ? '✅ Beschikbaar' : '❌ ONTBREEKT - Voeg toe voor betere responses'}`,
            `⚠️ API 2 (Secondary): ${collaborationStatus.api2 ? '✅ Beschikbaar' : '❌ ONTBREEKT - Voeg toe voor diepe analyse'}`,
            `⚠️ Vector API: ${collaborationStatus.vector ? '✅ Beschikbaar' : '❌ ONTBREEKT - Voeg toe voor embedding functies'}`,
            `💡 Tip: Voeg ontbrekende API keys toe in instellingen voor volledige functionaliteit`
          ]
        };
      }

      setMessages((prev) => [...prev, aiResp]);
      
    } catch (err) {
      console.error("Error in EvAI API collaboration:", err);
      const errorMessage = err instanceof Error ? err.message : "Er ging iets mis bij de API samenwerking.";
      const errorResponse: Message = {
        id: `ai-collaboration-error-${Date.now()}`,
        from: "ai",
        label: "Fout",
        content: `${errorMessage}\n\n*[❌ API COLLABORATION ERROR: Controleer je API keys in instellingen]*`,
        emotionSeed: "error",
        animate: true,
        timestamp: new Date(),
        accentColor: getLabelVisuals("Fout").accentColor,
        brilliant: false,
        replyTo: userMessage.id,
        feedback: null,
        symbolicInferences: [
          `❌ Error: ${errorMessage}`,
          `🔧 Check API keys in settings`,
          `🔄 Try again after fixing configuration`
        ]
      };
      setMessages((prev) => [...prev, errorResponse]);
      toast({
        title: "❌ API Collaboration Error",
        description: "Controleer je API keys in de instellingen",
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
