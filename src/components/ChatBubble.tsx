
import React, { forwardRef, useState } from "react";
import { Gem, Info } from "lucide-react";

interface ChatBubbleProps {
  from: "user" | "ai";
  label: "Valideren" | "Reflectievraag" | "Suggestie" | "Fout" | null;
  accentColor?: string;
  children: React.ReactNode;
  meta?: React.ReactNode;
  explainText?: string;
  emotionSeed?: string;
  animate?: boolean;
  brilliant?: boolean;
  isFocused?: boolean;
}

const LABEL_CLASSES = {
  Valideren: "bg-blue-100 text-blue-900",
  Reflectievraag: "bg-green-100 text-green-900",
  Suggestie: "bg-purple-100 text-purple-800",
  Fout: "bg-red-100 text-red-900",
};

const ChatBubble = forwardRef<HTMLDivElement, ChatBubbleProps>(({
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
}, ref) => {
  const [isExplainVisible, setIsExplainVisible] = useState(false);

  const bubbleStyles =
    from === "user"
      ? "bg-white text-zinc-800 border border-zinc-200"
      : accentColor
      ? ""
      : "bg-zinc-100 text-zinc-800";
  return (
    <div
      ref={ref}
      className={`flex flex-col items-start gap-1 mb-4 ${from === "user" ? "items-end" : "items-start"} ${
        animate ? "animate-fade-in" : ""
      }`}
      data-seed={emotionSeed}
    >
      {from === "ai" && label && (
        <span
          className={`mb-0.5 ml-2 px-2 py-0.5 rounded-full text-xs font-medium tracking-wide opacity-80 ${LABEL_CLASSES[label] ?? "bg-zinc-100 text-zinc-600"}`}
        >
          {label}
        </span>
      )}
      <div className={`relative w-fit`}>
        {/* Brilliant/diamond sparkle */}
        {brilliant && (
          <span className="absolute -left-6 -top-2 z-10 animate-fade-in pointer-events-none">
            <Gem size={22} className="text-blue-400 drop-shadow-brilliant" />
          </span>
        )}

        <div
          className={`max-w-[70vw] px-4 py-3 rounded-xl font-inter shadow-card relative text-base leading-snug transition-all duration-300
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
          data-ttl={meta}
        >
          {children}
          
          {/* Uitleg-toggle per bericht */}
          {from === 'ai' && explainText && (
            <button 
              onClick={() => setIsExplainVisible(v => !v)} 
              className="absolute -bottom-3 -right-2 bg-white border border-zinc-200 rounded-full p-1.5 shadow-sm hover:bg-zinc-100 transition-all focus:outline-none focus:ring-2 focus:ring-blue-400"
              aria-label={isExplainVisible ? "Verberg redenatie" : "Toon redenatie"}
            >
              <Info size={14} className="text-zinc-500" />
            </button>
          )}
        </div>
        {/* Uitleg-tekst */}
        {isExplainVisible && explainText && (
          <div className="mt-2 text-xs italic opacity-80 transition-all max-w-[70vw] p-3 bg-zinc-50 border rounded-lg ml-2" style={{ fontFamily: "Inter, sans-serif" }}>
            {explainText}
          </div>
        )}
      </div>
    </div>
  );
});

ChatBubble.displayName = "ChatBubble";

export default ChatBubble;
