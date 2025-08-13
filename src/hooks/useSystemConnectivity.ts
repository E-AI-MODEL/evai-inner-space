
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { testSupabaseConnection } from '@/integrations/supabase/client';

export type ApiConfigStatus = 'configured' | 'missing' | 'checking';
export type DbStatus = 'connected' | 'error' | 'checking';

export interface SystemConnectivityStatus {
  supabase: DbStatus;
  openaiApi1: ApiConfigStatus; // primary
  openaiApi2: ApiConfigStatus; // secondary
  vectorApi: ApiConfigStatus;
}

export function useSystemConnectivity() {
  const [status, setStatus] = useState<SystemConnectivityStatus>({
    supabase: 'checking',
    openaiApi1: 'checking',
    openaiApi2: 'checking',
    vectorApi: 'checking',
  });
  const [isChecking, setIsChecking] = useState(true);

  const runChecks = useCallback(async () => {
    setIsChecking(true);

    // Check Supabase DB
    let supabaseState: DbStatus = 'checking';
    try {
      const res = await testSupabaseConnection();
      supabaseState = res.success ? 'connected' : 'error';
    } catch {
      supabaseState = 'error';
    }

    // Check OpenAI primary via lightweight validator function
    let openai1: ApiConfigStatus = 'checking';
    try {
      const { data, error } = await supabase.functions.invoke('test-openai-key');
      if (error) {
        openai1 = 'missing';
      } else {
        const ok = (data as any)?.ok === true;
        openai1 = ok ? 'configured' : 'missing';
      }
    } catch {
      openai1 = 'missing';
    }

    // Check OpenAI secondary by invoking chat with use_secondary: true (tiny call)
    let openai2: ApiConfigStatus = 'checking';
    try {
      const { data, error } = await supabase.functions.invoke('openai-chat', {
        body: {
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'Validator: reply OK' },
            { role: 'user', content: 'OK' },
          ],
          max_tokens: 3,
          temperature: 0,
          use_secondary: true,
        },
      });
      if (error) {
        openai2 = 'missing';
      } else {
        openai2 = (data as any)?.choices ? 'configured' : 'missing';
      }
    } catch {
      openai2 = 'missing';
    }

    // Check embeddings/vector by invoking the embedding function with tiny input
    let vector: ApiConfigStatus = 'checking';
    try {
      const { data, error } = await supabase.functions.invoke('openai-embedding', {
        body: { input: 'ping', model: 'text-embedding-3-small' },
      });
      if (error) {
        vector = 'missing';
      } else {
        vector = (data as any)?.embedding ? 'configured' : 'missing';
      }
    } catch {
      vector = 'missing';
    }

    setStatus({
      supabase: supabaseState,
      openaiApi1: openai1,
      openaiApi2: openai2,
      vectorApi: vector,
    });
    setIsChecking(false);
  }, []);

  useEffect(() => {
    runChecks();
  }, [runChecks]);

  return { status, isChecking, refresh: runChecks };
}
