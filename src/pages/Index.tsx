
import React, { useState, useEffect, useRef } from "react";
import TopBar from "../components/TopBar";
import SidebarEmotionHistory from "../components/SidebarEmotionHistory";
import InputBar from "../components/InputBar";
import { Drawer, DrawerContent, DrawerTrigger } from "../components/ui/drawer";
import { useIsMobile } from "../hooks/use-mobile";
import { toast } from "@/hooks/use-toast";
import IntroAnimation from "../components/IntroAnimation";
import { getEmotionVisuals } from "../lib/emotion-visuals";
import SettingsSheet from "../components/SettingsSheet";
import { useChat } from "../hooks/useChat";
import ChatView from "../components/ChatView";
import DraggableEmotionHistoryButton from "../components/DraggableEmotionHistoryButton";
import MobileUIFixes from "../components/MobileUIFixes";

const Index = () => {
  console.log('🔥 Index component starting to render');
  
  const [showIntro, setShowIntro] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [apiKey2, setApiKey2] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [focusedMessageId, setFocusedMessageId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const isMobile = useIsMobile();

  console.log('🔥 Index state initialized - showIntro:', showIntro, 'isMobile:', isMobile);

  const messageRefs = useRef(new Map<string, HTMLDivElement | null>());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load API keys from localStorage
  useEffect(() => {
    console.log('🔥 Loading API keys from localStorage...');
    try {
      const savedApiKey = localStorage.getItem("openai-api-key");
      const savedApiKey2 = localStorage.getItem("openai-api-key-2"); 
      console.log('🔥 API keys found:', { 
        key1: savedApiKey ? 'present' : 'missing', 
        key2: savedApiKey2 ? 'present' : 'missing' 
      });
      
      if (savedApiKey) {
        setApiKey(savedApiKey);
      }
      if (savedApiKey2) {
        setApiKey2(savedApiKey2);
      }
    } catch (error) {
      console.error('🔴 Error loading API keys:', error);
    }
  }, []);
  
  console.log('🔥 About to call useChat hook...');
  
  // Initialize chat hook
  let chatHookResult;
  try {
    chatHookResult = useChat(apiKey, apiKey2);
    console.log('🔥 useChat hook result:', {
      messagesLength: chatHookResult?.messages?.length || 0,
      isProcessing: chatHookResult?.isProcessing,
      hasInput: !!chatHookResult?.input,
      hasOnSend: !!chatHookResult?.onSend
    });
  } catch (error) {
    console.error('🔴 useChat hook failed:', error);
    chatHookResult = {
      messages: [],
      input: '',
      setInput: () => {},
      isProcessing: false,
      onSend: () => {},
      setFeedback: () => {},
      clearHistory: () => {}
    };
  }

  const { 
    messages, 
    input, 
    setInput, 
    isProcessing, 
    onSend, 
    setFeedback,
    clearHistory
  } = chatHookResult;

  console.log('🔥 Chat data extracted:', {
    messagesArray: Array.isArray(messages),
    messagesLength: messages?.length || 0,
    inputValue: input,
    isProcessingValue: isProcessing
  });

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isProcessing]);

  console.log('🔥 About to check showIntro condition:', showIntro);

  if (showIntro) {
    console.log('🔥 Rendering IntroAnimation');
    return <IntroAnimation onFinished={() => setShowIntro(false)} />;
  }

  console.log('🔥 Preparing to render main interface...');

  const saveApiKey = () => {
    console.log('🔥 Saving API key...');
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

  console.log('🔥 Preparing emotion history...');
  
  let emotionHistory = [];
  try {
    emotionHistory = messages
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
    
    console.log('🔥 Emotion history prepared:', emotionHistory.length, 'items');
  } catch (error) {
    console.error('🔴 Error preparing emotion history:', error);
    emotionHistory = [];
  }

  console.log('🔥 Starting to render main JSX...');

  try {
    return (
      <>
        <MobileUIFixes />
        <div className={`w-full bg-background font-inter flex flex-col ${isMobile ? 'h-[100dvh]' : 'h-screen'} overflow-hidden`}>
          
          {/* Fixed Header */}
          <div className="flex-shrink-0 z-50">
            <TopBar 
              onSettingsClick={() => setIsSettingsOpen(true)}
            />
          </div>

          <SettingsSheet
            isOpen={isSettingsOpen}
            onOpenChange={setIsSettingsOpen}
            apiKey={apiKey}
            onApiKeyChange={setApiKey}
            onApiKeySave={saveApiKey}
          />

          {/* Debug info */}
          <div className="p-4 bg-blue-50 border-b border-blue-200">
            <p className="text-sm text-blue-700">
              🔥 Debug: Messages: {messages?.length || 0} | Processing: {isProcessing ? 'Yes' : 'No'} | Input: {input?.length || 0} chars
            </p>
            <p className="text-sm text-blue-600">
              Chat hook status: {typeof onSend === 'function' ? 'OK' : 'FAILED'}
            </p>
          </div>

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
                  {/* Fallback content when no messages */}
                  {(!messages || messages.length === 0) && (
                    <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                      <div className="text-6xl mb-4">💙</div>
                      <h2 className="text-2xl font-semibold text-gray-800 mb-2">Welkom bij EvAI</h2>
                      <p className="text-gray-600 mb-6 max-w-md">
                        Je empathische AI-partner voor emotionele ondersteuning en reflectie.
                      </p>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md">
                        <p className="text-sm text-blue-700">
                          Begin een gesprek door hieronder een bericht te typen.
                        </p>
                      </div>
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
  } catch (error) {
    console.error('🔴 Error rendering main JSX:', error);
    return (
      <div className="p-4 bg-red-50 border border-red-200">
        <h2 className="text-red-800 font-bold">Rendering Error</h2>
        <p className="text-red-700">Er is een fout opgetreden bij het laden van de interface.</p>
        <pre className="text-sm text-red-600 mt-2">{error.toString()}</pre>
      </div>
    );
  }
};

export default Index;
