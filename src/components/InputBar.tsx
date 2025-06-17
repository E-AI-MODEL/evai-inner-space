
import React, { useRef } from "react";
import { Send } from "lucide-react";

const InputBar: React.FC<{
  value: string;
  onChange: (val: string) => void;
  onSend: () => void;
  disabled?: boolean;
}> = ({ value, onChange, onSend, disabled }) => {
  const ref = useRef<HTMLTextAreaElement>(null);

  // Enter key verzenden, Ctrl+Enter voor nieuwe regel
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      if (!disabled && value.trim()) onSend();
    }
    // Ctrl+Enter of Shift+Enter voor nieuwe regel (default gedrag)
  };

  return (
    <form
      className="flex gap-3 items-end bg-white shadow-card rounded-xl px-3 py-2 my-3 border border-zinc-200 mx-auto w-full"
      onSubmit={e => {
        e.preventDefault();
        if (!disabled && value.trim()) onSend();
      }}
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      <textarea
        ref={ref}
        rows={1}
        className="resize-none w-full border-none bg-transparent outline-none p-0 text-sm md:text-base min-h-[32px] max-h-[100px] font-inter flex-1 leading-relaxed"
        placeholder="Vertel wat je voelt…"
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        onKeyDown={handleKeyDown}
        aria-label="Typ je gevoel"
        style={{ 
          fontSize: 'max(16px, 1rem)', // Prevents zoom on iOS
          lineHeight: '1.5'
        }}
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="ml-1 p-2 rounded-lg bg-blue-100 hover:bg-blue-200 transition-colors disabled:opacity-60 flex-shrink-0"
        aria-label="Verzenden"
      >
        <Send size={18} className="text-blue-700" />
      </button>
    </form>
  );
};

export default InputBar;
