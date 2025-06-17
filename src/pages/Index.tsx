
import React, { useState, useEffect, useRef } from "react";
import TopBar from "../components/TopBar";
import SidebarEmotionHistory from "../components/SidebarEmotionHistory";
import InputBar from "../components/InputBar";
import { Drawer, DrawerContent, DrawerTrigger } from "../components/ui/drawer";
import { useIsMobile } from "../hooks/use-mobile";
import { History } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import SeedConfetti from "../components/SeedConfetti";
import IntroAnimation from "../components/IntroAnimation";
import { getEmotionVisuals } from "../lib/emotion-visuals";
import SettingsSheet from "../components/SettingsSheet";
import { useChat } from "../hooks/useChat";
import ChatView from "../components/ChatView";
import RubricsAnalyticsDashboard from "../components/RubricsAnalyticsDashboard";

const Index = () => {
  const [showIntro, setShowIntro] = useState(true);
  const [apiKey, setApiKey] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [focusedMessageId, setFocusedMessageId] = useState<string | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const isMobile = useIsMobile();

  const messageRefs = useRef(new Map<string, HTMLDivElement | null>());

  useEffect(() => {
    const savedApiKey = localStorage.getItem("openai-api-key");
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);
  
  const { messages, input, setInput, isProcessing, onSend, seedConfetti, setFeedback, clearHistory } =
    useChat(apiKey);

  if (showIntro) {
    return <IntroAnimation onFinished={() => setShowIntro(false)} />;
  }

  const saveApiKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem("openai-api-key", apiKey.trim());
      toast({
        title: "API Key opgeslagen",
        description: "Je OpenAI API key is lokaal opgeslagen.",
      });
      setIsSettingsOpen(false);
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
      setTimeout(() => setFocusedMessageId(null), 2500);
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
      <TopBar 
        onSettingsClick={() => setIsSettingsOpen(true)}
        onRubricsToggle={() => setShowAnalytics(!showAnalytics)}
        showRubrics={showAnalytics}
        showRubricsButton={messages.length > 0}
      />
      <SettingsSheet
        isOpen={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        apiKey={apiKey}
        onApiKeyChange={setApiKey}
        onApiKeySave={saveApiKey}
      />

      {isMobile && (
        <Drawer open={historyOpen} onOpenChange={setHistoryOpen}>
          <DrawerTrigger asChild>
            <button
              type="button"
              aria-label="Toon emotiegeschiedenis"
              className="md:hidden fixed bottom-4 right-4 z-40 p-3 rounded-full bg-white border border-zinc-200 shadow-lg"
            >
              <History size={20} />
            </button>
          </DrawerTrigger>
          <DrawerContent className="p-4">
            <SidebarEmotionHistory
              className="flex"
              history={emotionHistory}
              onFocus={handleFocusMessage}
              onClear={clearHistory}
            />
          </DrawerContent>
        </Drawer>
      )}
      <div className="flex">
        <SidebarEmotionHistory
          history={emotionHistory}
          onFocus={handleFocusMessage}
          onClear={clearHistory}
        />
        <main className="flex-1 flex flex-col justify-between min-h-[calc(100vh-56px)] px-0 md:px-12 py-8 transition-all">
          <div className="flex-1 flex flex-col justify-end max-w-4xl mx-auto w-full">
            {/* Analytics Dashboard */}
            {showAnalytics && (
              <div className="mb-6">
                <RubricsAnalyticsDashboard messages={messages} />
              </div>
            )}

            <div className="max-w-2xl mx-auto w-full">
              <ChatView
                messages={messages}
                isProcessing={isProcessing}
                messageRefs={messageRefs}
                focusedMessageId={focusedMessageId}
                onFeedback={setFeedback}
              />

              <InputBar
                value={input}
                onChange={setInput}
                onSend={onSend}
                disabled={isProcessing}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
