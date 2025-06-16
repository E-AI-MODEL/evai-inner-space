
import React, { useState } from "react";
import { useChatCore } from "../hooks/useChatCore";
import { useAiResponseSimple } from "../hooks/useAiResponseSimple";
import ChatViewSimple from "../components/ChatViewSimple";
import InputBarSimple from "../components/InputBarSimple";
import TopBarSimple from "../components/TopBarSimple";
import SettingsSheet from "../components/SettingsSheet";
import { Toaster } from "@/components/ui/toaster";

const Index = () => {
  console.log('Index: Rendering');
  
  const { messages, addMessage, clearHistory } = useChatCore();
  
  const [apiKey, setApiKey] = useState(() => {
    try {
      return localStorage.getItem('evai-openai-key') || '';
    } catch (e) {
      console.warn('Failed to load API key:', e);
      return '';
    }
  });
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const { generateResponse, isGenerating } = useAiResponseSimple(addMessage, apiKey);
  
  console.log('Index: Current messages count:', messages.length);

  const handleApiKeySave = () => {
    try {
      localStorage.setItem('evai-openai-key', apiKey);
      console.log('Index: API key saved');
    } catch (e) {
      console.warn('Failed to save API key:', e);
    }
  };

  return (
    <div className="h-screen flex flex-col font-inter">
      <TopBarSimple
        apiKey={apiKey}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onClearHistory={clearHistory}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <ChatViewSimple 
          messages={messages} 
          isProcessing={isGenerating}
        />
        <InputBarSimple
          onSendMessage={generateResponse}
          isGenerating={isGenerating}
        />
      </div>

      <SettingsSheet
        isOpen={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        apiKey={apiKey}
        onApiKeyChange={setApiKey}
        onApiKeySave={handleApiKeySave}
      />

      <Toaster />
    </div>
  );
};

export default Index;
