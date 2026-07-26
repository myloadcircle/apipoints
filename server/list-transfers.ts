import { supabase } from '@/lib/supabase'

export async function listTransfers(requestId: string) {
  const { data, error } = await supabase
    .from('api_request_ownership_transfers')
    .select('*')
    .eq('request_id', requestId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}