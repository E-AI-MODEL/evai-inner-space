
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
  return (
    <CardHeader>
      <CardTitle className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-600" />
          <span>Autonome AI Modus</span>
        </div>
        <Switch
          checked={isAutonomous}
          onCheckedChange={onToggle}
          className="data-[state=checked]:bg-purple-600"
        />
      </CardTitle>
    </CardHeader>
  );
};

export default AutonomousAIModeHeader;
