import { Message } from '../types';
import { supabase } from '@/integrations/supabase/client';

const CURRENT_SESSION_KEY = 'evai-current-session-id';

// Generate or retrieve current session ID
export const getCurrentSessionId = (): string => {
  let sessionId = sessionStorage.getItem(CURRENT_SESSION_KEY);
  if (!sessionId) {
    sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem(CURRENT_SESSION_KEY, sessionId);
  }
  return sessionId;
};

// Load chat history from database
export const loadChatHistory = async (): Promise<Message[]> => {
  try {
    const sessionId = getCurrentSessionId();
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return (data ?? []).map(msg => ({
      id: msg.message_id,
      from: msg.from_role as 'user' | 'ai',
      label: msg.label as any,
      content: msg.content,
      emotionSeed: msg.emotion_seed_id || null,
      animate: msg.from_role === 'ai',
      timestamp: new Date(msg.created_at),
      feedback: msg.feedback as any,
      explainText: (msg.meta as any)?.explainText,
      meta: (msg.meta as any)?.meta
    }));
  } catch (error) {
    console.error('Failed to load chat history from database:', error);
    return [];
  }
};

// Save chat message to database
export const saveChatMessage = async (message: Message): Promise<void> => {
  try {
    const sessionId = getCurrentSessionId();
    const { error } = await supabase.from('chat_messages').insert({
      session_id: sessionId,
      message_id: message.id,
      from_role: message.from,
      content: message.content,
      emotion_seed_id: message.emotionSeed || null,
      label: message.label,
      feedback: message.feedback as any,
      meta: {
        explainText: message.explainText,
        meta: message.meta
      }
    });

    if (error) throw error;
  } catch (error) {
    console.error('Failed to save chat message to database:', error);
  }
};

// Load recent messages across all sessions for retroactive learning
export const loadRecentMessages = async (limit: number = 100): Promise<Message[]> => {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data ?? []).map(msg => ({
      id: msg.message_id,
      from: msg.from_role as 'user' | 'ai',
      label: msg.label as any,
      content: msg.content,
      emotionSeed: msg.emotion_seed_id || null,
      animate: false,
      timestamp: new Date(msg.created_at),
      feedback: msg.feedback as any,
      explainText: (msg.meta as any)?.explainText,
      meta: (msg.meta as any)?.meta
    }));
  } catch (error) {
    console.error('Failed to load recent messages:', error);
    return [];
  }
};

// Clear chat history for current session
export const clearChatHistory = async (): Promise<void> => {
  try {
    const sessionId = getCurrentSessionId();
    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('session_id', sessionId);
    
    if (error) throw error;
  } catch (error) {
    console.error('Failed to clear chat history:', error);
  }
};