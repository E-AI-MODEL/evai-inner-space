import React, { useState, useEffect, useRef } from "react";
import TopBar from "../components/TopBar";
import SidebarEmotionHistory from "../components/SidebarEmotionHistory";
import InputBar from "../components/InputBar";
import { Drawer, DrawerContent, DrawerTrigger } from "../components/ui/drawer";
import { useIsMobile } from "../hooks/use-mobile";
import { toast } from "@/hooks/use-toast";
import SeedConfetti from "../components/SeedConfetti";
import IntroAnimation from "../components/IntroAnimation";
import { getEmotionVisuals } from "../lib/emotion-visuals";
import SettingsSheet from "../components/SettingsSheet";
import { useChat } from "../hooks/useChat";
import ChatView from "../components/ChatView";
import RubricsAnalyticsDashboard from "../components/RubricsAnalyticsDashboard";
import DraggableEmotionHistoryButton from "../components/DraggableEmotionHistoryButton";

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
    // Sluit drawer automatisch na selectie op mobiel
    if (isMobile) {
      setHistoryOpen(false);
    }
  };

  const handleClearHistory = () => {
    clearHistory();
    // Sluit drawer automatisch na wissen op mobiel
    if (isMobile) {
      setHistoryOpen(false);
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

      {/* Mobile drawer voor emotie geschiedenis */}
      <Drawer open={historyOpen} onOpenChange={setHistoryOpen}>
        <DrawerTrigger asChild>
          <DraggableEmotionHistoryButton onOpen={() => setHistoryOpen(true)} />
        </DrawerTrigger>
        <DrawerContent className="p-4 max-h-[80vh]">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-center">Emotie Geschiedenis</h3>
          </div>
          <SidebarEmotionHistory
            className="flex flex-row flex-wrap justify-center gap-4 overflow-y-auto"
            history={emotionHistory}
            onFocus={handleFocusMessage}
            onClear={handleClearHistory}
          />
        </DrawerContent>
      </Drawer>

      <div className="flex min-h-[calc(100vh-56px)]">
        {/* Desktop sidebar */}
        <SidebarEmotionHistory
          className="hidden md:flex"
          history={emotionHistory}
          onFocus={handleFocusMessage}
          onClear={clearHistory}
        />
        
        {/* Main content area */}
        <main className={`flex-1 flex flex-col justify-between min-h-[calc(100vh-56px)] transition-all ${
          isMobile ? 'px-4' : 'px-12'
        } py-8`}>
          <div className="flex-1 flex flex-col justify-end max-w-4xl mx-auto w-full">
            {/* Analytics Dashboard */}
            {showAnalytics && (
              <div className="mb-6">
                <RubricsAnalyticsDashboard messages={messages} />
              </div>
            )}

            <div className={`mx-auto w-full ${isMobile ? 'max-w-full' : 'max-w-2xl'}`}>
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
