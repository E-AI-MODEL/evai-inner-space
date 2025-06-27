
import React from 'react';
import ChatBubble from "./ChatBubble";
import { Message } from '../types';

interface ChatViewProps {
    messages: Message[];
    isProcessing: boolean;
    messageRefs: React.MutableRefObject<Map<string, HTMLDivElement | null>>;
    focusedMessageId: string | null;
    onFeedback?: (messageId: string, feedback: 'like' | 'dislike') => void;
}

const ChatView: React.FC<ChatViewProps> = ({ 
    messages, 
    isProcessing, 
    messageRefs, 
    focusedMessageId, 
    onFeedback,
}) => {
    // Convert label to match ChatBubble's expected type
    const convertLabel = (label?: 'Valideren' | 'Reflectievraag' | 'Suggestie' | 'Interventie' | 'Fout' | null) => {
        if (label === 'Interventie') {
            return 'Suggestie'; // Map Interventie to Suggestie for ChatBubble compatibility
        }
        return label as 'Valideren' | 'Reflectievraag' | 'Suggestie' | 'Fout' | null;
    };

    return (
        <div className="space-y-3 pb-4">
            {messages && messages.length > 0 && (
                messages.map((msg) => (
                    <ChatBubble
                        key={msg.id}
                        id={msg.id}
                        ref={(el) => {
                            if (el) {
                                messageRefs.current.set(msg.id, el);
                            } else {
                                messageRefs.current.delete(msg.id);
                            }
                        }}
                        isFocused={msg.id === focusedMessageId}
                        from={msg.from}
                        label={convertLabel(msg.label)}
                        emotionSeed={msg.emotionSeed}
                        animate={!!msg.animate}
                        feedback={msg.feedback}
                        symbolicInferences={msg.symbolicInferences}
                        explainText={msg.explainText}
                        meta={msg.meta}
                        onFeedback={msg.from === 'ai' && onFeedback ? (feedbackType) => onFeedback(msg.id, feedbackType) : undefined}
                    >
                        {msg.content}
                    </ChatBubble>
                ))
            )}
            
            {isProcessing && (
                <div className="flex justify-start mb-4">
                  <div className="bg-blue-100 px-3 md:px-4 py-3 rounded-xl">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <span className="text-sm md:text-base text-blue-700 ml-2">
                        AI denkt na...
                      </span>
                    </div>
                  </div>
                </div>
            )}
        </div>
    );
};

export default ChatView;
