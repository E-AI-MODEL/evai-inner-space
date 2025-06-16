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
        : 'No custom seeds available yet - generating first seed';

      // 🔥 STEP 3: AGGRESSIVE SEED GENERATION - Always create new seeds for learning
      let newSeedGenerated = false;
      if (hasOpenAI) {
        console.log('🌱 AGGRESSIVE: Generating new seed for every interaction...');
        try {
          const dominantEmotion = detectEmotionFromRubrics(rubricsAssessments, userMessage.content);
          
          // Check if we already have this exact emotion
          const existingSeed = currentSeeds.find(s => 
            s.emotion.toLowerCase() === dominantEmotion.toLowerCase()
          );

          if (!existingSeed) {
            console.log(`🚀 NEW SEED NEEDED: No existing seed for "${dominantEmotion}"`);
            
            const generatedSeed = await generateOpenAISeed({
              emotion: dominantEmotion,
              context: `User message: "${userMessage.content}" | Rubrics risk: ${overallRisk.toFixed(1)}% | CoT Learning Context`,
              conversationHistory: history.slice(-3).map(h => h.content),
              severity: overallRisk > 70 ? 'critical' : overallRisk > 40 ? 'high' : 'medium'
            }, apiKey);
            
            if (generatedSeed) {
              await injectSeedToDatabase(generatedSeed);
              newSeedGenerated = true;
              console.log(`✅ NEW SEED CREATED: "${dominantEmotion}" successfully injected`);
              
              toast({
                title: "🌱 Nieuwe Seed Gegenereerd!",
                description: `"${dominantEmotion}" toegevoegd aan AI brain`,
              });
            }
          } else {
            console.log(`⚡ EXISTING SEED: "${dominantEmotion}" already exists, using for prompt injection`);
          }
        } catch (seedError) {
          console.error('🔴 Aggressive seed generation failed:', seedError);
        }
      }

      // 🔥 STEP 4: Check existing seeds with enhanced prompt injection
      const matchedResult = await checkInput(userMessage.content, apiKey, context, history);
      let aiResp: Message;

      if (matchedResult && "confidence" in matchedResult) {
        // OpenAI seed match found - Apply enhanced prompt injection
        setSeedConfetti(true);
        toast({
          title: "🧠 AI + Rubrics + Prompt Injection",
          description: `${matchedResult.emotion} (${Math.round(matchedResult.confidence * 100)}%) | Risk: ${overallRisk.toFixed(1)}%`,
        });

        // 🚀 ENHANCED PROMPT INJECTION: Include CoT and learning feedback
        let enhancedResponse = matchedResult.response;
        const updatedSeeds = loadAdvancedSeeds(); // Reload after potential new seed
        
        if (updatedSeeds.length > 0) {
          const relatedSeeds = updatedSeeds.filter(seed => 
            seed.emotion.toLowerCase().includes(matchedResult.emotion.toLowerCase()) ||
            matchedResult.emotion.toLowerCase().includes(seed.emotion.toLowerCase())
          );
          
          if (relatedSeeds.length > 0) {
            console.log(`🎯 PROMPT INJECTION: Found ${relatedSeeds.length} related seeds for enhanced response`);
            enhancedResponse = `${matchedResult.response}\n\n*[AI learning: Gebaseerd op ${relatedSeeds.length} therapeutische patronen + real-time analyse]*`;
          }
        }

        if (newSeedGenerated) {
          enhancedResponse += `\n\n*[System update: Nieuw patroon geleerd en toegepast]*`;
        }

        const label = matchedResult.label || "Valideren";
        aiResp = {
          id: `ai-enhanced-${Date.now()}`,
          from: "ai",
          label: label,
          accentColor: getLabelVisuals(label).accentColor,
          content: enhancedResponse,
          explainText: `${matchedResult.reasoning} | Rubrics Risk: ${overallRisk.toFixed(1)}% | Seeds: ${updatedSeeds.length}`,
          emotionSeed: matchedResult.emotion,
          animate: true,
          meta: `CoT Learning + Prompt Injection – ${Math.round(matchedResult.confidence * 100)}%`,
          brilliant: true,
          timestamp: new Date(),
          replyTo: userMessage.id,
          feedback: null,
          symbolicInferences: [
            ...rubricInsights,
            `🎯 Overall risk assessment: ${overallRisk.toFixed(1)}%`,
            `🧠 Prompt injection: ${updatedSeeds.length} seeds in context`,
            `🌱 New seed this session: ${newSeedGenerated ? 'YES' : 'NO'}`,
            `🔄 CoT Learning: Active and improving`,
            seedContext
          ]
        };

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
          content: `${seedResult.response}\n\n*[Therapeutisch patroon + CoT learning toegepast]*`,
          explainText: `Advanced Seed + Rubrics + CoT: ${seedResult.triggers.join(", ")} | Risk: ${overallRisk.toFixed(1)}%`,
          emotionSeed: seedResult.emotion,
          animate: true,
          meta: `Seed + CoT Learning – ${overallRisk.toFixed(1)}%`,
          brilliant: true,
          timestamp: new Date(),
          replyTo: userMessage.id,
          feedback: null,
          symbolicInferences: [
            ...rubricInsights,
            `🧠 Prompt injection: Advanced seed applied`,
            `🌱 New seed this session: ${newSeedGenerated ? 'YES' : 'NO'}`,
            seedContext
          ]
        };

      } else {
        // 🔥 STEP 5: No existing seed - FORCE generate new one
        if (hasOpenAI) {
          console.log('🎯 NO SEED MATCH: Force generating intelligent new seed...');
          try {
            const dominantEmotion = detectEmotionFromRubrics(rubricsAssessments, userMessage.content);

            const generatedSeed = await generateOpenAISeed({
              emotion: dominantEmotion,
              context: `FORCED GENERATION: "${userMessage.content}" | Rubrics risk: ${overallRisk.toFixed(1)}% | CoT Context`,
              conversationHistory: history.slice(-2).map(h => h.content),
              severity: overallRisk > 70 ? 'critical' : overallRisk > 40 ? 'high' : 'medium'
            }, apiKey);
            
            if (generatedSeed) {
              await injectSeedToDatabase(generatedSeed);
              newSeedGenerated = true;
              
              const mappedLabel: "Valideren" | "Reflectievraag" | "Suggestie" = 
                generatedSeed.label === "Interventie" ? "Suggestie" : generatedSeed.label as "Valideren" | "Reflectievraag" | "Suggestie";
              
              aiResp = {
                id: `ai-generated-cot-${Date.now()}`,
                from: "ai",
                label: mappedLabel,
                accentColor: getLabelVisuals(mappedLabel).accentColor,
                content: `${generatedSeed.response.nl}\n\n*[NIEUW: Therapeutisch patroon gegenereerd, geleerd en direct toegepast via CoT]*`,
                explainText: `CoT Self-learning: New seed for '${generatedSeed.emotion}' | Risk: ${overallRisk.toFixed(1)}%`,
                emotionSeed: generatedSeed.emotion,
                animate: true,
                meta: "CoT Generated + Immediate Application",
                brilliant: true,
                timestamp: new Date(),
                replyTo: userMessage.id,
                feedback: null,
                symbolicInferences: [
                  ...rubricInsights,
                  `🌱 FORCED seed creation: "${generatedSeed.emotion}"`,
                  `📊 Risk-adapted response (${overallRisk.toFixed(1)}%)`,
                  `🧠 CoT Learning: Pattern recognition active`,
                  `🔄 Prompt injection: Database expanded and applied`,
                  `✨ System evolution: Immediate learning cycle`
                ]
              };
              
              toast({
                title: "🚀 CoT Zelf-lerend Systeem",
                description: `NIEUW patroon '${generatedSeed.emotion}' direct toegepast!`,
              });
            } else {
              throw new Error('Forced seed generation failed');
            }
          } catch (generationError) {
            console.error('🔴 FORCED seed generation failed:', generationError);
            // Enhanced fallback
            const label = overallRisk > 50 ? "Suggestie" : "Valideren";
            aiResp = {
              id: `ai-fallback-cot-${Date.now()}`,
              from: "ai",
              label: label,
              accentColor: getLabelVisuals(label).accentColor,
              content: overallRisk > 50 
                ? "Ik merk dat je in een uitdagende situatie zit. Laten we samen kijken hoe we dit kunnen aanpakken. *[CoT Learning: Systeem analyseert voor toekomstige verbetering]*"
                : "Ik hoor iets bijzonders in je bericht, vertel gerust meer. *[CoT: Systeem leert van elk gesprek]*",
              explainText: `CoT-aware fallback | Risk: ${overallRisk.toFixed(1)}% | Learning: Active`,
              emotionSeed: null,
              animate: true,
              meta: "CoT Fallback + Learning Mode",
              brilliant: false,
              timestamp: new Date(),
              replyTo: userMessage.id,
              feedback: null,
              symbolicInferences: [
                ...rubricInsights,
                `🧠 CoT Learning: Fallback mode but still learning`,
                seedContext
              ]
            };
          }
        }
      }

      // 🔥 STEP 6: CoT Feedback Integration - Use feedback for learning
      if (hasOpenAI && messages.length > 1) {
        console.log('🔍 CoT FEEDBACK: Analyzing previous interactions...');
        try {
          // Look for feedback patterns in recent messages
          const recentMessages = messages.slice(-5);
          const feedbackMessages = recentMessages.filter(m => 
            m.feedback && (m.feedback.type === 'dislike' || m.feedback.type === 'like')
          );

          if (feedbackMessages.length > 0) {
            console.log(`📊 CoT FEEDBACK: Found ${feedbackMessages.length} feedback patterns`);
            
            // Analyze negative feedback for learning
            const negativePatterns = feedbackMessages
              .filter(m => m.feedback?.type === 'dislike')
              .map(m => ({
                label: m.label,
                content: m.content,
                emotion: m.emotionSeed
              }));

            if (negativePatterns.length > 0) {
              aiResp.symbolicInferences = [
                ...(aiResp.symbolicInferences || []),
                `🔄 CoT Learning: ${negativePatterns.length} negative feedback patterns analyzed`,
                `📈 Adaptation: Avoiding patterns: ${negativePatterns.map(p => p.label).join(', ')}`,
                `🧠 Feedback integration: Learning from user preferences`
              ];
            }
          }
        } catch (feedbackError) {
          console.error('🔴 CoT feedback analysis failed:', feedbackError);
        }
      }

      // 🔥 STEP 7: Continuous learning with lower threshold
      if (hasOpenAI && messages.length > 1 && overallRisk > 10) { // Lowered threshold
        console.log('🔍 CONTINUOUS LEARNING: Analyzing for missing patterns...');
        try {
          const missingEmotions = await analyzeConversationForSeeds(messages, apiKey);
          
          if (missingEmotions.length > 0) {
            console.log('🎯 LEARNING GAPS:', missingEmotions);
            
            // Generate seed for highest priority missing emotion
            const priorityEmotion = missingEmotions[0];
            const learningSeed = await generateOpenAISeed({
              emotion: priorityEmotion,
              context: `CoT Learning from conversation: ${userMessage.content} | Risk context: ${overallRisk.toFixed(1)}%`,
              conversationHistory: history.slice(-3).map(h => h.content),
              severity: overallRisk > 60 ? 'high' : 'medium'
            }, apiKey);

            if (learningSeed) {
              await injectSeedToDatabase(learningSeed);
              aiResp.symbolicInferences = [
                ...(aiResp.symbolicInferences || []),
                `🎓 CoT Learning seed: "${priorityEmotion}" (${learningSeed.label})`,
                `📈 Conversation gap filled: ${missingEmotions.length} total gaps identified`,
                `🔄 Self-improving: Continuous learning active`,
                `🧠 Next-level AI: Predictive pattern generation`
              ];
              
              console.log(`✅ CoT LEARNING: New seed "${priorityEmotion}" generated from conversation analysis`);
            }
          }
        } catch (learningError) {
          console.error('🔴 Continuous learning failed:', learningError);
        }
      }

      // 🔥 STEP 8: Enhanced Google Gemini integration (if available)
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

      // 🔥 STEP 9: Local symbolic rules evaluation
      const extendedMessages = [...messages, aiResp];
      const aiSymbolic = evaluateSymbolic(extendedMessages, aiResp);
      if (aiSymbolic.length) {
        aiResp.symbolicInferences = [...(aiResp.symbolicInferences || []), ...aiSymbolic];
      }

      // 🔥 STEP 10: Enhanced success notification
      const finalSeedCount = loadAdvancedSeeds().length;
      if (hasOpenAI && rubricsAssessments.length > 0) {
        console.log(`✅ CoT Self-learning cycle complete: ${finalSeedCount} total seeds | New: ${newSeedGenerated}`);
        toast({
          title: "🧠 CoT Zelf-lerend Systeem",
          description: `AI + Rubrics + CoT Learning | Seeds: ${finalSeedCount}`,
        });
      }

      setMessages((prev) => [...prev, aiResp]);
      
    } catch (err) {
      console.error("Error in CoT self-learning AI:", err);
      const errorMessage = err instanceof Error ? err.message : "Er ging iets mis bij de CoT AI analyse.";
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
        title: "Fout bij CoT systeem",
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
      if (lowerContent.includes('eenzaam')) return 'eenzaamheid';
      if (lowerContent.includes('onzeker')) return 'onzekerheid';
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
