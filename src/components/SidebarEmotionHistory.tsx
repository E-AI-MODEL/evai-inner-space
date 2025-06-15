
import React from "react";
import Icon from "./Icon";

interface EmotionHistoryItem {
  id: string;
  icon: string;
  label: string;
  colorClass: string;
  time: string;
}

const SidebarEmotionHistory: React.FC<{
  history?: EmotionHistoryItem[];
  onFocus?: (id: string) => void;
}> = ({ history = [], onFocus }) => (
  <aside className="hidden md:flex flex-col bg-sidebar w-20 py-6 px-2 border-r border-zinc-200 min-h-[calc(100vh-56px)]" style={{ fontFamily: "Inter, sans-serif" }}>
    <div className="flex flex-col gap-4 items-center">
      {history.map((item) => (
        <button
          key={item.id}
          className={`relative group flex flex-col items-center justify-center w-12 h-12 rounded-full border-2 border-white shadow-card ${item.colorClass} hover:ring-2 hover:ring-accent focus:outline-none`}
          title={`${item.label} · ${item.time}`}
          onClick={() => onFocus?.(item.id)}
          aria-label={`${item.label} om ${item.time}`}
        >
          <Icon name={item.icon as any} className="text-zinc-700" size={24} />
          <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-xs opacity-0 group-hover:opacity-100 bg-zinc-900 text-white rounded px-2 py-0.5 duration-200 pointer-events-none">{item.label} · {item.time}</span>
        </button>
      ))}
    </div>
  </aside>
);

export default SidebarEmotionHistory;
