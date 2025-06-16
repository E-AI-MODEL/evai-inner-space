
import { Message } from '../types';

const CHAT_HISTORY_STORAGE_KEY = 'evai-chat-history';

// Load chat history from localStorage
export const loadChatHistory = (): Message[] | null => {
  try {
    const stored = localStorage.getItem(CHAT_HISTORY_STORAGE_KEY);
    if (stored) {
      // JSON.parse can't revive Date objects, so we need to do it manually.
      const parsedMessages = JSON.parse(stored) as Message[];
      return parsedMessages.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp), // Convert timestamp string back to Date object
      }));
    }
    return null;
  } catch (e) {
    console.error("Failed to load chat history from localStorage", e);
    return null;
  }
};

// Save chat history to localStorage
export const saveChatHistory = (messages: Message[]) => {
  try {
    localStorage.setItem(CHAT_HISTORY_STORAGE_KEY, JSON.stringify(messages));
  } catch (e) {
    console.error("Failed to save chat history to localStorage", e);
  }
};
