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
import CompactAnalyticsDashboard from "../components/CompactAnalyticsDashboard";
import DraggableEmotionHistoryButton from "../components/DraggableEmotionHistoryButton";

const Index = () => {
  const [showIntro, setShowIntro] = useState(true);
  const [apiKey, setApiKey] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [focusedMessageId, setFocusedMessageId] = useState<string | null>(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [analyticsMode, setAnalyticsMode] = useState<'compact' | 'full'>('compact');
  const isMobile = useIsMobile();

  const messageRefs = useRef(new Map<string, HTMLDivElement | null>());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedApiKey = localStorage.getItem("openai-api-key");
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);
  
  // Get original workflow data including reflections
  const { 
    messages, 
    input, 
    setInput, 
    isProcessing, 
    onSend, 
    seedConfetti,
    setFeedback,
    clearHistory
  } = useChat(apiKey);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isProcessing]);

  // Smart analytics mode switching based on screen size and content
  useEffect(() => {
    if (isMobile) {
      setAnalyticsMode('compact');
    }
  }, [isMobile]);

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

  const handleAnalyticsToggle = () => {
    if (!showAnalytics) {
      // When turning on, start with compact mode
      setAnalyticsMode('compact');
    }
    setShowAnalytics(!showAnalytics);
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
    <div className={`w-full bg-background font-inter flex flex-col ${isMobile ? 'h-[100dvh]' : 'h-screen'} overflow-hidden`}>
      <SeedConfetti show={seedConfetti} />
      
      {/* Fixed Header */}
      <div className="flex-shrink-0 z-50">
        <TopBar 
          onSettingsClick={() => setIsSettingsOpen(true)}
          onRubricsToggle={handleAnalyticsToggle}
          showRubrics={showAnalytics}
          showRubricsButton={messages.length > 0}
          messages={messages}
        />
      </div>

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

      {/* Main Content Area - Full height minus header */}
      <div className="flex flex-1 min-h-0">
        {/* Desktop sidebar */}
        <SidebarEmotionHistory
          className="hidden md:flex flex-shrink-0"
          history={emotionHistory}
          onFocus={handleFocusMessage}
          onClear={clearHistory}
        />
        
        {/* Chat Container - Fixed height with internal scrolling */}
        <main className="flex-1 flex flex-col min-h-0">
          {/* Compact Analytics - Integrated above chat */}
          {showAnalytics && analyticsMode === 'compact' && (
            <div className={`flex-shrink-0 ${isMobile ? 'p-2' : 'p-4'} border-b border-zinc-200 bg-gray-50`}>
              <CompactAnalyticsDashboard 
                messages={messages}
                onClose={() => setShowAnalytics(false)}
              />
            </div>
          )}

          {/* Full Analytics Dashboard - Optional overlay/modal style */}
          {showAnalytics && analyticsMode === 'full' && (
            <div className="flex-shrink-0 p-4 border-b border-zinc-200 bg-white max-h-96 overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Uitgebreide Analyse</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setAnalyticsMode('compact')}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Compact weergeven
                  </button>
                  <button
                    onClick={() => setShowAnalytics(false)}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    Sluiten
                  </button>
                </div>
              </div>
              <RubricsAnalyticsDashboard messages={messages} />
            </div>
          )}

          {/* Scrollable Messages Area */}
          <div className={`flex-1 overflow-y-auto ${isMobile ? 'px-2 py-2' : 'px-4 py-4'}`}>
            <div className={`max-w-4xl mx-auto w-full ${isMobile ? 'max-w-full' : 'max-w-2xl'}`}>
              <ChatView
                messages={messages}
                isProcessing={isProcessing}
                messageRefs={messageRefs}
                focusedMessageId={focusedMessageId}
                onFeedback={setFeedback}
              />
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Fixed Input Bar */}
          <div className={`flex-shrink-0 border-t border-zinc-200 bg-white ${isMobile ? 'pb-safe' : ''}`}>
            <div className={`max-w-4xl mx-auto w-full ${isMobile ? 'max-w-full px-2' : 'max-w-2xl px-4'}`}>
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

      {/* Quick Analytics Toggle for Compact Mode */}
      {showAnalytics && analyticsMode === 'compact' && messages.length > 5 && (
        <div className="fixed bottom-20 right-4 z-40">
          <button
            onClick={() => setAnalyticsMode('full')}
            className="bg-blue-600 text-white px-3 py-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Uitgebreid
          </button>
        </div>
      )}
    </div>
  );
};

export default Index;
