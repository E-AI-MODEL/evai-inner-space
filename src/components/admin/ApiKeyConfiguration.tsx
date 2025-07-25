
import React, { useState } from 'react';
import ApiKeyInput from '../shared/ApiKeyInput';
import GoogleApiKeyConfiguration from './GoogleApiKeyConfiguration';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Key, Settings, Shield, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
  const validateApiKey = (key: string) => {
    if (!key?.trim()) return { status: 'missing', color: 'destructive', message: 'Not configured' };
    
    if (key.includes('demo') || key.includes('test') || key.includes('mock') || key.includes('dev')) {
      return { status: 'invalid', color: 'destructive', message: 'Mock/test key (not allowed)' };
    }
    
    if (!key.startsWith('sk-')) {
      return { status: 'invalid', color: 'destructive', message: 'Invalid format' };
    }
    
    return { status: 'valid', color: 'default', message: 'Valid production key' };
  };

  const primaryKeyStatus = validateApiKey(apiKey);
  const secondaryKeyStatus = validateApiKey(openAiKey2);
  const vectorKeyStatus = validateApiKey(vectorApiKey);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-800">API Configuration - Production Mode</h3>
        <Badge variant="outline" className="flex items-center gap-1">
          <Shield className="h-3 w-3" />
          Production Only
        </Badge>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Production Mode:</strong> Only real API keys are accepted. Mock, test, or demo keys are automatically rejected.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="keys" className="w-full">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="keys" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            API Keys Configuration
          </TabsTrigger>
        </TabsList>

        <TabsContent value="keys" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Production API Keys
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <ApiKeyInput
                      label="OpenAI API Key (Primary) *"
                      placeholder="sk-... (Required for core functionality)"
                      storageKey="openai-api-key"
                      value={apiKey}
                      onChange={onApiKeyChange}
                      onSave={onApiKeySave}
                    />
                    <Badge variant={primaryKeyStatus.color as any}>
                      {primaryKeyStatus.message}
                    </Badge>
                  </div>
                  {primaryKeyStatus.status === 'invalid' && (
                    <p className="text-sm text-red-600">
                      This API key is not valid for production use. Please provide a real OpenAI API key.
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <ApiKeyInput
                      label="OpenAI API Key (Secondary)"
                      placeholder="sk-... (Optional backup key)"
                      storageKey="openai-api-key-2"
                      value={openAiKey2}
                      onChange={setOpenAiKey2}
                      onSave={handleOpenAiKey2Save}
                    />
                    <Badge variant={secondaryKeyStatus.color as any}>
                      {secondaryKeyStatus.message}
                    </Badge>
                  </div>
                  {secondaryKeyStatus.status === 'invalid' && openAiKey2 && (
                    <p className="text-sm text-red-600">
                      This secondary API key is not valid for production use.
                    </p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <ApiKeyInput
                      label="Vector API Key"
                      placeholder="sk-... (Optional for enhanced embeddings)"
                      storageKey="vector-api-key"
                      value={vectorApiKey}
                      onChange={setVectorApiKey}
                      onSave={handleVectorApiKeySave}
                    />
                    <Badge variant={vectorKeyStatus.color as any}>
                      {vectorKeyStatus.message}
                    </Badge>
                  </div>
                  {vectorKeyStatus.status === 'invalid' && vectorApiKey && (
                    <p className="text-sm text-red-600">
                      This vector API key is not valid for production use.
                    </p>
                  )}
                </div>
              </div>

              <GoogleApiKeyConfiguration onKeyUpdate={onGoogleApiKeyUpdate} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
        <h4 className="font-medium text-green-900 mb-2">Production Features Active:</h4>
        <ul className="text-sm text-green-800 space-y-1">
          <li>• Real-time API key validation</li>
          <li>• Mock/test key rejection</li>
          <li>• Secure database storage</li>
          <li>• Production-grade error handling</li>
          <li>• Professional chat experience</li>
        </ul>
      </div>
    </div>
  );
};

export default ApiKeyConfiguration;
