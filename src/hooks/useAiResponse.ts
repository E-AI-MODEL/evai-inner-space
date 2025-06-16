import { useState } from "react";
import { useSeedEngine } from "./useSeedEngine";
import { useOpenAISecondary, SecondaryAnalysis } from "./useOpenAISecondary";
import { useOpenAISeedGenerator } from "./useOpenAISeedGenerator";
import { v4 as uuidv4 } from "uuid";
import { AdvancedSeed } from "../types/seed";
import { useEvAI56Rubrics, RubricAssessment } from "./useEvAI56Rubrics";
import { useCoTFeedbackAnalyzer } from "./useCoTFeedbackAnalyzer";
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

  const generateAiResponse = async (
    userMessage: Message,
    context?: { dislikedLabel?: "Valideren" | "Reflectievraag" | "Suggestie" }
  ) => {
    setIsProcessing(true);
    
    const openAiKey2 = localStorage.getItem('openai-api-key-2');
    const hasOpenAI = apiKey && apiKey.trim().length > 0;
    const hasOpenAi2 = openAiKey2 && openAiKey2.trim().length > 0;
    
    console.log('🔥 ULTRA AGGRESSIVE EvAI-ENHANCED LEARNING MODE ACTIVATED 🔥');

    try {
      const messageIndex = messages.findIndex(m => m.id === userMessage.id);
      const history: ChatHistoryItem[] = messages
        .slice(0, messageIndex >= 0 ? messageIndex : messages.length)
        .map(msg => ({
          role: msg.from === 'user' ? 'user' : 'assistant',
          content: msg.content
        }));

      // 🔥 STEP 1: Enhanced EvAI 5.6 Rubrics Analysis with CoT Integration
      console.log('📊 Running Enhanced EvAI 5.6 Rubrics analysis with CoT integration...');
      const rubricsAssessments = assessMessage(userMessage.content);
      const overallRisk = calculateOverallRisk(rubricsAssessments);
      
      let rubricInsights: string[] = [];
      const cotRubricGuidance: string[] = [];
      
      if (rubricsAssessments.length > 0) {
        rubricInsights = rubricsAssessments.map(assessment => {
          const rubricData = evai56Rubrics.find(r => r.id === assessment.rubricId);
          
          // Generate CoT guidance based on rubric
          if (rubricData && assessment.riskScore > 1) {
            const intervention = rubricData.interventions[0];
            cotRubricGuidance.push(`${rubricData.name}: ${intervention}`);
          }
          
          return `${assessment.rubricId}: Risk ${assessment.riskScore.toFixed(1)}, Protective ${assessment.protectiveScore.toFixed(1)}`;
        });
        
        console.log(`🎯 EvAI detected ${rubricsAssessments.length} areas, overall risk: ${overallRisk.toFixed(1)}%`);
        console.log(`🧠 CoT Rubric Guidance: ${cotRubricGuidance.join('; ')}`);
      }

      // 🔥 STEP 2: Enhanced CoT Feedback Learning with Rubrics
      if (messages.length > 1) {
        console.log('🧠 EvAI-Enhanced CoT FEEDBACK ANALYSIS...');
        try {
          const feedbackPatterns = await analyzeCoTFeedback(messages, apiKey);
          
          if (feedbackPatterns.length > 0) {
            console.log(`📊 EvAI CoT patterns found: ${feedbackPatterns.length}`);
            
            // Generate rubrics-validated improvements
            const improvements = await generateCoTImprovements(
              feedbackPatterns, 
              userMessage.content, 
              apiKey
            );
            
            if (improvements.length > 0) {
              console.log('🎯 EvAI-validated CoT improvements generated:', improvements);
              cotRubricGuidance.push(...improvements);
            }
          }
        } catch (cotError) {
          console.error('🔴 EvAI CoT feedback analysis failed:', cotError);
        }
      }

      // 🔥 STEP 3: AGGRESSIVE RUBRICS-GUIDED SEED ANALYSIS & GENERATION
      let newSeedsGenerated = 0;
      const currentSeeds = loadAdvancedSeeds();
      
      if (hasOpenAI) {
        console.log('🌱 EXTREME AGGRESSIVE MODE: EvAI-Guided emotion analysis...');
        
        // Enhanced emotion detection with rubrics integration
        const emotionVariants = detectAllEmotions(userMessage.content, rubricsAssessments);
        console.log(`🎯 EvAI-Enhanced detected ${emotionVariants.length} emotion variants:`, emotionVariants);
        
        for (const emotion of emotionVariants) {
          try {
            const existingSeed = currentSeeds.find(s => 
              s.emotion.toLowerCase() === emotion.toLowerCase()
            );
            
            if (!existingSeed) {
              console.log(`🚀 GENERATING EvAI-VALIDATED SEED: "${emotion}"`);
              
              // Enhanced context with rubrics guidance
              const rubricContext = cotRubricGuidance.length > 0 
                ? ` | EvAI Guidance: ${cotRubricGuidance.join('; ')}`
                : '';
              
              const generatedSeed = await generateOpenAISeed({
                emotion,
                context: `EvAI 5.6 ULTRA LEARNING: "${userMessage.content}" | Risk: ${overallRisk.toFixed(1)}% | Rubrics-Validated${rubricContext}`,
                conversationHistory: history.slice(-2).map(h => h.content),
                severity: overallRisk > 70 ? 'critical' : overallRisk > 40 ? 'high' : 'medium'
              }, apiKey);
              
              if (generatedSeed) {
                await injectSeedToDatabase(generatedSeed);
                newSeedsGenerated++;
                console.log(`✅ EvAI-VALIDATED SEED INJECTED: "${emotion}"`);

                toast({
                  title: "🌱 EvAI LEERMODE: Nieuwe Rubrics-Seed!",
                  description: `"${emotion}" geleerd met EvAI validatie!`,
                });

                // 👉 NEW: Generate additional seed with OpenAI secondary
                if (hasOpenAi2) {
                  try {
                    const secondaryText = await generateSeed(
                      emotion,
                      userMessage.content,
                      openAiKey2!
                    );
                    if (secondaryText) {
                      const secondarySeed: AdvancedSeed = {
                        id: uuidv4(),
                        emotion,
                        type: 'validation',
                        label: 'Valideren',
                        triggers: [emotion],
                        response: { nl: secondaryText },
                        context: {
                          severity: overallRisk > 70 ? 'critical' : overallRisk > 40 ? 'high' : 'medium',
                          situation: 'therapy'
                        },
                        meta: {
                          priority: 1,
                          weight: 1.0,
                          confidence: 0.75,
                          usageCount: 0
                        },
                        tags: ['openai-secondary', 'auto-generated'],
                        createdAt: new Date(),
                        updatedAt: new Date(),
                        createdBy: 'ai',
                        isActive: true,
                        version: '1.0.0'
                      };

                      await injectSeedToDatabase(secondarySeed);
                      newSeedsGenerated++;
                      console.log(`✅ OpenAI secondary seed injected: "${emotion}"`);
                    }
                  } catch (secError) {
                    console.error('🔴 OpenAI secondary seed generation failed:', secError);
                  }
                }
              }
            }
            
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (error) {
            console.error(`❌ Failed to generate EvAI seed for ${emotion}:`, error);
          }
        }
        
        // 🔥 STEP 4: EvAI-GUIDED CONVERSATION GAP ANALYSIS
        console.log('🔍 EvAI-GUIDED CONVERSATION GAP ANALYSIS...');
        try {
          const missingEmotions = await analyzeConversationForSeeds(messages, apiKey);
          
          if (missingEmotions.length > 0) {
            console.log(`🎯 EvAI MISSING EMOTIONS FOUND: ${missingEmotions.length}`);
            
            const priorityEmotion = missingEmotions[0];
            const rubricGuidanceContext = cotRubricGuidance.length > 0 
              ? ` | EvAI Interventions: ${cotRubricGuidance.slice(0, 2).join('; ')}`
              : '';
              
            const learningSeed = await generateOpenAISeed({
              emotion: priorityEmotion,
              context: `EvAI GAP ANALYSIS: Missing from conversation patterns | Risk: ${overallRisk.toFixed(1)}%${rubricGuidanceContext}`,
              conversationHistory: history.slice(-3).map(h => h.content),
              severity: overallRisk > 60 ? 'high' : 'medium'
            }, apiKey);

            if (learningSeed) {
              await injectSeedToDatabase(learningSeed);
              newSeedsGenerated++;
              console.log(`✅ EvAI GAP FILLED: New rubrics-validated seed "${priorityEmotion}" generated`);
            }
          }
        } catch (gapError) {
          console.error('🔴 EvAI gap analysis failed:', gapError);
        }
      }

      // 🔥 STEP 5: Enhanced Seed Matching with EvAI Integration
      const matchedResult = await checkInput(userMessage.content, apiKey, context, history);
      let aiResp: Message;

      if (matchedResult && "confidence" in matchedResult) {
        // OpenAI seed match - Enhanced with EvAI learning context
        setSeedConfetti(true);
        
        const evaiEnhancement = cotRubricGuidance.length > 0 
          ? `\n\n*[EvAI Enhanced: ${cotRubricGuidance[0]} + ${newSeedsGenerated} nieuwe rubrics-patronen]*`
          : `\n\n*[EvAI Evolution: ${newSeedsGenerated} nieuwe patronen geleerd + toegepast]*`;
        
        const label = matchedResult.label || "Valideren";
        aiResp = {
          id: `ai-evai-learning-${Date.now()}`,
          from: "ai",
          label: label,
          accentColor: getLabelVisuals(label).accentColor,
          content: `${matchedResult.response}${evaiEnhancement}`,
          explainText: `${matchedResult.reasoning} | EvAI Risk: ${overallRisk.toFixed(1)}% | Seeds: +${newSeedsGenerated}`,
          emotionSeed: matchedResult.emotion,
          animate: true,
          meta: `EvAI LEARNING: +${newSeedsGenerated} rubrics-seeds – ${Math.round(matchedResult.confidence * 100)}%`,
          brilliant: true,
          timestamp: new Date(),
          replyTo: userMessage.id,
          feedback: null,
          symbolicInferences: [
            ...rubricInsights,
            ...cotRubricGuidance.map(guidance => `🧠 EvAI CoT: ${guidance}`),
            `🌱 EvAI SEEDS: ${newSeedsGenerated} rubrics-validated patterns learned`,
            `🎯 Total seeds: ${currentSeeds.length + newSeedsGenerated}`,
            `🔥 EvAI ULTRA LEARNING: Active rubrics-guided pattern recognition`,
            `📊 Risk-adapted learning: ${overallRisk.toFixed(1)}%`
          ]
        };

      } else if (matchedResult) {
        // Advanced seed match with EvAI enhancement
        const seedResult = matchedResult;
        setSeedConfetti(true);
        
        const evaiNote = cotRubricGuidance.length > 0 
          ? `\n\n*[EvAI Guidance: ${cotRubricGuidance[0]} + ${newSeedsGenerated} nieuwe rubrics-patronen]*`
          : `\n\n*[EvAI Leerproces: ${newSeedsGenerated} nieuwe patronen tijdens dit gesprek]*`;
        
        const label = seedResult.label || "Valideren";
        aiResp = {
          id: `ai-evai-seed-learning-${Date.now()}`,
          from: "ai",
          label: label,
          accentColor: getLabelVisuals(label).accentColor,
          content: `${seedResult.response}${evaiNote}`,
          explainText: `EvAI Advanced Seed + Learning: ${seedResult.triggers.join(", ")} | Risk: ${overallRisk.toFixed(1)}%`,
          emotionSeed: seedResult.emotion,
          animate: true,
          meta: `EvAI Seed Evolution: +${newSeedsGenerated} – Rubrics Active`,
          brilliant: true,
          timestamp: new Date(),
          replyTo: userMessage.id,
          feedback: null,
          symbolicInferences: [
            ...rubricInsights,
            ...cotRubricGuidance.map(guidance => `🧠 EvAI Guidance: ${guidance}`),
            `🌱 EvAI NEW SEEDS: ${newSeedsGenerated} generated with rubrics validation`,
            `🧠 Advanced matching + continuous EvAI learning`,
            `📈 Database growth: ${currentSeeds.length} → ${currentSeeds.length + newSeedsGenerated}`
          ]
        };

      } else {
        // Force generate with EvAI guidance
        if (hasOpenAI) {
          console.log('🎯 EvAI NO MATCH = LEARNING OPPORTUNITY: Force generating with rubrics guidance...');
          try {
            const dominantEmotion = detectAllEmotions(userMessage.content, rubricsAssessments)[0] || 'onzekerheid';
            const primaryGuidance = cotRubricGuidance[0] || 'emotionele validatie';

            const forcedSeed = await generateOpenAISeed({
              emotion: dominantEmotion,
              context: `EvAI FORCE LEARN: No existing pattern for "${userMessage.content}" | Risk: ${overallRisk.toFixed(1)}% | Guidance: ${primaryGuidance}`,
              conversationHistory: history.slice(-2).map(h => h.content),
              severity: overallRisk > 70 ? 'critical' : overallRisk > 40 ? 'high' : 'medium'
            }, apiKey);
            
            if (forcedSeed) {
              await injectSeedToDatabase(forcedSeed);
              newSeedsGenerated++;
              
              const mappedLabel: "Valideren" | "Reflectievraag" | "Suggestie" = 
                forcedSeed.label === "Interventie" ? "Suggestie" : forcedSeed.label as "Valideren" | "Reflectievraag" | "Suggestie";
              
              aiResp = {
                id: `ai-evai-force-learn-${Date.now()}`,
                from: "ai",
                label: mappedLabel,
                accentColor: getLabelVisuals(mappedLabel).accentColor,
                content: `${forcedSeed.response.nl}\n\n*[🔥 EvAI REAL-TIME LEREN: Nieuw "${dominantEmotion}" patroon met rubrics-validatie direct toegepast!]*`,
                explainText: `EvAI Force Learning: New "${forcedSeed.emotion}" pattern | Risk: ${overallRisk.toFixed(1)}% | Guidance: ${primaryGuidance}`,
                emotionSeed: forcedSeed.emotion,
                animate: true,
                meta: `EvAI FORCE LEARNING: Immediate Rubrics-Validated Pattern`,
                brilliant: true,
                timestamp: new Date(),
                replyTo: userMessage.id,
                feedback: null,
                symbolicInferences: [
                  ...rubricInsights,
                  ...cotRubricGuidance.map(guidance => `🧠 EvAI Applied: ${guidance}`),
                  `🚀 EvAI FORCE LEARNING: "${forcedSeed.emotion}" pattern created with rubrics validation`,
                  `🌱 Total new seeds: ${newSeedsGenerated}`,
                  `🧠 Real-time EvAI adaptation: Learning from every interaction`,
                  `📊 Risk-responsive with rubrics: ${overallRisk.toFixed(1)}% severity`,
                  `⚡ Instant EvAI application: Pattern learned and validated immediately`
                ]
              };
              
              toast({
                title: "🚀 EvAI FORCE LEARNING!",
                description: `NIEUW: "${dominantEmotion}" direct geleerd met rubrics validatie!`,
              });
            }
          } catch (forceError) {
            console.error('🔴 EvAI force learning failed:', forceError);
            // Enhanced fallback with EvAI context
            const label = overallRisk > 50 ? "Suggestie" : "Valideren";
            const fallbackGuidance = cotRubricGuidance[0] || 'emotionele ondersteuning';
            
            aiResp = {
              id: `ai-evai-learning-fallback-${Date.now()}`,
              from: "ai",
              label: label,
              accentColor: getLabelVisuals(label).accentColor,
              content: `Ik hoor je en leer van elk gesprek met EvAI 5.6 rubrics. Zelfs als ik nog geen perfect patroon heb, werk ik eraan om je beter te begrijpen met therapeutische validatie. *[EvAI Learning: ${newSeedsGenerated} rubrics-patronen toegevoegd + ${fallbackGuidance}]*`,
              explainText: `EvAI Learning Fallback | Risk: ${overallRisk.toFixed(1)}% | Guidance: ${fallbackGuidance} | New Seeds: ${newSeedsGenerated}`,
              emotionSeed: null,
              animate: true,
              meta: `EvAI Learning Fallback: +${newSeedsGenerated} rubrics-seeds`,
              brilliant: false,
              timestamp: new Date(),
              replyTo: userMessage.id,
              feedback: null,
              symbolicInferences: [
                ...rubricInsights,
                ...cotRubricGuidance.map(guidance => `🧠 EvAI Fallback: ${guidance}`),
                `🌱 EvAI seeds generated: ${newSeedsGenerated}`,
                `🧠 EvAI learning continues even in fallback mode with rubrics guidance`
              ]
            };
          }
        }
      }

      // 🔥 STEP 6: Enhanced OpenAI secondary integration with EvAI context
      if (hasOpenAi2) {
        console.log('🚀 Running OpenAI secondary enhancement with EvAI context...');
        let geminiAnalysis: SecondaryAnalysis | null = null;
        try {
          const contextString = history.map(h => `${h.role}: ${h.content}`).join('\n');
          const evaiContext = cotRubricGuidance.length > 0 ? ` | EvAI Guidance: ${cotRubricGuidance.join('; ')}` : '';

          geminiAnalysis = await analyzeNeurosymbolic(
            userMessage.content + evaiContext,
            contextString,
            openAiKey2!
          );
        } catch (geminiError) {
          console.error('🔴 OpenAI secondary enhancement failed:', geminiError);
        }

        if (geminiAnalysis) {
          aiResp.symbolicInferences = [
            ...(aiResp.symbolicInferences || []),
            ...geminiAnalysis.patterns,
            ...geminiAnalysis.insights
          ];
        } else {
          aiResp.symbolicInferences = [
            ...(aiResp.symbolicInferences || []),
            'Geen resultaten van secundaire analyse'
          ];
        }
      }

      // 🔥 STEP 7: Enhanced Symbolic rules evaluation with EvAI safety check
      try {
        const extendedMessages = [...messages, aiResp];
        const aiSymbolic = evaluateSymbolic(extendedMessages, aiResp);
        if (aiSymbolic.length) {
          aiResp.symbolicInferences = [...(aiResp.symbolicInferences || []), ...aiSymbolic];
        }
      } catch (symbolicError) {
        console.error('🔴 Symbolic evaluation failed:', symbolicError);
      }

      // 🔥 FINAL EvAI SUCCESS NOTIFICATION
      const finalSeedCount = loadAdvancedSeeds().length;
      console.log(`✅ EvAI ULTRA LEARNING COMPLETE: Generated ${newSeedsGenerated} new rubrics-validated seeds | Total: ${finalSeedCount}`);
      
      if (hasOpenAI && newSeedsGenerated > 0) {
        toast({
          title: "🔥 EvAI ULTRA LEARNING MODE",
          description: `${newSeedsGenerated} nieuwe rubrics-patronen geleerd! Totaal: ${finalSeedCount}`,
        });
      }

      setMessages((prev) => [...prev, aiResp]);
      
    } catch (err) {
      console.error("Error in EvAI ultra learning AI:", err);
      const errorMessage = err instanceof Error ? err.message : "Er ging iets mis bij de EvAI ultra learning AI.";
      const errorResponse: Message = {
        id: `ai-evai-error-${Date.now()}`,
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
        title: "Fout bij EvAI ultra learning",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Enhanced emotion detection function with EvAI rubrics integration
  const detectAllEmotions = (content: string, assessments: RubricAssessment[]): string[] => {
    const emotions: string[] = [];
    const lowerContent = content.toLowerCase();
    
    // Base emotion detection
    if (lowerContent.includes('bang') || lowerContent.includes('angst') || lowerContent.includes('angstig')) emotions.push('angst');
    if (lowerContent.includes('verdriet') || lowerContent.includes('huil') || lowerContent.includes('triest')) emotions.push('verdriet');
    if (lowerContent.includes('boos') || lowerContent.includes('woede') || lowerContent.includes('kwaad')) emotions.push('woede');
    if (lowerContent.includes('stress') || lowerContent.includes('druk') || lowerContent.includes('gespannen')) emotions.push('stress');
    if (lowerContent.includes('eenzaam') || lowerContent.includes('alleen')) emotions.push('eenzaamheid');
    if (lowerContent.includes('onzeker') || lowerContent.includes('twijfel')) emotions.push('onzekerheid');
    if (lowerContent.includes('schuld') || lowerContent.includes('spijt')) emotions.push('schuld');
    if (lowerContent.includes('schaam') || lowerContent.includes('beschaamd')) emotions.push('schaamte');
    if (lowerContent.includes('teleur') || lowerContent.includes('ontgoochel')) emotions.push('teleurstelling');
    if (lowerContent.includes('overweldig') || lowerContent.includes('teveel')) emotions.push('overweldiging');
    if (lowerContent.includes('moe') || lowerContent.includes('uitgeput')) emotions.push('uitputting');
    if (lowerContent.includes('hopeloos') || lowerContent.includes('geen hoop')) emotions.push('hopeloosheid');
    
    // Enhanced EvAI rubrics-based emotion mapping
    if (assessments.length > 0) {
      const emotionMap: Record<string, string> = {
        'emotional-regulation': 'emotionele disregulatie',
        'self-awareness': 'zelfbeeld problemen', 
        'coping-strategies': 'coping problemen',
        'social-connection': 'sociale isolatie',
        'meaning-purpose': 'zingevingsproblemen'
      };
      
      assessments.forEach(assessment => {
        if (assessment.riskScore > 1) {
          const mappedEmotion = emotionMap[assessment.rubricId];
          if (mappedEmotion) {
            emotions.push(mappedEmotion);
            // Add specific triggers as emotions for more precise matching
            if (assessment.triggers.length > 0) {
              emotions.push(...assessment.triggers.slice(0, 2));
            }
          }
        }
      });
    }
    
    // Always return at least one emotion
    if (emotions.length === 0) {
      emotions.push('onzekerheid');
    }
    
    // Remove duplicates and return up to 4 emotions per message (increased for EvAI)
    return [...new Set(emotions)].slice(0, 4);
  };

  return { 
    generateAiResponse, 
    isGenerating: isProcessing || isSeedEngineLoading || isAnalyzing || isOpenAIGenerating || isCoTAnalyzing
  };
}
