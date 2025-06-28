
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Supabase credentials are required; no built-in demo is provided
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as
  | string
  | undefined;

const missingVars: string[] = [];
if (!SUPABASE_URL) missingVars.push('VITE_SUPABASE_URL');
if (!SUPABASE_PUBLISHABLE_KEY) missingVars.push('VITE_SUPABASE_ANON_KEY');

if (missingVars.length > 0) {
  const message = `Supabase configuration missing: ${missingVars.join(
    ', '
  )}. Check the README for setup instructions.`;
  throw new Error(message);
}

// Configure Supabase client with proper auth settings
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Test connection function
export const testSupabaseConnection = async () => {
  try {
    console.log('🔍 Testing Supabase connection...');
    
    const { data, error } = await supabase
      .from('emotion_seeds')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('🔴 Supabase connection error:', error.message);
      return { success: false, error: error.message };
    } else {
      console.log('✅ Supabase connection successful');
      return { success: true, data };
    }
  } catch (error) {
    console.error('🔴 Supabase connection failed:', error);
    return { success: false, error: error.message };
  }
};
