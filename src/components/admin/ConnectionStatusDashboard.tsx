
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wifi, Database, Brain, RefreshCw, Zap } from 'lucide-react';
import { useSeeds } from '../../hooks/useSeeds';
import { ConnectionStatus } from '../../types/connectionStatus';
import { checkSupabaseConnection, checkApiKeyStatus } from '../../utils/connectionUtils';
import ConnectionStatusItem from './ConnectionStatusItem';
import SystemStatusDetails from './SystemStatusDetails';
import ConnectionStatusMessages from './ConnectionStatusMessages';

const ConnectionStatusDashboard: React.FC = () => {
  const [status, setStatus] = useState<ConnectionStatus>({
    supabase: 'checking',
    openaiApi1: 'checking',
    openaiApi2: 'checking',
    vectorApi: 'checking',
    seeds: 'loading'
  });
  
  const { data: seeds, error: seedsError, isLoading: seedsLoading, refetch } = useSeeds();
  const [apiKey1] = useState(() => localStorage.getItem('openai-api-key') || '');
  const [apiKey2] = useState(() => localStorage.getItem('openai-api-key-2') || '');
  const [vectorApiKey] = useState(() => localStorage.getItem('vector-api-key') || '');

  const checkConnections = async () => {
    console.log('🔍 Starting connection status check...');
    
    setStatus(prev => ({
      ...prev,
      supabase: 'checking',
      openaiApi1: 'checking',
      openaiApi2: 'checking',
      vectorApi: 'checking'
    }));

    // Check Supabase connection
    const supabaseConnected = await checkSupabaseConnection();
    setStatus(prev => ({ 
      ...prev, 
      supabase: supabaseConnected ? 'connected' : 'error' 
    }));

    // Check API Keys
    const api1Status = checkApiKeyStatus(apiKey1, 'OpenAI API 1');
    const api2Status = checkApiKeyStatus(apiKey2, 'OpenAI API 2');
    const vectorStatus = checkApiKeyStatus(vectorApiKey, 'Vector API Key 3');

    setStatus(prev => ({
      ...prev,
      openaiApi1: api1Status,
      openaiApi2: api2Status,
      vectorApi: vectorStatus
    }));
  };

  useEffect(() => {
    checkConnections();
  }, [apiKey1, apiKey2, vectorApiKey]);

  useEffect(() => {
    if (seedsLoading) {
      setStatus(prev => ({ ...prev, seeds: 'loading' }));
    } else if (seedsError) {
      console.error('🔴 Seeds loading error:', seedsError);
      setStatus(prev => ({ ...prev, seeds: 'error' }));
    } else {
      console.log(`✅ Seeds loaded: ${seeds?.length || 0} seeds`);
      setStatus(prev => ({ ...prev, seeds: 'loaded' }));
    }
  }, [seeds, seedsError, seedsLoading]);

  const overallHealth = 
    status.supabase === 'connected' && 
    status.openaiApi1 === 'configured' && 
    status.vectorApi === 'configured' &&
    status.seeds === 'loaded';

  const activeSeedsCount = seeds?.filter(s => s.isActive).length || 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wifi className="w-5 h-5" />
          Systeem Status Dashboard
          <Badge variant={overallHealth ? "default" : "destructive"}>
            {overallHealth ? "Operationeel" : "Problemen"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <ConnectionStatusItem
            icon={<Database className="w-4 h-4" />}
            label="Supabase"
            status={status.supabase}
          />
          
          <ConnectionStatusItem
            icon={<Brain className="w-4 h-4" />}
            label="API 1"
            status={status.openaiApi1}
          />
          
          <ConnectionStatusItem
            icon={<Brain className="w-4 h-4" />}
            label="API 2"
            status={status.openaiApi2}
          />
          
          <ConnectionStatusItem
            icon={<Zap className="w-4 h-4 text-blue-600" />}
            label={`API 3 (Vector)`}
            status={status.vectorApi}
            isHighlighted
          />
          
          <ConnectionStatusItem
            icon={<Database className="w-4 h-4" />}
            label={`Seeds (${seeds?.length || 0})`}
            status={status.seeds}
          />
        </div>

        <SystemStatusDetails
          status={status}
          seedsCount={seeds?.length || 0}
          activeSeedsCount={activeSeedsCount}
        />

        <div className="flex gap-2">
          <Button 
            onClick={checkConnections} 
            variant="outline" 
            size="sm"
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Hercontrole
          </Button>
          <Button 
            onClick={() => refetch()} 
            variant="outline" 
            size="sm"
            className="flex items-center gap-2"
          >
            <Database className="w-4 h-4" />
            Seeds Herladen
          </Button>
        </div>

        <ConnectionStatusMessages
          status={status}
          overallHealth={overallHealth}
        />
      </CardContent>
    </Card>
  );
};

export default ConnectionStatusDashboard;
