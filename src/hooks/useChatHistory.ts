import { useState, useEffect } from "react";
import { Message } from "../types";
import { loadChatHistory, saveChatHistory } from "../lib/chatHistoryStorage";
import { loadFeedback } from "../lib/feedbackStorage";
import { getLabelVisuals } from "../lib/emotion-visuals";

const initialMessages: Message[] = [
  {
    id: "user-1",
    from: "user",
    label: null,
    content: "Ik voel stress en paniek, alles wordt me te veel.",
    emotionSeed: null,
    animate: false,
    timestamp: new Date(Date.now() - 120000),
    feedback: null,
  },
  {
    id: "ai-1",
    from: "ai",
    label: "Valideren",
    accentColor: getLabelVisuals("Valideren").accentColor,
    content: "Ik hoor veel stress en onrust in je woorden.",
    explainText: "Demo seed detectie voor 'stress en paniek'.",
    emotionSeed: "stress",
    animate: true,
    meta: "Demo",
    brilliant: true,
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
    saveChatHistory(messages);
  }, [messages]);
  
  const clearHistory = () => {
    setMessages(getDefaultMessages());
  };
  
  return { messages, setMessages, clearHistory };
}
