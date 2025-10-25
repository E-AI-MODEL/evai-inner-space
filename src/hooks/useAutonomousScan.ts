import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ScanResult {
  ok: boolean;
  scanned: number;
  lowConfidence: number;
  seedsGenerated: number;
  version: string;
  error?: string;
  diagnostics?: {
    confidenceDistribution: {
      veryLow: number;
      low: number;
      medium: number;
      high: number;
    };
    timeRange: {
      from: string;
      to: string;
    };
  };
}

export function useAutonomousScan() {
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanResult, setLastScanResult] = useState<ScanResult | null>(null);

  const runScan = async (sinceMinutes: number = 60) => {
    setIsScanning(true);
    try {
      const { data, error } = await supabase.functions.invoke('evai-admin', {
        body: { operation: 'autolearn-scan', sinceMinutes }
      });

      if (error) throw error;

      const result = data as ScanResult;
      setLastScanResult(result);
      
      console.log('🔍 Autonomous scan completed:', result);
      return result;
    } catch (error) {
      console.error('❌ Autonomous scan failed:', error);
      const errorResult: ScanResult = {
        ok: false,
        scanned: 0,
        lowConfidence: 0,
        seedsGenerated: 0,
        version: 'error',
        error: (error as Error).message
      };
      setLastScanResult(errorResult);
      return errorResult;
    } finally {
      setIsScanning(false);
    }
  };

  return { runScan, isScanning, lastScanResult };
}
