
import React, { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
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

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="font-inter">
        <SheetHeader>
          <SheetTitle>Instellingen</SheetTitle>
          <SheetDescription>
            Beheer hier de instellingen voor EvAI. De gegevens worden lokaal opgeslagen.
          </SheetDescription>
        </SheetHeader>
        <div className="py-4 space-y-4">
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
      </SheetContent>
    </Sheet>
  );
};

export default SettingsSheet;
