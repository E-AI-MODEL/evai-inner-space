
import React from 'react';
import { Brain, Loader2 } from 'lucide-react';
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ConnectionStatus } from './ConnectionStatus';

interface AuthHeaderProps {
  onIconClick: () => void;
  connectionStatus: 'checking' | 'connected' | 'error';
  iconClickCount: number;
}

export const AuthHeader: React.FC<AuthHeaderProps> = ({ 
  onIconClick, 
  connectionStatus, 
  iconClickCount 
}) => {
  return (
    <CardHeader className="text-center pb-4">
      <div className="flex justify-center mb-4">
        <div 
          className="p-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full cursor-pointer transition-transform hover:scale-105 active:scale-95 relative"
          onClick={onIconClick}
        >
          <Brain className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
          {iconClickCount > 0 && (
            <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-900 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
              {iconClickCount}
            </div>
          )}
        </div>
      </div>
      <CardTitle className="text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-700 via-blue-700 to-indigo-700 bg-clip-text text-transparent">
        Welkom bij EvAI
      </CardTitle>
      <CardDescription className="text-gray-600 text-sm sm:text-base">
        Log in of maak een account aan om toegang te krijgen tot EvAI.
        {iconClickCount > 0 && (
          <div className="text-yellow-600 font-medium mt-2">
            🎯 Special login: {iconClickCount}/3 clicks
          </div>
        )}
      </CardDescription>
      
      <ConnectionStatus connectionStatus={connectionStatus} />

      {/* Debug info for easter egg (only visible in development) */}
      {process.env.NODE_ENV === 'development' && iconClickCount > 0 && (
        <div className="text-xs text-gray-400 mt-1">
          Clicks: {iconClickCount}/3
        </div>
      )}
    </CardHeader>
  );
};
