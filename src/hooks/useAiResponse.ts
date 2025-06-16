
import { useState } from "react";
import { useSeedEngine, Seed } from "./useSeedEngine";
import { useGoogleGemini } from "./useGoogleGemini";
import { useOpenAISeedGenerator } from "./useOpenAISeedGenerator";
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

  // Symbolic neurosymbolic features engine
  const { evaluate: evaluateSymbolic } = useSymbolicEngine();

  const generateAiResponse = async (
    userMessage: Message,
    context?: { dislikedLabel?: "Valideren" | "Reflectievraag" | "Suggestie" }
  ) => {
    setIsProcessing(true);
    
    // Check AI integration status
    const googleApiKey = localStorage.getItem('google-api-key');
    const hasOpenAI = apiKey && apiKey.trim().length > 0;
    const hasGoogle = googleApiKey && googleApiKey.trim().length > 0;
    
    console.log('🤖 AI Integration Status:', {
      openAI: hasOpenAI ? 'Active' : 'Inactive',
      google: hasGoogle ? 'Active' : 'Inactive',
      fullIntegration: hasOpenAI && hasGoogle
    });

    try {
      const messageIndex = messages.findIndex(m => m.id === userMessage.id);
      const history: ChatHistoryItem[] = messages
        .slice(0, messageIndex >= 0 ? messageIndex : messages.length)
        .map(msg => ({
          role: msg.from === 'user' ? 'user' : 'assistant',
          content: msg.content
        }));

      const matchedResult = await checkInput(userMessage.content, apiKey, context, history);
      let aiResp: Message;

      if (matchedResult && "confidence" in matchedResult) {
        setSeedConfetti(true);
        toast({
          title: "🧠 AI Emotiedetectie (OpenAI)",
          description: `${matchedResult.emotion} gedetecteerd (${Math.round(
            matchedResult.confidence * 100
          )}% zekerheid)`,
        });

        const label = matchedResult.label || "Valideren";
        aiResp = {
          id: `ai-openai-${Date.now()}`,
          from: "ai",
          label: label,
          accentColor: getLabelVisuals(label).accentColor,
          content: matchedResult.response,
          explainText: matchedResult.reasoning,
          emotionSeed: matchedResult.emotion,
          animate: true,
          meta: `OpenAI – ${Math.round(matchedResult.confidence * 100)}%`,
          brilliant: true,
          timestamp: new Date(),
          replyTo: userMessage.id,
          feedback: null,
        };

        // ✨ NEW: Google Gemini neurosymbolic analysis
        if (hasGoogle) {
          console.log('🚀 Running Google Gemini neurosymbolic analysis...');
          try {
            const contextString = history.map(h => `${h.role}: ${h.content}`).join('\n');
            const geminiAnalysis = await analyzeNeurosymbolic(
              userMessage.content, 
              contextString, 
              googleApiKey!
            );
            
            if (geminiAnalysis) {
              aiResp.symbolicInferences = [
                ...geminiAnalysis.patterns,
                ...geminiAnalysis.insights
              ];
              
              toast({
                title: "🧠 Neurosymbolische Analyse (Google)",
                description: `${geminiAnalysis.patterns.length} patronen, ${geminiAnalysis.insights.length} inzichten (${Math.round(geminiAnalysis.confidence * 100)}%)`,
              });

              // Enhance response if Google suggests better seed
              if (geminiAnalysis.seedSuggestion && geminiAnalysis.confidence > 0.8) {
                const enhancedSeed = await generateSeed(
                  geminiAnalysis.seedSuggestion,
                  userMessage.content,
                  googleApiKey!
                );
                
                if (enhancedSeed) {
                  aiResp.content = enhancedSeed;
                  aiResp.meta = `OpenAI + Google Enhanced – ${Math.round(matchedResult.confidence * geminiAnalysis.confidence * 100)}%`;
                  console.log('✅ Response enhanced by Google Gemini');
                }
              }
            }
          } catch (geminiError) {
            console.error('🔴 Google Gemini analysis failed:', geminiError);
            toast({
              title: "Google AI Fout",
              description: "Neurosymbolische analyse mislukt, maar OpenAI werkt nog.",
              variant: "destructive"
            });
          }
        }

        // ✨ NEW: Intelligent Seed Generation & Injection
        if (hasOpenAI && messages.length > 3) {
          console.log('🎯 Starting intelligent seed generation...');
          try {
            // Analyze conversation for missing emotions
            const missingEmotions = await analyzeConversationForSeeds(messages, apiKey);
            
            if (missingEmotions.length > 0) {
              console.log('🔍 Found missing emotions for seed generation:', missingEmotions);
              
              // Generate seed for the most relevant missing emotion
              const priorityEmotion = missingEmotions[0];
              const generatedSeed = await generateOpenAISeed({
                emotion: priorityEmotion,
                context: userMessage.content,
                conversationHistory: history.slice(-3).map(h => h.content),
                severity: 'medium'
              }, apiKey);

              if (generatedSeed) {
                const injected = await injectSeedToDatabase(generatedSeed);
                if (injected) {
                  aiResp.symbolicInferences = [
                    ...(aiResp.symbolicInferences || []),
                    `🌱 Nieuwe seed gegenereerd voor '${priorityEmotion}'`,
                    `🎯 Seed database uitgebreid met ${missingEmotions.length} ontbrekende emoties`
                  ];
                  
                  toast({
                    title: "🌱 Automatische Seed Generatie",
                    description: `Nieuwe seed voor '${priorityEmotion}' toegevoegd aan database`,
                  });
                }
              }
            }
          } catch (seedError) {
            console.error('🔴 Intelligent seed generation failed:', seedError);
          }
        }

      } else if (matchedResult) {
        const seedResult = matchedResult;
        setSeedConfetti(true);
        toast({
          title: "🎯 Advanced Seed Match",
          description: `Neurosymbolische match voor '${seedResult.emotion}'`,
        });

        const label = seedResult.label || "Valideren";
        aiResp = {
          id: `ai-seed-${Date.now()}`,
          from: "ai",
          label: label,
          accentColor: getLabelVisuals(label).accentColor,
          content: seedResult.response,
          explainText: `Advanced Seed: ${seedResult.triggers.join(", ")} → ${seedResult.emotion}`,
          emotionSeed: seedResult.emotion,
          animate: true,
          meta: seedResult.meta || "Advanced",
          brilliant: true,
          timestamp: new Date(),
          replyTo: userMessage.id,
          feedback: null,
        };
      } else {
        if (hasOpenAI) {
          console.log('🟡 No existing seed found, generating new one...');
          try {
            // Generate a new seed for unknown emotion
            const generatedSeed = await generateOpenAISeed({
              emotion: 'onzekerheid', // Default emotion
              context: userMessage.content,
              conversationHistory: history.slice(-2).map(h => h.content),
              severity: 'medium'
            }, apiKey);
            
            if (generatedSeed) {
              // Inject the new seed
              await injectSeedToDatabase(generatedSeed);
              
              // Map "Interventie" to "Suggestie" for Message interface compatibility
              const mappedLabel: "Valideren" | "Reflectievraag" | "Suggestie" | "Fout" = 
                generatedSeed.label === "Interventie" ? "Suggestie" : generatedSeed.label as "Valideren" | "Reflectievraag" | "Suggestie";
              
              aiResp = {
                id: `ai-generated-${Date.now()}`,
                from: "ai",
                label: mappedLabel,
                accentColor: getLabelVisuals(mappedLabel).accentColor,
                content: generatedSeed.response.nl,
                explainText: `Nieuwe seed gegenereerd en toegevoegd voor: ${generatedSeed.emotion}`,
                emotionSeed: generatedSeed.emotion,
                animate: true,
                meta: "OpenAI Generated & Injected",
                brilliant: true,
                timestamp: new Date(),
                replyTo: userMessage.id,
                feedback: null,
              };
              
              toast({
                title: "🚀 Automatische Seed Generatie",
                description: `Nieuwe seed voor '${generatedSeed.emotion}' gegenereerd en toegevoegd`,
              });
            } else {
              throw new Error('No seed generated');
            }
          } catch (generationError) {
            console.error('🔴 Automatic seed generation failed:', generationError);
            // Final fallback
            const label = "Valideren";
            aiResp = {
              id: `ai-fallback-${Date.now()}`,
              from: "ai",
              label: label,
              accentColor: getLabelVisuals(label).accentColor,
              content: "Ik hoor iets bijzonders in je bericht, vertel gerust meer.",
              explainText: "Automatische seed generatie gefaald, fallback response",
              emotionSeed: null,
              animate: true,
              meta: "Fallback",
              brilliant: false,
              timestamp: new Date(),
              replyTo: userMessage.id,
              feedback: null,
            };
          }
        } else {
          const label = "Valideren";
          aiResp = {
            id: context?.dislikedLabel ? `ai-feedback-${Date.now()}`: `ai-new-${Date.now()}`,
            from: "ai",
            label: label,
            accentColor: getLabelVisuals(label).accentColor,
            content: context?.dislikedLabel 
              ? "Het spijt me dat mijn vorige antwoord niet hielp. Ik zal proberen hier rekening mee te houden." 
              : "Ik hoor iets bijzonders in je bericht, vertel gerust meer.",
            explainText: context?.dislikedLabel ? "Nieuw antwoord na feedback." : "Geen specifieke emotie gedetecteerd.",
            emotionSeed: null,
            animate: true,
            meta: context?.dislikedLabel ? "Feedback" : "Basis",
            brilliant: false,
            timestamp: new Date(),
            replyTo: userMessage.id,
            feedback: null,
          };
        }
      }

      // Enhanced Symbolic engine analysis (local rules)
      const extendedMessages = [...messages, aiResp];
      const aiSymbolic = evaluateSymbolic(extendedMessages, aiResp);
      if (aiSymbolic.length) {
        aiResp.symbolicInferences = [...(aiResp.symbolicInferences || []), ...aiSymbolic];
      }

      // Integration success notification
      if (hasOpenAI && hasGoogle && matchedResult && "confidence" in matchedResult) {
        console.log('✅ Full AI Integration Active: OpenAI + Google working together');
        toast({
          title: "🚀 Volledige AI Integratie",
          description: "OpenAI en Google werken samen voor optimale analyse + automatische seed generatie",
        });
      }

      setMessages((prev) => [...prev, aiResp]);
    } catch (err) {
      console.error("Error processing message:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Er ging iets mis bij het verwerken van je bericht.";
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
        title: "Fout bij AI analyse",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return { 
    generateAiResponse, 
    isGenerating: isProcessing || isSeedEngineLoading || isAnalyzing || isOpenAIGenerating 
  };
}
