import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, Zap, Activity, TestTube, CheckCircle, AlertCircle } from 'lucide-react';
import { usePythonTransformerEngine } from '../../hooks/usePythonTransformerEngine';
import { toast } from '@/hooks/use-toast';

const PythonEngineMonitor: React.FC = () => {
  const [testText, setTestText] = useState('Ik voel me vandaag een beetje verdrietig, maar wel hoopvol voor de toekomst.');
  const [selectedTask, setSelectedTask] = useState<'sentiment-analysis' | 'emotion-detection' | 'text-classification' | 'ner'>('sentiment-analysis');
  const [selectedLanguage, setSelectedLanguage] = useState<'nl' | 'en'>('nl');
  const [engineStatus, setEngineStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  const { 
    processWithPythonEngine, 
    analyzeSentiment, 
    detectEmotion, 
    classifyText, 
    extractEntities,
    pingEngine,
    isProcessing, 
    lastResult 
  } = usePythonTransformerEngine();

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
      const result = await processWithPythonEngine(testText, selectedTask, selectedLanguage);
      
      if (result) {
        toast({
          title: "Python Engine Analysis Complete",
          description: `${selectedTask} completed in ${result.meta.processingTime}ms`
        });
      } else {
        toast({
          title: "Analysis Failed",
          description: "Python engine could not process the text",
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
      case 'online': return 'bg-green-100 text-green-800';
      case 'offline': return 'bg-red-100 text-red-800';
      case 'checking': return 'bg-yellow-100 text-yellow-800';
    }
  };

  const renderResult = () => {
    if (!lastResult) return null;

    const { result, task, meta } = lastResult;

    switch (task) {
      case 'sentiment-analysis':
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-100 text-blue-800">Sentiment</Badge>
              <span className="font-medium">{result.sentiment}</span>
              <Badge variant="outline">{Math.round(result.confidence * 100)}%</Badge>
            </div>
            {result.scores && (
              <div className="space-y-1">
                {result.scores.map((score: any, index: number) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{score.label}</span>
                    <span>{Math.round(score.score * 100)}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'emotion-detection':
        return (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge className="bg-purple-100 text-purple-800">Emotion</Badge>
              <span className="font-medium">{result.emotion}</span>
              <Badge variant="outline">{Math.round(result.confidence * 100)}%</Badge>
            </div>
            {result.all_emotions && (
              <div className="space-y-1">
                {result.all_emotions.slice(0, 5).map((emotion: any, index: number) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{emotion.emotion}</span>
                    <span>{Math.round(emotion.score * 100)}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'ner':
        return (
          <div className="space-y-2">
            <Badge className="bg-green-100 text-green-800">Named Entities</Badge>
            {result.entities && result.entities.length > 0 ? (
              <div className="space-y-1">
                {result.entities.map((entity: any, index: number) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <Badge variant="outline">{entity.label}</Badge>
                    <span className="font-medium">{entity.text}</span>
                    <span className="text-gray-500">{Math.round(entity.confidence * 100)}%</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No entities detected</p>
            )}
          </div>
        );

      default:
        return (
          <div className="space-y-2">
            <Badge className="bg-gray-100 text-gray-800">Classification</Badge>
            <pre className="text-sm bg-gray-50 p-2 rounded overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 border-indigo-200">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-indigo-600" />
              Python Transformer Engine
              <Badge variant="secondary">Hugging Face</Badge>
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
          <Tabs defaultValue="test" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="test">Engine Tester</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
            </TabsList>

            <TabsContent value="test" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Task</label>
                  <Select value={selectedTask} onValueChange={(value: any) => setSelectedTask(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sentiment-analysis">Sentiment Analysis</SelectItem>
                      <SelectItem value="emotion-detection">Emotion Detection</SelectItem>
                      <SelectItem value="text-classification">Text Classification</SelectItem>
                      <SelectItem value="ner">Named Entity Recognition</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Language</label>
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
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Test Text</label>
                <Textarea
                  value={testText}
                  onChange={(e) => setTestText(e.target.value)}
                  placeholder="Enter text to analyze..."
                  rows={4}
                />
              </div>

              <Button 
                onClick={handleProcessText}
                disabled={isProcessing || engineStatus !== 'online'}
                className="w-full flex items-center gap-2"
              >
                <TestTube className="h-4 w-4" />
                {isProcessing ? 'Processing...' : `Run ${selectedTask}`}
              </Button>
            </TabsContent>

            <TabsContent value="results" className="space-y-4">
              {lastResult ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      Analysis Results
                      <Badge variant="outline">{lastResult.meta.processingTime}ms</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {renderResult()}
                    <div className="mt-4 pt-4 border-t">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Model:</span>
                          <br />
                          <span className="text-gray-600">{lastResult.model}</span>
                        </div>
                        <div>
                          <span className="font-medium">Language:</span>
                          <br />
                          <span className="text-gray-600">{lastResult.meta.language}</span>
                        </div>
                        <div>
                          <span className="font-medium">Input Length:</span>
                          <br />
                          <span className="text-gray-600">{lastResult.meta.inputLength} chars</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="text-center py-8 text-gray-500">
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

export default PythonEngineMonitor;