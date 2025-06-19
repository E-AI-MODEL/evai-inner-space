
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Gauge, AlertTriangle, Shield, Settings, Loader2, CheckCircle } from 'lucide-react';
import { useRubricSettings, RubricStrictnessLevel } from '../hooks/useRubricSettings';
import { useToast } from '@/hooks/use-toast';

const RubricStrictnessControl: React.FC = () => {
  const { config, isLoading, updateStrictness, availableLevels } = useRubricSettings();
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

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
    console.log('🔧 Quick control: changing to', level);
    setIsSaving(true);
    
    try {
      const success = await updateStrictness(level);
      
      if (success) {
        console.log('✅ Quick control: saved successfully');
        toast({ 
          title: "✅ Instelling bijgewerkt", 
          description: `Rubric niveau: ${getStrictnessInfo(level).shortLabel}`,
          duration: 2000
        });
      } else {
        console.error('❌ Quick control: failed to save');
        toast({ 
          title: "❌ Fout", 
          description: "Kon instelling niet opslaan",
          variant: "destructive",
          duration: 3000
        });
      }
    } catch (error) {
      console.error('❌ Quick control error:', error);
      toast({ 
        title: "❌ Fout", 
        description: "Onverwachte fout opgetreden",
        variant: "destructive",
        duration: 3000
      });
    } finally {
      setIsSaving(false);
    }
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
          <span className="truncate">Snelle Gevoeligheidscontrole</span>
          {isSaving && <Loader2 className="w-3 h-3 animate-spin" />}
          {!isSaving && <CheckCircle className="w-3 h-3 text-green-600" />}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <Badge className={`${currentInfo.color} text-xs flex items-center gap-1`} variant="outline">
            {currentInfo.icon}
            <span className="truncate">{currentInfo.shortLabel}</span>
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-1">
          {availableLevels.map((level) => {
            const info = getStrictnessInfo(level);
            const isActive = level === config.level;
            
            return (
              <Button
                key={level}
                size="sm"
                variant={isActive ? "default" : "outline"}
                className={`text-xs h-7 px-2 ${isActive ? '' : 'text-gray-600'}`}
                onClick={() => handleStrictnessChange(level)}
                disabled={isActive || isSaving}
              >
                <span className="flex-shrink-0">{info.icon}</span>
              </Button>
            );
          })}
        </div>

        <p className="text-xs text-gray-500 leading-relaxed">
          {currentInfo.description}
        </p>

        {isSaving && (
          <p className="text-xs text-blue-600">
            Instelling wordt opgeslagen...
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default RubricStrictnessControl;
