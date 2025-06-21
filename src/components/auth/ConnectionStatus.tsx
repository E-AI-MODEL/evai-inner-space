
import React from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface ConnectionStatusProps {
  connectionStatus: 'checking' | 'connected' | 'error';
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ connectionStatus }) => {
  return (
    <div className="flex items-center justify-center gap-2 mt-2">
      {connectionStatus === 'checking' && (
        <div className="flex items-center gap-2 text-yellow-600 text-xs">
          <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
          <span>Verbinding controleren...</span>
        </div>
      )}
      {connectionStatus === 'connected' && (
        <div className="flex items-center gap-2 text-green-600 text-xs">
          <CheckCircle className="w-3 h-3" />
          <span>Verbonden met database</span>
        </div>
      )}
      {connectionStatus === 'error' && (
        <div className="flex items-center gap-2 text-red-600 text-xs">
          <AlertCircle className="w-3 h-3" />
          <span>Verbindingsprobleem</span>
        </div>
      )}
    </div>
  );
};
