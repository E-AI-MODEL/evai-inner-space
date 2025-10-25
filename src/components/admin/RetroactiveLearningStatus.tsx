import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRetroactiveLearning } from '@/hooks/useRetroactiveLearning';
import { Brain, Clock, Sparkles } from 'lucide-react';

export function RetroactiveLearningStatus() {
  const { isAnalyzing, lastAnalysis, newSeedsCount } = useRetroactiveLearning(true);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Retroactive Learning
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <Badge variant={isAnalyzing ? "default" : "secondary"}>
              {isAnalyzing ? '🔄 Analyzing Past Conversations...' : '✅ Active'}
            </Badge>
          </div>
          
          {lastAnalysis && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Last Analysis
              </span>
              <span className="text-sm font-medium">
                {lastAnalysis.toLocaleString('nl-NL', {
                  day: '2-digit',
                  month: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          )}
          
          {newSeedsCount > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Sparkles className="h-4 w-4" />
                New Seeds Generated
              </span>
              <Badge variant="outline" className="font-mono">
                {newSeedsCount}
              </Badge>
            </div>
          )}

          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground">
              🧠 Analyzes past conversations every 24 hours to discover learning opportunities
              and generate new therapeutic seeds from historical interactions.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
