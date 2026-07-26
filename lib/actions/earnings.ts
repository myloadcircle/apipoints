'use server'

import { supabase } from '@/lib/supabase'

export async function getEarnings() {
  const { data, error } = await supabase
    .from('transactions')
    .select('id, api_id, amount, created_at')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}
