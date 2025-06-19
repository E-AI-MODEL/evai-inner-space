
import React from 'react';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Brain } from 'lucide-react';

interface AutonomousAIModeHeaderProps {
  isAutonomous: boolean;
  onToggle: (checked: boolean) => void;
}

const AutonomousAIModeHeader: React.FC<AutonomousAIModeHeaderProps> = ({
  isAutonomous,
  onToggle
}) => {
  console.log('🔧 AutonomousAIModeHeader render:', { isAutonomous });
  
  return (
    <CardHeader className="pb-3">
      <CardTitle className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain 
            className={`w-5 h-5 ${isAutonomous ? 'text-purple-600' : 'text-gray-400'}`} 
          />
          <span className="text-base font-semibold">Autonome AI Modus</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium ${isAutonomous ? 'text-purple-600' : 'text-gray-500'}`}>
            {isAutonomous ? 'AAN' : 'UIT'}
          </span>
          <Switch
            checked={isAutonomous}
            onCheckedChange={onToggle}
            className="data-[state=checked]:bg-purple-600"
          />
        </div>
      </CardTitle>
    </CardHeader>
  );
};

export default AutonomousAIModeHeader;
