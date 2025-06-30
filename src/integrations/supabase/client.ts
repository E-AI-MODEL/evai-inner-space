
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const supabaseUrl = 'https://ngcyfbstajfcfdhlelbz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nY3lmYnN0YWpmY2ZkaGxlbGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkwNjI5NDcsImV4cCI6MjA2NDYzODk0N30.MkZRcC_HGNTZW3hUvFiNmHY5Px9FPvRmnzAiKTWi9e4'

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
