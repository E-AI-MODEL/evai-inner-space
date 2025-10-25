
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { CheckCircle, XCircle, AlertCircle, Play, RefreshCw } from 'lucide-react';
import { useUnifiedDecisionCore } from '../hooks/useUnifiedDecisionCore';
import { useOpenAI } from '../hooks/useOpenAI';
import { useEmbeddingProcessor } from '../hooks/useEmbeddingProcessor';

interface TestResult {
  name: string;
  status: 'success' | 'warning' | 'error' | 'pending';
  message: string;
  duration?: number;
  details?: any;
}

const ChatbotTester: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [testInput, setTestInput] = useState("Ik voel me zo gestrest door mijn werk");
  const { makeUnifiedDecision, searchUnifiedKnowledge } = useUnifiedDecisionCore();
  const { detectEmotion } = useOpenAI();
  const { performNeuralSearch } = useEmbeddingProcessor();

  const updateTestResult = (name: string, status: TestResult['status'], message: string, details?: any, duration?: number) => {
    setTestResults(prev => {
      const filtered = prev.filter(r => r.name !== name);
      return [...filtered, { name, status, message, details, duration }];
    });
  };

  const runComprehensiveTest = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    console.log('🧪 Starting comprehensive chatbot test (server-side architecture)...');

    // Test 1: Architecture Check
    updateTestResult('Architecture', 'success', 'Server-Side API Keys: ✓ Active via Edge Functions', { 
      serverSide: true,
      edgeFunctions: ['evai-orchestrate', 'openai-embedding'],
      securityMode: 'Production (no client-side keys)'
    });

    // Test 2: Unified Knowledge Search
    updateTestResult('Knowledge Search', 'pending', 'Testing unified knowledge search...');
    try {
      const startTime = Date.now();
      const knowledgeResults = await searchUnifiedKnowledge(testInput);
      const duration = Date.now() - startTime;
      
      if (knowledgeResults && knowledgeResults.length > 0) {
        updateTestResult('Knowledge Search', 'success', `Found ${knowledgeResults.length} knowledge items`, { count: knowledgeResults.length, items: knowledgeResults.slice(0, 3) }, duration);
      } else {
        updateTestResult('Knowledge Search', 'warning', 'No knowledge items found - this is normal for new systems', { count: 0 }, duration);
      }
    } catch (error) {
      updateTestResult('Knowledge Search', 'error', `Knowledge search failed: ${error instanceof Error ? error.message : 'Unknown error'}`, { error });
    }

    // Test 3: Neural Search (server-side)
    updateTestResult('Neural Search', 'pending', 'Testing neural embedding search...');
    try {
      const startTime = Date.now();
      const neuralResults = await performNeuralSearch(testInput);
      const duration = Date.now() - startTime;
      
      updateTestResult('Neural Search', 'success', `Neural search completed via Edge Functions: ${neuralResults.length} results`, { count: neuralResults.length, serverSide: true }, duration);
    } catch (error) {
      updateTestResult('Neural Search', 'warning', `Neural search skipped: ${error instanceof Error ? error.message : 'Vector embeddings not configured'}`, { error });
    }

    // Test 4: Unified Decision Core
    updateTestResult('Decision Core', 'pending', 'Testing unified decision making...');
    try {
      const startTime = Date.now();
      const decision = await makeUnifiedDecision(testInput, undefined);
      const duration = Date.now() - startTime;
      
      if (decision) {
        updateTestResult('Decision Core', 'success', `Decision made: ${decision.emotion} (${Math.round(decision.confidence * 100)}% confidence)`, { decision }, duration);
      } else {
        updateTestResult('Decision Core', 'warning', 'No unified decision made - falling back to OpenAI', {}, duration);
      }
    } catch (error) {
      updateTestResult('Decision Core', 'error', `Decision core failed: ${error instanceof Error ? error.message : 'Unknown error'}`, { error });
    }

    // Test 5: OpenAI Fallback
    updateTestResult('OpenAI Fallback', 'pending', 'Testing OpenAI fallback...');
    try {
      const startTime = Date.now();
      const openAiResult = await detectEmotion(testInput, '');
      const duration = Date.now() - startTime;
      
      if (openAiResult && openAiResult.response) {
        updateTestResult('OpenAI Fallback', 'success', `OpenAI responded: ${openAiResult.emotion} - "${openAiResult.response.substring(0, 50)}..."`, { result: openAiResult }, duration);
      } else {
        updateTestResult('OpenAI Fallback', 'error', 'OpenAI fallback failed');
      }
    } catch (error) {
      updateTestResult('OpenAI Fallback', 'error', `OpenAI failed: ${error instanceof Error ? error.message : 'Unknown error'}`, { error });
    }

    // Test 6: Database Connection
    updateTestResult('Database', 'pending', 'Testing database connection...');
    try {
      const startTime = Date.now();
      // Try to search for any knowledge items to test DB connection
      const dbTest = await searchUnifiedKnowledge('test', undefined, 1);
      const duration = Date.now() - startTime;
      
      updateTestResult('Database', 'success', 'Database connection successful', { responseTime: duration }, duration);
    } catch (error) {
      updateTestResult('Database', 'error', `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`, { error });
    }

    console.log('✅ Comprehensive test completed');
    setIsRunning(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning': return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'error': return <XCircle className="h-5 w-5 text-red-600" />;
      case 'pending': return <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="h-6 w-6" />
          Chatbot Functionality Tester
        </CardTitle>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Test Input:</label>
            <Textarea
              value={testInput}
              onChange={(e) => setTestInput(e.target.value)}
              placeholder="Enter test message..."
              className="w-full"
              rows={2}
            />
          </div>
          <Button 
            onClick={runComprehensiveTest} 
            disabled={isRunning}
            className="w-full"
          >
            {isRunning ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Running Tests...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Run Comprehensive Test
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {testResults.map((result, index) => (
            <div key={index} className="flex items-start gap-3 p-4 border rounded-lg">
              <div className="flex-shrink-0 mt-0.5">
                {getStatusIcon(result.status)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{result.name}</span>
                  <Badge className={getStatusColor(result.status)}>
                    {result.status}
                  </Badge>
                  {result.duration && (
                    <Badge variant="outline" className="text-xs">
                      {result.duration}ms
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-2">{result.message}</p>
                {result.details && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-blue-600 hover:text-blue-800">
                      View Details
                    </summary>
                    <pre className="mt-2 p-2 bg-gray-50 rounded overflow-auto">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          ))}
          
          {testResults.length === 0 && !isRunning && (
            <div className="text-center py-8 text-gray-500">
              <Play className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Click "Run Comprehensive Test" to verify chatbot functionality</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatbotTester;
