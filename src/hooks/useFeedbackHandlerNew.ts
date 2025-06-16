
import { useState } from 'react';
import { Message } from '../types';
import { saveFeedback } from '../lib/feedbackStorage';
import { toast } from '@/hooks/use-toast';

export function useFeedbackHandlerNew() {
  const [feedbacks, setFeedbacks] = useState<Record<string, 'like' | 'dislike'>>({});

  const handleFeedback = (messageId: string, feedback: 'like' | 'dislike') => {
    setFeedbacks(prev => ({
      ...prev,
      [messageId]: feedback
    }));

    // Save to storage
    saveFeedback(messageId, feedback);

    // Show feedback toast
    toast({
      title: feedback === 'like' ? "Bedankt!" : "Feedback ontvangen",
      description: feedback === 'like' 
        ? "Je positieve feedback helpt ons beter te worden"
        : "We zullen proberen onze antwoorden te verbeteren",
    });

    console.log(`Feedback gegeven voor ${messageId}: ${feedback}`);
  };

  return {
    feedbacks,
    handleFeedback
  };
}
