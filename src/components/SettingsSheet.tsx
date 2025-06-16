
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
import GoogleApiKeyInput from './GoogleApiKeyInput';

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
  const [googleApiKey, setGoogleApiKey] = useState('');

  useEffect(() => {
    const savedGoogleKey = localStorage.getItem('google-api-key');
    if (savedGoogleKey) {
      setGoogleApiKey(savedGoogleKey);
    }
  }, []);

  const handleGoogleApiKeySave = () => {
    if (googleApiKey.trim()) {
      localStorage.setItem('google-api-key', googleApiKey.trim());
    }
  };

  const openAiActive = apiKey && apiKey.trim().length > 0;
  const googleActive = googleApiKey && googleApiKey.trim().length > 0;
  const bothActive = openAiActive && googleActive;

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
                <span className="text-sm text-gray-700">Google Neurosymbolisch</span>
                <div className="flex items-center gap-2">
                  {googleActive ? (
                    <CheckCircle size={16} className="text-green-600" />
                  ) : (
                    <AlertCircle size={16} className="text-orange-500" />
                  )}
                  <Badge variant={googleActive ? "default" : "secondary"}>
                    {googleActive ? "Actief" : "Inactief"}
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
            <GoogleApiKeyInput
              value={googleApiKey}
              onChange={setGoogleApiKey}
              onSave={handleGoogleApiKeySave}
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SettingsSheet;
