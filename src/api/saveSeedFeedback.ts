import { supabase } from '@/integrations/supabase/client'

export async function saveSeedFeedback(seedId: string, rating: 'up' | 'down', notes = '') {
  await supabase.from('seed_feedback').insert({
    seed_id: seedId,
    rating,
    notes,
    created_at: new Date().toISOString()
  })
}
