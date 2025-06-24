
import React from 'react';
import { AlertCircle, CheckCircle, Wifi, WifiOff } from 'lucide-react';

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
    <div className="mt-4 space-y-3">
      {/* Connection Status */}
      <div className="flex items-center gap-2 text-sm">
        {connectionStatus === 'checking' && (
          <>
            <Wifi className="h-4 w-4 animate-pulse text-blue-500" />
            <span className="text-blue-600">Verbinding controleren...</span>
          </>
        )}
        {connectionStatus === 'connected' && (
          <>
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-green-600">Verbonden met authenticatieserver</span>
          </>
        )}
        {connectionStatus === 'error' && (
          <>
            <WifiOff className="h-4 w-4 text-red-500" />
            <span className="text-red-600">Kan niet verbinden met server</span>
          </>
        )}
      </div>

      {/* Error Messages */}
      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
          <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-700 leading-relaxed whitespace-pre-line">
            {error}
          </div>
        </div>
      )}

      {/* Success Messages */}
      {success && (
        <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-green-700 leading-relaxed whitespace-pre-line">
            {success}
          </div>
        </div>
      )}

      {/* Demo Environment Warning */}
      {typeof window !== 'undefined' && window.location.hostname.includes('lovableproject.com') && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-700">
              <strong>Demo Omgeving Gedetecteerd</strong><br />
              Je bent in de ontwikkelomgeving. Voor productie gebruik dien je:
              <ul className="mt-2 ml-4 list-disc space-y-1">
                <li>De app te deployen via de Publish knop</li>
                <li>Een custom domein in te stellen</li>
                <li>Supabase URL configuratie aan te passen</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
