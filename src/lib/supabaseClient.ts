import { createClient } from '@supabase/supabase-js'

export const SUPABASE_URL = '<YOUR_SUPABASE_URL>'
export const SUPABASE_KEY = '<YOUR_SUPABASE_ANON_KEY>'
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

