import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRetroactiveLearning } from '@/hooks/useRetroactiveLearning';
import { useAutonomousScan } from '@/hooks/useAutonomousScan';
import { Brain, Clock, Sparkles, Activity } from 'lucide-react';

export function RetroactiveLearningStatus() {
  const { isAnalyzing, lastAnalysis, newSeedsCount } = useRetroactiveLearning(true);
  const { runScan, isScanning, lastScanResult } = useAutonomousScan();

  // Scheduled autonomous scan every 6 hours
  useEffect(() => {
    const runScheduledScan = async () => {
      console.log('⏰ Running scheduled autonomous scan (6h window)...');
      await runScan(360);
    };

    // Run on mount
    runScheduledScan();

    // Schedule every 6 hours
    const interval = setInterval(runScheduledScan, 6 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Retroactive Learning & Autonomous Scan
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="server" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="server">Server-Side Scan</TabsTrigger>
            <TabsTrigger value="client">Client-Side Analysis</TabsTrigger>
          </TabsList>

          {/* Server-Side Scan Tab */}
          <TabsContent value="server" className="space-y-4">
            <div className="flex gap-2">
              <Button 
                onClick={() => runScan(60)} 
                disabled={isScanning}
                variant="default"
                size="sm"
              >
                {isScanning ? '🔄 Scanning...' : '🔍 Scan Last Hour'}
              </Button>
              <Button 
                onClick={() => runScan(360)} 
                disabled={isScanning}
                variant="outline"
                size="sm"
              >
                Scan Last 6h
              </Button>
              <Button 
                onClick={() => runScan(1440)} 
                disabled={isScanning}
                variant="outline"
                size="sm"
              >
                Scan Last 24h
              </Button>
            </div>

            {lastScanResult && (
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg border">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Scan Status</span>
                  <Badge variant={lastScanResult.ok ? "default" : "destructive"}>
                    {lastScanResult.ok ? '✅ Success' : '❌ Failed'}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="p-2 bg-background rounded border">
                    <div className="text-muted-foreground text-xs mb-1">Scanned</div>
                    <div className="font-mono font-bold text-lg">{lastScanResult.scanned}</div>
                  </div>
                  <div className="p-2 bg-background rounded border">
                    <div className="text-muted-foreground text-xs mb-1">Low Confidence</div>
                    <div className="font-mono font-bold text-lg text-orange-600">
                      {lastScanResult.lowConfidence}
                    </div>
                  </div>
                  <div className="p-2 bg-background rounded border">
                    <div className="text-muted-foreground text-xs mb-1">Seeds Generated</div>
                    <div className="font-mono font-bold text-lg text-green-600">
                      {lastScanResult.seedsGenerated}
                    </div>
                  </div>
                </div>

                {lastScanResult.diagnostics && (
                  <div className="space-y-2 p-3 bg-background rounded border">
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                      <Activity className="h-3 w-3" />
                      Confidence Distribution
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <div>
                        <div className="text-muted-foreground">Very Low (&lt;0.4)</div>
                        <div className="font-mono font-bold text-red-600">
                          {lastScanResult.diagnostics.confidenceDistribution.veryLow}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Low (&lt;0.6)</div>
                        <div className="font-mono font-bold text-orange-600">
                          {lastScanResult.diagnostics.confidenceDistribution.low}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Medium (0.6-0.8)</div>
                        <div className="font-mono font-bold text-yellow-600">
                          {lastScanResult.diagnostics.confidenceDistribution.medium}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">High (&gt;0.8)</div>
                        <div className="font-mono font-bold text-green-600">
                          {lastScanResult.diagnostics.confidenceDistribution.high}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {lastScanResult.error && (
                  <div className="text-xs text-red-600 p-2 bg-red-50 rounded border border-red-200">
                    <strong>Error:</strong> {lastScanResult.error}
                  </div>
                )}
              </div>
            )}

            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-700">
                🔍 <strong>Server-side scan</strong> analyzes <code className="bg-blue-100 px-1 rounded">decision_logs</code> for 
                low-confidence decisions and automatically generates learning seeds. Runs every 6 hours.
              </p>
            </div>
          </TabsContent>

          {/* Client-Side Analysis Tab */}
          <TabsContent value="client" className="space-y-4">
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
                  🧠 Analyzes past conversations from <code className="bg-muted px-1 rounded">chat_messages</code> every 24 hours 
                  to discover learning opportunities and generate new therapeutic seeds.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
