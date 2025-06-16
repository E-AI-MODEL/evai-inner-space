
import React, { useState, useEffect } from "react";
import TopBar from "../components/TopBar";
import ChatView from "../components/ChatView";
import InputBar from "../components/InputBar";
import SettingsSheet from "../components/SettingsSheet";
import SeedConfetti from "../components/SeedConfetti";
import IntroAnimation from "../components/IntroAnimation";
import SidebarEmotionHistory from "../components/SidebarEmotionHistory";
import { useChat } from "../hooks/useChat";
import { useAiResponse } from "../hooks/useAiResponse";
import { useSystemBootstrap } from "../hooks/useSystemBootstrap";
import { Badge } from "@/components/ui/badge";
import { Activity, CheckCircle, Loader2 } from "lucide-react";

const Index = () => {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("openai-api-key") || "");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showSeedConfetti, setShowSeedConfetti] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  const { 
    isBootstrapping, 
    bootstrapStatus, 
    isSystemReady,
    runFullBootstrap 
  } = useSystemBootstrap();
  
  const { messages, addMessage, clearHistory, getEmotionHistory } = useChat(apiKey);
  const { generateAiResponse, isGenerating } = useAiResponse(
    messages,
    addMessage,
    apiKey,
    setShowSeedConfetti
  );

  useEffect(() => {
    if (showSeedConfetti) {
      const timer = setTimeout(() => setShowSeedConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showSeedConfetti]);

  const handleSettingsSubmit = (newApiKey: string) => {
    setApiKey(newApiKey);
    localStorage.setItem("openai-api-key", newApiKey);
    setIsSettingsOpen(false);
  };

  const emotionHistory = getEmotionHistory();

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <TopBar onSettingsClick={() => setIsSettingsOpen(true)} />
      
      {/* System Status Bar */}
      {(isBootstrapping || !isSystemReady) && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-2">
          <div className="flex items-center justify-between max-w-4xl mx-auto">
            <div className="flex items-center gap-2">
              {isBootstrapping ? (
                <>
                  <Loader2 size={16} className="animate-spin text-blue-600" />
                  <span className="text-sm text-blue-800">Initializing advanced features...</span>
                </>
              ) : (
                <>
                  <Activity size={16} className="text-blue-600" />
                  <span className="text-sm text-blue-800">EvAI Advanced System</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={bootstrapStatus.advancedSeeds ? "default" : "secondary"} className="text-xs">
                {bootstrapStatus.advancedSeeds ? <CheckCircle size={12} className="mr-1" /> : <Loader2 size={12} className="animate-spin mr-1" />}
                Seeds
              </Badge>
              <Badge variant={bootstrapStatus.liveMonitoring ? "default" : "secondary"} className="text-xs">
                {bootstrapStatus.liveMonitoring ? <CheckCircle size={12} className="mr-1" /> : <Loader2 size={12} className="animate-spin mr-1" />}
                Monitor
              </Badge>
              <Badge variant={bootstrapStatus.learningEngine ? "default" : "secondary"} className="text-xs">
                {bootstrapStatus.learningEngine ? <CheckCircle size={12} className="mr-1" /> : <Loader2 size={12} className="animate-spin mr-1" />}
                Learning
              </Badge>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {messages.length === 0 ? (
            <IntroAnimation />
          ) : (
            <ChatView messages={messages} />
          )}
          
          <InputBar
            onSendMessage={generateAiResponse}
            isGenerating={isGenerating}
            apiKey={apiKey}
            isSystemReady={isSystemReady}
          />
        </div>

        {/* Sidebar */}
        <SidebarEmotionHistory
          emotionHistory={emotionHistory}
          isOpen={showHistory}
          onToggle={() => setShowHistory(!showHistory)}
          onClearHistory={clearHistory}
        />
      </div>

      <SettingsSheet
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSubmit={handleSettingsSubmit}
        currentApiKey={apiKey}
      />

      {showSeedConfetti && <SeedConfetti />}
    </div>
  );
};

export default Index;
