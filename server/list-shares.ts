import { supabase } from '@/lib/supabase'

export async function listShares(requestId: string, userId: string) {
  const { data, error } = await supabase
    .from('api_request_shares')
    .select('*')
    .eq('request_id', requestId)
    .eq('owner_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}