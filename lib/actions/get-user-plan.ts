'use server'

import { supabase } from '@/lib/supabase'

export async function getUserPlan(userId: string, apiId: string) {
  const { data, error } = await supabase
    .from('api_subscriptions')
    .select('plan_id, api_plans(monthly_limit)')
    .eq('user_id', userId)
    .eq('api_id', apiId)
    .single()

  if (error) return null
  return data
}