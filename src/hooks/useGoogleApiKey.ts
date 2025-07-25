
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
      console.log('🔄 Loading Google API key...');
      const { data, error } = await supabase.rpc('get_google_api_key');
      
      if (error) {
        console.error('❌ Error loading Google API key:', error);
        setError('Failed to load Google API key');
      } else {
        setGoogleApiKey(data || '');
        console.log('✅ Google API key loaded successfully');
      }
    } catch (err) {
      console.error('❌ Exception loading Google API key:', err);
      setError('Failed to load Google API key');
    } finally {
      setIsLoading(false);
    }
  };

  const updateGoogleApiKey = async (newKey: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Updating Google API key...');
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
