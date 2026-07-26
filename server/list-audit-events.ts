import { supabase } from '@/lib/supabase'

export async function listAuditEvents(requestId: string, userId: string) {
  const { data, error } = await supabase
    .from('api_request_audit')
    .select('*')
    .eq('request_id', requestId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}