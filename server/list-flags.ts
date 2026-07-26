import { supabase } from '@/lib/supabase'

export async function listFlags(requestId: string, userId: string) {
  const { data, error } = await supabase
    .from('api_request_flags')
    .select('*')
    .eq('request_id', requestId)
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data
}