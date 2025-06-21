
import React from 'react';
import ChatBubble from "./ChatBubble";
import { Message } from '../types';
import PersonalizedInsights from './PersonalizedInsights';
import ReflectionStatusIndicator from './ReflectionStatusIndicator';
import { useInsightGenerator } from '../hooks/useInsightGenerator';
import { PendingReflection } from '../hooks/useBackgroundReflectionTrigger';

interface ChatViewProps {
    messages: Message[];
    isProcessing: boolean;
    messageRefs: React.MutableRefObject<Map<string, HTMLDivElement | null>>;
    focusedMessageId: string | null;
    onFeedback?: (messageId: string, feedback: 'like' | 'dislike') => void;
    // ENHANCED: Reflection system props
    pendingReflections?: PendingReflection[];
    isReflectionProcessing?: boolean;
}

const ChatView: React.FC<ChatViewProps> = ({ 
    messages, 
    isProcessing, 
    messageRefs, 
    focusedMessageId, 
    onFeedback,
    pendingReflections = [],
    isReflectionProcessing = false
}) => {
    const messagesById = React.useMemo(() =>
        messages.reduce((acc, msg) => {
            acc[msg.id] = msg;
            return acc;
        }, {} as Record<string, Message>),
    [messages]);

    const { getPriorityInsights } = useInsightGenerator(messages);
    
    // Show insights after every 5 messages or when priority insights are available
    const shouldShowInsights = messages.length > 0 && 
        (messages.length % 5 === 0 || getPriorityInsights().length > 0);
    
    return (
        <div className="space-y-3 pb-4">
            {/* ENHANCED: Reflection Status Indicator */}
            {(pendingReflections.length > 0 || isReflectionProcessing) && (
                <div className="flex justify-center mb-4">
                    <ReflectionStatusIndicator 
                        pendingReflections={pendingReflections}
                        isProcessing={isReflectionProcessing}
                        className="sticky top-4 z-10"
                    />
                </div>
            )}

            {messages.map((msg, index) => {
                const repliedToMessage = msg.replyTo ? messagesById[msg.replyTo] : undefined;
                const isLastMessage = index === messages.length - 1;
                const showInsightsAfter = shouldShowInsights && isLastMessage && !isProcessing;

                return (
                    <div key={msg.id} className="space-y-2">
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
                            symbolicInferences={msg.symbolicInferences}
                            onFeedback={msg.from === 'ai' && onFeedback ? (feedbackType) => onFeedback(msg.id, feedbackType) : undefined}
                        >
                            {msg.content}
                        </ChatBubble>

                        {/* Contextual Insights - Show after certain messages */}
                        {showInsightsAfter && (
                            <div className="mt-6 mb-4">
                                <PersonalizedInsights 
                                    messages={messages} 
                                    compact={true}
                                    className="border-l-4 border-blue-400 pl-4"
                                />
                            </div>
                        )}
                    </div>
                );
            })}
            
            {isProcessing && (
                <div className="flex justify-start mb-4">
                  <div className="bg-blue-100 px-3 md:px-4 py-3 rounded-xl">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <span className="text-sm md:text-base text-blue-700 ml-2">
                        {isReflectionProcessing ? "AI genereert reflectievragen..." : "Clean AI analyseert en genereert antwoord..."}
                      </span>
                    </div>
                  </div>
                </div>
            )}
        </div>
    );
};

export default ChatView;
