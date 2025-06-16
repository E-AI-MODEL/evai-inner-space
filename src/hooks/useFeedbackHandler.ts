
import { Message } from '../types';
import { loadFeedback, saveFeedback } from '../lib/feedbackStorage';

type GenerateAiResponseFn = (
    userMessage: Message,
    context: { dislikedLabel: "Valideren" | "Reflectievraag" | "Suggestie" | "Configuratie" | "OpenAI" }
) => Promise<void>;

export function useFeedbackHandler(
  messages: Message[],
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
  generateAiResponse: GenerateAiResponseFn
) {
  const handleDislike = async (dislikedMessage: Message) => {
    const originalUserMessage = messages.find(m => m.id === dislikedMessage.replyTo);

    if (!originalUserMessage || !dislikedMessage.label || dislikedMessage.label === 'Fout') {
      return;
    }
    
    await generateAiResponse(originalUserMessage, { dislikedLabel: dislikedMessage.label });
  };
  
  const setFeedback = (messageId: string, feedback: 'like' | 'dislike') => {
    const storedFeedback = loadFeedback();
    const currentFeedbackForMessage = storedFeedback[messageId];
    const newFeedback = currentFeedbackForMessage === feedback ? null : feedback;
    
    const updatedFeedbackStore = { ...storedFeedback, [messageId]: newFeedback };
    saveFeedback(updatedFeedbackStore);

    let dislikedMessage: Message | undefined;
    setMessages(prevMessages =>
      prevMessages.map(msg => {
        if (msg.id === messageId) {
          // Clone the message to avoid mutation issues before passing to handler
          dislikedMessage = { ...msg, feedback: newFeedback };
          return { ...msg, feedback: newFeedback };
        }
        return msg;
      })
    );
    
    if (newFeedback === 'dislike' && dislikedMessage) {
      handleDislike(dislikedMessage);
    }
  };

  return { setFeedback };
}
