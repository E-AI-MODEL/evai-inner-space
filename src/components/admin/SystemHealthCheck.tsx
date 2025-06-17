
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Brain } from 'lucide-react';
import HealthCheckProgress from './healthCheck/HealthCheckProgress';
import HealthCheckResults from './healthCheck/HealthCheckResults';
import { useHealthCheck } from '../../hooks/useHealthCheck';

const SystemHealthCheck: React.FC = () => {
  const { isRunning, progress, results, runHealthCheck } = useHealthCheck();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5" />
          Systeem Health Check
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Button 
            onClick={runHealthCheck}
            disabled={isRunning}
            className="flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            {isRunning ? 'Health Check Bezig...' : 'Start Health Check'}
          </Button>
          
          <HealthCheckProgress isRunning={isRunning} progress={progress} />
        </div>

        <HealthCheckResults results={results} />
      </CardContent>
    </Card>
  );
};

export default SystemHealthCheck;
