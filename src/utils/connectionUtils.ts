
import { supabase } from '@/integrations/supabase/client';

export const checkSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase
      .from('emotion_seeds')
      .select('id', { count: 'exact', head: true });
    
    if (error) {
      console.error('🔴 Supabase connection error:', error);
      return false;
    } else {
      console.log('✅ Supabase connection successful');
      return true;
    }
  } catch (error) {
    console.error('🔴 Supabase connection failed:', error);
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
