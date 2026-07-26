'use server'

import { supabase } from '@/lib/supabase'

export async function getUserRateLimit(userId: string, apiId: string) {
  const { data: sub } = await supabase
    .from('api_subscriptions')
    .select('plan_id, api_plans(monthly_limit)')
    .eq('user_id', userId)
    .eq('api_id', apiId)
    .single()

  if (!sub) return null

  const limit = sub.api_plans?.[0]?.monthly_limit || 0

  const start = new Date()
  start.setDate(1)
  start.setHours(0, 0, 0, 0)

  const { count } = await supabase
    .from('requests')
    .select('*', { count: 'exact', head: true })
    .eq('owner_id', userId)
    .eq('api_id', apiId)
    .gte('created_at', start.toISOString())

  return {
    used: count || 0,
    limit
  }
}

export async function enforceRateLimit(userId: string, apiId: string, requestId: string) {
  const rate = await getUserRateLimit(userId, apiId)
  if (!rate) return

  if (rate.used >= rate.limit) {
    // Import dynamically to avoid circular deps
    const { billForOverage } = await import('./bill-for-overage')
    await billForOverage(userId, apiId, requestId)
  }
}
