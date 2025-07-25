
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Key, Check, X, AlertTriangle } from 'lucide-react';

interface GoogleApiKeyConfigurationProps {
  onKeyUpdate?: (key: string) => void;
}

const GoogleApiKeyConfiguration: React.FC<GoogleApiKeyConfigurationProps> = ({ onKeyUpdate }) => {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'warning'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadGoogleApiKey();
  }, []);

  const validateApiKey = (key: string): { isValid: boolean; warning?: string } => {
    if (!key.trim()) {
      return { isValid: false };
    }

    // Check for mock/test keys
    if (key.includes('demo') || key.includes('test') || key.includes('mock') || key.includes('dev')) {
      return { 
        isValid: false, 
        warning: 'Mock/test API keys zijn niet toegestaan in productie' 
      };
    }

    // Basic format validation for Google API keys
    if (!key.startsWith('AIzaSy')) {
      return { 
        isValid: false, 
        warning: 'Google API keys beginnen meestal met "AIzaSy"' 
      };
    }

    return { isValid: true };
  };

  const loadGoogleApiKey = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_google_api_key');
      if (error) {
        console.error('Error loading Google API key:', error);
        setStatus('error');
        setMessage('Failed to load Google API key from database');
      } else {
        const loadedKey = data || '';
        const validation = validateApiKey(loadedKey);
        
        if (loadedKey && !validation.isValid && validation.warning) {
          setStatus('warning');
          setMessage(validation.warning);
        }
        
        setApiKey(loadedKey);
        console.log('✅ Google API key loaded from database');
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
    const validation = validateApiKey(apiKey);
    
    if (!validation.isValid) {
      setStatus('error');
      setMessage(validation.warning || 'Invalid API key format');
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.rpc('update_google_api_key', {
        api_key: apiKey
      });

      if (error) {
        console.error('Error saving Google API key:', error);
        setStatus('error');
        setMessage('Failed to save Google API key to database');
      } else {
        setStatus('success');
        setMessage('Google API key saved successfully');
        onKeyUpdate?.(apiKey);
        console.log('✅ Google API key saved to database');
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

  const isConfigured = apiKey.trim().length > 0 && validateApiKey(apiKey).isValid;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Google API Key Configuration
        </CardTitle>
        <CardDescription>
          Configure your real Google API key for production use in EvAI 2.0
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
              placeholder="AIzaSy... (Enter your real Google API key)"
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
          <Alert variant={status === 'error' ? 'destructive' : status === 'warning' ? 'destructive' : 'default'}>
            <div className="flex items-center gap-2">
              {status === 'success' ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : status === 'warning' ? (
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
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
            {isConfigured ? 'Real Google API key configured' : 'No valid Google API key configured'}
          </span>
        </div>

        <div className="text-xs text-gray-500 space-y-1">
          <p>• Only real production API keys are accepted</p>
          <p>• Mock/test/demo keys are automatically rejected</p>
          <p>• Keys are stored securely in the database</p>
          <p>• Get your API key from the Google Cloud Console</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default GoogleApiKeyConfiguration;
