
import { useState, useCallback, useRef } from 'react';
import { Message } from '../types';

interface QueuedMessage {
  id: string;
  message: Message;
  timestamp: number;
  retries: number;
}

export function useMessageQueue(addMessage: (message: Message) => void) {
  const [queue, setQueue] = useState<QueuedMessage[]>([]);
  const processingRef = useRef(false);
  const maxRetries = 3;

  const processQueue = useCallback(async () => {
    if (processingRef.current || queue.length === 0) return;
    
    processingRef.current = true;
    
    try {
      const item = queue[0];
      console.log('MessageQueue: Processing message', item.id);
      
      // Try to add the message
      addMessage(item.message);
      
      // Remove from queue on success
      setQueue(prev => prev.slice(1));
      
    } catch (error) {
      console.error('MessageQueue: Failed to process message:', error);
      
      // Retry logic
      setQueue(prev => {
        const item = prev[0];
        if (item.retries < maxRetries) {
          return [
            { ...item, retries: item.retries + 1 },
            ...prev.slice(1)
          ];
        } else {
          console.error('MessageQueue: Max retries exceeded for message', item.id);
          return prev.slice(1);
        }
      });
    } finally {
      processingRef.current = false;
      
      // Process next item
      setTimeout(() => {
        if (queue.length > 0) {
          processQueue();
        }
      }, 100);
    }
  }, [queue, addMessage]);

  const enqueueMessage = useCallback((message: Message) => {
    const queuedMessage: QueuedMessage = {
      id: `queue-${Date.now()}-${Math.random()}`,
      message,
      timestamp: Date.now(),
      retries: 0
    };
    
    console.log('MessageQueue: Enqueuing message', message.id);
    setQueue(prev => [...prev, queuedMessage]);
    
    // Start processing if not already running
    if (!processingRef.current) {
      processQueue();
    }
  }, [processQueue]);

  const clearQueue = useCallback(() => {
    console.log('MessageQueue: Clearing queue');
    setQueue([]);
    processingRef.current = false;
  }, []);

  return {
    enqueueMessage,
    clearQueue,
    queueSize: queue.length,
    isProcessing: processingRef.current
  };
}
