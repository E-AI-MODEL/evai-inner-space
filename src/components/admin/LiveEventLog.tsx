import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface EventRow {
  id: string;
  user_input: string;
  final_response: string;
  created_at: string | null;
}

const LiveEventLog: React.FC = () => {
  const [rows, setRows] = useState<EventRow[]>([]);

  const fetchRows = async () => {
    const { data, error } = await supabase
      .from('decision_logs')
      .select('id, user_input, final_response, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    if (!error && data) {
      setRows(data as EventRow[]);
    }
  };

  useEffect(() => {
    fetchRows();

    const channel = supabase
      .channel('live-event-log')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'decision_logs' },
        () => {
          fetchRows();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <Card className="bg-white/60 backdrop-blur-sm border-white/20 shadow-lg">
      <CardHeader>
        <CardTitle>Live Event Log</CardTitle>
        <CardDescription>Laatste beslissingslog items</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Input</TableHead>
              <TableHead>Response</TableHead>
              <TableHead>Tijd</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(row => (
              <TableRow key={row.id}>
                <TableCell className="max-w-xs truncate">{row.user_input}</TableCell>
                <TableCell className="max-w-xs truncate">{row.final_response}</TableCell>
                <TableCell>
                  {row.created_at ? new Date(row.created_at).toLocaleString('nl-NL') : ''}
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-sm text-gray-500">
                  Geen data beschikbaar
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default LiveEventLog;
