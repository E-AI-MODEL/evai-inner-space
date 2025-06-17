
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
          description: 'Hoge precisie, meer conservatieve triggers'
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
          description: 'Bredere interpretatie, meer empathische benadering'
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings size={20} />
            Systeem Instellingen
          </CardTitle>
          <CardDescription>Laden van instellingen...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings size={20} />
          Rubric Engine Instellingen
        </CardTitle>
        <CardDescription>
          Bepaal hoe strikt de engine moet zijn bij het analyseren van emotionele patronen en triggers.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Setting Display */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">Huidige instelling:</span>
            <div className="flex items-center gap-2">
              {getStrictnessInfo(config.level).icon}
              <Badge variant="outline" className={getStrictnessInfo(config.level).color}>
                {config.level}
              </Badge>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            {getStrictnessInfo(config.level).description}
          </p>
        </div>

        {/* Strictness Controls */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-700">Kies strengheidsniveau:</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {availableLevels.map((level) => {
              const info = getStrictnessInfo(level);
              const isActive = config.level === level;
              
              return (
                <Button
                  key={level}
                  variant={isActive ? "default" : "outline"}
                  onClick={() => handleStrictnessChange(level)}
                  className="flex flex-col items-center gap-2 h-auto py-4"
                >
                  {info.icon}
                  <span className="font-medium capitalize">{level}</span>
                  <span className="text-xs text-center opacity-75">
                    {info.description.split(',')[0]}
                  </span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Technical Details */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">Technische Details</h4>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-blue-700 font-medium">Risico Alert:</span>
              <span className="text-blue-600 ml-2">{config.thresholds.riskAlert}</span>
            </div>
            <div>
              <span className="text-blue-700 font-medium">Interventie Trigger:</span>
              <span className="text-blue-600 ml-2">{config.thresholds.interventionTrigger}</span>
            </div>
            <div>
              <span className="text-blue-700 font-medium">Risico Multiplier:</span>
              <span className="text-blue-600 ml-2">{config.weights.riskMultiplier}x</span>
            </div>
            <div>
              <span className="text-blue-700 font-medium">Beschermend Multiplier:</span>
              <span className="text-blue-600 ml-2">{config.weights.protectiveMultiplier}x</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminSystemSettings;
