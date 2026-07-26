'use server'

import { supabase } from '@/lib/supabase'

export async function validateKey(key: string) {
  const { data, error } = await supabase
    .from('api_keys')
    .select('owner_id')
    .eq('key', key)
    .single()

  if (error) return null
  return data.owner_id
}
