
import React from 'react';
import ChatBubble from "./ChatBubble";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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

    const [openInferences, setOpenInferences] = React.useState<Record<string, boolean>>({});
    
    return (
        <div className="mb-2">
            {messages.map((msg) => {
                const repliedToMessage = msg.replyTo ? messagesById[msg.replyTo] : undefined;

                return (
                    <div key={msg.id} className="mb-2">
                        <ChatBubble
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
                        
                        {/* Enhanced symbolic inferences display */}
                        {msg.symbolicInferences && msg.symbolicInferences.length > 0 && (
                            <div className="ml-8 mt-2 mb-4">
                                <Collapsible
                                    open={!!openInferences[msg.id]}
                                    onOpenChange={(open) =>
                                        setOpenInferences((prev) => ({ ...prev, [msg.id]: open }))
                                    }
                                >
                                    <CollapsibleTrigger className="flex items-center gap-2 text-sm font-semibold text-indigo-800 hover:underline">
                                        <span className="text-lg">🧠</span>
                                        <span>Neurosymbolische Observatie</span>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-l-4 border-indigo-400 rounded-r-lg shadow-sm mt-2">
                                            <div className="px-4 py-3 space-y-1">
                                                {msg.symbolicInferences.map((inf) => (
                                                    <div key={inf} className="text-sm text-indigo-700 flex items-start gap-2">
                                                        <span className="text-indigo-400 mt-0.5">•</span>
                                                        <span className="flex-1">{inf}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </CollapsibleContent>
                                </Collapsible>
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
