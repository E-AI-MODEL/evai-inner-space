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

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Bediening</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline">Console v1.0</Badge>
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
