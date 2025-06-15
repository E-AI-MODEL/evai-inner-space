
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

const ChatView: React.FC<ChatViewProps> = ({ messages, isProcessing, messageRefs, focusedMessageId, onFeedback }) => {
    const messagesById = React.useMemo(() => 
        messages.reduce((acc, msg) => {
            acc[msg.id] = msg;
            return acc;
        }, {} as Record<string, Message>), 
    [messages]);
    
    return (
        <div className="mb-2">
            {messages.map((msg) => {
                const repliedToMessage = msg.replyTo ? messagesById[msg.replyTo] : undefined;

                return (
                    <div key={msg.id} className="mb-2">
                        <ChatBubble
                            ref={(el) => {
                                if (el) {
                                    messageRefs.current.set(msg.id, el);
                                } else {
                                    messageRefs.current.delete(msg.id);
                                }
                            }}
                            isFocused={msg.id === focusedMessageId}
                            from={msg.from}
                            label={msg.label}
                            accentColor={msg.accentColor}
                            meta={msg.meta}
                            emotionSeed={msg.emotionSeed}
                            animate={!!msg.animate}
                            explainText={msg.explainText}
                            brilliant={!!msg.brilliant}
                            repliedToContent={repliedToMessage?.content}
                            feedback={msg.feedback}
                            onFeedback={msg.from === 'ai' && onFeedback ? (feedbackType) => onFeedback(msg.id, feedbackType) : undefined}
                        >
                            {msg.content}
                        </ChatBubble>
                        {/* NEW: Show symbolic inferences under related message */}
                        {msg.symbolicInferences && msg.symbolicInferences.length > 0 && (
                            <div className="ml-8 mt-1 px-3 py-2 rounded-md border-l-4 border-blue-400 bg-blue-50 text-blue-800 text-xs shadow transition-all duration-300">
                                {msg.symbolicInferences.map((inf, idx) => (
                                    <div key={idx} className="mb-0.5 last:mb-0 flex items-center gap-2">
                                      <span role="img" aria-label="symbolisch">🧠</span>
                                      <span>{inf}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
            
            {isProcessing && (
                <div className="flex justify-start mb-4">
                  <div className="bg-blue-100 px-4 py-3 rounded-xl">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <span className="text-sm text-blue-700 ml-2">AI analyseert...</span>
                    </div>
                  </div>
                </div>
            )}
        </div>
    );
};

export default ChatView;
