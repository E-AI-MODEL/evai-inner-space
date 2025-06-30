
import { supabase } from '@/integrations/supabase/client';

export const checkSupabaseConnection = async () => {
  try {
    console.log('🔍 Testing Supabase connection...');
    
    // Test basic connection first with a simple health check
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

export const checkAuthConnection = async () => {
  try {
    console.log('🔍 Testing Supabase auth...');
    
    // Since we're using single-user mode, always return true
    console.log('✅ Single-user mode - auth not required');
    return true;
  } catch (error) {
    console.error('🔴 Supabase auth failed with exception:', error);
    return false;
  }
};

export const checkApiKeyStatus = (apiKey: string, keyName: string) => {
  if (apiKey && apiKey.trim()) {
    console.log(`🔑 ${keyName} configured`);
    return 'configured' as const;
  } else {
    console.log(`🔴 ${keyName} key missing`);
    return 'missing' as const;
  }
};

export const performFullSystemCheck = async () => {
  console.log('🚀 Starting full system health check...');
  
  const results = {
    supabase: false,
    auth: true, // Always true in single-user mode
    openaiApi1: false,
    openaiApi2: false,
    vectorApi: false
  };

  // Check Supabase database connection
  results.supabase = await checkSupabaseConnection();
  
  // Check API keys
  const openaiKey1 = localStorage.getItem('openai-api-key');
  const openaiKey2 = localStorage.getItem('openai-api-key-2');
  const vectorKey = localStorage.getItem('vector-api-key');
  
  results.openaiApi1 = checkApiKeyStatus(openaiKey1 || '', 'OpenAI API 1') === 'configured';
  results.openaiApi2 = checkApiKeyStatus(openaiKey2 || '', 'OpenAI API 2') === 'configured';
  results.vectorApi = checkApiKeyStatus(vectorKey || '', 'Vector API') === 'configured';
  
  console.log('📊 System check results:', results);
  return results;
};
