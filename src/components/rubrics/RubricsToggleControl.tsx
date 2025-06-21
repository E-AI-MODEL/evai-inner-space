
import React from 'react';
import { Button } from '@/components/ui/button';
import { BarChart } from 'lucide-react';
import RubricsEngineStatusIndicator from './RubricsEngineStatusIndicator';
import { Message } from '../../types';

interface RubricsToggleControlProps {
  isActive: boolean;
  onToggle: () => void;
  messages: Message[];
  disabled?: boolean;
}

const RubricsToggleControl: React.FC<RubricsToggleControlProps> = ({
  isActive,
  onToggle,
  messages,
  disabled = false
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
      
      <div className="hidden md:block">
        <RubricsEngineStatusIndicator messages={messages} isActive={isActive} />
      </div>
    </div>
  );
};

export default RubricsToggleControl;
