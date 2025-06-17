
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
          icon: <Shield className="w-4 h-4" />,
          color: 'bg-green-100 text-green-800 border-green-200',
          description: 'Hogere drempelwaarden, minder gevoelig voor kleine risico\'s'
        };
      case 'moderate':
        return {
          icon: <Gauge className="w-4 h-4" />,
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          description: 'Gebalanceerde gevoeligheid voor risico- en beschermende factoren'
        };
      case 'strict':
        return {
          icon: <AlertTriangle className="w-4 h-4" />,
          color: 'bg-red-100 text-red-800 border-red-200',
          description: 'Lagere drempelwaarden, zeer gevoelig voor risicosignalen'
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
          <Gauge className="w-4 h-4" />
          Rubric Gevoeligheid
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge className={currentInfo.color} variant="outline">
            {currentInfo.icon}
            <span className="ml-1 capitalize">{config.level}</span>
          </Badge>
        </div>
        
        <p className="text-xs text-gray-600 leading-relaxed">
          {currentInfo.description}
        </p>

        <div className="grid grid-cols-3 gap-1">
          {availableLevels.map((level) => {
            const info = getStrictnessInfo(level);
            const isActive = level === config.level;
            
            return (
              <Button
                key={level}
                size="sm"
                variant={isActive ? "default" : "outline"}
                className={`text-xs h-8 ${isActive ? '' : 'text-gray-600'}`}
                onClick={() => handleStrictnessChange(level)}
                disabled={isActive}
              >
                {info.icon}
                <span className="ml-1 capitalize">{level}</span>
              </Button>
            );
          })}
        </div>

        <div className="border-t pt-3">
          <div className="text-xs text-gray-500 space-y-1">
            <div>Risico drempel: {config.thresholds.riskAlert}</div>
            <div>Hoog risico: {config.thresholds.overallRiskHigh}%</div>
            <div>Beschermende factoren: {config.thresholds.protectiveFactorsMin}+</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RubricStrictnessControl;
