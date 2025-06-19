
import React from 'react';
import { ConnectionStatus } from '../../types/connectionStatus';

interface ConnectionStatusMessagesProps {
  status: ConnectionStatus;
  overallHealth: boolean;
}

const ConnectionStatusMessages: React.FC<ConnectionStatusMessagesProps> = ({ 
  status, 
  overallHealth 
}) => {
  const hasErrors = status.supabase === 'error' || 
                   status.seeds === 'error' || 
                   status.vectorApi === 'missing' ||
                   status.openaiApi1 === 'missing' ||
                   status.openaiApi2 === 'missing';

  const neurosymbolicReady = 
    status.openaiApi1 === 'configured' && 
    status.openaiApi2 === 'configured' && 
    status.vectorApi === 'configured';

  return (
    <>
      {/* Error Details */}
      {hasErrors && (
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
    </>
  );
};

export default ConnectionStatusMessages;
