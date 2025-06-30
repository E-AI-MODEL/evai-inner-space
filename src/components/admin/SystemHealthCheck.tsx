import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useHealthCheck } from '../../hooks/useHealthCheck';
import HealthCheckProgress from './healthCheck/HealthCheckProgress';
import HealthCheckResults from './healthCheck/HealthCheckResults';

const SystemHealthCheck: React.FC = () => {
  const { isRunning, progress, results, runHealthCheck } = useHealthCheck();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Systeem Health Check</CardTitle>
        <CardDescription>Controleer de belangrijkste componenten</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Button onClick={runHealthCheck} disabled={isRunning}>
            Start Check
          </Button>
          <HealthCheckProgress isRunning={isRunning} progress={progress} />
        </div>
        <HealthCheckResults results={results} />
      </CardContent>
    </Card>
  );
};

export default SystemHealthCheck;
