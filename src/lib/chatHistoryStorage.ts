
import { Message } from '../types';

const CHAT_HISTORY_STORAGE_KEY = 'evai-chat-history';
let saveTimeout: NodeJS.Timeout | null = null;

// Load chat history from localStorage with error handling
export const loadChatHistory = (): Message[] | null => {
  try {
    const stored = localStorage.getItem(CHAT_HISTORY_STORAGE_KEY);
    if (stored) {
      const parsedMessages = JSON.parse(stored) as Message[];
      return parsedMessages.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp),
      }));
    }
    return null;
  } catch (e) {
    console.warn("Failed to load chat history from localStorage", e);
    // Clear corrupted data
    try {
      localStorage.removeItem(CHAT_HISTORY_STORAGE_KEY);
    } catch (clearError) {
      console.warn("Failed to clear corrupted chat history", clearError);
    }
    return null;
  }
};

// Save chat history to localStorage with debouncing to prevent race conditions
export const saveChatHistory = (messages: Message[]) => {
  // Clear any pending save
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }

  // Debounce saves to prevent rapid writes
  saveTimeout = setTimeout(() => {
    try {
      localStorage.setItem(CHAT_HISTORY_STORAGE_KEY, JSON.stringify(messages));
      console.log('ChatHistory: Saved successfully');
    } catch (e) {
      console.warn("Failed to save chat history to localStorage", e);
    }
  }, 100);
};
