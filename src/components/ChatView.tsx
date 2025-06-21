
import React from 'react';
import ChatBubble from "./ChatBubble";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
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

    const [openInferences, setOpenInferences] = React.useState<Record<string, boolean>>({});
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
                            onFeedback={msg.from === 'ai' && onFeedback ? (feedbackType) => onFeedback(msg.id, feedbackType) : undefined}
                        >
                            {msg.content}
                        </ChatBubble>
                        
                        {/* Enhanced symbolic inferences display with reflection context */}
                        {msg.symbolicInferences && msg.symbolicInferences.length > 0 && (
                            <div className="ml-4 md:ml-8 mt-2 mb-4">
                                <Collapsible
                                    open={!!openInferences[msg.id]}
                                    onOpenChange={(open) =>
                                        setOpenInferences((prev) => ({ ...prev, [msg.id]: open }))
                                    }
                                >
                                    <CollapsibleTrigger className="flex items-center gap-2 text-sm font-semibold text-indigo-800 hover:underline">
                                        <span className="text-lg">
                                            {msg.label === "Reflectievraag" ? "🤔" : "🧠"}
                                        </span>
                                        <span className="text-sm md:text-base">
                                            {msg.label === "Reflectievraag" 
                                                ? "Reflectie Observatie" 
                                                : "Neurosymbolische Observatie"}
                                        </span>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                        <div className={`${
                                            msg.label === "Reflectievraag" 
                                                ? "bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-purple-400" 
                                                : "bg-gradient-to-r from-indigo-50 to-purple-50 border-l-4 border-indigo-400"
                                        } rounded-r-lg shadow-sm mt-2`}>
                                            <div className="px-3 md:px-4 py-3 space-y-1">
                                                {msg.symbolicInferences.map((inf) => (
                                                    <div key={inf} className={`text-sm ${
                                                        msg.label === "Reflectievraag" ? "text-purple-700" : "text-indigo-700"
                                                    } flex items-start gap-2`}>
                                                        <span className={`${
                                                            msg.label === "Reflectievraag" ? "text-purple-400" : "text-indigo-400"
                                                        } mt-0.5`}>•</span>
                                                        <span className="flex-1 text-sm md:text-base leading-relaxed">{inf}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </CollapsibleContent>
                                </Collapsible>
                            </div>
                        )}

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
                        {isReflectionProcessing ? "AI genereert reflectievragen..." : "AI analyseert..."}
                      </span>
                    </div>
                  </div>
                </div>
            )}
        </div>
    );
};

export default ChatView;
