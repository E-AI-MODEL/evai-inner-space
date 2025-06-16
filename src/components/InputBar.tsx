import React, { useState, useRef, useEffect } from "react";
import { Send, Loader2, Zap, AlertCircle } from "lucide-react";
import { Message } from "../types";
import { toast } from "@/hooks/use-toast";

interface InputBarProps {
  onSendMessage: (message: Message, context?: { dislikedLabel?: "Valideren" | "Reflectievraag" | "Suggestie" }) => void;
  isGenerating: boolean;
  apiKey: string;
  isSystemReady?: boolean;
}

const InputBar: React.FC<InputBarProps> = ({ onSendMessage, isGenerating, apiKey, isSystemReady = true }) => {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleSubmit = () => {
    if (!input.trim() || isGenerating) return;

    if (!apiKey.trim()) {
      toast({
        title: "API Key vereist",
        description: "Voer een OpenAI API key in via de instellingen om de AI te gebruiken.",
        variant: "destructive",
      });
      return;
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      from: "user",
      content: input.trim(),
      timestamp: new Date(),
      feedback: null,
      label: null,
      emotionSeed: null,
      animate: false,
    };

    onSendMessage(userMessage);
    setInput("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t bg-white p-4">
      <div className="max-w-4xl mx-auto">
        {!isSystemReady && (
          <div className="mb-2 p-2 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center gap-2 text-orange-800 text-sm">
              <AlertCircle size={16} />
              <span>System is initializing advanced features. Basic functionality available.</span>
            </div>
          </div>
        )}
        
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isSystemReady ? "Deel je gedachten of gevoelens..." : "Type your message (basic mode)..."}
              disabled={isGenerating}
              className="w-full p-3 pr-12 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[48px] max-h-32 text-gray-900"
              rows={1}
            />
            {isSystemReady && (
              <div className="absolute right-3 bottom-3">
                <Zap size={16} className="text-blue-500" />
              </div>
            )}
          </div>
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || isGenerating}
            className="p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[48px] h-12"
          >
            {isGenerating ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Send size={20} />
            )}
          </button>
        </div>
        
        {isSystemReady && (
          <div className="mt-2 text-xs text-gray-500 text-center">
            EvAI Advanced System Active • Real-time Learning • Smart Seed Matching
          </div>
        )}
      </div>
    </div>
  );
};

export default InputBar;
