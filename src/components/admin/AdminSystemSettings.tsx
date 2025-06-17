
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Settings, AlertTriangle, Shield, Target } from 'lucide-react';
import { useRubricSettings } from '../../hooks/useRubricSettings';

const AdminSystemSettings = () => {
  const { config, isLoading, updateStrictness, availableLevels } = useRubricSettings();

  const handleStrictnessChange = async (level: string) => {
    const success = await updateStrictness(level as any);
    if (success) {
      toast({
        title: "Instelling bijgewerkt",
        description: `Rubric strengheid is nu ingesteld op: ${level}`,
      });
    } else {
      toast({
        title: "Fout",
        description: "Kon instelling niet opslaan.",
        variant: "destructive",
      });
    }
  };

  const getStrictnessInfo = (level: string) => {
    switch (level) {
      case 'strict':
        return {
          icon: <AlertTriangle className="text-red-500" size={16} />,
          color: 'bg-red-100 text-red-800 border-red-200',
          description: 'Hoge precisie, conservatieve triggers'
        };
      case 'moderate':
        return {
          icon: <Target className="text-yellow-500" size={16} />,
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          description: 'Gebalanceerde aanpak, standaard triggers'
        };
      case 'flexible':
        return {
          icon: <Shield className="text-green-500" size={16} />,
          color: 'bg-green-100 text-green-800 border-green-200',
          description: 'Bredere interpretatie, empathische benadering'
        };
      default:
        return {
          icon: <Settings className="text-gray-500" size={16} />,
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          description: 'Onbekende instelling'
        };
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Settings size={20} />
            <span className="break-words">Systeem Instellingen</span>
          </CardTitle>
          <CardDescription className="text-sm break-words">
            Laden van instellingen...
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
          <Settings size={20} className="flex-shrink-0" />
          <span className="break-words">Rubric Engine Instellingen</span>
        </CardTitle>
        <CardDescription className="text-sm break-words leading-relaxed">
          Bepaal hoe strikt de engine moet zijn bij het analyseren van emotionele patronen en triggers.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
        {/* Current Setting Display */}
        <div className="bg-gray-50 rounded-lg p-3 sm:p-4 overflow-hidden">
          <div className="flex items-center justify-between mb-3 gap-2">
            <span className="text-sm font-medium text-gray-700 flex-shrink-0">
              Huidige instelling:
            </span>
            <div className="flex items-center gap-2 flex-shrink-0">
              {getStrictnessInfo(config.level).icon}
              <Badge variant="outline" className={`${getStrictnessInfo(config.level).color} text-xs`}>
                {config.level}
              </Badge>
            </div>
          </div>
          <p className="text-sm text-gray-600 break-words leading-relaxed">
            {getStrictnessInfo(config.level).description}
          </p>
        </div>

        {/* Strictness Controls */}
        <div className="space-y-3 overflow-hidden">
          <label className="text-sm font-medium text-gray-700 block">
            Kies strengheidsniveau:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {availableLevels.map((level) => {
              const info = getStrictnessInfo(level);
              const isActive = config.level === level;
              
              return (
                <Button
                  key={level}
                  variant={isActive ? "default" : "outline"}
                  onClick={() => handleStrictnessChange(level)}
                  className="flex flex-col items-center gap-2 h-auto py-3 px-2 text-center overflow-hidden"
                >
                  <div className="flex-shrink-0">{info.icon}</div>
                  <span className="font-medium capitalize text-sm break-words">
                    {level}
                  </span>
                  <span className="text-xs text-center opacity-75 break-words leading-tight">
                    {info.description.split(',')[0]}
                  </span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Technical Details */}
        <div className="bg-blue-50 rounded-lg p-3 sm:p-4 border border-blue-200 overflow-hidden">
          <h4 className="text-sm font-semibold text-blue-900 mb-3 break-words">
            Technische Details
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs">
            <div className="break-words">
              <span className="text-blue-700 font-medium block sm:inline">
                Risico Alert:
              </span>
              <span className="text-blue-600 sm:ml-2 block sm:inline">
                {config.thresholds.riskAlert}
              </span>
            </div>
            <div className="break-words">
              <span className="text-blue-700 font-medium block sm:inline">
                Interventie Trigger:
              </span>
              <span className="text-blue-600 sm:ml-2 block sm:inline">
                {config.thresholds.interventionTrigger}
              </span>
            </div>
            <div className="break-words">
              <span className="text-blue-700 font-medium block sm:inline">
                Risico Multiplier:
              </span>
              <span className="text-blue-600 sm:ml-2 block sm:inline">
                {config.weights.riskMultiplier}x
              </span>
            </div>
            <div className="break-words">
              <span className="text-blue-700 font-medium block sm:inline">
                Beschermend Multiplier:
              </span>
              <span className="text-blue-600 sm:ml-2 block sm:inline">
                {config.weights.protectiveMultiplier}x
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminSystemSettings;
