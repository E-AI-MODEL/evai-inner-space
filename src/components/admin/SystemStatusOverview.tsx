
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Database } from 'lucide-react';



interface SystemStatusOverviewProps {
  openAiActive: boolean;
  huggingFaceActive: boolean;
  vectorActive: boolean;
  databaseActive: boolean;
}

const SystemStatusOverview: React.FC<SystemStatusOverviewProps> = ({
  openAiActive,
  huggingFaceActive,
  vectorActive,
  databaseActive,
}) => {
  const allActive = openAiActive && huggingFaceActive && vectorActive && databaseActive;

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Database size={16} className="text-purple-600" />
        <span className="font-medium text-gray-800">System Status</span>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs sm:text-sm truncate mr-2">API Key 1</span>
          <Badge variant={openAiActive ? "default" : "secondary"} className="text-xs flex-shrink-0">
            {openAiActive ? "Active" : "Inactive"}
          </Badge>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-xs sm:text-sm truncate mr-2">Hugging Face API</span>
          <Badge variant={huggingFaceActive ? "default" : "secondary"} className="text-xs flex-shrink-0">
            {huggingFaceActive ? "Active" : "Inactive"}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs sm:text-sm truncate mr-2">Vector API</span>
          <Badge variant={vectorActive ? "default" : "secondary"} className="text-xs flex-shrink-0">
            {vectorActive ? "Active" : "Inactive"}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs sm:text-sm truncate mr-2">Database</span>
          <Badge variant={databaseActive ? "default" : "secondary"} className="text-xs flex-shrink-0">
            {databaseActive ? "Connected" : "Disconnected"}
          </Badge>
        </div>
      </div>
      
      <div className="pt-3 mt-3 border-t border-purple-200">
        <div className="flex items-center justify-between">
          <span className="font-medium text-gray-800 text-xs sm:text-sm truncate mr-2">Full System</span>
          <div className="flex items-center gap-2 flex-shrink-0">
            {allActive ? (
              <CheckCircle size={14} className="text-green-600" />
            ) : (
              <AlertCircle size={14} className="text-orange-500" />
            )}
            <Badge variant={allActive ? "default" : "destructive"} className="text-xs">
              {allActive ? "Operational" : "Partial"}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemStatusOverview;
