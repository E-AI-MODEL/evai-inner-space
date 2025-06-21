
import { supabase } from '@/integrations/supabase/client';

export const checkSupabaseConnection = async () => {
  try {
    console.log('🔍 Testing Supabase connection...');
    
    // Test basic connection first
    const { data, error } = await supabase
      .from('emotion_seeds')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('🔴 Supabase connection error:', error.message);
      return { success: false, error: error.message };
    } else {
      console.log('✅ Supabase connection successful - database accessible');
      return { success: true, data };
    }
  } catch (error) {
    console.error('🔴 Supabase connection failed with exception:', error);
    return { success: false, error: error.message };
  }
};

export const checkAuthConnection = async () => {
  try {
    console.log('🔍 Testing Supabase auth...');
    
    // Test auth connection
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('🔴 Supabase auth error:', error.message);
      return { success: false, error: error.message };
    } else {
      console.log('✅ Supabase auth accessible');
      return { success: true, session };
    }
  } catch (error) {
    console.error('🔴 Supabase auth failed with exception:', error);
    return { success: false, error: error.message };
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
