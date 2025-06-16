
import { Message, ChatHistoryItem } from "../types";

export function useAiResponseProcessing() {
  const prepareHistory = (messages: Message[], userMessage: Message): ChatHistoryItem[] => {
    const messageIndex = messages.findIndex(m => m.id === userMessage.id);
    return messages
      .slice(0, messageIndex >= 0 ? messageIndex : messages.length)
      .map(msg => ({
        role: msg.from === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));
  };

  return {
    prepareHistory
  };
}
