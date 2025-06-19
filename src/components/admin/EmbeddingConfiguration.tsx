
import React, { useState } from 'react';
import { Settings, Zap, Database, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useOptimizedEmbeddings } from '../../hooks/useOptimizedEmbeddings';

const EmbeddingConfiguration: React.FC = () => {
  const { 
    config, 
    updateConfig, 
    dailyCount, 
    maxDailyEmbeddings, 
    embeddingsRemaining,
    resetDailyCount 
  } = useOptimizedEmbeddings();

  const [localConfig, setLocalConfig] = useState(config);

  const handleSaveConfig = () => {
    updateConfig(localConfig);
  };

  const handleReset = () => {
    resetDailyCount();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-yellow-500" />
          Embedding Optimalisatie
        </CardTitle>
        <CardDescription>
          Configureer hoe en wanneer het systeem embeddings creëert voor efficiënte prestaties
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{dailyCount}</div>
            <div className="text-sm text-gray-600">Vandaag gebruikt</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{embeddingsRemaining}</div>
            <div className="text-sm text-gray-600">Nog beschikbaar</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {config.enabled ? '✓' : '✗'}
            </div>
            <div className="text-sm text-gray-600">Status</div>
          </div>
        </div>

        {/* Configuration Options */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="enabled">Embeddings ingeschakeld</Label>
              <p className="text-sm text-gray-500">
                Schakel automatische embedding generatie in of uit
              </p>
            </div>
            <Switch
              id="enabled"
              checked={localConfig.enabled}
              onCheckedChange={(checked) => 
                setLocalConfig(prev => ({ ...prev, enabled: checked }))
              }
            />
          </div>

          <div className="space-y-2">
            <Label>Throttle tijd (seconden): {localConfig.throttleMs / 1000}s</Label>
            <Slider
              value={[localConfig.throttleMs / 1000]}
              onValueChange={([value]) => 
                setLocalConfig(prev => ({ ...prev, throttleMs: value * 1000 }))
              }
              max={30}
              min={1}
              step={1}
              className="w-full"
            />
            <p className="text-sm text-gray-500">
              Minimale tijd tussen embeddings om kosten te beperken
            </p>
          </div>

          <div className="space-y-2">
            <Label>Minimale input lengte: {localConfig.minInputLength} karakters</Label>
            <Slider
              value={[localConfig.minInputLength]}
              onValueChange={([value]) => 
                setLocalConfig(prev => ({ ...prev, minInputLength: value }))
              }
              max={100}
              min={5}
              step={5}
              className="w-full"
            />
            <p className="text-sm text-gray-500">
              Korte inputs worden geskipped om resources te besparen
            </p>
          </div>

          <div className="space-y-2">
            <Label>Dagelijkse limiet: {localConfig.maxDailyEmbeddings} embeddings</Label>
            <Slider
              value={[localConfig.maxDailyEmbeddings]}
              onValueChange={([value]) => 
                setLocalConfig(prev => ({ ...prev, maxDailyEmbeddings: value }))
              }
              max={500}
              min={10}
              step={10}
              className="w-full"
            />
            <p className="text-sm text-gray-500">
              Maximaal aantal embeddings per dag voor kostenbeheer
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="skipSimilar">Skip vergelijkbare inputs</Label>
              <p className="text-sm text-gray-500">
                Voorkom duplicaat embeddings voor vergelijkbare content
              </p>
            </div>
            <Switch
              id="skipSimilar"
              checked={localConfig.skipSimilar}
              onCheckedChange={(checked) => 
                setLocalConfig(prev => ({ ...prev, skipSimilar: checked }))
              }
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4">
          <Button onClick={handleSaveConfig} className="flex-1">
            <Settings className="h-4 w-4 mr-2" />
            Configuratie opslaan
          </Button>
          <Button variant="outline" onClick={handleReset}>
            <Database className="h-4 w-4 mr-2" />
            Reset teller
          </Button>
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Optimalisatie actief</p>
              <p>
                Het systeem creëert nu alleen embeddings wanneer dit echt toegevoegde waarde heeft.
                Dit bespaart kosten en verbetert prestaties zonder functionaliteit te verliezen.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmbeddingConfiguration;
