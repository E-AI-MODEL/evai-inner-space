
import React, { useRef } from "react";
import { Send } from "lucide-react";

const InputBar: React.FC<{
  value: string;
  onChange: (val: string) => void;
  onSend: () => void;
  disabled?: boolean;
}> = ({ value, onChange, onSend, disabled }) => {
  const ref = useRef<HTMLTextAreaElement>(null);

  // Ctrl+Enter snel verzenden
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      if (!disabled && value.trim()) onSend();
    }
    // Automatische hoogtes (optioneel, basic via CSS)
  };

  return (
    <form
      className="flex gap-3 items-end bg-white shadow-card rounded-xl px-4 py-2 my-4 border border-zinc-200"
      onSubmit={e => {
        e.preventDefault();
        if (!disabled && value.trim()) onSend();
      }}
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      <textarea
        ref={ref}
        rows={1}
        className="resize-none w-full border-none bg-transparent outline-none p-0 text-base min-h-[36px] max-h-[120px] font-inter flex-1"
        placeholder="Vertel wat je voelt…"
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        onKeyDown={handleKeyDown}
        aria-label="Typ je gevoel"
      />
      <button
        type="submit"
        disabled={disabled || !value.trim()}
        className="ml-1 p-2 rounded-lg bg-blue-100 hover:bg-blue-200 transition-colors disabled:opacity-60"
        aria-label="Verzenden"
      >
        <Send size={20} className="text-blue-700" />
      </button>
    </form>
  );
};

export default InputBar;
