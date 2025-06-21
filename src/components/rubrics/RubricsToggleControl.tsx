
import React from 'react';
import { Button } from '@/components/ui/button';
import { BarChart, Minimize2, Maximize2 } from 'lucide-react';
import RubricsEngineStatusIndicator from './RubricsEngineStatusIndicator';
import { Message } from '../../types';

interface RubricsToggleControlProps {
  isActive: boolean;
  onToggle: () => void;
  messages: Message[];
  disabled?: boolean;
  mode?: 'compact' | 'full';
  onModeChange?: (mode: 'compact' | 'full') => void;
}

const RubricsToggleControl: React.FC<RubricsToggleControlProps> = ({
  isActive,
  onToggle,
  messages,
  disabled = false,
  mode = 'compact',
  onModeChange
}) => {
  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={onToggle}
        disabled={disabled}
        variant="outline"
        size="sm"
        className={`
          flex items-center gap-2 px-3 py-2 transition-all duration-200
          ${isActive 
            ? 'bg-blue-100 hover:bg-blue-200 text-blue-800 border-blue-300' 
            : 'bg-gray-50 hover:bg-gray-100 text-gray-600 border-gray-200'
          }
        `}
        aria-label={`EvAI 5.6 Analyse ${isActive ? 'uitschakelen' : 'inschakelen'}`}
      >
        <BarChart size={16} />
        <span className="hidden sm:inline text-xs font-medium">
          {isActive ? 'Analyse Aan' : 'Analyse Uit'}
        </span>
      </Button>
      
      {/* Mode toggle button - only show when analytics is active and we have mode control */}
      {isActive && onModeChange && messages.length > 3 && (
        <Button
          onClick={() => onModeChange(mode === 'compact' ? 'full' : 'compact')}
          variant="ghost"
          size="sm"
          className="p-2"
          title={mode === 'compact' ? 'Uitgebreid weergeven' : 'Compact weergeven'}
        >
          {mode === 'compact' ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
        </Button>
      )}
      
      <div className="hidden md:block">
        <RubricsEngineStatusIndicator messages={messages} isActive={isActive} />
      </div>
    </div>
  );
};

export default RubricsToggleControl;
