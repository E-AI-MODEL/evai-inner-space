
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { ConnectionStatus } from '../../types/connectionStatus';

interface SystemStatusDetailsProps {
  status: ConnectionStatus;
  seedsCount: number;
  activeSeedsCount: number;
}

const SystemStatusDetails: React.FC<SystemStatusDetailsProps> = ({ 
  status, 
  seedsCount, 
  activeSeedsCount 
}) => {
  const neurosymbolicReady = 
    status.openaiApi1 === 'configured' && 
    status.browserML === 'configured' && 
    status.vectorApi === 'configured';

  return (
    <div className="space-y-2 text-sm">
      <div className="flex justify-between">
        <span>Totaal seeds actief:</span>
        <span className="font-medium">{activeSeedsCount}</span>
      </div>
      <div className="flex justify-between">
        <span>Vector embeddings model:</span>
        <Badge variant={status.vectorApi === 'configured' ? "default" : "secondary"}>
          {status.vectorApi === 'configured' ? "text-embedding-3-small" : "Niet geconfigureerd"}
        </Badge>
      </div>
      <div className="flex justify-between">
        <span>Volledige neurosymbolische workflow:</span>
        <Badge variant={neurosymbolicReady ? "default" : "secondary"}>
          {neurosymbolicReady ? "Volledig operationeel" : "Gedeeltelijk"}
        </Badge>
      </div>
      <div className="flex justify-between">
        <span>Database integratie:</span>
        <Badge variant={status.supabase === 'connected' ? "default" : "destructive"}>
          {status.supabase === 'connected' ? "Actief" : "Inactief"}
        </Badge>
      </div>
    </div>
  );
};

export default SystemStatusDetails;
