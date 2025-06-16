
import React from 'react';
import ChatBubble from "./ChatBubble";
import { Message } from '../types';

interface ChatViewSimpleProps {
    messages: Message[];
    isProcessing: boolean;
    onFeedback?: (messageId: string, feedback: 'like' | 'dislike') => void;
}

const ChatViewSimple: React.FC<ChatViewSimpleProps> = ({ messages, isProcessing, onFeedback }) => {
    const messagesById = React.useMemo(() => 
        messages.reduce((acc, msg) => {
            acc[msg.id] = msg;
            return acc;
        }, {} as Record<string, Message>), 
    [messages]);
    
    return (
        <div className="flex-1 overflow-y-auto p-4">
            <div className="max-w-4xl mx-auto space-y-4">
                {messages.map((msg) => {
                    const repliedToMessage = msg.replyTo ? messagesById[msg.replyTo] : undefined;

                    return (
                        <ChatBubble
                            key={msg.id}
                            isFocused={false}
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
                    );
                })}
                
                {isProcessing && (
                    <div className="flex justify-start">
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
        </div>
    );
};

export default ChatViewSimple;
