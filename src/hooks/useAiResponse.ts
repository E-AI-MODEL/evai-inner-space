import { useState } from "react";
import { useSeedEngine } from "./useSeedEngine";
import { useOpenAISecondary, SecondaryAnalysis } from "./useOpenAISecondary";
import { useOpenAISeedGenerator } from "./useOpenAISeedGenerator";
import { useNeurosymbolicWorkflow } from "./useNeurosymbolicWorkflow";
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
    
    console.log('🔥 EvAI-ENHANCED NEUROSYMBOLIC MODE ACTIVATED 🔥');
    console.log('🔑 API Keys:', { hasOpenAI, hasOpenAi2, hasVectorAPI });

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
        console.log('🧠 FULL NEUROSYMBOLIC WORKFLOW');
        
        try {
          const neurosymbolicResult = await processNeurosymbolic(
            userMessage.content,
            apiKey,
            vectorApiKey,
            {
              messages: messages,
              userId: 'current-user', // Would be actual user ID in production
              conversationId: `conv-${Date.now()}`,
            }
          );

          console.log(`✅ Neurosymbolic result: ${neurosymbolicResult.responseType} (${(neurosymbolicResult.confidence * 100).toFixed(1)}%)`);

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

          const aiResp: Message = {
            id: `ai-neurosymbolic-${Date.now()}`,
            from: "ai",
            label: label,
            accentColor: getLabelVisuals(label).accentColor,
            content: `${neurosymbolicResult.response}\n\n*[🧠 NEUROSYMBOLIC: ${neurosymbolicResult.responseType.toUpperCase()} • ${(neurosymbolicResult.confidence * 100).toFixed(1)}% confidence • ${neurosymbolicResult.processingTime}ms]*`,
            explainText: neurosymbolicResult.reasoning,
            emotionSeed: neurosymbolicResult.seed?.emotion || null,
            animate: true,
            meta: `Neurosymbolic ${neurosymbolicResult.responseType}: ${(neurosymbolicResult.confidence * 100).toFixed(1)}%`,
            brilliant: true,
            timestamp: new Date(),
            replyTo: userMessage.id,
            feedback: null,
            symbolicInferences: [
              `🧠 Neurosymbolic Decision: ${neurosymbolicResult.responseType}`,
              `⚖️ Symbolic: ${(neurosymbolicResult.metadata.symbolicContribution * 100).toFixed(1)}% | Neural: ${(neurosymbolicResult.metadata.neuralContribution * 100).toFixed(1)}%`,
              `🎯 Confidence: ${(neurosymbolicResult.confidence * 100).toFixed(1)}%`,
              `⚡ Processing: ${neurosymbolicResult.processingTime}ms`,
              `🔍 Neural matches: ${neurosymbolicResult.metadata.neuralSimilarities || 0}`,
              neurosymbolicResult.reasoning
            ]
          };

          setMessages((prev) => [...prev, aiResp]);
          
          toast({
            title: "🧠 NEUROSYMBOLIC SUCCESS",
            description: `${neurosymbolicResult.responseType.toUpperCase()} response with ${(neurosymbolicResult.confidence * 100).toFixed(1)}% confidence`,
          });

          return;
        } catch (neurosymbolicError) {
          console.error('🔴 Neurosymbolic workflow failed, falling back:', neurosymbolicError);
          // Continue with existing enhanced workflow
        }
      }

      // FALLBACK: Original enhanced workflow
      console.log('🔄 Falling back to enhanced workflow...');

      // STAP 1: Pre-Analysis met OpenAI Secondary
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

      // STAP 2: EvAI 5.6 Rubrics Analysis
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

      // STAP 3: Enhanced CoT Feedback Learning
      if (messages.length > 1) {
        console.log('🧠 CoT FEEDBACK ANALYSIS...');
        try {
          const feedbackPatterns = await analyzeCoTFeedback(messages, apiKey);
          
          if (feedbackPatterns.length > 0) {
            console.log(`📊 CoT patterns found: ${feedbackPatterns.length}`);
            
            const improvements = await generateCoTImprovements(
              feedbackPatterns, 
              userMessage.content, 
              apiKey
            );
            
            if (improvements.length > 0) {
              console.log('🎯 CoT improvements generated:', improvements);
              cotRubricGuidance.push(...improvements);
            }
          }
        } catch (cotError) {
          console.error('🔴 CoT feedback analysis failed:', cotError);
        }
      }

      // AGGRESSIVE SEED GENERATION EN INJECTION
      let newSeedsGenerated = 0;
      const currentSeeds = await loadAdvancedSeeds();
      
      if (hasOpenAI) {
        console.log('🌱 AGGRESSIVE SEED GENERATION...');
        
        const emotionVariants = detectAllEmotions(userMessage.content, rubricsAssessments);
        console.log(`🎯 Detected ${emotionVariants.length} emotion variants:`, emotionVariants);
        
        for (const emotion of emotionVariants) {
          try {
            const existingSeed = currentSeeds.find(s => 
              s.emotion.toLowerCase() === emotion.toLowerCase()
            );
            
            if (!existingSeed) {
              console.log(`🚀 GENERATING SEED: "${emotion}"`);
              
              const rubricContext = cotRubricGuidance.length > 0
                ? ` | EvAI Guidance: ${cotRubricGuidance.join('; ')}`
                : '';
              const secondaryContext = secondaryInsights.length > 0
                ? ` | Secondary: ${secondaryInsights.join('; ')}`
                : '';
              
              const generatedSeed = await generateOpenAISeed({
                emotion,
                context: `EvAI LEARNING: "${userMessage.content}" | Risk: ${overallRisk.toFixed(1)}%${rubricContext}${secondaryContext}`,
                conversationHistory: history.slice(-2).map(h => h.content),
                severity: overallRisk > 70 ? 'critical' : overallRisk > 40 ? 'high' : 'medium'
              }, apiKey);
              
              if (generatedSeed) {
                const injected = await injectSeedToDatabase(generatedSeed);
                if (injected) {
                  newSeedsGenerated++;
                  console.log(`✅ SEED INJECTED: "${emotion}"`);

                  // Generate secondary seed if available
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

                        const secondaryInjected = await injectSeedToDatabase(secondarySeed);
                        if (secondaryInjected) {
                          newSeedsGenerated++;
                          console.log(`✅ Secondary seed injected: "${emotion}"`);
                        }
                      }
                    } catch (secError) {
                      console.error('🔴 Secondary seed generation failed:', secError);
                    }
                  }
                }
              }
            }
            
            await new Promise(resolve => setTimeout(resolve, 300));
          } catch (error) {
            console.error(`❌ Failed to generate seed for ${emotion}:`, error);
          }
        }
        
        // Refresh seeds after injection
        if (newSeedsGenerated > 0) {
          console.log('🔄 Refreshing seeds after injection...');
          await refetchSeeds();
        }
      }

      // STAP 5: Enhanced Seed Matching met Fresh Data
      console.log('🎯 ENHANCED SEED MATCHING...');
      const matchedResult = await checkInput(
        userMessage.content,
        apiKey,
        { ...context, secondaryInsights },
        history
      );

      let aiResp: Message;

      if (matchedResult && "confidence" in matchedResult) {
        // OpenAI result
        setSeedConfetti(true);
        
        const evaiNote = newSeedsGenerated > 0 
          ? `\n\n*[🔥 EvAI LEARNING: ${newSeedsGenerated} nieuwe patronen geleerd tijdens dit gesprek!]*`
          : `\n\n*[EvAI Enhanced: Rubrics-guided response + ${cotRubricGuidance.length} guidance patterns]*`;
        
        const label = matchedResult.label || "Valideren";
        aiResp = {
          id: `ai-evai-openai-${Date.now()}`,
          from: "ai",
          label: label,
          accentColor: getLabelVisuals(label).accentColor,
          content: `${matchedResult.response}${evaiNote}`,
          explainText: `${matchedResult.reasoning} | EvAI Risk: ${overallRisk.toFixed(1)}% | New Seeds: +${newSeedsGenerated}`,
          emotionSeed: matchedResult.emotion,
          animate: true,
          meta: `EvAI OpenAI: ${Math.round(matchedResult.confidence * 100)}% + ${newSeedsGenerated} seeds`,
          brilliant: true,
          timestamp: new Date(),
          replyTo: userMessage.id,
          feedback: null,
          symbolicInferences: [
            ...rubricInsights,
            ...cotRubricGuidance.map(guidance => `🧠 EvAI Guidance: ${guidance}`),
            `🌱 EvAI SEEDS: ${newSeedsGenerated} nieuwe patronen geleerd`,
            `🧠 OpenAI confidence: ${Math.round(matchedResult.confidence * 100)}%`
          ]
        };

      } else if (matchedResult) {
        // Advanced seed match - properly typed now
        const seedResult = matchedResult as AdvancedSeed;
        setSeedConfetti(true);
        
        const evaiNote = newSeedsGenerated > 0 
          ? `\n\n*[🌱 EvAI LEERPROCES: ${newSeedsGenerated} nieuwe patronen toegevoegd + seed toegepast!]*`
          : `\n\n*[EvAI Enhanced: Advanced seed + rubrics guidance]*`;
        
        // Handle the label mapping properly
        let label: "Valideren" | "Reflectievraag" | "Suggestie" = "Valideren";
        if (seedResult.label === "Reflectievraag") {
          label = "Reflectievraag";
        } else if (seedResult.label === "Suggestie") {
          label = "Suggestie";
        }
        // "Interventie" defaults to "Valideren" for backward compatibility
        
        aiResp = {
          id: `ai-evai-seed-${Date.now()}`,
          from: "ai",
          label: label,
          accentColor: getLabelVisuals(label).accentColor,
          content: `${seedResult.response.nl}${evaiNote}`,
          explainText: `EvAI Advanced Seed: ${seedResult.triggers?.join(", ") || ''} | Risk: ${overallRisk.toFixed(1)}% | New: +${newSeedsGenerated}`,
          emotionSeed: seedResult.emotion,
          animate: true,
          meta: `EvAI Seed: ${seedResult.meta?.weight?.toFixed(1) || '1.0'}x + ${newSeedsGenerated} new`,
          brilliant: true,
          timestamp: new Date(),
          replyTo: userMessage.id,
          feedback: null,
          symbolicInferences: [
            ...rubricInsights,
            ...cotRubricGuidance.map(guidance => `🧠 EvAI: ${guidance}`),
            `🌱 NEW SEEDS: ${newSeedsGenerated} generated with EvAI validation`,
            `🎯 Advanced matching: ${seedResult.triggers?.join(", ") || ''}`,
            `⚡ Usage count: ${seedResult.meta?.usageCount || 0} → ${(seedResult.meta?.usageCount || 0) + 1}`
          ]
        };

      } else {
        // Force generate new response
        if (hasOpenAI) {
          console.log('🎯 NO MATCH = FORCE GENERATE...');
          try {
            const dominantEmotion = detectAllEmotions(userMessage.content, rubricsAssessments)[0] || 'onzekerheid';
            const primaryGuidance = cotRubricGuidance[0] || 'emotionele validatie';

            const forcedSeed = await generateOpenAISeed({
              emotion: dominantEmotion,
              context: `EvAI FORCE LEARN: "${userMessage.content}" | Risk: ${overallRisk.toFixed(1)}% | Guidance: ${primaryGuidance}`,
              conversationHistory: history.slice(-2).map(h => h.content),
              severity: overallRisk > 70 ? 'critical' : overallRisk > 40 ? 'high' : 'medium'
            }, apiKey);
            
            if (forcedSeed) {
              const injected = await injectSeedToDatabase(forcedSeed);
              if (injected) {
                newSeedsGenerated++;
                // Refresh and immediately use the new seed
                await refetchSeeds();
                
                const mappedLabel: "Valideren" | "Reflectievraag" | "Suggestie" = 
                  forcedSeed.label === "Reflectievraag" ? "Reflectievraag" : 
                  forcedSeed.label === "Suggestie" ? "Suggestie" : "Valideren";
                
                aiResp = {
                  id: `ai-evai-force-${Date.now()}`,
                  from: "ai",
                  label: mappedLabel,
                  accentColor: getLabelVisuals(mappedLabel).accentColor,
                  content: `${forcedSeed.response.nl}\n\n*[🚀 EvAI REAL-TIME LEARNING: Nieuw "${dominantEmotion}" patroon direct toegepast!]*`,
                  explainText: `EvAI Force Learning: "${forcedSeed.emotion}" | Risk: ${overallRisk.toFixed(1)}% | Generated & Applied`,
                  emotionSeed: forcedSeed.emotion,
                  animate: true,
                  meta: `EvAI FORCE LEARNING: Immediate Pattern Application`,
                  brilliant: true,
                  timestamp: new Date(),
                  replyTo: userMessage.id,
                  feedback: null,
                  symbolicInferences: [
                    ...rubricInsights,
                    ...cotRubricGuidance.map(guidance => `🧠 EvAI Applied: ${guidance}`),
                    `🚀 FORCE LEARNING: "${forcedSeed.emotion}" pattern created & applied`,
                    `🌱 Total new seeds: ${newSeedsGenerated}`,
                    `⚡ Real-time EvAI adaptation: Learning → Application in same response`
                  ]
                };
                
                toast({
                  title: "🚀 EvAI FORCE LEARNING!",
                  description: `NIEUW: "${dominantEmotion}" direct geleerd en toegepast!`,
                });
              }
            }
          } catch (forceError) {
            console.error('🔴 Force learning failed:', forceError);
          }
        }

        // Fallback if force generation failed
        if (!aiResp) {
          const label = overallRisk > 50 ? "Suggestie" : "Valideren";
          const fallbackGuidance = cotRubricGuidance[0] || 'emotionele ondersteuning';
          
          aiResp = {
            id: `ai-evai-fallback-${Date.now()}`,
            from: "ai",
            label: label,
            accentColor: getLabelVisuals(label).accentColor,
            content: `Ik hoor je en leer van elk gesprek. ${newSeedsGenerated > 0 ? `Tijdens ons gesprek heb ik ${newSeedsGenerated} nieuwe patronen geleerd om je beter te kunnen helpen.` : 'Ik werk continu aan het verbeteren van mijn begrip.'} *[EvAI Learning: ${fallbackGuidance}]*`,
            explainText: `EvAI Learning Fallback | Risk: ${overallRisk.toFixed(1)}% | New Seeds: ${newSeedsGenerated}`,
            emotionSeed: null,
            animate: true,
            meta: `EvAI Learning: +${newSeedsGenerated} patterns`,
            brilliant: false,
            timestamp: new Date(),
            replyTo: userMessage.id,
            feedback: null,
            symbolicInferences: [
              ...rubricInsights,
              ...cotRubricGuidance.map(guidance => `🧠 EvAI: ${guidance}`),
              `🌱 Seeds generated: ${newSeedsGenerated}`,
              `🧠 EvAI learning continues with rubrics guidance`
            ]
          };
        }
      }

      // STAP 6: Enhanced OpenAI secondary integration
      if (hasOpenAi2) {
        console.log('🚀 OpenAI secondary enhancement...');
        try {
          const contextString = history.map(h => `${h.role}: ${h.content}`).join('\n');
          const evaiContext = cotRubricGuidance.length > 0 ? ` | EvAI: ${cotRubricGuidance.join('; ')}` : '';

          const analysis = await analyzeNeurosymbolic(
            userMessage.content + evaiContext,
            contextString,
            openAiKey2!
          );

          if (analysis) {
            aiResp.symbolicInferences = [
              ...(aiResp.symbolicInferences || []),
              ...analysis.patterns,
              ...analysis.insights
            ];
          }
        } catch (secondaryError) {
          console.error('🔴 Secondary enhancement failed:', secondaryError);
        }
      }

      // STAP 7: Symbolic rules evaluation
      try {
        const extendedMessages = [...messages, aiResp];
        const aiSymbolic = evaluateSymbolic(extendedMessages, aiResp);
        if (aiSymbolic.length) {
          aiResp.symbolicInferences = [...(aiResp.symbolicInferences || []), ...aiSymbolic];
        }
      } catch (symbolicError) {
        console.error('🔴 Symbolic evaluation failed:', symbolicError);
      }

      setMessages((prev) => [...prev, aiResp]);
      
      // Run secondary analysis in background
      if (hasOpenAi2) {
        runSecondaryAnalysis([...messages, aiResp], openAiKey2!);
      }
      
    } catch (err) {
      console.error("Error in EvAI enhanced AI:", err);
      const errorMessage = err instanceof Error ? err.message : "Er ging iets mis bij de EvAI enhanced AI.";
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
        title: "Fout bij EvAI processing",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

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
    
    // EvAI rubrics-based emotion mapping
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
    
    // Remove duplicates and return up to 4 emotions
    return [...new Set(emotions)].slice(0, 4);
  };

  return { 
    generateAiResponse, 
    isGenerating: isProcessing || isSeedEngineLoading || isAnalyzing || isOpenAIGenerating || isCoTAnalyzing
  };
}
