
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Key, Check, X } from 'lucide-react';

interface GoogleApiKeyConfigurationProps {
  onKeyUpdate?: (key: string) => void;
}

const GoogleApiKeyConfiguration: React.FC<GoogleApiKeyConfigurationProps> = ({ onKeyUpdate }) => {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadGoogleApiKey();
  }, []);

  const loadGoogleApiKey = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_google_api_key');
      if (error) {
        console.error('Error loading Google API key:', error);
        setStatus('error');
        setMessage('Failed to load Google API key');
      } else {
        setApiKey(data || '');
        console.log('✅ Google API key loaded successfully');
      }
    } catch (error) {
      console.error('Error loading Google API key:', error);
      setStatus('error');
      setMessage('Failed to load Google API key');
    } finally {
      setIsLoading(false);
    }
  };

  const saveGoogleApiKey = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase.rpc('update_google_api_key', {
        api_key: apiKey
      });

      if (error) {
        console.error('Error saving Google API key:', error);
        setStatus('error');
        setMessage('Failed to save Google API key');
      } else {
        setStatus('success');
        setMessage('Google API key saved successfully');
        onKeyUpdate?.(apiKey);
        console.log('✅ Google API key saved successfully');
      }
    } catch (error) {
      console.error('Error saving Google API key:', error);
      setStatus('error');
      setMessage('Failed to save Google API key');
    } finally {
      setIsSaving(false);
    }
  };

  const clearMessage = () => {
    setStatus('idle');
    setMessage('');
  };

  const isConfigured = apiKey.trim().length > 0;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Google API Key Configuration
        </CardTitle>
        <CardDescription>
          Configure your Google API key for enhanced AI capabilities in EvAI 2.0
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="google-api-key">Google API Key</Label>
          <div className="flex gap-2">
            <Input
              id="google-api-key"
              type="password"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                clearMessage();
              }}
              placeholder="Enter your Google API key..."
              disabled={isLoading || isSaving}
            />
            <Button
              onClick={saveGoogleApiKey}
              disabled={isLoading || isSaving || !apiKey.trim()}
              variant="outline"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>

        {status !== 'idle' && (
          <Alert variant={status === 'error' ? 'destructive' : 'default'}>
            <div className="flex items-center gap-2">
              {status === 'success' ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <X className="h-4 w-4 text-red-600" />
              )}
              <AlertDescription>{message}</AlertDescription>
            </div>
          </Alert>
        )}

        <div className="flex items-center gap-2 text-sm">
          <div className={`w-2 h-2 rounded-full ${isConfigured ? 'bg-green-500' : 'bg-gray-300'}`} />
          <span className={isConfigured ? 'text-green-600' : 'text-gray-500'}>
            {isConfigured ? 'Google API key configured' : 'Google API key not configured'}
          </span>
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <p>• Google API keys are stored securely in the database</p>
          <p>• This key enables advanced AI features and Google integrations</p>
          <p>• Get your API key from the Google Cloud Console</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default GoogleApiKeyConfiguration;
