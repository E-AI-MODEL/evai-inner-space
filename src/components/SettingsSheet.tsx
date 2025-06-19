
import React, { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import SystemStatusOverview from './admin/SystemStatusOverview';
import ApiKeyConfiguration from './admin/ApiKeyConfiguration';

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
          <SystemStatusOverview
            openAiActive={openAiActive}
            openAi2Active={openAi2Active}
            vectorActive={vectorActive}
          />

          <ApiKeyConfiguration
            apiKey={apiKey}
            onApiKeyChange={onApiKeyChange}
            onApiKeySave={onApiKeySave}
            openAiKey2={openAiKey2}
            setOpenAiKey2={setOpenAiKey2}
            handleOpenAiKey2Save={handleOpenAiKey2Save}
            vectorApiKey={vectorApiKey}
            setVectorApiKey={setVectorApiKey}
            handleVectorApiKeySave={handleVectorApiKeySave}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SettingsSheet;
