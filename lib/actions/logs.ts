'use server'

import { supabase } from '@/lib/supabase'

export async function getLogs() {
  const { data, error } = await supabase
    .from('requests')
    .select('id, api_id, input, output, created_at')
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) throw new Error(error.message)
  return data || []
}
