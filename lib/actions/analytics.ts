'use server'

import { supabase } from '@/lib/supabase'

export async function getDailyUsage(apiId: string) {
  const { data, error } = await supabase.rpc('daily_usage', {
    api_id_input: apiId,
  })
  if (error) throw new Error(error.message)
  return data || []
}

export async function getDailyRevenue(apiId: string) {
  const { data, error } = await supabase.rpc('daily_revenue', {
    api_id_input: apiId,
  })
  if (error) throw new Error(error.message)
  return data || []
}
