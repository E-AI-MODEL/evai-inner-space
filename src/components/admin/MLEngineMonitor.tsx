import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, Zap, Activity, TestTube, CheckCircle, AlertCircle, Cpu, Sparkles } from 'lucide-react';
import { useBrowserTransformerEngine } from '../../hooks/useBrowserTransformerEngine';
import { toast } from '@/hooks/use-toast';

const MLEngineMonitor: React.FC = () => {
  const [testText, setTestText] = useState('Ik voel me vandaag een beetje verdrietig, maar wel hoopvol voor de toekomst.');
  const [selectedLanguage, setSelectedLanguage] = useState<'nl' | 'en'>('nl');
  const [engineStatus, setEngineStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  const { 
    detectEmotionInBrowser,
    pingEngine,
    preloadModel,
    isProcessing,
    isModelLoading,
    loadingProgress,
    lastResult,
    device,
    modelLoaded
  } = useBrowserTransformerEngine();

  useEffect(() => {
    checkEngineStatus();
  }, []);

  const checkEngineStatus = async () => {
    setEngineStatus('checking');
    const isOnline = await pingEngine();
    setEngineStatus(isOnline ? 'online' : 'offline');
  };

  const handleProcessText = async () => {
    if (!testText.trim()) {
      toast({
        title: "Input Required",
        description: "Please enter some text to analyze",
        variant: "destructive"
      });
      return;
    }

    try {
      const result = await detectEmotionInBrowser(testText, selectedLanguage);
      
      if (result) {
        toast({
          title: "Browser ML Analysis Complete",
          description: `Emotion detected in ${result.result.inferenceTime}ms using ${result.meta.device.toUpperCase()}`
        });
      } else {
        toast({
          title: "Analysis Failed",
          description: "Browser ML engine could not process the text",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Engine Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = () => {
    switch (engineStatus) {
      case 'online': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'offline': return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'checking': return <Activity className="h-4 w-4 text-yellow-600 animate-pulse" />;
    }
  };

  const getStatusColor = () => {
    switch (engineStatus) {
      case 'online': return 'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))]';
      case 'offline': return 'bg-destructive/10 text-destructive';
      case 'checking': return 'bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-[hsl(var(--accent))] to-[hsl(var(--muted))] border-[hsl(var(--border))]">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-[hsl(var(--primary))]" />
              <span className="text-[hsl(var(--foreground))]">Browser Transformer Engine</span>
              <Badge variant="secondary" className="gap-1">
                <Sparkles className="h-3 w-3" />
                WebGPU/WASM
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <Badge className={getStatusColor()}>
                {engineStatus}
              </Badge>
              <Button 
                onClick={checkEngineStatus} 
                variant="outline" 
                size="sm"
                disabled={engineStatus === 'checking'}
              >
                <Zap className="h-3 w-3" />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Engine Info */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-[hsl(var(--card))] rounded-lg border border-[hsl(var(--border))]">
            <div>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Engine Type</p>
              <p className="font-medium text-[hsl(var(--foreground))]">Browser Transformers</p>
            </div>
            <div>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Device</p>
              <div className="flex items-center gap-1.5">
                <Cpu className="h-3.5 w-3.5 text-[hsl(var(--primary))]" />
                <p className="font-medium text-[hsl(var(--foreground))]">
                  {device ? device.toUpperCase() : 'Not loaded'}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">Status</p>
              <p className="font-medium text-[hsl(var(--foreground))]">
                {modelLoaded ? '✅ Loaded' : isModelLoading ? `Loading ${loadingProgress}%` : 'Not loaded'}
              </p>
            </div>
          </div>

          <Tabs defaultValue="test" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="test">Engine Tester</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
            </TabsList>

            <TabsContent value="test" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block text-[hsl(var(--foreground))]">Language</label>
                  <Select value={selectedLanguage} onValueChange={(value: any) => setSelectedLanguage(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nl">Nederlands</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={preloadModel}
                    disabled={modelLoaded || isModelLoading}
                    variant="outline"
                    className="w-full"
                  >
                    {isModelLoading ? `Preloading ${loadingProgress}%` : modelLoaded ? '✅ Model Ready' : 'Preload Model'}
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block text-[hsl(var(--foreground))]">Test Text</label>
                <Textarea
                  value={testText}
                  onChange={(e) => setTestText(e.target.value)}
                  placeholder="Enter text to analyze..."
                  rows={4}
                  className="bg-[hsl(var(--background))] text-[hsl(var(--foreground))] border-[hsl(var(--border))]"
                />
              </div>

              <Button 
                onClick={handleProcessText}
                disabled={isProcessing || !modelLoaded}
                className="w-full flex items-center gap-2 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary))]/90"
              >
                <TestTube className="h-4 w-4" />
                {isProcessing ? 'Processing...' : 'Detect Emotion'}
              </Button>
            </TabsContent>

            <TabsContent value="results" className="space-y-4">
              {lastResult ? (
                <Card className="bg-[hsl(var(--card))] border-[hsl(var(--border))]">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2 text-[hsl(var(--card-foreground))]">
                      Analysis Results
                      <Badge variant="outline">{lastResult.result.inferenceTime}ms</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]">Detected Emotion</Badge>
                        <span className="font-medium text-[hsl(var(--foreground))] text-lg">{lastResult.result.emotion}</span>
                        <Badge variant="outline">{Math.round(lastResult.result.confidence * 100)}%</Badge>
                      </div>

                      {lastResult.result.allScores && lastResult.result.allScores.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-[hsl(var(--muted-foreground))]">All Predictions:</p>
                          {lastResult.result.allScores.map((score, index) => (
                            <div key={index} className="flex justify-between items-center text-sm">
                              <span className="text-[hsl(var(--foreground))]">{score.label}</span>
                              <div className="flex items-center gap-2">
                                <div className="w-32 h-2 bg-[hsl(var(--muted))] rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-[hsl(var(--primary))]" 
                                    style={{ width: `${score.score * 100}%` }}
                                  />
                                </div>
                                <span className="text-[hsl(var(--muted-foreground))] w-12 text-right">
                                  {Math.round(score.score * 100)}%
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="pt-4 border-t border-[hsl(var(--border))]">
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-[hsl(var(--foreground))]">Model:</span>
                            <br />
                            <span className="text-[hsl(var(--muted-foreground))]">{lastResult.model}</span>
                          </div>
                          <div>
                            <span className="font-medium text-[hsl(var(--foreground))]">Device:</span>
                            <br />
                            <span className="text-[hsl(var(--muted-foreground))]">{lastResult.meta.device.toUpperCase()}</span>
                          </div>
                          <div>
                            <span className="font-medium text-[hsl(var(--foreground))]">Size:</span>
                            <br />
                            <span className="text-[hsl(var(--muted-foreground))]">{lastResult.meta.modelSize}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center py-8 text-[hsl(var(--muted-foreground))]">
                  No results available. Run an analysis first.
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default MLEngineMonitor;
