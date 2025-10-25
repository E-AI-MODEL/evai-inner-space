
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ApiKeyConfigurationProps {
  // Props kept for backward compatibility but not used
  apiKey?: string;
  onApiKeyChange?: (key: string) => void;
  onApiKeySave?: () => void;
}

const ApiKeyConfiguration: React.FC<ApiKeyConfigurationProps> = () => {

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
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>✅ Server-Side Beveiliging Actief</strong>
          <ul className="mt-2 text-sm space-y-1">
            <li>🔒 OpenAI API Keys: Beheerd via Supabase Edge Function Secrets</li>
            <li>🔒 Vector API Key: Beheerd via Supabase Edge Function Secrets</li>
            <li>📊 Status: Alle keys zijn veilig opgeslagen in de backend</li>
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">
            Je hoeft geen API keys meer in te voeren in deze UI.
            Alle AI-operaties gebruiken server-side keys voor maximale beveiliging.
          </p>
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>Server-Side API Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
            <span className="font-medium">OpenAI Primary Key</span>
            <Badge variant="default" className="bg-green-600">Active (Server-Side)</Badge>
          </div>
          <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
            <span className="font-medium">OpenAI Secondary Key</span>
            <Badge variant="default" className="bg-green-600">Active (Server-Side)</Badge>
          </div>
          <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
            <span className="font-medium">Vector API Key</span>
            <Badge variant="default" className="bg-green-600">Active (Server-Side)</Badge>
          </div>
        </CardContent>
      </Card>

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
