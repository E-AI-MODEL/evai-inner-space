
import React, { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Zap, Brain, Database } from 'lucide-react';
import ApiKeyInput from './ApiKeyInput';
import OpenAIApiKey2Input from './OpenAIApiKey2Input';
import VectorApiKeyInput from './VectorApiKeyInput';
import RubricStrictnessControl from './RubricStrictnessControl';

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
          <SheetTitle>Instellingen</SheetTitle>
          <SheetDescription>
            Beheer hier de instellingen voor EvAI. De gegevens worden lokaal opgeslagen.
          </SheetDescription>
        </SheetHeader>

        {/* Neurosymbolic System Status */}
        <div className="py-4">
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Brain size={16} className="text-purple-600" />
              <span className="font-medium text-gray-800">Neurosymbolic System Status</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Symbolic Engine (Offline Rules)</span>
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-600" />
                  <Badge variant="default">Always Active</Badge>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Neural Engine (OpenAI Key 1)</span>
                <div className="flex items-center gap-2">
                  {openAiActive ? (
                    <CheckCircle size={16} className="text-green-600" />
                  ) : (
                    <AlertCircle size={16} className="text-orange-500" />
                  )}
                  <Badge variant={openAiActive ? "default" : "secondary"}>
                    {openAiActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Vector Engine (Embeddings API)</span>
                <div className="flex items-center gap-2">
                  {vectorActive ? (
                    <CheckCircle size={16} className="text-green-600" />
                  ) : (
                    <AlertCircle size={16} className="text-orange-500" />
                  )}
                  <Badge variant={vectorActive ? "default" : "secondary"}>
                    {vectorActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Enhanced Analysis (OpenAI Key 2)</span>
                <div className="flex items-center gap-2">
                  {openAi2Active ? (
                    <CheckCircle size={16} className="text-green-600" />
                  ) : (
                    <AlertCircle size={16} className="text-orange-500" />
                  )}
                  <Badge variant={openAi2Active ? "default" : "secondary"}>
                    {openAi2Active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Vector Database (Supabase)</span>
                <div className="flex items-center gap-2">
                  {supabaseUrl ? (
                    <CheckCircle size={16} className="text-green-600" />
                  ) : (
                    <AlertCircle size={16} className="text-orange-500" />
                  )}
                  <Badge variant={supabaseUrl ? "default" : "secondary"}>
                    {supabaseUrl ? "Connected" : "Disconnected"}
                  </Badge>
                </div>
              </div>
              
              <div className="pt-3 border-t border-purple-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-800 flex items-center gap-2">
                    <Database size={16} className="text-purple-600" />
                    Complete Neurosymbolic Workflow
                  </span>
                  <div className="flex items-center gap-2">
                    {allThreeActive ? (
                      <CheckCircle size={16} className="text-green-600" />
                    ) : (
                      <AlertCircle size={16} className="text-orange-500" />
                    )}
                    <Badge variant={allThreeActive ? "default" : "destructive"}>
                      {allThreeActive ? "FULLY OPERATIONAL" : "PARTIAL"}
                    </Badge>
                  </div>
                </div>
                {allThreeActive && (
                  <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
                    <p className="text-xs text-green-800 font-medium">
                      🚀 COMPLETE NEUROSYMBOLIC WORKFLOW ACTIVE
                    </p>
                    <p className="text-xs text-green-700 mt-1">
                      • Symbolic reasoning (offline rules & patterns)<br/>
                      • Neural processing (OpenAI language understanding)<br/>
                      • Vector similarity search (contextual memory)<br/>
                      • Hybrid decision engine (optimal response selection)<br/>
                      • Self-reflection system (continuous learning)
                    </p>
                  </div>
                )}
                {!allThreeActive && (
                  <div className="mt-2 p-2 bg-orange-50 rounded border border-orange-200">
                    <p className="text-xs text-orange-800 font-medium">
                      ⚠️ PARTIAL OPERATION
                    </p>
                    <p className="text-xs text-orange-700 mt-1">
                      Voor het complete neurosymbolic workflow zijn alle drie API keys vereist:<br/>
                      {!openAiActive && "• OpenAI Key 1 (Neural processing) MISSING\n"}
                      {!vectorActive && "• Vector API Key (Embeddings) MISSING\n"}
                      {!openAi2Active && "• OpenAI Key 2 (Enhanced analysis) MISSING\n"}
                      Huidige modus: Enhanced symbolic + {openAiActive ? "neural" : "pattern"} matching
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Rubric Settings */}
          <div className="mb-6">
            <RubricStrictnessControl />
          </div>

          <div className="space-y-4">
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
