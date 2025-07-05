
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { testOpenAIApiKey, testOpenAIChat } from '@/utils/apiKeyTester';
import { OPENAI_MODEL } from '../openaiConfig';

const DebugPanel: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    setDebugInfo('🔍 Running system diagnostics...\n');

    try {
      // Check localStorage API keys
      const apiKey1 = localStorage.getItem('openai-api-key');
      const apiKey2 = localStorage.getItem('openai-api-key-2');
      const vectorKey = localStorage.getItem('vector-api-key');

      setDebugInfo(prev => prev + `\n📋 ENVIRONMENT CHECK:\n`);
      setDebugInfo(prev => prev + `• Model: ${OPENAI_MODEL}\n`);
      setDebugInfo(prev => prev + `• API Key 1: ${apiKey1 ? '✅ Present' : '❌ Missing'}\n`);
      setDebugInfo(prev => prev + `• API Key 2: ${apiKey2 ? '✅ Present' : '❌ Missing'}\n`);
      setDebugInfo(prev => prev + `• Vector Key: ${vectorKey ? '✅ Present' : '❌ Missing'}\n`);

      if (apiKey1) {
        setDebugInfo(prev => prev + `\n🧪 TESTING API KEY 1:\n`);
        
        const basicTest = await testOpenAIApiKey(apiKey1);
        setDebugInfo(prev => prev + `• Format validation: ${basicTest.isValid ? '✅ Valid' : '❌ Invalid'}\n`);
        
        if (basicTest.isValid) {
          setDebugInfo(prev => prev + `• Response time: ${basicTest.responseTime}ms\n`);
          
          const chatTest = await testOpenAIChat(apiKey1);
          setDebugInfo(prev => prev + `• Chat completion: ${chatTest.isValid ? '✅ Working' : '❌ Failed'}\n`);
          
          if (chatTest.isValid) {
            setDebugInfo(prev => prev + `• Test response: "${chatTest.details?.response || 'Success'}"\n`);
            setDebugInfo(prev => prev + `• Chat response time: ${chatTest.responseTime}ms\n`);
          } else {
            setDebugInfo(prev => prev + `• Chat error: ${chatTest.error}\n`);
          }
        } else {
          setDebugInfo(prev => prev + `• Error: ${basicTest.error}\n`);
        }
      }

      if (apiKey2) {
        setDebugInfo(prev => prev + `\n🧪 TESTING API KEY 2:\n`);
        
        const basicTest2 = await testOpenAIApiKey(apiKey2);
        setDebugInfo(prev => prev + `• Format validation: ${basicTest2.isValid ? '✅ Valid' : '❌ Invalid'}\n`);
        
        if (basicTest2.isValid) {
          setDebugInfo(prev => prev + `• Response time: ${basicTest2.responseTime}ms\n`);
        } else {
          setDebugInfo(prev => prev + `• Error: ${basicTest2.error}\n`);
        }
      }

      setDebugInfo(prev => prev + `\n🌐 NETWORK CHECK:\n`);
      setDebugInfo(prev => prev + `• User Agent: ${navigator.userAgent}\n`);
      setDebugInfo(prev => prev + `• Online: ${navigator.onLine ? '✅ Yes' : '❌ No'}\n`);
      setDebugInfo(prev => prev + `• Connection: ${(navigator as any).connection?.effectiveType || 'unknown'}\n`);

      setDebugInfo(prev => prev + `\n✅ Diagnostics completed!`);

    } catch (error) {
      setDebugInfo(prev => prev + `\n❌ Diagnostics failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🔧 System Diagnostics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runDiagnostics} 
          disabled={isRunning}
          className="w-full"
        >
          {isRunning ? 'Running Diagnostics...' : 'Run Full Diagnostics'}
        </Button>
        
        {debugInfo && (
          <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm overflow-auto max-h-96">
            <pre className="whitespace-pre-wrap">{debugInfo}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DebugPanel;
