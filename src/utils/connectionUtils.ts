
import { supabase } from '@/integrations/supabase/client';

export const checkSupabaseConnection = async () => {
  try {
    console.log('🔍 Testing Supabase connection...');
    
    // Simple query to test connection - just get a few records
    const { data, error } = await supabase
      .from('emotion_seeds')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('🔴 Supabase connection error:', error.message);
      return false;
    } else {
      console.log('✅ Supabase connection successful - database accessible');
      return true;
    }
  } catch (error) {
    console.error('🔴 Supabase connection failed with exception:', error);
    return false;
  }
};

export const checkApiKeyStatus = (apiKey: string, keyName: string) => {
  if (apiKey.trim()) {
    console.log(`🔑 ${keyName} configured`);
    return 'configured' as const;
  } else {
    console.log(`🔴 ${keyName} key missing`);
    return 'missing' as const;
  }
};
