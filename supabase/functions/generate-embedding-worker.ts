import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (_req) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const openaiKey = Deno.env.get('OPENAI_KEY')!
  const supabase = createClient(supabaseUrl, supabaseKey)

  const { data: job } = await supabase
    .from('embedding_jobs')
    .select('*')
    .eq('status', 'pending')
    .limit(1)
    .maybeSingle()

  if (!job) {
    return new Response('no jobs')
  }

  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiKey}`
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: job.content_text.substring(0, 8000)
    })
  })

  if (!res.ok) {
    await supabase.from('embedding_jobs').update({ status: 'error' }).eq('id', job.id)
    return new Response('error', { status: 500 })
  }

  const data = await res.json()
  const embedding = data.data[0].embedding as number[]

  await supabase.from('vector_embeddings').insert({
    content_id: job.content_id,
    content_type: job.content_type,
    content_text: job.content_text,
    embedding
  })

  await supabase.from('embedding_jobs').update({ status: 'completed' }).eq('id', job.id)

  return new Response('processed')
})
