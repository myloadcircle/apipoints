import { supabase } from '@/lib/supabase'

export async function listMentions(requestId: string) {
  const { data, error } = await supabase
    .from('api_request_mentions')
    .select('*')
    .eq('request_id', requestId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}