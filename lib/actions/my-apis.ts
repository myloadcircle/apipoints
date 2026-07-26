'use server'

import { supabase } from '@/lib/supabase'

export async function listMyAPIs(ownerId: string) {
  const { data, error } = await supabase
    .from('apis')
    .select('*')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}
