import React, { useCallback, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import UnifiedActivityTimeline from './UnifiedActivityTimeline';
import SelfLearningMonitor from './SelfLearningMonitor';
import { supabase } from '@/integrations/supabase/client';

const AutonomyConsole: React.FC = () => {
  const { toast } = useToast();
  const [running, setRunning] = useState(false);
  const [versions, setVersions] = useState<{ autolearn?: string; orchestrate?: string }>({});
  const [pinging, setPinging] = useState(false);

  const runScan = useCallback(async () => {
    setRunning(true);
    try {
      const { data, error } = await supabase.functions.invoke('evai-autolearn-scan', {
        body: { sinceMinutes: 60 }
      });
      if (error) {
        toast({ title: 'AutoLearn scan mislukt', description: error.message, variant: 'destructive' });
      } else {
        const d = data as any;
        toast({ title: 'AutoLearn scan voltooid', description: `Gescand: ${d.scanned}, laag vertrouwen: ${d.lowConfidence}` });
      }
    } catch (e: any) {
      toast({ title: 'AutoLearn scan error', description: e.message, variant: 'destructive' });
    } finally {
      setRunning(false);
    }
  }, [toast]);
  const ping = useCallback(async () => {
    setPinging(true);
    try {
      const [scanRes, orchRes] = await Promise.all([
        supabase.functions.invoke('evai-autolearn-scan', { body: { sinceMinutes: 1 } }),
        supabase.functions.invoke('evai-orchestrate', { body: { ping: true } }),
      ]);
      setVersions({
        autolearn: (scanRes.data as any)?.version || '-',
        orchestrate: (orchRes.data as any)?.version || '-',
      });
    } catch (e) {
      console.warn('Ping functies mislukt', e);
    } finally {
      setPinging(false);
    }
  }, []);

  React.useEffect(() => {
    ping();
  }, [ping]);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Bediening</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Console v1.0</Badge>
              <Badge variant="secondary">Autolearn {versions.autolearn || '-'}</Badge>
              <Badge variant="secondary">Orchestrate {versions.orchestrate || '-'}</Badge>
              <Button size="sm" variant="outline" onClick={ping} disabled={pinging}>
                {pinging ? 'Pingen…' : 'Ping'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <Button onClick={runScan} disabled={running}>
              {running ? 'Bezig…' : 'Run AutoLearn scan nu'}
            </Button>
          </CardContent>
        </Card>

        <SelfLearningMonitor />
      </div>

      <UnifiedActivityTimeline />
    </div>
  );
};

export default AutonomyConsole;
