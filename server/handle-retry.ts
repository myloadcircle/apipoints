import { supabase } from '@/lib/supabase'

export async function handleRetry(requestId: string, userId: string) {
  const { data: req } = await supabase
    .from('requests')
    .select('*')
    .eq('id', requestId)
    .eq('user_id', userId)
    .single()

  const { data: policy } = await supabase
    .from('api_request_retries')
    .select('*')
    .eq('request_id', requestId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)

  if (!policy?.[0]) return null

  const p = policy[0]

  if (req.retry_count >= p.max_retries) {
    await supabase
      .from('requests')
      .update({ status: 'retry_exhausted' })
      .eq('id', requestId)
    return { exhausted: true }
  }

  const nextRetryAt = new Date(Date.now() + p.backoff_ms).toISOString()

  await supabase
    .from('requests')
    .update({
      retry_count: req.retry_count + 1,
      next_retry_at: nextRetryAt,
      status: 'scheduled_retry'
    })
    .eq('id', requestId)

  return { exhausted: false, nextRetryAt }
}