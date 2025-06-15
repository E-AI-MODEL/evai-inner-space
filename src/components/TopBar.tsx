
import { Settings } from "lucide-react";

const TopBar = () => (
  <header className="flex items-center justify-between h-14 px-6 bg-white/90 shadow-sm border-b border-zinc-100 sticky top-0 z-30 font-inter">
    <div className="flex items-center gap-2">
      <span aria-label="EvAI logo" className="text-2xl select-none">💙</span>
      <span className="font-semibold text-lg tracking-wide text-zinc-800">EvAI Bèta Chat</span>
    </div>
    <button
      type="button"
      className="p-2 rounded-lg hover:bg-zinc-100 transition-colors"
      aria-label="Instellingen openen"
    >
      <Settings size={22} />
    </button>
  </header>
);

export default TopBar;
