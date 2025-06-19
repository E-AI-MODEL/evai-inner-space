
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

      // STEP 1: AUTONOMOUS LEARNING INTEGRATION
      if (isAutonomousEnabled && hasOpenAI && messages.length > 2) {
        console.log('🧠 TRIGGERING AUTONOMOUS LEARNING...');
        try {
          // Run autonomous learning in background but capture new seeds
          setTimeout(async () => {
            await executeAutonomousLearning([...messages, userMessage]);
          }, 500);
        } catch (autonomousError) {
          console.error('🔴 Autonomous learning failed:', autonomousError);
        }
      }

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
              userId: 'current-user',
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

          const autonomousNote = isAutonomousEnabled 
            ? "\n\n*[🧠 NEUROSYMBOLIC + AUTONOMOUS: Real-time learning geactiveerd]*"
            : "\n\n*[🧠 NEUROSYMBOLIC: AI learning actief]*";

          const aiResp: Message = {
            id: `ai-neurosymbolic-${Date.now()}`,
            from: "ai",
            label: label,
            accentColor: getLabelVisuals(label).accentColor,
            content: `${neurosymbolicResult.response}${autonomousNote}`,
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
              `🤖 Autonomous: ${isAutonomousEnabled ? 'Learning actively' : 'Disabled'}`,
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

      // FALLBACK: Enhanced workflow with autonomous integration
      console.log('🔄 Enhanced workflow met autonome integratie...');

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

      // ENHANCED SEED GENERATION MET AUTONOMOUS INTEGRATIE
      let newSeedsGenerated = 0;
      const currentSeeds = await loadAdvancedSeeds();
      
      if (hasOpenAI) {
        console.log('🌱 ENHANCED SEED GENERATION WITH AUTONOMOUS LEARNING...');
        
        const emotionVariants = detectAllEmotions(userMessage.content, rubricsAssessments);
        console.log(`🎯 Detected ${emotionVariants.length} emotion variants:`, emotionVariants);
        
        // Enhanced emotion detection with autonomous learning feedback
        if (isAutonomousEnabled && messages.length > 3) {
          const conversationEmotions = messages
            .filter(m => m.emotionSeed)
            .map(m => m.emotionSeed)
            .slice(-3);
          
          emotionVariants.push(...conversationEmotions.filter(e => e && !emotionVariants.includes(e)));
          console.log('🤖 Autonomous learning enhanced emotions:', emotionVariants);
        }
        
        for (const emotion of emotionVariants.slice(0, 3)) {
          try {
            const existingSeed = currentSeeds.find(s => 
              s.emotion.toLowerCase() === emotion.toLowerCase()
            );
            
            if (!existingSeed) {
              console.log(`🚀 GENERATING ENHANCED SEED: "${emotion}"`);
              
              const autonomousContext = isAutonomousEnabled 
                ? ` | AUTONOMOUS: Pattern learning from ${messages.length} messages`
                : '';
              const rubricContext = cotRubricGuidance.length > 0
                ? ` | EvAI Guidance: ${cotRubricGuidance.join('; ')}`
                : '';
              const secondaryContext = secondaryInsights.length > 0
                ? ` | Secondary: ${secondaryInsights.join('; ')}`
                : '';
              
              const generatedSeed = await generateOpenAISeed({
                emotion,
                context: `EvAI ENHANCED: "${userMessage.content}" | Risk: ${overallRisk.toFixed(1)}%${autonomousContext}${rubricContext}${secondaryContext}`,
                conversationHistory: history.slice(-3).map(h => h.content),
                severity: overallRisk > 70 ? 'critical' : overallRisk > 40 ? 'high' : 'medium'
              }, apiKey);
              
              if (generatedSeed) {
                const injected = await injectSeedToDatabase(generatedSeed);
                if (injected) {
                  newSeedsGenerated++;
                  console.log(`✅ ENHANCED SEED INJECTED: "${emotion}"`);
                }
              }
            }
            
            await new Promise(resolve => setTimeout(resolve, 200));
          } catch (error) {
            console.error(`❌ Failed to generate enhanced seed for ${emotion}:`, error);
          }
        }
        
        // Refresh seeds after injection
        if (newSeedsGenerated > 0) {
          console.log('🔄 Refreshing seeds after enhanced injection...');
          await refetchSeeds();
        }
      }

      // STAP 5: Enhanced Seed Matching met Autonomous Learning
      console.log('🎯 ENHANCED SEED MATCHING WITH AUTONOMOUS INTEGRATION...');
      const enhancedContext = {
        ...context,
        secondaryInsights,
        autonomousMode: isAutonomousEnabled,
        conversationLength: messages.length,
        recentEmotions: messages.filter(m => m.emotionSeed).slice(-3).map(m => m.emotionSeed)
      };
      
      const matchedResult = await checkInput(
        userMessage.content,
        apiKey,
        enhancedContext,
        history
      );

      let aiResp: Message;

      if (matchedResult && "confidence" in matchedResult) {
        // OpenAI result with autonomous enhancement
        setSeedConfetti(true);
        
        const autonomousNote = isAutonomousEnabled && newSeedsGenerated > 0
          ? `\n\n*[🚀 AUTONOMOUS EvAI: ${newSeedsGenerated} nieuwe patronen real-time geleerd en toegepast!]*`
          : newSeedsGenerated > 0
          ? `\n\n*[🔥 EvAI LEARNING: ${newSeedsGenerated} nieuwe patronen geleerd tijdens dit gesprek!]*`
          : `\n\n*[EvAI Enhanced: Rubrics-guided response + autonomous integration]*`;
        
        const label = matchedResult.label || "Valideren";
        aiResp = {
          id: `ai-evai-autonomous-${Date.now()}`,
          from: "ai",
          label: label,
          accentColor: getLabelVisuals(label).accentColor,
          content: `${matchedResult.response}${autonomousNote}`,
          explainText: `${matchedResult.reasoning} | EvAI Risk: ${overallRisk.toFixed(1)}% | Autonomous: ${isAutonomousEnabled ? 'Active' : 'Disabled'} | New Seeds: +${newSeedsGenerated}`,
          emotionSeed: matchedResult.emotion,
          animate: true,
          meta: `EvAI Autonomous: ${Math.round(matchedResult.confidence * 100)}% + ${newSeedsGenerated} seeds`,
          brilliant: true,
          timestamp: new Date(),
          replyTo: userMessage.id,
          feedback: null,
          symbolicInferences: [
            ...rubricInsights,
            ...cotRubricGuidance.map(guidance => `🧠 EvAI: ${guidance}`),
            `🤖 AUTONOMOUS: ${isAutonomousEnabled ? `Active learning from ${messages.length} messages` : 'Disabled - enable for better responses'}`,
            `🌱 REAL-TIME SEEDS: ${newSeedsGenerated} nieuwe patronen direct toegepast`,
            `🧠 OpenAI confidence: ${Math.round(matchedResult.confidence * 100)}%`
          ]
        };

      } else if (matchedResult) {
        // Advanced seed match with autonomous enhancement
        const seedResult = matchedResult as AdvancedSeed;
        setSeedConfetti(true);
        
        const autonomousNote = isAutonomousEnabled && newSeedsGenerated > 0
          ? `\n\n*[🌱 AUTONOMOUS EvAI: ${newSeedsGenerated} nieuwe patronen + advanced seed perfect geïntegreerd!]*`
          : newSeedsGenerated > 0 
          ? `\n\n*[🌱 EvAI LEERPROCES: ${newSeedsGenerated} nieuwe patronen toegevoegd + seed toegepast!]*`
          : `\n\n*[EvAI Enhanced: Advanced seed + autonomous learning]*`;
        
        let label: "Valideren" | "Reflectievraag" | "Suggestie" = "Valideren";
        if (seedResult.label === "Reflectievraag") {
          label = "Reflectievraag";
        } else if (seedResult.label === "Suggestie") {
          label = "Suggestie";
        }
        
        aiResp = {
          id: `ai-evai-autonomous-seed-${Date.now()}`,
          from: "ai",
          label: label,
          accentColor: getLabelVisuals(label).accentColor,
          content: `${seedResult.response.nl}${autonomousNote}`,
          explainText: `EvAI Autonomous Seed: ${seedResult.triggers?.join(", ") || ''} | Risk: ${overallRisk.toFixed(1)}% | Learning: ${isAutonomousEnabled ? 'Active' : 'Disabled'} | New: +${newSeedsGenerated}`,
          emotionSeed: seedResult.emotion,
          animate: true,
          meta: `EvAI Autonomous: ${seedResult.meta?.weight?.toFixed(1) || '1.0'}x + ${newSeedsGenerated} new`,
          brilliant: true,
          timestamp: new Date(),
          replyTo: userMessage.id,
          feedback: null,
          symbolicInferences: [
            ...rubricInsights,
            ...cotRubricGuidance.map(guidance => `🧠 EvAI: ${guidance}`),
            `🤖 AUTONOMOUS: ${isAutonomousEnabled ? `Real-time learning active` : 'Disabled - activate for better responses'}`,
            `🌱 NEW SEEDS: ${newSeedsGenerated} generated with autonomous validation`,
            `🎯 Advanced matching: ${seedResult.triggers?.join(", ") || ''}`,
            `⚡ Usage count: ${seedResult.meta?.usageCount || 0} → ${(seedResult.meta?.usageCount || 0) + 1}`
          ]
        };

      } else {
        // Force generate with autonomous enhancement
        if (hasOpenAI) {
          console.log('🎯 NO MATCH = AUTONOMOUS FORCE GENERATION...');
          try {
            const dominantEmotion = detectAllEmotions(userMessage.content, rubricsAssessments)[0] || 'onzekerheid';
            const primaryGuidance = cotRubricGuidance[0] || 'emotionele validatie';
            const autonomousGuidance = isAutonomousEnabled 
              ? ` | Autonomous: Learning from ${messages.length} messages`
              : '';

            const forcedSeed = await generateOpenAISeed({
              emotion: dominantEmotion,
              context: `EvAI AUTONOMOUS FORCE: "${userMessage.content}" | Risk: ${overallRisk.toFixed(1)}% | Guidance: ${primaryGuidance}${autonomousGuidance}`,
              conversationHistory: history.slice(-2).map(h => h.content),
              severity: overallRisk > 70 ? 'critical' : overallRisk > 40 ? 'high' : 'medium'
            }, apiKey);
            
            if (forcedSeed) {
              const injected = await injectSeedToDatabase(forcedSeed);
              if (injected) {
                newSeedsGenerated++;
                await refetchSeeds();
                
                const mappedLabel: "Valideren" | "Reflectievraag" | "Suggestie" = 
                  forcedSeed.label === "Reflectievraag" ? "Reflectievraag" : 
                  forcedSeed.label === "Suggestie" ? "Suggestie" : "Valideren";
                
                const autonomousNote = isAutonomousEnabled
                  ? `\n\n*[🚀 AUTONOMOUS REAL-TIME: "${dominantEmotion}" direct geleerd en toegepast met autonomous learning!]*`
                  : `\n\n*[🚀 EvAI REAL-TIME: "${dominantEmotion}" direct geleerd en toegepast!]*`;
                
                aiResp = {
                  id: `ai-evai-autonomous-force-${Date.now()}`,
                  from: "ai",
                  label: mappedLabel,
                  accentColor: getLabelVisuals(mappedLabel).accentColor,
                  content: `${forcedSeed.response.nl}${autonomousNote}`,
                  explainText: `EvAI Autonomous Force: "${forcedSeed.emotion}" | Risk: ${overallRisk.toFixed(1)}% | Learning: ${isAutonomousEnabled ? 'Active' : 'Disabled'} | Generated & Applied`,
                  emotionSeed: forcedSeed.emotion,
                  animate: true,
                  meta: `EvAI AUTONOMOUS FORCE: Real-time Pattern + Learning`,
                  brilliant: true,
                  timestamp: new Date(),
                  replyTo: userMessage.id,
                  feedback: null,
                  symbolicInferences: [
                    ...rubricInsights,
                    ...cotRubricGuidance.map(guidance => `🧠 EvAI Applied: ${guidance}`),
                    `🚀 AUTONOMOUS FORCE: "${forcedSeed.emotion}" created with autonomous learning integration`,
                    `🌱 Total new seeds: ${newSeedsGenerated}`,
                    `🤖 Autonomous: ${isAutonomousEnabled ? 'Real-time adaptation active' : 'Enable for better learning'}`,
                    `⚡ Real-time EvAI: Learning → Application in same response`
                  ]
                };
                
                toast({
                  title: isAutonomousEnabled ? "🚀 AUTONOMOUS LEARNING!" : "🚀 EvAI FORCE LEARNING!",
                  description: `NIEUW: "${dominantEmotion}" ${isAutonomousEnabled ? 'autonomous' : 'direct'} geleerd en toegepast!`,
                });
              }
            }
          } catch (forceError) {
            console.error('🔴 Autonomous force learning failed:', forceError);
          }
        }

        // Enhanced fallback with autonomous awareness
        if (!aiResp) {
          const label = overallRisk > 50 ? "Suggestie" : "Valideren";
          const fallbackGuidance = cotRubricGuidance[0] || 'emotionele ondersteuning';
          const autonomousNote = isAutonomousEnabled 
            ? ` Autonomous learning draait op de achtergrond om mijn responses te verbeteren.`
            : ` Schakel autonomous learning in voor betere responses.`;
          
          aiResp = {
            id: `ai-evai-autonomous-fallback-${Date.now()}`,
            from: "ai",
            label: label,
            accentColor: getLabelVisuals(label).accentColor,
            content: `Ik hoor je en leer van elk gesprek.${autonomousNote} ${newSeedsGenerated > 0 ? `Tijdens ons gesprek heb ik ${newSeedsGenerated} nieuwe patronen geleerd.` : ''} *[EvAI Learning: ${fallbackGuidance}]*`,
            explainText: `EvAI Autonomous Fallback | Risk: ${overallRisk.toFixed(1)}% | Learning: ${isAutonomousEnabled ? 'Active' : 'Disabled'} | Seeds: ${newSeedsGenerated}`,
            emotionSeed: null,
            animate: true,
            meta: `EvAI Autonomous: ${isAutonomousEnabled ? 'Learning' : 'Disabled'} +${newSeedsGenerated}`,
            brilliant: false,
            timestamp: new Date(),
            replyTo: userMessage.id,
            feedback: null,
            symbolicInferences: [
              ...rubricInsights,
              ...cotRubricGuidance.map(guidance => `🧠 EvAI: ${guidance}`),
              `🤖 Autonomous: ${isAutonomousEnabled ? 'Background learning active' : 'Disabled - enable for better responses'}`,
              `🌱 Seeds generated: ${newSeedsGenerated}`,
              `🧠 EvAI learning continues with enhanced guidance`
            ]
          };
        }
      }

      // STAP 6: Enhanced OpenAI secondary integration
      if (hasOpenAi2) {
        console.log('🚀 Enhanced OpenAI secondary with autonomous integration...');
        try {
          const contextString = history.map(h => `${h.role}: ${h.content}`).join('\n');
          const autonomousContext = isAutonomousEnabled ? ` | Autonomous: Active learning mode` : '';
          const evaiContext = cotRubricGuidance.length > 0 ? ` | EvAI: ${cotRubricGuidance.join('; ')}` : '';

          const analysis = await analyzeNeurosymbolic(
            userMessage.content + autonomousContext + evaiContext,
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
          console.error('🔴 Enhanced secondary integration failed:', secondaryError);
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
      console.error("Error in EvAI autonomous enhanced AI:", err);
      const errorMessage = err instanceof Error ? err.message : "Er ging iets mis bij de EvAI autonomous enhanced AI.";
      const errorResponse: Message = {
        id: `ai-evai-autonomous-error-${Date.now()}`,
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
        title: "Fout bij EvAI autonomous processing",
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
