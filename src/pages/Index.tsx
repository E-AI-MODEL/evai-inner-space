
import React, { useState, useEffect, useRef } from "react";
import SidebarEmotionHistory from "../components/SidebarEmotionHistory";
import InputBar from "../components/InputBar";
import { Drawer, DrawerContent, DrawerTrigger } from "../components/ui/drawer";
import { useIsMobile } from "../hooks/use-mobile";
import IntroAnimation from "../components/IntroAnimation";
import { getEmotionVisuals } from "../lib/emotion-visuals";
import { useChat } from "../hooks/useChat";
import ChatView from "../components/ChatView";
import DraggableEmotionHistoryButton from "../components/DraggableEmotionHistoryButton";
import MobileUIFixes from "../components/MobileUIFixes";

const Index = () => {
  const [showIntro, setShowIntro] = useState<boolean>(true);
  const [focusedMessageId, setFocusedMessageId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const isMobile = useIsMobile();

  const messageRefs = useRef(new Map<string, HTMLDivElement | null>());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  
  // Initialize chat hook
  const { 
    messages, 
    input, 
    setInput, 
    isProcessing, 
    onSend, 
    setFeedback,
    clearHistory
  } = useChat();

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isProcessing]);

  if (showIntro) {
    return <IntroAnimation onFinished={() => setShowIntro(false)} />;
  }


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
    if (isMobile) {
      setHistoryOpen(false);
    }
  };

  const handleClearHistory = () => {
    clearHistory();
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
    <>
      <MobileUIFixes />
      <div className={`w-full bg-background font-inter flex flex-col ${isMobile ? 'h-[100dvh]' : 'h-screen'} overflow-hidden`}>
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

        {/* Main Content Area */}
        <div className="flex flex-1 min-h-0">
          {/* Desktop sidebar */}
          <SidebarEmotionHistory
            className="hidden md:flex flex-shrink-0"
            history={emotionHistory}
            onFocus={handleFocusMessage}
            onClear={clearHistory}
          />
          
          {/* Chat Container */}
          <main className="flex-1 flex flex-col min-h-0">
            {/* Scrollable Messages Area */}
            <div className={`flex-1 overflow-y-auto ${isMobile ? 'px-2 py-2' : 'px-4 py-4'}`}>
              <div className={`max-w-4xl mx-auto w-full ${isMobile ? 'max-w-full' : 'max-w-2xl'}`}>
                {/* Welcome content when no messages */}
                {(!messages || messages.length === 0) && (
                  <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                    <div className="text-6xl mb-4">💙</div>
                    <h2 className="text-2xl font-semibold text-gray-800 mb-6">Welkom bij EvAI</h2>
                  </div>
                )}
                
                <ChatView
                  messages={messages || []}
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
      </div>
    </>
  );
};

export default Index;
