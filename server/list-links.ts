import { supabase } from '@/lib/supabase'

export async function listLinks(requestId: string, userId: string) {
  const { data, error } = await supabase
    .from('api_request_links')
    .select('*, target:to_request(payload, status)')
    .eq('from_request', requestId)
    .eq('user_id', userId)

  if (error) throw error
  return data
}