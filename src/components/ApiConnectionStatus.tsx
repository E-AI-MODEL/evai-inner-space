
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Key } from 'lucide-react';

interface ApiConnectionStatusProps {
  status: 'checking' | 'connected' | 'failed' | 'no-key';
  isChecking: boolean;
  onRetest: () => void;
  onOpenSettings: () => void;
}

const ApiConnectionStatus: React.FC<ApiConnectionStatusProps> = ({
  status,
  isChecking,
  onRetest,
  onOpenSettings
}) => {
  const getStatusIcon = () => {
    if (isChecking) return <RefreshCw size={14} className="animate-spin" />;
    
    switch (status) {
      case 'connected': return <CheckCircle size={14} />;
      case 'failed': return <XCircle size={14} />;
      case 'no-key': return <Key size={14} />;
      default: return <AlertCircle size={14} />;
    }
  };

  const getStatusText = () => {
    if (isChecking) return 'Testen...';
    
    switch (status) {
      case 'connected': return 'API Verbonden';
      case 'failed': return 'API Fout';
      case 'no-key': return 'Geen API Key';
      default: return 'Onbekend';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'connected': return 'bg-green-100 text-green-800 hover:bg-green-200';
      case 'failed': return 'bg-red-100 text-red-800 hover:bg-red-200';
      case 'no-key': return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
      default: return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Badge 
        className={`${getStatusColor()} cursor-pointer transition-colors`}
        onClick={status === 'connected' ? onRetest : onOpenSettings}
      >
        <div className="flex items-center gap-1">
          {getStatusIcon()}
          <span className="text-xs">{getStatusText()}</span>
        </div>
      </Badge>
      
      {status === 'failed' && (
        <Button
          size="sm"
          variant="outline"
          onClick={onRetest}
          disabled={isChecking}
          className="h-6 px-2 text-xs"
        >
          <RefreshCw size={12} className={isChecking ? "animate-spin" : ""} />
        </Button>
      )}
    </div>
  );
};

export default ApiConnectionStatus;
