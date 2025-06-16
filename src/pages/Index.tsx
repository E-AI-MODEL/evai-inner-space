
import React, { useState } from "react";
import TopBar from "../components/TopBar";
import ChatViewSimple from "../components/ChatViewSimple";
import InputBarSimple from "../components/InputBarSimple";
import SettingsSheet from "../components/SettingsSheet";
import SeedConfetti from "../components/SeedConfetti";
import IntroAnimation from "../components/IntroAnimation";
import { useChatCore } from "../hooks/useChatCore";
import { useAiResponseSimple } from "../hooks/useAiResponseSimple";
import { useFeedbackHandlerNew } from "../hooks/useFeedbackHandlerNew";
import { toast } from "@/hooks/use-toast";

const Index = () => {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("openai-api-key") || "");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const { messages, addMessage, clearHistory } = useChatCore();
  console.log('Index: Current messages count:', messages.length);
  
  const { generateResponse, isGenerating } = useAiResponseSimple(addMessage, apiKey);
  const { feedbacks, handleFeedback } = useFeedbackHandlerNew();

  const handleApiKeyChange = (newApiKey: string) => {
    console.log('Index: API key changed');
    setApiKey(newApiKey);
  };

  const handleApiKeySave = () => {
    console.log('Index: Saving API key');
    localStorage.setItem("openai-api-key", apiKey);
    setIsSettingsOpen(false);
  };

  const handleClearHistory = () => {
    console.log('Index: Clearing history');
    clearHistory();
    toast({
      title: "Geschiedenis gewist",
      description: "De chat is teruggezet naar het begin.",
    });
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <TopBar onSettingsClick={() => setIsSettingsOpen(true)} />

      <div className="flex flex-1 overflow-hidden">
        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {messages.length === 0 ? (
            <IntroAnimation onFinished={() => {}} />
          ) : (
            <ChatViewSimple 
              messages={messages} 
              isProcessing={isGenerating}
              onFeedback={handleFeedback}
            />
          )}
          
          <InputBarSimple
            onSendMessage={generateResponse}
            isGenerating={isGenerating}
          />
        </div>

        {/* Simple Sidebar */}
        <div className="w-80 bg-white border-l border-gray-200 p-4">
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-800">Chat Opties</h3>
            <button
              onClick={handleClearHistory}
              className="w-full px-4 py-2 text-sm bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
            >
              Wis Geschiedenis
            </button>
            <div className="text-xs text-gray-500">
              Basis modus actief - kernfunctionaliteit hersteld
            </div>
          </div>
        </div>
      </div>

      <SettingsSheet
        isOpen={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        apiKey={apiKey}
        onApiKeyChange={handleApiKeyChange}
        onApiKeySave={handleApiKeySave}
      />

      <SeedConfetti show={false} />
    </div>
  );
};

export default Index;
