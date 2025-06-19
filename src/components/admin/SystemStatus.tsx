
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Server } from 'lucide-react';

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
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="text-green-500" size={20} />;
      case 'warning': return <AlertTriangle className="text-yellow-500" size={20} />;
      case 'error': return <AlertTriangle className="text-red-500" size={20} />;
      default: return <Server className="text-gray-500" size={20} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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
                {systemHealth.status === 'healthy' ? 'Gezond' : 
                 systemHealth.status === 'warning' ? 'Waarschuwing' : 'Fout'}
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
