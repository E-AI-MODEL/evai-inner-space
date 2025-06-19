
import { supabase } from '@/integrations/supabase/client'

export async function saveSeedFeedback(seedId: string, rating: 'up' | 'down', notes = '') {
  // Haal de huidige gebruiker op om de ID te krijgen.
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    console.error("Kan feedback niet opslaan: geen gebruiker ingelogd.");
    return; // Stop de functie als er geen gebruiker is
  }
  
  await supabase.from('seed_feedback').insert({
    seed_id: seedId,
    rating,
    notes,
    created_at: new Date().toISOString(),
    user_id: user.id, // Voeg user_id toe aan de feedback
  })
}
