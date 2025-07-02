
import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

interface SettingsSheetProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

const SettingsSheet: React.FC<SettingsSheetProps> = ({
  isOpen,
  onOpenChange,
}) => {
  const handleGoToAdmin = () => {
    window.open('/admin', '_blank');
    onOpenChange(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="font-inter">
        <SheetHeader>
          <SheetTitle>Instellingen</SheetTitle>
          <SheetDescription>
            Voor volledige configuratie, ga naar het Admin Dashboard.
          </SheetDescription>
        </SheetHeader>

        <div className="py-4 space-y-6">
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              API keys en systeemconfiguratie zijn verplaatst naar het Admin Dashboard voor een gecentraliseerde ervaring.
            </p>
            
            <Button 
              onClick={handleGoToAdmin}
              className="w-full flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Open Admin Dashboard
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default SettingsSheet;
