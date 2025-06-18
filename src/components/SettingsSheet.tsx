
import React, { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Zap, Brain } from 'lucide-react';
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

        {/* AI Integration Status */}
        <div className="py-4">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Zap size={16} className="text-blue-600" />
              <span className="font-medium text-gray-800">AI Integratie Status</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">OpenAI Emotiedetectie (Key 1)</span>
                <div className="flex items-center gap-2">
                  {openAiActive ? (
                    <CheckCircle size={16} className="text-green-600" />
                  ) : (
                    <AlertCircle size={16} className="text-orange-500" />
                  )}
                  <Badge variant={openAiActive ? "default" : "secondary"}>
                    {openAiActive ? "Actief" : "Inactief"}
                  </Badge>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">OpenAI Analyse (Key 2)</span>
                <div className="flex items-center gap-2">
                  {openAi2Active ? (
                    <CheckCircle size={16} className="text-green-600" />
                  ) : (
                    <AlertCircle size={16} className="text-orange-500" />
                  )}
                  <Badge variant={openAi2Active ? "default" : "secondary"}>
                    {openAi2Active ? "Actief" : "Inactief"}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Vector/Embedding API (Key 3)</span>
                <div className="flex items-center gap-2">
                  {vectorActive ? (
                    <CheckCircle size={16} className="text-green-600" />
                  ) : (
                    <AlertCircle size={16} className="text-orange-500" />
                  )}
                  <Badge variant={vectorActive ? "default" : "secondary"}>
                    {vectorActive ? "Actief" : "Inactief"}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Supabase Verbinding</span>
                <div className="flex items-center gap-2">
                  {supabaseUrl ? (
                    <CheckCircle size={16} className="text-green-600" />
                  ) : (
                    <AlertCircle size={16} className="text-orange-500" />
                  )}
                  <Badge variant={supabaseUrl ? "default" : "secondary"}>
                    {supabaseUrl ? "Actief" : "Inactief"}
                  </Badge>
                </div>
              </div>
              
              <div className="pt-2 border-t border-blue-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-800 flex items-center gap-2">
                    <Brain size={16} className="text-purple-600" />
                    Hybride Neurosymbolisch Model
                  </span>
                  <div className="flex items-center gap-2">
                    {allThreeActive ? (
                      <CheckCircle size={16} className="text-green-600" />
                    ) : (
                      <AlertCircle size={16} className="text-orange-500" />
                    )}
                    <Badge variant={allThreeActive ? "default" : "destructive"}>
                      {allThreeActive ? "Volledig Actief" : "Gedeeltelijk"}
                    </Badge>
                  </div>
                </div>
                {allThreeActive && (
                  <p className="text-xs text-green-700 mt-1">
                    🚀 Alle drie AI engines werken samen: Symbolisch (offline) + Neuraal (online) + Vector (similarity search)
                  </p>
                )}
                {!allThreeActive && (
                  <p className="text-xs text-orange-700 mt-1">
                    ⚠️ Voor het volledige hybride model zijn alle drie API keys vereist
                  </p>
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
