
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
}> = ({ history = [], onFocus, onClear, className = "" }) => {
  const isFlexRow = className?.includes('flex-row');
  
  return (
    <aside
      className={cn(
        "flex bg-sidebar border-zinc-200 sticky overflow-y-auto",
        isFlexRow 
          ? "flex-row flex-wrap justify-center items-start gap-4 p-4" 
          : "flex-col justify-between w-20 py-6 px-2 border-r min-h-[calc(100vh-56px)] top-14 h-[calc(100vh-56px)]",
        className
      )}
      style={{ fontFamily: "Inter, sans-serif" }}
    >
      <div className={cn(
        "flex items-center",
        isFlexRow ? "flex-row flex-wrap justify-center gap-4 w-full" : "flex-col gap-4"
      )}>
        {history.map((item) => (
          <button
            key={item.id}
            className={`relative group flex flex-col items-center justify-center w-16 h-16 rounded-2xl border-2 border-white ${item.colorClass} hover:shadow-glow-sm focus:outline-none transition-all duration-300 hover:scale-110 hover:-translate-y-1`}
            title={`${item.label} · ${item.time}`}
            onClick={() => onFocus?.(item.id)}
            aria-label={`${item.label} om ${item.time}`}
          >
            <Icon name={item.icon} className="text-white drop-shadow-md" size={32} />
            <span className={cn(
              "absolute text-xs opacity-0 group-hover:opacity-100 glass-strong text-foreground rounded-lg px-3 py-1.5 duration-200 pointer-events-none z-10 shadow-elegant font-medium",
              isFlexRow 
                ? "-top-10 left-1/2 -translate-x-1/2" 
                : "-bottom-10 left-1/2 -translate-x-1/2"
            )}>
              {item.label} · {item.time}
            </span>
          </button>
        ))}
      </div>
      
      {onClear && (
        <div className={cn(
          "flex justify-center",
          isFlexRow ? "w-full pt-4" : "mt-auto pt-4"
        )}>
          <button
            onClick={onClear}
            className="relative group flex items-center justify-center w-14 h-14 rounded-2xl border-2 border-transparent hover:border-red-300 bg-gradient-to-br from-zinc-100 to-zinc-200 hover:from-red-100 hover:to-red-200 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-400 hover:scale-105 hover:shadow-elegant"
            title="Wis geschiedenis"
            aria-label="Wis de volledige chatgeschiedenis"
          >
            <Trash2 className="text-zinc-500 group-hover:text-red-600 transition-colors" size={24} />
            <span className={cn(
              "absolute text-xs opacity-0 group-hover:opacity-100 bg-zinc-900 text-white rounded px-2 py-0.5 duration-200 pointer-events-none z-10",
              isFlexRow 
                ? "-top-8 left-1/2 -translate-x-1/2" 
                : "-bottom-7 left-1/2 -translate-x-1/2"
            )}>
              Wis alles
            </span>
          </button>
        </div>
      )}
    </aside>
  );
};

export default SidebarEmotionHistory;
