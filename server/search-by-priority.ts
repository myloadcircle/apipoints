import { supabase } from '@/lib/supabase'

export async function searchByPriority(userId: string, apiId: string, priority: string) {
  const { data, error } = await supabase
    .from('api_request_priority')
    .select('*, request:request_id(payload, status)')
    .eq('user_id', userId)
    .eq('api_id', apiId)
    .eq('priority', priority)

  if (error) throw error
  return data
}