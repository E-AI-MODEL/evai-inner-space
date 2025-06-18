
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Gauge, AlertTriangle, Shield, Settings } from 'lucide-react';
import { useRubricSettings, RubricStrictnessLevel } from '../hooks/useRubricSettings';

const RubricStrictnessControl: React.FC = () => {
  const { config, isLoading, updateStrictness, availableLevels } = useRubricSettings();

  const getStrictnessInfo = (level: RubricStrictnessLevel) => {
    switch (level) {
      case 'flexible':
        return {
          icon: <Shield className="w-3 h-3" />,
          color: 'bg-green-100 text-green-800 border-green-200',
          description: 'Hogere drempelwaarden, minder gevoelig',
          shortLabel: 'Flexibel'
        };
      case 'moderate':
        return {
          icon: <Gauge className="w-3 h-3" />,
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          description: 'Gebalanceerde gevoeligheid',
          shortLabel: 'Gemiddeld'
        };
      case 'strict':
        return {
          icon: <AlertTriangle className="w-3 h-3" />,
          color: 'bg-red-100 text-red-800 border-red-200',
          description: 'Lagere drempelwaarden, zeer gevoelig',
          shortLabel: 'Strikt'
        };
    }
  };

  const handleStrictnessChange = async (level: RubricStrictnessLevel) => {
    await updateStrictness(level);
  };

  if (isLoading) {
    return (
      <Card className="bg-white/60 backdrop-blur-sm border-white/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 animate-spin" />
            <span className="text-sm text-gray-600">Laden...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentInfo = getStrictnessInfo(config.level);

  return (
    <Card className="bg-white/60 backdrop-blur-sm border-white/20 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Gauge className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">Rubric Gevoeligheid</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge className={`${currentInfo.color} text-xs flex items-center gap-1`} variant="outline">
            {currentInfo.icon}
            <span className="truncate">{currentInfo.shortLabel}</span>
          </Badge>
        </div>
        
        <p className="text-xs text-gray-600 leading-relaxed break-words">
          {currentInfo.description}
        </p>

        <div className="space-y-2">
          {availableLevels.map((level) => {
            const info = getStrictnessInfo(level);
            const isActive = level === config.level;
            
            return (
              <Button
                key={level}
                size="sm"
                variant={isActive ? "default" : "outline"}
                className={`w-full text-xs h-8 justify-start gap-2 ${isActive ? '' : 'text-gray-600'}`}
                onClick={() => handleStrictnessChange(level)}
                disabled={isActive}
              >
                <span className="flex-shrink-0">{info.icon}</span>
                <span className="truncate">{info.shortLabel}</span>
              </Button>
            );
          })}
        </div>

        <div className="border-t pt-3 space-y-1 text-xs text-gray-500">
          <div className="flex justify-between items-center">
            <span className="truncate">Risico drempel:</span>
            <span className="flex-shrink-0 ml-2">{config.thresholds.riskAlert}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="truncate">Hoog risico:</span>
            <span className="flex-shrink-0 ml-2">{config.thresholds.overallRiskHigh}%</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="truncate">Beschermend min:</span>
            <span className="flex-shrink-0 ml-2">{config.thresholds.protectiveFactorsMin}+</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RubricStrictnessControl;
