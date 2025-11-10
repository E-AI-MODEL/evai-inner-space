
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
  v20Metadata?: {
    tdMatrixFlag?: string;
    fusionStrategy?: string;
    safetyScore?: number;
    eaaScores?: { ownership: number; autonomy: number; agency: number };
  };
  onFeedback?: (feedback: "like" | "dislike") => void;
}

const LABEL_CLASSES = {
  Valideren: "bg-blue-500/10 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400",
  Reflectievraag: "bg-green-500/10 text-green-700 dark:bg-green-500/20 dark:text-green-400",
  Suggestie: "bg-purple-500/10 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400",
  Fout: "bg-destructive/10 text-destructive dark:bg-destructive/20",
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
  v20Metadata,
  onFeedback,
}, ref) => {
  const bubbleStyles =
    from === "user"
      ? "bg-gradient-to-br from-primary-coral/10 to-primary-purple/10 text-foreground border border-primary-coral/20"
      : accentColor
      ? ""
      : "glass text-foreground";

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
        <div className="mb-0.5 ml-2 flex items-center gap-1 flex-wrap">
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium tracking-wide opacity-80 ${LABEL_CLASSES[label] ?? "bg-muted text-muted-foreground"}`}
          >
            {label}
          </span>
          {v20Metadata?.tdMatrixFlag && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400">
              {v20Metadata.tdMatrixFlag === 'DIDACTIC' ? '🎓 Didactisch' : v20Metadata.tdMatrixFlag === 'AUTONOMOUS' ? '🌱 Autonoom' : '⚖️ Balanced'}
            </span>
          )}
          {v20Metadata?.fusionStrategy && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-violet-500/10 text-violet-700 dark:bg-violet-500/20 dark:text-violet-400">
              {v20Metadata.fusionStrategy === 'neural_enhanced' ? '🧠 Neural+' : v20Metadata.fusionStrategy === 'weighted_blend' ? '🔬 Hybrid' : '📚 Symbolic'}
            </span>
          )}
          {v20Metadata?.safetyScore !== undefined && v20Metadata.safetyScore < 0.5 && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
              ⚠️ Safety Review
            </span>
          )}
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
            <Gem size={22} className="text-primary drop-shadow-brilliant" />
          </span>
        )}
        
        {/* Quoted reply */}
        {from === 'ai' && repliedToContent && (
          <div className="flex items-center gap-2 text-xs italic opacity-70 text-muted-foreground mb-1.5 ml-2">
            <CornerDownRight size={14} className="flex-shrink-0" />
            <p className="truncate">
              {repliedToContent}
            </p>
          </div>
        )}

        <div
          className={`px-5 py-4 rounded-2xl font-inter shadow-elegant relative text-sm leading-relaxed transition-all duration-300 hover:shadow-glow
            ${from === "ai"
              ? accentColor
                ? ""
                : "glass"
              : "bg-gradient-to-br from-primary-coral/10 to-primary-purple/10"
            }
            ${bubbleStyles}
            ${brilliant ? "ring-2 ring-primary-purple/30 ring-offset-2 shadow-glow" : ""}
            ${isFocused ? "ring-2 ring-yellow-400 ring-offset-2" : ""}
            ${from === "ai" && animate ? "spring" : ""}
            ${from === "user" ? "hover:scale-[1.02]" : ""}
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
              <div className="flex items-center bg-background border border-border rounded-full shadow-sm p-0.5">
                <button
                  onClick={() => onFeedback('like')}
                  className={`p-1 rounded-full transition-colors ${feedback === 'like' ? 'bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400' : 'text-muted-foreground hover:bg-accent'}`}
                  aria-label="Antwoord is nuttig"
                >
                  <ThumbsUp size={14} />
                </button>
                <div className="w-px h-4 bg-border mx-0.5" />
                <button
                  onClick={() => onFeedback('dislike')}
                  className={`p-1 rounded-full transition-colors ${feedback === 'dislike' ? 'bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400' : 'text-muted-foreground hover:bg-accent'}`}
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
