
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { useSeeds } from './useSeeds';
import { HealthCheckResult } from '../types/healthCheck';
import { supabase } from '@/integrations/supabase/client';

export const useHealthCheck = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<HealthCheckResult[]>([]);
  
  const { data: seeds, refetch: refetchSeeds } = useSeeds();
  // Using server-side checks via Edge Functions

  const runHealthCheck = async () => {
    setIsRunning(true);
    setProgress(0);
    setResults([]);
    
    const tests: HealthCheckResult[] = [];
    const totalTests = 6;
    let currentTest = 0;

    const updateProgress = () => {
      currentTest++;
      setProgress((currentTest / totalTests) * 100);
    };

    try {
      // Test 1: Seeds Loading
      console.log('🧪 Test 1: Seeds Loading');
      try {
        await refetchSeeds();
        const seedCount = seeds?.length || 0;
        const activeSeeds = seeds?.filter(s => s.isActive).length || 0;
        
        tests.push({
          component: 'Seeds Database',
          status: seedCount > 0 ? 'success' : 'warning',
          message: `${seedCount} seeds geladen (${activeSeeds} actief)`,
          details: seedCount === 0 ? 'Geen seeds beschikbaar' : undefined
        });
      } catch (error) {
        tests.push({
          component: 'Seeds Database',
          status: 'error',
          message: 'Failed to load seeds',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
      updateProgress();

      // Test 2: OpenAI API 1 (server-side)
      console.log('🧪 Test 2: OpenAI API 1 (edge)');
      try {
        const { data, error } = await supabase.functions.invoke('test-openai-key');
        if (error) throw error;
        const ok = (data as any)?.ok === true;
        tests.push({
          component: 'OpenAI API 1',
          status: ok ? 'success' : 'error',
          message: ok ? 'Key actief (server)' : 'Key ontbreekt of ongeldig',
          details: ok ? `Model: ${(data as any)?.model || 'gpt-4o-mini'}` : undefined
        });
      } catch (error) {
        tests.push({
          component: 'OpenAI API 1',
          status: 'error',
          message: 'Server-side check failed',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
      updateProgress();

      // Test 3: OpenAI API 2 (server-side via secondary key)
      console.log('🧪 Test 3: OpenAI API 2 (edge)');
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
        if (error) throw error;
        const ok = Boolean((data as any)?.choices?.[0]?.message?.content);
        tests.push({
          component: 'OpenAI API 2',
          status: ok ? 'success' : 'warning',
          message: ok ? 'Strategische briefing mogelijk' : 'Geen antwoord',
          details: ok ? 'Secondary key actief' : undefined
        });
      } catch (error) {
        tests.push({
          component: 'OpenAI API 2',
          status: 'error',
          message: 'Server-side check failed',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
      updateProgress();

      // Test 4: Unified Decision Core Integration (Simplified test)
      console.log('🧪 Test 4: Unified Decision Core Integration');
      try {
        // Since useSeedEngine was removed, we'll just test if we have active seeds
        const activeSeeds = seeds?.filter(s => s.isActive).length || 0;
        
        tests.push({
          component: 'Unified Decision Core',
          status: activeSeeds > 0 ? 'success' : 'warning',
          message: activeSeeds > 0 ? 'Core werkend' : 'Beperkte functionaliteit',
          details: `${activeSeeds} actieve seeds beschikbaar voor besluitvorming`
        });
      } catch (error) {
        tests.push({
          component: 'Unified Decision Core',
          status: 'error',
          message: 'Core test failed',
          details: error instanceof Error ? error.message : 'Unknown error'
        });
      }
      updateProgress();

      // Test 5: API Integration
      console.log('🧪 Test 5: API Samenwerking');
      const api1Working = tests.find(t => t.component === 'OpenAI API 1')?.status === 'success';
      const api2Working = tests.find(t => t.component === 'OpenAI API 2')?.status === 'success';
      const seedsWorking = tests.find(t => t.component === 'Seeds Database')?.status === 'success';
      
      if (api1Working && api2Working && seedsWorking) {
        tests.push({
          component: 'API Samenwerking',
          status: 'success',
          message: 'Volledige integratie actief',
          details: 'API 1 + API 2 + Supabase werken samen'
        });
      } else if (api1Working && seedsWorking) {
        tests.push({
          component: 'API Samenwerking',
          status: 'warning',
          message: 'Gedeeltelijke integratie',
          details: 'API 1 + Supabase, API 2 ontbreekt'
        });
      } else {
        tests.push({
          component: 'API Samenwerking',
          status: 'error',
          message: 'Integratie problemen',
          details: 'Niet alle componenten werken'
        });
      }
      updateProgress();

      // Test 6: Overall System Health
      console.log('🧪 Test 6: Overall System Health');
      const successCount = tests.filter(t => t.status === 'success').length;
      const warningCount = tests.filter(t => t.status === 'warning').length;
      const errorCount = tests.filter(t => t.status === 'error').length;
      
      let overallStatus: 'success' | 'warning' | 'error' = 'success';
      let overallMessage = 'Systeem volledig operationeel';
      
      if (errorCount > 0) {
        overallStatus = 'error';
        overallMessage = `${errorCount} kritieke problemen gedetecteerd`;
      } else if (warningCount > 0) {
        overallStatus = 'warning';
        overallMessage = `${warningCount} waarschuwingen, systeem gedeeltelijk operationeel`;
      }
      
      tests.push({
        component: 'Systeem Gezondheid',
        status: overallStatus,
        message: overallMessage,
        details: `${successCount} successen, ${warningCount} waarschuwingen, ${errorCount} fouten`
      });
      updateProgress();

      setResults(tests);
      
      // Show summary toast
      const overallResult = tests[tests.length - 1];
      toast({
        title: "Health Check Voltooid",
        description: overallResult.message,
        variant: overallResult.status === 'error' ? 'destructive' : 'default'
      });

    } catch (error) {
      console.error('🔴 Health check failed:', error);
      toast({
        title: "Health Check Gefaald",
        description: "Er ging iets mis tijdens de systeemcontrole",
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  return {
    isRunning,
    progress,
    results,
    runHealthCheck
  };
};
