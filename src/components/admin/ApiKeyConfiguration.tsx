
import React, { useState } from 'react';
import ApiKeyInput from '../shared/ApiKeyInput';
import GoogleApiKeyConfiguration from './GoogleApiKeyConfiguration';
import ApiKeyDiscoveryPanel from './ApiKeyDiscoveryPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Key, Settings } from 'lucide-react';

interface ApiKeyConfigurationProps {
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  onApiKeySave: () => void;
  openAiKey2: string;
  setOpenAiKey2: (key: string) => void;
  handleOpenAiKey2Save: () => void;
  vectorApiKey: string;
  setVectorApiKey: (key: string) => void;
  handleVectorApiKeySave: () => void;
  onGoogleApiKeyUpdate?: (key: string) => void;
}

const ApiKeyConfiguration: React.FC<ApiKeyConfigurationProps> = ({
  apiKey,
  onApiKeyChange,
  onApiKeySave,
  openAiKey2,
  setOpenAiKey2,
  handleOpenAiKey2Save,
  vectorApiKey,
  setVectorApiKey,
  handleVectorApiKeySave,
  onGoogleApiKeyUpdate,
}) => {
  const [discoveryMode, setDiscoveryMode] = useState(false);

  const handleApiKeyFound = (provider: string, foundKey: string) => {
    console.log('🔑 API key found for provider:', provider);
    
    switch (provider) {
      case 'openai':
        onApiKeyChange(foundKey);
        onApiKeySave();
        break;
      case 'google':
        onGoogleApiKeyUpdate?.(foundKey);
        break;
      case 'vector':
        setVectorApiKey(foundKey);
        handleVectorApiKeySave();
        break;
      default:
        console.log('Unknown provider:', provider);
    }
  };

  const getKeyStatus = (key: string) => {
    if (!key?.trim()) return { status: 'missing', color: 'destructive' };
    if (key.includes('demo') || key.includes('test') || key.includes('mock')) {
      return { status: 'mock', color: 'secondary' };
    }
    return { status: 'configured', color: 'default' };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-800">API Configuration - EvAI 2.0</h3>
        <Badge variant="outline" className="flex items-center gap-1">
          <Search className="h-3 w-3" />
          Auto-Discovery Enabled
        </Badge>
      </div>

      <Tabs defaultValue="manual" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manual" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Handmatige Configuratie
          </TabsTrigger>
          <TabsTrigger value="discovery" className="flex items-center gap-2">
            <Search className="h-4 w-4" />
            Automatische Discovery
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                API Keys
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <ApiKeyInput
                    label="OpenAI API Key (Primary)"
                    placeholder="sk-..."
                    storageKey="openai-api-key"
                    value={apiKey}
                    onChange={onApiKeyChange}
                    onSave={onApiKeySave}
                  />
                  <Badge variant={getKeyStatus(apiKey).color as any}>
                    {getKeyStatus(apiKey).status}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2">
                  <ApiKeyInput
                    label="OpenAI API Key (Secondary)"
                    placeholder="sk-..."
                    storageKey="openai-api-key-2"
                    value={openAiKey2}
                    onChange={setOpenAiKey2}
                    onSave={handleOpenAiKey2Save}
                  />
                  <Badge variant={getKeyStatus(openAiKey2).color as any}>
                    {getKeyStatus(openAiKey2).status}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2">
                  <ApiKeyInput
                    label="Vector API Key"
                    placeholder="Optional"
                    storageKey="vector-api-key"
                    value={vectorApiKey}
                    onChange={setVectorApiKey}
                    onSave={handleVectorApiKeySave}
                  />
                  <Badge variant={getKeyStatus(vectorApiKey).color as any}>
                    {getKeyStatus(vectorApiKey).status}
                  </Badge>
                </div>
              </div>

              <GoogleApiKeyConfiguration onKeyUpdate={onGoogleApiKeyUpdate} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="discovery" className="space-y-4">
          <ApiKeyDiscoveryPanel onApiKeyFound={handleApiKeyFound} />
        </TabsContent>
      </Tabs>

      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h4 className="font-medium text-blue-900 mb-2">EvAI 2.0 Nieuwe Features:</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Automatische API key discovery via webcrawling</li>
          <li>• Mock API keys voor ontwikkeling en testing</li>
          <li>• Geïntegreerde setup instructies</li>
          <li>• Realtime key status monitoring</li>
          <li>• Verbeterde foutafhandeling</li>
        </ul>
      </div>
    </div>
  );
};

export default ApiKeyConfiguration;
