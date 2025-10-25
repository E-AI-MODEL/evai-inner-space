import { useState, useEffect } from "react";
import { Message } from "../types";
import { loadChatHistory, saveChatMessage, clearChatHistory } from "../lib/chatHistoryStorage";
import { loadFeedback } from "../lib/feedbackStorage";

const initialMessages: Message[] = [
  {
    id: "user-1",
    from: "user",
    label: null,
    content: "Hoi EvAI, ik zou graag even willen praten.",
    emotionSeed: null,
    animate: false,
    timestamp: new Date(Date.now() - 120000),
    feedback: null,
  },
  {
    id: "ai-1",
    from: "ai",
    label: null,
    content: "Natuurlijk! Ik ben er om naar je te luisteren. Vertel, wat houdt je bezig op dit moment?",
    emotionSeed: null,
    animate: true,
    timestamp: new Date(Date.now() - 60000),
    feedback: null,
    explainText: "Dit is een startbericht om je te verwelkomen.",
    meta: "Welkom",
  },
];

// Apply stored feedback to initial messages - this is our fallback
const getDefaultMessages = (): Message[] => {
    const storedFeedback = loadFeedback();
    return initialMessages.map(msg => ({
        ...msg,
        feedback: storedFeedback[msg.id] || null
    }));
};

export function useChatHistory() {
  const [messages, setMessages] = useState<Message[]>(getDefaultMessages);
  const [isLoading, setIsLoading] = useState(true);

  // Load messages from database on mount
  useEffect(() => {
    const loadMessages = async () => {
      setIsLoading(true);
      const loadedMessages = await loadChatHistory();
      if (loadedMessages.length > 0) {
        setMessages(loadedMessages);
      }
      setIsLoading(false);
    };
    loadMessages();
  }, []);

  // Save each new message to database
  useEffect(() => {
    if (!isLoading && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      // Only save if it's not an initial message
      if (!initialMessages.some(m => m.id === lastMessage.id)) {
        saveChatMessage(lastMessage);
      }
    }
  }, [messages, isLoading]);
  
  const clearHistory = async () => {
    await clearChatHistory();
    setMessages(getDefaultMessages());
  };
  
  return { messages, setMessages, clearHistory, isLoading };
}
