import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface TimelineEvent {
  id: string;
  type: 'decision' | 'api' | 'reflection';
  created_at: string;
  title: string;
  subtitle?: string;
  meta?: any;
}

const UnifiedActivityTimeline: React.FC = () => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<TimelineEvent | null>(null);
  const [open, setOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [decisionsRes, apiRes, reflectionsRes] = await Promise.all([
        supabase.rpc('get_recent_decision_logs', { p_limit: 50 }),
        supabase.rpc('get_recent_api_collaboration_logs', { p_limit: 50 }),
        supabase.rpc('get_recent_reflection_logs', { p_limit: 50 }),
      ]);

      const decisions = (decisionsRes.data || []).map((d: any) => ({
        id: d.id,
        type: 'decision' as const,
        created_at: d.created_at,
        title: `Decision • ${(Math.round((d.confidence_score || 0) * 100))}%`,
        subtitle: (d.user_input || '').slice(0, 80),
        meta: d,
      }));

      const apis = (apiRes.data || []).map((a: any) => ({
        id: a.id,
        type: 'api' as const,
        created_at: a.created_at,
        title: `API • ${a.workflow_type || 'workflow'}`,
        subtitle: `${a.success ? 'Success' : 'Error'} · ${a.processing_time_ms || 0}ms` ,
        meta: a,
      }));

      const reflections = (reflectionsRes.data || []).map((r: any) => ({
        id: r.id,
        type: 'reflection' as const,
        created_at: r.created_at,
        title: `Self-learning • ${r.trigger_type}`,
        subtitle: r.context?.userInput ? (r.context.userInput as string).slice(0, 80) : undefined,
        meta: r,
      }));

      const merged = [...decisions, ...apis, ...reflections].sort((a, b) => (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ));

      setEvents(merged);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, []);

  const counts = useMemo(() => {
    return {
      decisions: events.filter(e => e.type === 'decision').length,
      api: events.filter(e => e.type === 'api').length,
      reflections: events.filter(e => e.type === 'reflection').length,
    };
  }, [events]);

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Unified Activity Timeline</CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="outline">Decisions {counts.decisions}</Badge>
          <Badge variant="outline">API {counts.api}</Badge>
          <Badge variant="outline">Self-learning {counts.reflections}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[420px] pr-4">
          {loading ? (
            <div className="text-sm text-muted-foreground">Laden...</div>
          ) : events.length === 0 ? (
            <div className="text-sm text-muted-foreground">Geen recente events</div>
          ) : (
            <ul className="space-y-3">
              {events.map((e) => (
                <li key={`${e.type}-${e.id}`} className="rounded-md border p-3">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">
                      {e.title}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(e.created_at).toLocaleString('nl-NL')}
                    </div>
                  </div>
                  {e.subtitle && (
                    <div className="text-sm text-muted-foreground mt-1">{e.subtitle}</div>
                  )}
                  <div className="flex items-center justify-end">
                    <Button size="sm" variant="outline" onClick={() => { setSelected(e); setOpen(true); }}>
                      Details
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Event details</DialogTitle>
            </DialogHeader>
            <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
              {selected ? JSON.stringify(selected.meta, null, 2) : ''}
            </pre>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default UnifiedActivityTimeline;
