import { supabase } from '@/lib/supabase'

export async function logAuditEvent(userId: string, apiId: string, requestId: string, action: string, metadata: any = {}) {
  const { error } = await supabase
    .from('api_request_audit')
    .insert({
      user_id: userId,
      api_id: apiId,
      request_id: requestId,
      action,
      metadata
    })

  if (error) throw error
}