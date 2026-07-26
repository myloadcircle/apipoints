import { supabase } from '@/lib/supabase'

export async function setRetryPolicy(userId: string, apiId: string, requestId: string, maxRetries: number, backoffMs: number) {
  const { error } = await supabase
    .from('api_request_retries')
    .insert({
      user_id: userId,
      api_id: apiId,
      request_id: requestId,
      max_retries: maxRetries,
      backoff_ms: backoffMs
    })

  if (error) throw error
}