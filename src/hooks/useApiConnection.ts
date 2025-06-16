
import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

export function useApiConnection(apiKey: string) {
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'failed' | 'no-key'>('checking');
  const [isChecking, setIsChecking] = useState(false);

  const testConnection = async (key: string): Promise<boolean> => {
    if (!key.trim()) {
      setConnectionStatus('no-key');
      return false;
    }

    setIsChecking(true);
    console.log('ApiConnection: Testing OpenAI connection...');

    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        console.log('ApiConnection: Connection successful');
        setConnectionStatus('connected');
        toast({
          title: "OpenAI Verbinding",
          description: "API connectie succesvol getest ✓",
        });
        return true;
      } else {
        console.error('ApiConnection: Connection failed', response.status);
        setConnectionStatus('failed');
        toast({
          title: "OpenAI Verbinding Gefaald",
          description: `API geeft fout ${response.status}. Controleer je API key.`,
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('ApiConnection: Network error', error);
      setConnectionStatus('failed');
      toast({
        title: "Netwerkfout",
        description: "Kan OpenAI niet bereiken. Controleer je internetverbinding.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    if (apiKey) {
      // Test connection when API key changes
      testConnection(apiKey);
    } else {
      setConnectionStatus('no-key');
    }
  }, [apiKey]);

  return {
    connectionStatus,
    isChecking,
    testConnection: () => testConnection(apiKey)
  };
}
