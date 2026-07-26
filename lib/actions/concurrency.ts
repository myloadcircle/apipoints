'use server'

import { supabase } from '@/lib/supabase'

export async function getActiveRequestCount(userId: string, apiId: string) {
  const { count } = await supabase
    .from('requests')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('api_id', apiId)
    .eq('status', 'processing')

  return count || 0
}

export async function getConcurrencyLimit(userId: string, apiId: string) {
  const { data: sub } = await supabase
    .from('api_subscriptions')
    .select('api_plans(concurrency_limit)')
    .eq('user_id', userId)
    .eq('api_id', apiId)
    .single()

  return sub?.api_plans?.[0]?.concurrency_limit || 1
}

export async function enforceConcurrency(userId: string, apiId: string) {
  const active = await getActiveRequestCount(userId, apiId)
  const limit = await getConcurrencyLimit(userId, apiId)

  if (active >= limit) {
    throw new Error('Concurrency limit exceeded')
  }
}
