
import React, { forwardRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown, AlertCircle, Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatBubbleProps {
  children: React.ReactNode;
  from: "user" | "ai";
  label?: "Valideren" | "Reflectievraag" | "Suggestie" | "Fout" | "Configuratie" | "OpenAI" | null;
  accentColor?: string;
  meta?: string;
  emotionSeed?: string | null;
  animate?: boolean;
  explainText?: string;
  brilliant?: boolean;
  repliedToContent?: string;
  feedback?: "like" | "dislike" | null;
  onFeedback?: (feedback: "like" | "dislike") => void;
  isFocused?: boolean;
}

const ChatBubble = forwardRef<HTMLDivElement, ChatBubbleProps>(({
  children,
  from,
  label,
  accentColor,
  meta,
  emotionSeed,
  animate = false,
  explainText,
  brilliant = false,
  repliedToContent,
  feedback,
  onFeedback,
  isFocused = false,
}, ref) => {
  const isUser = from === "user";
  const bgColor = isUser ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-900";
  const alignment = isUser ? "justify-end" : "justify-start";

  const getLabelColor = (labelType?: string | null) => {
    switch (labelType) {
      case "Valideren": return "bg-green-100 text-green-800";
      case "Reflectievraag": return "bg-blue-100 text-blue-800";
      case "Suggestie": return "bg-purple-100 text-purple-800";
      case "Fout": return "bg-red-100 text-red-800";
      case "Configuratie": return "bg-yellow-100 text-yellow-800";
      case "OpenAI": return "bg-indigo-100 text-indigo-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getEmotionIcon = (emotion?: string | null) => {
    switch (emotion) {
      case "error":
        return <AlertCircle size={16} />;
      case "warning":
        return <AlertCircle size={16} />;
      default:
        return <Heart size={16} />;
    }
  };

  return (
    <div ref={ref} className={cn("flex", alignment, isFocused && "ring-2 ring-blue-300 rounded-lg p-1")}>
      <div className={cn("max-w-[80%] rounded-lg px-4 py-3", bgColor, animate && "animate-fadeIn")}>
        {repliedToContent && (
          <div className="text-xs opacity-70 mb-2 p-2 bg-black/10 rounded border-l-2 border-white/30">
            {repliedToContent.length > 50 ? `${repliedToContent.substring(0, 50)}...` : repliedToContent}
          </div>
        )}
        
        {label && (
          <div className="flex items-center gap-2 mb-2">
            <Badge className={cn("text-xs", getLabelColor(label))}>
              {label}
            </Badge>
            {brilliant && <span className="text-lg">✨</span>}
            {emotionSeed && getEmotionIcon(emotionSeed)}
            {meta && <span className="text-xs opacity-70">{meta}</span>}
          </div>
        )}
        
        <div className="whitespace-pre-wrap">{children}</div>
        
        {explainText && (
          <div className="text-xs opacity-70 mt-2 italic">
            {explainText}
          </div>
        )}
        
        {!isUser && onFeedback && (
          <div className="flex gap-1 mt-2">
            <Button
              size="sm"
              variant={feedback === "like" ? "default" : "ghost"}
              onClick={() => onFeedback("like")}
              className="h-6 px-2"
            >
              <ThumbsUp size={12} />
            </Button>
            <Button
              size="sm"
              variant={feedback === "dislike" ? "default" : "ghost"}
              onClick={() => onFeedback("dislike")}
              className="h-6 px-2"
            >
              <ThumbsDown size={12} />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
});

ChatBubble.displayName = "ChatBubble";

export default ChatBubble;
