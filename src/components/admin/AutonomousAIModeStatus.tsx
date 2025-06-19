
import React from 'react';
import { Badge } from '@/components/ui/badge';

interface AutonomousAIModeStatusProps {
  isAutonomous: boolean;
}

const AutonomousAIModeStatus: React.FC<AutonomousAIModeStatusProps> = ({
  isAutonomous
}) => {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-700">Status:</span>
      <Badge variant={isAutonomous ? "default" : "secondary"}>
        {isAutonomous ? "ACTIEF" : "UITGESCHAKELD"}
      </Badge>
    </div>
  );
};

export default AutonomousAIModeStatus;
