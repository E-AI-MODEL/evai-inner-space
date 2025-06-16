
import { useState } from "react";
import { useSeedEngine, Seed } from "./useSeedEngine";
import { useGoogleGemini } from "./useGoogleGemini";
import { useOpenAISeedGenerator } from "./useOpenAISeedGenerator";
import { useEvAI56Rubrics } from "./useEvAI56Rubrics";
import { toast } from "@/hooks/use-toast";
import { getLabelVisuals } from "../lib/emotion-visuals";
import { Message, ChatHistoryItem } from "../types";
import { useSymbolicEngine } from "./useSymbolicEngine";
import { loadAdvancedSeeds } from "../lib/advancedSeedStorage";

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
    
    console.log('🧠 Starting enhanced self-learning AI analysis...');

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
      } else {
        console.log('⚠️ No rubrics triggered - this might indicate content needs review');
      }

      // 🔥 STEP 2: Load current seeds for prompt injection context
      const currentSeeds = loadAdvancedSeeds();
      const seedContext = currentSeeds.length > 0 
        ? `Available therapeutic seeds: ${currentSeeds.slice(0, 5).map(s => `${s.emotion}(${s.label})`).join(', ')}`
        : 'No custom seeds available yet';

      // 🔥 STEP 3: Check existing seeds with enhanced prompt injection
      const matchedResult = await checkInput(userMessage.content, apiKey, context, history);
      let aiResp: Message;

      if (matchedResult && "confidence" in matchedResult) {
        // OpenAI seed match found - Apply prompt injection
        setSeedConfetti(true);
        toast({
          title: "🧠 AI Emotie + Rubrics + Prompt Injection",
          description: `${matchedResult.emotion} (${Math.round(matchedResult.confidence * 100)}%) | Risk: ${overallRisk.toFixed(1)}%`,
        });

        // 🚀 PROMPT INJECTION: Enhance response based on current seed database
        let enhancedResponse = matchedResult.response;
        if (currentSeeds.length > 0) {
          // Find related seeds for context enhancement
          const relatedSeeds = currentSeeds.filter(seed => 
            seed.emotion.toLowerCase().includes(matchedResult.emotion.toLowerCase()) ||
            matchedResult.emotion.toLowerCase().includes(seed.emotion.toLowerCase())
          );
          
          if (relatedSeeds.length > 0) {
            console.log(`🎯 Prompt injection: Found ${relatedSeeds.length} related seeds for enhanced response`);
            enhancedResponse = `${matchedResult.response}\n\n*[Gebaseerd op ${relatedSeeds.length} gerelateerde therapeutische patronen uit eerdere gesprekken]*`;
          }
        }

        const label = matchedResult.label || "Valideren";
        aiResp = {
          id: `ai-enhanced-${Date.now()}`,
          from: "ai",
          label: label,
          accentColor: getLabelVisuals(label).accentColor,
          content: enhancedResponse,
          explainText: `${matchedResult.reasoning} | Rubrics Risk: ${overallRisk.toFixed(1)}% | Seeds: ${currentSeeds.length}`,
          emotionSeed: matchedResult.emotion,
          animate: true,
          meta: `AI + Rubrics + Prompt Injection – ${Math.round(matchedResult.confidence * 100)}%`,
          brilliant: true,
          timestamp: new Date(),
          replyTo: userMessage.id,
          feedback: null,
          symbolicInferences: [
            ...rubricInsights,
            `🎯 Overall risk assessment: ${overallRisk.toFixed(1)}%`,
            `🧠 Prompt injection: ${currentSeeds.length} seeds in context`,
            seedContext
          ]
        };

        // 🔥 Enhanced self-learning for high risk scenarios
        if (hasOpenAI && overallRisk > 30) {
          console.log(`🚀 Risk ${overallRisk.toFixed(1)}% detected, generating adaptive seed...`);
          try {
            const adaptiveSeed = await generateOpenAISeed({
              emotion: matchedResult.emotion,
              context: `Risk scenario (${overallRisk.toFixed(1)}%): ${userMessage.content}`,
              conversationHistory: history.slice(-2).map(h => h.content),
              severity: overallRisk > 70 ? 'critical' : overallRisk > 55 ? 'high' : 'medium'
            }, apiKey);

            if (adaptiveSeed) {
              await injectSeedToDatabase(adaptiveSeed);
              aiResp.symbolicInferences?.push(
                `🌱 Adaptive seed created: "${adaptiveSeed.emotion}" (${adaptiveSeed.label})`,
                `📈 System learning: Risk-aware pattern added to database`,
                `🔄 Prompt injection updated: ${currentSeeds.length + 1} total seeds`
              );
              
              toast({
                title: "🧠 Self-Learning + Prompt Injection",
                description: `Nieuw patroon geleerd voor risk ${overallRisk.toFixed(1)}%`,
              });
            }
          } catch (adaptiveError) {
            console.error('🔴 Adaptive seed generation failed:', adaptiveError);
          }
        }

      } else if (matchedResult) {
        // Advanced seed match with prompt injection
        const seedResult = matchedResult;
        setSeedConfetti(true);
        
        const label = seedResult.label || "Valideren";
        aiResp = {
          id: `ai-seed-enhanced-${Date.now()}`,
          from: "ai",
          label: label,
          accentColor: getLabelVisuals(label).accentColor,
          content: `${seedResult.response}\n\n*[Therapeutisch patroon herkend en toegepast]*`,
          explainText: `Advanced Seed + Rubrics + Prompt Injection: ${seedResult.triggers.join(", ")} | Risk: ${overallRisk.toFixed(1)}%`,
          emotionSeed: seedResult.emotion,
          animate: true,
          meta: `Seed + Rubrics + Prompt Injection – ${overallRisk.toFixed(1)}%`,
          brilliant: true,
          timestamp: new Date(),
          replyTo: userMessage.id,
          feedback: null,
          symbolicInferences: [
            ...rubricInsights,
            `🧠 Prompt injection: Advanced seed applied`,
            seedContext
          ]
        };

      } else {
        // 🔥 STEP 4: No existing seed - Generate new one with full rubrics intelligence
        if (hasOpenAI) {
          console.log('🎯 No existing seed, generating intelligent new seed with rubrics context...');
          try {
            // Enhanced emotion detection from rubrics
            const dominantEmotion = detectEmotionFromRubrics(rubricsAssessments, userMessage.content);

            const generatedSeed = await generateOpenAISeed({
              emotion: dominantEmotion,
              context: `User message: "${userMessage.content}" | Rubrics risk: ${overallRisk.toFixed(1)}% | ${seedContext}`,
              conversationHistory: history.slice(-2).map(h => h.content),
              severity: overallRisk > 70 ? 'critical' : overallRisk > 40 ? 'high' : 'medium'
            }, apiKey);
            
            if (generatedSeed) {
              await injectSeedToDatabase(generatedSeed);
              
              const mappedLabel: "Valideren" | "Reflectievraag" | "Suggestie" = 
                generatedSeed.label === "Interventie" ? "Suggestie" : generatedSeed.label as "Valideren" | "Reflectievraag" | "Suggestie";
              
              aiResp = {
                id: `ai-generated-rubrics-${Date.now()}`,
                from: "ai",
                label: mappedLabel,
                accentColor: getLabelVisuals(mappedLabel).accentColor,
                content: `${generatedSeed.response.nl}\n\n*[Nieuwe therapeutische respons gegenereerd en geleerd]*`,
                explainText: `Self-learning + Prompt Injection: New seed for '${generatedSeed.emotion}' | Risk: ${overallRisk.toFixed(1)}%`,
                emotionSeed: generatedSeed.emotion,
                animate: true,
                meta: "AI Generated + Rubrics + Prompt Injection",
                brilliant: true,
                timestamp: new Date(),
                replyTo: userMessage.id,
                feedback: null,
                symbolicInferences: [
                  ...rubricInsights,
                  `🌱 New seed created and validated: "${generatedSeed.emotion}"`,
                  `📊 Risk-adapted response (${overallRisk.toFixed(1)}%)`,
                  `🧠 System learning: Pattern recognition improved`,
                  `🔄 Prompt injection: Database expanded to ${currentSeeds.length + 1} seeds`
                ]
              };
              
              toast({
                title: "🚀 Zelf-lerend + Prompt Injection",
                description: `Nieuwe seed '${generatedSeed.emotion}' + direct toegepast`,
              });
            } else {
              throw new Error('No seed generated');
            }
          } catch (generationError) {
            console.error('🔴 Intelligent seed generation failed:', generationError);
            // Enhanced fallback with rubrics awareness
            const label = overallRisk > 50 ? "Suggestie" : "Valideren";
            aiResp = {
              id: `ai-fallback-rubrics-${Date.now()}`,
              from: "ai",
              label: label,
              accentColor: getLabelVisuals(label).accentColor,
              content: overallRisk > 50 
                ? "Ik merk dat je in een uitdagende situatie zit. Laten we samen kijken hoe we dit kunnen aanpakken. *[Rubrics-gebaseerde response]*"
                : "Ik hoor iets bijzonders in je bericht, vertel gerust meer. *[Systeem leert van dit gesprek]*",
              explainText: `Enhanced rubrics-aware fallback | Risk: ${overallRisk.toFixed(1)}%`,
              emotionSeed: null,
              animate: true,
              meta: "Rubrics-Aware Fallback + Prompt Injection",
              brilliant: false,
              timestamp: new Date(),
              replyTo: userMessage.id,
              feedback: null,
              symbolicInferences: [
                ...rubricInsights,
                seedContext
              ]
            };
          }
        } else {
          // Basic fallback with enhanced rubrics awareness
          const label = overallRisk > 50 ? "Suggestie" : "Valideren";
          aiResp = {
            id: context?.dislikedLabel ? `ai-feedback-${Date.now()}`: `ai-basic-${Date.now()}`,
            from: "ai",
            label: label,
            accentColor: getLabelVisuals(label).accentColor,
            content: context?.dislikedLabel 
              ? "Het spijt me dat mijn vorige antwoord niet hielp. Ik zal proberen hier rekening mee te houden. *[Systeem past zich aan]*" 
              : overallRisk > 50
                ? `Ik merk dat je in een uitdagende situatie zit. Vertel me meer zodat ik je beter kan helpen. *[Risk: ${overallRisk.toFixed(1)}%]*`
                : "Ik hoor iets bijzonders in je bericht, vertel gerust meer. *[Systeem leert mee]*",
            explainText: context?.dislikedLabel ? "Feedback response." : `Enhanced rubrics guidance | Risk: ${overallRisk.toFixed(1)}%`,
            emotionSeed: null,
            animate: true,
            meta: context?.dislikedLabel ? "Feedback" : "Rubrics-Guided",
            brilliant: false,
            timestamp: new Date(),
            replyTo: userMessage.id,
            feedback: null,
            symbolicInferences: [
              ...rubricInsights,
              seedContext
            ]
          };
        }
      }

      // 🔥 STEP 5: Continuous learning - Analyze conversation for missing patterns
      if (hasOpenAI && messages.length > 2) {
        console.log('🔍 Continuous learning: Analyzing conversation patterns...');
        try {
          const missingEmotions = await analyzeConversationForSeeds(messages, apiKey);
          
          if (missingEmotions.length > 0) {
            console.log('🎯 Found learning opportunities:', missingEmotions);
            
            // Generate seed for highest priority missing emotion (but only if risk is significant)
            if (overallRisk > 20) {
              const priorityEmotion = missingEmotions[0];
              const learningSeed = await generateOpenAISeed({
                emotion: priorityEmotion,
                context: `Learning from conversation pattern: ${userMessage.content} | Risk context: ${overallRisk.toFixed(1)}%`,
                conversationHistory: history.slice(-3).map(h => h.content),
                severity: overallRisk > 60 ? 'high' : 'medium'
              }, apiKey);

              if (learningSeed) {
                await injectSeedToDatabase(learningSeed);
                aiResp.symbolicInferences = [
                  ...(aiResp.symbolicInferences || []),
                  `🎓 Learning seed created: "${priorityEmotion}" (${learningSeed.label})`,
                  `📈 Conversation pattern recognition improved`,
                  `🔄 Self-learning cycle: ${missingEmotions.length} gaps identified`,
                  `🧠 Prompt injection updated with new pattern`
                ];
              }
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

  // Enhanced helper function to detect emotion from rubrics assessment
  const detectEmotionFromRubrics = (assessments: any[], content: string): string => {
    if (assessments.length === 0) {
      // Fallback to content analysis
      const lowerContent = content.toLowerCase();
      if (lowerContent.includes('bang') || lowerContent.includes('angst')) return 'angst';
      if (lowerContent.includes('verdriet') || lowerContent.includes('huil')) return 'verdriet';
      if (lowerContent.includes('boos') || lowerContent.includes('woede')) return 'woede';
      if (lowerContent.includes('stress') || lowerContent.includes('druk')) return 'stress';
      return 'onzekerheid';
    }

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
