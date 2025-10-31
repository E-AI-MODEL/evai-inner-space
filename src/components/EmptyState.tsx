import React from 'react';
import { MessageCircle } from 'lucide-react';

export const EmptyState: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] text-center px-4 py-8">
      <MessageCircle className="h-12 w-12 text-muted-foreground/40 mb-4" />
      <p className="text-muted-foreground text-sm">
        Start een gesprek om te beginnen
      </p>
    </div>
  );
};
