import { supabase } from '@/lib/supabase'

export async function listGroupItems(groupId: string, userId: string) {
  const { data, error } = await supabase
    .from('api_request_group_items')
    .select('*, request:request_id(payload, status)')
    .eq('group_id', groupId)
    .eq('user_id', userId)

  if (error) throw error
  return data
}