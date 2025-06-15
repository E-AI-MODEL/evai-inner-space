import React, { useState, useEffect, useRef } from "react";
import TopBar from "../components/TopBar";
import SidebarEmotionHistory from "../components/SidebarEmotionHistory";
import ChatBubble from "../components/ChatBubble";
import InputBar from "../components/InputBar";
import { useSeedEngine } from "../hooks/useSeedEngine";
import { toast } from "@/hooks/use-toast";
import SeedConfetti from "../components/SeedConfetti";
import IntroAnimation from "../components/IntroAnimation";
import { getEmotionVisuals } from "../lib/emotion-visuals";
import SettingsSheet from "../components/SettingsSheet";

interface Message {
  id: string;
  from: "user" | "ai";
  label: string | null;
  content: string;
  emotionSeed: string | null;
  animate: boolean;
  timestamp: Date;
  accentColor?: string;
  showExplain?: boolean;
  explainText?: string;
  meta?: string;
  brilliant?: boolean;
}

const Index = () => {
  const [showIntro, setShowIntro] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "user-1",
      from: "user",
      label: null,
      content: "Ik voel stress en paniek, alles wordt me te veel.",
      emotionSeed: null,
      animate: false,
      timestamp: new Date(Date.now() - 120000),
    },
    {
      id: "ai-1",
      from: "ai",
      label: "Valideren",
      accentColor: "#BFD7FF",
      content: "Ik hoor veel stress en onrust in je woorden.",
      showExplain: false,
      explainText: "Demo seed detectie voor 'stress en paniek'.",
      emotionSeed: "stress",
      animate: true,
      meta: "Demo",
      brilliant: true,
      timestamp: new Date(Date.now() - 60000),
    },
  ]);
  
  const [input, setInput] = useState("");
  const [showExplain, setShowExplain] = useState(false);
  const [seedConfetti, setSeedConfetti] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [focusedMessageId, setFocusedMessageId] = useState<string | null>(null);
  
  const { checkInput, isLoading } = useSeedEngine();
  const messageRefs = useRef(new Map<string, HTMLDivElement | null>());

  useEffect(() => {
    const savedApiKey = localStorage.getItem('openai-api-key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  if (showIntro) {
    return <IntroAnimation onFinished={() => setShowIntro(false)} />;
  }

  const saveApiKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('openai-api-key', apiKey.trim());
      toast({
        title: "API Key opgeslagen",
        description: "Je OpenAI API key is lokaal opgeslagen.",
      });
      setIsSettingsOpen(false); // Sluit paneel na opslaan
    }
  };

  const onSend = async () => {
    if (!input.trim() || isProcessing) return;
    
    setIsProcessing(true);
    const nextId = `user-${messages.length + 1}`;
    const userMessage: Message = {
      id: nextId,
      from: "user",
      label: null,
      content: input.trim(),
      emotionSeed: null,
      animate: false,
      timestamp: new Date(),
    };

    // Voeg user message direct toe
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input.trim();
    setInput("");

    try {
      // Check voor emotie met OpenAI of fallback
      const matchedResult = await checkInput(currentInput, apiKey);

      let aiResp: Message;
      if (matchedResult && 'confidence' in matchedResult) {
        // OpenAI detectie
        setSeedConfetti(true);
        toast({
          title: "AI Emotiedetectie",
          description: `${matchedResult.emotion} gedetecteerd (${Math.round(matchedResult.confidence * 100)}% zekerheid)`,
        });
        
        aiResp = {
          id: `ai-openai-${messages.length + 1}`,
          from: "ai",
          label: matchedResult.label || "Valideren",
          accentColor: "#BFD7FF",
          content: matchedResult.response,
          showExplain: showExplain,
          explainText: `OpenAI detectie: ${matchedResult.emotion} (${Math.round(matchedResult.confidence * 100)}% zekerheid)`,
          emotionSeed: matchedResult.emotion,
          animate: true,
          meta: `AI – ${Math.round(matchedResult.confidence * 100)}%`,
          brilliant: true,
          timestamp: new Date(),
        };
      } else if (matchedResult) {
        // Fallback seed detectie
        setSeedConfetti(true);
        toast({
          title: "Seed gevonden!",
          description: `De emotie '${(matchedResult as any).emotion}' werd herkend.`,
        });
        
        aiResp = {
          id: `ai-seed-${messages.length + 1}`,
          from: "ai",
          label: (matchedResult as any).label || "Valideren",
          accentColor: "#BFD7FF",
          content: (matchedResult as any).response,
          showExplain: showExplain,
          explainText: `Lokale seed: ${(matchedResult as any).emotion}`,
          emotionSeed: (matchedResult as any).emotion,
          animate: true,
          meta: (matchedResult as any).meta || "Lokaal",
          brilliant: true,
          timestamp: new Date(),
        };
      } else {
        // Geen emotie gedetecteerd
        aiResp = {
          id: `ai-new-${messages.length + 1}`,
          from: "ai",
          label: "Valideren",
          accentColor: "#BFD7FF",
          content: "Ik hoor iets bijzonders in je bericht, vertel gerust meer.",
          showExplain: showExplain,
          explainText: "Geen specifieke emotie gedetecteerd.",
          emotionSeed: null,
          animate: true,
          meta: "",
          brilliant: false,
          timestamp: new Date(),
        };
      }

      setMessages(prev => [...prev, aiResp]);
      
    } catch (err) {
      console.error('Error processing message:', err);
      const errorMessage = err instanceof Error ? err.message : "Er ging iets mis bij het verwerken van je bericht.";

      const errorResponse: Message = {
        id: `ai-error-${messages.length + 1}`,
        from: "ai",
        label: "Fout",
        content: errorMessage,
        emotionSeed: 'error',
        animate: true,
        timestamp: new Date(),
        accentColor: '#FECACA', // Light red
        brilliant: false,
      };

      setMessages(prev => [...prev, errorResponse]);
      
      toast({
        title: "Fout bij analyse",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFocusMessage = (id: string) => {
    const node = messageRefs.current.get(id);
    if (node) {
      node.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      setFocusedMessageId(id);
      setTimeout(() => setFocusedMessageId(null), 2500); // Highlight for 2.5 seconds
    }
  };

  const emotionHistory = messages
    .filter((msg) => msg.from === "ai" && msg.emotionSeed)
    .map((msg) => {
      const visual = getEmotionVisuals(msg.emotionSeed);
      const messageTimestamp = msg.timestamp || new Date();
      const emotionLabel = msg.emotionSeed!;
      return {
        id: msg.id,
        icon: visual.icon,
        label: emotionLabel.charAt(0).toUpperCase() + emotionLabel.slice(1),
        colorClass: visual.colorClass,
        time: messageTimestamp.toLocaleTimeString("nl-NL", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
    })
    .reverse();

  return (
    <div className="w-full min-h-screen bg-background font-inter">
      <SeedConfetti show={seedConfetti} />
      <TopBar onSettingsClick={() => setIsSettingsOpen(true)} />
      <SettingsSheet
        isOpen={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        apiKey={apiKey}
        onApiKeyChange={setApiKey}
        onApiKeySave={saveApiKey}
      />
      <div className="flex">
        <SidebarEmotionHistory history={emotionHistory} onFocus={handleFocusMessage} />
        <main className="flex-1 flex flex-col justify-between min-h-[calc(100vh-56px)] px-0 md:px-12 py-8 transition-all">
          <div className="flex-1 flex flex-col justify-end max-w-2xl mx-auto w-full">
            
            <div className="mb-2">
              {messages.map((msg) => (
                <ChatBubble
                  key={msg.id}
                  ref={(el) => {
                    if (el) {
                      messageRefs.current.set(msg.id, el);
                    } else {
                      messageRefs.current.delete(msg.id);
                    }
                  }}
                  isFocused={msg.id === focusedMessageId}
                  from={msg.from as "user" | "ai"}
                  label={msg.label as any}
                  accentColor={(msg as any).accentColor}
                  meta={(msg as any).meta}
                  emotionSeed={msg.emotionSeed}
                  animate={!!msg.animate}
                  showExplain={showExplain && msg.from === "ai"}
                  explainText={(msg as any).explainText}
                  brilliant={!!(msg as any).brilliant}
                >
                  {msg.content}
                </ChatBubble>
              ))}
              
              {(isLoading || isProcessing) && (
                <div className="flex justify-start mb-4">
                  <div className="bg-blue-100 px-4 py-3 rounded-xl">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <span className="text-sm text-blue-700 ml-2">AI analyseert...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end mb-2">
              <button
                type="button"
                onClick={() => setShowExplain((s) => !s)}
                className="flex items-center gap-2 text-sm px-3 py-1.5 bg-zinc-50 border border-zinc-200 rounded-lg hover:bg-zinc-100 transition-all font-medium"
                aria-pressed={showExplain}
                aria-label="Toon redenatie"
              >
                <span>Toon redenatie</span>
                <span
                  className={`transition-transform ${
                    showExplain ? "rotate-180" : ""
                  }`}
                  aria-hidden
                >▼</span>
              </button>
            </div>
            
            <InputBar
              value={input}
              onChange={setInput}
              onSend={onSend}
              disabled={isProcessing}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
