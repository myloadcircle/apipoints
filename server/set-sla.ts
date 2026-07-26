import { supabase } from '@/lib/supabase'

export async function setSLA(userId: string, apiId: string, requestId: string, targetMs: number) {
  const { error } = await supabase
    .from('api_request_sla')
    .insert({
      user_id: userId,
      api_id: apiId,
      request_id: requestId,
      target_ms: targetMs
    })

  if (error) throw error
}