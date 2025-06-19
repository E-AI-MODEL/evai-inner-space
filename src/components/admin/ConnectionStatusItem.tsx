
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';

interface ConnectionStatusItemProps {
  icon: React.ReactNode;
  label: string;
  status: string;
  isHighlighted?: boolean;
}

const ConnectionStatusItem: React.FC<ConnectionStatusItemProps> = ({ 
  icon, 
  label, 
  status, 
  isHighlighted = false 
}) => {
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

  const containerClass = isHighlighted 
    ? "flex items-center justify-between p-3 border rounded-lg bg-blue-50"
    : "flex items-center justify-between p-3 border rounded-lg";

  return (
    <div className={containerClass}>
      <div className="flex items-center gap-2">
        {icon}
        <span className={`text-sm font-medium ${isHighlighted ? 'text-blue-800' : ''}`}>
          {label}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {getStatusIcon(status)}
        {getStatusBadge(status)}
      </div>
    </div>
  );
};

export default ConnectionStatusItem;
