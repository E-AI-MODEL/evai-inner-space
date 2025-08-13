import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useProactiveAutonomyEngine } from '@/hooks/useProactiveAutonomyEngine';
import { Activity, Brain, Zap, Settings } from 'lucide-react';

export function ProactiveAutonomyConsole() {
  const {
    isActive,
    metrics,
    recentActions,
    isProcessing,
    activateAutonomy,
    deactivateAutonomy
  } = useProactiveAutonomyEngine();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Proactive Autonomy Engine
          </CardTitle>
          <Button
            onClick={isActive ? deactivateAutonomy : activateAutonomy}
            disabled={isProcessing}
            variant={isActive ? "destructive" : "default"}
          >
            {isActive ? 'Deactivate' : 'Activate'} Autonomy
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{metrics.activePredictions}</div>
              <div className="text-sm text-muted-foreground">Active Predictions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{metrics.proactiveInterventions}</div>
              <div className="text-sm text-muted-foreground">Interventions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{metrics.autonomousOptimizations}</div>
              <div className="text-sm text-muted-foreground">Optimizations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(metrics.predictiveAccuracy * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Accuracy</div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Recent Proactive Actions
            </h4>
            {recentActions.slice(0, 5).map((action) => (
              <div key={action.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{action.action}</div>
                  <div className="text-sm text-muted-foreground">
                    {action.executedAt.toLocaleTimeString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={action.type === 'intervention' ? 'destructive' : 'secondary'}>
                    {action.type}
                  </Badge>
                  <div className="text-sm font-medium">
                    {Math.round(action.confidence * 100)}%
                  </div>
                </div>
              </div>
            ))}
            {recentActions.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                No proactive actions yet
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}