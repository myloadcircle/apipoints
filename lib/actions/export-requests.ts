'use server'

import { supabase } from '@/lib/supabase'

export async function exportRequests(apiId: string, userId: string) {
  const { data, error } = await supabase
    .from('requests')
    .select('*')
    .eq('api_id', apiId)
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)
  return data || []
}
