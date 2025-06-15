import React from "react";
import { Gem } from "lucide-react";

interface ChatBubbleProps {
  from: "user" | "ai";
  label: "Valideren" | "Reflectievraag" | "Suggestie" | "Fout" | null;
  accentColor?: string;
  children: React.ReactNode;
  meta?: React.ReactNode;
  showExplain?: boolean;
  explainText?: string;
  emotionSeed?: string;
  animate?: boolean;
  brilliant?: boolean; // Nieuw: highlight voor seed-matching
}

const LABEL_CLASSES = {
  Valideren: "bg-blue-100 text-blue-900",
  Reflectievraag: "bg-green-100 text-green-900",
  Suggestie: "bg-purple-100 text-purple-800",
  Fout: "bg-red-100 text-red-900",
};

const ChatBubble: React.FC<ChatBubbleProps> = ({
  from,
  label,
  accentColor,
  children,
  meta,
  showExplain,
  explainText,
  emotionSeed,
  animate,
  brilliant,
}) => {
  const bubbleStyles =
    from === "user"
      ? "bg-white text-zinc-800 border border-zinc-200"
      : accentColor
      ? ""
      : "bg-stress/60 text-zinc-800";
  return (
    <div
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
          className={`max-w-[70vw] px-4 py-3 rounded-xl font-inter shadow-card relative text-base leading-snug transition-shadow
            ${from === "ai"
              ? accentColor
                ? ""
                : "bg-stress/60"
              : "bg-white"
            }
            ${bubbleStyles}
            ${brilliant ? "ring-2 ring-blue-200 ring-offset-2 shadow-lg" : ""}
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
          {/* Uitleg-toggle */}
          {showExplain && explainText && (
            <div className="mt-2 text-xs italic opacity-80 transition-all max-h-36 overflow-hidden bubble-ai__explain" style={{ fontFamily: "Inter, sans-serif" }}>
              {explainText}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;
