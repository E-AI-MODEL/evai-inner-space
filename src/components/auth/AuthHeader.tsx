
import React from 'react';
import { Brain } from 'lucide-react';
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ConnectionStatus } from './ConnectionStatus';

interface AuthHeaderProps {
  connectionStatus: 'checking' | 'connected' | 'error';
}

export const AuthHeader: React.FC<AuthHeaderProps> = ({ 
  connectionStatus
}) => {
  return (
    <CardHeader className="text-center pb-4">
      <div className="flex justify-center mb-4">
        <div className="p-3 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full">
          <Brain className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
        </div>
      </div>
      <CardTitle className="text-lg sm:text-xl font-bold bg-gradient-to-r from-purple-700 via-blue-700 to-indigo-700 bg-clip-text text-transparent">
        Welkom bij EvAI
      </CardTitle>
      <CardDescription className="text-gray-600 text-sm sm:text-base">
        Log in of maak een account aan om toegang te krijgen tot EvAI.
      </CardDescription>
      
      <ConnectionStatus connectionStatus={connectionStatus} />
    </CardHeader>
  );
};
