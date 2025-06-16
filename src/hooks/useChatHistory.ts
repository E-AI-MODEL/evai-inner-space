import { useState, useEffect } from "react";
import { Message } from "../types";
import { loadChatHistory, saveChatHistory } from "../lib/chatHistoryStorage";
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
    accentColor: undefined,
    content: "Natuurlijk! Ik ben er om naar je te luisteren. Vertel, wat houdt je bezig op dit moment?",
    explainText: "Dit is een startbericht om je te verwelkomen.",
    emotionSeed: null,
    animate: true,
    meta: "Welkom",
    brilliant: false,
    timestamp: new Date(Date.now() - 60000),
    replyTo: "user-1",
    feedback: null,
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

// Load from storage or use fallback
const getInitialMessages = (): Message[] => {
    const storedHistory = loadChatHistory();
    // If there's a stored history with at least one message, use it.
    if (storedHistory && storedHistory.length > 0) {
        return storedHistory;
    }
    // Otherwise, return the default set of messages.
    return getDefaultMessages();
};

export function useChatHistory() {
  const [messages, setMessages] = useState<Message[]>(getInitialMessages);

  useEffect(() => {
    console.log('useChatHistory: Saving messages to localStorage', messages.length);
    saveChatHistory(messages);
  }, [messages]);
  
  const clearHistory = () => {
    console.log('useChatHistory: Clearing history - resetting to default messages');
    const defaultMessages = getDefaultMessages();
    setMessages(defaultMessages);
    // Also clear from localStorage
    try {
      localStorage.removeItem('evai-chat-history');
      console.log('useChatHistory: Cleared localStorage');
    } catch (error) {
      console.error('useChatHistory: Failed to clear localStorage:', error);
    }
  };
  
  return { messages, setMessages, clearHistory };
}
