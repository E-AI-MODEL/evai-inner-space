
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Server } from 'lucide-react';
import { getStatusIcon, getStatusColor, getStatusText } from '../../utils/statusUtils';

interface SystemHealthData {
  status: string;
  uptime: string;
  errorRate: string;
  avgResponseTime: string;
}

interface SystemStatusProps {
  systemHealth: SystemHealthData;
}

const SystemStatus: React.FC<SystemStatusProps> = ({ systemHealth }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Server size={20} />
          Systeem Status
        </CardTitle>
        <CardDescription>Real-time systeem gezondheid en prestaties</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3">
            {getStatusIcon(systemHealth.status)}
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <Badge className={getStatusColor(systemHealth.status)}>
                {getStatusText(systemHealth.status)}
              </Badge>
            </div>
          </div>
          
          <div>
            <p className="text-sm text-gray-600">Uptime</p>
            <p className="text-lg font-semibold text-green-600">{systemHealth.uptime}</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-600">Error Rate</p>
            <p className="text-lg font-semibold text-red-600">{systemHealth.errorRate}%</p>
          </div>
          
          <div>
            <p className="text-sm text-gray-600">Avg Response</p>
            <p className="text-lg font-semibold text-blue-600">{systemHealth.avgResponseTime}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SystemStatus;
