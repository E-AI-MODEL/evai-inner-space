
import { useState } from "react";
import { useSeedEngine, Seed } from "./useSeedEngine";
import { useGoogleGemini } from "./useGoogleGemini";
import { useOpenAISeedGenerator } from "./useOpenAISeedGenerator";
import { useEvAI56Rubrics } from "./useEvAI56Rubrics";
import { toast } from "@/hooks/use-toast";
import { getLabelVisuals } from "../lib/emotion-visuals";
import { Message, ChatHistoryItem } from "../types";
import { useSymbolicEngine } from "./useSymbolicEngine";

export function useAiResponse(
  messages: Message[],
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  apiKey: string,
  setSeedConfetti: (show: boolean) => void
) {
  const [isProcessing, setIsProcessing] = useState(false);
  const { checkInput, isLoading: isSeedEngineLoading } = useSeedEngine();
  const { analyzeNeurosymbolic, generateSeed, isAnalyzing } = useGoogleGemini();
  const { 
    generateSeed: generateOpenAISeed, 
    analyzeConversationForSeeds, 
    injectSeedToDatabase,
    isGenerating: isOpenAIGenerating 
  } = useOpenAISeedGenerator();
  const { assessMessage, calculateOverallRisk } = useEvAI56Rubrics();
  const { evaluate: evaluateSymbolic } = useSymbolicEngine();

  const generateAiResponse = async (
    userMessage: Message,
    context?: { dislikedLabel?: "Valideren" | "Reflectievraag" | "Suggestie" }
  ) => {
    setIsProcessing(true);
    
    const googleApiKey = localStorage.getItem('google-api-key');
    const hasOpenAI = apiKey && apiKey.trim().length > 0;
    const hasGoogle = googleApiKey && googleApiKey.trim().length > 0;
    
    console.log('🧠 Starting self-learning AI analysis...');

    try {
      const messageIndex = messages.findIndex(m => m.id === userMessage.id);
      const history: ChatHistoryItem[] = messages
        .slice(0, messageIndex >= 0 ? messageIndex : messages.length)
        .map(msg => ({
          role: msg.from === 'user' ? 'user' : 'assistant',
          content: msg.content
        }));

      // 🔥 STEP 1: EvAI 5.6 Rubrics Analysis (Always run first)
      console.log('📊 Running EvAI 5.6 Rubrics analysis...');
      const rubricsAssessments = assessMessage(userMessage.content);
      const overallRisk = calculateOverallRisk(rubricsAssessments);
      
      let rubricInsights: string[] = [];
      if (rubricsAssessments.length > 0) {
        rubricInsights = rubricsAssessments.map(assessment => 
          `${assessment.rubricId}: Risk ${assessment.riskScore.toFixed(1)}, Protective ${assessment.protectiveScore.toFixed(1)}`
        );
        console.log(`🎯 Rubrics detected ${rubricsAssessments.length} areas, overall risk: ${overallRisk.toFixed(1)}%`);
      }

      // 🔥 STEP 2: Check existing seeds
      const matchedResult = await checkInput(userMessage.content, apiKey, context, history);
      let aiResp: Message;

      if (matchedResult && "confidence" in matchedResult) {
        // OpenAI seed match found
        setSeedConfetti(true);
        toast({
          title: "🧠 AI Emotie + Rubrics",
          description: `${matchedResult.emotion} (${Math.round(matchedResult.confidence * 100)}%) | Risk: ${overallRisk.toFixed(1)}%`,
        });

        const label = matchedResult.label || "Valideren";
        aiResp = {
          id: `ai-enhanced-${Date.now()}`,
          from: "ai",
          label: label,
          accentColor: getLabelVisuals(label).accentColor,
          content: matchedResult.response,
          explainText: `${matchedResult.reasoning} | Rubrics Risk: ${overallRisk.toFixed(1)}%`,
          emotionSeed: matchedResult.emotion,
          animate: true,
          meta: `AI + Rubrics – ${Math.round(matchedResult.confidence * 100)}%`,
          brilliant: true,
          timestamp: new Date(),
          replyTo: userMessage.id,
          feedback: null,
          symbolicInferences: [
            ...rubricInsights,
            `🎯 Overall risk assessment: ${overallRisk.toFixed(1)}%`
          ]
        };

        // 🔥 STEP 3: Self-learning enhancement
        if (hasOpenAI && overallRisk > 40) {
          console.log('🚀 High risk detected, generating adaptive seed...');
          try {
            const adaptiveSeed = await generateOpenAISeed({
              emotion: matchedResult.emotion,
              context: `High risk scenario: ${userMessage.content}`,
              conversationHistory: history.slice(-2).map(h => h.content),
              severity: overallRisk > 70 ? 'critical' : overallRisk > 55 ? 'high' : 'medium'
            }, apiKey);

            if (adaptiveSeed) {
              await injectSeedToDatabase(adaptiveSeed);
              aiResp.symbolicInferences?.push(
                `🌱 Adaptive seed created for high-risk ${matchedResult.emotion}`,
                `📈 System learning: Risk-aware response generated`
              );
              
              toast({
                title: "🧠 Self-Learning Active",
                description: `System adapted to risk level ${overallRisk.toFixed(1)}%`,
              });
            }
          } catch (adaptiveError) {
            console.error('🔴 Adaptive seed generation failed:', adaptiveError);
          }
        }

      } else if (matchedResult) {
        // Advanced seed match
        const seedResult = matchedResult;
        setSeedConfetti(true);
        
        const label = seedResult.label || "Valideren";
        aiResp = {
          id: `ai-seed-enhanced-${Date.now()}`,
          from: "ai",
          label: label,
          accentColor: getLabelVisuals(label).accentColor,
          content: seedResult.response,
          explainText: `Advanced Seed + Rubrics: ${seedResult.triggers.join(", ")} | Risk: ${overallRisk.toFixed(1)}%`,
          emotionSeed: seedResult.emotion,
          animate: true,
          meta: `Seed + Rubrics – ${overallRisk.toFixed(1)}%`,
          brilliant: true,
          timestamp: new Date(),
          replyTo: userMessage.id,
          feedback: null,
          symbolicInferences: rubricInsights
        };

      } else {
        // 🔥 STEP 4: No existing seed - Generate new one with rubrics intelligence
        if (hasOpenAI) {
          console.log('🎯 No existing seed, generating intelligent new seed...');
          try {
            // Determine emotion based on rubrics + content analysis
            const dominantEmotion = rubricsAssessments.length > 0 
              ? this.detectEmotionFromRubrics(rubricsAssessments, userMessage.content)
              : 'onzekerheid';

            const generatedSeed = await generateOpenAISeed({
              emotion: dominantEmotion,
              context: `User message: "${userMessage.content}" | Rubrics risk: ${overallRisk.toFixed(1)}%`,
              conversationHistory: history.slice(-2).map(h => h.content),
              severity: overallRisk > 70 ? 'critical' : overallRisk > 40 ? 'high' : 'medium'
            }, apiKey);
            
            if (generatedSeed) {
              await injectSeedToDatabase(generatedSeed);
              
              const mappedLabel: "Valideren" | "Reflectievraag" | "Suggestie" | "Fout" = 
                generatedSeed.label === "Interventie" ? "Suggestie" : generatedSeed.label as "Valideren" | "Reflectievraag" | "Suggestie";
              
              aiResp = {
                id: `ai-generated-rubrics-${Date.now()}`,
                from: "ai",
                label: mappedLabel,
                accentColor: getLabelVisuals(mappedLabel).accentColor,
                content: generatedSeed.response.nl,
                explainText: `Self-learning: New seed for '${generatedSeed.emotion}' | Risk: ${overallRisk.toFixed(1)}%`,
                emotionSeed: generatedSeed.emotion,
                animate: true,
                meta: "AI Generated + Rubrics Validated",
                brilliant: true,
                timestamp: new Date(),
                replyTo: userMessage.id,
                feedback: null,
                symbolicInferences: [
                  ...rubricInsights,
                  `🌱 New seed created and validated`,
                  `📊 Risk-adapted response (${overallRisk.toFixed(1)}%)`,
                  `🧠 System learning: Pattern recognition improved`
                ]
              };
              
              toast({
                title: "🚀 Zelf-lerend systeem",
                description: `Nieuwe seed '${generatedSeed.emotion}' + rubrics validatie`,
              });
            } else {
              throw new Error('No seed generated');
            }
          } catch (generationError) {
            console.error('🔴 Intelligent seed generation failed:', generationError);
            // Fallback with rubrics awareness
            const label = overallRisk > 50 ? "Suggestie" : "Valideren";
            aiResp = {
              id: `ai-fallback-rubrics-${Date.now()}`,
              from: "ai",
              label: label,
              accentColor: getLabelVisuals(label).accentColor,
              content: overallRisk > 50 
                ? "Ik merk dat je in een uitdagende situatie zit. Laten we samen kijken hoe we dit kunnen aanpakken."
                : "Ik hoor iets bijzonders in je bericht, vertel gerust meer.",
              explainText: `Rubrics-aware fallback | Risk: ${overallRisk.toFixed(1)}%`,
              emotionSeed: null,
              animate: true,
              meta: "Rubrics-Aware Fallback",
              brilliant: false,
              timestamp: new Date(),
              replyTo: userMessage.id,
              feedback: null,
              symbolicInferences: rubricInsights
            };
          }
        } else {
          // Basic fallback with rubrics awareness
          const label = overallRisk > 50 ? "Suggestie" : "Valideren";
          aiResp = {
            id: context?.dislikedLabel ? `ai-feedback-${Date.now()}`: `ai-basic-${Date.now()}`,
            from: "ai",
            label: label,
            accentColor: getLabelVisuals(label).accentColor,
            content: context?.dislikedLabel 
              ? "Het spijt me dat mijn vorige antwoord niet hielp. Ik zal proberen hier rekening mee te houden." 
              : overallRisk > 50
                ? "Ik merk dat je in een uitdagende situatie zit. Vertel me meer zodat ik je beter kan helpen."
                : "Ik hoor iets bijzonders in je bericht, vertel gerust meer.",
            explainText: context?.dislikedLabel ? "Feedback response." : `Rubrics guidance | Risk: ${overallRisk.toFixed(1)}%`,
            emotionSeed: null,
            animate: true,
            meta: context?.dislikedLabel ? "Feedback" : "Rubrics-Guided",
            brilliant: false,
            timestamp: new Date(),
            replyTo: userMessage.id,
            feedback: null,
            symbolicInferences: rubricInsights
          };
        }
      }

      // 🔥 STEP 5: Continuous learning - Analyze conversation for missing patterns
      if (hasOpenAI && messages.length > 3) {
        console.log('🔍 Continuous learning: Analyzing conversation patterns...');
        try {
          const missingEmotions = await analyzeConversationForSeeds(messages, apiKey);
          
          if (missingEmotions.length > 0) {
            console.log('🎯 Found learning opportunities:', missingEmotions);
            
            // Generate seed for highest priority missing emotion
            const priorityEmotion = missingEmotions[0];
            const learningSeed = await generateOpenAISeed({
              emotion: priorityEmotion,
              context: `Learning from conversation pattern: ${userMessage.content}`,
              conversationHistory: history.slice(-3).map(h => h.content),
              severity: 'medium'
            }, apiKey);

            if (learningSeed) {
              await injectSeedToDatabase(learningSeed);
              aiResp.symbolicInferences = [
                ...(aiResp.symbolicInferences || []),
                `🎓 Learning seed created for '${priorityEmotion}'`,
                `📈 Conversation pattern recognition improved`,
                `🔄 Self-learning cycle: ${missingEmotions.length} gaps identified`
              ];
            }
          }
        } catch (learningError) {
          console.error('🔴 Continuous learning failed:', learningError);
        }
      }

      // 🔥 STEP 6: Enhanced Google Gemini integration (if available)
      if (hasGoogle && matchedResult && "confidence" in matchedResult) {
        console.log('🚀 Running Google Gemini enhancement...');
        try {
          const contextString = history.map(h => `${h.role}: ${h.content}`).join('\n');
          const geminiAnalysis = await analyzeNeurosymbolic(
            userMessage.content, 
            contextString, 
            googleApiKey!
          );
          
          if (geminiAnalysis) {
            aiResp.symbolicInferences = [
              ...(aiResp.symbolicInferences || []),
              ...geminiAnalysis.patterns,
              ...geminiAnalysis.insights
            ];
            
            // Enhanced response if Google suggests better approach
            if (geminiAnalysis.seedSuggestion && geminiAnalysis.confidence > 0.8) {
              const enhancedSeed = await generateSeed(
                geminiAnalysis.seedSuggestion,
                userMessage.content,
                googleApiKey!
              );
              
              if (enhancedSeed) {
                aiResp.content = enhancedSeed;
                aiResp.meta = `OpenAI + Google + Rubrics – Multi-AI Enhanced`;
                console.log('✅ Response enhanced by Google Gemini + Rubrics');
              }
            }
          }
        } catch (geminiError) {
          console.error('🔴 Google Gemini enhancement failed:', geminiError);
        }
      }

      // 🔥 STEP 7: Local symbolic rules evaluation
      const extendedMessages = [...messages, aiResp];
      const aiSymbolic = evaluateSymbolic(extendedMessages, aiResp);
      if (aiSymbolic.length) {
        aiResp.symbolicInferences = [...(aiResp.symbolicInferences || []), ...aiSymbolic];
      }

      // 🔥 STEP 8: Self-learning success notification
      if (hasOpenAI && rubricsAssessments.length > 0) {
        console.log('✅ Full self-learning pipeline active: OpenAI + Rubrics + Patterns');
        toast({
          title: "🧠 Zelf-lerend Systeem Actief",
          description: `AI + Rubrics + Patroonherkenning werken samen`,
        });
      }

      setMessages((prev) => [...prev, aiResp]);
      
    } catch (err) {
      console.error("Error in self-learning AI response:", err);
      const errorMessage = err instanceof Error ? err.message : "Er ging iets mis bij de AI analyse.";
      const errorResponse: Message = {
        id: `ai-error-${Date.now()}`,
        from: "ai",
        label: "Fout",
        content: errorMessage,
        emotionSeed: "error",
        animate: true,
        timestamp: new Date(),
        accentColor: getLabelVisuals("Fout").accentColor,
        brilliant: false,
        replyTo: userMessage.id,
        feedback: null,
      };
      setMessages((prev) => [...prev, errorResponse]);
      toast({
        title: "Fout bij zelf-lerend systeem",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper function to detect emotion from rubrics assessment
  const detectEmotionFromRubrics = (assessments: any[], content: string): string => {
    const emotionMap: Record<string, string> = {
      'emotional-regulation': 'overweldiging',
      'self-awareness': 'onzekerheid', 
      'coping-strategies': 'onmacht',
      'social-connection': 'eenzaamheid',
      'meaning-purpose': 'zinloosheid'
    };

    // Find highest risk assessment
    const highestRisk = assessments.reduce((max, assessment) => 
      assessment.riskScore > max.riskScore ? assessment : max, assessments[0]);

    return emotionMap[highestRisk.rubricId] || 'onzekerheid';
  };

  return { 
    generateAiResponse, 
    isGenerating: isProcessing || isSeedEngineLoading || isAnalyzing || isOpenAIGenerating 
  };
}
