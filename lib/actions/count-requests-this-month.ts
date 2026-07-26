'use server'

import { supabase } from '@/lib/supabase'

export async function countRequestsThisMonth(userId: string, apiId: string) {
  const start = new Date()
  start.setDate(1)
  start.setHours(0, 0, 0, 0)

  const { count, error } = await supabase
    .from('requests')
    .select('*', { count: 'exact', head: true })
    .eq('owner_id', userId)
    .eq('api_id', apiId)
    .gte('created_at', start.toISOString())

  if (error) throw new Error(error.message)
  return count || 0
}