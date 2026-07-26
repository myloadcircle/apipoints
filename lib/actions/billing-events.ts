'use server'

import { supabase } from '@/lib/supabase'

export async function recordBillingEvent(userId: string, apiId: string, requestId: string, cost: number) {
  const { error } = await supabase
    .from('billing_events')
    .insert({
      user_id: userId,
      api_id: apiId,
      request_id: requestId,
      cost,
    })

  if (error) throw new Error(error.message)
}

export async function listBillingEvents(userId: string) {
  const { data, error } = await supabase
    .from('billing_events')
    .select('*, apis(name), requests(created_at)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}
