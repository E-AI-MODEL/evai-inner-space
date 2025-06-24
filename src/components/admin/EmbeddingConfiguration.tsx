
import React, { useState } from 'react';
import { Brain, Zap, Database, Info, CheckCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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

  const handleToggleEmbeddings = (enabled: boolean) => {
    const newConfig = { ...localConfig, enabled };
    setLocalConfig(newConfig);
    updateConfig(newConfig);
  };

  const handleReset = () => {
    resetDailyCount();
  };

  const isHealthy = embeddingsRemaining > 20;
  const isWarning = embeddingsRemaining <= 20 && embeddingsRemaining > 0;
  const isError = embeddingsRemaining <= 0;

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-blue-600" />
          Intelligente Embeddings
          <Badge variant={config.enabled ? "default" : "secondary"} className="ml-2">
            {config.enabled ? "Actief" : "Uitgeschakeld"}
          </Badge>
        </CardTitle>
        <CardDescription>
          Automatische geheugenverrijking voor betere AI-gesprekken
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* What is this? */}
        <div className="bg-white/70 rounded-lg p-4 border border-blue-100">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <h4 className="font-medium text-gray-800">Wat zijn embeddings?</h4>
              <p className="text-sm text-gray-700 leading-relaxed">
                Embeddings helpen EvAI om gesprekken beter te onthouden en relevante antwoorden te geven. 
                Wanneer iemand iets invoert, wordt dit omgezet naar een 'geheugenspoor' dat later gebruikt 
                kan worden om gelijksoortige situaties te herkennen.
              </p>
            </div>
          </div>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-white/60 rounded-lg border border-blue-100">
            <div className={`text-2xl font-bold ${
              isHealthy ? 'text-green-600' : 
              isWarning ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {dailyCount}
            </div>
            <div className="text-sm text-gray-600">Vandaag gebruikt</div>
          </div>
          <div className="text-center p-4 bg-white/60 rounded-lg border border-blue-100">
            <div className={`text-2xl font-bold ${
              isHealthy ? 'text-blue-600' : 
              isWarning ? 'text-yellow-600' : 'text-red-600'
            }`}>
              {embeddingsRemaining}
            </div>
            <div className="text-sm text-gray-600">Nog beschikbaar</div>
          </div>
        </div>

        {/* Status Indicator */}
        {isError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span className="text-sm font-medium text-red-800">
              Dagelijkse limiet bereikt - geen nieuwe embeddings vandaag
            </span>
          </div>
        )}

        {isWarning && !isError && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-800">
              Bijna aan de dagelijkse limiet - nog {embeddingsRemaining} beschikbaar
            </span>
          </div>
        )}

        {/* Main Toggle */}
        <div className="bg-white/70 rounded-lg p-4 border border-blue-100">
          <div className="flex items-center justify-between">
            <div className="space-y-1 flex-1">
              <Label htmlFor="enabled" className="text-base font-medium text-gray-800">
                Automatische Embeddings
              </Label>
              <p className="text-sm text-gray-600 pr-4">
                <strong>AAN:</strong> EvAI leert automatisch van gesprekken en bouwt geheugen op<br/>
                <strong>UIT:</strong> Geen nieuwe geheugensporen, alleen bestaande kennis gebruiken
              </p>
            </div>
            <Switch
              id="enabled"
              checked={config.enabled}
              onCheckedChange={handleToggleEmbeddings}
              className="flex-shrink-0"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleReset}
            className="flex-1"
            disabled={dailyCount === 0}
          >
            <Database className="h-4 w-4 mr-2" />
            Reset Teller
          </Button>
        </div>

        {/* Happy Flow Info */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-green-800">
              <p className="font-medium mb-1">Optimaal voor de Happy Flow</p>
              <p>
                Deze instelling zorgt ervoor dat EvAI steeds slimmer wordt zonder onnodige kosten. 
                Voor de beste gebruikerservaring: laat dit <strong>AAN</strong> staan.
              </p>
            </div>
          </div>
        </div>

        {/* Technical Details (Collapsible) */}
        <details className="bg-gray-50 border border-gray-200 rounded-lg">
          <summary className="p-3 cursor-pointer text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg">
            Technische Details (klik om uit te klappen)
          </summary>
          <div className="px-3 pb-3 pt-1 text-xs text-gray-600 space-y-2">
            <div>• <strong>Throttle:</strong> {config.throttleMs / 1000}s tussen embeddings</div>
            <div>• <strong>Min. lengte:</strong> {config.minInputLength} karakters</div>
            <div>• <strong>Dagelijkse limiet:</strong> {config.maxDailyEmbeddings} embeddings</div>
            <div>• <strong>Skip duplicaten:</strong> {config.skipSimilar ? 'Ja' : 'Nee'}</div>
          </div>
        </details>
      </CardContent>
    </Card>
  );
};

export default EmbeddingConfiguration;
