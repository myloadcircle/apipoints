'use server'

import { supabase } from '@/lib/supabase'

export async function logAuditEvent(apiId: string, userId: string, action: string, details: any) {
  const { error } = await supabase
    .from('api_audit')
    .insert({
      api_id: apiId,
      user_id: userId,
      action,
      details,
    })

  if (error) throw new Error(error.message)
}

export async function listAuditEvents(apiId: string) {
  const { data, error } = await supabase
    .from('api_audit')
    .select('*, users(email)')
    .eq('api_id', apiId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return data || []
}
