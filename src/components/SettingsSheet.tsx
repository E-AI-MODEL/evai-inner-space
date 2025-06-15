
import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import ApiKeyInput from './ApiKeyInput';

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
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="font-inter">
        <SheetHeader>
          <SheetTitle>Instellingen</SheetTitle>
          <SheetDescription>
            Beheer hier de instellingen voor EvAI. De gegevens worden lokaal opgeslagen.
          </SheetDescription>
        </SheetHeader>
        <div className="py-4">
          <ApiKeyInput
            value={apiKey}
            onChange={onApiKeyChange}
            onSave={onApiKeySave}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SettingsSheet;
