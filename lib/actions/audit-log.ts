'use server'

import { supabase } from '@/lib/supabase'

export async function logAuditEvent(userId: string, apiId: string, requestId: string, action: string, metadata: any = {}) {
  const { error } = await supabase
    .from('api_request_audit')
    .insert({
      user_id: userId,
      api_id: apiId,
      request_id: requestId,
      action,
      metadata,
    })

  if (error) throw new Error(error.message)
}

export async function listAuditEvents(requestId: string, userId: string) {
  const { data, error } = await supabase
    .from('api_request_audit')
    .select('*')
    .eq('request_id', requestId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}
