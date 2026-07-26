import { supabase } from '@/lib/supabase'

export async function searchOverdue(userId: string, apiId: string) {
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('api_request_deadlines')
    .select('*, request:request_id(payload, status)')
    .eq('user_id', userId)
    .eq('api_id', apiId)
    .lt('deadline', now)

  if (error) throw error
  return data
}