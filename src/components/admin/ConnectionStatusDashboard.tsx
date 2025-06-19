
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, Wifi, Database, Brain, RefreshCw, Zap } from 'lucide-react';
import { useSeeds } from '../../hooks/useSeeds';
import { supabase } from '@/integrations/supabase/client';

interface ConnectionStatus {
  supabase: 'connected' | 'error' | 'checking';
  openaiApi1: 'configured' | 'missing' | 'checking';
  openaiApi2: 'configured' | 'missing' | 'checking';
  vectorApi: 'configured' | 'missing' | 'checking';
  seeds: 'loaded' | 'error' | 'loading';
}

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
    try {
      const { data, error } = await supabase
        .from('emotion_seeds')
        .select('id', { count: 'exact', head: true });
      
      if (error) {
        console.error('🔴 Supabase connection error:', error);
        setStatus(prev => ({ ...prev, supabase: 'error' }));
      } else {
        console.log('✅ Supabase connection successful');
        setStatus(prev => ({ ...prev, supabase: 'connected' }));
      }
    } catch (error) {
      console.error('🔴 Supabase connection failed:', error);
      setStatus(prev => ({ ...prev, supabase: 'error' }));
    }

    // Check OpenAI API 1
    if (apiKey1.trim()) {
      console.log('🔑 OpenAI API 1 configured');
      setStatus(prev => ({ ...prev, openaiApi1: 'configured' }));
    } else {
      console.log('🔴 OpenAI API 1 key missing');
      setStatus(prev => ({ ...prev, openaiApi1: 'missing' }));
    }

    // Check OpenAI API 2
    if (apiKey2.trim()) {
      console.log('🔑 OpenAI API 2 configured');
      setStatus(prev => ({ ...prev, openaiApi2: 'configured' }));
    } else {
      console.log('🔴 OpenAI API 2 key missing');
      setStatus(prev => ({ ...prev, openaiApi2: 'missing' }));
    }

    // Check Vector API (API Key 3)
    if (vectorApiKey.trim()) {
      console.log('🔑 Vector API Key 3 configured');
      setStatus(prev => ({ ...prev, vectorApi: 'configured' }));
    } else {
      console.log('🔴 Vector API Key 3 missing');
      setStatus(prev => ({ ...prev, vectorApi: 'missing' }));
    }
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected':
      case 'configured':
      case 'loaded':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
      case 'missing':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <RefreshCw className="w-5 h-5 text-yellow-600 animate-spin" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      connected: { variant: 'default' as const, text: 'Verbonden' },
      configured: { variant: 'default' as const, text: 'Geconfigureerd' },
      loaded: { variant: 'default' as const, text: 'Geladen' },
      error: { variant: 'destructive' as const, text: 'Fout' },
      missing: { variant: 'destructive' as const, text: 'Ontbreekt' },
      checking: { variant: 'secondary' as const, text: 'Controleren...' },
      loading: { variant: 'secondary' as const, text: 'Laden...' }
    };
    
    const config = configs[status as keyof typeof configs] || configs.checking;
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  const overallHealth = 
    status.supabase === 'connected' && 
    status.openaiApi1 === 'configured' && 
    status.vectorApi === 'configured' &&
    status.seeds === 'loaded';

  const neurosymbolicReady = 
    status.openaiApi1 === 'configured' && 
    status.openaiApi2 === 'configured' && 
    status.vectorApi === 'configured';

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
          {/* Supabase Status */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              <span className="text-sm font-medium">Supabase</span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(status.supabase)}
              {getStatusBadge(status.supabase)}
            </div>
          </div>

          {/* OpenAI API 1 Status */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              <span className="text-sm font-medium">API 1</span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(status.openaiApi1)}
              {getStatusBadge(status.openaiApi1)}
            </div>
          </div>

          {/* OpenAI API 2 Status */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              <span className="text-sm font-medium">API 2</span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(status.openaiApi2)}
              {getStatusBadge(status.openaiApi2)}
            </div>
          </div>

          {/* Vector API Status */}
          <div className="flex items-center justify-between p-3 border rounded-lg bg-blue-50">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">API 3 (Vector)</span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(status.vectorApi)}
              {getStatusBadge(status.vectorApi)}
            </div>
          </div>

          {/* Seeds Status */}
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              <span className="text-sm font-medium">Seeds ({seeds?.length || 0})</span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(status.seeds)}
              {getStatusBadge(status.seeds)}
            </div>
          </div>
        </div>

        {/* Detailed Status */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Totaal seeds actief:</span>
            <span className="font-medium">{seeds?.filter(s => s.isActive).length || 0}</span>
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

        {/* Error Details */}
        {(status.supabase === 'error' || status.seeds === 'error' || status.vectorApi === 'missing') && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800 font-medium">Gedetecteerde problemen:</p>
            <ul className="text-sm text-red-700 mt-1 space-y-1">
              {status.supabase === 'error' && <li>• Supabase database verbinding mislukt</li>}
              {status.seeds === 'error' && <li>• Seeds kunnen niet geladen worden</li>}
              {status.openaiApi1 === 'missing' && <li>• OpenAI API Key 1 ontbreekt</li>}
              {status.openaiApi2 === 'missing' && <li>• OpenAI API Key 2 ontbreekt</li>}
              {status.vectorApi === 'missing' && <li>• Vector API Key 3 ontbreekt (nodig voor embeddings)</li>}
            </ul>
          </div>
        )}

        {/* Success State */}
        {overallHealth && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800 font-medium">
              ✅ Alle systemen operationeel! Neural + Symbolic + Vector embeddings werken samen.
            </p>
            <p className="text-xs text-green-700 mt-1">
              Vector embeddings gebruiken text-embedding-3-small model via API Key 3
            </p>
          </div>
        )}

        {/* Vector API specific notice */}
        {status.vectorApi === 'configured' && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 font-medium">
              🧠 Vector embeddings actief met text-embedding-3-small
            </p>
            <p className="text-xs text-blue-700 mt-1">
              Hybride neurosymbolische beslissingen kunnen nu neural similarity matching gebruiken
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ConnectionStatusDashboard;
