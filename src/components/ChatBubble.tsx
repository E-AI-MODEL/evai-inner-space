
import React, { forwardRef } from "react";
import { Gem, CornerDownRight, ThumbsUp, ThumbsDown } from "lucide-react";
import AITransparencyTooltip from "./AITransparencyTooltip";
import { ContextualHelp } from "./ContextualHelp";

interface ChatBubbleProps {
  id: string;
  from: "user" | "ai";
  label: "Valideren" | "Reflectievraag" | "Suggestie" | "Fout" | null;
  accentColor?: string;
  children: React.ReactNode;
  meta?: React.ReactNode | { gapAnalysis?: string; [key: string]: any };
  explainText?: string;
  emotionSeed?: string;
  animate?: boolean;
  brilliant?: boolean;
  isFocused?: boolean;
  repliedToContent?: string;
  feedback?: "like" | "dislike" | null;
  symbolicInferences?: string[];
  onFeedback?: (feedback: "like" | "dislike") => void;
}

const LABEL_CLASSES = {
  Valideren: "bg-blue-100 text-blue-900",
  Reflectievraag: "bg-green-100 text-green-900",
  Suggestie: "bg-purple-100 text-purple-800",
  Fout: "bg-red-100 text-red-900",
};

const ChatBubble = forwardRef<HTMLDivElement, ChatBubbleProps>(({ 
  id,
  from,
  label,
  accentColor,
  children,
  meta,
  explainText,
  emotionSeed,
  animate,
  brilliant,
  isFocused,
  repliedToContent,
  feedback,
  symbolicInferences,
  onFeedback,
}, ref) => {
  const bubbleStyles =
    from === "user"
      ? "bg-white text-zinc-800 border border-zinc-200"
      : accentColor
      ? ""
      : "bg-zinc-100 text-zinc-800";

  // Extract gap analysis from meta if it's an object
  const gapAnalysis = typeof meta === 'object' && meta && 'gapAnalysis' in meta 
    ? meta.gapAnalysis 
    : undefined;

  return (
    <div
      ref={ref}
      className={`flex flex-col items-start gap-1 mb-4 ${from === "user" ? "items-end" : "items-start"} ${
        animate ? "animate-fade-in" : ""
      }`}
      data-seed={emotionSeed}
    >
      {from === "ai" && label && (
        <div className="mb-0.5 ml-2 flex items-center">
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium tracking-wide opacity-80 ${LABEL_CLASSES[label] ?? "bg-zinc-100 text-zinc-600"}`}
          >
            {label}
          </span>
          <AITransparencyTooltip 
            label={label}
            reasoning={explainText}
            techniques={symbolicInferences}
            gapAnalysis={gapAnalysis}
          />
        </div>
      )}
      <div className={`relative w-fit max-w-[70vw]`}>
        {/* Brilliant/diamond sparkle */}
        {brilliant && (
          <span className="absolute -left-6 -top-2 z-10 animate-fade-in pointer-events-none">
            <Gem size={22} className="text-blue-400 drop-shadow-brilliant" />
          </span>
        )}
        
        {/* Quoted reply */}
        {from === 'ai' && repliedToContent && (
          <div className="flex items-center gap-2 text-xs italic opacity-70 text-zinc-600 mb-1.5 ml-2">
            <CornerDownRight size={14} className="flex-shrink-0" />
            <p className="truncate">
              {repliedToContent}
            </p>
          </div>
        )}

        <div
          className={`px-4 py-3 rounded-xl font-inter shadow-card relative text-sm leading-relaxed transition-all duration-300
            ${from === "ai"
              ? accentColor
                ? ""
                : "bg-zinc-100"
              : "bg-white"
            }
            ${bubbleStyles}
            ${brilliant ? "ring-2 ring-blue-200 ring-offset-2 shadow-lg" : ""}
            ${isFocused ? "ring-2 ring-yellow-400 ring-offset-2" : ""}
            ${from === "ai" && animate ? "animate-pulse-accent" : ""}
          `}
          style={
            accentColor && from === "ai"
              ? { backgroundColor: accentColor, color: "#222" }
              : undefined
          }
          data-ttl={typeof meta === 'string' ? meta : undefined}
        >
          {children}
          
          {/* Feedback Toggle */}
          {from === 'ai' && onFeedback && (
            <div className="absolute -bottom-3 -right-2 flex items-center gap-2">
              <div className="flex items-center bg-white border border-zinc-200 rounded-full shadow-sm p-0.5">
                <button
                  onClick={() => onFeedback('like')}
                  className={`p-1 rounded-full transition-colors ${feedback === 'like' ? 'bg-green-100 text-green-600' : 'text-zinc-500 hover:bg-green-50'}`}
                  aria-label="Antwoord is nuttig"
                >
                  <ThumbsUp size={14} />
                </button>
                <div className="w-px h-4 bg-zinc-200 mx-0.5" />
                <button
                  onClick={() => onFeedback('dislike')}
                  className={`p-1 rounded-full transition-colors ${feedback === 'dislike' ? 'bg-red-100 text-red-600' : 'text-zinc-500 hover:bg-red-50'}`}
                  aria-label="Antwoord is niet nuttig"
                >
                  <ThumbsDown size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

ChatBubble.displayName = "ChatBubble";

export default ChatBubble;
