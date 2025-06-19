
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Database } from 'lucide-react';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;

interface SystemStatusOverviewProps {
  openAiActive: boolean;
  openAi2Active: boolean;
  vectorActive: boolean;
}

const SystemStatusOverview: React.FC<SystemStatusOverviewProps> = ({
  openAiActive,
  openAi2Active,
  vectorActive,
}) => {
  const allThreeActive = openAiActive && openAi2Active && vectorActive;

  return (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <Database size={16} className="text-purple-600" />
        <span className="font-medium text-gray-800">Systeem Status</span>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-gray-700">Neural Engine (OpenAI Key 1)</span>
          <div className="flex items-center gap-2">
            {openAiActive ? (
              <CheckCircle size={14} className="text-green-600" />
            ) : (
              <AlertCircle size={14} className="text-orange-500" />
            )}
            <Badge variant={openAiActive ? "default" : "secondary"} className="text-xs">
              {openAiActive ? "Actief" : "Inactief"}
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-gray-700">Enhanced Analysis (OpenAI Key 2)</span>
          <div className="flex items-center gap-2">
            {openAi2Active ? (
              <CheckCircle size={14} className="text-green-600" />
            ) : (
              <AlertCircle size={14} className="text-orange-500" />
            )}
            <Badge variant={openAi2Active ? "default" : "secondary"} className="text-xs">
              {openAi2Active ? "Actief" : "Inactief"}
            </Badge>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-700">Vector Engine (Embeddings)</span>
          <div className="flex items-center gap-2">
            {vectorActive ? (
              <CheckCircle size={14} className="text-green-600" />
            ) : (
              <AlertCircle size={14} className="text-orange-500" />
            )}
            <Badge variant={vectorActive ? "default" : "secondary"} className="text-xs">
              {vectorActive ? "Actief" : "Inactief"}
            </Badge>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-gray-700">Database (Supabase)</span>
          <div className="flex items-center gap-2">
            {supabaseUrl ? (
              <CheckCircle size={14} className="text-green-600" />
            ) : (
              <AlertCircle size={14} className="text-orange-500" />
            )}
            <Badge variant={supabaseUrl ? "default" : "secondary"} className="text-xs">
              {supabaseUrl ? "Verbonden" : "Niet verbonden"}
            </Badge>
          </div>
        </div>
        
        <div className="pt-2 border-t border-purple-200">
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-800">Complete Workflow</span>
            <div className="flex items-center gap-2">
              {allThreeActive ? (
                <CheckCircle size={14} className="text-green-600" />
              ) : (
                <AlertCircle size={14} className="text-orange-500" />
              )}
              <Badge variant={allThreeActive ? "default" : "destructive"} className="text-xs">
                {allThreeActive ? "VOLLEDIG OPERATIONEEL" : "GEDEELTELIJK"}
              </Badge>
            </div>
          </div>
          {allThreeActive && (
            <p className="text-xs text-green-700 mt-1">
              🚀 Alle systemen actief: Neural + Symbolic + Vector processing
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemStatusOverview;
