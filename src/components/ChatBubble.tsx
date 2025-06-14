
import React from "react";

interface ChatBubbleProps {
  from: "user" | "ai";
  label: "Valideren" | "Reflectievraag" | "Suggestie" | null;
  accentColor?: string;
  children: React.ReactNode;
  meta?: React.ReactNode;
  showExplain?: boolean;
  explainText?: string;
  emotionSeed?: string;
  animate?: boolean;
}

const LABEL_CLASSES = {
  Valideren: "bg-blue-100 text-blue-900",
  Reflectievraag: "bg-green-100 text-green-900",
  Suggestie: "bg-purple-100 text-purple-800",
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
        animate ? "animate-fade-slide-in" : ""
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

      <div
        className={`max-w-[70vw] px-4 py-3 rounded-xl font-inter shadow-card relative text-base leading-snug
          ${from === "ai"
            ? accentColor
              ? ""
              : "bg-stress/60"
            : "bg-white"
          }
          ${bubbleStyles}
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
  );
};

export default ChatBubble;
