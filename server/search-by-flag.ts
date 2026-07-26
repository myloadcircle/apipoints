import { supabase } from '@/lib/supabase'

export async function searchByFlag(userId: string, apiId: string, flag: string) {
  const { data, error } = await supabase
    .from('api_request_flags')
    .select('*, request:request_id(payload, status)')
    .eq('user_id', userId)
    .eq('api_id', apiId)
    .eq('flag', flag)
    .eq('value', true)

  if (error) throw error
  return data
}