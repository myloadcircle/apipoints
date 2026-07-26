'use server'

import { supabase } from '@/lib/supabase'

export async function snapshotUsage() {
  const start = new Date()
  start.setHours(0, 0, 0, 0)

  const { data: apis } = await supabase.from('apis').select('id')

  for (const api of apis || []) {
    const { count } = await supabase
      .from('requests')
      .select('*', { count: 'exact', head: true })
      .eq('api_id', api.id)
      .gte('created_at', start.toISOString())

    await supabase.from('api_usage_snapshots').insert({
      api_id: api.id,
      date: start.toISOString(),
      requests: count || 0,
    })
  }
}

export async function getUsageSnapshots(apiId: string) {
  const { data, error } = await supabase
    .from('api_usage_snapshots')
    .select('*')
    .eq('api_id', apiId)
    .order('date', { ascending: true })

  if (error) throw new Error(error.message)
  return data || []
}
