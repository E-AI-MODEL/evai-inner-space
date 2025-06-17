
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Database, Wifi, WifiOff, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '../../hooks/use-mobile';

interface ConnectionMetrics {
  status: 'connected' | 'disconnected' | 'checking';
  latency: number | null;
  lastCheck: Date;
  errorCount: number;
}

const SupabaseConnectionStatus: React.FC = () => {
  const [metrics, setMetrics] = useState<ConnectionMetrics>({
    status: 'checking',
    latency: null,
    lastCheck: new Date(),
    errorCount: 0
  });
  const isMobile = useIsMobile();

  const checkConnection = async () => {
    const startTime = Date.now();
    
    try {
      setMetrics(prev => ({ ...prev, status: 'checking' }));
      
      // Simple health check - try to count rows in a table
      const { data, error } = await supabase
        .from('emotion_seeds')
        .select('id', { count: 'exact', head: true });
      
      const latency = Date.now() - startTime;
      
      if (error) {
        console.error('Supabase connection error:', error);
        setMetrics(prev => ({
          ...prev,
          status: 'disconnected',
          latency: null,
          lastCheck: new Date(),
          errorCount: prev.errorCount + 1
        }));
      } else {
        setMetrics(prev => ({
          ...prev,
          status: 'connected',
          latency,
          lastCheck: new Date(),
          errorCount: 0
        }));
      }
    } catch (error) {
      console.error('Connection check failed:', error);
      setMetrics(prev => ({
        ...prev,
        status: 'disconnected',
        latency: null,
        lastCheck: new Date(),
        errorCount: prev.errorCount + 1
      }));
    }
  };

  useEffect(() => {
    // Initial check
    checkConnection();
    
    // Set up interval for periodic checks
    const interval = setInterval(checkConnection, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    switch (metrics.status) {
      case 'connected': return 'bg-green-100 text-green-800 border-green-200';
      case 'disconnected': return 'bg-red-100 text-red-800 border-red-200';
      case 'checking': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = () => {
    const size = isMobile ? 12 : 14;
    switch (metrics.status) {
      case 'connected': return <Wifi size={size} className="text-green-600" />;
      case 'disconnected': return <WifiOff size={size} className="text-red-600" />;
      case 'checking': return <Clock size={size} className="text-yellow-600 animate-pulse" />;
      default: return <Database size={size} className="text-gray-600" />;
    }
  };

  const getStatusText = () => {
    if (isMobile) {
      switch (metrics.status) {
        case 'connected': return 'OK';
        case 'disconnected': return 'Fout';
        case 'checking': return '...';
        default: return '?';
      }
    }
    
    switch (metrics.status) {
      case 'connected': return 'Verbonden';
      case 'disconnected': return 'Geen verbinding';
      case 'checking': return 'Controleren...';
      default: return 'Onbekend';
    }
  };

  const getLatencyColor = (latency: number | null) => {
    if (!latency) return 'text-gray-600';
    if (latency < 200) return 'text-green-600';
    if (latency < 500) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card className="bg-white/60 backdrop-blur-sm border-white/20 shadow-lg min-w-0 flex-shrink-0">
      <CardContent className={`${isMobile ? 'p-2' : 'p-3'}`}>
        <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
          <div className="flex items-center gap-1 min-w-0">
            {getStatusIcon()}
            <Badge className={`${getStatusColor()} text-xs flex-shrink-0 px-1.5 py-0.5`}>
              {getStatusText()}
            </Badge>
          </div>
          
          {metrics.latency && !isMobile && (
            <div className={`text-xs font-medium ${getLatencyColor(metrics.latency)} flex-shrink-0`}>
              {metrics.latency}ms
            </div>
          )}
        </div>
        
        {!isMobile && (
          <>
            <div className="text-xs text-gray-500 mt-1 truncate">
              Laatste check: {metrics.lastCheck.toLocaleTimeString('nl-NL')}
            </div>
            
            {metrics.errorCount > 0 && (
              <div className="text-xs text-red-600 mt-1">
                {metrics.errorCount} fouten
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default SupabaseConnectionStatus;
