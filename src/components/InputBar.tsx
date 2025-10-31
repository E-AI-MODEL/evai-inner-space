
import React, { useRef } from "react";
import { Send } from "lucide-react";
import { useIsMobile } from "../hooks/use-mobile";

const InputBar: React.FC<{
  value: string;
  onChange: (val: string) => void;
  onSend: (message: string) => void;
  disabled?: boolean;
}> = ({ value, onChange, onSend, disabled }) => {
  const ref = useRef<HTMLTextAreaElement>(null);
  const isMobile = useIsMobile();

  // Enter key verzenden, Ctrl+Enter voor nieuwe regel
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      if (!disabled && value.trim()) onSend(value);
    }
    // Ctrl+Enter of Shift+Enter voor nieuwe regel (default gedrag)
  };

  return (
    <form
      className={`flex gap-3 items-end bg-background shadow-card rounded-xl border border-border mx-auto w-full ${
        isMobile 
          ? 'px-2 py-2 my-2' 
          : 'px-3 py-2 my-3'
      }`}
      onSubmit={e => {
        e.preventDefault();
        if (!disabled && value.trim()) onSend(value);
      }}
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      <textarea
        ref={ref}
        rows={1}
        className={`resize-none w-full border-none bg-transparent outline-none p-0 min-h-[32px] max-h-[100px] font-inter flex-1 leading-relaxed`}
        placeholder="Vertel wat je voelt…"
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        onKeyDown={handleKeyDown}
        aria-label="Typ je gevoel"
        style={{ 
          fontSize: '16px', // Fixed font-size to prevent zoom on iOS
          lineHeight: '1.5'
        }}
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className={`rounded-lg bg-blue-100 hover:bg-blue-200 transition-colors disabled:opacity-60 flex-shrink-0 ${
          isMobile 
            ? 'ml-1 p-2' 
            : 'ml-1 p-2'
        }`}
        aria-label="Verzenden"
      >
        <Send size={18} className="text-blue-700" />
      </button>
    </form>
  );
};

export default InputBar;
