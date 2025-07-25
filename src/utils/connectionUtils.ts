
import { supabase } from '@/integrations/supabase/client';

export const checkSupabaseConnection = async () => {
  try {
    console.log('🔍 Testing Supabase connection v2.0...');
    
    const { data, error } = await supabase
      .from('emotion_seeds')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('🔴 Supabase connection error:', error.message);
      return false;
    } else {
      console.log('✅ Supabase connection v2.0 successful - database accessible');
      return true;
    }
  } catch (error) {
    console.error('🔴 Supabase connection failed with exception:', error);
    return false;
  }
};

export const checkAuthConnection = async () => {
  try {
    console.log('🔍 Testing Supabase auth v2.0...');
    
    console.log('✅ Single-user mode v2.0 - auth not required');
    return true;
  } catch (error) {
    console.error('🔴 Supabase auth failed with exception:', error);
    return false;
  }
};

export const checkApiKeyStatus = (apiKey: string, keyName: string) => {
  if (apiKey && apiKey.trim()) {
    console.log(`🔑 ${keyName} v2.0 configured`);
    return 'configured' as const;
  } else {
    console.log(`🔴 ${keyName} key missing`);
    return 'missing' as const;
  }
};

export const checkGoogleApiKey = async () => {
  try {
    console.log('🔍 Checking Google API key v2.0...');
    
    const { data, error } = await supabase.rpc('get_google_api_key');
    
    if (error) {
      console.error('❌ Error checking Google API key:', error);
      return 'missing' as const;
    }
    
    if (data && data.trim()) {
      console.log('✅ Google API key v2.0 configured');
      return 'configured' as const;
    } else {
      console.log('⚠️ Google API key not configured');
      return 'missing' as const;
    }
  } catch (error) {
    console.error('🔴 Google API key check failed:', error);
    return 'missing' as const;
  }
};

export const performFullSystemCheck = async () => {
  console.log('🚀 Starting full system health check v2.0...');
  
  const results = {
    supabase: false,
    auth: true,
    openaiApi1: false,
    openaiApi2: false,
    vectorApi: false,
    googleApi: false
  };

  results.supabase = await checkSupabaseConnection();
  
  const openaiKey1 = localStorage.getItem('openai-api-key');
  const openaiKey2 = localStorage.getItem('openai-api-key-2');
  const vectorKey = localStorage.getItem('vector-api-key');
  
  results.openaiApi1 = checkApiKeyStatus(openaiKey1 || '', 'OpenAI API 1') === 'configured';
  results.openaiApi2 = checkApiKeyStatus(openaiKey2 || '', 'OpenAI API 2') === 'configured';
  results.vectorApi = checkApiKeyStatus(vectorKey || '', 'Vector API') === 'configured';
  
  const googleStatus = await checkGoogleApiKey();
  results.googleApi = googleStatus === 'configured';
  
  console.log('📊 System check v2.0 results:', results);
  return results;
};
