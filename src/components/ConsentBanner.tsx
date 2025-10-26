import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, Shield } from 'lucide-react';

export function ConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('evai-consent');
    if (!consent) {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('evai-consent', 'true');
    localStorage.setItem('evai-consent-date', new Date().toISOString());
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('evai-consent', 'false');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom">
      <Card className="mx-auto max-w-3xl border-border/50 bg-background/95 backdrop-blur-sm shadow-lg">
        <div className="flex items-start gap-4 p-6">
          <Shield className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <h3 className="font-semibold text-lg">Privacy & Toestemming</h3>
            <p className="text-sm text-muted-foreground">
              EvAI Inner Space gebruikt lokale browser-technologie voor emotie-detectie en verwerkt geen persoonlijke data zonder uw expliciete toestemming.
              Alle conversaties blijven lokaal tenzij u deze expliciet deelt. Door verder te gaan accepteert u ons{' '}
              <a href="/privacy" className="underline hover:text-primary">privacybeleid</a>.
            </p>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleAccept} size="sm">
                Accepteren
              </Button>
              <Button onClick={handleDecline} variant="outline" size="sm">
                Weigeren
              </Button>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="flex-shrink-0"
            onClick={() => setIsVisible(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
