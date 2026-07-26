'use server'

import { supabase } from '@/lib/supabase'

export async function searchRequests(apiId: string, userId: string, query: string) {
  const { data, error } = await supabase
    .from('requests')
    .select('*')
    .eq('api_id', apiId)
    .eq('user_id', userId)
    .ilike('payload::text', `%${query}%`)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}
