import { supabase } from '@/lib/supabase'

export async function evaluateSLA(requestId: string, userId: string) {
  const { data: req } = await supabase
    .from('requests')
    .select('*')
    .eq('id', requestId)
    .eq('user_id', userId)
    .single()

  const { data: sla } = await supabase
    .from('api_request_sla')
    .select('*')
    .eq('request_id', requestId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)

  if (!sla?.[0]) return null

  const target = sla[0].target_ms
  const actual = req.latency_ms

  return {
    target,
    actual,
    met: actual <= target
  }
}