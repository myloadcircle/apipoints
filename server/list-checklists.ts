import { supabase } from '@/lib/supabase'

export async function listChecklists(requestId: string, userId: string) {
  const { data, error } = await supabase
    .from('api_request_checklists')
    .select('*, items:api_request_checklist_items(*)')
    .eq('request_id', requestId)
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data
}