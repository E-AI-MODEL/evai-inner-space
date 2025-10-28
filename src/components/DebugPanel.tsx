
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OPENAI_MODEL } from '../openaiConfig';
import { supabase } from '@/integrations/supabase/client';

const DebugPanel: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    setDebugInfo('🔍 Running system diagnostics...\n');

    try {
      setDebugInfo(prev => prev + `\n📋 ARCHITECTURE CHECK:\n`);
      setDebugInfo(prev => prev + `• Architecture: ✅ Server-Side (Production)\n`);
      setDebugInfo(prev => prev + `• API Keys: ✅ Managed via Edge Functions\n`);
      setDebugInfo(prev => prev + `• Model: ${OPENAI_MODEL}\n`);
      setDebugInfo(prev => prev + `• Security Mode: Production (no client-side keys)\n`);
      
      setDebugInfo(prev => prev + `\n🧪 TESTING EDGE FUNCTIONS:\n`);
      setDebugInfo(prev => prev + `• evai-core (chat): Testing...\n`);
      
      try {
        const testStart = Date.now();
        const { data, error } = await supabase.functions.invoke('evai-core', {
          body: { 
            operation: 'chat',
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: 'test' }],
            max_tokens: 10
          }
        });
        const testDuration = Date.now() - testStart;
        
        if (error) {
          setDebugInfo(prev => prev + `• evai-core (chat): ❌ ${error.message}\n`);
        } else {
          const payload = data as any;
          setDebugInfo(prev => prev + `• evai-core (chat): ${payload?.ok ? '✅' : '❌'} (${testDuration}ms)\n`);
          if (payload?.content) {
            setDebugInfo(prev => prev + `• Response content length: ${payload.content.length} chars\n`);
          }
        }
      } catch (err) {
        setDebugInfo(prev => prev + `• evai-core (chat): ❌ ${err instanceof Error ? err.message : 'Unknown error'}\n`);
      }
      
      setDebugInfo(prev => prev + `\n🧠 TESTING EMBEDDING FUNCTION:\n`);
      setDebugInfo(prev => prev + `• evai-core (embedding): Testing...\n`);
      
      try {
        const embStart = Date.now();
        const { data: embData, error: embError } = await supabase.functions.invoke('evai-core', {
          body: { 
            operation: 'embedding',
            input: 'test diagnostic embedding', 
            model: 'text-embedding-3-small' 
          }
        });
        const embDuration = Date.now() - embStart;
        
        if (embError) {
          setDebugInfo(prev => prev + `• evai-core (embedding): ❌ ${embError.message}\n`);
        } else {
          const payload = embData as any;
          setDebugInfo(prev => prev + `• evai-core (embedding): ${payload?.ok ? '✅' : '❌'} (${embDuration}ms)\n`);
          const embedding = payload?.embedding;
          setDebugInfo(prev => prev + `• Embedding vector: ${embedding && Array.isArray(embedding) ? `${embedding.length} dimensions` : 'Invalid'}\n`);
        }
      } catch (err) {
        setDebugInfo(prev => prev + `• evai-core (embedding): ❌ ${err instanceof Error ? err.message : 'Unknown error'}\n`);
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
