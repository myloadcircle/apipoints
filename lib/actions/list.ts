'use server'

import { supabase } from '@/lib/supabase'

export async function listAPIs() {
  const { data, error } = await supabase
    .from('apis')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}
