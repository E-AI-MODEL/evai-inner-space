
import React from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface AuthStatusMessagesProps {
  error: string | null;
  success: string | null;
  connectionStatus: 'checking' | 'connected' | 'error';
}

export const AuthStatusMessages: React.FC<AuthStatusMessagesProps> = ({
  error,
  success,
  connectionStatus
}) => {
  return (
    <>
      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="whitespace-pre-line">{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="mt-4 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700 whitespace-pre-line">{success}</AlertDescription>
        </Alert>
      )}
      
      {connectionStatus === 'error' && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Er is een probleem met de database verbinding. Probeer de pagina te verversen.
          </AlertDescription>
        </Alert>
      )}
    </>
  );
};
