
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Clock, ChevronDown } from 'lucide-react';

interface Activity {
  id: string;
  type: 'user_input' | 'ai_response';
  timestamp: Date;
  content: string;
  status: 'success' | 'error';
  meta: string;
}

interface ActivityLogProps {
  activities: Activity[];
}

const ActivityLog: React.FC<ActivityLogProps> = ({ activities }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-green-100 text-green-800';
    }
  };

  return (
    <Collapsible>
      <Card>
        <CardHeader>
          <CollapsibleTrigger className="w-full">
            <CardTitle className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Clock size={20} />
                Recente Activiteit
              </div>
              <ChevronDown className="h-4 w-4 transition-transform duration-200 data-[state=open]:rotate-180" />
            </CardTitle>
          </CollapsibleTrigger>
          <CardDescription>Laatste systeem activiteiten en logs</CardDescription>
        </CardHeader>
        <CollapsibleContent>
          <CardContent>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tijd</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Content</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Meta</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activities.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell className="text-xs text-gray-500">
                        {activity.timestamp.toLocaleTimeString('nl-NL')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={activity.type === 'user_input' ? 'default' : 'secondary'}>
                          {activity.type === 'user_input' ? 'User' : 'AI'}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {activity.content}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(activity.status)}>
                          {activity.status === 'error' ? 'Error' : 'Success'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">
                        {activity.meta}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

export default ActivityLog;
