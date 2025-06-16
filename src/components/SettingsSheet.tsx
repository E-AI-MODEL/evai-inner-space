
import React, { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle, Zap } from 'lucide-react';
import ApiKeyInput from './ApiKeyInput';
import OpenAIApiKey2Input from './OpenAIApiKey2Input';

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

  useEffect(() => {
    const savedKey = localStorage.getItem('openai-api-key-2');
    if (savedKey) {
      setOpenAiKey2(savedKey);
    }
  }, []);

  const handleOpenAiKey2Save = () => {
    if (openAiKey2.trim()) {
      localStorage.setItem('openai-api-key-2', openAiKey2.trim());
    }
  };

  const openAiActive = apiKey && apiKey.trim().length > 0;
  const openAi2Active = openAiKey2 && openAiKey2.trim().length > 0;
  const bothActive = openAiActive && openAi2Active;

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="font-inter">
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
                <span className="text-sm text-gray-700">OpenAI Emotiedetectie</span>
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
                  <span className="text-sm font-medium text-gray-800">Volledige AI Samenwerking</span>
                  <div className="flex items-center gap-2">
                    {bothActive ? (
                      <CheckCircle size={16} className="text-green-600" />
                    ) : (
                      <AlertCircle size={16} className="text-orange-500" />
                    )}
                    <Badge variant={bothActive ? "default" : "destructive"}>
                      {bothActive ? "Volledig Actief" : "Gedeeltelijk"}
                    </Badge>
                  </div>
                </div>
                {bothActive && (
                  <p className="text-xs text-green-700 mt-1">
                    🚀 Beide AI engines werken samen voor optimale prestaties
                  </p>
                )}
              </div>
            </div>
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
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SettingsSheet;
