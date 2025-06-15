
import React from 'react';
import ChatBubble from "./ChatBubble";
import { Message } from '../types';

interface ChatViewProps {
    messages: Message[];
    isProcessing: boolean;
    messageRefs: React.MutableRefObject<Map<string, HTMLDivElement | null>>;
    focusedMessageId: string | null;
}

const ChatView: React.FC<ChatViewProps> = ({ messages, isProcessing, messageRefs, focusedMessageId }) => {
    return (
        <div className="mb-2">
            {messages.map((msg) => (
                <ChatBubble
                    key={msg.id}
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
                >
                    {msg.content}
                </ChatBubble>
            ))}
            
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
