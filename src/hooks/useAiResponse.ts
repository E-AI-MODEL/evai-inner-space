
import { useState } from "react";
import { useSeedEngine, Seed } from "./useSeedEngine";
import { useGoogleGemini } from "./useGoogleGemini";
import { useOpenAISeedGenerator } from "./useOpenAISeedGenerator";
import { useEvAI56Rubrics } from "./useEvAI56Rubrics";
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
  const { analyzeNeurosymbolic, generateSeed, isAnalyzing } = useGoogleGemini();
  const { 
    generateSeed: generateOpenAISeed, 
    analyzeConversationForSeeds, 
    injectSeedToDatabase,
    isGenerating: isOpenAIGenerating 
  } = useOpenAISeedGenerator();
  const { assessMessage, calculateOverallRisk } = useEvAI56Rubrics();
  const { evaluate: evaluateSymbolic } = useSymbolicEngine();
  const { analyzeCoTFeedback, generateCoTImprovements, isAnalyzing: isCoTAnalyzing } = useCoTFeedbackAnalyzer();

  const generateAiResponse = async (
    userMessage: Message,
    context?: { dislikedLabel?: "Valideren" | "Reflectievraag" | "Suggestie" }
  ) => {
    setIsProcessing(true);
    
    const googleApiKey = localStorage.getItem('google-api-key');
    const hasOpenAI = apiKey && apiKey.trim().length > 0;
    const hasGoogle = googleApiKey && googleApiKey.trim().length > 0;
    
    console.log('🔥 ULTRA AGGRESSIVE LEARNING MODE ACTIVATED 🔥');

    try {
      const messageIndex = messages.findIndex(m => m.id === userMessage.id);
      const history: ChatHistoryItem[] = messages
        .slice(0, messageIndex >= 0 ? messageIndex : messages.length)
        .map(msg => ({
          role: msg.from === 'user' ? 'user' : 'assistant',
          content: msg.content
        }));

      // 🔥 STEP 1: EvAI 5.6 Rubrics Analysis
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

      // 🔥 STEP 2: AGGRESSIVE SEED ANALYSIS & GENERATION
      let newSeedsGenerated = 0;
      const currentSeeds = loadAdvancedSeeds();
      
      if (hasOpenAI) {
        console.log('🌱 EXTREME AGGRESSIVE MODE: Analyzing EVERY emotion possibility...');
        
        // Generate multiple seeds per message based on different emotion aspects
        const emotionVariants = detectAllEmotions(userMessage.content, rubricsAssessments);
        console.log(`🎯 Detected ${emotionVariants.length} emotion variants:`, emotionVariants);
        
        for (const emotion of emotionVariants) {
          try {
            // Check if this exact emotion exists
            const existingSeed = currentSeeds.find(s => 
              s.emotion.toLowerCase() === emotion.toLowerCase()
            );
            
            if (!existingSeed) {
              console.log(`🚀 GENERATING NEW SEED: "${emotion}"`);
              
              const generatedSeed = await generateOpenAISeed({
                emotion,
                context: `ULTRA LEARNING: "${userMessage.content}" | Risk: ${overallRisk.toFixed(1)}% | Conversation Learning`,
                conversationHistory: history.slice(-2).map(h => h.content),
                severity: overallRisk > 70 ? 'critical' : overallRisk > 40 ? 'high' : 'medium'
              }, apiKey);
              
              if (generatedSeed) {
                await injectSeedToDatabase(generatedSeed);
                newSeedsGenerated++;
                console.log(`✅ NEW SEED INJECTED: "${emotion}"`);
                
                toast({
                  title: "🌱 LEERMODE: Nieuwe Seed!",
                  description: `"${emotion}" geleerd en toegevoegd!`,
                });
              }
            }
            
            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (error) {
            console.error(`❌ Failed to generate seed for ${emotion}:`, error);
          }
        }
        
        // 🔥 STEP 3: CoT FEEDBACK LEARNING
        if (messages.length > 1) {
          console.log('🧠 CoT FEEDBACK ANALYSIS...');
          try {
            const feedbackPatterns = await analyzeCoTFeedback(messages, apiKey);
            
            if (feedbackPatterns.length > 0) {
              console.log(`📊 CoT patterns found: ${feedbackPatterns.length}`);
              
              // Generate improvements based on feedback
              const improvements = await generateCoTImprovements(
                feedbackPatterns, 
                userMessage.content, 
                apiKey
              );
              
              if (improvements.length > 0) {
                console.log('🎯 CoT improvements generated:', improvements);
              }
            }
          } catch (cotError) {
            console.error('🔴 CoT feedback analysis failed:', cotError);
          }
        }
        
        // 🔥 STEP 4: CONVERSATION GAP ANALYSIS
        console.log('🔍 ANALYZING CONVERSATION GAPS...');
        try {
          const missingEmotions = await analyzeConversationForSeeds(messages, apiKey);
          
          if (missingEmotions.length > 0) {
            console.log(`🎯 MISSING EMOTIONS FOUND: ${missingEmotions.length}`);
            
            // Generate seed for highest priority missing emotion
            const priorityEmotion = missingEmotions[0];
            const learningSeed = await generateOpenAISeed({
              emotion: priorityEmotion,
              context: `GAP ANALYSIS: Missing from conversation patterns | Risk: ${overallRisk.toFixed(1)}%`,
              conversationHistory: history.slice(-3).map(h => h.content),
              severity: overallRisk > 60 ? 'high' : 'medium'
            }, apiKey);

            if (learningSeed) {
              await injectSeedToDatabase(learningSeed);
              newSeedsGenerated++;
              console.log(`✅ GAP FILLED: New seed "${priorityEmotion}" generated`);
            }
          }
        } catch (gapError) {
          console.error('🔴 Gap analysis failed:', gapError);
        }
      }

      // 🔥 STEP 5: Enhanced Seed Matching
      const matchedResult = await checkInput(userMessage.content, apiKey, context, history);
      let aiResp: Message;

      if (matchedResult && "confidence" in matchedResult) {
        // OpenAI seed match - Enhanced with learning context
        setSeedConfetti(true);
        
        const enhancedResponse = `${matchedResult.response}\n\n*[AI Evolution: ${newSeedsGenerated} nieuwe patronen geleerd + toegepast]*`;
        
        const label = matchedResult.label || "Valideren";
        aiResp = {
          id: `ai-learning-${Date.now()}`,
          from: "ai",
          label: label,
          accentColor: getLabelVisuals(label).accentColor,
          content: enhancedResponse,
          explainText: `${matchedResult.reasoning} | Risk: ${overallRisk.toFixed(1)}% | Seeds: +${newSeedsGenerated}`,
          emotionSeed: matchedResult.emotion,
          animate: true,
          meta: `LEARNING MODE: +${newSeedsGenerated} seeds – ${Math.round(matchedResult.confidence * 100)}%`,
          brilliant: true,
          timestamp: new Date(),
          replyTo: userMessage.id,
          feedback: null,
          symbolicInferences: [
            ...rubricInsights,
            `🌱 NEUE SEEDS: ${newSeedsGenerated} patterns learned this session`,
            `🧠 Total seeds: ${currentSeeds.length + newSeedsGenerated}`,
            `🔥 ULTRA LEARNING: Active pattern recognition`,
            `📊 Risk-adapted learning: ${overallRisk.toFixed(1)}%`,
            `🚀 CoT Evolution: Continuous improvement cycle`
          ]
        };

      } else if (matchedResult) {
        // Advanced seed match
        const seedResult = matchedResult;
        setSeedConfetti(true);
        
        const label = seedResult.label || "Valideren";
        aiResp = {
          id: `ai-seed-learning-${Date.now()}`,
          from: "ai",
          label: label,
          accentColor: getLabelVisuals(label).accentColor,
          content: `${seedResult.response}\n\n*[Leerproces: ${newSeedsGenerated} nieuwe patronen tijdens dit gesprek]*`,
          explainText: `Advanced Seed + Learning: ${seedResult.triggers.join(", ")} | Risk: ${overallRisk.toFixed(1)}%`,
          emotionSeed: seedResult.emotion,
          animate: true,
          meta: `Seed Evolution: +${newSeedsGenerated} – Learning Active`,
          brilliant: true,
          timestamp: new Date(),
          replyTo: userMessage.id,
          feedback: null,
          symbolicInferences: [
            ...rubricInsights,
            `🌱 NEW SEEDS: ${newSeedsGenerated} generated this interaction`,
            `🧠 Advanced matching + continuous learning`,
            `📈 Database growth: ${currentSeeds.length} → ${currentSeeds.length + newSeedsGenerated}`
          ]
        };

      } else {
        // 🔥 FORCE GENERATE - No match means immediate learning opportunity
        if (hasOpenAI) {
          console.log('🎯 NO MATCH = LEARNING OPPORTUNITY: Force generating...');
          try {
            const dominantEmotion = detectAllEmotions(userMessage.content, rubricsAssessments)[0] || 'onzekerheid';

            const forcedSeed = await generateOpenAISeed({
              emotion: dominantEmotion,
              context: `FORCE LEARN: No existing pattern for "${userMessage.content}" | Risk: ${overallRisk.toFixed(1)}%`,
              conversationHistory: history.slice(-2).map(h => h.content),
              severity: overallRisk > 70 ? 'critical' : overallRisk > 40 ? 'high' : 'medium'
            }, apiKey);
            
            if (forcedSeed) {
              await injectSeedToDatabase(forcedSeed);
              newSeedsGenerated++;
              
              const mappedLabel: "Valideren" | "Reflectievraag" | "Suggestie" = 
                forcedSeed.label === "Interventie" ? "Suggestie" : forcedSeed.label as "Valideren" | "Reflectievraag" | "Suggestie";
              
              aiResp = {
                id: `ai-force-learn-${Date.now()}`,
                from: "ai",
                label: mappedLabel,
                accentColor: getLabelVisuals(mappedLabel).accentColor,
                content: `${forcedSeed.response.nl}\n\n*[🔥 REAL-TIME LEREN: Nieuw patroon "${dominantEmotion}" gegenereerd en direct toegepast!]*`,
                explainText: `Force Learning: New "${forcedSeed.emotion}" pattern | Risk: ${overallRisk.toFixed(1)}%`,
                emotionSeed: forcedSeed.emotion,
                animate: true,
                meta: `FORCE LEARNING: Immediate Pattern Generation`,
                brilliant: true,
                timestamp: new Date(),
                replyTo: userMessage.id,
                feedback: null,
                symbolicInferences: [
                  ...rubricInsights,
                  `🚀 FORCE LEARNING: "${forcedSeed.emotion}" pattern created`,
                  `🌱 Total new seeds: ${newSeedsGenerated}`,
                  `🧠 Real-time adaptation: Learning from every interaction`,
                  `📊 Risk-responsive: ${overallRisk.toFixed(1)}% severity`,
                  `⚡ Instant application: Pattern learned and used immediately`
                ]
              };
              
              toast({
                title: "🚀 FORCE LEARNING!",
                description: `NIEUW: "${dominantEmotion}" direct geleerd en toegepast!`,
              });
            }
          } catch (forceError) {
            console.error('🔴 Force learning failed:', forceError);
            // Fallback response
            const label = overallRisk > 50 ? "Suggestie" : "Valideren";
            aiResp = {
              id: `ai-learning-fallback-${Date.now()}`,
              from: "ai",
              label: label,
              accentColor: getLabelVisuals(label).accentColor,
              content: `Ik hoor je en leer van elk gesprek. Zelfs als ik nog geen perfect patroon heb, werk ik eraan om je beter te begrijpen. *[Learning Mode: ${newSeedsGenerated} patronen toegevoegd tijdens dit gesprek]*`,
              explainText: `Learning Fallback | Risk: ${overallRisk.toFixed(1)}% | New Seeds: ${newSeedsGenerated}`,
              emotionSeed: null,
              animate: true,
              meta: `Learning Fallback: +${newSeedsGenerated} seeds`,
              brilliant: false,
              timestamp: new Date(),
              replyTo: userMessage.id,
              feedback: null,
              symbolicInferences: [
                ...rubricInsights,
                `🌱 Seeds generated: ${newSeedsGenerated}`,
                `🧠 Learning continues even in fallback mode`
              ]
            };
          }
        }
      }

      // 🔥 STEP 6: Enhanced Google Gemini integration
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
          }
        } catch (geminiError) {
          console.error('🔴 Google Gemini enhancement failed:', geminiError);
        }
      }

      // 🔥 STEP 7: Symbolic rules evaluation with safety check
      try {
        const extendedMessages = [...messages, aiResp];
        const aiSymbolic = evaluateSymbolic(extendedMessages, aiResp);
        if (aiSymbolic.length) {
          aiResp.symbolicInferences = [...(aiResp.symbolicInferences || []), ...aiSymbolic];
        }
      } catch (symbolicError) {
        console.error('🔴 Symbolic evaluation failed:', symbolicError);
      }

      // 🔥 FINAL SUCCESS NOTIFICATION
      const finalSeedCount = loadAdvancedSeeds().length;
      console.log(`✅ ULTRA LEARNING COMPLETE: Generated ${newSeedsGenerated} new seeds | Total: ${finalSeedCount}`);
      
      if (hasOpenAI && newSeedsGenerated > 0) {
        toast({
          title: "🔥 ULTRA LEARNING MODE",
          description: `${newSeedsGenerated} nieuwe patronen geleerd! Totaal: ${finalSeedCount}`,
        });
      }

      setMessages((prev) => [...prev, aiResp]);
      
    } catch (err) {
      console.error("Error in ultra learning AI:", err);
      const errorMessage = err instanceof Error ? err.message : "Er ging iets mis bij de ultra learning AI.";
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
        title: "Fout bij ultra learning",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Enhanced emotion detection function
  const detectAllEmotions = (content: string, assessments: any[]): string[] => {
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
    
    // Rubrics-based emotion mapping
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
          if (mappedEmotion) emotions.push(mappedEmotion);
        }
      });
    }
    
    // Always return at least one emotion
    if (emotions.length === 0) {
      emotions.push('onzekerheid');
    }
    
    // Remove duplicates and return up to 3 emotions per message
    return [...new Set(emotions)].slice(0, 3);
  };

  return { 
    generateAiResponse, 
    isGenerating: isProcessing || isSeedEngineLoading || isAnalyzing || isOpenAIGenerating || isCoTAnalyzing
  };
}
