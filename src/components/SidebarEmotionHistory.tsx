
import React from "react";
import Icon from "./Icon";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

import type dynamicIconImports from 'lucide-react/dynamicIconImports';

interface EmotionHistoryItem {
  id: string;
  icon: keyof typeof dynamicIconImports;
  label: string;
  colorClass: string;
  time: string;
}

const SidebarEmotionHistory: React.FC<{
  history?: EmotionHistoryItem[];
  onFocus?: (id: string) => void;
  onClear?: () => void;
  className?: string;
}> = ({ history = [], onFocus, onClear, className }) => (
  <aside
    className={cn(
      "hidden md:flex flex-col justify-between bg-sidebar w-20 py-6 px-2 border-r border-zinc-200 min-h-[calc(100vh-56px)] sticky top-14 overflow-y-auto h-[calc(100vh-56px)]",
      className
    )}
    style={{ fontFamily: "Inter, sans-serif" }}
  >
    <div className="flex flex-col gap-4 items-center">
      {history.map((item) => (
        <button
          key={item.id}
          className={`relative group flex flex-col items-center justify-center w-12 h-12 rounded-full border-2 border-white shadow-card ${item.colorClass} hover:ring-2 hover:ring-accent focus:outline-none`}
          title={`${item.label} · ${item.time}`}
          onClick={() => onFocus?.(item.id)}
          aria-label={`${item.label} om ${item.time}`}
        >
          <Icon name={item.icon} className="text-zinc-700" size={24} />
          <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-xs opacity-0 group-hover:opacity-100 bg-zinc-900 text-white rounded px-2 py-0.5 duration-200 pointer-events-none">{item.label} · {item.time}</span>
        </button>
      ))}
    </div>
    
    {onClear && (
        <div className="flex justify-center mt-auto pt-4">
            <button
              onClick={onClear}
              className="relative group flex items-center justify-center w-12 h-12 rounded-full border-2 border-transparent hover:border-red-200 bg-zinc-100 hover:bg-red-100 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-red-400"
              title="Wis geschiedenis"
              aria-label="Wis de volledige chatgeschiedenis"
            >
              <Trash2 className="text-zinc-500 group-hover:text-red-600 transition-colors" size={22} />
              <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 text-xs opacity-0 group-hover:opacity-100 bg-zinc-900 text-white rounded px-2 py-0.5 duration-200 pointer-events-none">Wis alles</span>
            </button>
        </div>
    )}
  </aside>
);

export default SidebarEmotionHistory;
