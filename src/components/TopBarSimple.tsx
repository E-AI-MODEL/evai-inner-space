
import React from 'react';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ApiConnectionStatus from './ApiConnectionStatus';
import { useApiConnection } from '../hooks/useApiConnection';

interface TopBarSimpleProps {
  apiKey: string;
  onOpenSettings: () => void;
  onClearHistory: () => void;
}

const TopBarSimple: React.FC<TopBarSimpleProps> = ({
  apiKey,
  onOpenSettings,
  onClearHistory
}) => {
  const { connectionStatus, isChecking, testConnection } = useApiConnection(apiKey);

  return (
    <div className="border-b bg-white px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold text-gray-900">EvAI Chat</h1>
          <ApiConnectionStatus
            status={connectionStatus}
            isChecking={isChecking}
            onRetest={testConnection}
            onOpenSettings={onOpenSettings}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClearHistory}
          >
            Wis Geschiedenis
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenSettings}
          >
            <Settings size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TopBarSimple;
