
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Key, Globe, BookOpen, Copy, Check } from 'lucide-react';
import { ApiKeyDiscoveryService, ApiKeyDiscoveryResult } from '@/services/ApiKeyDiscoveryService';
import { useToast } from '@/components/ui/use-toast';

interface ApiKeyDiscoveryPanelProps {
  onApiKeyFound?: (provider: string, apiKey: string) => void;
}

const ApiKeyDiscoveryPanel: React.FC<ApiKeyDiscoveryPanelProps> = ({ onApiKeyFound }) => {
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoveryResults, setDiscoveryResults] = useState<Record<string, ApiKeyDiscoveryResult>>({});
  const [activeProvider, setActiveProvider] = useState<string>('openai');
  const [copiedText, setCopiedText] = useState<string>('');
  const { toast } = useToast();

  const providers = [
    { id: 'openai', name: 'OpenAI', icon: '🤖' },
    { id: 'google', name: 'Google', icon: '🔍' },
    { id: 'anthropic', name: 'Anthropic', icon: '🧠' },
    { id: 'vector', name: 'Vector DB', icon: '🗄️' }
  ];

  const handleDiscoverApiKey = async (provider: string) => {
    setIsDiscovering(true);
    console.log('🔍 Starting API key discovery for:', provider);
    
    try {
      const result = await ApiKeyDiscoveryService.discoverApiKey({
        provider: provider as any,
        searchDepth: 3,
        includeInstructions: true
      });

      setDiscoveryResults(prev => ({ ...prev, [provider]: result }));
      
      await ApiKeyDiscoveryService.logDiscoveryAttempt(provider, result);
      
      if (result.success && result.apiKey) {
        toast({
          title: "API Key gevonden!",
          description: `${provider} API key succesvol ontdekt en klaar voor gebruik.`,
          duration: 5000,
        });
        
        onApiKeyFound?.(provider, result.apiKey);
      } else {
        toast({
          title: "Instructies gevonden",
          description: `Instructies voor ${provider} API key zijn beschikbaar.`,
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('❌ Discovery failed:', error);
      toast({
        title: "Discovery mislukt",
        description: `Kon geen informatie vinden voor ${provider} API key.`,
        variant: "destructive",
        duration: 3000,
      });
    } finally {
      setIsDiscovering(false);
    }
  };

  const handleCopyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);
      setTimeout(() => setCopiedText(''), 2000);
      toast({
        title: "Gekopieerd!",
        description: "Tekst is gekopieerd naar het klembord.",
        duration: 2000,
      });
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  const renderDiscoveryResult = (provider: string) => {
    const result = discoveryResults[provider];
    if (!result) return null;

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant={result.success ? "default" : "destructive"}>
            {result.success ? "Succes" : "Fout"}
          </Badge>
          <Badge variant="outline">{result.source}</Badge>
        </div>

        {result.success && result.apiKey && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-4 w-4" />
                Gevonden API Key
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <code className="bg-muted px-2 py-1 rounded text-sm flex-1">
                  {result.apiKey.substring(0, 20)}...
                </code>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopyToClipboard(result.apiKey!)}
                >
                  {copiedText === result.apiKey ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {result.instructions && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Instructies
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <pre className="whitespace-pre-wrap text-sm bg-muted p-3 rounded">
                  {result.instructions}
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopyToClipboard(result.instructions!)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Kopieer instructies
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {result.crawlData && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Crawl Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm font-medium">{result.crawlData.title}</p>
                <div className="text-xs text-muted-foreground">
                  Laatste update: {new Date(result.crawlData.lastUpdated).toLocaleString()}
                </div>
                <div className="space-y-1">
                  {result.crawlData.steps?.map((step: string, index: number) => (
                    <div key={index} className="text-sm pl-4 border-l-2 border-muted">
                      {step}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {result.error && (
          <Alert variant="destructive">
            <AlertDescription>{result.error}</AlertDescription>
          </Alert>
        )}
      </div>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          API Key Discovery - EvAI 2.0
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Automatisch zoeken naar API keys en setup instructies
        </p>
      </CardHeader>
      <CardContent>
        <Tabs value={activeProvider} onValueChange={setActiveProvider}>
          <TabsList className="grid w-full grid-cols-4">
            {providers.map(provider => (
              <TabsTrigger key={provider.id} value={provider.id}>
                <span className="mr-2">{provider.icon}</span>
                {provider.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {providers.map(provider => (
            <TabsContent key={provider.id} value={provider.id} className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <span>{provider.icon}</span>
                  {provider.name} API Key Discovery
                </h3>
                <Button
                  onClick={() => handleDiscoverApiKey(provider.id)}
                  disabled={isDiscovering}
                  className="flex items-center gap-2"
                >
                  <Search className="h-4 w-4" />
                  {isDiscovering ? 'Zoeken...' : 'Zoek API Key'}
                </Button>
              </div>

              {renderDiscoveryResult(provider.id)}
            </TabsContent>
          ))}
        </Tabs>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h4 className="font-medium mb-2">EvAI 2.0 Features:</h4>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• Automatische API key discovery via webcrawling</li>
            <li>• Mock API keys voor development</li>
            <li>• Stap-voor-stap instructies</li>
            <li>• Geïntegreerde setup begeleiding</li>
            <li>• Logging van discovery pogingen</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default ApiKeyDiscoveryPanel;
