
import React, { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";
import { Message } from "../types";

interface InputBarSimpleProps {
  onSendMessage: (message: Message) => void;
  isGenerating: boolean;
}

const InputBarSimple: React.FC<InputBarSimpleProps> = ({ onSendMessage, isGenerating }) => {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleSubmit = () => {
    console.log('InputBarSimple: Submit attempt', { input: input.trim(), isGenerating });
    
    if (!input.trim() || isGenerating) {
      console.log('InputBarSimple: Submit blocked');
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

    console.log('InputBarSimple: Sending message');
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
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Deel je gedachten..."
              disabled={isGenerating}
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[48px] max-h-32 text-gray-900"
              rows={1}
            />
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
      </div>
    </div>
  );
};

export default InputBarSimple;
