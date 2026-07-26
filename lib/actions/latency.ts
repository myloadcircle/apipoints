'use server'

import { supabase } from '@/lib/supabase'

export async function logLatency(apiId: string, userId: string, requestId: string, ms: number) {
  const { error } = await supabase
    .from('api_latency')
    .insert({
      api_id: apiId,
      user_id: userId,
      request_id: requestId,
      ms,
    })

  if (error) throw new Error(error.message)
}

export async function listLatency(apiId: string) {
  const { data, error } = await supabase
    .from('api_latency')
    .select('*, users(email)')
    .eq('api_id', apiId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}
