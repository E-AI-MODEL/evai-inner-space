
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useGoogleApiKey() {
  const [googleApiKey, setGoogleApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadGoogleApiKey();
  }, []);

  const loadGoogleApiKey = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Loading Google API key from database...');
      const { data, error } = await supabase.rpc('get_google_api_key');
      
      if (error) {
        console.error('❌ Error loading Google API key:', error);
        setError('Failed to load Google API key');
      } else {
        const apiKey = data || '';
        if (apiKey && !apiKey.includes('demo') && !apiKey.includes('test') && !apiKey.includes('mock')) {
          setGoogleApiKey(apiKey);
          console.log('✅ Real Google API key loaded successfully');
        } else {
          console.warn('⚠️ Invalid or test Google API key found');
          setGoogleApiKey('');
        }
      }
    } catch (err) {
      console.error('❌ Exception loading Google API key:', err);
      setError('Failed to load Google API key');
    } finally {
      setIsLoading(false);
    }
  };

  const updateGoogleApiKey = async (newKey: string) => {
    // Validate that it's not a mock key
    if (newKey && (newKey.includes('demo') || newKey.includes('test') || newKey.includes('mock'))) {
      setError('Mock API keys are not allowed in production');
      return false;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Updating Google API key in database...');
      const { error } = await supabase.rpc('update_google_api_key', {
        api_key: newKey
      });
      
      if (error) {
        console.error('❌ Error updating Google API key:', error);
        setError('Failed to update Google API key');
        return false;
      } else {
        setGoogleApiKey(newKey);
        console.log('✅ Google API key updated successfully');
        return true;
      }
    } catch (err) {
      console.error('❌ Exception updating Google API key:', err);
      setError('Failed to update Google API key');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const clearGoogleApiKey = async () => {
    return await updateGoogleApiKey('');
  };

  return {
    googleApiKey,
    isLoading,
    error,
    loadGoogleApiKey,
    updateGoogleApiKey,
    clearGoogleApiKey,
    isConfigured: googleApiKey.trim().length > 0
  };
}
