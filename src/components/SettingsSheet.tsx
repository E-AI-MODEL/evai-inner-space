
import React, { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Database } from 'lucide-react';
import ApiKeyInput from './ApiKeyInput';
import OpenAIApiKey2Input from './OpenAIApiKey2Input';
import VectorApiKeyInput from './VectorApiKeyInput';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;

interface SettingsSheetProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  onApiKeySave: () => void;
}

const SettingsSheet: React.FC<SettingsSheetProps> = ({
  isOpen,
  onOpenChange,
  apiKey,
  onApiKeyChange,
  onApiKeySave,
}) => {
  const [openAiKey2, setOpenAiKey2] = useState('');
  const [vectorApiKey, setVectorApiKey] = useState('');

  useEffect(() => {
    const savedKey2 = localStorage.getItem('openai-api-key-2');
    const savedVectorKey = localStorage.getItem('vector-api-key');
    if (savedKey2) {
      setOpenAiKey2(savedKey2);
    }
    if (savedVectorKey) {
      setVectorApiKey(savedVectorKey);
    }
  }, []);

  const handleOpenAiKey2Save = () => {
    if (openAiKey2.trim()) {
      localStorage.setItem('openai-api-key-2', openAiKey2.trim());
    }
  };

  const handleVectorApiKeySave = () => {
    if (vectorApiKey.trim()) {
      localStorage.setItem('vector-api-key', vectorApiKey.trim());
    }
  };

  const openAiActive = apiKey && apiKey.trim().length > 0;
  const openAi2Active = openAiKey2 && openAiKey2.trim().length > 0;
  const vectorActive = vectorApiKey && vectorApiKey.trim().length > 0;
  const allThreeActive = openAiActive && openAi2Active && vectorActive;

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="font-inter overflow-y-auto">
        <SheetHeader>
          <SheetTitle>API Configuratie</SheetTitle>
          <SheetDescription>
            Configureer hier je API keys. De gegevens worden lokaal opgeslagen.
          </SheetDescription>
        </SheetHeader>

        <div className="py-4 space-y-6">
          {/* System Status Overview */}
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

          {/* API Key Configuration */}
          <div className="space-y-4">
            <h3 className="font-medium text-gray-800">API Key Configuratie</h3>
            <ApiKeyInput
              value={apiKey}
              onChange={onApiKeyChange}
              onSave={onApiKeySave}
            />
            <OpenAIApiKey2Input
              value={openAiKey2}
              onChange={setOpenAiKey2}
              onSave={handleOpenAiKey2Save}
            />
            <VectorApiKeyInput
              value={vectorApiKey}
              onChange={setVectorApiKey}
              onSave={handleVectorApiKeySave}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SettingsSheet;
